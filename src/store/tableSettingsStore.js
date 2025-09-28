import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Global table settings store that persists to localStorage
// Can be used across different table/page components

const defaultTableSettings = {
  sortConfig: { key: null, direction: 'asc' },
  filters: {},
  columnVisibility: {},
  layout: {
    density: 'standard', // 'compact', 'standard', 'comfortable'
    rowsPerPage: 25,
    expandedRows: false,
    showActions: true,
    stickyHeader: false
  },
  preferences: {
    autoRefresh: false,
    refreshInterval: 30000, // ms
    showNotifications: true,
    confirmDelete: true
  }
}

const useTableSettingsStore = create(
  persist(
    (set, get) => ({
      // Store settings by table/page identifier
      tables: {},
      
      // Get settings for a specific table
      getTableSettings: (tableId) => {
        const state = get()
        return state.tables[tableId] || { ...defaultTableSettings }
      },
      
      // Update settings for a specific table
      updateTableSettings: (tableId, settings) => {
        set((state) => ({
          tables: {
            ...state.tables,
            [tableId]: {
              ...state.tables[tableId],
              ...settings
            }
          }
        }))
      },
      
      // Update specific setting category for a table
      updateSortConfig: (tableId, sortConfig) => {
        set((state) => ({
          tables: {
            ...state.tables,
            [tableId]: {
              ...state.tables[tableId],
              sortConfig
            }
          }
        }))
      },
      
      updateFilters: (tableId, filters) => {
        set((state) => ({
          tables: {
            ...state.tables,
            [tableId]: {
              ...state.tables[tableId],
              filters
            }
          }
        }))
      },
      
      updateColumnVisibility: (tableId, columnVisibility) => {
        set((state) => ({
          tables: {
            ...state.tables,
            [tableId]: {
              ...state.tables[tableId],
              columnVisibility
            }
          }
        }))
      },
      
      updateLayout: (tableId, layout) => {
        set((state) => ({
          tables: {
            ...state.tables,
            [tableId]: {
              ...state.tables[tableId],
              layout: {
                ...state.tables[tableId]?.layout,
                ...layout
              }
            }
          }
        }))
      },
      
      updatePreferences: (tableId, preferences) => {
        set((state) => ({
          tables: {
            ...state.tables,
            [tableId]: {
              ...state.tables[tableId],
              preferences: {
                ...state.tables[tableId]?.preferences,
                ...preferences
              }
            }
          }
        }))
      },
      
      // Reset settings for a table to default
      resetTableSettings: (tableId) => {
        set((state) => ({
          tables: {
            ...state.tables,
            [tableId]: { ...defaultTableSettings }
          }
        }))
      },
      
      // Copy settings from one table to another
      copyTableSettings: (fromTableId, toTableId) => {
        const state = get()
        const fromSettings = state.tables[fromTableId]
        if (fromSettings) {
          set((state) => ({
            tables: {
              ...state.tables,
              [toTableId]: { ...fromSettings }
            }
          }))
        }
      },
      
      // Export settings for a table (for sharing/backup)
      exportTableSettings: (tableId) => {
        const state = get()
        return state.tables[tableId] || null
      },
      
      // Import settings for a table
      importTableSettings: (tableId, settings) => {
        set((state) => ({
          tables: {
            ...state.tables,
            [tableId]: {
              ...defaultTableSettings,
              ...settings
            }
          }
        }))
      },
      
      // Get all table IDs that have settings
      getAllTableIds: () => {
        const state = get()
        return Object.keys(state.tables)
      },
      
      // Clear all settings
      clearAllSettings: () => {
        set({ tables: {} })
      }
    }),
    {
      name: 'table-settings-storage',
      partialize: (state) => ({ tables: state.tables }),
    }
  )
)

export default useTableSettingsStore

// Utility hook for specific table
export const useTableSettings = (tableId) => {
  const store = useTableSettingsStore()
  
  const settings = store.getTableSettings(tableId)
  
  const updateSettings = (newSettings) => {
    store.updateTableSettings(tableId, newSettings)
  }
  
  const updateSort = (sortConfig) => {
    store.updateSortConfig(tableId, sortConfig)
  }
  
  const updateFilters = (filters) => {
    store.updateFilters(tableId, filters)
  }
  
  const updateColumns = (columnVisibility) => {
    store.updateColumnVisibility(tableId, columnVisibility)
  }
  
  const updateLayout = (layout) => {
    store.updateLayout(tableId, layout)
  }
  
  const updatePreferences = (preferences) => {
    store.updatePreferences(tableId, preferences)
  }
  
  const resetSettings = () => {
    store.resetTableSettings(tableId)
  }
  
  return {
    settings,
    updateSettings,
    updateSort,
    updateFilters,
    updateColumns,
    updateLayout,
    updatePreferences,
    resetSettings,
    sortConfig: settings.sortConfig,
    filters: settings.filters,
    columnVisibility: settings.columnVisibility,
    layout: settings.layout,
    preferences: settings.preferences
  }
}