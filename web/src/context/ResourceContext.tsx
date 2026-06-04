import React, { createContext, useContext, useState, useCallback } from "react";
import type { QueryData, ResourceStats, FilterData } from "../types";

interface ResourceContextValue {
  queries: QueryData[];
  resourceData: ResourceStats;
  filterData: FilterData;
  maxPage: number;
  setQueries: (q: QueryData[]) => void;
  setResourceData: (d: ResourceStats) => void;
  setFilterData: (f: FilterData | ((prev: FilterData) => FilterData)) => void;
  setMaxPage: (n: number) => void;
  reset: () => void;
}

const DEFAULT_RESOURCE_DATA: ResourceStats = {
  resourceQueriesCount: 0,
  resourceSlowQueries: 0,
  resourceTime: 0,
};

const DEFAULT_FILTER: FilterData = { search: "", page: 0 };

const ResourceCtx = createContext<ResourceContextValue | null>(null);

export const ResourceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queries, setQueries] = useState<QueryData[]>([]);
  const [resourceData, setResourceData] = useState<ResourceStats>(DEFAULT_RESOURCE_DATA);
  const [filterData, setFilterData] = useState<FilterData>(DEFAULT_FILTER);
  const [maxPage, setMaxPage] = useState(0);

  const reset = useCallback(() => {
    setQueries([]);
    setResourceData(DEFAULT_RESOURCE_DATA);
    setFilterData(DEFAULT_FILTER);
    setMaxPage(0);
  }, []);

  return (
    <ResourceCtx.Provider value={{ queries, resourceData, filterData, maxPage, setQueries, setResourceData, setFilterData, setMaxPage, reset }}>
      {children}
    </ResourceCtx.Provider>
  );
};

export const useResource = (): ResourceContextValue => {
  const ctx = useContext(ResourceCtx);
  if (!ctx) throw new Error("useResource must be inside ResourceProvider");
  return ctx;
};
