import React from "react";
import { ChevronLeft } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useResource } from "../context/ResourceContext";

interface Props {
  name: string;
}

const ResourceHeader: React.FC<Props> = ({ name }) => {
  const { navigateTo } = useApp();
  const { resourceData } = useResource();

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gold-500/15 shrink-0">
      <button
        onClick={() => navigateTo({ view: "root" })}
        className="flex items-center justify-center w-8 h-8 bg-ink-700/60 hairline-soft text-bone-200/60 hover:text-bone-50 hover:bg-ink-600/70 transition-colors"
      >
        <ChevronLeft size={15} />
      </button>

      <span className="text-display text-lg text-bone-50">{name}</span>

      <div className="text-right text-[11px] text-mono flex flex-col gap-0.5">
        <span className="text-bone-200/55">
          <span className="text-bone-100">{resourceData.resourceQueriesCount}</span> queries
        </span>
        <span className="text-bone-200/55">
          <span className="text-bone-100">{resourceData.resourceTime.toFixed(2)}</span> ms
        </span>
        <span className="text-gold-400">
          {resourceData.resourceSlowQueries} slow
        </span>
      </div>
    </div>
  );
};

export default ResourceHeader;
