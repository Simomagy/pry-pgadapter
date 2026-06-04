export interface QueryData {
  date: number;
  query: string;
  executionTime: number;
  slow?: boolean;
}

export interface GeneralData {
  queries: number;
  slowQueries: number;
  timeQuerying: number;
}

export interface ChartData {
  labels: string[];
  data: { queries: number; time: number }[];
}

export interface OpenData {
  resources: string[];
  totalQueries: number;
  slowQueries: number;
  totalTime: number;
  chartData: ChartData;
}

export interface ResourceServerData {
  queries: QueryData[];
  pageCount: number;
  resourceQueriesCount: number;
  resourceSlowQueries: number;
  resourceTime: number;
}

export interface ResourceStats {
  resourceQueriesCount: number;
  resourceSlowQueries: number;
  resourceTime: number;
}

export interface FilterData {
  search: string;
  page: number;
}

export type Page =
  | { view: "root" }
  | { view: "resource"; name: string };
