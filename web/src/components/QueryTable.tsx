import React, { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { useResource } from "../context/ResourceContext";
import { fetchNui } from "../nui/fetchNui";
import QueryTooltip from "./QueryTooltip";

type SortDir = "asc" | "desc" | null;

interface SortState {
  id: "query" | "executionTime";
  dir: SortDir;
}

interface Props {
  resourceName: string;
}

const SortIndicator: React.FC<{ active: boolean; dir: SortDir }> = ({ active, dir }) => {
  if (!active || dir === null) return <ChevronsUpDown size={11} className="text-bone-200/30" />;
  return dir === "asc"
    ? <ChevronUp size={11} className="text-gold-400" />
    : <ChevronDown size={11} className="text-gold-400" />;
};

const QueryTable: React.FC<Props> = ({ resourceName }) => {
  const { queries, filterData } = useResource();
  const [sort, setSort] = useState<SortState>({ id: "executionTime", dir: null });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fetchNui("fetchResource", {
        resource: resourceName,
        pageIndex: filterData.page,
        search: filterData.search,
        sortBy: sort.dir ? [{ id: sort.id, desc: sort.dir === "desc" }] : [],
      });
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resourceName, filterData.page, filterData.search, sort]);

  const toggleSort = (id: SortState["id"]) => {
    setSort((prev) => {
      if (prev.id !== id) return { id, dir: "asc" };
      if (prev.dir === "asc") return { id, dir: "desc" };
      if (prev.dir === "desc") return { id, dir: null };
      return { id, dir: "asc" };
    });
  };

  return (
    <div className="h-full overflow-y-auto rdm-scroll-area">
      <table className="w-full text-[12px] border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="bg-ink-900/95">
            <th className="w-3/4 text-left p-0">
              <button
                onClick={() => toggleSort("query")}
                className="flex items-center gap-1.5 px-4 py-2.5 text-bone-200/50 hover:text-bone-100 transition-colors w-full text-serif-sc text-[10px] tracking-widest"
              >
                Query
                <SortIndicator active={sort.id === "query"} dir={sort.id === "query" ? sort.dir : null} />
              </button>
            </th>
            <th className="w-1/4 text-center p-0">
              <button
                onClick={() => toggleSort("executionTime")}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-bone-200/50 hover:text-bone-100 transition-colors w-full text-serif-sc text-[10px] tracking-widest"
              >
                Time (ms)
                <SortIndicator active={sort.id === "executionTime"} dir={sort.id === "executionTime" ? sort.dir : null} />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {queries.map((row, i) => (
            <tr
              key={i}
              className="border-t border-gold-500/5 hover:bg-ink-700/30 transition-colors"
            >
              <td className="px-4 py-2 max-w-0">
                <QueryTooltip content={row.query}>
                  <p
                    className={`truncate text-mono text-[11px] ${
                      row.slow ? "text-gold-400" : "text-bone-100"
                    }`}
                  >
                    {row.query}
                  </p>
                </QueryTooltip>
              </td>
              <td
                className={`px-4 py-2 text-center text-mono ${
                  row.slow ? "text-gold-400" : "text-bone-200/60"
                }`}
              >
                {row.executionTime.toFixed(4)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QueryTable;
