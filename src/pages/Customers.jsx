import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useSearchParams } from 'react-router-dom'

import TableToolbar from '../components/TableToolbar'
import TableSettingsButton from '../components/TableSettingsButton'
import ExampleTableComponent from '../components/ExampleTableComponent'
import { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } from '../api/customers'
import useNotificationStore from '../store/notificationStore'
import { useTableColumns, useTableFilters, useTableSorting } from '../hooks/useTableSettings'

function Customers() {
  const tableId = 'customers'
  const { visibleColumns } = useTableColumns(tableId)
  const { filters, setFilters } = useTableFilters(tableId, { type: '' })
  const { sortConfig, handleSort } = useTableSorting(tableId)

  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null })
  const [detailsMap, setDetailsMap] = useState({})
  const [detailsLoading, setDetailsLoading] = useState({})
  const { showNotification } = useNotificationStore()
  const intervalRef = useRef(null)

  const paramsObject = useCallback(() => {
    const obj = {}
    for (const [k, v] of searchParams.entries()) {
      if (v !== undefined && v !== null && String(v) !== '') obj[k] = v
    }
    return obj
  }, [searchParams])

  const reloadCustomers = useCallback((extra = {}) => {
    setLoading(true)
    try { if (intervalRef.current) clearInterval(intervalRef.current); intervalRef.current = setInterval(() => {}, 1000) } catch (e) {}
    const params = { ...(paramsObject() || {}), ...(extra || {}) }
    return getCustomers(params)
      .then((res) => {
        const payload = res && res.data ? res.data : res
        const items = Array.isArray(payload) ? payload : (payload.data && Array.isArray(payload.data) ? payload.data : [])
        // normalize customers for generic table columns
        const normalized = items.map((it, i) => ({
          id: it.id_customer || it.id || it._id || i + 1,
          id_customer: it.id_customer,
          name: it.nama || it.nama_customer || it.name || '',
          nama_customer: it.nama || it.nama_customer || '',
          phone: it.no_hp || it.phone || '',
          no_hp: it.no_hp || it.phone || '',
          type: it.tipe_customer || it.type || '',
          batas_piutang: it.batas_piutang || it.batas_piutang || null,
          catatan: it.catatan || it.notes || '',
          ordersCount: Array.isArray(it.Orders) ? it.Orders.length : (it.ordersCount || 0),
          tipe_customer: it.tipe_customer || it.type || '',
          address: it.alamat || it.alamat_lengkap || '',
          alamat: it.alamat || it.alamat_lengkap || '',
          email: it.email || ''
        }))
        setData(normalized)
        showNotification && showNotification(`Loaded ${normalized.length} customers`, 'success')
        return normalized
      })
      .catch((err) => {
        setData([])
        showNotification && showNotification('Gagal memuat customers', 'error')
      })
      .finally(() => {
        try { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null } } catch (e) {}
        setLoading(false)
      })
  }, [paramsObject, showNotification])

  useEffect(() => { reloadCustomers() }, [reloadCustomers, searchParams.toString()])

  // listen to toolbar filter events scoped to customers
  useEffect(() => {
    const handler = (e) => {
      try {
        const page = e?.detail?.page || null
        if (!page || !String(page).startsWith('/customers')) return
        const all = e?.detail?.allFilters || {}
        setFilters(all || {})
        try {
          const params = new URLSearchParams()
          Object.keys(all || {}).forEach((k) => {
            const v = all[k]
            if (v !== undefined && v !== null && String(v) !== '') params.set(k, String(v))
          })
          setSearchParams(params)
        } catch {}
      } catch {}
    }
    window.addEventListener('toolbar:filter', handler)
    return () => window.removeEventListener('toolbar:filter', handler)
  }, [setFilters, setSearchParams])

  // listen to search events
  useEffect(() => {
    const h = (e) => {
      try {
        const q = e?.detail?.q || ''
        const params = new URLSearchParams(searchParams.toString())
        if (q === '' || q == null) params.delete('q')
        else params.set('q', q)
        setSearchParams(params)
      } catch {}
    }
    window.addEventListener('toolbar:search', h)
    return () => window.removeEventListener('toolbar:search', h)
  }, [searchParams, setSearchParams])

  // refresh event
  useEffect(() => {
    const h = () => reloadCustomers()
    window.addEventListener('app:refresh:customers', h)
    return () => window.removeEventListener('app:refresh:customers', h)
  }, [reloadCustomers])

  // CRUD handlers
  const handleOpen = (item = {}) => { setForm(item || {}); setErrors({}); setOpen(true) }
  const handleClose = () => setOpen(false)
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSave = () => {
    const newErrors = {}
    if (!form.name && !form.nama && !form.nama_customer) newErrors.name = 'Customer name is required'
    if (!form.phone && !form.no_hp) newErrors.phone = 'Phone number is required'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    const payload = {
      ...form,
      nama: form.name || form.nama || form.nama_customer,
      no_hp: form.phone || form.no_hp
    }
    const promise = form.id_customer || form.id ? updateCustomer(form.id_customer || form.id, payload) : createCustomer(payload)
    promise.then(() => { showNotification('Customer saved', 'success'); handleClose(); reloadCustomers() }).catch(() => showNotification('Failed to save customer', 'error'))
  }

  const handleDelete = (id) => setDeleteConfirm({ open: true, id })
  const confirmDelete = () => {
    const id = deleteConfirm.id
    setDeleteConfirm({ open: false, id: null })
    if (!id) return
    deleteCustomer(id).then(() => { showNotification('Customer deleted', 'success'); reloadCustomers() }).catch(() => showNotification('Failed to delete customer', 'error'))
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
          <TableToolbar
            value={searchParams.get('q') || ''}
            onChange={(v) => { const p = new URLSearchParams(searchParams.toString()); if (!v) p.delete('q'); else p.set('q', v); setSearchParams(p) }}
            placeholder="Search customers (name, phone, address)"
            hideFilters
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TableSettingsButton tableId={tableId} variant="button" showLabel={true} />
          <Button startIcon={<RefreshIcon />} variant="outlined" size="small" onClick={() => reloadCustomers(true)}>Refresh</Button>
          <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => handleOpen({})}>Add Customer</Button>
        </Box>
      </Box>

      {/* Filters row: rely on AppMainToolbar for page-scoped filters; keep a small filter toolbar for type */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TableToolbar hideSearch filterValue={searchParams.get('type') || ''} onFilterChange={(v) => { const p = new URLSearchParams(searchParams.toString()); if (!v) p.delete('type'); else p.set('type', v); setSearchParams(p) }} />
      </Box>

      {/* Shared ExampleTableComponent ensures consistent layout/UX */}
      {loading ? (
        <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress size={24} /></Box>
      ) : (
        <ExampleTableComponent tableId={tableId} data={data} loading={loading} onEdit={(row) => handleOpen(row)} onDelete={(row) => handleDelete(row.id || row.id_customer)} />
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id_customer || form.id ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Customer Name" name="name" value={form.name || form.nama || form.nama_customer || ''} onChange={handleChange} error={!!errors.name} helperText={errors.name} fullWidth />
            <TextField label="Phone Number" name="phone" value={form.phone || form.no_hp || ''} onChange={handleChange} error={!!errors.phone} helperText={errors.phone} fullWidth />
            <TextField label="Customer Type" name="type" value={form.type || form.tipe_customer || ''} onChange={handleChange} fullWidth />
            <TextField label="Address" name="address" value={form.address || form.alamat || ''} onChange={handleChange} multiline rows={3} fullWidth />
            <TextField label="Email" name="email" type="email" value={form.email || ''} onChange={handleChange} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Box>
            Are you sure you want to delete this customer?
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null })}>Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Customers;