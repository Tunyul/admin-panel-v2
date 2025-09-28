import React, { useState, useEffect } from 'react'
import { Box, TextField, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material'
import { useLocation, useSearchParams } from 'react-router-dom'

export default function AppMainToolbar() {
  const location = useLocation()
  const [, setSearchParams] = useSearchParams()
  
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
    customer: '', // Piutangs
    // Payments specific
    no_transaksi: '',
    no_hp: '',
    tipe: '',
    nominal_min: '',
    nominal_max: ''
  })
  // AppMainToolbar no longer manipulates URL params directly; pages handle that.
  const [hasActiveSearch, setHasActiveSearch] = useState(false)
  const [hasActiveSorting, setHasActiveSorting] = useState(false)

  // Listen for search events to track if search is active
  useEffect(() => {
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
  useEffect(() => {
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

  // Define which filter keys belong to which page so we only emit relevant keys
  const pageFilterKeys = {
    orders: ['status_urgensi', 'status_order', 'status_bayar', 'date_from', 'date_to'],
  products: ['category'],
    customers: ['type'],
    payments: ['no_transaksi', 'no_hp', 'tipe', 'nominal_min', 'nominal_max', 'has_bukti', 'date_from', 'date_to'],
    piutangs: ['status', 'customer']
  }

  const getKeysForPath = (p) => {
    if (!p) return []
    if (String(p).startsWith('/orders')) return pageFilterKeys.orders
    if (String(p).startsWith('/products')) return pageFilterKeys.products
    if (String(p).startsWith('/customers')) return pageFilterKeys.customers
    if (String(p).startsWith('/payments')) return pageFilterKeys.payments
    if (String(p).startsWith('/piutangs')) return pageFilterKeys.piutangs
    return []
  }

  const updateFilter = (key, value) => {
    // Compute new filters based on current localFilters and schedule state update.
    // Dispatch the global event after scheduling state update to avoid firing
    // listeners while React may be rendering other components.
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    // Build a page-scoped allFilters to avoid leaking unrelated keys to other pages
    const keysForPage = getKeysForPath(pathname)
    const filteredAll = {}
    // Only include keys that belong to this page (prevents leaking order keys into payments)
    if (Array.isArray(keysForPage) && keysForPage.length > 0) {
      keysForPage.forEach((k) => {
        if (Object.prototype.hasOwnProperty.call(newFilters, k)) filteredAll[k] = newFilters[k]
      })
    }
    // Emit global event for other components to listen
    try {
      if (typeof window !== 'undefined') {
        // debug: log what we're emitting
  try { console.debug('[AppMainToolbar] dispatch toolbar:filter', { key, value, allFilters: filteredAll, page: pathname }); } catch { /* debug may fail in some environments */ }
        window.dispatchEvent(new CustomEvent('toolbar:filter', {
          detail: { [key]: value, allFilters: filteredAll, page: pathname }
        }))
      }
    } catch {
      // ignore
    }
    // Also sync URL search params for the current page by writing the full
    // page-scoped filteredAll object to the router searchParams. This keeps
    // the URL authoritative and avoids partial/one-key-only updates.
    try {
      const keysForPage = getKeysForPath(pathname);
      if (Array.isArray(keysForPage) && keysForPage.length > 0) {
        try {
          const params = new URLSearchParams();
          // Only include keys that belong to the page (filteredAll was built above)
          Object.keys(filteredAll || {}).forEach((k) => {
            const v = filteredAll[k];
            if (v === undefined || v === null || String(v) === '') params.delete(k);
            else params.set(k, String(v));
          });
          setSearchParams(params);
        } catch {
          // fallback: ignore
        }
      }
  } catch { /* ignore */ }
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
      customer: '',
      no_transaksi: '',
      no_hp: '',
      tipe: '',
      has_bukti: '',
      nominal_min: '',
      nominal_max: ''
    }
    
    // Reset local state first
    setLocalFilters(emptyFilters)
    // Then emit reset events (scoped to current page)
    try {
      if (typeof window !== 'undefined') {
        const keysForPage = getKeysForPath(pathname)
        const filteredEmpty = {}
        if (Array.isArray(keysForPage) && keysForPage.length > 0) {
          keysForPage.forEach((k) => { filteredEmpty[k] = '' })
        }
        // Reset filters (page-scoped)
        window.dispatchEvent(new CustomEvent('toolbar:filter', { 
          detail: { allFilters: filteredEmpty, page: pathname }
        }))
        // Reset search
        window.dispatchEvent(new CustomEvent('toolbar:search', { 
          detail: { q: '', page: pathname }
        }))
        // Reset search input in TableToolbar
        window.dispatchEvent(new CustomEvent('toolbar:reset', { 
          detail: { resetAll: true, page: pathname }
        }))
        // Reset sorting
        window.dispatchEvent(new CustomEvent('toolbar:reset-sort', { 
          detail: { resetSort: true, page: pathname }
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
  const hasActiveFiltersPayments = (!!localFilters.status) || hasActiveSearch || (!!localFilters.tipe) || (!!localFilters.nominal_min) || (!!localFilters.nominal_max)

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
            <FormControl size="small" sx={{ minWidth: 140 }}>
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

            <FormControl size="small" sx={{ minWidth: 140 }}>
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

            <FormControl size="small" sx={{ minWidth: 140 }}>
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
              sx={{ width: 120 }}
            />

            <TextField
              size="small"
              type="date"
              label="To Date"
              value={localFilters.date_to || ''}
              onChange={(e) => updateFilter('date_to', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 120 }}
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
              sx={{ width: 120 }}
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
              sx={{ width: 120 }}
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

        {/* Payments: filters (status removed) */}
        {isPayments && (
          <>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel shrink>Tipe</InputLabel>
              <Select
                value={localFilters.tipe || ''}
                label="Tipe"
                onChange={(e) => updateFilter('tipe', e.target.value)}
                displayEmpty
              >
                <MenuItem value="">(all)</MenuItem>
                <MenuItem value="dp">DP</MenuItem>
                <MenuItem value="pelunasan">Pelunasan</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              type="number"
              value={localFilters.nominal_min || ''}
              onChange={(e) => updateFilter('nominal_min', e.target.value)}
              placeholder="Min (Rp)"
              sx={{ width: 120 }}
            />

            <TextField
              size="small"
              type="number"
              value={localFilters.nominal_max || ''}
              onChange={(e) => updateFilter('nominal_max', e.target.value)}
              placeholder="Max (Rp)"
              sx={{ width: 120 }}
            />
            <TextField
              size="small"
              type="date"
              value={localFilters.date_from || ''}
              onChange={(e) => updateFilter('date_from', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 120 }}
            />
            <TextField
              size="small"
              type="date"
              value={localFilters.date_to || ''}
              onChange={(e) => updateFilter('date_to', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 120 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel shrink>Has Bukti</InputLabel>
              <Select
                value={localFilters.has_bukti || ''}
                label="Has Bukti"
                onChange={(e) => updateFilter('has_bukti', e.target.value)}
                displayEmpty
              >
                <MenuItem value="">(all)</MenuItem>
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </Select>
            </FormControl>
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
            <FormControl size="small" sx={{ minWidth: 140 }}>
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
                  width: 120
                }}
              >
                Reset Sort
              </Button>
            )}
          </>
        )}
      </Box>

    </Box>
  )
}
