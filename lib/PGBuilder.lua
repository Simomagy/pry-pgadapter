-- ============================================================
-- PGBuilder — Fluent query builder for pry-pgadapter
-- ============================================================
-- Include in your resource manifest:
--   shared_script '@pry-pgadapter/lib/PGBuilder.lua'
--
-- Quick reference:
--   PG.from('t'):where({col=val}):find()
--   PG.from('t'):where({col={gte=n}}):first()
--   PG.from('t'):where({col={in_={a,b}}}):count()
--   PG.from('t'):where({col={json_contains={key=v}}}):find()
--   PG.from('t'):whereJsonField('data','amount',{gte=50},'integer'):find()
--   PG.from('t'):insert({col=val, data={a=1}})   -- table auto-encoded to JSON
--   PG.from('t'):where({id=1}):update({col=val})
--   PG.from('t'):where({id=1}):delete()
--   PG.createJsonIndex('table', 'col')
-- ============================================================

-- ============================================================
-- SQL operator map
-- ============================================================

local OPERATORS = {
    gt    = '>',
    gte   = '>=',
    lt    = '<',
    lte   = '<=',
    ne    = '!=',
    like  = 'LIKE',
    ilike = 'ILIKE',
    -- in_ / not_in / is_null / json_contains / json_has_key → special cases
}

-- ============================================================
-- Helpers
-- ============================================================

--- Serializes Lua tables to JSON strings; passes scalars through unchanged.
--- Applied to all values before they become SQL parameters.
local function encodeValue(v)
    if type(v) == 'table' then
        return json.encode(v)
    end
    return v
end

--- Builds the conditions string (no 'WHERE' prefix) and a flat values array.
--- Accepts the standard operator table plus JSONB operators:
---   json_contains  → col @> ?::jsonb      (containment)
---   json_has_key   → jsonb_exists(col, ?) (key existence — avoids ? operator conflict)
local function buildWhere(conditions)
    if not conditions or not next(conditions) then
        return '', {}
    end

    local clauses = {}
    local values  = {}

    for col, val in pairs(conditions) do
        local q = '"' .. col .. '"'

        if type(val) ~= 'table' then
            clauses[#clauses + 1] = q .. ' = ?'
            values[#values + 1]   = encodeValue(val)
        else
            for op, opval in pairs(val) do
                if op == 'is_null' then
                    clauses[#clauses + 1] = q .. (opval and ' IS NULL' or ' IS NOT NULL')

                elseif op == 'in_' or op == 'not_in' then
                    assert(
                        type(opval) == 'table' and #opval > 0,
                        ('[PGBuilder] %s on "%s" requires a non-empty array'):format(op, col)
                    )
                    local ph = {}
                    for _, v in ipairs(opval) do
                        ph[#ph + 1]         = '?'
                        values[#values + 1] = encodeValue(v)
                    end
                    local keyword = op == 'not_in' and 'NOT IN' or 'IN'
                    clauses[#clauses + 1] = q .. ' ' .. keyword .. ' (' .. table.concat(ph, ', ') .. ')'

                elseif op == 'json_contains' then
                    -- JSONB containment: col @> '{"key":"val"}'::jsonb
                    clauses[#clauses + 1] = q .. ' @> ?::jsonb'
                    values[#values + 1]   = json.encode(opval)

                elseif op == 'json_has_key' then
                    -- Key existence: jsonb_exists(col, 'key')
                    -- NOTE: PostgreSQL's native ? operator is converted by the adapter;
                    --       jsonb_exists() is the safe equivalent.
                    clauses[#clauses + 1] = 'jsonb_exists(' .. q .. ', ?)'
                    values[#values + 1]   = tostring(opval)

                else
                    local sqlOp = OPERATORS[op]
                    assert(sqlOp, ('[PGBuilder] Unknown operator: "%s"'):format(tostring(op)))
                    clauses[#clauses + 1] = q .. ' ' .. sqlOp .. ' ?'
                    values[#values + 1]   = encodeValue(opval)
                end
            end
        end
    end

    if #clauses == 0 then return '', {} end
    return table.concat(clauses, ' AND '), values
end

--- Appends WHERE to `sql`, merging standard conditions and pre-built JSONB clauses.
local function appendWhere(sql, vals, conditions, jsonClauses)
    local allClauses = {}
    local allVals    = {}
    for _, v in ipairs(vals) do allVals[#allVals + 1] = v end

    if conditions then
        local clause, wvals = buildWhere(conditions)
        if clause ~= '' then
            allClauses[#allClauses + 1] = clause
            for _, v in ipairs(wvals) do allVals[#allVals + 1] = v end
        end
    end

    for _, jc in ipairs(jsonClauses or {}) do
        allClauses[#allClauses + 1] = jc[1]
        for _, v in ipairs(jc[2]) do allVals[#allVals + 1] = v end
    end

    if #allClauses == 0 then return sql, allVals end
    return sql .. ' WHERE ' .. table.concat(allClauses, ' AND '), allVals
end

-- ============================================================
-- QueryBuilder class
-- ============================================================

local QB   = {}
QB.__index = QB

--- Entry point. Returns a new builder for `table_name`.
function PG.from(table_name)
    assert(
        type(table_name) == 'string' and #table_name > 0,
        '[PGBuilder] table_name must be a non-empty string'
    )
    return setmetatable({
        _table       = table_name,
        _cols        = nil,
        _where       = nil,
        _jsonClauses = {},
        _order       = nil,
        _limit       = nil,
        _offset      = nil,
    }, QB)
end

-- ============================================================
-- Builder methods — all return self for chaining
-- ============================================================

--- Columns to SELECT (varargs). Default: *.
function QB:select(...)
    self._cols = { ... }
    return self
end

--- Standard WHERE conditions.
--- Keys are column names; values are scalars or operator tables.
--- Supported operators: gt gte lt lte ne like ilike in_ not_in is_null
---                      json_contains json_has_key
function QB:where(conditions)
    self._where = conditions
    return self
end

--- JSONB field extraction filter.
--- Generates: ("col"->>'field')[::cast] op ?
---
--- @param col        string  Column name (JSONB type)
--- @param field      string  JSON key to extract
--- @param condition  any     Scalar (equality) or operator table {gte=n, ...}
--- @param cast       string? Optional PostgreSQL cast: 'integer','numeric','boolean', etc.
function QB:whereJsonField(col, field, condition, cast)
    assert(type(col)   == 'string', '[PGBuilder] whereJsonField: col must be a string')
    assert(type(field) == 'string', '[PGBuilder] whereJsonField: field must be a string')

    -- Build the left-hand side expression
    local lhs
    if cast then
        lhs = ('("%s"->>\'%s\')::%s'):format(col, field, cast)
    else
        lhs = ('"%s"->>\'%s\''):format(col, field)
    end

    local clause
    local vals = {}

    if type(condition) ~= 'table' then
        clause = lhs .. ' = ?'
        vals[1] = encodeValue(condition)
    else
        local parts = {}
        for op, opval in pairs(condition) do
            local sqlOp = OPERATORS[op]
            assert(sqlOp, ('[PGBuilder] whereJsonField: unknown operator "%s"'):format(tostring(op)))
            parts[#parts + 1] = lhs .. ' ' .. sqlOp .. ' ?'
            vals[#vals + 1]   = encodeValue(opval)
        end
        clause = table.concat(parts, ' AND ')
    end

    self._jsonClauses[#self._jsonClauses + 1] = { clause, vals }
    return self
end

--- ORDER BY col [ASC|DESC].
function QB:orderBy(col, dir)
    self._order = { col, (dir or 'ASC'):upper() }
    return self
end

--- LIMIT n (positive integer).
function QB:limit(n)
    assert(
        type(n) == 'number' and n > 0 and math.type(n) == 'integer',
        '[PGBuilder] limit must be a positive integer'
    )
    self._limit = n
    return self
end

--- OFFSET n (non-negative integer).
function QB:offset(n)
    assert(
        type(n) == 'number' and n >= 0 and math.type(n) == 'integer',
        '[PGBuilder] offset must be a non-negative integer'
    )
    self._offset = n
    return self
end

-- ============================================================
-- Internal: assemble SELECT SQL
-- ============================================================

function QB:_buildSelect()
    local cols = self._cols and table.concat(self._cols, ', ') or '*'
    local sql   = 'SELECT ' .. cols .. ' FROM "' .. self._table .. '"'
    local vals  = {}

    sql, vals = appendWhere(sql, vals, self._where, self._jsonClauses)

    if self._order then
        sql = sql .. ' ORDER BY "' .. self._order[1] .. '" ' .. self._order[2]
    end
    -- LIMIT and OFFSET are developer-controlled integers: safe to interpolate directly.
    if self._limit  then sql = sql .. ' LIMIT '  .. self._limit  end
    if self._offset then sql = sql .. ' OFFSET ' .. self._offset end

    return sql, vals
end

-- ============================================================
-- Terminal methods
-- All accept an optional callback:
--   cb absent  → sync  (blocks current coroutine, returns result)
--   cb present → async (non-blocking, result delivered to cb)
-- ============================================================

--- SELECT → array of rows.
function QB:find(cb)
    local sql, vals = self:_buildSelect()
    if cb then
        PG.query(sql, vals, cb)
    else
        return PG.query.await(sql, vals)
    end
end

--- SELECT LIMIT 1 → single row or nil.
function QB:first(cb)
    self._limit = 1
    local sql, vals = self:_buildSelect()
    if cb then
        PG.single(sql, vals, cb)
    else
        return PG.single.await(sql, vals)
    end
end

--- SELECT COUNT(*) → number.
function QB:count(cb)
    local sql  = 'SELECT COUNT(*) FROM "' .. self._table .. '"'
    local vals = {}
    sql, vals  = appendWhere(sql, vals, self._where, self._jsonClauses)
    if cb then
        PG.scalar(sql, vals, cb)
    else
        return PG.scalar.await(sql, vals)
    end
end

--- INSERT data → inserted id.
--- Lua tables in `data` values are automatically serialized to JSON strings.
function QB:insert(data, cb)
    assert(
        type(data) == 'table' and next(data),
        '[PGBuilder] insert requires a non-empty data table'
    )
    local cols, phs, vals = {}, {}, {}
    for col, val in pairs(data) do
        cols[#cols + 1] = '"' .. col .. '"'
        phs[#phs + 1]   = '?'
        vals[#vals + 1] = encodeValue(val)
    end
    local sql = ('INSERT INTO "%s" (%s) VALUES (%s)'):format(
        self._table,
        table.concat(cols, ', '),
        table.concat(phs,  ', ')
    )
    if cb then
        PG.insert(sql, vals, cb)
    else
        return PG.insert.await(sql, vals)
    end
end

--- UPDATE data [WHERE] → affectedRows.
--- Lua tables in `data` values are automatically serialized to JSON strings.
function QB:update(data, cb)
    assert(
        type(data) == 'table' and next(data),
        '[PGBuilder] update requires a non-empty data table'
    )
    local sets, vals = {}, {}
    for col, val in pairs(data) do
        sets[#sets + 1] = '"' .. col .. '" = ?'
        vals[#vals + 1] = encodeValue(val)
    end
    local sql = ('UPDATE "%s" SET %s'):format(self._table, table.concat(sets, ', '))
    sql, vals = appendWhere(sql, vals, self._where, self._jsonClauses)
    if cb then
        PG.update(sql, vals, cb)
    else
        return PG.update.await(sql, vals)
    end
end

--- DELETE [WHERE] → affectedRows.
function QB:delete(cb)
    local sql  = 'DELETE FROM "' .. self._table .. '"'
    local vals = {}
    sql, vals  = appendWhere(sql, vals, self._where, self._jsonClauses)
    if cb then
        PG.update(sql, vals, cb)
    else
        return PG.update.await(sql, vals)
    end
end

-- ============================================================
-- JSONB utilities
-- ============================================================

--- Creates a GIN index on a JSONB column.
--- A GIN index accelerates @>, ?, ?|, ?& and jsonpath operators.
---
--- @param table_name  string  Target table
--- @param col         string  JSONB column
--- @param index_name  string? Optional custom index name
function PG.createJsonIndex(table_name, col, index_name)
    assert(type(table_name) == 'string' and #table_name > 0, '[PGBuilder] createJsonIndex: invalid table_name')
    assert(type(col) == 'string' and #col > 0,               '[PGBuilder] createJsonIndex: invalid col')

    index_name = index_name or ('idx_' .. table_name .. '_' .. col .. '_gin')

    PG.query.await(
        ('CREATE INDEX IF NOT EXISTS %s ON "%s" USING GIN ("%s")'):format(
            index_name, table_name, col
        )
    )
end

--- Creates a B-tree index on a JSONB field extraction expression.
--- Useful for equality/range queries on a specific JSON key.
---
--- Example: PG.createJsonFieldIndex('players', 'data', 'level', 'integer')
--- → CREATE INDEX ... ON "players" (("data"->>'level')::integer)
---
--- @param table_name  string  Target table
--- @param col         string  JSONB column
--- @param field       string  JSON key
--- @param cast        string? Optional cast type (e.g. 'integer', 'numeric')
--- @param index_name  string? Optional custom index name
function PG.createJsonFieldIndex(table_name, col, field, cast, index_name)
    assert(type(table_name) == 'string' and #table_name > 0, '[PGBuilder] createJsonFieldIndex: invalid table_name')
    assert(type(col)        == 'string' and #col > 0,        '[PGBuilder] createJsonFieldIndex: invalid col')
    assert(type(field)      == 'string' and #field > 0,      '[PGBuilder] createJsonFieldIndex: invalid field')

    index_name = index_name or ('idx_' .. table_name .. '_' .. col .. '_' .. field)

    local expr
    if cast then
        expr = ('(("%s"->>\'%s\')::%s)'):format(col, field, cast)
    else
        expr = ('("%s"->>\'%s\')'):format(col, field)
    end

    PG.query.await(
        ('CREATE INDEX IF NOT EXISTS %s ON "%s" (%s)'):format(
            index_name, table_name, expr
        )
    )
end
