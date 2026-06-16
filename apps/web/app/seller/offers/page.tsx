'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
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
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { api } from '@/lib/api';
import { useSnackbar } from '@/lib/snackbar';

interface Offer {
  id: string;
  number: string;
  buyerName: string;
  buyerEmail: string;
  amount: number;
  listingPrice: number;
  counterAmount?: number;
  status: string;
  sellerResponse?: string;
  createdAt: string;
  updatedAt: string;
}

type StatusFilter = 'all' | 'pending' | 'accepted' | 'declined' | 'countered';

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#E5393520', text: '#C62828' },
  accepted: { bg: '#84BD0020', text: '#6B9A00' },
  declined: { bg: '#E74C3C20', text: '#E74C3C' },
  countered: { bg: '#4BA0A120', text: '#4BA0A1' },
  expired: { bg: '#E0E6ED', text: '#535E66' },
};

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

export default function OffersPage() {
  const { showSnackbar } = useSnackbar();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  // Dialog states
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [counterDialogOpen, setCounterDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchOffers = useCallback(async () => {
    try {
      const res = await api.get<Offer[]>('/offers/received');
      if (res.data) setOffers(res.data);
    } catch {
      showSnackbar('Failed to load offers', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const filtered = offers.filter((o) => filter === 'all' || o.status === filter);

  const pendingCount = offers.filter((o) => o.status === 'pending').length;

  const handleAccept = async () => {
    if (!selectedOffer) return;
    setProcessing(true);
    try {
      await api.put(`/offers/${selectedOffer.id}/accept`);
      showSnackbar('Offer accepted!', 'success');
      setOffers((prev) => prev.map((o) => o.id === selectedOffer.id ? { ...o, status: 'accepted' } : o));
    } catch {
      showSnackbar('Failed to accept offer', 'error');
    } finally {
      setProcessing(false);
      setAcceptDialogOpen(false);
      setSelectedOffer(null);
    }
  };

  const handleDecline = async () => {
    if (!selectedOffer) return;
    setProcessing(true);
    try {
      await api.put(`/offers/${selectedOffer.id}/decline`, { reason: declineReason });
      showSnackbar('Offer declined', 'info');
      setOffers((prev) => prev.map((o) => o.id === selectedOffer.id ? { ...o, status: 'declined' } : o));
    } catch {
      showSnackbar('Failed to decline offer', 'error');
    } finally {
      setProcessing(false);
      setDeclineDialogOpen(false);
      setDeclineReason('');
      setSelectedOffer(null);
    }
  };

  const handleCounter = async () => {
    if (!selectedOffer || !counterAmount) return;
    setProcessing(true);
    try {
      await api.put(`/offers/${selectedOffer.id}/counter`, {
        counterAmount: parseFloat(counterAmount),
        sellerResponse: counterMessage || undefined,
      });
      showSnackbar('Counter offer sent!', 'success');
      setOffers((prev) => prev.map((o) =>
        o.id === selectedOffer.id ? { ...o, status: 'countered', counterAmount: parseFloat(counterAmount) } : o
      ));
    } catch {
      showSnackbar('Failed to send counter offer', 'error');
    } finally {
      setProcessing(false);
      setCounterDialogOpen(false);
      setCounterAmount('');
      setCounterMessage('');
      setSelectedOffer(null);
    }
  };

  const openAcceptDialog = (offer: Offer) => { setSelectedOffer(offer); setAcceptDialogOpen(true); };
  const openDeclineDialog = (offer: Offer) => { setSelectedOffer(offer); setDeclineDialogOpen(true); };
  const openCounterDialog = (offer: Offer) => {
    setSelectedOffer(offer);
    setCounterAmount('');
    setCounterMessage('');
    setCounterDialogOpen(true);
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ color: '#002664', fontWeight: 700 }}>
          Offers
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Manage offers received from buyers.
          {pendingCount > 0 && (
            <Chip
              label={`${pendingCount} pending`}
              size="small"
              sx={{ ml: 1, bgcolor: '#E5393520', color: '#C62828', fontWeight: 600 }}
            />
          )}
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, val) => val && setFilter(val as StatusFilter)}
          size="small"
        >
          <ToggleButton value="all" sx={{ textTransform: 'capitalize', px: 2 }}>
            All ({offers.length})
          </ToggleButton>
          <ToggleButton value="pending" sx={{ textTransform: 'capitalize', px: 2 }}>
            Pending ({offers.filter((o) => o.status === 'pending').length})
          </ToggleButton>
          <ToggleButton value="accepted" sx={{ textTransform: 'capitalize', px: 2 }}>
            Accepted
          </ToggleButton>
          <ToggleButton value="declined" sx={{ textTransform: 'capitalize', px: 2 }}>
            Declined
          </ToggleButton>
          <ToggleButton value="countered" sx={{ textTransform: 'capitalize', px: 2 }}>
            Countered
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Number</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Buyer</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>List Price</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Offer</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Received</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((offer) => {
                  const sc = statusColors[offer.status] || statusColors.expired;
                  const isPending = offer.status === 'pending';
                  return (
                    <TableRow key={offer.id} hover sx={{ bgcolor: isPending ? '#FFFBF0' : undefined }}>
                      <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{offer.number}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{offer.buyerName}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{offer.buyerEmail}</Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{formatCurrency(offer.listingPrice)}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, color: '#002664' }}>
                          {formatCurrency(offer.amount)}
                        </Typography>
                        {offer.counterAmount && (
                          <Typography variant="caption" sx={{ color: '#4BA0A1', fontWeight: 600 }}>
                            Counter: {formatCurrency(offer.counterAmount)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={offer.status}
                          size="small"
                          sx={{ bgcolor: sc.bg, color: sc.text, fontWeight: 600, textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {timeAgo(offer.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {isPending ? (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => openAcceptDialog(offer)}
                              sx={{ bgcolor: '#84BD00', '&:hover': { bgcolor: '#6B9A00' }, minWidth: 0, px: 1.5 }}
                              startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                            >
                              Accept
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => openCounterDialog(offer)}
                              sx={{ borderColor: '#4BA0A1', color: '#4BA0A1', '&:hover': { borderColor: '#3d8485', bgcolor: '#4BA0A108' }, minWidth: 0, px: 1.5 }}
                              startIcon={<SwapHorizIcon sx={{ fontSize: 16 }} />}
                            >
                              Counter
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => openDeclineDialog(offer)}
                              sx={{ minWidth: 0, px: 1.5 }}
                              startIcon={<CancelIcon sx={{ fontSize: 16 }} />}
                            >
                              Decline
                            </Button>
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: 'text.disabled' }}>--</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                      {filter !== 'all' ? 'No offers match this filter.' : 'No offers received yet.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Accept Dialog */}
      <Dialog open={acceptDialogOpen} onClose={() => setAcceptDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Accept Offer</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Accept the offer of <strong>{selectedOffer && formatCurrency(selectedOffer.amount)}</strong> from{' '}
            <strong>{selectedOffer?.buyerName}</strong> for number <strong>{selectedOffer?.number}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAcceptDialogOpen(false)} disabled={processing}>Cancel</Button>
          <Button
            onClick={handleAccept}
            variant="contained"
            disabled={processing}
            sx={{ bgcolor: '#84BD00', '&:hover': { bgcolor: '#6B9A00' } }}
          >
            {processing ? 'Accepting...' : 'Accept Offer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={declineDialogOpen} onClose={() => setDeclineDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Decline Offer</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Decline the offer of <strong>{selectedOffer && formatCurrency(selectedOffer.amount)}</strong> from{' '}
            <strong>{selectedOffer?.buyerName}</strong>?
          </DialogContentText>
          <TextField
            label="Reason (optional)"
            fullWidth
            multiline
            rows={3}
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Let the buyer know why you are declining..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeclineDialogOpen(false)} disabled={processing}>Cancel</Button>
          <Button onClick={handleDecline} color="error" variant="contained" disabled={processing}>
            {processing ? 'Declining...' : 'Decline Offer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Counter Dialog */}
      <Dialog open={counterDialogOpen} onClose={() => setCounterDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Counter Offer</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            The buyer offered <strong>{selectedOffer && formatCurrency(selectedOffer.amount)}</strong> for{' '}
            <strong>{selectedOffer?.number}</strong> (listed at{' '}
            <strong>{selectedOffer && formatCurrency(selectedOffer.listingPrice)}</strong>).
          </DialogContentText>
          <TextField
            label="Your Counter Amount"
            fullWidth
            required
            type="number"
            value={counterAmount}
            onChange={(e) => setCounterAmount(e.target.value)}
            sx={{ mb: 2 }}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
            }}
          />
          <TextField
            label="Message (optional)"
            fullWidth
            multiline
            rows={3}
            value={counterMessage}
            onChange={(e) => setCounterMessage(e.target.value)}
            placeholder="Add a message for the buyer..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCounterDialogOpen(false)} disabled={processing}>Cancel</Button>
          <Button
            onClick={handleCounter}
            variant="contained"
            disabled={processing || !counterAmount}
            sx={{ bgcolor: '#4BA0A1', '&:hover': { bgcolor: '#3d8485' } }}
          >
            {processing ? 'Sending...' : 'Send Counter Offer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
