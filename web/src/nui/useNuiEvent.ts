import { useRef, useEffect } from "react";
import { noop } from "./misc";

export function useNuiEvent<T = unknown>(
  action: string,
  handler: (data: T) => void,
): void {
  const savedHandler = useRef<(data: T) => void>(noop);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const listener = (event: MessageEvent<{ action: string; data: T }>) => {
      if (event.data?.action === action) {
        savedHandler.current(event.data.data);
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [action]);
}
