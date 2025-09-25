import React, { useState } from 'react'
import { Box, TextField, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material'
import { useLocation } from 'react-router-dom'

export default function AppMainToolbar() {
  const location = useLocation()
  
  // Local state for filters (no URL params)
  const [localFilters, setLocalFilters] = useState({
    status_urgensi: '',
    status_order: '',
    status_bayar: '',
    date_from: '',
    date_to: '',
    category: '', // Products
    type: '', // Customers  
    status: '', // Payments, Piutangs
    method: '', // Payments
    customer: '' // Piutangs
  })
  const [hasActiveSearch, setHasActiveSearch] = useState(false)
  const [hasActiveSorting, setHasActiveSorting] = useState(false)

  // Listen for search events to track if search is active
  React.useEffect(() => {
    const handleSearch = (e) => {
      try {
        const q = e?.detail?.q ?? ''
        setHasActiveSearch(q.length > 0)
      } catch {
        // ignore
      }
    }
    window.addEventListener('toolbar:search', handleSearch)
    return () => window.removeEventListener('toolbar:search', handleSearch)
  }, [])

  // Listen for sorting changes to track if sorting is active
  React.useEffect(() => {
    const handleSortChange = (e) => {
      try {
        const sortKey = e?.detail?.sortKey || null
        setHasActiveSorting(!!sortKey)
      } catch {
        // ignore
      }
    }
    
    window.addEventListener('toolbar:sort-change', handleSortChange)
    return () => window.removeEventListener('toolbar:sort-change', handleSortChange)
  }, [])

  const pathname = location.pathname || ''
  const isOrders = pathname === '/orders' || pathname.startsWith('/orders')
  const isProducts = pathname === '/products' || pathname.startsWith('/products')
  const isCustomers = pathname === '/customers' || pathname.startsWith('/customers')
  const isPayments = pathname === '/payments' || pathname.startsWith('/payments')
  const isPiutangs = pathname === '/piutangs' || pathname.startsWith('/piutangs')

  const updateFilter = (key, value) => {
    // Update local state
    setLocalFilters(prev => ({ ...prev, [key]: value }))
    
    // Emit global event for ContentOrders to listen
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('toolbar:filter', { 
          detail: { [key]: value, allFilters: { ...localFilters, [key]: value } }
        }))
      }
      } catch {
      // ignore
    }
  }

  const resetAllFilters = () => {
    const emptyFilters = {
      status_urgensi: '',
      status_order: '',
      status_bayar: '',
      date_from: '',
      date_to: '',
      category: '',
      type: '',
      status: '',
      method: '',
      customer: ''
    }
    
    // Reset local state
    setLocalFilters(emptyFilters)
    
    // Emit reset event for ContentOrders and TableToolbar
    try {
      if (typeof window !== 'undefined') {
        // Reset filters
        window.dispatchEvent(new CustomEvent('toolbar:filter', { 
          detail: { allFilters: emptyFilters }
        }))
        // Reset search
        window.dispatchEvent(new CustomEvent('toolbar:search', { 
          detail: { q: '' }
        }))
        // Reset search input in TableToolbar
        window.dispatchEvent(new CustomEvent('toolbar:reset', { 
          detail: { resetAll: true }
        }))
        // Reset sorting
        window.dispatchEvent(new CustomEvent('toolbar:reset-sort', { 
          detail: { resetSort: true }
        }))
      }
    } catch {
      // ignore
    }
  }

  // Reset sorting only
  const resetSorting = () => {
    try {
      window.dispatchEvent(new CustomEvent('toolbar:reset-sort', { 
        detail: { resetSort: true }
      }))
    } catch {
      // ignore
    }
  }

  // Check if any filter is active (including search)
  // Use page-specific checks so filters from one page don't make the Clear button appear on another page

  const hasActiveFiltersOrders = (
    ['status_urgensi', 'status_order', 'status_bayar', 'date_from', 'date_to']
      .some((k) => !!localFilters[k])
  ) || hasActiveSearch

  const hasActiveFiltersProducts = (!!localFilters.category) || hasActiveSearch
  const hasActiveFiltersCustomers = (!!localFilters.type) || hasActiveSearch
  const hasActiveFiltersPayments = (!!localFilters.status) || (!!localFilters.method) || hasActiveSearch
  const hasActiveFiltersPiutangs = (!!localFilters.status) || (!!localFilters.customer) || hasActiveSearch

  // Order filter options (aligned with backend/database values)
  const statusUrgensiOptions = [
    { value: 'urgent', label: 'Urgent' },
    { value: 'normal', label: 'Normal' },
    { value: 'low', label: 'Low' },
  ]

  const statusOrderOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'proses', label: 'Proses' },
    { value: 'selesai', label: 'Selesai' },
    { value: 'batal', label: 'Dibatalkan' },
  ]

  const statusBayarOptions = [
    { value: 'belum_lunas', label: 'Belum Lunas' },
    { value: 'lunas', label: 'Lunas' },
    { value: 'dp', label: 'DP' },
  ]

  

  return (
    <Box
      className="app-main-toolbar"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        py: 1,
        px: 2,
        borderBottom: '1px solid rgba(var(--border-rgb), 0.06)',
        /* toolbar background removed */
        background: 'transparent',
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search removed from app toolbar; page-level TableToolbar provides search when needed */}

        {/* Orders: status + date range */}
        {isOrders && (
          <>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel shrink>Urgency</InputLabel>
              <Select
                value={localFilters.status_urgensi || ''}
                label="Urgency"
                onChange={(e) => updateFilter('status_urgensi', e.target.value)}
                displayEmpty
              >
                <MenuItem value="">(all)</MenuItem>
                {statusUrgensiOptions.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel shrink>Status Order</InputLabel>
              <Select
                value={localFilters.status_order || ''}
                label="Status Order"
                onChange={(e) => updateFilter('status_order', e.target.value)}
                displayEmpty
              >
                <MenuItem value="">(all)</MenuItem>
                {statusOrderOptions.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel shrink>Payment</InputLabel>
              <Select
                value={localFilters.status_bayar || ''}
                label="Payment"
                onChange={(e) => updateFilter('status_bayar', e.target.value)}
                displayEmpty
              >
                <MenuItem value="">(all)</MenuItem>
                {statusBayarOptions.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              type="date"
              label="From Date"
              value={localFilters.date_from || ''}
              onChange={(e) => updateFilter('date_from', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              size="small"
              type="date"
              label="To Date"
              value={localFilters.date_to || ''}
              onChange={(e) => updateFilter('date_to', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            {/* Reset Filters Button */}
            {hasActiveFiltersOrders && (
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                onClick={resetAllFilters}
                sx={{ 
                  minWidth: '100px',
                  fontSize: '0.875rem',
                  height: '40px' // Match other form elements
                }}
              >
                Clear Filters
              </Button>
            )}
            {hasActiveSorting && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={resetSorting}
                sx={{ 
                  minWidth: '100px',
                  fontSize: '0.875rem',
                  height: '40px' // Match other form elements
                }}
              >
                Reset Sort
              </Button>
            )}
          </>
        )}

        {/* Products: category (text input) */}
        {isProducts && (
          <>
            <TextField
              size="small"
              value={localFilters.category || ''}
              onChange={(e) => updateFilter('category', e.target.value)}
              placeholder="Category"
            />
            {hasActiveFiltersProducts && (
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                onClick={resetAllFilters}
                sx={{ 
                  minWidth: '100px',
                  fontSize: '0.875rem',
                  height: '40px'
                }}
              >
                Clear Filters
              </Button>
            )}
            {hasActiveSorting && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={resetSorting}
                sx={{ 
                  minWidth: '100px',
                  fontSize: '0.875rem',
                  height: '40px'
                }}
              >
                Reset Sort
              </Button>
            )}
          </>
        )}

        {/* Customers: type */}
        {isCustomers && (
          <>
            <TextField
              size="small"
              value={localFilters.type || ''}
              onChange={(e) => updateFilter('type', e.target.value)}
              placeholder="Type"
            />
            {hasActiveFiltersCustomers && (
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                onClick={resetAllFilters}
                sx={{ 
                  minWidth: '100px',
                  fontSize: '0.875rem',
                  height: '40px'
                }}
              >
                Clear Filters
              </Button>
            )}
            {hasActiveSorting && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={resetSorting}
                sx={{ 
                  minWidth: '100px',
                  fontSize: '0.875rem',
                  height: '40px'
                }}
              >
                Reset Sort
              </Button>
            )}
          </>
        )}

        {/* Payments: status + method */}
        {isPayments && (
          <>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel shrink>Status</InputLabel>
              <Select
                value={localFilters.status || ''}
                label="Status"
                onChange={(e) => updateFilter('status', e.target.value)}
                displayEmpty
              >
                <MenuItem value="">(all)</MenuItem>
                <MenuItem value="verified">Verified</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              value={localFilters.method || ''}
              onChange={(e) => updateFilter('method', e.target.value)}
              placeholder="Method"
            />
            {hasActiveFiltersPayments && (
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                onClick={resetAllFilters}
                sx={{ 
                  minWidth: '100px',
                  fontSize: '0.875rem',
                  height: '40px'
                }}
              >
                Clear Filters
              </Button>
            )}
            {hasActiveSorting && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={resetSorting}
                sx={{ 
                  minWidth: '100px',
                  fontSize: '0.875rem',
                  height: '40px'
                }}
              >
                Reset Sort
              </Button>
            )}
          </>
        )}

        {/* Piutangs: status + customer */}
        {isPiutangs && (
          <>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel shrink>Status</InputLabel>
              <Select
                value={localFilters.status || ''}
                label="Status"
                onChange={(e) => updateFilter('status', e.target.value)}
                displayEmpty
              >
                <MenuItem value="">(all)</MenuItem>
                <MenuItem value="outstanding">Outstanding</MenuItem>
                <MenuItem value="lunas">Lunas</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              value={localFilters.customer || ''}
              onChange={(e) => updateFilter('customer', e.target.value)}
              placeholder="Customer"
            />
            {hasActiveFiltersPiutangs && (
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                onClick={resetAllFilters}
                sx={{ 
                  minWidth: '100px',
                  fontSize: '0.875rem',
                  height: '40px'
                }}
              >
                Clear Filters
              </Button>
            )}
            {hasActiveSorting && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={resetSorting}
                sx={{ 
                  minWidth: '100px',
                  fontSize: '0.875rem',
                  height: '40px'
                }}
              >
                Reset Sort
              </Button>
            )}
          </>
        )}
      </Box>

      {/* right side reserved for actions (kept empty to preserve layout) */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }} />
    </Box>
  )
}
