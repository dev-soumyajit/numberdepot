'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useSnackbar } from '@/lib/snackbar';

export default function AdminSetupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showSnackbar } = useSnackbar();

  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get<{ exists: boolean }>('/auth/admin-exists')
      .then((res) => setAdminExists(res.data?.exists ?? false))
      .catch(() => setAdminExists(true))
      .finally(() => setChecking(false));
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'Required';
    if (!lastName.trim()) e.lastName = 'Required';
    if (!email.trim()) e.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email';
    if (!password) e.password = 'Required';
    else if (password.length < 6) e.password = 'Min 6 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/auth/admin-setup', { email, password, firstName, lastName });
      await login(email, password);
      showSnackbar('Admin account created successfully!', 'success');
      router.push('/admin');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Setup failed';
      showSnackbar(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (adminExists) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#001a45' }}>
        <Container maxWidth="sm">
          <Card sx={{ textAlign: 'center', p: 4 }}>
            <AdminPanelSettingsIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h4" sx={{ mb: 2 }}>Setup Complete</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              An admin account already exists. Please use the regular login page to sign in.
            </Typography>
            <Button variant="contained" href="/login">Go to Login</Button>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 6, bgcolor: '#001a45' }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <AdminPanelSettingsIcon sx={{ fontSize: 56, color: '#E53935', mb: 1 }} />
          <Typography variant="h3" sx={{ color: '#fff', mb: 1 }}>Admin Setup</Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Create the first admin account for NumberDepot
          </Typography>
        </Box>

        <Card sx={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              This is a one-time setup. After creating the admin account, this page will be disabled.
            </Alert>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="First Name" value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    error={!!errors.firstName} helperText={errors.firstName}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Last Name" value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    error={!!errors.lastName} helperText={errors.lastName}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> } }}
                  />
                </Grid>
              </Grid>
              <TextField fullWidth label="Email Address" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!errors.email} helperText={errors.email}
                sx={{ mb: 2.5 }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> } }}
              />
              <TextField fullWidth label="Password" type={showPassword ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!errors.password} helperText={errors.password || 'Min 6 chars, 1 letter, 1 number'}
                sx={{ mb: 2.5 }}
                slotProps={{ input: {
                  startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment>,
                  endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">{showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}</IconButton></InputAdornment>,
                } }}
              />
              <TextField fullWidth label="Confirm Password" type={showPassword ? 'text' : 'password'} value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={!!errors.confirmPassword} helperText={errors.confirmPassword}
                sx={{ mb: 3 }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> } }}
              />
              <Button type="submit" variant="contained" color="secondary" fullWidth size="large"
                disabled={loading} sx={{ py: 1.5, fontSize: '1rem' }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Admin Account'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
