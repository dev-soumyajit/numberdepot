'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import DeleteOutlineIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import { useSnackbar } from '@/lib/snackbar';
import { api } from '@/lib/api';

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

function getPlanLabel(plan: string): string {
  switch (plan) {
    case 'park': return 'Park';
    case 'forward': return 'Forward';
    case 'unlimited': return 'Unlimited';
    case 'business': return 'Business';
    default: return plan;
  }
}

function getPlanColor(plan: string): string {
  switch (plan) {
    case 'park': return '#4BA0A1';
    case 'forward': return '#84BD00';
    case 'unlimited': return '#E53935';
    case 'business': return '#002664';
    default: return '#002664';
  }
}

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, removeItem, refreshCart, loading: cartLoading } = useCart();
  const { showSnackbar } = useSnackbar();
  const [removing, setRemoving] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (user) {
      refreshCart();
    }
  }, [user, refreshCart]);

  if (!user) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 1 }}>Sign in to view your cart</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>You need to be logged in to manage your cart.</Typography>
          <Button component={Link} href="/login" variant="contained" color="primary">
            Sign In
          </Button>
        </Box>
      </Box>
    );
  }

  const handleRemove = async (itemId: string) => {
    setRemoving(itemId);
    try {
      await removeItem(itemId);
      showSnackbar('Item removed from cart', 'info');
    } catch {
      showSnackbar('Failed to remove item', 'error');
    } finally {
      setRemoving(null);
    }
  };

  const subtotal = items.reduce((sum, i) => sum + i.price, 0);
  const setupFees = items.reduce((sum, i) => sum + i.setupFee, 0);
  const monthlyFees = items.reduce((sum, i) => sum + i.monthlyFee, 0);
  const totalDueToday = subtotal + setupFees + monthlyFees;

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const orderRes = await api.post<{ id: string }>('/orders', {
        items: items.map((item) => ({
          phoneNumberId: item.phoneNumberId,
          listingId: item.listingId,
          planType: item.planType,
        })),
      });

      if (!orderRes.data?.id) throw new Error('Order creation failed');

      const payRes = await api.post<{ success: boolean }>(`/orders/${orderRes.data.id}/pay`);

      if (payRes.success) {
        showSnackbar('Payment successful! Your numbers are being activated.', 'success');
        await refreshCart();
        router.push('/account/orders');
      } else {
        throw new Error('Payment failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Checkout failed. Please try again.';
      showSnackbar(msg, 'error');
    } finally {
      setCheckingOut(false);
    }
  };

  if (cartLoading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '80vh' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Typography variant="h3" sx={{ mb: 1 }}>
          Shopping Cart
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {items.length} item{items.length !== 1 ? 's' : ''} in your cart
        </Typography>

        {items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <ShoppingBagIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 1 }}>
              Your cart is empty
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
              Browse our collection of phone numbers and add the ones you like to your cart.
            </Typography>
            <Button
              component={Link}
              href="/search"
              variant="contained"
              color="secondary"
              size="large"
              endIcon={<ArrowForwardIcon />}
            >
              Browse Numbers
            </Button>
          </Box>
        ) : (
          <Grid container spacing={4}>
            {/* Cart Items */}
            <Grid size={{ xs: 12, md: 8 }}>
              {items.map((item, index) => (
                <Card key={item.id} sx={{ mb: 2 }}>
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                          <Typography
                            variant="h5"
                            sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1.15rem' }}
                          >
                            {formatPhone(item.number)}
                          </Typography>
                          <Chip
                            label={item.numberType}
                            size="small"
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        </Box>
                        <Chip
                          label={`${getPlanLabel(item.planType)} Plan`}
                          size="small"
                          sx={{
                            bgcolor: getPlanColor(item.planType) + '18',
                            color: getPlanColor(item.planType),
                            fontWeight: 700,
                            fontSize: '0.75rem',
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Box sx={{ textAlign: 'right' }}>
                          {item.price > 0 && (
                            <Typography variant="body2" color="text.secondary">
                              Number: ${item.price.toFixed(2)}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary">
                            Setup: ${item.setupFee.toFixed(2)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Monthly: ${item.monthlyFee.toFixed(2)}/mo
                          </Typography>
                        </Box>
                        <IconButton
                          onClick={() => handleRemove(item.id)}
                          disabled={removing === item.id}
                          sx={{
                            color: 'text.disabled',
                            '&:hover': { color: 'error.main', bgcolor: 'error.main' + '10' },
                          }}
                        >
                          {removing === item.id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <DeleteOutlineIcon />
                          )}
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Grid>

            {/* Order Summary */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ position: { md: 'sticky' }, top: { md: 100 } }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3 }}>
                    Order Summary
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ${subtotal.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Setup Fees
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ${setupFees.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      First Month Service
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ${monthlyFees.toFixed(2)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Total Due Today
                    </Typography>
                    <Typography variant="h5" color="primary.main" sx={{ fontWeight: 800 }}>
                      ${totalDueToday.toFixed(2)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                    Then ${monthlyFees.toFixed(2)}/mo for ongoing service
                  </Typography>

                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    size="large"
                    onClick={handleCheckout}
                    disabled={checkingOut}
                    sx={{ py: 1.5, fontSize: '1.05rem', mb: 1.5 }}
                  >
                    {checkingOut ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Proceed to Checkout'
                    )}
                  </Button>

                  <Button
                    component={Link}
                    href="/search"
                    variant="text"
                    fullWidth
                    sx={{ color: 'text.secondary' }}
                  >
                    Continue Shopping
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
}
