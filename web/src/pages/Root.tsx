import React, { useState, useMemo } from "react";
import { Search as SearchIcon } from "lucide-react";
import { useApp } from "../context/AppContext";
import Search from "../components/Search";
import PieChart from "../components/PieChart";

const Root: React.FC = () => {
  const { resources, generalData, chartData, navigateTo } = useApp();
  const [search, setSearch] = useState("");

  const filteredResources = useMemo(() => {
    if (!search.trim()) return resources;
    const q = search.toLowerCase();
    return resources.filter((r) => r.toLowerCase().includes(q));
  }, [resources, search]);

  return (
    <div className="p-3 w-full h-full flex gap-3 overflow-hidden">
      <div className="flex flex-col flex-1 bg-ink-800/60 hairline-soft overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-gold-500/15 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="block w-1.5 h-1.5 rotate-45 bg-gold-500" />
            <span className="text-display text-lg text-bone-50">Resources</span>
          </div>
          <Search
            value={search}
            onChange={setSearch}
            placeholder="Search resources…"
            icon={<SearchIcon size={13} className="text-bone-200/40" />}
          />
        </div>
        <div className="flex-1 overflow-y-auto rdm-scroll-area px-3 py-3 flex flex-col gap-1.5">
          {filteredResources.map((resource) => (
            <button
              key={resource}
              onClick={() => navigateTo({ view: "resource", name: resource })}
              className="w-full text-left px-3 py-2.5 bg-ink-700/50 hairline-soft text-bone-100 hover:bg-ink-600/60 hover:text-bone-50 transition-colors text-[13px] text-mono flex items-center gap-2 group"
            >
              <span className="block w-1 h-1 rotate-45 bg-gold-500/30 group-hover:bg-gold-500/70 transition-colors shrink-0" />
              {resource}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col w-72 shrink-0 gap-3">
        <div className="bg-ink-800/60 hairline-soft p-4 flex flex-col gap-3 shrink-0">
          <div className="flex items-center gap-2 border-b border-gold-500/15 pb-3">
            <span className="block w-1.5 h-1.5 rotate-45 bg-gold-500" />
            <span className="text-display text-lg text-bone-50">General</span>
          </div>
          <div className="flex flex-col gap-2 text-[13px]">
            <div className="flex justify-between items-center">
              <span className="text-bone-200/60">Total queries</span>
              <span className="text-mono text-bone-100">{generalData.queries}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-bone-200/60">Time querying</span>
              <span className="text-mono text-bone-100">{generalData.timeQuerying.toFixed(2)} ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gold-400/80">Slow queries</span>
              <span className="text-mono text-gold-400">{generalData.slowQueries}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-ink-800/60 hairline-soft p-4 flex flex-col gap-3 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-gold-500/15 pb-3 shrink-0">
            <span className="block w-1.5 h-1.5 rotate-45 bg-gold-500" />
            <span className="text-display text-lg text-bone-50">Distribution</span>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <PieChart data={chartData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Root;
