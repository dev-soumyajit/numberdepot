'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PaidIcon from '@mui/icons-material/Paid';
import { api } from '@/lib/api';
import { useSnackbar } from '@/lib/snackbar';

interface DashboardData {
  availableBalance: number;
  pendingBalance: number;
}

interface Payout {
  id: string;
  amount: number;
  method: string;
  status: string;
  reference?: string;
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#F7941E20', text: '#E8850A' },
  processing: { bg: '#4BA0A120', text: '#4BA0A1' },
  completed: { bg: '#84BD0020', text: '#6B9A00' },
  failed: { bg: '#E74C3C20', text: '#E74C3C' },
  cancelled: { bg: '#E0E6ED', text: '#535E66' },
};

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PayoutsPage() {
  const { showSnackbar } = useSnackbar();
  const [balance, setBalance] = useState<DashboardData | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, payoutsRes] = await Promise.all([
        api.get<DashboardData>('/broker/dashboard'),
        api.get<Payout[]>('/broker/payouts'),
      ]);
      if (dashRes.data) setBalance({ availableBalance: dashRes.data.availableBalance, pendingBalance: dashRes.data.pendingBalance });
      if (payoutsRes.data) setPayouts(payoutsRes.data);
    } catch {
      showSnackbar('Failed to load payout data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRequestPayout = async () => {
    setRequesting(true);
    try {
      await api.post('/broker/payout');
      showSnackbar('Payout request submitted successfully!', 'success');
      setRequestDialogOpen(false);
      // Refresh data
      setLoading(true);
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to request payout';
      showSnackbar(message, 'error');
    } finally {
      setRequesting(false);
    }
  };

  const totalPaidOut = payouts
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const hasPendingPayout = payouts.some((p) => p.status === 'pending' || p.status === 'processing');
  const canRequestPayout = (balance?.availableBalance ?? 0) > 0 && !hasPendingPayout;

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h3" sx={{ color: '#144B6E', fontWeight: 700 }}>
            Payouts
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Request payouts and track your payout history.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<PaidIcon />}
          onClick={() => setRequestDialogOpen(true)}
          disabled={!canRequestPayout || loading}
        >
          Request Payout
        </Button>
      </Box>

      {/* Balance Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ borderLeft: '4px solid #4BA0A1' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <AccountBalanceWalletIcon sx={{ color: '#4BA0A1', fontSize: 22 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Available Balance</Typography>
              </Box>
              {loading ? <Skeleton width={120} height={40} /> : (
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#4BA0A1' }}>
                  {formatCurrency(balance?.availableBalance ?? 0)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ borderLeft: '4px solid #F7941E' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <HourglassEmptyIcon sx={{ color: '#F7941E', fontSize: 22 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Pending Balance</Typography>
              </Box>
              {loading ? <Skeleton width={120} height={40} /> : (
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#F7941E' }}>
                  {formatCurrency(balance?.pendingBalance ?? 0)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ borderLeft: '4px solid #84BD00' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <PaidIcon sx={{ color: '#84BD00', fontSize: 22 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Total Paid Out</Typography>
              </Box>
              {loading ? <Skeleton width={120} height={40} /> : (
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#84BD00' }}>
                  {formatCurrency(totalPaidOut)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {hasPendingPayout && (
        <Alert severity="info" sx={{ mb: 3, bgcolor: '#4BA0A110', color: '#4BA0A1', '& .MuiAlert-icon': { color: '#4BA0A1' } }}>
          You have a payout currently being processed. You can request another payout once it completes.
        </Alert>
      )}

      {/* Payout History */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, pb: 2 }}>
            <Typography variant="h5" sx={{ color: '#144B6E', fontWeight: 600 }}>
              Payout History
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Method</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Reference</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Requested</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Processed</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Completed</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : payouts.length > 0 ? (
                  payouts.map((payout) => {
                    const sc = statusColors[payout.status] || statusColors.cancelled;
                    return (
                      <TableRow key={payout.id} hover>
                        <TableCell sx={{ fontWeight: 700, color: '#144B6E', fontSize: '1rem' }}>
                          {formatCurrency(payout.amount)}
                        </TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{payout.method}</TableCell>
                        <TableCell>
                          {payout.reference ? (
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'text.secondary' }}>
                              {payout.reference}
                            </Typography>
                          ) : (
                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>--</Typography>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(payout.requestedAt)}</TableCell>
                        <TableCell>{payout.processedAt ? formatDate(payout.processedAt) : '--'}</TableCell>
                        <TableCell>{payout.completedAt ? formatDate(payout.completedAt) : '--'}</TableCell>
                        <TableCell>
                          <Chip
                            label={payout.status}
                            size="small"
                            sx={{ bgcolor: sc.bg, color: sc.text, fontWeight: 600, textTransform: 'capitalize' }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        No payouts yet. Request your first payout when you have available balance.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Request Payout Dialog */}
      <Dialog open={requestDialogOpen} onClose={() => setRequestDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Request Payout</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Your available balance of{' '}
            <strong style={{ color: '#4BA0A1' }}>{formatCurrency(balance?.availableBalance ?? 0)}</strong>{' '}
            will be transferred to your registered bank account.
          </DialogContentText>
          <Alert severity="info" sx={{ bgcolor: '#144B6E08' }}>
            Payouts typically take 3-5 business days to process. You will receive a confirmation email once the transfer is initiated.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRequestDialogOpen(false)} disabled={requesting}>
            Cancel
          </Button>
          <Button
            onClick={handleRequestPayout}
            variant="contained"
            color="secondary"
            disabled={requesting}
          >
            {requesting ? 'Submitting...' : 'Confirm Payout Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
