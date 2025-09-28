// Loading store disabled — no-op implementation
// Purpose: keep existing calls to useLoadingStore.getState().start()/done() safe
// without showing any global overlay or maintaining a counter.
const _state = {
  busy: 0,
};

function _start() { return 0; }
function _done() { return 0; }
function _reset() { return 0; }

// expose the legacy zustand-like API so calls like useLoadingStore.getState().start()
// continue to work in the codebase.
const useLoadingStore = {
  getState: () => ({ busy: 0, start: _start, done: _done, reset: _reset }),
  start: _start,
  done: _done,
  reset: _reset,
  subscribe: () => { return () => {}; },
};

export default useLoadingStore;
