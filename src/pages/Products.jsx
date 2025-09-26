import React, { useEffect, useState } from 'react'
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useSearchParams } from 'react-router-dom'

import TableToolbar from '../components/TableToolbar'
import TableSettingsButton from '../components/TableSettingsButton'
import ExampleTableComponent from '../components/ExampleTableComponent'
import { getProducts, createProduct } from '../api/products'

function Products() {
	const [searchParams, setSearchParams] = useSearchParams()
	const [rows, setRows] = useState([])
	const [loading, setLoading] = useState(false)
	const [showAddModal, setShowAddModal] = useState(false)
	const [creating, setCreating] = useState(false)

	// Form state for add product
	const [form, setForm] = useState({ name: '', category: '', price: '', stock: '', unit: '', description: '' })

	const updateParam = (key, value) => {
		const params = new URLSearchParams(searchParams.toString())
		if (value === '' || value == null) params.delete(key)
		else params.set(key, value)
		setSearchParams(params)
	}

		const fetchProducts = () => {
		setLoading(true)
		return getProducts()
			.then((res) => {
				const payload = res && res.data ? res.data : res
				const dataArray = Array.isArray(payload) ? payload : (payload.data && Array.isArray(payload.data) ? payload.data : [])
				const normalized = dataArray.map((it, i) => ({
					// keep both generic keys and raw product API fields so table rendering
					id: it.id || it._id || it.id_produk || i + 1,
					id_produk: it.id_produk,
					name: it.name || it.nama_produk || it.nama || '',
					nama_produk: it.nama_produk,
					category: it.category || it.kategori || it.kategori_produk || '',
					kategori: it.kategori,
					harga_per_m2: it.harga_per_m2,
					harga_per_pcs: it.harga_per_pcs,
					price: it.price != null ? it.price : (it.harga_per_pcs || it.harga_per_m2 || it.harga || ''),
					unit_area: it.unit_area,
					ukuran_standar: it.ukuran_standar,
					bahan: it.bahan,
					finishing: it.finishing,
					stock: it.stock != null ? it.stock : it.stok || 0,
					unit: it.unit || it.satuan || it.ukuran_standar || '',
					description: it.description || it.deskripsi || '',
					createdAt: it.createdAt || it.created_at || '',
					created_at: it.created_at,
					updated_at: it.updated_at
				}))
				setRows(normalized)
			})
							.catch(() => {
								if (typeof window !== 'undefined' && window.dispatchEvent) {
									window.dispatchEvent(new CustomEvent('show-notification', { detail: { message: 'Gagal memuat produk', type: 'error' } }))
								}
							})
			.finally(() => setLoading(false))
	}

	useEffect(() => {
		fetchProducts()

		const handler = () => fetchProducts(true)
		window.addEventListener('app:refresh:products', handler)
		return () => window.removeEventListener('app:refresh:products', handler)
	}, [])

	const handleCreate = () => {
		setCreating(true)
		const payload = {
			name: form.name,
			category: form.category,
			price: form.price === '' ? 0 : Number(String(form.price).replace(/[^0-9.-]+/g, '')),
			stock: form.stock === '' ? 0 : Number(form.stock),
			unit: form.unit,
			description: form.description
		}

			createProduct(payload)
						.then(() => {
							if (typeof window !== 'undefined' && window.dispatchEvent) {
								window.dispatchEvent(new CustomEvent('show-notification', { detail: { message: 'Produk berhasil ditambahkan', type: 'success' } }))
							}
				setShowAddModal(false)
				setForm({ name: '', category: '', price: '', stock: '', unit: '', description: '' })
				fetchProducts()
			})
						.catch(() => {
							if (typeof window !== 'undefined' && window.dispatchEvent) {
								window.dispatchEvent(new CustomEvent('show-notification', { detail: { message: 'Gagal menambahkan produk', type: 'error' } }))
							}
						})
			.finally(() => setCreating(false))
	}

	return (
		<Box>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
				<Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
					<TableToolbar
						value={searchParams.get('q') || ''}
						onChange={(v) => updateParam('q', v)}
						placeholder="Search products (name, category)"
						hideFilters
					/>
				</Box>

				<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
					<TableSettingsButton tableId="products" variant="button" showLabel={true} />
					<Button startIcon={<RefreshIcon />} variant="outlined" size="small" onClick={() => fetchProducts(true)}>
						Refresh
					</Button>
					<Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => setShowAddModal(true)}>
						Add Product
					</Button>
				</Box>
			</Box>

			<ExampleTableComponent tableId="products" data={rows} loading={loading} />

			<Dialog open={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="sm" fullWidth>
				<DialogTitle>Add Product</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						<TextField label="Name" size="small" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
						<TextField label="Category" size="small" value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} />
						<TextField label="Price" size="small" value={form.price} onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))} />
						<TextField label="Stock" size="small" value={form.stock} onChange={(e) => setForm((s) => ({ ...s, stock: e.target.value }))} />
						<TextField label="Unit" size="small" value={form.unit} onChange={(e) => setForm((s) => ({ ...s, unit: e.target.value }))} />
						<TextField label="Description" size="small" multiline rows={3} value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowAddModal(false)}>Cancel</Button>
					<Button variant="contained" onClick={handleCreate} disabled={creating || !form.name}>Create</Button>
				</DialogActions>
			</Dialog>
		</Box>
	)
}

export default Products
