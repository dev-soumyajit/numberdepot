'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import PhoneForwardedIcon from '@mui/icons-material/PhoneForwarded';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import BusinessIcon from '@mui/icons-material/Business';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CancelIcon from '@mui/icons-material/Cancel';
import { api } from '@/lib/api';
import { useSnackbar } from '@/lib/snackbar';

interface Subscription {
  id: string;
  phoneNumber: string;
  planType: string;
  monthlyAmount: number;
  status: string;
  nextBillingDate?: string;
  startDate: string;
  number?: {
    number: string;
    numberType: string;
    areaCode: string;
  };
}

function formatPhone(num: string): string {
  const digits = num.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return num;
}

function getPlanIcon(plan: string) {
  switch (plan) {
    case 'park': return <LocalParkingIcon />;
    case 'forward': return <PhoneForwardedIcon />;
    case 'unlimited': return <AllInclusiveIcon />;
    case 'business': return <BusinessIcon />;
    default: return <PhoneIcon />;
  }
}

function getPlanColor(plan: string): string {
  switch (plan) {
    case 'park': return '#4BA0A1';
    case 'forward': return '#84BD00';
    case 'unlimited': return '#F7941E';
    case 'business': return '#144B6E';
    default: return '#144B6E';
  }
}

function getPlanLabel(plan: string): string {
  switch (plan) {
    case 'park': return 'Park';
    case 'forward': return 'Forward';
    case 'unlimited': return 'Unlimited';
    case 'business': return 'Business';
    default: return plan;
  }
}

function getStatusColor(status: string): { bg: string; text: string } {
  switch (status?.toLowerCase()) {
    case 'active':
      return { bg: '#84BD0018', text: '#6B9A00' };
    case 'past_due':
    case 'suspended':
      return { bg: '#F7941E18', text: '#E8850A' };
    case 'cancelled':
    case 'expired':
      return { bg: '#E74C3C18', text: '#E74C3C' };
    default:
      return { bg: '#144B6E18', text: '#144B6E' };
  }
}

const planOptions = [
  { key: 'park', label: 'Park', price: 2.99, icon: <LocalParkingIcon />, color: '#4BA0A1' },
  { key: 'forward', label: 'Forward', price: 6.99, icon: <PhoneForwardedIcon />, color: '#84BD00' },
  { key: 'unlimited', label: 'Unlimited', price: 19.99, icon: <AllInclusiveIcon />, color: '#F7941E' },
  { key: 'business', label: 'Business', price: 9.99, icon: <BusinessIcon />, color: '#144B6E' },
];

export default function SubscriptionsPage() {
  const { showSnackbar } = useSnackbar();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const [changePlanSub, setChangePlanSub] = useState<Subscription | null>(null);
  const [selectedNewPlan, setSelectedNewPlan] = useState('');
  const [changingPlan, setChangingPlan] = useState(false);

  const [cancelSub, setCancelSub] = useState<Subscription | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.get<Subscription[]>('/billing/subscriptions')
      .then((res) => setSubscriptions(res.data || []))
      .catch(() => showSnackbar('Failed to load subscriptions', 'error'))
      .finally(() => setLoading(false));
  }, [showSnackbar]);

  const handleChangePlan = async () => {
    if (!changePlanSub || !selectedNewPlan) return;
    setChangingPlan(true);
    try {
      await api.put(`/billing/subscriptions/${changePlanSub.id}/plan`, { planType: selectedNewPlan });
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === changePlanSub.id
            ? { ...s, planType: selectedNewPlan, monthlyAmount: planOptions.find((p) => p.key === selectedNewPlan)?.price || s.monthlyAmount }
            : s
        )
      );
      showSnackbar('Plan changed successfully', 'success');
      setChangePlanSub(null);
    } catch {
      showSnackbar('Failed to change plan', 'error');
    } finally {
      setChangingPlan(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!cancelSub) return;
    setCancelling(true);
    try {
      await api.put(`/billing/subscriptions/${cancelSub.id}/cancel`);
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === cancelSub.id ? { ...s, status: 'cancelled' } : s))
      );
      showSnackbar('Subscription cancelled', 'success');
      setCancelSub(null);
    } catch {
      showSnackbar('Failed to cancel subscription', 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const activeCount = subscriptions.filter((s) => s.status === 'active').length;
  const totalMonthly = subscriptions
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + s.monthlyAmount, 0);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Subscriptions
      </Typography>

      {/* Summary Cards */}
      {subscriptions.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 6 }}>
            <Card sx={{ bgcolor: '#144B6E08', border: '1px solid #144B6E20' }}>
              <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                <Typography variant="h4" color="primary.main" sx={{ fontWeight: 800 }}>
                  {activeCount}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Active Subscriptions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Card sx={{ bgcolor: '#84BD0008', border: '1px solid #84BD0020' }}>
              <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#84BD00' }}>
                  ${totalMonthly.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Monthly Total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <AutorenewIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              No active subscriptions
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Purchase a phone number with a service plan to see your subscriptions here.
            </Typography>
            <Button component={Link} href="/search" variant="contained" color="secondary">
              Browse Numbers
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {subscriptions.map((sub) => {
            const planColor = getPlanColor(sub.planType);
            const statusColor = getStatusColor(sub.status);
            const phoneDisplay = sub.number?.number || sub.phoneNumber;

            return (
              <Card key={sub.id} sx={{ mb: 2 }}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: planColor + '12',
                          color: planColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {getPlanIcon(sub.planType)}
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1.05rem' }}>
                          {phoneDisplay ? formatPhone(phoneDisplay) : 'Unknown Number'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                          <Chip
                            label={`${getPlanLabel(sub.planType)} Plan`}
                            size="small"
                            sx={{
                              bgcolor: planColor + '18',
                              color: planColor,
                              fontWeight: 700,
                              fontSize: '0.7rem',
                            }}
                          />
                          <Chip
                            label={sub.status}
                            size="small"
                            sx={{
                              bgcolor: statusColor.bg,
                              color: statusColor.text,
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              textTransform: 'capitalize',
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: planColor }}>
                        ${sub.monthlyAmount.toFixed(2)}
                        <Typography component="span" variant="body2" color="text.secondary">
                          /mo
                        </Typography>
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box
                    sx={{
                      display: 'flex',
                      gap: { xs: 2, sm: 4 },
                      flexWrap: 'wrap',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                      <Typography variant="body2" color="text.secondary">
                        Started:{' '}
                        {new Date(sub.startDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Typography>
                    </Box>
                    {sub.nextBillingDate && sub.status === 'active' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AutorenewIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                        <Typography variant="body2" color="text.secondary">
                          Next billing:{' '}
                          {new Date(sub.nextBillingDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Typography>
                      </Box>
                    )}
                    {sub.number?.numberType && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                        <Typography variant="body2" color="text.secondary">
                          {sub.number.numberType} ({sub.number.areaCode})
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {sub.status === 'active' && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<SwapHorizIcon />}
                          onClick={() => {
                            setChangePlanSub(sub);
                            setSelectedNewPlan(sub.planType);
                          }}
                        >
                          Change Plan
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => setCancelSub(sub)}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Change Plan Dialog */}
      <Dialog
        open={!!changePlanSub}
        onClose={() => setChangePlanSub(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Plan</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a new plan for {changePlanSub?.number?.number ? formatPhone(changePlanSub.number.number) : changePlanSub?.phoneNumber ? formatPhone(changePlanSub.phoneNumber) : 'this number'}.
          </Typography>
          <ToggleButtonGroup
            value={selectedNewPlan}
            exclusive
            onChange={(_, val) => val && setSelectedNewPlan(val)}
            orientation="vertical"
            fullWidth
          >
            {planOptions.map((plan) => (
              <ToggleButton
                key={plan.key}
                value={plan.key}
                sx={{
                  py: 1.5,
                  px: 2,
                  justifyContent: 'flex-start',
                  gap: 2,
                  textTransform: 'none',
                  textAlign: 'left',
                  border: '1px solid',
                  borderColor: selectedNewPlan === plan.key ? plan.color : 'divider',
                  '&.Mui-selected': {
                    bgcolor: plan.color + '10',
                    borderColor: plan.color,
                    '&:hover': { bgcolor: plan.color + '15' },
                  },
                }}
              >
                <Box sx={{ color: plan.color }}>{plan.icon}</Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {plan.label}
                  </Typography>
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: plan.color }}>
                  ${plan.price.toFixed(2)}/mo
                </Typography>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setChangePlanSub(null)} disabled={changingPlan}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleChangePlan}
            disabled={changingPlan || selectedNewPlan === changePlanSub?.planType}
          >
            {changingPlan ? 'Changing...' : 'Change Plan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog
        open={!!cancelSub}
        onClose={() => setCancelSub(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to cancel the subscription for{' '}
            <strong>
              {cancelSub?.number?.number ? formatPhone(cancelSub.number.number) : cancelSub?.phoneNumber ? formatPhone(cancelSub.phoneNumber) : 'this number'}
            </strong>
            ? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCancelSub(null)} disabled={cancelling}>
            Keep Subscription
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelSubscription}
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
