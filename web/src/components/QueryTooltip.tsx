import React, { useState, useRef } from "react";

interface Props {
  content: string;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
}

const QueryTooltip: React.FC<Props> = ({ content, children }) => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    timerRef.current = setTimeout(() => {
      setPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
      setVisible(true);
    }, 300);
  };

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  return (
    <>
      {React.cloneElement(children, { onMouseEnter: show, onMouseLeave: hide })}
      {visible && (
        <div
          className="fixed z-50 px-3 py-2 text-[11px] bg-ink-900 hairline text-bone-100 max-w-lg text-mono pointer-events-none whitespace-pre-wrap break-all"
          style={{
            left: pos.x,
            top: pos.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          {content}
        </div>
      )}
    </>
  );
};

export default QueryTooltip;
