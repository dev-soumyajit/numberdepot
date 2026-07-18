'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import PeopleIcon from '@mui/icons-material/People';
import PhoneIcon from '@mui/icons-material/Phone';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { api } from '@/lib/api';
import { useSnackbar } from '@/lib/snackbar';

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
}

interface RecentOffer {
  id: string;
  number: string;
  offerAmount: number;
  listingPrice: number;
  status: string;
  createdAt: string;
}

interface DashboardMetrics {
  totalUsers: number;
  totalNumbers: number;
  totalOrders: number;
  totalRevenue: number;
  newUsersThisMonth: number;
  pendingBrokers: number;
  recentOrders: RecentOrder[];
  recentOffers: RecentOffer[];
}

const statCardConfig = [
  { key: 'totalUsers', label: 'Total Users', icon: <PeopleIcon />, color: '#002664', format: 'number' },
  { key: 'totalNumbers', label: 'Total Numbers', icon: <PhoneIcon />, color: '#4BA0A1', format: 'number' },
  { key: 'totalOrders', label: 'Total Orders', icon: <ShoppingCartIcon />, color: '#84BD00', format: 'number' },
  { key: 'totalRevenue', label: 'Total Revenue', icon: <AttachMoneyIcon />, color: '#E53935', format: 'currency' },
  { key: 'newUsersThisMonth', label: 'New Users This Month', icon: <PersonAddIcon />, color: '#7B68EE', format: 'number' },
  { key: 'pendingBrokers', label: 'Pending Brokers', icon: <PendingActionsIcon />, color: '#E74C3C', format: 'number' },
] as const;

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': case 'accepted': return 'success';
    case 'pending': return 'warning';
    case 'processing': case 'countered': return 'info';
    case 'cancelled': case 'failed': case 'declined': case 'expired': return 'error';
    default: return 'default';
  }
};

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { showSnackbar } = useSnackbar();
  const router = useRouter();

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await api.get<DashboardMetrics>('/admin/dashboard');
        if (res.data) setMetrics(res.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load dashboard';
        showSnackbar(message, 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, [showSnackbar]);

  const formatValue = (value: number | undefined, format: string) => {
    const v = value ?? 0;
    if (format === 'currency') return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    return v.toLocaleString();
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
            Admin Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Overview of your platform performance
          </Typography>
        </Box>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCardConfig.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={stat.key}>
            <Card
              sx={{
                borderRadius: 3,
                border: 'none',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: `${stat.color}14`,
                      color: stat.color,
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
                {loading ? (
                  <>
                    <Skeleton width={100} height={36} />
                    <Skeleton width={80} height={20} />
                  </>
                ) : (
                  <>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e', mb: 0.5 }}>
                      {metrics ? formatValue(metrics[stat.key], stat.format) : '--'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {stat.label}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Orders & Offers */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Recent Orders */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                  Recent Orders
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => router.push('/admin/orders')}
                  sx={{ textTransform: 'none', fontWeight: 600, color: '#002664' }}
                >
                  View All
                </Button>
              </Box>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} height={48} sx={{ mb: 1 }} />
                ))
              ) : !metrics?.recentOrders?.length ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', py: 3, textAlign: 'center' }}>
                  No orders yet
                </Typography>
              ) : (
                metrics.recentOrders.map((order, i) => (
                  <Box key={order.id}>
                    {i > 0 && <Divider sx={{ my: 1.5 }} />}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                          {order.orderNumber}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {order.itemCount} item{order.itemCount !== 1 ? 's' : ''} &middot; {new Date(order.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          ${order.totalAmount.toFixed(2)}
                        </Typography>
                        <Chip label={order.status} size="small" color={getStatusColor(order.status) as any} sx={{ height: 20, fontSize: '0.7rem' }} />
                      </Box>
                    </Box>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Offers */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                  Recent Offers
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => router.push('/admin/offers')}
                  sx={{ textTransform: 'none', fontWeight: 600, color: '#002664' }}
                >
                  View All
                </Button>
              </Box>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} height={48} sx={{ mb: 1 }} />
                ))
              ) : !metrics?.recentOffers?.length ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', py: 3, textAlign: 'center' }}>
                  No offers yet
                </Typography>
              ) : (
                metrics.recentOffers.map((offer, i) => (
                  <Box key={offer.id}>
                    {i > 0 && <Divider sx={{ my: 1.5 }} />}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                          {offer.number}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Listed: ${offer.listingPrice.toFixed(2)} &middot; {new Date(offer.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#84BD00' }}>
                          ${offer.offerAmount.toFixed(2)}
                        </Typography>
                        <Chip label={offer.status} size="small" color={getStatusColor(offer.status) as any} sx={{ height: 20, fontSize: '0.7rem' }} />
                      </Box>
                    </Box>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a2e', mb: 2 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={2}>
        {[
          { label: 'Manage Numbers', href: '/admin/numbers', color: '#002664' },
          { label: 'View Users', href: '/admin/users', color: '#4BA0A1' },
          { label: 'Broker Applications', href: '/admin/brokers', color: '#E53935' },
          { label: 'View Orders', href: '/admin/orders', color: '#84BD00' },
          { label: 'Commissions', href: '/admin/commissions', color: '#7B68EE' },
          { label: 'Platform Settings', href: '/admin/settings', color: '#E74C3C' },
        ].map((action) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={action.href}>
            <Button
              fullWidth
              variant="outlined"
              endIcon={<ArrowForwardIcon />}
              onClick={() => router.push(action.href)}
              sx={{
                py: 2,
                px: 3,
                justifyContent: 'space-between',
                borderColor: `${action.color}30`,
                color: action.color,
                fontWeight: 600,
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                  borderColor: action.color,
                  bgcolor: `${action.color}08`,
                },
              }}
            >
              {action.label}
            </Button>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
