'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { api, ApiError } from '@/lib/api';
import { useSnackbar } from '@/lib/snackbar';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSnackbar } = useSnackbar();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  if (!token || !email) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', py: 6, bgcolor: 'background.paper' }}>
        <Container maxWidth="sm">
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ mb: 2, color: 'error.main' }}>Invalid Reset Link</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                This password reset link is invalid or has expired. Please request a new one.
              </Typography>
              <Button component={Link} href="/login" variant="contained" color="primary">
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  if (success) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', py: 6, bgcolor: 'background.paper' }}>
        <Container maxWidth="sm">
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" sx={{ mb: 1 }}>Password Reset Successfully</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Your password has been updated. You can now sign in with your new password.
              </Typography>
              <Button component={Link} href="/login" variant="contained" color="primary" size="large" sx={{ px: 5 }}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, token, password });
      setSuccess(true);
      showSnackbar('Password reset successfully!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof ApiError
        ? (err.data as { error?: string })?.error || err.message
        : 'Failed to reset password. The link may have expired.';
      showSnackbar(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', py: 6, bgcolor: 'background.paper' }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" sx={{ mb: 1 }}>Set New Password</Typography>
          <Typography variant="body1" color="text.secondary">
            Enter your new password for <strong>{email}</strong>
          </Typography>
        </Box>

        <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })); }}
                error={!!errors.password}
                helperText={errors.password || 'Minimum 8 characters'}
                sx={{ mb: 2.5 }}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton type="button" onClick={() => setShowPassword((prev) => !prev)} onMouseDown={(e) => e.preventDefault()} edge="end" size="small">
                          {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                fullWidth
                label="Confirm New Password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrors((prev) => ({ ...prev, confirmPassword: undefined })); }}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                sx={{ mb: 3 }}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment>,
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ py: 1.5, fontSize: '1rem', mb: 2 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
              </Button>
            </Box>
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Button component={Link} href="/login" variant="text" size="small" sx={{ textTransform: 'none', color: 'text.secondary' }}>
                Back to Login
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
