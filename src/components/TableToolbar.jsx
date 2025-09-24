import React, { useState, useEffect } from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem, Chip } from '@mui/material';

export default function TableToolbar({
  value = '',
  onChange = () => {},
  placeholder = 'Search',
  filterValue = '',
  onFilterChange = () => {},
  filterOptions = [],
  hideSearch = false,
  hideFilters = false,
  noWrap = false,
  statusFilters = [], // Array of status filter objects: [{ label, value, onChange, options }]
}) {
  // Local state for search input to debounce user typing
  const [localSearch, setLocalSearch] = useState(value || '')
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    // keep localSearch in sync when parent value changes (e.g. URL params changed externally)
    // Also clear localSearch when parent value becomes empty (e.g., URL cleared)
    setLocalSearch(value || '')
    if (!value) {
      setIsTyping(false) // Clear typing indicator when search is cleared
    }
  }, [value])

  // Emit a global event with debouncing to reduce performance impact
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('toolbar:search', { detail: { q: localSearch || '' } }))
        }
        setIsTyping(false) // Stop typing indicator after debounce
      } catch (err) {
        // ignore
      }
    }, 100) // Very short debounce for responsive feel but reduced events
    
    return () => clearTimeout(timer)
  }, [localSearch])

  // Listen for reset events from AppMainToolbar
  useEffect(() => {
    const handleReset = (e) => {
      try {
        if (e?.detail?.resetAll) {
          setLocalSearch('')
          setIsTyping(false)
        }
      } catch (err) {
        // ignore
      }
    }
    window.addEventListener('toolbar:reset', handleReset)
    return () => window.removeEventListener('toolbar:reset', handleReset)
  }, [])
  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: noWrap ? 'nowrap' : 'wrap' }}>
      {!hideSearch && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            size="small"
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value)
              setIsTyping(true) // Show typing indicator immediately
            }}
            placeholder={placeholder}
            InputProps={{ sx: { color: 'var(--text)' } }}
            InputLabelProps={{ sx: { color: 'var(--muted)' } }}
          />
          {isTyping && localSearch && (
            <Chip 
              label="Live" 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ 
                height: '20px', 
                fontSize: '0.7rem',
                animation: 'pulse 1.5s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 0.6 },
                  '50%': { opacity: 1 },
                  '100%': { opacity: 0.6 },
                }
              }} 
            />
          )}
        </Box>
      )}

      {!hideFilters && filterOptions && filterOptions.length > 0 && (
        <FormControl size="small">
          <InputLabel sx={{ color: 'var(--muted)' }}>Filter</InputLabel>
          <Select
            value={filterValue || ''}
            label="Filter"
            onChange={(e) => onFilterChange(e.target.value)}
            sx={{ minWidth: 140 }}
            displayEmpty
          >
            <MenuItem value="">(all)</MenuItem>
            {filterOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label || opt.value}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Status Filters (hidden when hideFilters=true) */}
      {!hideFilters && statusFilters && statusFilters.length > 0 && statusFilters.map((statusFilter, index) => (
        <FormControl key={index} size="small">
          <InputLabel sx={{ color: 'var(--muted)' }}>{statusFilter.label}</InputLabel>
          <Select
            value={statusFilter.value || ''}
            label={statusFilter.label}
            onChange={(e) => statusFilter.onChange(e.target.value)}
            sx={{ minWidth: 140 }}
            displayEmpty
          >
            <MenuItem value="">(all)</MenuItem>
            {statusFilter.options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label || opt.value}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ))}
    </Box>
  );
}
