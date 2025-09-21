import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Box, Typography, Paper, Avatar, Card, CardContent } from '@mui/material';
import axios from 'axios';
import client from '../api/client';
import useNotificationStore from '../store/notificationStore';
import LockIcon from '@mui/icons-material/Lock';

export default function Login({ onLogin }) {
	const [form, setForm] = useState({ username: '', password: '' });
	const [loading, setLoading] = useState(false);
	const [remember, setRemember] = useState(false);
	const { showNotification } = useNotificationStore();
	const navigate = useNavigate();

	const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			// use shared API client so baseURL and auth headers are handled centrally
			const res = await client.post('/api/auth/login', form);
			localStorage.setItem('token', res.data.token);
			// notify SocketProvider (same-tab) to reconnect using the newly stored token
			try {
				window.dispatchEvent(new CustomEvent('app:socket:reconnect', { detail: { token: res.data.token } }));
			} catch (err) {
				// ignore if dispatch fails in older browsers
			}
			showNotification('Login sukses!', 'success');
			setTimeout(() => {
				setLoading(false);
				navigate('/');
				if (onLogin) onLogin();
			}, 900);
			} catch {
				showNotification('Login gagal! Periksa email/password.', 'error');
				setLoading(false);
			}
	};

	return (
		<Box className="min-h-screen flex items-center justify-center bg-transparent" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
			<div className="neon-card neon-card--yellow animate-fade-in" style={{ borderRadius: 24 }}>
				<Card sx={{ maxWidth: 320, width: '100%', borderRadius: 6, boxShadow: 'none', bgcolor: 'var(--panel)', p: 2, transition: 'box-shadow 0.3s, transform 0.3s', fontFamily: 'Inter, Arial, sans-serif', '&:hover': { boxShadow: '0 12px 48px 0 rgba(var(--accent-rgb),0.14)', transform: 'scale(1.02)' } }} className="neon-inner-glow">
					<CardContent>
					<Box display="flex" flexDirection="column" alignItems="center" mb={3}>
						<Avatar sx={{ bgcolor: 'var(--accent-2)', width: 56, height: 56, mb: 2, boxShadow: 'none', fontFamily: 'Inter, Arial, sans-serif' }}>
							<LockIcon sx={{ color: 'var(--button-text)', fontSize: 32 }} />
						</Avatar>
						<Typography variant="h6" fontWeight={700} color="#fbbf24" className="tracking-wide drop-shadow" sx={{ fontFamily: 'Quicksand, Poppins, Arial, sans-serif', textShadow: '0 2px 8px #fbbf2455', letterSpacing: 1.2, fontSize: 26 }}>CS Bot Admin</Typography>
					</Box>
					<Box component="form" onSubmit={handleSubmit} autoComplete="off" className="space-y-2">
						<TextField
							name="username"
							label="Username"
							variant="outlined"
							fullWidth
							value={form.username}
							onChange={handleChange}
							color="warning"
							InputProps={{
								style: {
									background: 'var(--input-bg)',
									color: 'var(--text)',
									borderRadius: 8,
									fontFamily: 'Poppins, Arial, sans-serif',
								},
							}}
							InputLabelProps={{
								style: {
									color: '#fbbf24',
									fontFamily: 'Poppins, Arial, sans-serif',
								},
							}}
							style={{ marginBottom: 20 }}
												sx={{
												  '& .MuiOutlinedInput-root': {
												    '&:hover .MuiOutlinedInput-notchedOutline': {
												      borderColor: '#fbbf24',
												    },
												    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
												      borderColor: '#fbbf24',
												    },
												  },
												}}
						/>
						<TextField
							name="password"
							label="Password"
							type="password"
							variant="outlined"
							fullWidth
							value={form.password}
							onChange={handleChange}
							color="warning"
							InputProps={{
								style: {
									background: 'var(--input-bg)',
									color: 'var(--text)',
									borderRadius: 8,
									fontFamily: 'Poppins, Arial, sans-serif',
								},
							}}
							InputLabelProps={{
								style: {
									color: '#fbbf24',
									fontFamily: 'Poppins, Arial, sans-serif',
								},
							}}
												sx={{
												  '& .MuiOutlinedInput-root': {
												    '&:hover .MuiOutlinedInput-notchedOutline': {
												      borderColor: '#fbbf24',
												    },
												    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
												      borderColor: '#fbbf24',
												    },
												  },
												}}
						/>
						<Box display="flex" alignItems="center" mb={2} className="gap-2" style={{ marginTop: 16 }}>
							<input type="checkbox" id="remember" checked={remember} onChange={e => setRemember(e.target.checked)} className="accent-yellow-400 scale-110" style={{ fontFamily: 'Poppins, Arial, sans-serif' }} />
							<Typography variant="body2" color="#fbbf24" sx={{ fontFamily: 'Poppins, Arial, sans-serif' }}>Remember Me</Typography>
						</Box>
						<Button
							type="submit"
							fullWidth
							variant="contained"
							color="warning"
							disabled={loading}
							sx={{
								fontWeight: 700,
								fontSize: 17,
								borderRadius: 3,
								py: 1.5,
								boxShadow: '0 2px 16px #fbbf24cc, 0 0 0 4px #3b82f655',
								mt: 1,
								mb: 2,
								background: 'linear-gradient(90deg,#fbbf24 60%,#f59e42 100%)',
								color: '#181A20',
								letterSpacing: 1.2,
								fontFamily: 'Quicksand, Poppins, Arial, sans-serif',
								transition: 'background 0.3s, transform 0.2s, box-shadow 0.3s',
								'&:hover': {
									background: 'linear-gradient(90deg,#f59e42 60%,#fbbf24 100%)',
									transform: 'scale(1.04)',
									boxShadow: '0 4px 24px #fbbf24ee, 0 0 0 6px #3b82f6aa',
								},
							}}
						>
							Masuk
						</Button>
					</Box>
					<Typography variant="caption" color="#bbb" align="center" sx={{ mt: 3, display: 'block', letterSpacing: 1, fontFamily: 'Inter, Arial, sans-serif' }}>© 2025 CS Bot Admin. All rights reserved.</Typography>
					</CardContent>
				</Card>
			</div>
			<style>{`
					.animate-fade-in { animation: fadeIn 0.7s cubic-bezier(.4,0,.2,1); }
					@keyframes fadeIn { from { opacity: 0; transform: translateY(24px) scale(0.98); } to { opacity: 1; transform: none; } }
					.animate-shake { animation: shake 0.3s linear; }
					@keyframes shake { 0% { transform: translateX(0); } 25% { transform: translateX(-4px); } 50% { transform: translateX(4px); } 75% { transform: translateX(-4px); } 100% { transform: translateX(0); } }
				`}</style>
			</Box>
	);
}
