import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useResource } from "../context/ResourceContext";

const BTN =
  "flex items-center justify-center w-8 h-8 bg-ink-700/60 hairline-soft text-bone-200/60 hover:text-bone-50 hover:bg-ink-600/70 disabled:opacity-25 disabled:cursor-not-allowed transition-colors";

const Pagination: React.FC = () => {
  const { filterData, maxPage, setFilterData } = useResource();
  const { page } = filterData;

  const setPage = (p: number) =>
    setFilterData((prev) => ({ ...prev, page: p }));

  return (
    <div className="flex items-center justify-center gap-3 py-4 border-t border-gold-500/10 shrink-0">
      <button
        disabled={page === 0}
        onClick={() => setPage(0)}
        className={BTN}
      >
        <ChevronsLeft size={14} />
      </button>
      <button
        disabled={page === 0}
        onClick={() => setPage(page - 1)}
        className={BTN}
      >
        <ChevronLeft size={14} />
      </button>

      <span className="text-[12px] text-bone-200/55 text-mono min-w-[64px] text-center">
        {page + 1} / {maxPage}
      </span>

      <button
        disabled={page >= maxPage - 1}
        onClick={() => setPage(page + 1)}
        className={BTN}
      >
        <ChevronRight size={14} />
      </button>
      <button
        disabled={page >= maxPage - 1}
        onClick={() => setPage(maxPage - 1)}
        className={BTN}
      >
        <ChevronsRight size={14} />
      </button>
    </div>
  );
};

export default Pagination;
