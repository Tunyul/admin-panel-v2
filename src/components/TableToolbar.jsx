import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Box, TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel, IconButton, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

function useDebouncedValue(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function TableToolbar({ value, onChange, placeholder = 'Search…', filterValue, onFilterChange, filterOptions = [], filterLabel = 'Filter', filter2Value, onFilter2Change, filter2Options = [], filter2Label = 'Filter', extraControls = null, noWrap = false }) {
  const inputRef = useRef(null);
  const [local, setLocal] = useState(value || '');
  const debounced = useDebouncedValue(local, 300);

  useEffect(() => {
    if (debounced !== value) onChange && onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  useEffect(() => {
    setLocal(value || '');
  }, [value]);

  // focus search when '/' pressed (unless focused on input-like element)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
      if (e.key === '/') {
        e.preventDefault();
        inputRef.current && inputRef.current.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filterChip = useMemo(() => {
    if (!filterValue) return null;
    const opt = filterOptions.find((o) => o.value === filterValue);
    return opt ? opt.label : filterValue;
  }, [filterValue, filterOptions]);

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: noWrap ? 'nowrap' : 'wrap', overflowX: noWrap ? 'auto' : 'visible' }}>
      <TextField
        inputRef={inputRef}
        size="small"
        variant="outlined"
        placeholder={placeholder}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'var(--muted)' }} />
            </InputAdornment>
          ),
            endAdornment: local ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setLocal('')} sx={{ color: 'var(--muted)' }} aria-label="clear search"><ClearIcon fontSize="small" /></IconButton>
            </InputAdornment>
          ) : null,
        }}
        InputLabelProps={{ sx: { color: 'var(--placeholder)' } }}
        sx={{
          minWidth: 220,
          '& .MuiOutlinedInput-root': { bgcolor: 'rgba(var(--bg-rgb),0.03)', color: 'var(--text)' },
          '& .MuiOutlinedInput-input': { color: 'var(--text)' },
          '& .MuiInputLabel-root': { color: 'var(--placeholder)' },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.08)' },
        }}
      />

      {filterOptions && filterOptions.length > 0 && (
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="tbl-filter-label" sx={{ color: '#94a3b8' }}>{filterLabel}</InputLabel>
          <Select
            labelId="tbl-filter-label"
            value={filterValue || ''}
            label={filterLabel}
            onChange={(e) => onFilterChange && onFilterChange(e.target.value)}
            MenuProps={{
              PaperProps: { sx: { bgcolor: 'var(--panel)', color: 'var(--muted)' } },
            }}
            sx={{
              '& .MuiSelect-select': { color: 'var(--text)' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.08)' },
              bgcolor: 'rgba(var(--bg-rgb),0.02)'
            }}
          >
            <MenuItem value="">(all)</MenuItem>
            {filterOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={{ color: 'var(--muted)' }}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {filter2Options && filter2Options.length > 0 && (
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="tbl-filter2-label" sx={{ color: '#94a3b8' }}>{filter2Label}</InputLabel>
          <Select
            labelId="tbl-filter2-label"
            value={filter2Value || ''}
            label={filter2Label}
            onChange={(e) => onFilter2Change && onFilter2Change(e.target.value)}
            MenuProps={{
              PaperProps: { sx: { bgcolor: 'var(--panel)', color: 'var(--muted)' } },
            }}
            sx={{
              '& .MuiSelect-select': { color: 'var(--text)' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.08)' },
              bgcolor: 'rgba(var(--bg-rgb),0.02)'
            }}
          >
            <MenuItem value="">(all)</MenuItem>
            {filter2Options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={{ color: 'var(--muted)' }}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {filterChip && (
        <Chip
          label={filterChip}
          onDelete={() => onFilterChange && onFilterChange('')}
          size="small"
          sx={{ bgcolor: 'rgba(var(--accent-rgb),0.12)', color: 'var(--text)', border: '1px solid rgba(var(--accent-rgb),0.18)' }}
        />
      )}
      {extraControls}
    </Box>
  );
}
