'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import SaveIcon from '@mui/icons-material/Save';
import BusinessIcon from '@mui/icons-material/Business';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { api } from '@/lib/api';
import { useSnackbar } from '@/lib/snackbar';

interface BrokerProfile {
  businessName: string;
  businessType: string;
  ein: string;
  bankName: string;
  bankAccountType: string;
  bankRoutingNumber: string;
  bankAccountNumber: string;
  paypalEmail: string;
  preferredPayoutMethod: string;
}

const businessTypes = [
  { value: 'individual', label: 'Individual / Sole Proprietor' },
  { value: 'llc', label: 'LLC' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'non_profit', label: 'Non-Profit' },
];

const bankAccountTypes = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
];

const payoutMethods = [
  { value: 'bank_transfer', label: 'Bank Transfer (ACH)' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'check', label: 'Check' },
];

const initialProfile: BrokerProfile = {
  businessName: '',
  businessType: 'individual',
  ein: '',
  bankName: '',
  bankAccountType: 'checking',
  bankRoutingNumber: '',
  bankAccountNumber: '',
  paypalEmail: '',
  preferredPayoutMethod: 'bank_transfer',
};

export default function SettingsPage() {
  const { showSnackbar } = useSnackbar();
  const [profile, setProfile] = useState<BrokerProfile>(initialProfile);
  const [loading, setLoading] = useState(true);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingBanking, setSavingBanking] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof BrokerProfile, string>>>({});

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get<BrokerProfile>('/broker/profile');
      if (res.data) {
        setProfile({
          businessName: res.data.businessName || '',
          businessType: res.data.businessType || 'individual',
          ein: res.data.ein || '',
          bankName: res.data.bankName || '',
          bankAccountType: res.data.bankAccountType || 'checking',
          bankRoutingNumber: res.data.bankRoutingNumber || '',
          bankAccountNumber: res.data.bankAccountNumber || '',
          paypalEmail: res.data.paypalEmail || '',
          preferredPayoutMethod: res.data.preferredPayoutMethod || 'bank_transfer',
        });
      }
    } catch {
      showSnackbar('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (field: keyof BrokerProfile) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSaveBusiness = async () => {
    const newErrors: Partial<Record<keyof BrokerProfile, string>> = {};
    if (!profile.businessName.trim()) newErrors.businessName = 'Business name is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSavingBusiness(true);
    try {
      await api.put('/broker/profile', {
        businessName: profile.businessName,
        businessType: profile.businessType,
        ein: profile.ein || undefined,
      });
      showSnackbar('Business information updated!', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update business info';
      showSnackbar(message, 'error');
    } finally {
      setSavingBusiness(false);
    }
  };

  const handleSaveBanking = async () => {
    const newErrors: Partial<Record<keyof BrokerProfile, string>> = {};
    if (profile.preferredPayoutMethod === 'bank_transfer') {
      if (!profile.bankName.trim()) newErrors.bankName = 'Bank name is required';
      if (!profile.bankRoutingNumber.trim()) newErrors.bankRoutingNumber = 'Routing number is required';
      else if (profile.bankRoutingNumber.length !== 9) newErrors.bankRoutingNumber = 'Routing number must be 9 digits';
      if (!profile.bankAccountNumber.trim()) newErrors.bankAccountNumber = 'Account number is required';
    }
    if (profile.preferredPayoutMethod === 'paypal') {
      if (!profile.paypalEmail.trim()) newErrors.paypalEmail = 'PayPal email is required';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSavingBanking(true);
    try {
      await api.put('/broker/profile', {
        bankName: profile.bankName || undefined,
        bankAccountType: profile.bankAccountType,
        bankRoutingNumber: profile.bankRoutingNumber || undefined,
        bankAccountNumber: profile.bankAccountNumber || undefined,
        paypalEmail: profile.paypalEmail || undefined,
        preferredPayoutMethod: profile.preferredPayoutMethod,
      });
      showSnackbar('Banking details updated!', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update banking details';
      showSnackbar(message, 'error');
    } finally {
      setSavingBanking(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h3" sx={{ color: '#002664', fontWeight: 700, mb: 4 }}>Settings</Typography>
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Skeleton width={200} height={32} sx={{ mb: 3 }} />
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} height={56} sx={{ mb: 2 }} />
              ))}
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ color: '#002664', fontWeight: 700 }}>
          Settings
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Manage your business information and payout preferences.
        </Typography>
      </Box>

      {/* Business Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <BusinessIcon sx={{ color: '#002664', fontSize: 24 }} />
            <Typography variant="h5" sx={{ color: '#002664', fontWeight: 600 }}>
              Business Information
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Business Name"
                fullWidth
                required
                value={profile.businessName}
                onChange={handleChange('businessName')}
                error={!!errors.businessName}
                helperText={errors.businessName}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Business Type"
                fullWidth
                select
                value={profile.businessType}
                onChange={handleChange('businessType')}
              >
                {businessTypes.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="EIN (Tax ID)"
                fullWidth
                value={profile.ein}
                onChange={handleChange('ein')}
                placeholder="XX-XXXXXXX"
                helperText="Required for tax reporting if applicable"
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveBusiness}
              disabled={savingBusiness}
              startIcon={savingBusiness ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            >
              {savingBusiness ? 'Saving...' : 'Save Business Info'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Banking & Payout Details */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <AccountBalanceIcon sx={{ color: '#4BA0A1', fontSize: 24 }} />
            <Typography variant="h5" sx={{ color: '#002664', fontWeight: 600 }}>
              Payout Details
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Preferred Payout Method"
                fullWidth
                select
                value={profile.preferredPayoutMethod}
                onChange={handleChange('preferredPayoutMethod')}
              >
                {payoutMethods.map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          {profile.preferredPayoutMethod === 'bank_transfer' && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2, fontWeight: 600 }}>
                Bank Account
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Bank Name"
                    fullWidth
                    required
                    value={profile.bankName}
                    onChange={handleChange('bankName')}
                    error={!!errors.bankName}
                    helperText={errors.bankName}
                    placeholder="e.g., Chase, Bank of America"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Account Type"
                    fullWidth
                    select
                    value={profile.bankAccountType}
                    onChange={handleChange('bankAccountType')}
                  >
                    {bankAccountTypes.map((t) => (
                      <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Routing Number"
                    fullWidth
                    required
                    value={profile.bankRoutingNumber}
                    onChange={handleChange('bankRoutingNumber')}
                    error={!!errors.bankRoutingNumber}
                    helperText={errors.bankRoutingNumber || '9-digit routing number'}
                    slotProps={{ htmlInput: { maxLength: 9 } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Account Number"
                    fullWidth
                    required
                    value={profile.bankAccountNumber}
                    onChange={handleChange('bankAccountNumber')}
                    error={!!errors.bankAccountNumber}
                    helperText={errors.bankAccountNumber}
                    type="password"
                  />
                </Grid>
              </Grid>
              <Alert severity="info" sx={{ mt: 2, bgcolor: '#00266408' }}>
                Your banking information is encrypted and stored securely. We will never share it with third parties.
              </Alert>
            </>
          )}

          {profile.preferredPayoutMethod === 'paypal' && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2, fontWeight: 600 }}>
                PayPal
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="PayPal Email"
                    fullWidth
                    required
                    type="email"
                    value={profile.paypalEmail}
                    onChange={handleChange('paypalEmail')}
                    error={!!errors.paypalEmail}
                    helperText={errors.paypalEmail || 'The email associated with your PayPal account'}
                    placeholder="you@example.com"
                  />
                </Grid>
              </Grid>
            </>
          )}

          {profile.preferredPayoutMethod === 'check' && (
            <>
              <Divider sx={{ my: 3 }} />
              <Alert severity="warning" sx={{ bgcolor: '#E5393508' }}>
                Checks are mailed to your registered business address. Please ensure your address is up to date in your account profile. Checks may take 7-10 business days to arrive.
              </Alert>
            </>
          )}

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSaveBanking}
              disabled={savingBanking}
              startIcon={savingBanking ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              sx={{ bgcolor: '#4BA0A1', '&:hover': { bgcolor: '#3d8485' } }}
            >
              {savingBanking ? 'Saving...' : 'Save Payout Details'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
