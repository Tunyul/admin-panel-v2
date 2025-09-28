import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Grid, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import useTheme from '../hooks/useTheme';

const ACCENTS = [
  { id: 'blue', label: 'Blue', color: '#3b82f6' },
  { id: 'yellow', label: 'Yellow', color: '#fbbf24' },
  { id: 'pink', label: 'Pink', color: '#f472b6' },
  { id: 'teal', label: 'Teal', color: '#06b6d4' },
];

const FONTS = [
  { id: 'inter', label: 'Inter', css: "Inter, Poppins, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" },
  { id: 'poppins', label: 'Poppins', css: "Poppins, Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" },
  { id: 'quicksand', label: 'Quicksand', css: "Quicksand, Poppins, Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" },
];

export default function Settings() {
  const { setTokens, setOverrides, resetOverrides, reset } = useTheme();
  const [accent, setAccent] = useState(ACCENTS[0].color);
  const [font, setFont] = useState(FONTS[0].css);

  const preview = () => {
    // apply tokens locally for preview (not persisted) — use setTokens with overrides but don't persist
    setTokens({ light: { '--accent': accent, '--accent-rgb': hexToRgb(accent) }, dark: { '--accent': accent, '--accent-rgb': hexToRgb(accent) } }, {});
  };

  const save = () => {
    const overrides = { light: { '--accent': accent, '--font-primary': font }, dark: { '--accent': accent, '--font-primary': font } };
    // persist and apply
    if (setOverrides) setOverrides(overrides);
  };

  const clear = () => {
    if (resetOverrides) resetOverrides();
    reset();
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Appearance Settings</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="accent-select-label">Accent</InputLabel>
              <Select labelId="accent-select-label" value={accent} label="Accent" onChange={(e) => setAccent(e.target.value)}>
                {ACCENTS.map((a) => (
                  <MenuItem key={a.id} value={a.color}>
                    <Box component="span" sx={{ display: 'inline-block', width: 14, height: 14, bgcolor: a.color, borderRadius: '50%', mr: 1 }} /> {a.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="font-select-label">Font</InputLabel>
              <Select labelId="font-select-label" value={font} label="Font" onChange={(e) => setFont(e.target.value)}>
                {FONTS.map((f) => (
                  <MenuItem key={f.id} value={f.css}>{f.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <Button fullWidth variant="outlined" onClick={preview}>Preview</Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button fullWidth variant="contained" onClick={save}>Save</Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button fullWidth variant="text" onClick={clear}>Reset</Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Preview</Typography>
        <Box sx={{ p: 2, borderRadius: 2, background: 'var(--panel)', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }}>
          <Typography variant="h6" sx={{ color: 'var(--accent)', fontFamily: 'var(--font-primary)' }}>Accent & Font Preview</Typography>
          <Typography sx={{ color: 'var(--text)', fontFamily: 'var(--font-primary)' }}>The quick brown fox jumps over the lazy dog.</Typography>
          <Button variant="contained" sx={{ mt: 2, bgcolor: 'var(--accent)', color: 'var(--button-text)' }}>Primary</Button>
        </Box>
      </Paper>
    </Box>
  );
}

function hexToRgb(hex) {
  if (!hex) return '0,0,0';
  const c = hex.replace('#', '');
  if (c.length === 3) {
    return c.split('').map((ch) => parseInt(ch + ch, 16)).join(',');
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r},${g},${b}`;
}
