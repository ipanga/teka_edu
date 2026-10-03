"use client";

import { createContext, useContext, useState, type ReactNode, type SetStateAction } from "react";

type Values = Record<string, unknown>;
const StoreContext = createContext<{
  values: Values;
  update: (key: string, initial: unknown, change: (previous: unknown) => unknown) => void;
} | null>(null);
const IdentityContext = createContext("");

/** Session-owned state survives renderer unmounts during handoff, pause and activity navigation. */
export function ActivityStateProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<Values>({});
  return (
    <StoreContext.Provider
      value={{
        values,
        update: (key, initial, change) =>
          setValues((previous) => ({
            ...previous,
            [key]: change(Object.hasOwn(previous, key) ? previous[key] : initial),
          })),
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function ActivityStateScope({ id, children }: { id: string; children: ReactNode }) {
  return <IdentityContext.Provider value={id}>{children}</IdentityContext.Provider>;
}

/** Fields are private to one activity. Standalone renderers retain ordinary local React state. */
export function useActivityState<T>(
  field: string,
  initial: T,
): [T, (change: SetStateAction<T>) => void] {
  const store = useContext(StoreContext);
  const identity = useContext(IdentityContext);
  const [local, setLocal] = useState(initial);
  const key = JSON.stringify([identity, field]);
  if (store === null) return [local, setLocal];
  // Each field is read/written with the same T by its owning renderer; the shared store is opaque.
  const value = Object.hasOwn(store.values, key) ? (store.values[key] as T) : initial;
  return [
    value,
    (change) =>
      store.update(key, initial, (previous) =>
        typeof change === "function" ? (change as (value: T) => T)(previous as T) : change,
      ),
  ];
}
