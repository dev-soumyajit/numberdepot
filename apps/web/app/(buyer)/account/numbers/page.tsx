'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import PhoneForwardedIcon from '@mui/icons-material/PhoneForwarded';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import { api } from '@/lib/api';

interface OwnedNumber {
  id: string;
  number: string;
  numberType: string;
  areaCode: string;
  planType: string;
  monthlyAmount: number;
  status: string;
  acquiredDate: string;
  forwarding: { enabled: boolean; destination: string };
}

const statusColor: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  active: 'success',
  cancelled: 'error',
  suspended: 'warning',
};

const planLabel: Record<string, string> = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
};

export default function MyNumbersPage() {
  const [numbers, setNumbers] = useState<OwnedNumber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<OwnedNumber[]>('/account/numbers').then((res) => {
      setNumbers(res.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <Box>
        <Skeleton height={60} sx={{ mb: 2 }} />
        <Skeleton height={140} sx={{ borderRadius: 2, mb: 2 }} />
        <Skeleton height={140} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>My Numbers</Typography>
        <Button component={Link} href="/search" variant="contained" size="small" startIcon={<AddIcon />}>
          Get New Number
        </Button>
      </Box>

      {numbers.length === 0 ? (
        <Alert severity="info">
          You don&apos;t have any numbers yet. Browse our marketplace to find your perfect number.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {numbers.map((num) => (
            <Grid key={num.id} size={{ xs: 12 }}>
              <Card variant="outlined" sx={{ p: 3, '&:hover': { boxShadow: 2 }, transition: '0.2s' }}>
                <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{num.number}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Chip label={num.numberType} size="small" variant="outlined" />
                      <Chip label={num.areaCode} size="small" variant="outlined" />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <Typography variant="caption" color="text.secondary">Plan</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{planLabel[num.planType] || num.planType}</Typography>
                    <Typography variant="caption" color="text.secondary">${num.monthlyAmount}/mo</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <Typography variant="caption" color="text.secondary">Status</Typography>
                    <Box>
                      <Chip label={num.status} size="small" color={statusColor[num.status] || 'default'} sx={{ fontWeight: 600 }} />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <Typography variant="caption" color="text.secondary">Forwarding</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneForwardedIcon sx={{ fontSize: 16, color: num.forwarding.enabled ? 'success.main' : 'text.disabled' }} />
                      <Typography variant="body2">{num.forwarding.enabled ? 'On' : 'Off'}</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }} sx={{ textAlign: 'right' }}>
                    <Button
                      component={Link}
                      href={`/account/numbers/${num.id}`}
                      variant="outlined"
                      size="small"
                      startIcon={<SettingsIcon />}
                    >
                      Manage
                    </Button>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
