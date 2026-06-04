import React, { useEffect } from "react";
import { useNuiEvent } from "./nui/useNuiEvent";
import { fetchNui } from "./nui/fetchNui";
import { isEnvBrowser } from "./nui/misc";
import { useApp } from "./context/AppContext";
import Root from "./pages/Root";
import Resource from "./pages/Resource";
import type { OpenData } from "./types";

const DEBUG_DATA: OpenData = {
  resources: ["ox_core", "pry-pgadapter", "ox_inventory", "ox_doorlock", "ox_lib", "ox_vehicleshop", "ox_target"],
  slowQueries: 13,
  totalQueries: 332,
  totalTime: 230123.456,
  chartData: {
    labels: ["pry-pgadapter", "ox_core", "ox_inventory", "ox_doorlock"],
    data: [
      { queries: 25, time: 133.4 },
      { queries: 5, time: 12.1 },
      { queries: 3, time: 2.9 },
      { queries: 72, time: 133.0 },
    ],
  },
};

const App: React.FC = () => {
  const { visible, page, openUI, closeUI } = useApp();

  useNuiEvent<OpenData>("openUI", openUI);

  useEffect(() => {
    if (!isEnvBrowser()) return;
    const id = setTimeout(() => openUI(DEBUG_DATA), 500);
    return () => clearTimeout(id);
  }, [openUI]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Escape") return;
      closeUI();
      fetchNui("exit");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, closeUI]);

  if (!visible) return null;

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      data-mood="frontier"
      data-type="period"
    >
      <div className="western-border bg-ink-850 flex h-[700px] w-[1200px] text-bone-100 overflow-hidden">
        {page.view === "root" && <Root />}
        {page.view === "resource" && <Resource name={page.name} />}
      </div>
    </div>
  );
};

export default App;
