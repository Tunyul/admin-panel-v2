import React, { useEffect, useState, useRef } from 'react'
import {
  Box,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Chip,
  IconButton,
  Checkbox,
  Collapse,
  LinearProgress,
  TableSortLabel,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import PaymentIcon from '@mui/icons-material/Payment'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import PrintIcon from '@mui/icons-material/Print'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import SendIcon from '@mui/icons-material/Send'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import useSelectionStore from '../store/selectionStore'
import { useSearchParams } from 'react-router-dom'
import client from '../api/client'
import { getOrders, updateOrder, deleteOrder } from '../api/orders'
import useNotificationStore from '../store/notificationStore'
import { getCustomerById } from '../api/customers'
import waIcon from '../assets/WhatsApp.svg.webp'
import { useTableColumns, useTableFilters, useTableSorting } from '../hooks/useTableSettings'
import TableSettingsButton from './TableSettingsButton'

// no dummy/sample rows — the table will be populated from the API

export default function ContentOrders() {
  const selected = useSelectionStore((s) => s.selected)
  const toggle = useSelectionStore((s) => s.toggle)
  const selectAll = useSelectionStore((s) => s.selectAll)
  const clear = useSelectionStore((s) => s.clear)

  // Use global table settings
  const tableId = 'orders'
  const { visibleColumns, columnVisibility } = useTableColumns(tableId)
  const { 
    filters: localFilters, 
    setFilters: setLocalFilters,
    setFilter: setLocalFilter 
  } = useTableFilters(tableId, {
    status_urgensi: '',
    status_order: '',
    status_bayar: '',
    date_from: '',
    date_to: ''
  })
  const { 
    sortConfig, 
    handleSort: handleSortGlobal, 
    resetSort 
  } = useTableSorting(tableId)

  const [expandedIds, setExpandedIds] = useState(new Set())

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleRowClick = (e, id) => {
    // If the click started on an interactive element (input, button, a), don't toggle
    const target = e.target
    try {
      if (target.closest && target.closest('input,button,a')) return
    } catch (err) {
      // ignore
    }
    toggleExpand(id)
  }

  // Handle table column sorting with global state
  const handleSort = (key) => {
    handleSortGlobal(key)
    
    // Notify AppMainToolbar about sorting changes
    try {
      const newSortKey = sortConfig.key === key && sortConfig.direction === 'desc' ? null : key
      const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
      
      window.dispatchEvent(new CustomEvent('toolbar:sort-change', { 
        detail: { sortKey: newSortKey, direction }
      }))
    } catch (err) {
      // ignore
    }
  }

  // Get user-friendly column names for sorting display
  const getColumnDisplayName = (key) => {
    const columnNames = {
      id: 'ID Orders',
      orderNo: 'No Transaksi',
      idCustomer: 'ID Customer',
      date: 'Tanggal Order',
      statusUrgensi: 'Urgensi',
  status: 'Status Pesanan',
      statusBayar: 'Status Pembayaran',
      dpBayar: 'DP Bayar',
      totalBayar: 'Total Bayar',
      totalHarga: 'Sisa Bayar',
      tanggalJatuhTempo: 'Jatuh Tempo'
    }
    return columnNames[key] || key
  }

  const [rows, setRows] = useState([])
  // rows: full dataset (normalized)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [customerCache, setCustomerCache] = useState(new Map())
  const [customerLoading, setCustomerLoading] = useState(false)
  const [pendingCustomers, setPendingCustomers] = useState(new Set())
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null })
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({})
  // Actions menu & dialog states
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [menuRow, setMenuRow] = useState(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [changeStatusValue, setChangeStatusValue] = useState('')
  const [shipmentDialogOpen, setShipmentDialogOpen] = useState(false)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState({ open: false, id: null })
  const { showNotification } = useNotificationStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [liveQuery, setLiveQuery] = useState('')

  // Listen to live typing events from TableToolbar (client-side immediate filtering)
  useEffect(() => {
    const handler = (e) => {
      try {
        const q = e?.detail?.q ?? ''
        setLiveQuery(q || '')
      } catch (err) {
        // ignore
      }
    }
    window.addEventListener('toolbar:search', handler)
    return () => window.removeEventListener('toolbar:search', handler)
  }, [])

  // Listen to filter events from AppMainToolbar (client-side filtering)
  useEffect(() => {
    const handler = (e) => {
      try {
        const allFilters = e?.detail?.allFilters || {}
        setLocalFilters(allFilters)
        // Also sync filters to URL search params so server-side/API filtering is updated.
        try {
          // remove empty values before setting search params
          const entries = Object.entries(allFilters).filter(([k, v]) => v !== undefined && v !== null && String(v) !== '')
          if (entries.length === 0) {
            setSearchParams({})
          } else {
            setSearchParams(Object.fromEntries(entries))
          }
        } catch {
          // ignore URL param sync errors
        }
      } catch (err) {
        // ignore
      }
    }
    window.addEventListener('toolbar:filter', handler)
    return () => window.removeEventListener('toolbar:filter', handler)
  }, [])

  // Keyboard shortcut for reset sorting
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Reset sorting with 'R' key (when not typing in inputs)
      if (e.key.toLowerCase() === 'r' && !e.target.matches('input, textarea, [contenteditable]')) {
        if (sortConfig.key) {
          resetSort()
          // Optional: show notification
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('show-notification', { 
              detail: { message: 'Sorting reset', type: 'info' } 
            }))
          }
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [sortConfig.key, resetSort])

  // Listen for reset-sort events from AppMainToolbar
  useEffect(() => {
    const handleResetSort = (e) => {
      try {
        if (e?.detail?.resetSort) {
          resetSort()
          // Notify AppMainToolbar about sorting changes
          window.dispatchEvent(new CustomEvent('toolbar:sort-change', { 
            detail: { sortKey: null, direction: 'asc' }
          }))
        }
      } catch (err) {
        // ignore
      }
    }
    
    window.addEventListener('toolbar:reset-sort', handleResetSort)
    return () => window.removeEventListener('toolbar:reset-sort', handleResetSort)
  }, [resetSort])

  // Notify AppMainToolbar about sorting changes when sortConfig changes
  useEffect(() => {
    try {
      window.dispatchEvent(new CustomEvent('toolbar:sort-change', { 
        detail: { sortKey: sortConfig.key, direction: sortConfig.direction }
      }))
    } catch {
      // ignore
    }
  }, [sortConfig])

  // normalize API response into the table row shape
  const normalize = (item, idx) => {
    // map API response fields to table fields
    const id = item.id_order || item.id || item._id || idx + 1
    const orderNo = item.no_transaksi || item.orderNo || item.no || ''
    const idCustomer = item.id_customer || item.customer_id || item.customerId || ''
    const date = item.tanggal_order || item.date || item.createdAt || item.created_at || ''
    const statusUrgensi = item.status_urgensi || ''
  // Keep each status field separate so UI can show them independently
  // But also keep `status` fallback to order/bot status so existing UIs show something
  const status = item.status || item.status_order || item.status_bot || '' // admin-managed lifecycle (enum) preferred
  const statusOrder = item.status_order || item.statusOrder || item.status || '' // WA/order confirmation
  const statusBot = item.status_bot || item.statusBot || item.status || '' // bot flow status
  const statusBayar = item.status_bayar || ''
    const dpBayar = item.dp_bayar != null ? item.dp_bayar : ''
    const totalBayar = item.total_bayar != null ? item.total_bayar : item.total_harga != null ? item.total_harga : ''
    const totalHarga = item.total_harga != null ? item.total_harga : ''
    const tanggalJatuhTempo = item.tanggal_jatuh_tempo || ''
    const linkInvoice = item.link_invoice || ''
    const linkDrive = item.link_drive || ''
    const notes = item.catatan || item.notes || item.note || ''

    // items / details from OrderDetails as structured array
    let items = []
    if (Array.isArray(item.OrderDetails) && item.OrderDetails.length > 0) {
      items = item.OrderDetails.map((d) => ({
        id: d.id || d.id_order || null,
        id_produk: d.id_produk || d.id_produk || d.id_produk || null,
        name: d.Product?.nama_produk || d.nama_produk || d.name || `Item ${d.id || ''}`,
        kategori: d.Product?.kategori || d.kategori || '',
        quantity: d.quantity != null ? d.quantity : d.qty || 0,
        harga_satuan: d.harga_satuan || d.harga_per_pcs || d.harga_per_m2 || '',
        subtotal_item: d.subtotal_item || d.subtotal || '',
      }))
    }

    // format date strings
    const dateStr = date ? new Date(date).toISOString().slice(0, 10) : ''
    const jatuhTempoStr = tanggalJatuhTempo ? new Date(tanggalJatuhTempo).toISOString().slice(0, 10) : ''

    return {
      id,
      orderNo,
      idCustomer,
      date: dateStr,
      statusUrgensi,
      status,
      statusOrder,
      statusBot,
      statusBayar,
      dpBayar,
      totalBayar,
      totalHarga,
      tanggalJatuhTempo: jatuhTempoStr,
      linkInvoice,
      linkDrive,
      items,
      notes,
    }
  }

  // Format number to Indonesian Rupiah string e.g. "Rp. 400.000"
  const formatRupiah = (value) => {
    if (value === null || value === undefined || value === '') return ''
    // remove non-numeric characters except dot and minus
    const cleaned = String(value).replace(/[^0-9.-]+/g, '')
    const num = Number(cleaned)
    if (Number.isNaN(num)) return String(value)
    const rounded = Math.round(num)
    return 'Rp. ' + rounded.toLocaleString('id-ID')
  }

  // Parse various currency/number inputs (strings with symbols or numbers) to Number
  const parseCurrencyToNumber = (v) => {
    if (v === null || v === undefined || v === '') return 0
    const cleaned = String(v).replace(/[^0-9.-]+/g, '')
    const num = Number(cleaned)
    if (Number.isNaN(num)) return 0
    return num
  }

  // Compute sisa bayar = total_bayar - dp_bayar with sensible fallbacks
  const computeSisaBayar = (row) => {
    // If status indicates fully paid, show zero
    const statusStr = String(row.statusBayar || row.status_bayar || row.status || '').toLowerCase()
    if (statusStr.includes('lunas') || statusStr.includes('paid') || statusStr.includes('selesai') || statusStr.includes('completed')) {
      return 0
    }

    // prefer explicit totalBayar and dpBayar fields
    const total = parseCurrencyToNumber(row.totalBayar != null ? row.totalBayar : row.total_bayar)
    const dp = parseCurrencyToNumber(row.dpBayar != null ? row.dpBayar : row.dp_bayar)
    const sisa = total - dp
    // If both total and dp are zero but totalHarga exists, fallback to totalHarga
    if ((total === 0 && dp === 0) && (row.totalHarga || row.total_harga)) {
      return parseCurrencyToNumber(row.totalHarga || row.total_harga)
    }
    return sisa
  }

  // Map common status strings to background colors (hex)
  const statusColor = (s) => {
    if (!s) return '#6b7280' // default gray for empty/null
    const key = String(s).toLowerCase()
    
    // Order status
    if (key.includes('selesai') || key.includes('completed') || key.includes('done')) return '#16a34a' // green
    if (key.includes('proses') || key.includes('processing') || key.includes('in_progress') || key.includes('progress')) return '#3b82f6' // blue
    if (key.includes('pending') || key.includes('waiting') || key.includes('menunggu')) return '#f59e0b' // amber
    if (key.includes('batal') || key.includes('cancel') || key.includes('cancelled') || key.includes('rejected')) return '#ef4444' // red
    if (key.includes('draft') || key.includes('new') || key.includes('baru')) return '#8b5cf6' // purple
    
    // Payment status
    if (key.includes('lunas') || key === 'paid' || key.includes('completed')) return '#16a34a' // green
    if (key.includes('belum_lunas') || key.includes('belum lunas') || key.includes('unpaid')) return '#ef4444' // red
    if (key.includes('sebagian') || key.includes('partial') || key.includes('dp')) return '#f97316' // orange
    if (key.includes('belum') || key.includes('pending')) return '#f59e0b' // amber
    
    // Urgency status  
    if (key.includes('urgent') || key.includes('priority') || key.includes('high')) return '#ef4444' // red
    if (key.includes('normal') || key.includes('medium')) return '#3b82f6' // blue
    if (key.includes('low') || key.includes('rendah')) return '#16a34a' // green
    
    // Default for unrecognized status - use blue instead of gray
    return '#3b82f6' // blue
  }

  // Get consistent CSS class for status chips (fallback for browser compatibility)
  const getStatusChipClass = (s) => {
    if (!s) return 'status-chip-info' // default to info for empty
    const key = String(s).toLowerCase()
    
    // Error/Red states
    if (key.includes('belum_lunas') || key.includes('belum lunas') || key.includes('unpaid') || 
        key.includes('batal') || key.includes('cancel') || key.includes('cancelled') || key.includes('rejected')) {
      return 'status-chip-error'
    }
    
    // Success/Green states  
    if (key.includes('selesai') || key.includes('completed') || key.includes('done') || 
        key === 'lunas' || key === 'paid') {
      return 'status-chip-success'
    }
    
    // Warning/Orange states
    if (key.includes('pending') || key.includes('waiting') || key.includes('menunggu') ||
        key.includes('sebagian') || key.includes('partial') || key.includes('dp') ||
        key.includes('belum') || key.includes('urgent') || key.includes('priority')) {
      return 'status-chip-warning'
    }
    
    // Info/Blue states (default for process, normal, etc.)
    return 'status-chip-info'
  }

  const fetchOrders = (isManualRefresh = false) => {
    let mounted = true
    setLoading(true)
    setError(null)
    setProgress(5)
    
    // Show appropriate notification based on refresh type
    if (isManualRefresh) {
      showNotification('🔄 Refreshing orders table...', 'info')
    }
    
    // start a gentle progress animation up to 85% while fetching
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.floor(Math.random() * 6) + 1
        return next >= 85 ? 85 : next
      })
    }, 180)

    // Pass current URL search params to the API so server-side filtering/search works
    const paramsObj = Object.fromEntries(searchParams.entries())
    return client
      .get('/api/orders', { params: paramsObj })
      .then((res) => {
        const payload = res && res.data ? res.data : res
        const dataArray = Array.isArray(payload) ? payload : (payload.data && Array.isArray(payload.data) ? payload.data : [])
        if (mounted) {
          if (dataArray.length > 0) {
            const normalized = dataArray.map((it, i) => normalize(it, i))
            setRows(normalized)
            // prefetch customers with progress tracking
            const ids = Array.from(new Set(normalized.map((r) => r.idCustomer).filter(Boolean)))
            fetchAllCustomers(ids)
            
            // Show success notification
            if (isManualRefresh) {
              showNotification(`✅ Table refreshed! ${normalized.length} orders loaded`, 'success')
            }
          } else {
            setRows([])
            if (isManualRefresh) {
              showNotification('📋 Table refreshed - No orders found', 'info')
            }
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load orders', err)
        if (mounted) {
          setError(err)
          // Show error notification
          const errorMsg = err.response?.data?.message || err.message || 'Connection failed'
          if (isManualRefresh) {
            showNotification(`❌ Refresh failed: ${errorMsg}`, 'error')
          }
        }
      })
      .finally(() => {
        // complete progress for orders loading (85%)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        setProgress(85) // Reserve remaining 15% for customer loading
        // small delay so the 85% state is visible
        setTimeout(() => {
          if (mounted) setLoading(false)
          // Don't reset progress here - let customer loading handle it
        }, 220)
      })
  }

  useEffect(() => {
    fetchOrders(false) // Initial load, not manual refresh
    return () => {
      // cleanup any interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    // re-fetch whenever URL search params change (search, filters, etc.) - excluding _r param
  }, [searchParams.toString()])

  // Listen for manual refresh events from toolbar
  useEffect(() => {
    const handleRefresh = () => {
      fetchOrders(true) // Pass true to indicate manual refresh
    }
    
    window.addEventListener('app:refresh:orders', handleRefresh)
    return () => window.removeEventListener('app:refresh:orders', handleRefresh)
  }, [showNotification])

  const fetchAllCustomers = async (customerIds) => {
    if (!customerIds || customerIds.length === 0) return

    // Filter out customers already in cache
    const uncachedIds = customerIds.filter(id => !customerCache.has(id))
    if (uncachedIds.length === 0) return

    setCustomerLoading(true)
    setPendingCustomers(new Set(uncachedIds))
    
    try {
      // Fetch customers in parallel with progress tracking
      const fetchPromises = uncachedIds.map(async (idCustomer, index) => {
        try {
          const res = await getCustomerById(idCustomer)
          const payload = res && res.data ? res.data : res
          
          // Update cache immediately for this customer
          setCustomerCache((prev) => new Map(prev).set(idCustomer, payload))
          
          // Update progress
          const completed = index + 1
          const progressPercent = Math.round((completed / uncachedIds.length) * 100)
          setProgress(85 + (progressPercent * 0.15)) // Use remaining 15% of progress bar
          
          // Remove from pending
          setPendingCustomers(prev => {
            const next = new Set(prev)
            next.delete(idCustomer)
            return next
          })
          
          return { idCustomer, payload }
        } catch (err) {
          console.warn('Failed to fetch customer', idCustomer, err)
          setPendingCustomers(prev => {
            const next = new Set(prev)
            next.delete(idCustomer)
            return next
          })
          return { idCustomer, payload: null }
        }
      })

      await Promise.all(fetchPromises)
      
      // Small delay to show completion
      setTimeout(() => {
        setCustomerLoading(false)
        setProgress(100)
        setTimeout(() => setProgress(0), 150)
      }, 200)
      
    } catch (err) {
      console.error('Error fetching customers:', err)
      setCustomerLoading(false)
      setPendingCustomers(new Set())
    }
  }

  const fetchCustomerIfNeeded = (idCustomer) => {
    if (!idCustomer) return
    if (customerCache.has(idCustomer)) return
    fetchAllCustomers([idCustomer])
  }

  const handleOpenEdit = (row) => {
    setEditForm({ ...row })
    setEditDialogOpen(true)
  }

  // Actions Menu handlers
  const openRowMenu = (e, row) => {
    setMenuAnchor(e.currentTarget)
    setMenuRow(row)
  }
  const closeRowMenu = () => {
    setMenuAnchor(null)
    setMenuRow(null)
  }

  const handleView = () => {
    if (!menuRow) return
    setViewDialogOpen(true)
    closeRowMenu()
  }

  const handleOpenPayment = () => {
    if (!menuRow) return
    setPaymentDialogOpen(true)
    closeRowMenu()
  }

  const handleOpenStatus = () => {
    if (!menuRow) return
    // prefills status selector with the current known status (try several fields)
    setChangeStatusValue(menuRow.status || menuRow.status_order || menuRow.statusOrder || '')
    setStatusDialogOpen(true)
    closeRowMenu()
  }

  const handleOpenShipment = () => {
    if (!menuRow) return
    setShipmentDialogOpen(true)
    closeRowMenu()
  }

  const handleDuplicateOrder = async () => {
    if (!menuRow) return
    // Duplicate by calling backend duplicate endpoint if exists or creating a new order client-side
    try {
      // Simple approach: call updateOrder with a new createOrder if needed (placeholder)
      showNotification('Duplicating order (not implemented backend) — copying data to clipboard', 'info')
      // copy order details to clipboard as JSON for quick reorder workflow
      await navigator.clipboard?.writeText(JSON.stringify(menuRow))
    } catch (err) {
      // ignore clipboard failures
    }
    closeRowMenu()
  }

  const handleOpenRefund = () => {
    if (!menuRow) return
    setRefundDialogOpen(true)
    closeRowMenu()
  }

  const handleOpenCancel = () => {
    if (!menuRow) return
    setCancelConfirm({ open: true, id: menuRow.id })
    closeRowMenu()
  }

  const handleCloseEdit = () => {
    setEditDialogOpen(false)
    setEditForm({})
  }

  const handleSaveEdit = () => {
    const id = editForm.id
    if (!id) return
    // build payload from editable fields (allowing a few fields)
    const payload = {
      status_order: editForm.status || editForm.status_order,
      status_bayar: editForm.statusBayar || editForm.status_bayar,
      dp_bayar: editForm.dpBayar != null ? editForm.dpBayar : editForm.dp_bayar,
      total_bayar: editForm.totalBayar != null ? editForm.totalBayar : editForm.total_bayar,
      catatan: editForm.notes || editForm.catatan,
    }
    updateOrder(id, payload)
      .then(() => {
        showNotification('Order updated', 'success')
        handleCloseEdit()
        fetchOrders()
      })
      .catch(() => showNotification('Failed to update order', 'error'))
  }

  const handleDelete = (id) => setDeleteConfirm({ open: true, id })

  const confirmDelete = () => {
    const id = deleteConfirm.id
    setDeleteConfirm({ open: false, id: null })
    if (!id) return
    deleteOrder(id)
      .then(() => {
        showNotification('Order deleted', 'info')
        fetchOrders()
      })
      .catch(() => showNotification('Failed to delete order', 'error'))
  }

  const cancelDelete = () => setDeleteConfirm({ open: false, id: null })

  // Sortable table header component
  const SortableTableCell = ({ children, sortKey, align = 'left', ...props }) => {
    const isActive = sortConfig.key === sortKey
    const direction = isActive ? sortConfig.direction : 'asc'
    
    const tooltipTitle = isActive 
      ? `Click untuk ${direction === 'asc' ? 'descending' : 'reset sorting'} • Klik 3x untuk reset`
      : 'Click untuk sort ascending • Klik 3x untuk reset'
    
    return (
      <TableCell 
        align={align} 
        {...props}
        sx={{
          position: 'relative',
          backgroundColor: isActive ? 'action.hover' : 'inherit',
          transition: 'background-color 0.2s ease-in-out',
          ...props.sx
        }}
      >
        <Tooltip title={tooltipTitle} arrow placement="top">
          <TableSortLabel
            active={isActive}
            direction={direction}
            onClick={() => handleSort(sortKey)}
            sx={{
              '& .MuiTableSortLabel-icon': {
                opacity: isActive ? 1 : 0.3,
                fontSize: '1rem',
              },
              '&:hover': {
                color: 'primary.main',
              },
              '&:hover .MuiTableSortLabel-icon': {
                opacity: 0.8,
              },
              cursor: 'pointer',
              userSelect: 'none',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'primary.main' : 'inherit',
              transition: 'color 0.2s ease-in-out',
              width: '100%',
              justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
            }}
          >
            {children}
          </TableSortLabel>
        </Tooltip>
        {isActive && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '2px',
              backgroundColor: 'primary.main',
              opacity: 0.7,
            }}
          />
        )}
      </TableCell>
    )
  }

  // Helper function to render table cells dynamically based on column configuration
  const renderTableCell = (columnKey, row, align = 'left') => {
    switch (columnKey) {
      case 'id':
        return <TableCell key={columnKey} align={align}>{row.id}</TableCell>
      case 'orderNo':
        return <TableCell key={columnKey} align={align}>{row.orderNo}</TableCell>
      case 'idCustomer':
        return <TableCell key={columnKey} align={align}>{row.idCustomer}</TableCell>
      case 'date':
        return <TableCell key={columnKey} align={align}>{row.date}</TableCell>
      case 'statusUrgensi':
        return (
          <TableCell key={columnKey} align={align}>
            <Chip 
              label={row.statusUrgensi || ''} 
              size="small" 
              className={getStatusChipClass(row.statusUrgensi)}
              sx={{ backgroundColor: statusColor(row.statusUrgensi), color: '#fff' }} 
            />
          </TableCell>
        )
      case 'status':
        return (
          <TableCell key={columnKey} align={align}>
            <Chip 
              label={row.status || ''} 
              size="small" 
              className={getStatusChipClass(row.status)}
              sx={{ backgroundColor: statusColor(row.status), color: '#fff' }} 
            />
          </TableCell>
        )
      case 'statusOrder':
        return (
          <TableCell key={columnKey} align={align}>
            <Chip 
              label={row.statusOrder || ''} 
              size="small" 
              className={getStatusChipClass(row.statusOrder)}
              sx={{ backgroundColor: statusColor(row.statusOrder), color: '#fff' }} 
            />
          </TableCell>
        )
      case 'statusBot':
        return (
          <TableCell key={columnKey} align={align}>
            <Chip 
              label={row.statusBot || ''} 
              size="small" 
              className={getStatusChipClass(row.statusBot)}
              sx={{ backgroundColor: statusColor(row.statusBot), color: '#fff' }} 
            />
          </TableCell>
        )
      case 'statusBayar':
        return (
          <TableCell key={columnKey} align={align}>
            <Chip 
              label={row.statusBayar || ''} 
              size="small" 
              className={getStatusChipClass(row.statusBayar)}
              sx={{ backgroundColor: statusColor(row.statusBayar), color: '#fff' }} 
            />
          </TableCell>
        )
      case 'dpBayar':
        return (
          <TableCell key={columnKey} align={align}>
            {row.dpBayar ? (
              <Chip label={formatRupiah(row.dpBayar)} size="small" sx={{ backgroundColor: '#fbbf24', color: '#000' }} />
            ) : (
              ''
            )}
          </TableCell>
        )
      case 'totalBayar':
        return (
          <TableCell key={columnKey} align={align}>
            <Box component="span" className="total-paid" sx={{ fontWeight: 600, color: '#16a34a' }}>
              {formatRupiah(row.totalBayar)}
            </Box>
          </TableCell>
        )
      case 'totalHarga':
        return (
          <TableCell key={columnKey} align={align}>
            <Box component="span" className="total-price" sx={{ fontWeight: 600, color: '#3b82f6' }}>
              {formatRupiah(computeSisaBayar(row))}
            </Box>
          </TableCell>
        )
      case 'tanggalJatuhTempo':
        return <TableCell key={columnKey} align={align}>{row.tanggalJatuhTempo}</TableCell>
      case 'linkInvoice':
        return <TableCell key={columnKey} align={align}>{row.linkInvoice}</TableCell>
      case 'linkDrive':
        return <TableCell key={columnKey} align={align}>{row.linkDrive}</TableCell>
      case 'actions':
        return (
          <TableCell key={columnKey} align={align}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                setMenuAnchor(e.currentTarget)
                setMenuRow(row)
              }}
            >
              <MoreVertIcon />
            </IconButton>
          </TableCell>
        )
      default:
        return <TableCell key={columnKey} align={align}>-</TableCell>
    }
  }

  // Simplified pre-computed search strings for better performance
  const rowsWithSearchStrings = React.useMemo(() => {
    return rows.map(row => {
      const customer = customerCache.get(row.idCustomer)
      // Only include essential searchable fields to reduce computation
      const searchString = [
        row.orderNo,
        customer?.nama,
        customer?.no_hp,
        row.status,
        row.statusUrgensi
      ].filter(Boolean).join(' ').toLowerCase()
      
      return {
        ...row,
        searchString
      }
    })
  }, [rows, customerCache])

  // Optimized sorting function with memoization
  const sortData = React.useCallback((data, config) => {
    if (!config.key) return data
    
    return [...data].sort((a, b) => {
      let aVal = a[config.key]
      let bVal = b[config.key]

      // Handle different data types
      if (config.key === 'date' || config.key === 'tanggalJatuhTempo') {
        aVal = aVal ? new Date(aVal) : new Date(0)
        bVal = bVal ? new Date(bVal) : new Date(0)
      } else if (config.key === 'dpBayar' || config.key === 'totalBayar' || config.key === 'totalHarga') {
        // Handle currency values
        aVal = parseFloat(String(aVal || 0).replace(/[^0-9.-]/g, '')) || 0
        bVal = parseFloat(String(bVal || 0).replace(/[^0-9.-]/g, '')) || 0
      } else if (config.key === 'id' || config.key === 'idCustomer') {
        // Handle numeric IDs
        aVal = parseInt(String(aVal || 0).replace(/[^0-9]/g, '')) || 0
        bVal = parseInt(String(bVal || 0).replace(/[^0-9]/g, '')) || 0
      } else if (config.key === 'orderNo') {
        // Handle order numbers (might be mixed alphanumeric)
        const aNum = parseInt(String(aVal || '').replace(/[^0-9]/g, '')) || 0
        const bNum = parseInt(String(bVal || '').replace(/[^0-9]/g, '')) || 0
        if (aNum && bNum) {
          aVal = aNum
          bVal = bNum
        } else {
          aVal = String(aVal || '').toLowerCase()
          bVal = String(bVal || '').toLowerCase()
        }
      } else {
        // Default string comparison
        aVal = String(aVal || '').toLowerCase()
        bVal = String(bVal || '').toLowerCase()
      }

      if (aVal < bVal) {
        return config.direction === 'asc' ? -1 : 1
      }
      if (aVal > bVal) {
        return config.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [])

  // Filtering and sorting logic 
  const filteredAndSortedRows = React.useMemo(() => {
    let filtered = rowsWithSearchStrings

    // Simple search filter
    const searchQuery = liveQuery?.toLowerCase() || ''
    if (searchQuery) {
      filtered = filtered.filter(row => row.searchString.includes(searchQuery))
    }

    // Status filters (from local state, not URL)
    const statusUrgensi = localFilters.status_urgensi
    if (statusUrgensi) {
      filtered = filtered.filter(row => row.statusUrgensi?.toLowerCase() === statusUrgensi.toLowerCase())
    }

    const statusOrder = localFilters.status_order
    if (statusOrder) {
      filtered = filtered.filter(row => row.status?.toLowerCase() === statusOrder.toLowerCase())
    }

    const statusBayar = localFilters.status_bayar
    if (statusBayar) {
      // Debug: log actual status_bayar values to help troubleshoot
      if (process.env.NODE_ENV === 'development') {
        console.log('Filter statusBayar:', statusBayar)
        console.log('Available statusBayar values:', [...new Set(rowsWithSearchStrings.map(r => r.statusBayar).filter(Boolean))])
      }
      filtered = filtered.filter(row => row.statusBayar?.toLowerCase() === statusBayar.toLowerCase())
    }

    // Date filters (from local state, not URL)
    const dateFrom = localFilters.date_from
    const dateTo = localFilters.date_to
    if (dateFrom || dateTo) {
      filtered = filtered.filter(row => {
        if (!row.date) return false
        const rowDate = new Date(row.date)
        if (dateFrom && rowDate < new Date(dateFrom)) return false
        if (dateTo && rowDate > new Date(dateTo + 'T23:59:59')) return false
        return true
      })
    }

    // Apply sorting using optimized function
    return sortData(filtered, sortConfig)
  }, [rowsWithSearchStrings, liveQuery, localFilters, sortConfig, sortData])

  // Reduce display limit for better performance
  const MAX_DISPLAYED_ROWS = 30 // Further reduced for optimal performance
  const displayedRows = React.useMemo(() => {
    // If no client-side filters or live search are active, show all rows (avoid truncating full dataset)
    const hasLocalFilters = Object.values(localFilters || {}).some((v) => v !== undefined && v !== null && String(v) !== '')
    const hasLiveSearch = !!liveQuery
    if (!hasLocalFilters && !hasLiveSearch) {
      return filteredAndSortedRows
    }
    // When filtering/searching is active, apply display limit for performance
    return filteredAndSortedRows.slice(0, MAX_DISPLAYED_ROWS)
  }, [filteredAndSortedRows, localFilters, liveQuery])

  // Emit stats for toolbar (Showing X of Y) when displayed/filtered rows change
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('toolbar:stats', {
          detail: { displayed: displayedRows.length, total: filteredAndSortedRows.length }
        }))
      }
    } catch {
      // ignore
    }
  }, [displayedRows.length, filteredAndSortedRows.length])

  const allIds = displayedRows.map((r) => r.id)

  // Emit stats (displayed / total) for the toolbar to show
  

  const allChecked = allIds.length > 0 && allIds.every((id) => selected.has(id))
  const someChecked = allIds.some((id) => selected.has(id)) && !allChecked

  return (
    <Box
      sx={{
        width: '100%',
        background: 'transparent',
        borderRadius: 1,
        p: 0,
      }}
      className="content-orders"
    >
      <Box sx={{ mb: 2 }}>
        {/* Live filtering info bar */}
        {(liveQuery || filteredAndSortedRows.length !== rows.length) && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 1,
            p: 1,
            bgcolor: 'action.hover',
            borderRadius: 1,
            fontSize: '0.875rem'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {liveQuery && (
                <Chip 
                  label={`Live: "${liveQuery}"`}
                  size="small" 
                  color="primary"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
              {sortConfig.key && (
                <Chip 
                  label={`Sort: ${getColumnDisplayName(sortConfig.key)} (${sortConfig.direction === 'asc' ? 'A→Z' : 'Z→A'})`}
                  size="small" 
                  color="secondary"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                  onDelete={() => setSortConfig({ key: null, direction: 'asc' })}
                />
              )}
              {sortConfig.key && (
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                  Press 'R' to reset sorting
                </Typography>
              )}
              {/* moved showing/total stats to TableToolbar via toolbar:stats event */}
            </Box>
            {filteredAndSortedRows.length === 0 && liveQuery && (
              <Typography variant="body2" color="warning.main">
                No results found for "{liveQuery}" (client-side search)
              </Typography>
            )}
          </Box>
        )}
        
        <TableContainer
          className="table-responsive"
          sx={{
            /* Responsive max height: prefer available viewport space but clamp between 40vh and 75vh */
            maxHeight: 'clamp(40vh, calc(100vh - var(--header-height) - 160px), 75vh)',
            overflow: 'auto',
            // ensure horizontal scrolling when table is wider than viewport
            overflowX: 'auto',
            /* table area background removed */
            background: 'transparent',
          }}
        >
          <Table stickyHeader size="small" sx={{ minWidth: 'max-content', tableLayout: 'auto' }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    checked={allChecked}
                    indeterminate={someChecked}
                    onChange={(e) => {
                      if (e.target.checked) selectAll(allIds)
                      else clear()
                    }}
                  />
                </TableCell>
                <TableCell>No</TableCell>
                
                {/* Dynamic columns based on visibility settings */}
                {visibleColumns.map((column) => {
                  if (column.sortable) {
                    return (
                      <SortableTableCell 
                        key={column.key} 
                        sortKey={column.key} 
                        align={column.align}
                      >
                        {column.label}
                      </SortableTableCell>
                    )
                  } else {
                    return (
                      <TableCell key={column.key} align={column.align}>
                        {column.label}
                      </TableCell>
                    )
                  }
                })}
                
                <TableCell>
                  <TableSettingsButton 
                    tableId={tableId} 
                    variant="icon" 
                    showLabel={false}
                  />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(loading || customerLoading) ? (
                  <>
                    <TableRow>
                      <TableCell colSpan={18}>
                        <Typography>
                          {loading ? 'Loading orders...' : 'Loading customer data...'}
                          {pendingCustomers.size > 0 && ` (${pendingCustomers.size} customers remaining)`}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={18}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-start' }}>
                          {/* Constrain the progress width and keep it left-aligned */}
                          <Box sx={{ width: 'min(520px, 60%)', maxWidth: '60%' }}>
                            <LinearProgress variant="determinate" value={progress} />
                          </Box>
                          <Box sx={{ ml: 1, minWidth: 48 }}>
                            <Typography sx={{ fontSize: 13 }}>{progress}%</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>
                    {filteredAndSortedRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={18}>
                          <Typography>Preparing orders...</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedRows.map((row, idx) => (
                        <React.Fragment key={row.id}>
                          <TableRow hover selected={selected.has(row.id)} onClick={(e) => handleRowClick(e, row.id)} sx={{ cursor: 'pointer' }}>
                            <TableCell padding="checkbox">
                              <Checkbox size="small" checked={selected.has(row.id)} onChange={() => toggle(row.id)} />
                            </TableCell>
                            <TableCell>{idx + 1}</TableCell>
                            
                            {/* Dynamic columns based on visibility settings */}
                            {visibleColumns.map((column) => {
                              return renderTableCell(column.key, row, column.align)
                            })}
                            
                            {/* Additional columns that are always visible */}
                            {columnVisibility.customerPhone !== false && (
                              <TableCell>
                                {(() => {
                                  const c = customerCache.get(row.idCustomer)
                                  const nohp = c?.no_hp || c?.noHp || ''
                                  if (!nohp) return ''
                                  const waUrl = `https://wa.me/${nohp}?text=${encodeURIComponent('haiii')}`
                                  return (
                                    <a href={waUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                      <img src={waIcon} alt="wa" style={{ width: 18, height: 18 }} />
                                      <span style={{ fontSize: 13 }}>{nohp}</span>
                                    </a>
                                  )
                                })()}
                              </TableCell>
                            )}
                            {columnVisibility.customerName !== false && (
                              <TableCell>
                                {(customerCache.get(row.idCustomer) && (customerCache.get(row.idCustomer).nama || customerCache.get(row.idCustomer).nama_customer || customerCache.get(row.idCustomer).name)) || ''}
                              </TableCell>
                            )}
                            <TableCell>
                              {typeof row.linkInvoice === 'string' && row.linkInvoice.trim() ? (
                                <a href={row.linkInvoice} target="_blank" rel="noreferrer">View</a>
                              ) : (
                                ''
                              )}
                            </TableCell>
                            <TableCell>
                              {typeof row.linkDrive === 'string' && row.linkDrive.trim() ? (
                                <a href={row.linkDrive} target="_blank" rel="noreferrer">Drive</a>
                              ) : (
                                ''
                              )}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: { xs: 'normal', sm: 'nowrap' }, overflow: 'visible', wordBreak: 'break-word' }}>
                              {Array.isArray(row.items) && row.items.length > 0 ? (
                                <div style={{ fontSize: 13 }}>
                                  {row.items.length} item(s)
                                </div>
                              ) : (
                                '—'
                              )}
                            </TableCell>

                            <TableCell align="right">
                              <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); openRowMenu(e, row); }} aria-label="more actions">
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                          {/* Expanded details row */}
                          <TableRow>
                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={18}>
                              <Collapse in={expandedIds.has(row.id)} timeout="auto" unmountOnExit>
                                <Box sx={{ margin: 1 }}>
                                  {Array.isArray(row.items) && row.items.length > 0 ? (
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow>
                                          <TableCell>Produk</TableCell>
                                          <TableCell>Kategori</TableCell>
                                          <TableCell>Qty</TableCell>
                                          <TableCell>Harga Satuan</TableCell>
                                          <TableCell>Subtotal</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {row.items.map((it, ii) => (
                                          <TableRow key={ii}>
                                            <TableCell>{it.name}</TableCell>
                                            <TableCell>{it.kategori}</TableCell>
                                            <TableCell>{it.quantity}</TableCell>
                                            <TableCell>{formatRupiah(it.harga_satuan)}</TableCell>
                                            <TableCell>{formatRupiah(it.subtotal_item)}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  ) : (
                                    <Typography variant="body2">No items</Typography>
                                  )}
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      ))
                    )}
                  </>
                ) : error ? (
                <TableRow>
                  <TableCell colSpan={18}>
                    <Typography color="error">Failed to load orders</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredAndSortedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={18}>
                    <Typography>
                      {rows.length === 0 ? 'No orders found' : 'No orders match current filters'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                displayedRows.map((row, idx) => (
                  <React.Fragment key={row.id}>
                    <TableRow hover selected={selected.has(row.id)} onClick={(e) => handleRowClick(e, row.id)} sx={{ cursor: 'pointer' }}>
                      <TableCell padding="checkbox">
                        <Checkbox size="small" checked={selected.has(row.id)} onChange={() => toggle(row.id)} />
                      </TableCell>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.orderNo}</TableCell>
                      <TableCell>{row.idCustomer}</TableCell>
                      <TableCell>
                        {(() => {
                          const c = customerCache.get(row.idCustomer)
                          const nohp = c?.no_hp || c?.noHp || ''
                          if (!nohp) return ''
                          const waUrl = `https://wa.me/${nohp}?text=${encodeURIComponent('haiii')}`
                          return (
                            <a href={waUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                              <img src={waIcon} alt="wa" style={{ width: 18, height: 18 }} />
                              <span style={{ fontSize: 13 }}>{nohp}</span>
                            </a>
                          )
                        })()}
                      </TableCell>
                      <TableCell>{(customerCache.get(row.idCustomer) && (customerCache.get(row.idCustomer).nama || customerCache.get(row.idCustomer).nama_customer || customerCache.get(row.idCustomer).name)) || ''}</TableCell>
                      
                      
                      <TableCell>{row.date}</TableCell>
                      <TableCell>
                        <Chip 
                          label={row.statusUrgensi || ''} 
                          size="small" 
                          className={getStatusChipClass(row.statusUrgensi)}
                          sx={{ backgroundColor: statusColor(row.statusUrgensi), color: '#fff' }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={row.status || ''} 
                          size="small" 
                          className={getStatusChipClass(row.status)}
                          sx={{ backgroundColor: statusColor(row.status), color: '#fff' }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={row.statusOrder || ''} 
                          size="small" 
                          className={getStatusChipClass(row.statusOrder)}
                          sx={{ backgroundColor: statusColor(row.statusOrder), color: '#fff' }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={row.statusBot || ''} 
                          size="small" 
                          className={getStatusChipClass(row.statusBot)}
                          sx={{ backgroundColor: statusColor(row.statusBot), color: '#fff' }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={row.statusBayar || ''} 
                          size="small" 
                          className={getStatusChipClass(row.statusBayar)}
                          sx={{ backgroundColor: statusColor(row.statusBayar), color: '#fff' }} 
                        />
                      </TableCell>
                      <TableCell>
                        {row.dpBayar ? (
                          <Chip label={formatRupiah(row.dpBayar)} size="small" sx={{ backgroundColor: '#fbbf24', color: '#000' }} />
                        ) : (
                          ''
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box component="span" className="total-paid" sx={{ fontWeight: 600, color: '#16a34a' }}>
                          {formatRupiah(row.totalBayar)}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box component="span" className="total-price" sx={{ fontWeight: 600, color: '#3b82f6' }}>
                          {formatRupiah(computeSisaBayar(row))}
                        </Box>
                      </TableCell>
                      <TableCell>{row.tanggalJatuhTempo}</TableCell>
                      <TableCell>
                        {row.linkInvoice ? (
                          <a href={row.linkInvoice} target="_blank" rel="noreferrer">View</a>
                        ) : (
                          ''
                        )}
                      </TableCell>
                      <TableCell>
                        {row.linkDrive ? (
                          <a href={row.linkDrive} target="_blank" rel="noreferrer">Drive</a>
                        ) : (
                          ''
                        )}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: { xs: 'normal', sm: 'nowrap' }, overflow: 'visible', wordBreak: 'break-word' }}>
                        {Array.isArray(row.items) && row.items.length > 0 ? (
                          <div style={{ fontSize: 13 }}>
                            {row.items.length} item(s)
                          </div>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      
                      <TableCell align="right">
                        <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); openRowMenu(e, row); }} aria-label="more actions">
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    {/* Expanded details row */}
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={18}>
                        <Collapse in={expandedIds.has(row.id)} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 1 }}>
                            {Array.isArray(row.items) && row.items.length > 0 ? (
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Produk</TableCell>
                                    <TableCell>Kategori</TableCell>
                                    <TableCell>Qty</TableCell>
                                    <TableCell>Harga Satuan</TableCell>
                                    <TableCell>Subtotal</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {row.items.map((it, ii) => (
                                    <TableRow key={ii}>
                                      <TableCell>{it.name}</TableCell>
                                      <TableCell>{it.kategori}</TableCell>
                                      <TableCell>{it.quantity}</TableCell>
                                      <TableCell>{formatRupiah(it.harga_satuan)}</TableCell>
                                      <TableCell>{formatRupiah(it.subtotal_item)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : (
                              <Typography variant="body2">No items</Typography>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEdit} fullWidth maxWidth="sm">
        <DialogTitle>Edit Order</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel id="status-order-label">Status Order</InputLabel>
            <Select labelId="status-order-label" label="Status Order" value={editForm.status || editForm.status_order || ''} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="proses">Proses</MenuItem>
              <MenuItem value="selesai">Selesai</MenuItem>
              <MenuItem value="batal">Batal</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel id="status-bayar-label">Status Pembayaran</InputLabel>
            <Select labelId="status-bayar-label" label="Status Pembayaran" value={editForm.statusBayar || editForm.status_bayar || ''} onChange={(e) => setEditForm((f) => ({ ...f, statusBayar: e.target.value }))}>
              <MenuItem value="lunas">Lunas</MenuItem>
              <MenuItem value="belum_lunas">Belum Lunas</MenuItem>
              <MenuItem value="partial">Partial</MenuItem>
            </Select>
          </FormControl>

          <TextField fullWidth margin="dense" label="DP Bayar" value={editForm.dpBayar != null ? editForm.dpBayar : editForm.dp_bayar || ''} onChange={(e) => setEditForm((f) => ({ ...f, dpBayar: e.target.value }))} />
          <TextField fullWidth margin="dense" label="Total Bayar" value={editForm.totalBayar != null ? editForm.totalBayar : editForm.total_bayar || ''} onChange={(e) => setEditForm((f) => ({ ...f, totalBayar: e.target.value }))} />
          <TextField fullWidth margin="dense" label="Catatan" value={editForm.notes || editForm.catatan || ''} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteConfirm.open} onClose={cancelDelete}>
        <DialogTitle>Confirm delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete order {deleteConfirm.id}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>Hapus</Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu (shared) */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeRowMenu} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <MenuItem onClick={handleView}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleOpenEdit(menuRow); closeRowMenu(); }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenPayment}>
          <ListItemIcon><PaymentIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Add Payment</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenStatus}>
          <ListItemIcon><AutorenewIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Change Status</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenShipment}>
          <ListItemIcon><LocalShippingIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Create Shipment</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { /* print invoice */ showNotification('Print invoice (not implemented)', 'info'); closeRowMenu(); }}>
          <ListItemIcon><PrintIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Print Invoice</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { /* print packing slip */ showNotification('Print packing slip (not implemented)', 'info'); closeRowMenu(); }}>
          <ListItemIcon><PrintIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Print Packing Slip</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { /* send invoice */ showNotification('Send invoice (WhatsApp/SMS) (not implemented)', 'info'); closeRowMenu(); }}>
          <ListItemIcon><SendIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Send Invoice</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDuplicateOrder}>
          <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Duplicate / Reorder</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenRefund}>
          <ListItemIcon><AttachMoneyIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Refund / Return</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenCancel}>
          <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Cancel Order</ListItemText>
        </MenuItem>
      </Menu>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Order Detail</DialogTitle>
        <DialogContent>
          {menuRow ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography><strong>No Transaksi:</strong> {menuRow.orderNo}</Typography>
              <Typography><strong>Customer ID:</strong> {menuRow.idCustomer}</Typography>
              <Typography><strong>Date:</strong> {menuRow.date}</Typography>
              <Typography><strong>Status:</strong> {menuRow.status}</Typography>
              <Typography><strong>Items:</strong> {menuRow.items?.length || 0}</Typography>
            </Box>
          ) : 'No data'}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog (simplified) */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment</DialogTitle>
        <DialogContent>
          <TextField label="Amount" type="number" fullWidth margin="dense" />
          <TextField label="Method" fullWidth margin="dense" />
          <TextField label="Note" fullWidth margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { showNotification('Add Payment (not implemented)', 'info'); setPaymentDialogOpen(false); }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel id="change-status-label">Status</InputLabel>
            <Select labelId="change-status-label" label="Status" value={changeStatusValue} onChange={(e) => setChangeStatusValue(e.target.value)}>
              <MenuItem value="">(no change)</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="proses">Proses</MenuItem>
              <MenuItem value="selesai">Selesai</MenuItem>
              <MenuItem value="batal">Batal</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            if (!menuRow || !menuRow.id) {
              showNotification('No order selected', 'error')
              setStatusDialogOpen(false)
              return
            }
            const id = menuRow.id
            const payload = { status: changeStatusValue }
            updateOrder(id, payload)
              .then(() => {
                showNotification('Order status updated', 'success')
                setStatusDialogOpen(false)
                fetchOrders()
              })
              .catch((err) => {
                console.error('Failed to update order status', err)
                showNotification('Failed to update status', 'error')
                setStatusDialogOpen(false)
              })
          }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Shipment Dialog */}
      <Dialog open={shipmentDialogOpen} onClose={() => setShipmentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Shipment / Add Tracking</DialogTitle>
        <DialogContent>
          <TextField label="Courier" fullWidth margin="dense" />
          <TextField label="Tracking Number" fullWidth margin="dense" />
          <TextField label="Note" fullWidth margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShipmentDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { showNotification('Create shipment (not implemented)', 'info'); setShipmentDialogOpen(false); }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onClose={() => setRefundDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Refund / Return</DialogTitle>
        <DialogContent>
          <TextField label="Amount" type="number" fullWidth margin="dense" />
          <TextField label="Reason" fullWidth margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => { showNotification('Refund (not implemented)', 'info'); setRefundDialogOpen(false); }}>Process Refund</Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Confirm (separate from delete) */}
      <Dialog open={cancelConfirm.open} onClose={() => setCancelConfirm({ open: false, id: null })}>
        <DialogTitle>Confirm Cancel</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to cancel order {cancelConfirm.id} ? This action can be reverted by changing status.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelConfirm({ open: false, id: null })}>No</Button>
          <Button variant="contained" color="error" onClick={() => { updateOrder(cancelConfirm.id, { status: 'batal' }).then(() => { showNotification('Order cancelled', 'info'); setCancelConfirm({ open: false, id: null }); fetchOrders(); }).catch(() => showNotification('Failed to cancel', 'error')) }}>Yes, Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
