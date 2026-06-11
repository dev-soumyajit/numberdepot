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
import TablePagination from '@mui/material/TablePagination';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { api } from '@/lib/api';
import { useSnackbar } from '@/lib/snackbar';

interface Sale {
  id: string;
  orderId: string;
  number: string;
  buyerName: string;
  buyerEmail: string;
  amount: number;
  commission: number;
  netAmount: number;
  type: string;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  completed: { bg: '#84BD0020', text: '#6B9A00' },
  pending: { bg: '#F7941E20', text: '#E8850A' },
  processing: { bg: '#4BA0A120', text: '#4BA0A1' },
  refunded: { bg: '#E74C3C20', text: '#E74C3C' },
  cancelled: { bg: '#E0E6ED', text: '#535E66' },
};

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SalesPage() {
  const { showSnackbar } = useSnackbar();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const fetchSales = useCallback(async () => {
    try {
      const res = await api.get<Sale[]>('/broker/sales');
      if (res.data) setSales(res.data);
    } catch {
      showSnackbar('Failed to load sales', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const filtered = sales.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.number.includes(q) || s.buyerName.toLowerCase().includes(q) || s.orderId.toLowerCase().includes(q);
  });

  const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
  const totalCommission = sales.reduce((sum, s) => sum + s.commission, 0);

  const paginatedSales = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ color: '#144B6E', fontWeight: 700 }}>
          Sales History
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
          View all your completed and pending sales.
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <ShoppingCartIcon sx={{ color: '#144B6E', fontSize: 22 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Total Sales</Typography>
              </Box>
              {loading ? <Skeleton width={80} height={36} /> : (
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#144B6E' }}>{sales.length}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <TrendingUpIcon sx={{ color: '#84BD00', fontSize: 22 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Total Revenue</Typography>
              </Box>
              {loading ? <Skeleton width={100} height={36} /> : (
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#84BD00' }}>{formatCurrency(totalRevenue)}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <TrendingUpIcon sx={{ color: '#F7941E', fontSize: 22 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Total Commission</Typography>
              </Box>
              {loading ? <Skeleton width={100} height={36} /> : (
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#F7941E' }}>{formatCurrency(totalCommission)}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <TrendingUpIcon sx={{ color: '#4BA0A1', fontSize: 22 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Net Earnings</Typography>
              </Box>
              {loading ? <Skeleton width={100} height={36} /> : (
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#4BA0A1' }}>{formatCurrency(totalRevenue - totalCommission)}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <TextField
            placeholder="Search by number, buyer, or order ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ minWidth: 320 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Order</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Number</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Buyer</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Commission</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Net</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedSales.length > 0 ? (
                paginatedSales.map((sale) => {
                  const sc = statusColors[sale.status] || statusColors.cancelled;
                  return (
                    <TableRow key={sale.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'text.secondary' }}>
                          #{sale.orderId.slice(-8).toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{sale.number}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{sale.buyerName}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{sale.buyerEmail}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={sale.type} size="small" sx={{ textTransform: 'capitalize', bgcolor: '#144B6E10', color: '#144B6E', fontWeight: 600, fontSize: '0.75rem' }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{formatCurrency(sale.amount)}</TableCell>
                      <TableCell sx={{ color: '#F7941E', fontWeight: 600 }}>{formatCurrency(sale.commission)}</TableCell>
                      <TableCell sx={{ color: '#84BD00', fontWeight: 700 }}>{formatCurrency(sale.netAmount)}</TableCell>
                      <TableCell>{formatDate(sale.createdAt)}</TableCell>
                      <TableCell>
                        <Chip
                          label={sale.status}
                          size="small"
                          sx={{ bgcolor: sc.bg, color: sc.text, fontWeight: 600, textTransform: 'capitalize' }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                      {search ? 'No sales match your search.' : 'No sales yet.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {filtered.length > rowsPerPage && (
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        )}
      </Card>
    </Box>
  );
}
