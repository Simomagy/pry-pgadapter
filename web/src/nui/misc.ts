export const isEnvBrowser = (): boolean => !(window as any).invokeNative;
export const noop = () => {};

if (import.meta.env.DEV) {
  (window as any).__nui = (action: string, data: unknown) =>
    window.dispatchEvent(new MessageEvent("message", { data: { action, data } }));
}
