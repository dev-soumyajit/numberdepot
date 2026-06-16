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
import Grid from '@mui/material/Grid';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { useAuth } from '@/lib/auth';
import { useSnackbar } from '@/lib/snackbar';
import { api, ApiError } from '@/lib/api';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const { showSnackbar } = useSnackbar();

  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // OTP state
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  if (user) {
    router.replace('/account');
    return null;
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email address';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post<{ message?: string; email?: string; token?: string }>('/auth/register', { email, password, firstName, lastName, role });
      if (res.data?.token) {
        // Mock fallback — immediate login (no OTP needed)
        await login(email, password);
        showSnackbar('Account created successfully! Welcome to NumberDepot.', 'success');
        router.push(role === 'seller' ? '/seller' : '/account');
      } else {
        // Real API — needs OTP verification
        showSnackbar('Verification code sent to your email!', 'success');
        setStep('otp');
        startResendCooldown();
      }
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? (err.data as { error?: string })?.error || err.message : 'Registration failed. Please try again.';
      showSnackbar(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setOtpError('Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    setOtpError('');
    try {
      const res = await api.post<{ token: string; user: { id: string; firstName: string; lastName: string; email: string; role: string } }>('/auth/verify-otp', { email, otp });
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
        // Refresh auth state
        await login(email, password);
        showSnackbar('Email verified! Welcome to NumberDepot.', 'success');
        router.push(role === 'seller' ? '/seller' : '/account');
      }
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? (err.data as { error?: string })?.error || err.message : 'Verification failed';
      setOtpError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      await api.post('/auth/resend-otp', { email });
      showSnackbar('New verification code sent!', 'success');
      startResendCooldown();
    } catch {
      showSnackbar('Failed to resend code. Please try again.', 'error');
    }
  };

  // OTP Step
  if (step === 'otp') {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', py: 6, bgcolor: 'background.paper' }}>
        <Container maxWidth="sm">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h3" sx={{ mb: 1 }}>Verify Your Email</Typography>
            <Typography variant="body1" color="text.secondary">
              We sent a 6-digit code to <strong>{email}</strong>
            </Typography>
          </Box>

          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Box component="form" onSubmit={handleVerifyOtp} noValidate>
                <TextField
                  fullWidth
                  label="Verification Code"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
                  error={!!otpError}
                  helperText={otpError || 'Enter the 6-digit code from your email'}
                  sx={{ mb: 3 }}
                  slotProps={{
                    input: {
                      sx: { fontSize: '1.5rem', letterSpacing: '0.3em', textAlign: 'center', fontWeight: 700 },
                      startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment>,
                    },
                  }}
                />
                <Button
                  type="submit" variant="contained" color="primary"
                  fullWidth size="large" disabled={loading || otp.length !== 6}
                  sx={{ py: 1.5, fontSize: '1rem', mb: 2 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Create Account'}
                </Button>
              </Box>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Didn&apos;t receive the code?{' '}
                  <Typography
                    component="button"
                    variant="body2"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0}
                    sx={{
                      color: resendCooldown > 0 ? 'text.disabled' : 'primary.main',
                      fontWeight: 700,
                      cursor: resendCooldown > 0 ? 'default' : 'pointer',
                      background: 'none',
                      border: 'none',
                      textDecoration: resendCooldown > 0 ? 'none' : 'underline',
                      p: 0,
                    }}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </Typography>
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography
                  component="button"
                  variant="body2"
                  onClick={() => setStep('register')}
                  sx={{ color: 'text.secondary', cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline', p: 0 }}
                >
                  Back to registration
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', py: 6, bgcolor: 'background.paper' }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" sx={{ mb: 1 }}>Create Your Account</Typography>
          <Typography variant="body1" color="text.secondary">
            Join NumberDepot and find your perfect phone number
          </Typography>
        </Box>

        <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            {/* Role Selection */}
            <Typography variant="subtitle2" sx={{ mb: 1.5, textAlign: 'center', color: 'text.secondary' }}>
              I want to...
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
              <Button
                fullWidth
                variant={role === 'buyer' ? 'contained' : 'outlined'}
                color="primary"
                onClick={() => setRole('buyer')}
                startIcon={<ShoppingCartIcon />}
                sx={{
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  ...(role === 'buyer' ? {} : { borderColor: 'divider', color: 'text.secondary' }),
                }}
              >
                Buy Numbers
              </Button>
              <Button
                fullWidth
                variant={role === 'seller' ? 'contained' : 'outlined'}
                onClick={() => setRole('seller')}
                startIcon={<StorefrontIcon />}
                sx={{
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  ...(role === 'seller'
                    ? { bgcolor: '#E53935', color: '#fff', '&:hover': { bgcolor: '#C62828' } }
                    : { borderColor: 'divider', color: 'text.secondary' }),
                }}
              >
                Sell Numbers
              </Button>
            </Box>

            {role === 'seller' && (
              <Box sx={{ bgcolor: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 2, p: 2, mb: 3 }}>
                <Typography variant="body2" sx={{ color: '#F57F17' }}>
                  As a seller, you can list and sell your phone numbers on our marketplace.
                  Your account will need broker approval before you can start listing.
                </Typography>
              </Box>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2} sx={{ mb: 0.5 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth label="First Name" value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); clearError('firstName'); }}
                    error={!!errors.firstName} helperText={errors.firstName}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth label="Last Name" value={lastName}
                    onChange={(e) => { setLastName(e.target.value); clearError('lastName'); }}
                    error={!!errors.lastName} helperText={errors.lastName}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> } }}
                  />
                </Grid>
              </Grid>
              <TextField
                fullWidth label="Email Address" type="email" value={email}
                onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                error={!!errors.email} helperText={errors.email}
                sx={{ mb: 2.5, mt: 2 }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> } }}
              />
              <TextField
                fullWidth label="Password" type={showPassword ? 'text' : 'password'} value={password}
                onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                error={!!errors.password} helperText={errors.password || 'Min 6 chars, 1 letter, 1 number'}
                sx={{ mb: 2.5 }}
                slotProps={{ input: {
                  startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment>,
                  endAdornment: <InputAdornment position="end"><IconButton type="button" onClick={() => setShowPassword((prev) => !prev)} onMouseDown={(e) => e.preventDefault()} edge="end" size="small">{showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}</IconButton></InputAdornment>,
                } }}
              />
              <TextField
                fullWidth label="Confirm Password" type={showPassword ? 'text' : 'password'} value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword'); }}
                error={!!errors.confirmPassword} helperText={errors.confirmPassword}
                sx={{ mb: 3 }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> } }}
              />
              <Button
                type="submit" variant="contained"
                color={role === 'seller' ? 'secondary' : 'primary'}
                fullWidth size="large" disabled={loading}
                sx={{ py: 1.5, fontSize: '1rem', mb: 2 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : (role === 'seller' ? 'Create Seller Account' : 'Create Account')}
              </Button>
            </Box>

            <Divider sx={{ my: 3 }}><Typography variant="caption" color="text.secondary">or</Typography></Divider>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Typography component={Link} href="/login" variant="body2"
                  sx={{ color: 'primary.main', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  Sign in
                </Typography>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
