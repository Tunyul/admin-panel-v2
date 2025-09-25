import { useState, useEffect, useMemo } from 'react'
import useTableSettingsStore from '../store/tableSettingsStore'

// Default column configurations for different tables
export const TABLE_COLUMN_CONFIGS = {
  orders: [
    { key: 'id', label: 'ID Orders', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'orderNo', label: 'No Transaksi', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'idCustomer', label: 'ID Customer', sortable: true, defaultVisible: true, align: 'left' },
  { key: 'customerPhone', label: 'No HP', sortable: true, defaultVisible: true, align: 'left' },
  { key: 'customerName', label: 'Nama Customer', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'date', label: 'Tanggal Order', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'statusUrgensi', label: 'Urgensi', sortable: true, defaultVisible: true, align: 'left' },
  { key: 'status', label: 'Status Pesanan', sortable: true, defaultVisible: true, align: 'left' },
  { key: 'statusOrder', label: 'Status WA Order', sortable: true, defaultVisible: false, align: 'left' },
  { key: 'statusBot', label: 'Status Bot', sortable: true, defaultVisible: false, align: 'left' },
    { key: 'statusBayar', label: 'Status Pembayaran', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'dpBayar', label: 'DP Bayar', sortable: true, defaultVisible: true, align: 'right' },
  { key: 'totalBayar', label: 'Total Bayar', sortable: true, defaultVisible: true, align: 'right' },
  { key: 'totalHarga', label: 'Sisa Bayar', sortable: true, defaultVisible: true, align: 'right' },
    // Show items count / orders detail and allow sorting by number of items
    { key: 'tanggalJatuhTempo', label: 'Tanggal Jatuh Tempo', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'linkInvoice', label: 'Link Invoice', sortable: true, defaultVisible: false, align: 'left' },
    { key: 'linkDrive', label: 'Link Drive', sortable: true, defaultVisible: false, align: 'left' },
      { key: 'items', label: 'Orders Detail', sortable: true, defaultVisible: true, align: 'left' },
  { key: 'actions', label: 'Actions', sortable: false, defaultVisible: true, align: 'left' },
  ],
  customers: [
    { key: 'id', label: 'ID', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'name', label: 'Nama', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'phone', label: 'No Telepon', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'email', label: 'Email', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'address', label: 'Alamat', sortable: false, defaultVisible: true, align: 'left' },
    { key: 'city', label: 'Kota', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'createdAt', label: 'Tanggal Daftar', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'actions', label: 'Actions', sortable: false, defaultVisible: true, align: 'center' },
  ],
  products: [
    { key: 'id', label: 'ID', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'name', label: 'Nama Produk', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'category', label: 'Kategori', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'price', label: 'Harga', sortable: true, defaultVisible: true, align: 'right' },
    { key: 'stock', label: 'Stok', sortable: true, defaultVisible: true, align: 'right' },
    { key: 'unit', label: 'Satuan', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'description', label: 'Deskripsi', sortable: false, defaultVisible: false, align: 'left' },
    { key: 'createdAt', label: 'Tanggal Dibuat', sortable: true, defaultVisible: false, align: 'left' },
    { key: 'actions', label: 'Actions', sortable: false, defaultVisible: true, align: 'center' },
  ],
  payments: [
    { key: 'no', label: 'No', sortable: false, defaultVisible: true, align: 'left' },
  { key: 'id', label: 'ID', sortable: true, defaultVisible: true, align: 'left' },
  { key: 'orderNo', label: 'No Transaksi', sortable: true, defaultVisible: true, align: 'left' },
  { key: 'customerName', label: 'Customer', sortable: true, defaultVisible: true, align: 'left' },
  { key: 'customerPhone', label: 'No HP', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'amount', label: 'Jumlah', sortable: true, defaultVisible: true, align: 'right' },
  { key: 'tipe', label: 'Tipe', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'status', label: 'Status', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'date', label: 'Tanggal', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'actions', label: 'Actions', sortable: false, defaultVisible: true, align: 'center' },
  ],
  piutangs: [
    { key: 'id', label: 'ID', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'orderId', label: 'ID Order', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'customerName', label: 'Customer', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'amount', label: 'Jumlah Piutang', sortable: true, defaultVisible: true, align: 'right' },
    { key: 'dueDate', label: 'Jatuh Tempo', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'status', label: 'Status', sortable: true, defaultVisible: true, align: 'left' },
    { key: 'actions', label: 'Actions', sortable: false, defaultVisible: true, align: 'center' },
  ]
}

// Hook for managing table columns with visibility toggle
export const useTableColumns = (tableId) => {
  const store = useTableSettingsStore()
  const settings = store.getTableSettings(tableId)
  const updateColumns = (columnVisibility) => store.updateColumnVisibility(tableId, columnVisibility)
  
  // Get column config for this table
  const columnConfig = TABLE_COLUMN_CONFIGS[tableId] || []
  
  // Initialize column visibility from settings or defaults
  const columnVisibility = useMemo(() => {
    const savedVisibility = settings.columnVisibility
    const defaultVisibility = {}
    
    columnConfig.forEach(col => {
      defaultVisibility[col.key] = col.defaultVisible
    })
    
    return { ...defaultVisibility, ...savedVisibility }
  }, [settings.columnVisibility, columnConfig])
  
  // Get visible columns
  const visibleColumns = useMemo(() => {
    return columnConfig.filter(col => columnVisibility[col.key] !== false)
  }, [columnConfig, columnVisibility])
  
  // Get hidden columns
  const hiddenColumns = useMemo(() => {
    return columnConfig.filter(col => columnVisibility[col.key] === false)
  }, [columnConfig, columnVisibility])
  
  // Toggle column visibility
  const toggleColumn = (columnKey) => {
    const newVisibility = {
      ...columnVisibility,
      [columnKey]: !columnVisibility[columnKey]
    }
    updateColumns(newVisibility)
  }
  
  // Show column
  const showColumn = (columnKey) => {
    const newVisibility = {
      ...columnVisibility,
      [columnKey]: true
    }
    updateColumns(newVisibility)
  }
  
  // Hide column
  const hideColumn = (columnKey) => {
    const newVisibility = {
      ...columnVisibility,
      [columnKey]: false
    }
    updateColumns(newVisibility)
  }
  
  // Reset to defaults
  const resetColumnVisibility = () => {
    const defaultVisibility = {}
    columnConfig.forEach(col => {
      defaultVisibility[col.key] = col.defaultVisible
    })
    updateColumns(defaultVisibility)
  }
  
  // Show all columns
  const showAllColumns = () => {
    const allVisible = {}
    columnConfig.forEach(col => {
      allVisible[col.key] = true
    })
    updateColumns(allVisible)
  }
  
  // Hide all columns except required ones
  const hideAllColumns = (requiredColumns = ['id', 'actions']) => {
    const allHidden = {}
    columnConfig.forEach(col => {
      allHidden[col.key] = requiredColumns.includes(col.key)
    })
    updateColumns(allHidden)
  }
  
  return {
    columnConfig,
    columnVisibility,
    visibleColumns,
    hiddenColumns,
    toggleColumn,
    showColumn,
    hideColumn,
    resetColumnVisibility,
    showAllColumns,
    hideAllColumns
  }
}

// Hook for managing table filters with persistence
export const useTableFilters = (tableId, defaultFilters = {}) => {
  const store = useTableSettingsStore()
  const settings = store.getTableSettings(tableId)
  const updateFilters = (filters) => store.updateFilters(tableId, filters)
  
  // Get current filters from settings or use defaults
  const filters = useMemo(() => {
    return { ...defaultFilters, ...settings.filters }
  }, [settings.filters, defaultFilters])
  
  // Update specific filter
  const setFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    updateFilters(newFilters)
  }
  
  // Update multiple filters at once
  const setFilters = (newFilters) => {
    updateFilters({ ...filters, ...newFilters })
  }
  
  // Clear specific filter
  const clearFilter = (key) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    updateFilters(newFilters)
  }
  
  // Clear all filters
  const clearAllFilters = () => {
    updateFilters({})
  }
  
  // Reset to defaults
  const resetFilters = () => {
    updateFilters(defaultFilters)
  }
  
  return {
    filters,
    setFilter,
    setFilters,
    clearFilter,
    clearAllFilters,
    resetFilters
  }
}

// Hook for managing table sorting with persistence
export const useTableSorting = (tableId, defaultSort = { key: null, direction: 'asc' }) => {
  const store = useTableSettingsStore()
  const settings = store.getTableSettings(tableId)
  const updateSort = (sortConfig) => store.updateSortConfig(tableId, sortConfig)
  
  // Get current sort config from settings or use default
  const sortConfig = useMemo(() => {
    return settings.sortConfig || defaultSort
  }, [settings.sortConfig, defaultSort])
  
  // Update sort configuration
  const setSortConfig = (newSortConfig) => {
    updateSort(newSortConfig)
  }
  
  // Handle sort by column key
  const handleSort = (key) => {
    let direction = 'asc'
    let newSortKey = key
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      // Third click resets sorting
      newSortKey = null
      direction = 'asc'
    }
    
    const newConfig = { key: newSortKey, direction }
    setSortConfig(newConfig)
  }
  
  // Reset sorting
  const resetSort = () => {
    setSortConfig(defaultSort)
  }
  
  // Check if column is currently sorted
  const isSorted = (columnKey) => {
    return sortConfig.key === columnKey
  }
  
  // Get sort direction for column
  const getSortDirection = (columnKey) => {
    return isSorted(columnKey) ? sortConfig.direction : 'asc'
  }
  
  return {
    sortConfig,
    setSortConfig,
    handleSort,
    resetSort,
    isSorted,
    getSortDirection
  }
}

// Utility function to create table settings preset
export const createTablePreset = (name, settings) => {
  return {
    name,
    settings,
    createdAt: new Date().toISOString()
  }
}

// Utility function to apply table preset
export const applyTablePreset = (tableId, preset, tableSettingsStore) => {
  if (preset && preset.settings) {
    tableSettingsStore.updateTableSettings(tableId, preset.settings)
  }
}