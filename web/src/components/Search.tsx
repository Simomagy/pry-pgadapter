import React from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

const Search: React.FC<Props> = ({ value, onChange, placeholder, icon }) => (
  <div className="flex items-center gap-2 px-3 h-8 bg-ink-700/60 hairline-soft text-[12px] focus-within:border-gold-500/50 transition-colors">
    {icon}
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-transparent outline-none flex-1 text-bone-100 placeholder:text-bone-200/30"
    />
  </div>
);

export default Search;
