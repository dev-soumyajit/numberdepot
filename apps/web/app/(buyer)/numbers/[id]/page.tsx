'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Skeleton from '@mui/material/Skeleton';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import PhoneIcon from '@mui/icons-material/Phone';
import StarIcon from '@mui/icons-material/Star';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import PhoneForwardedIcon from '@mui/icons-material/PhoneForwarded';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import BusinessIcon from '@mui/icons-material/Business';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { api } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import { useSnackbar } from '@/lib/snackbar';

interface NumberDetail {
  id: string;
  number: string;
  numberType: string;
  areaCode: string;
  salePrice?: number;
  licensePrice?: number;
  vanityText?: string;
  isPremium?: boolean;
  isPortable?: boolean;
  description?: string;
  listingId?: string;
  allowOffers?: boolean;
  minimumOffer?: number;
  seller?: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
  };
  features?: string[];
  relatedNumbers?: NumberDetail[];
}

const planDetails = [
  {
    key: 'park',
    label: 'Park',
    price: 2.99,
    icon: <LocalParkingIcon />,
    color: '#4BA0A1',
    description: 'Reserve the number with voicemail greeting and email notifications.',
    features: ['Custom voicemail greeting', 'Email notifications', 'Number protection'],
  },
  {
    key: 'forward',
    label: 'Forward',
    price: 6.99,
    icon: <PhoneForwardedIcon />,
    color: '#84BD00',
    description: 'Forward incoming calls to any phone number of your choice.',
    features: ['Forward to any phone', 'Caller ID passthrough', 'Scheduled forwarding', 'All Park features'],
  },
  {
    key: 'unlimited',
    label: 'Unlimited',
    price: 19.99,
    icon: <AllInclusiveIcon />,
    color: '#F7941E',
    description: 'Full calling and SMS capabilities with voicemail to email.',
    features: ['Unlimited calling', 'SMS messaging', 'Voicemail to email', 'All Forward features'],
  },
  {
    key: 'business',
    label: 'Business',
    price: 9.99,
    icon: <BusinessIcon />,
    color: '#144B6E',
    description: 'Professional features including auto-attendant and call analytics.',
    features: ['Auto-attendant', 'Business hours routing', 'Call analytics', 'Professional greeting'],
  },
];

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

function getTypeColor(type: string): string {
  switch (type?.toLowerCase()) {
    case 'toll-free': return '#4BA0A1';
    case 'vanity': return '#F7941E';
    case 'local': return '#84BD00';
    default: return '#144B6E';
  }
}

export default function NumberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { showSnackbar } = useSnackbar();

  const [number, setNumber] = useState<NumberDetail | null>(null);
  const [related, setRelated] = useState<NumberDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('park');
  const [addingToCart, setAddingToCart] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    api.get<NumberDetail>(`/numbers/${params.id}`)
      .then((res) => {
        setNumber(res.data || null);
        if (res.data?.relatedNumbers) {
          setRelated(res.data.relatedNumbers);
        } else if (res.data?.areaCode) {
          api.get<NumberDetail[]>(`/search?area_code=${res.data.areaCode}&limit=4`)
            .then((r) => setRelated((r.data || []).filter((n) => n.id !== params.id)))
            .catch(() => {});
        }
      })
      .catch(() => {
        showSnackbar('Number not found', 'error');
        router.push('/search');
      })
      .finally(() => setLoading(false));
  }, [params.id, router, showSnackbar]);

  const handleAddToCart = async () => {
    if (!user) {
      showSnackbar('Please log in to add items to your cart', 'warning');
      router.push('/login');
      return;
    }
    if (!number?.listingId) {
      showSnackbar('This number is not available for purchase', 'error');
      return;
    }
    setAddingToCart(true);
    try {
      await addItem(number.id, number.listingId, selectedPlan);
      showSnackbar(`${formatPhone(number.number)} added to cart!`, 'success');
    } catch {
      showSnackbar('Failed to add to cart', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleSubmitOffer = async () => {
    if (!user) {
      showSnackbar('Please log in to make an offer', 'warning');
      router.push('/login');
      return;
    }
    const amount = parseFloat(offerAmount);
    if (isNaN(amount) || amount <= 0) {
      showSnackbar('Please enter a valid offer amount', 'error');
      return;
    }
    if (number?.minimumOffer && amount < number.minimumOffer) {
      showSnackbar(`Minimum offer is $${number.minimumOffer.toFixed(2)}`, 'error');
      return;
    }
    setSubmittingOffer(true);
    try {
      await api.post('/offers', {
        listingId: number?.listingId,
        phoneNumberId: number?.id,
        amount,
        buyerMessage: offerMessage || undefined,
      });
      showSnackbar('Offer submitted successfully!', 'success');
      setOfferDialogOpen(false);
      setOfferAmount('');
      setOfferMessage('');
      router.push('/account/offers');
    } catch {
      showSnackbar('Failed to submit offer', 'error');
    } finally {
      setSubmittingOffer(false);
    }
  };

  const activePlan = planDetails.find((p) => p.key === selectedPlan)!;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Skeleton width={200} height={20} sx={{ mb: 3 }} />
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Skeleton width="60%" height={60} />
            <Skeleton width="40%" height={30} sx={{ mt: 2 }} />
            <Skeleton width="100%" height={200} sx={{ mt: 3, borderRadius: 2 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Skeleton width="100%" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (!number) return null;

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '80vh' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Typography
            component={Link}
            href="/"
            color="text.secondary"
            sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
          >
            Home
          </Typography>
          <Typography
            component={Link}
            href="/search"
            color="text.secondary"
            sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
          >
            Browse
          </Typography>
          <Typography color="text.primary" sx={{ fontWeight: 600 }}>
            {formatPhone(number.number)}
          </Typography>
        </Breadcrumbs>

        <Grid container spacing={4}>
          {/* Left Column - Number Info */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={number.numberType}
                  sx={{
                    bgcolor: getTypeColor(number.numberType) + '18',
                    color: getTypeColor(number.numberType),
                    fontWeight: 700,
                  }}
                />
                {number.isPremium && (
                  <Chip
                    icon={<StarIcon sx={{ fontSize: 16 }} />}
                    label="Premium"
                    sx={{ bgcolor: '#F7941E18', color: '#F7941E', fontWeight: 700 }}
                  />
                )}
                {number.isPortable && (
                  <Chip
                    icon={<SwapHorizIcon sx={{ fontSize: 16 }} />}
                    label="Portable"
                    sx={{ bgcolor: '#4BA0A118', color: '#4BA0A1', fontWeight: 700 }}
                  />
                )}
              </Box>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  color: 'primary.main',
                  fontSize: { xs: '2rem', md: '2.75rem' },
                  letterSpacing: '-0.03em',
                }}
              >
                {formatPhone(number.number)}
              </Typography>
              {number.vanityText && (
                <Typography variant="h5" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
                  {number.vanityText}
                </Typography>
              )}
            </Box>

            {/* Attributes */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Number Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Area Code
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {number.areaCode}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Number Type
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {number.numberType}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Premium
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {number.isPremium ? 'Yes' : 'No'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Portable
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {number.isPortable ? 'Yes' : 'No'}
                    </Typography>
                  </Grid>
                </Grid>
                {number.description && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {number.description}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Pricing Display */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Pricing
                </Typography>
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {number.salePrice != null && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Purchase Price (one-time)
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#84BD00' }}>
                        ${number.salePrice.toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                  {number.licensePrice != null && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        License Price
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#4BA0A1' }}>
                        ${number.licensePrice.toFixed(2)}/mo
                      </Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Setup Fee (one-time)
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      $5.00
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Plan Selection & Cart */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ position: { md: 'sticky' }, top: { md: 100 } }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Choose Your Plan
                </Typography>

                <ToggleButtonGroup
                  value={selectedPlan}
                  exclusive
                  onChange={(_, val) => val && setSelectedPlan(val)}
                  orientation="vertical"
                  fullWidth
                  sx={{ mb: 3 }}
                >
                  {planDetails.map((plan) => (
                    <ToggleButton
                      key={plan.key}
                      value={plan.key}
                      sx={{
                        py: 2,
                        px: 2.5,
                        justifyContent: 'flex-start',
                        gap: 2,
                        textAlign: 'left',
                        textTransform: 'none',
                        border: '1px solid',
                        borderColor: selectedPlan === plan.key ? plan.color : 'divider',
                        bgcolor: selectedPlan === plan.key ? plan.color + '08' : 'transparent',
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
                        <Typography variant="caption" color="text.secondary">
                          {plan.description}
                        </Typography>
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: plan.color }}>
                        ${plan.price.toFixed(2)}/mo
                      </Typography>
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>

                {/* Plan Features */}
                <Box sx={{ mb: 3, pl: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {activePlan.label} Plan Includes:
                  </Typography>
                  {activePlan.features.map((feature) => (
                    <Box key={feature} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                      <CheckCircleIcon sx={{ fontSize: 16, color: activePlan.color }} />
                      <Typography variant="body2" color="text.secondary">
                        {feature}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Price Summary */}
                <Box sx={{ mb: 3 }}>
                  {number.salePrice != null && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">Number Price</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>${number.salePrice.toFixed(2)}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Setup Fee</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>$5.00</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Monthly ({activePlan.label})</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>${activePlan.price.toFixed(2)}/mo</Typography>
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Due Today</Typography>
                    <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 800 }}>
                      ${((number.salePrice || 0) + 5.00 + activePlan.price).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  fullWidth
                  startIcon={<AddShoppingCartIcon />}
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  sx={{ py: 1.5, fontSize: '1.05rem' }}
                >
                  {addingToCart ? 'Adding to Cart...' : 'Add to Cart'}
                </Button>

                {number.allowOffers && (
                  <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    startIcon={<LocalOfferIcon />}
                    onClick={() => setOfferDialogOpen(true)}
                    sx={{ mt: 1.5, py: 1.5, fontSize: '1.05rem' }}
                  >
                    Make an Offer
                  </Button>
                )}
                {number.allowOffers && number.minimumOffer != null && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 0.75 }}>
                    Minimum offer: ${number.minimumOffer.toFixed(2)}
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Seller Info */}
            {number.seller && (
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Seller
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {number.seller.companyName || `${number.seller.firstName || ''} ${number.seller.lastName || ''}`.trim() || 'Private Seller'}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>

        {/* Offer Dialog */}
        <Dialog open={offerDialogOpen} onClose={() => setOfferDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Make an Offer for {formatPhone(number.number)}</DialogTitle>
          <DialogContent>
            {number.minimumOffer != null && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Minimum offer: ${number.minimumOffer.toFixed(2)}
              </Typography>
            )}
            <TextField
              autoFocus
              fullWidth
              label="Offer Amount"
              type="number"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
              sx={{ mb: 2, mt: 1 }}
            />
            <TextField
              fullWidth
              label="Message (optional)"
              multiline
              rows={3}
              value={offerMessage}
              onChange={(e) => setOfferMessage(e.target.value)}
              placeholder="Add a message to the seller..."
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOfferDialogOpen(false)} disabled={submittingOffer}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitOffer}
              disabled={submittingOffer || !offerAmount}
            >
              {submittingOffer ? 'Submitting...' : 'Submit Offer'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Related Numbers */}
        {related.length > 0 && (
          <Box sx={{ mt: 8 }}>
            <Typography variant="h4" sx={{ mb: 3 }}>
              Related Numbers
            </Typography>
            <Grid container spacing={2.5}>
              {related.slice(0, 4).map((num) => (
                <Grid key={num.id} size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card
                    sx={{
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    <CardContent sx={{ pb: 1 }}>
                      <Chip
                        label={num.numberType}
                        size="small"
                        sx={{
                          bgcolor: getTypeColor(num.numberType) + '18',
                          color: getTypeColor(num.numberType),
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          mb: 1.5,
                        }}
                      />
                      <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        {formatPhone(num.number)}
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1, color: '#84BD00', fontWeight: 700 }}>
                        {num.salePrice
                          ? `$${num.salePrice.toFixed(2)}`
                          : num.licensePrice
                            ? `$${num.licensePrice.toFixed(2)}/mo`
                            : 'Contact'}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Button
                        component={Link}
                        href={`/numbers/${num.id}`}
                        variant="outlined"
                        size="small"
                        fullWidth
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
}
