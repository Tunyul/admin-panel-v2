import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Typography,
  Box,
  Divider,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material'
import {
  Close as CloseIcon,
  RestartAlt as ResetIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ViewColumn as ViewColumnIcon,
  Settings as SettingsIcon,
  SaveAlt as SaveIcon,
  CloudUpload as ImportIcon
} from '@mui/icons-material'
import { useTableColumns } from '../hooks/useTableSettings'

const ColumnSettingsDialog = ({ open, onClose, tableId, title = 'Pengaturan Kolom Tabel' }) => {
  const {
    columnConfig,
    columnVisibility,
    visibleColumns,
    hiddenColumns,
    toggleColumn,
    resetColumnVisibility,
    showAllColumns,
    hideAllColumns
  } = useTableColumns(tableId)

  const [presetName, setPresetName] = useState('')
  const [showPresetInput, setShowPresetInput] = useState(false)

  // Save current settings as preset
  const savePreset = () => {
    if (presetName.trim()) {
      const preset = {
        name: presetName,
        columnVisibility,
        createdAt: new Date().toISOString()
      }
      
      const savedPresets = JSON.parse(localStorage.getItem(`table-presets-${tableId}`) || '[]')
      savedPresets.push(preset)
      localStorage.setItem(`table-presets-${tableId}`, JSON.stringify(savedPresets))
      
      setPresetName('')
      setShowPresetInput(false)
      
      // Show notification
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('show-notification', { 
          detail: { message: `Preset "${preset.name}" disimpan`, type: 'success' } 
        }))
      }
    }
  }

  // Load preset
  const loadPreset = (preset) => {
    if (preset.columnVisibility) {
      columnConfig.forEach(col => {
        const shouldShow = preset.columnVisibility[col.key] !== false
        if (shouldShow !== (columnVisibility[col.key] !== false)) {
          toggleColumn(col.key)
        }
      })
      
      // Show notification
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('show-notification', { 
          detail: { message: `Preset "${preset.name}" dimuat`, type: 'success' } 
        }))
      }
    }
  }

  // Get saved presets
  const savedPresets = JSON.parse(localStorage.getItem(`table-presets-${tableId}`) || '[]')

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <ViewColumnIcon />
            <Typography variant="h6">{title}</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Summary */}
          <Alert severity="info" variant="outlined">
            <Typography variant="body2">
              Menampilkan <strong>{visibleColumns.length}</strong> dari <strong>{columnConfig.length}</strong> kolom.
              {hiddenColumns.length > 0 && ` ${hiddenColumns.length} kolom disembunyikan.`}
            </Typography>
          </Alert>

          {/* Quick Actions */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Aksi Cepat
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                startIcon={<VisibilityIcon />}
                variant="outlined"
                size="small"
                onClick={showAllColumns}
              >
                Tampilkan Semua
              </Button>
              <Button
                startIcon={<VisibilityOffIcon />}
                variant="outlined"
                size="small"
                onClick={() => hideAllColumns(['id', 'actions'])}
              >
                Sembunyikan Semua
              </Button>
              <Button
                startIcon={<ResetIcon />}
                variant="outlined"
                size="small"
                onClick={resetColumnVisibility}
              >
                Reset ke Default
              </Button>
            </Stack>
          </Box>

          <Divider />

          {/* Column Visibility Settings */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Pengaturan Kolom
            </Typography>
            <FormGroup>
              {columnConfig.map((column) => {
                const isVisible = columnVisibility[column.key] !== false
                const isRequired = ['id', 'actions'].includes(column.key)
                
                return (
                  <FormControlLabel
                    key={column.key}
                    control={
                      <Checkbox
                        checked={isVisible}
                        onChange={() => toggleColumn(column.key)}
                        disabled={isRequired}
                      />
                    }
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2">
                          {column.label}
                        </Typography>
                        {isRequired && (
                          <Chip
                            label="Wajib"
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                        {column.sortable && (
                          <Chip
                            label="Sortable"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                  />
                )
              })}
            </FormGroup>
          </Box>

          <Divider />

          {/* Presets */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Preset Pengaturan
            </Typography>
            
            {/* Save new preset */}
            <Box mb={2}>
              {showPresetInput ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <input
                    type="text"
                    placeholder="Nama preset..."
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px',
                      flex: 1
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && savePreset()}
                  />
                  <Button
                    onClick={savePreset}
                    disabled={!presetName.trim()}
                    startIcon={<SaveIcon />}
                    variant="contained"
                    size="small"
                  >
                    Simpan
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPresetInput(false)
                      setPresetName('')
                    }}
                    variant="outlined"
                    size="small"
                  >
                    Batal
                  </Button>
                </Stack>
              ) : (
                <Button
                  onClick={() => setShowPresetInput(true)}
                  startIcon={<SaveIcon />}
                  variant="outlined"
                  size="small"
                >
                  Simpan sebagai Preset
                </Button>
              )}
            </Box>

            {/* Saved presets */}
            {savedPresets.length > 0 && (
              <List dense>
                {savedPresets.map((preset, index) => (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      <SettingsIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={preset.name}
                      secondary={`Dibuat: ${new Date(preset.createdAt).toLocaleString()}`}
                    />
                    <ListItemSecondaryAction>
                      <Button
                        onClick={() => loadPreset(preset)}
                        size="small"
                        startIcon={<ImportIcon />}
                      >
                        Muat
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
            
            {savedPresets.length === 0 && (
              <Typography variant="body2" color="textSecondary" style={{ fontStyle: 'italic' }}>
                Belum ada preset tersimpan.
              </Typography>
            )}
          </Box>
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Selesai
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ColumnSettingsDialog