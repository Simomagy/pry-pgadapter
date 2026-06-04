import React, { useEffect } from "react";
import { useNuiEvent } from "../nui/useNuiEvent";
import { isEnvBrowser } from "../nui/misc";
import { useResource } from "../context/ResourceContext";
import ResourceHeader from "../components/ResourceHeader";
import QuerySearch from "../components/QuerySearch";
import QueryTable from "../components/QueryTable";
import Pagination from "../components/Pagination";
import type { ResourceServerData } from "../types";

interface Props {
  name: string;
}

const DEBUG_RESOURCE: ResourceServerData = {
  queries: [
    { query: "SELECT * FROM users WHERE id = 1", executionTime: 3.2345, slow: false, date: Date.now() },
    { query: "SELECT * FROM characters WHERE owner = ? AND active = 1", executionTime: 23.5123, slow: true, date: Date.now() },
    { query: "INSERT INTO logs (resource, action, data, timestamp) VALUES (?, ?, ?, ?)", executionTime: 15.1456, slow: false, date: Date.now() },
    { query: "SELECT * FROM items WHERE owner = ? AND item = ? ORDER BY slot ASC", executionTime: 122.4000, slow: true, date: Date.now() },
    { query: "UPDATE characters SET last_seen = ? WHERE citizenid = ?", executionTime: 8.7200, slow: false, date: Date.now() },
  ],
  resourceQueriesCount: 5,
  resourceSlowQueries: 2,
  resourceTime: 173.012,
  pageCount: 3,
};

const Resource: React.FC<Props> = ({ name }) => {
  const { setQueries, setResourceData, setMaxPage, reset } = useResource();

  useNuiEvent<ResourceServerData>("loadResource", (data) => {
    setMaxPage(data.pageCount);
    setQueries(data.queries);
    setResourceData({
      resourceQueriesCount: data.resourceQueriesCount,
      resourceSlowQueries: data.resourceSlowQueries,
      resourceTime: data.resourceTime,
    });
  });

  useEffect(() => {
    if (!isEnvBrowser()) return;
    const id = setTimeout(() => {
      setMaxPage(DEBUG_RESOURCE.pageCount);
      setQueries(DEBUG_RESOURCE.queries);
      setResourceData({
        resourceQueriesCount: DEBUG_RESOURCE.resourceQueriesCount,
        resourceSlowQueries: DEBUG_RESOURCE.resourceSlowQueries,
        resourceTime: DEBUG_RESOURCE.resourceTime,
      });
    }, 800);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => () => reset(), [reset]);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <ResourceHeader name={name} />
      <QuerySearch />
      <div className="flex-1 overflow-hidden min-h-0">
        <QueryTable resourceName={name} />
      </div>
      <Pagination />
    </div>
  );
};

export default Resource;
