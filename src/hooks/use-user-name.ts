import { useCallback, useSyncExternalStore } from "react";

const KEY = "tournament-user-name";
const listeners = new Set<() => void>();
let cached = "";

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): string {
  const stored = localStorage.getItem(KEY) ?? "";
  if (stored !== cached) cached = stored;
  return cached;
}

export function useUserName() {
  const name = useSyncExternalStore(subscribe, getSnapshot, () => "");

  const saveName = useCallback((value: string) => {
    localStorage.setItem(KEY, value.trim().slice(0, 40));
    listeners.forEach((l) => l());
  }, []);

  const clearName = useCallback(() => {
    localStorage.removeItem(KEY);
    cached = "";
    listeners.forEach((l) => l());
  }, []);

  return { name, saveName, clearName };
}
