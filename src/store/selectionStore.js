import { create } from 'zustand'

// Simple selection store for table rows. Stores a Set of selected ids.
export const useSelectionStore = create((set) => ({
  selected: new Set(),
  toggle: (id) => set((state) => {
    const next = new Set(state.selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return { selected: next }
  }),
  selectAll: (ids = []) => set(() => ({ selected: new Set(ids) })),
  clear: () => set(() => ({ selected: new Set() })),
  replace: (ids = []) => set(() => ({ selected: new Set(ids) })),
}))

export default useSelectionStore
