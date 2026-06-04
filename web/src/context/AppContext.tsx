import React, { createContext, useContext, useState, useCallback } from "react";
import type { GeneralData, ChartData, Page, OpenData } from "../types";

interface AppContextValue {
  visible: boolean;
  page: Page;
  resources: string[];
  generalData: GeneralData;
  chartData: ChartData;
  openUI: (data: OpenData) => void;
  closeUI: () => void;
  navigateTo: (page: Page) => void;
}

const DEFAULT_GENERAL: GeneralData = { queries: 0, slowQueries: 0, timeQuerying: 0 };
const DEFAULT_CHART: ChartData = { labels: [], data: [] };

const AppCtx = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [page, setPage] = useState<Page>({ view: "root" });
  const [resources, setResources] = useState<string[]>([]);
  const [generalData, setGeneralData] = useState<GeneralData>(DEFAULT_GENERAL);
  const [chartData, setChartData] = useState<ChartData>(DEFAULT_CHART);

  const openUI = useCallback((data: OpenData) => {
    setVisible(true);
    setPage({ view: "root" });
    setResources(data.resources);
    setGeneralData({
      queries: data.totalQueries,
      slowQueries: data.slowQueries,
      timeQuerying: data.totalTime,
    });
    setChartData(data.chartData);
  }, []);

  const closeUI = useCallback(() => setVisible(false), []);

  const navigateTo = useCallback((p: Page) => setPage(p), []);

  return (
    <AppCtx.Provider value={{ visible, page, resources, generalData, chartData, openUI, closeUI, navigateTo }}>
      {children}
    </AppCtx.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
};
