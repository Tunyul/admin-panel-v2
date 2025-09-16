import LogoutButton from './LogoutButton';
import ThemeSwitcher from './ThemeSwitcher';

import React, { useState } from 'react';
import NotificationBell from './Notification';
import { TextField, InputAdornment, IconButton, Box, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export default function Header() {
  const [search, setSearch] = useState('');
    return (
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#181A20',
          borderRadius: 0,
          boxShadow: 'none',
          mt: 0,
          mb: 3,
          position: 'relative',
          overflow: 'visible',
        }}
      >
        <h1
          className="text-3xl font-extrabold tracking-wide animate-glow"
          style={{
            color: '#fbbf24',
            fontFamily: 'Quicksand, Poppins, Comic Sans MS, Arial, sans-serif',
            paddingLeft: 32,
            textShadow: '0 0 12px #fbbf24, 0 0 32px #3b82f6',
            letterSpacing: 2,
            filter: 'drop-shadow(0 0 8px #fbbf24cc)',
          }}
        >
          ✨ CS Bot Admin ✨
        </h1>
        <Box display="flex" alignItems="center" gap={2.5} sx={{ pr: 4 }}>
          <TextField
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari..."
            size="small"
            variant="outlined"
            sx={{
              minWidth: 180,
              bgcolor: '#232946',
              borderRadius: 3,
              input: {
                color: '#fff',
                fontFamily: 'Poppins, Arial, sans-serif',
                fontWeight: 500,
                letterSpacing: 1,
              },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6', boxShadow: '0 0 8px #3b82f6cc' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#f472b6', boxShadow: '0 0 12px #f472b6cc' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fbbf24', boxShadow: '0 0 16px #fbbf24cc' },
              '& .MuiInputBase-root': { bgcolor: '#232946', borderRadius: 3 },
              '& .MuiInputAdornment-root': { color: '#fbbf24' },
              transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" edge="end" sx={{ color: '#f472b6', transition: 'color 0.2s', '&:hover': { color: '#fbbf24' } }}>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{
            bgcolor: '#232946',
            borderRadius: 2,
            p: 1,
            boxShadow: '0 0 8px #3b82f6cc',
            display: 'flex',
            alignItems: 'center',
            transition: 'box-shadow 0.2s',
            '&:hover': { boxShadow: '0 0 16px #fbbf24cc' },
          }}>
            <NotificationBell />
          </Box>
          <Box sx={{
            bgcolor: '#232946',
            borderRadius: 2,
            p: 1,
            boxShadow: '0 0 8px #f472b6cc',
            display: 'flex',
            alignItems: 'center',
            transition: 'box-shadow 0.2s',
            '&:hover': { boxShadow: '0 0 16px #3b82f6cc' },
          }}>
            <ThemeSwitcher />
          </Box>
          <Box sx={{
            bgcolor: '#232946',
            borderRadius: 2,
            p: 1,
            boxShadow: '0 0 8px #fbbf24cc',
            display: 'flex',
            alignItems: 'center',
            transition: 'box-shadow 0.2s',
            '&:hover': { boxShadow: '0 0 16px #f472b6cc' },
          }}>
            <LogoutButton />
          </Box>
        </Box>
        <style>{`
          .animate-glow {
            animation: glow 1.5s ease-in-out infinite alternate;
          }
          @keyframes glow {
            from { text-shadow: 0 0 12px #fbbf24, 0 0 32px #3b82f6; }
            to { text-shadow: 0 0 24px #f472b6, 0 0 48px #fbbf24; }
          }
        `}</style>
      </Paper>
    );
}
