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
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HistoryIcon from '@mui/icons-material/History';
import SavingsIcon from '@mui/icons-material/Savings';
import { api } from '@/lib/api';
import { useSnackbar } from '@/lib/snackbar';

interface EarningsSummary {
  allTimeEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  availableBalance: number;
}

interface Commission {
  id: string;
  orderId: string;
  number: string;
  buyerName: string;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  status: string;
  paidAt?: string;
  createdAt: string;
}

type StatusFilter = 'all' | 'pending' | 'paid' | 'processing';

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#F7941E20', text: '#E8850A' },
  paid: { bg: '#84BD0020', text: '#6B9A00' },
  processing: { bg: '#4BA0A120', text: '#4BA0A1' },
  cancelled: { bg: '#E74C3C20', text: '#E74C3C' },
};

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const summaryCards = [
  { key: 'allTimeEarnings', label: 'All-Time Earnings', icon: AccountBalanceWalletIcon, color: '#144B6E' },
  { key: 'thisMonthEarnings', label: 'This Month', icon: CalendarMonthIcon, color: '#84BD00' },
  { key: 'lastMonthEarnings', label: 'Last Month', icon: HistoryIcon, color: '#F7941E' },
  { key: 'availableBalance', label: 'Available Balance', icon: SavingsIcon, color: '#4BA0A1' },
] as const;

export default function EarningsPage() {
  const { showSnackbar } = useSnackbar();
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, commissionsRes] = await Promise.all([
        api.get<EarningsSummary>('/commissions/summary'),
        api.get<Commission[]>(`/commissions?page=${page + 1}&limit=${rowsPerPage}${filter !== 'all' ? `&status=${filter}` : ''}`),
      ]);
      if (summaryRes.data) setSummary(summaryRes.data);
      if (commissionsRes.data) setCommissions(commissionsRes.data);
      if (commissionsRes.pagination) setTotal(commissionsRes.pagination.total);
    } catch {
      showSnackbar('Failed to load earnings data', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filter, showSnackbar]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ color: '#144B6E', fontWeight: 700 }}>
          Earnings
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Track your commissions and earnings over time.
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const value = summary ? (summary as unknown as Record<string, unknown>)[card.key] as number : 0;
          return (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.key}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: `${card.color}14`,
                    mb: 1.5,
                  }}>
                    <Icon sx={{ color: card.color, fontSize: 24 }} />
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>
                    {card.label}
                  </Typography>
                  {loading && !summary ? (
                    <Skeleton width={100} height={36} />
                  ) : (
                    <Typography variant="h4" sx={{ fontWeight: 700, color: card.color }}>
                      {formatCurrency(value)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, val) => { if (val) { setFilter(val as StatusFilter); setPage(0); } }}
          size="small"
        >
          <ToggleButton value="all" sx={{ textTransform: 'capitalize', px: 2 }}>All</ToggleButton>
          <ToggleButton value="pending" sx={{ textTransform: 'capitalize', px: 2 }}>Pending</ToggleButton>
          <ToggleButton value="processing" sx={{ textTransform: 'capitalize', px: 2 }}>Processing</ToggleButton>
          <ToggleButton value="paid" sx={{ textTransform: 'capitalize', px: 2 }}>Paid</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Commission History Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, pb: 2 }}>
            <Typography variant="h5" sx={{ color: '#144B6E', fontWeight: 600 }}>
              Commission History
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Order</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Number</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Buyer</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Sale Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Rate</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Commission</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : commissions.length > 0 ? (
                  commissions.map((c) => {
                    const sc = statusColors[c.status] || statusColors.cancelled;
                    return (
                      <TableRow key={c.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'text.secondary' }}>
                            #{c.orderId.slice(-8).toUpperCase()}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{c.number}</TableCell>
                        <TableCell>{c.buyerName}</TableCell>
                        <TableCell>{formatCurrency(c.amount)}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${(c.commissionRate * 100).toFixed(0)}%`}
                            size="small"
                            sx={{ bgcolor: '#144B6E10', color: '#144B6E', fontWeight: 700, fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#84BD00' }}>
                          {formatCurrency(c.commissionAmount)}
                        </TableCell>
                        <TableCell>{formatDate(c.createdAt)}</TableCell>
                        <TableCell>
                          <Chip
                            label={c.status}
                            size="small"
                            sx={{ bgcolor: sc.bg, color: sc.text, fontWeight: 600, textTransform: 'capitalize' }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6 }}>
                      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        {filter !== 'all' ? 'No commissions match this filter.' : 'No commissions yet.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {total > rowsPerPage && (
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
