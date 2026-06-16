'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import PaymentIcon from '@mui/icons-material/Payment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useSnackbar } from '@/lib/snackbar';

interface DashboardData {
  totalSales: number;
  totalRevenue: number;
  pendingBalance: number;
  availableBalance: number;
  recentSales: Array<{
    id: string;
    number: string;
    buyerName: string;
    amount: number;
    commission: number;
    date: string;
    status: string;
  }>;
  affiliateCode: string;
}

const statCards = [
  { key: 'totalSales', label: 'Total Sales', icon: ShoppingCartIcon, color: '#002664', format: 'number' },
  { key: 'totalRevenue', label: 'Total Revenue', icon: TrendingUpIcon, color: '#84BD00', format: 'currency' },
  { key: 'pendingBalance', label: 'Pending Balance', icon: HourglassEmptyIcon, color: '#E53935', format: 'currency' },
  { key: 'availableBalance', label: 'Available Balance', icon: AccountBalanceWalletIcon, color: '#4BA0A1', format: 'currency' },
] as const;

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<DashboardData>('/broker/dashboard');
        if (res.data) setData(res.data);
      } catch {
        showSnackbar('Failed to load dashboard', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showSnackbar]);

  const copyAffiliateCode = () => {
    if (data?.affiliateCode) {
      navigator.clipboard.writeText(data.affiliateCode);
      showSnackbar('Affiliate code copied to clipboard', 'success');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h3" sx={{ color: '#002664', fontWeight: 700 }}>
            Welcome back{user ? `, ${user.firstName}` : ''}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Here is an overview of your seller activity.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            component={Link}
            href="/seller/inventory/new"
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
          >
            Add Number
          </Button>
          <Button
            component={Link}
            href="/seller/payouts"
            variant="outlined"
            color="primary"
            startIcon={<PaymentIcon />}
          >
            Request Payout
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = data ? (data as unknown as Record<string, unknown>)[card.key] as number : 0;
          return (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.key}>
              <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: `${card.color}14`,
                    mb: 2,
                  }}>
                    <Icon sx={{ color: card.color, fontSize: 28 }} />
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 500 }}>
                    {card.label}
                  </Typography>
                  {loading ? (
                    <Skeleton width={100} height={36} />
                  ) : (
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#002664' }}>
                      {card.format === 'currency' ? formatCurrency(value) : value.toLocaleString()}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Affiliate Code */}
      {(loading || data?.affiliateCode) && (
        <Card sx={{ mb: 4, border: '1px dashed', borderColor: '#E53935' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AttachMoneyIcon sx={{ color: '#E53935', fontSize: 28 }} />
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Your Affiliate Code
                </Typography>
                {loading ? (
                  <Skeleton width={120} height={28} />
                ) : (
                  <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#002664' }}>
                    {data?.affiliateCode}
                  </Typography>
                )}
              </Box>
            </Box>
            <Tooltip title="Copy affiliate code">
              <IconButton onClick={copyAffiliateCode} sx={{ color: '#E53935' }}>
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
          </CardContent>
        </Card>
      )}

      {/* Recent Sales */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h5" sx={{ color: '#002664', fontWeight: 600 }}>
              Recent Sales
            </Typography>
            <Button component={Link} href="/seller/sales" size="small" sx={{ color: '#4BA0A1' }}>
              View All
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Number</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Buyer</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Commission</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.recentSales && data.recentSales.length > 0 ? (
                  data.recentSales.map((sale) => (
                    <TableRow key={sale.id} hover>
                      <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{sale.number}</TableCell>
                      <TableCell>{sale.buyerName}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{formatCurrency(sale.amount)}</TableCell>
                      <TableCell sx={{ color: '#84BD00', fontWeight: 600 }}>{formatCurrency(sale.commission)}</TableCell>
                      <TableCell>{formatDate(sale.date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={sale.status}
                          size="small"
                          sx={{
                            bgcolor: sale.status === 'completed' ? '#84BD0020' : sale.status === 'pending' ? '#E5393520' : '#E74C3C20',
                            color: sale.status === 'completed' ? '#6B9A00' : sale.status === 'pending' ? '#C62828' : '#E74C3C',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6 }}>
                      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        No sales yet. List your first number to get started.
                      </Typography>
                      <Button
                        component={Link}
                        href="/seller/inventory/new"
                        variant="contained"
                        color="secondary"
                        startIcon={<AddIcon />}
                        sx={{ mt: 2 }}
                      >
                        Add Number
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
