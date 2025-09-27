import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Autocomplete,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Paper,
  Grid,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { getCustomers, createCustomer } from '../api/customers'
import { getProducts } from '../api/products'
import { createOrder } from '../api/orders'
import useNotificationStore from '../store/notificationStore'

const steps = ['Select Customer', 'Select Products', 'Order Summary']

export default function AddOrderModal({ open, onClose, onOrderCreated }) {
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ nama: '', no_hp: '', alamat: '' })
  const { showNotification } = useNotificationStore()

  // Order summary fields
  const [orderSummary, setOrderSummary] = useState({
    statusUrgensi: 'normal',
    notes: ''
  })


  const loadCustomers = React.useCallback(async () => {
    setLoadingCustomers(true)
    try {
      const res = await getCustomers()
      const data = res?.data?.data || res?.data || []
      setCustomers(Array.isArray(data) ? data : [])
      console.log('Customers loaded:', data) // Debug log
    } catch (err) {
      console.error('Failed to load customers', err)
      setCustomers([])
      showNotification('Failed to load customers', 'error')
    } finally {
      setLoadingCustomers(false)
    }
  }, [showNotification])

  const loadProducts = React.useCallback(async () => {
    setLoadingProducts(true)
    try {
      const res = await getProducts()
      const data = res?.data?.data || res?.data || []
      setProducts(Array.isArray(data) ? data : [])
      console.log('Products loaded:', data) // Debug log
    } catch (err) {
      console.error('Failed to load products', err)
      setProducts([])
      showNotification('Failed to load products', 'error')
    } finally {
      setLoadingProducts(false)
    }
  }, [showNotification])

  // Load data on mount (placed after callbacks to avoid TDZ)
  useEffect(() => {
    if (open) {
      loadCustomers()
      loadProducts()
    } else {
      // Cleanup when modal closes
      setActiveStep(0)
      setSelectedCustomer(null)
      setSelectedProducts([])
      setShowAddCustomer(false)
      setNewCustomer({ nama: '', no_hp: '', alamat: '' })
      setOrderSummary({ statusUrgensi: 'normal', notes: '' })
    }
  }, [open, loadCustomers, loadProducts])

  const handleNext = () => {
    setActiveStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setActiveStep((prev) => prev - 1)
  }

  const handleClose = () => {
    setActiveStep(0)
    setSelectedCustomer(null)
    setSelectedProducts([])
    setShowAddCustomer(false)
    setNewCustomer({ nama: '', no_hp: '', alamat: '' })
    setOrderSummary({ statusUrgensi: 'normal', notes: '' })
    onClose()
  }

  const handleCreateCustomer = async () => {
    if (!newCustomer.nama || !newCustomer.no_hp) {
      showNotification('Name and phone number are required', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await createCustomer(newCustomer)
      const customer = res?.data || res
      setSelectedCustomer(customer)
      setShowAddCustomer(false)
      await loadCustomers() // Refresh customer list
      showNotification('Customer created successfully', 'success')
      handleNext()
    } catch {
      showNotification('Failed to create customer', 'error')
    } finally {
      setLoading(false)
    }
  }

  const addProduct = () => {
    const newProduct = { 
      id: Date.now() + Math.random(), // Unique ID
      product: null, 
      quantity: 1, 
      harga_satuan: 0,
      panjang: '',
      lebar: '',
      qtyMultiplier: 1,
      m2PerUnit: 0
    }
    setSelectedProducts([...selectedProducts, newProduct])
  }

  const updateProduct = (index, field, value) => {
    const updated = [...selectedProducts]
    updated[index][field] = value
    
    // When product changes, set default pricing
    if (field === 'product' && value) {
      // Default to the primary pricing method for the product
      if (value.ukuran_standar === 'pcs' && value.harga_per_pcs > 0) {
        updated[index].harga_satuan = value.harga_per_pcs
      } else if (value.ukuran_standar === 'm' && value.harga_per_m2 > 0) {
        updated[index].harga_satuan = value.harga_per_m2 || 25000 // Default 25k/m2
      } else {
        // Fallback to whichever price is available
        updated[index].harga_satuan = value.harga_per_pcs || value.harga_per_m2 || 25000
      }
    }

    // For m2 products, calculate total quantity based on dimensions and multiplier
    if (updated[index].product?.ukuran_standar === 'm') {
      const panjang = parseFloat(updated[index].panjang) || 0
      const lebar = parseFloat(updated[index].lebar) || 0
      const qtyMultiplier = parseFloat(updated[index].qtyMultiplier) || 1
      
      // Calculate: panjang x lebar = m2 per unit, then m2 x qty = total m2
      const m2PerUnit = panjang * lebar
      const totalM2 = m2PerUnit * qtyMultiplier
      
      // Update quantity with total m2
      updated[index].quantity = totalM2
      updated[index].m2PerUnit = m2PerUnit
    }
    
    setSelectedProducts(updated)
  }

  const removeProduct = (index) => {
    const updated = selectedProducts.filter((_, i) => i !== index)
    setSelectedProducts(updated)
  }

  const calculateTotal = () => {
    return selectedProducts.reduce((total, item) => {
      const qty = Number(item.quantity) || 0
      const price = Number(item.harga_satuan) || 0
      return total + (qty * price)
    }, 0)
  }

  const handleSubmit = async () => {
    if (!selectedCustomer || selectedProducts.length === 0) {
      showNotification('Please select customer and products', 'error')
      return
    }

    setLoading(true)
    try {
      const orderData = {
        no_hp: selectedCustomer.no_hp,
        order_details: selectedProducts.map(item => ({
          id_product: item.product?.id_produk || item.product?.id,
          qty: Number(item.quantity)
        }))
      }

      console.log('Creating order with data:', orderData) // Debug log
      
      // Show loading notification
      showNotification('Creating order...', 'info')
      
      const response = await createOrder(orderData)
      console.log('Order created successfully:', response) // Debug log
      
      // Show success with order details
      const orderDetails = `
        Order Created Successfully!
        
        📋 Order ID: ${response.data?.no_transaksi || response.data?.id || 'N/A'}
        👤 Customer: ${selectedCustomer.nama || selectedCustomer.nama_customer}
        📞 Phone: ${selectedCustomer.no_hp}
        📦 Items: ${selectedProducts.length} product(s)
        💰 Total: Rp ${calculateTotal().toLocaleString('id-ID')}
        
        ${selectedProducts.map(item => 
          `• ${item.product?.nama_produk || item.product?.name} (${item.quantity}x)`
        ).join('\n        ')}
      `.trim()
      
      showNotification(orderDetails, 'success')
      
      handleClose()
      if (onOrderCreated) onOrderCreated()
    } catch (err) {
      console.error('Failed to create order:', err) // Debug log
      showNotification(`Failed to create order: ${err.message || 'Unknown error'}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            
            {!showAddCustomer ? (
              <Box>
                {/* Customer Search Section */}
                <Box sx={{ mb: 2 }}>
                  
                  {loadingCustomers ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                      <CircularProgress size={24} />
                      <Typography sx={{ ml: 2 }}>Loading customers...</Typography>
                    </Box>
                  ) : (
                    <Autocomplete
                      options={customers}
                      getOptionLabel={(option) => `${option.nama || option.nama_customer} - ${option.no_hp}`}
                      value={selectedCustomer}
                      onChange={(_, value) => setSelectedCustomer(value)}
                      slotProps={{
                        popper: {
                          placement: 'bottom-start',
                          sx: {
                            zIndex: 1400
                          },
                          modifiers: [
                            {
                              name: 'preventOverflow',
                              options: {
                                altAxis: true,
                                altBoundary: true,
                                tether: false,
                                rootBoundary: 'document'
                              }
                            },
                            {
                              name: 'offset',
                              options: {
                                offset: [0, 4]
                              }
                            }
                          ]
                        },
                        paper: {
                          sx: {
                            maxHeight: '200px',
                            minWidth: '300px',
                            '& .MuiAutocomplete-listbox': {
                              maxHeight: '180px',
                              overflow: 'auto',
                              '&::-webkit-scrollbar': {
                                width: '8px'
                              },
                              '&::-webkit-scrollbar-track': {
                                background: 'transparent'
                              },
                              '&::-webkit-scrollbar-thumb': {
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: '4px'
                              },
                              '&::-webkit-scrollbar-thumb:hover': {
                                background: 'rgba(0,0,0,0.3)'
                              }
                            },
                            overflow: 'visible'
                          }
                        }
                      }}
                    renderInput={(params) => (
                      <TextField {...params} label="Search Customer" placeholder="Type customer name or phone number..." />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="subtitle2">{option.nama || option.nama_customer}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {option.no_hp} • {option.alamat}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    />
                  )}
                  
                  {/* Selected Customer Preview */}
                  {selectedCustomer && (
                    <Box sx={{ mt: 2, p: 2, backgroundColor: 'success.50', borderRadius: 1, border: '1px solid', borderColor: 'success.200' }}>
                      <Typography variant="body2" color="success.800" sx={{ fontWeight: 500 }}>
                        ✓ Customer Selected
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>{selectedCustomer.nama || selectedCustomer.nama_customer}</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedCustomer.no_hp} • {selectedCustomer.alamat}
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                {/* Add New Customer Button */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Can't find the customer you're looking for?
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    variant="outlined"
                    size="large"
                    onClick={() => setShowAddCustomer(true)}
                    sx={{ minWidth: '200px' }}
                  >
                    Add New Customer
                  </Button>
                </Box>
              </Box>
            ) : (
              /* Add New Customer Form */
              <Paper sx={{ p: 3, border: '1px solid #e0e0e0' }}>
                <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 500, color: 'primary.main' }}>
                  Add New Customer
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Customer Name"
                      value={newCustomer.nama}
                      onChange={(e) => setNewCustomer({ ...newCustomer, nama: e.target.value })}
                      required
                      error={!newCustomer.nama}
                      helperText={!newCustomer.nama ? "Customer name is required" : ""}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={newCustomer.no_hp}
                      onChange={(e) => setNewCustomer({ ...newCustomer, no_hp: e.target.value })}
                      required
                      error={!newCustomer.no_hp}
                      helperText={!newCustomer.no_hp ? "Phone number is required" : ""}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      multiline
                      rows={3}
                      value={newCustomer.alamat}
                      onChange={(e) => setNewCustomer({ ...newCustomer, alamat: e.target.value })}
                      placeholder="Enter customer address (optional)"
                    />
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => setShowAddCustomer(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleCreateCustomer}
                    disabled={loading || !newCustomer.nama || !newCustomer.no_hp}
                    sx={{ minWidth: '140px' }}
                  >
                    {loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} color="inherit" />
                        <span>Creating...</span>
                      </Box>
                    ) : 'Create Customer'}
                  </Button>
                </Box>
              </Paper>
            )}
          </Box>
        )

      case 1:
        return (
          <Box>
            
            {loadingProducts ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
                <Typography sx={{ ml: 2 }}>Loading products...</Typography>
              </Box>
            ) : products.length === 0 ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                No products found. Please add products in the Products page first.
              </Alert>
            ) : (
              <Box>
                {/* Products List */}
                {selectedProducts.map((item, index) => (
                  <Box key={item.id || `product-${index}`} sx={{ mb: 3 }}>
                    {/* Product Selection Row */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 1 }}>
                        {selectedProducts.length > 1 && (
                          <IconButton
                            onClick={() => removeProduct(index)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                      <Grid container spacing={2} alignItems="flex-start">
                          <Grid item xs={6} md={7}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'left' }}>
                                Item {index + 1}
                              </Typography>
                              <Autocomplete
                                fullWidth
                                options={products}
                                getOptionLabel={(option) => option.nama_produk || option.name || ''}
                                value={item.product}
                                onChange={(_, value) => updateProduct(index, 'product', value)}
                                size="small"
                                sx={{ 
                                  minWidth: 0,
                                  width: '100%',
                                  '& .MuiAutocomplete-input': {
                                    minWidth: 0
                                  },
                                  '& .MuiInputBase-root': {
                                    minWidth: '200px'
                                  }
                                }}
                                slotProps={{
                                  popper: {
                                    placement: 'bottom-start',
                                    modifiers: [
                                      {
                                        name: 'preventOverflow',
                                        options: {
                                          altAxis: true,
                                          altBoundary: true,
                                          tether: false,
                                          rootBoundary: 'viewport'
                                        }
                                      }
                                    ]
                                  },
                                  paper: {
                                    sx: {
                                      maxHeight: '200px',
                                      minWidth: '300px',
                                      '& .MuiAutocomplete-listbox': {
                                        maxHeight: '180px',
                                        overflow: 'auto',
                                      '&::-webkit-scrollbar': {
                                        width: '8px'
                                      },
                                      '&::-webkit-scrollbar-track': {
                                        background: 'transparent'
                                      },
                                      '&::-webkit-scrollbar-thumb': {
                                        background: 'rgba(0,0,0,0.2)',
                                        borderRadius: '4px'
                                      },
                                      '&::-webkit-scrollbar-thumb:hover': {
                                        background: 'rgba(0,0,0,0.3)'
                                      }
                                    },
                                    overflow: 'visible'
                                  }
                                }
                              }}
                              renderInput={(params) => (
                                <TextField 
                                  {...params} 
                                  label="Select Product" 
                                  size="small" 
                                  fullWidth 
                                  sx={{
                                    '& .MuiInputBase-input': {
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      minWidth: 0
                                    },
                                    '& .MuiAutocomplete-input': {
                                      textOverflow: 'ellipsis !important',
                                      whiteSpace: 'nowrap !important',
                                      overflow: 'hidden !important'
                                    }
                                  }}
                                />
                              )}
                              renderOption={(props, option) => (
                                <Box component="li" {...props}>
                                  <Box sx={{ width: '100%' }}>
                                    <Typography variant="body1" fontWeight={500}>
                                      {option.nama_produk || option.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {option.kategori} • {option.bahan} • {option.finishing}
                                    </Typography>
                                    <Typography variant="caption" color="primary.main">
                                      {option.ukuran_standar === 'pcs' ? 
                                        `Rp ${(option.harga_per_pcs || 0).toLocaleString('id-ID')}/pcs` :
                                        `Rp ${(option.harga_per_m2 || 0).toLocaleString('id-ID')}/m²`
                                      }
                                      {option.stock > 0 && ` • Stock: ${option.stock}`}
                                    </Typography>
                                  </Box>
                                </Box>
                              )}
                            />
                            <Typography variant="caption" color="transparent" sx={{ textAlign: 'left', minHeight: '16px' }}>
                              &nbsp;
                            </Typography>
                          </Box>
                        </Grid>
                          
                          {/* Dimensi Column - only show for m2 products */}
                          {item.product?.ukuran_standar === 'm' && (
                            <Grid item xs={3} md={2.5}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                                  Dimensi (m)
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <TextField
                                    placeholder="P"
                                    type="number"
                                    size="small"
                                    value={item.panjang || ''}
                                    onChange={(e) => updateProduct(index, 'panjang', e.target.value)}
                                    inputProps={{ min: 0, step: 0.1 }}
                                    sx={{ width: '55px' }}
                                  />
                                  <Typography variant="body2" sx={{ mx: 0.2 }}>×</Typography>
                                  <TextField
                                    placeholder="L"
                                    type="number"
                                    size="small"
                                    value={item.lebar || ''}
                                    onChange={(e) => updateProduct(index, 'lebar', e.target.value)}
                                    inputProps={{ min: 0, step: 0.1 }}
                                    sx={{ width: '55px' }}
                                  />
                                </Box>
                                <Typography variant="caption" color="primary.main" sx={{ textAlign: 'center' }}>
                                  = {(item.m2PerUnit || 0).toFixed(2)} m² /unit
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                          
                          {/* Quantity Column */}
                          <Grid item xs={item.product?.ukuran_standar === 'm' ? 3 : 6} md={item.product?.ukuran_standar === 'm' ? 2.5 : 5}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                                Qty
                              </Typography>
                              <TextField
                                type="number"
                                size="small"
                                value={item.product?.ukuran_standar === 'm' ? (item.qtyMultiplier || '') : item.quantity}
                                onChange={(e) => updateProduct(index, item.product?.ukuran_standar === 'm' ? 'qtyMultiplier' : 'quantity', e.target.value)}
                                inputProps={{ min: 1 }}
                                sx={{ 
                                  width: '90px',
                                  alignSelf: 'center',
                                  '& .MuiInputBase-root': {
                                    maxWidth: '90px'
                                  }
                                }}
                              />
                              <Typography variant="caption" color={item.product?.ukuran_standar === 'm' ? "success.main" : "transparent"} sx={{ textAlign: 'center', fontWeight: 600, minHeight: '16px' }}>
                                {item.product?.ukuran_standar === 'm' ? `Total: ${(item.quantity || 0).toFixed(2)} m²` : ''}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                    </Box>

                    {/* Product Details (when product is selected) */}
                    {item.product && (
                      <Box>
                        <Divider sx={{ my: 2 }} />
                        <Grid container spacing={2}>
                          {/* Left Column - Product Info */}
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom color="primary.main">
                              Product Details
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Typography variant="body2">
                                <strong>Category:</strong> {item.product.kategori}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Material:</strong> {item.product.bahan || 'N/A'}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Finishing:</strong> {item.product.finishing || 'N/A'}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Processing Time:</strong> {item.product.waktu_proses || 'N/A'}
                              </Typography>
                              {item.product.unit_area && (
                                <Typography variant="body2">
                                  <strong>Unit Area:</strong> {item.product.unit_area} m²
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                          
                          {/* Right Column - Pricing & Stock */}
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom color="primary.main">
                              Pricing & Stock
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Typography variant="body2">
                                <strong>Unit Type:</strong> {item.product.ukuran_standar || 'pcs'}
                              </Typography>
                              {item.product.harga_per_pcs > 0 && (
                                <Typography variant="body2">
                                  <strong>Price per PCS:</strong> Rp {item.product.harga_per_pcs.toLocaleString('id-ID')}
                                </Typography>
                              )}
                              {item.product.harga_per_m2 > 0 && (
                                <Typography variant="body2">
                                  <strong>Price per M²:</strong> Rp {item.product.harga_per_m2.toLocaleString('id-ID')}
                                </Typography>
                              )}
                              <Typography variant="body2" color={item.product.stock > 0 ? 'success.main' : 'error.main'}>
                                <strong>Stock:</strong> {item.product.stock || 0} units
                                {item.product.stock === 0 && ' (Out of Stock)'}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        {/* Pricing Summary Row */}
                        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={8}>
                              <Box sx={{ p: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  {item.product.ukuran_standar === 'm' ? (
                                    item.panjang && item.lebar ? 
                                      `${item.panjang}m × ${item.lebar}m = ${item.m2PerUnit}m² /unit × ${item.qtyMultiplier || 1} = ${item.quantity}m²` :
                                      `Total: ${item.quantity} m²`
                                  ) : (
                                    `Quantity: ${item.quantity || 0} pcs`
                                  )}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                  {item.product.ukuran_standar === 'm' ? 
                                    `${item.quantity}m² × Rp ${(item.harga_satuan || 0).toLocaleString('id-ID')}/m²` :
                                    `${item.quantity} × Rp ${(item.harga_satuan || 0).toLocaleString('id-ID')}/pcs`
                                  }
                                </Typography>
                                <Typography variant="h6" color="primary.main" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                                  Subtotal: Rp {((item.quantity || 0) * (item.harga_satuan || 0)).toLocaleString('id-ID')}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              {item.product.stock > 0 && item.quantity > item.product.stock && (
                                <Alert severity="warning" sx={{ mt: 1 }}>
                                  Quantity exceeds available stock ({item.product.stock})
                                </Alert>
                              )}
                            </Grid>
                          </Grid>
                        </Box>
                      </Box>
                    )}
                  </Box>
                ))}
                
                {/* Add Product Button */}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Button
                    startIcon={<AddIcon />}
                    variant="outlined"
                    onClick={addProduct}
                    disabled={loadingProducts}
                    size="large"
                    sx={{ 
                      minWidth: '200px',
                      borderColor: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.50'
                      }
                    }}
                  >
                    Add Another Product
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        )

      case 2:
        return (
          <Box>            
            {/* Single Column Layout */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Customer Info - Compact */}
              <Paper sx={{ p: 2, border: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2" color="primary.main" sx={{ mb: 0.5 }}>
                      Customer
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {selectedCustomer?.nama || selectedCustomer?.nama_customer}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      📞 {selectedCustomer?.no_hp}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
                      Rp {calculateTotal().toLocaleString('id-ID')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedProducts.length} item(s)
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Order Settings - Compact */}
              <Paper sx={{ p: 2, border: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <TextField
                    select
                    label="Urgency"
                    value={orderSummary.statusUrgensi}
                    onChange={(e) => setOrderSummary({ ...orderSummary, statusUrgensi: e.target.value })}
                    SelectProps={{ native: true }}
                    size="small"
                    sx={{ minWidth: 120 }}
                  >
                    <option value="normal">🟢 Normal</option>
                    <option value="urgent">🔴 Urgent</option>
                    <option value="low">🔵 Low Priority</option>
                  </TextField>
                  
                  <TextField
                    label="Notes"
                    value={orderSummary.notes}
                    onChange={(e) => setOrderSummary({ ...orderSummary, notes: e.target.value })}
                    size="small"
                    fullWidth
                    placeholder="Optional notes..."
                    multiline
                    rows={1}
                  />
                </Box>
              </Paper>

              {/* Products List - Simplified */}
              <Paper sx={{ p: 2, border: '1px solid #e0e0e0' }}>
                <Typography variant="subtitle2" color="primary.main" sx={{ mb: 1 }}>
                  Order Items
                </Typography>
                {selectedProducts.map((item, index) => (
                  <Box key={index} sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    py: 1,
                    borderBottom: index < selectedProducts.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.product?.nama_produk || item.product?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.product?.ukuran_standar === 'm' ? (
                          item.panjang && item.lebar ? 
                            `${item.panjang}m × ${item.lebar}m × ${item.qtyMultiplier || 1} = ${item.quantity}m²` :
                            `${item.quantity}m²`
                        ) : (
                          `${item.quantity} pcs`
                        )} × Rp {Number(item.harga_satuan).toLocaleString('id-ID')}
                        {item.product?.ukuran_standar === 'm' ? '/m²' : '/pcs'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Rp {(item.quantity * item.harga_satuan).toLocaleString('id-ID')}
                    </Typography>
                  </Box>
                ))}
                
                {/* Total Section */}
                <Box sx={{ mt: 2, pt: 2, borderTop: '2px solid #f0f0f0' }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 2,
                    backgroundColor: 'primary.50',
                    borderRadius: 1
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Total Amount
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      Rp {calculateTotal().toLocaleString('id-ID')}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Box>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return selectedCustomer !== null
      case 1:
        return selectedProducts.length > 0 && selectedProducts.every(item => item.product && item.quantity > 0)
      case 2:
        return true
      default:
        return false
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth={false} 
      fullWidth
      key={`add-order-modal-${open ? 'open' : 'closed'}`}
      sx={{
        '& .MuiDialog-paper': {
          minHeight: '40vh',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          /* Explicit width so MUI's maxWidth breakpoint doesn't override this */
          width: '520px',
          maxWidth: '90vw',
          minWidth: '320px'
        }
      }}
    >
      {/* HEADER - Modal Title & Step Indicator */}
      <DialogTitle sx={{ 
        borderBottom: '1px solid #e0e0e0',
        pb: 2,
        backgroundColor: '#fafafa'
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Main Title */}
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Add New Order
          </Typography>
          
          {/* Step Indicator */}
          <Stepper activeStep={activeStep} sx={{ mt: 1 }}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: activeStep === index ? 600 : 400,
                      color: activeStep === index ? 'primary.main' : 'text.secondary'
                    }}
                  >
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
          
        </Box>
      </DialogTitle>
      
      {/* BODY - Main Content */}
      <DialogContent sx={{ 
        flex: 1,
        overflow: 'auto',
        p: 0,
        position: 'relative'
      }}>
        {/* Loading Overlay */}
        {loading && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            gap: 2
          }}>
            <CircularProgress size={40} />
            <Typography variant="h6" color="primary.main">
              Creating Order...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              Please wait while we process your order
            </Typography>
          </Box>
        )}
        
        <Box sx={{ p: 2, minHeight: '200px', opacity: loading ? 0.3 : 1 }}>
          {renderStepContent(activeStep)}
        </Box>
      </DialogContent>
      
      {/* FOOTER - Navigation Buttons with Order Summary */}
      <DialogActions sx={{ 
        borderTop: '1px solid #e0e0e0',
        p: 2,
        backgroundColor: '#fafafa',
        justifyContent: 'space-between',
        flexDirection: 'column',
        gap: 2
      }}>
        {/* Order Summary - Only show when products are selected AND in step 2 only */}
        {selectedProducts.length > 0 && activeStep === 1 && (
          <Box sx={{ 
            width: '100%',
            p: 2,
            backgroundColor: 'primary.50',
            border: '1px solid',
            borderColor: 'primary.200',
            borderRadius: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box>
              <Typography variant="h6" color="primary.main" sx={{ mb: 0.5 }}>
                Order Summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Items: {selectedProducts.length}
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight={600} color="primary.main">
              Total: Rp {calculateTotal().toLocaleString('id-ID')}
            </Typography>
          </Box>
        )}
        
        {/* Navigation Buttons Row */}
        <Box sx={{ 
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Left side - Cancel button */}
          <Button 
            onClick={handleClose}
            variant="outlined"
            color="error"
            sx={{ minWidth: '100px' }}
          >
            Cancel
          </Button>
          
          {/* Right side - Navigation buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
          {activeStep > 0 && (
            <Button 
              onClick={handleBack}
              variant="outlined"
              sx={{ minWidth: '100px' }}
            >
              Back
            </Button>
          )}
          
          {activeStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              variant="contained"
              disabled={!canProceed()}
              sx={{ minWidth: '100px' }}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!canProceed() || loading}
              color="primary"
              sx={{ minWidth: '140px' }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={18} color="inherit" />
                  <Typography variant="button">Creating Order...</Typography>
                </Box>
              ) : 'Create Order'}
            </Button>
          )}
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  )
}