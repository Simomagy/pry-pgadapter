import React from "react";
import { Search } from "lucide-react";
import { useResource } from "../context/ResourceContext";

const QuerySearch: React.FC = () => {
  const { filterData, setFilterData } = useResource();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterData((prev) => ({ ...prev, search: e.target.value, page: 0 }));
  };

  return (
    <div className="px-4 py-3 border-b border-gold-500/10 shrink-0">
      <div className="flex items-center gap-2 px-3 h-8 bg-ink-700/60 hairline-soft text-[12px] focus-within:border-gold-500/50 transition-colors">
        <Search size={13} className="text-bone-200/40 shrink-0" />
        <input
          type="text"
          value={filterData.search}
          onChange={handleChange}
          placeholder="Search queries…"
          className="bg-transparent outline-none flex-1 text-bone-100 placeholder:text-bone-200/30"
        />
      </div>
    </div>
  );
};

export default QuerySearch;
