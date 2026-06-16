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
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Alert from '@mui/material/Alert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { useAuth } from '@/lib/auth';
import { useSnackbar } from '@/lib/snackbar';
import { api } from '@/lib/api';

const businessTypes = [
  { value: 'individual', label: 'Individual / Sole Proprietor' },
  { value: 'llc', label: 'LLC' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'nonprofit', label: 'Non-Profit' },
];

export default function BrokerApplyPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { showSnackbar } = useSnackbar();

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('individual');
  const [ein, setEin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    router.replace('/login');
    return null;
  }

  const validate = () => {
    const e: Record<string, string> = {};
    if (!businessName.trim()) e.businessName = 'Business name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post('/broker/apply', { businessName, businessType, ein: ein || undefined });
      setSubmitted(true);
      showSnackbar('Application submitted successfully!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Application failed';
      showSnackbar(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 6, bgcolor: 'background.paper' }}>
        <Container maxWidth="sm">
          <Card sx={{ textAlign: 'center', p: 5, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CheckCircleIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" sx={{ mb: 2 }}>Application Submitted!</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              Thank you, {user.firstName}. Your broker application is now under review.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Our team will review your application and send you an email once it is approved.
              This usually takes 1-2 business days.
            </Typography>

            <Stepper activeStep={1} alternativeLabel sx={{ mb: 4 }}>
              <Step completed><StepLabel>Register</StepLabel></Step>
              <Step completed><StepLabel>Apply</StepLabel></Step>
              <Step><StepLabel>Admin Review</StepLabel></Step>
              <Step><StepLabel>Start Selling</StepLabel></Step>
            </Stepper>

            <Button variant="contained" component={Link} href="/">Go to Homepage</Button>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 6, bgcolor: 'background.paper' }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <StorefrontIcon sx={{ fontSize: 56, color: '#E53935', mb: 1 }} />
          <Typography variant="h3" sx={{ mb: 1 }}>Become a Seller</Typography>
          <Typography variant="body1" color="text.secondary">
            Apply to sell phone numbers on NumberDepot marketplace
          </Typography>
        </Box>

        <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mb: 3 }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              After submitting, our admin team will review your application.
              Once approved, you can start listing and selling numbers.
            </Alert>

            <Stepper activeStep={1} alternativeLabel sx={{ mb: 4 }}>
              <Step completed><StepLabel>Register</StepLabel></Step>
              <Step><StepLabel>Apply</StepLabel></Step>
              <Step><StepLabel>Admin Review</StepLabel></Step>
              <Step><StepLabel>Start Selling</StepLabel></Step>
            </Stepper>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Typography variant="subtitle2" sx={{ mb: 0.5, color: 'text.secondary' }}>
                Your Info
              </Typography>
              <Box sx={{ bgcolor: '#F5F7FA', borderRadius: 2, p: 2, mb: 3 }}>
                <Typography variant="body2">
                  <strong>{user.firstName} {user.lastName}</strong> ({user.email})
                </Typography>
              </Box>

              <TextField
                fullWidth label="Business / Company Name" value={businessName}
                onChange={(e) => { setBusinessName(e.target.value); setErrors({}); }}
                error={!!errors.businessName} helperText={errors.businessName || 'Name under which you operate'}
                sx={{ mb: 2.5 }}
              />

              <TextField
                fullWidth select label="Business Type" value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                sx={{ mb: 2.5 }}
              >
                {businessTypes.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth label="EIN (optional)" value={ein}
                onChange={(e) => setEin(e.target.value)}
                helperText="Employer Identification Number. Required for business entities, optional for individuals."
                sx={{ mb: 3 }}
              />

              <Button type="submit" variant="contained" color="secondary" fullWidth size="large"
                disabled={submitting} sx={{ py: 1.5, fontSize: '1rem' }}>
                {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Application'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
