import { useState } from 'react';

export function useRouteDisclosure(routeKey) {
  const [state, setState] = useState({ key: routeKey, open: false });
  const open = state.key === routeKey && state.open;
  const setOpen = value => setState(previous => ({ key: routeKey,
    open: typeof value === 'function' ? value(previous.key === routeKey && previous.open) : value }));
  return [open, setOpen];
}
