'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { api } from '@/lib/api';
import { useSnackbar } from '@/lib/snackbar';

interface Offer {
  id: string;
  numberId: string;
  number: string;
  listingPrice: number;
  offerAmount: number;
  counterAmount: number | null;
  buyerName: string;
  buyerEmail: string;
  sellerName: string;
  sellerEmail: string;
  buyerMessage: string;
  sellerResponse: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'accepted': return 'success';
    case 'pending': return 'warning';
    case 'countered': return 'info';
    case 'declined': case 'expired': case 'cancelled': return 'error';
    default: return 'default';
  }
};

function OfferRow({ offer }: { offer: Offer }) {
  const [open, setOpen] = useState(false);
  const diff = offer.offerAmount - offer.listingPrice;
  const pct = offer.listingPrice > 0 ? ((offer.offerAmount / offer.listingPrice) * 100).toFixed(0) : '—';

  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{offer.number}</TableCell>
        <TableCell>${offer.listingPrice.toFixed(2)}</TableCell>
        <TableCell sx={{ fontWeight: 700, color: '#84BD00' }}>${offer.offerAmount.toFixed(2)}</TableCell>
        <TableCell sx={{ color: diff < 0 ? 'error.main' : 'success.main', fontWeight: 600 }}>
          {pct}%
        </TableCell>
        <TableCell>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{offer.buyerName}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{offer.buyerEmail}</Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Chip label={offer.status} size="small" color={getStatusColor(offer.status) as any} />
        </TableCell>
        <TableCell sx={{ color: 'text.secondary' }}>
          {new Date(offer.createdAt).toLocaleDateString()}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 3, bgcolor: '#f8f9fb', borderRadius: 2, my: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Seller</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{offer.sellerName}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{offer.sellerEmail}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Number ID</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{offer.numberId}</Typography>
                </Box>
                {offer.counterAmount && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Counter Offer</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>${offer.counterAmount.toFixed(2)}</Typography>
                  </Box>
                )}
                {offer.updatedAt && offer.updatedAt !== offer.createdAt && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Last Updated</Typography>
                    <Typography variant="body2">{new Date(offer.updatedAt).toLocaleString()}</Typography>
                  </Box>
                )}
              </Box>
              {offer.buyerMessage && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Buyer Message</Typography>
                  <Typography variant="body2" sx={{ bgcolor: '#fff', p: 1, borderRadius: 1, mt: 0.5 }}>
                    {offer.buyerMessage}
                  </Typography>
                </Box>
              )}
              {offer.sellerResponse && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Seller Response</Typography>
                  <Typography variant="body2" sx={{ bgcolor: '#fff', p: 1, borderRadius: 1, mt: 0.5 }}>
                    {offer.sellerResponse}
                  </Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const { showSnackbar } = useSnackbar();

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page + 1));
      params.set('limit', String(limit));
      if (statusFilter) params.set('status', statusFilter);

      const res = await api.get<Offer[]>(`/offers/admin?${params}`);
      if (res.data) setOffers(res.data);
      if (res.pagination) setTotal(res.pagination.total);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load offers';
      showSnackbar(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, showSnackbar]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
          Offers Management{total > 0 && !loading ? ` (${total.toLocaleString()})` : ''}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          All buyer offers across the platform. Click a row to see full details including buyer/seller messages and counter offers.
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          sx={{ minWidth: 180 }}
          size="small"
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="countered">Countered</MenuItem>
          <MenuItem value="accepted">Accepted</MenuItem>
          <MenuItem value="declined">Declined</MenuItem>
          <MenuItem value="expired">Expired</MenuItem>
          <MenuItem value="cancelled">Cancelled</MenuItem>
        </TextField>
      </Box>

      {/* Table */}
      <Card sx={{ borderRadius: 3, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fb' }}>
                <TableCell sx={{ width: 48 }} />
                <TableCell sx={{ fontWeight: 600 }}>Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>List Price</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Offer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>% of Price</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Buyer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: '#002664' }} />
                  </TableCell>
                </TableRow>
              ) : offers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No offers found
                  </TableCell>
                </TableRow>
              ) : (
                offers.map((offer) => <OfferRow key={offer.id} offer={offer} />)
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Card>
    </Box>
  );
}
