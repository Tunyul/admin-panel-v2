import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Box, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Typography, CircularProgress } from '@mui/material'
import { useSearchParams } from 'react-router-dom'
import { getProducts } from '../api/products'
import { useTableColumns, useTableFilters, useTableSorting } from '../hooks/useTableSettings'
import ExampleTableComponent from './ExampleTableComponent'
import useNotificationStore from '../store/notificationStore'

export default function ContentProducts() {
  const tableId = 'products'
  const { visibleColumns: _visibleColumns } = useTableColumns(tableId)
  const { /* filters, */ setFilters } = useTableFilters(tableId, { category: '' })
  useTableSorting(tableId)
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const { showNotification } = useNotificationStore()
  const intervalRef = useRef(null)

  const paramsObject = useCallback(() => {
    const obj = {}
    for (const [k, v] of searchParams.entries()) {
      if (v !== undefined && v !== null && String(v) !== '') obj[k] = v
    }
    return obj
  }, [searchParams])

  const reloadProducts = useCallback((extra = {}, isManual = false) => {
    setLoading(true)
    try {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = setInterval(() => {}, 1000)
    } catch { /* ignore */ }
    const params = { ...(paramsObject() || {}), ...(extra || {}) }
    return getProducts(params)
      .then((res) => {
        const payload = res && res.data ? res.data : res
        const items = Array.isArray(payload) ? payload : (payload.data && Array.isArray(payload.data) ? payload.data : [])
        setData(items)
        // Only show notification when user explicitly requested a refresh
        if (isManual) {
          showNotification && showNotification(`Loaded ${items.length} products`, 'success')
        }
        return items
      })
      .catch(() => {
        setData([])
        showNotification && showNotification('Gagal memuat produk', 'error')
      })
      .finally(() => {
  try { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null } } catch { /* ignore */ }
  setLoading(false)
      })
  }, [paramsObject, showNotification])

  // initial load and reload on searchParams changes
  const searchParamsString = searchParams.toString()
  useEffect(() => {
    reloadProducts()
  }, [reloadProducts, searchParamsString])

  // Listen to toolbar filter events scoped to products page
  useEffect(() => {
    const handler = (e) => {
      try {
        const page = e?.detail?.page || null
        if (!page || !String(page).startsWith('/products')) return
        const all = e?.detail?.allFilters || {}
        // write filters to local store and update search params
        setFilters(all || {})
        try {
          const params = new URLSearchParams()
          Object.keys(all || {}).forEach((k) => {
            const v = all[k]
            if (v !== undefined && v !== null && String(v) !== '') params.set(k, String(v))
          })
          setSearchParams(params)
        } catch { /* ignore */ }
      } catch { /* ignore */ }
    }
    window.addEventListener('toolbar:filter', handler)
    return () => window.removeEventListener('toolbar:filter', handler)
  }, [setFilters, setSearchParams])

  // Listen for explicit refresh events
  useEffect(() => {
    const h = () => reloadProducts({}, true)
    window.addEventListener('app:refresh:products', h)
    return () => window.removeEventListener('app:refresh:products', h)
  }, [reloadProducts])

  // Listen to search events to support live client-side filtering (TableToolbar emits toolbar:search)
  useEffect(() => {
    const h = (e) => {
      try {
        const q = e?.detail?.q || ''
        // apply q to search params as `q`
        const params = new URLSearchParams(searchParams.toString())
        if (q === '' || q == null) params.delete('q')
        else params.set('q', q)
        setSearchParams(params)
    } catch { /* ignore */ }
    }
    window.addEventListener('toolbar:search', h)
    return () => window.removeEventListener('toolbar:search', h)
  }, [searchParams, setSearchParams])

  return (
    <Box>
      {loading ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <ExampleTableComponent tableId={tableId} data={data} loading={loading} />
      )}
    </Box>
  )
}
