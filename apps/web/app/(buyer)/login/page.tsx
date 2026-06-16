'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '@/lib/auth';
import { useSnackbar } from '@/lib/snackbar';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const { showSnackbar } = useSnackbar();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Forgot password state
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  if (user) {
    // Redirect based on role
    if (user.role === 'admin' || user.role === 'super_admin') {
      router.replace('/admin');
    } else if (user.role === 'seller') {
      router.replace('/seller');
    } else {
      router.replace('/account');
    }
    return null;
  }

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email address';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email, password);
      showSnackbar('Welcome back!', 'success');
      // useAuth store will update user, then the redirect above will fire on re-render
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      showSnackbar(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !/\S+@\S+\.\S+/.test(forgotEmail)) {
      showSnackbar('Please enter a valid email address', 'error');
      return;
    }
    setForgotLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotSent(true);
      showSnackbar('If the email exists, a reset link has been sent', 'success');
    } catch {
      showSnackbar('If the email exists, a reset link has been sent', 'success');
      setForgotSent(true);
    } finally {
      setForgotLoading(false);
    }
  };

  // Forgot Password View
  if (forgotMode) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', py: 6, bgcolor: 'background.paper' }}>
        <Container maxWidth="sm">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h3" sx={{ mb: 1 }}>Reset Password</Typography>
            <Typography variant="body1" color="text.secondary">
              Enter your email and we&apos;ll send you a reset link
            </Typography>
          </Box>
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              {forgotSent ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1, color: 'success.main' }}>Check Your Email</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    If an account exists with that email, you&apos;ll receive a password reset link shortly.
                  </Typography>
                  <Button variant="outlined" onClick={() => { setForgotMode(false); setForgotSent(false); }}>
                    Back to Login
                  </Button>
                </Box>
              ) : (
                <Box component="form" onSubmit={handleForgotPassword} noValidate>
                  <TextField
                    fullWidth label="Email Address" type="email" value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    sx={{ mb: 3 }}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> } }}
                  />
                  <Button type="submit" variant="contained" color="primary" fullWidth size="large"
                    disabled={forgotLoading} sx={{ py: 1.5, fontSize: '1rem', mb: 2 }}>
                    {forgotLoading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
                  </Button>
                  <Box sx={{ textAlign: 'center' }}>
                    <Button variant="text" size="small" onClick={() => setForgotMode(false)}>
                      Back to Login
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  // Login View
  return (
    <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', py: 6, bgcolor: 'background.paper' }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" sx={{ mb: 1 }}>Welcome Back</Typography>
          <Typography variant="body1" color="text.secondary">
            Sign in to your NumberDepot account
          </Typography>
        </Box>

        <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth label="Email Address" type="email" value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }}
                error={!!errors.email} helperText={errors.email}
                sx={{ mb: 2.5 }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> } }}
              />
              <TextField
                fullWidth label="Password" type={showPassword ? 'text' : 'password'} value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })); }}
                error={!!errors.password} helperText={errors.password}
                sx={{ mb: 1 }}
                slotProps={{ input: {
                  startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment>,
                  endAdornment: <InputAdornment position="end"><IconButton type="button" onClick={() => setShowPassword((prev) => !prev)} onMouseDown={(e) => e.preventDefault()} edge="end" size="small">{showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}</IconButton></InputAdornment>,
                } }}
              />
              <Box sx={{ textAlign: 'right', mb: 2.5 }}>
                <Button variant="text" size="small" onClick={() => setForgotMode(true)}
                  sx={{ textTransform: 'none', color: 'text.secondary', fontSize: '0.8125rem', '&:hover': { color: 'primary.main' } }}>
                  Forgot Password?
                </Button>
              </Box>
              <Button type="submit" variant="contained" color="primary" fullWidth size="large"
                disabled={loading} sx={{ py: 1.5, fontSize: '1rem', mb: 2 }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
            </Box>

            <Divider sx={{ my: 3 }}><Typography variant="caption" color="text.secondary">or</Typography></Divider>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don&apos;t have an account?{' '}
                <Typography component={Link} href="/register" variant="body2"
                  sx={{ color: 'secondary.main', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  Create one now
                </Typography>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
