import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

// Uses server snapshot during SSR and client value in browser without cascading effect state updates.
export function useClientOnlyValue<S, C>(server: S, client: C): S | C {
  return useSyncExternalStore<S | C>(
    emptySubscribe,
    () => client,
    () => server
  );
}
