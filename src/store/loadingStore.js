import { create } from 'zustand'

const useLoadingStore = create((set, get) => ({
  busy: 0,
  start: () => {
    const next = get().busy + 1;
    set({ busy: next });
    if (process.env.NODE_ENV !== 'production') {
      // lightweight debug logging to help track imbalance
       
      console.debug(`[loadingStore] start -> busy=${next} @ ${new Date().toISOString()}`);
      if (next > 5) {
        // warn when counter grows unexpectedly large
         
        console.warn(`[loadingStore] busy counter high: ${next}. Check for missing done() calls.`);
      }
    }
    return next;
  },
  done: () => {
    const next = Math.max(0, get().busy - 1);
    set({ busy: next });
    if (process.env.NODE_ENV !== 'production') {
       
      console.debug(`[loadingStore] done -> busy=${next} @ ${new Date().toISOString()}`);
    }
    return next;
  },
  reset: () => {
    set({ busy: 0 });
    if (process.env.NODE_ENV !== 'production') {
       
      console.debug('[loadingStore] reset -> busy=0');
    }
  },
}));

export default useLoadingStore;
