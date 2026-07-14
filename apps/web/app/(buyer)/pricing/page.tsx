'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import PhoneForwardedIcon from '@mui/icons-material/PhoneForwarded';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import BusinessIcon from '@mui/icons-material/Business';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { api } from '@/lib/api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const planIcons: Record<string, any> = {
  park: <LocalParkingIcon sx={{ fontSize: 44 }} />,
  forward: <PhoneForwardedIcon sx={{ fontSize: 44 }} />,
  unlimited: <AllInclusiveIcon sx={{ fontSize: 44 }} />,
  business: <BusinessIcon sx={{ fontSize: 44 }} />,
};

const planColors: Record<string, string> = {
  park: '#4BA0A1',
  forward: '#84BD00',
  unlimited: '#E53935',
  business: '#002664',
};

const planPopular: Record<string, boolean> = { unlimited: true };

const planFeatures: Record<string, string[]> = {
  park: ['Reserve phone number', 'Custom voicemail greeting', 'Email voicemail notifications', 'Number protection', 'Online dashboard access'],
  forward: ['Everything in Park', 'Call forwarding to any phone', 'Caller ID passthrough', 'Scheduled forwarding rules', 'Simultaneous ring', 'Missed call notifications'],
  unlimited: ['Everything in Forward', 'Unlimited inbound/outbound calls', 'SMS and MMS messaging', 'Voicemail transcription', 'Call recording', 'Mobile and desktop apps', 'Priority support'],
  business: ['Everything in Park', 'Auto-attendant / IVR', 'Business hours routing', 'Call analytics dashboard', 'Professional greeting recording', 'Multiple extension support'],
};

interface PlanData {
  id: string;
  title: string;
  price: number;
  description: string;
}

interface FeeItem {
  id: string;
  label: string;
  amount: number;
  perItem: boolean;
}

const fallbackPlans: PlanData[] = [
  { id: 'park', title: 'Park', price: 2.99, description: 'Reserve your number and receive voicemail notifications. Perfect for holding a number until you need it.' },
  { id: 'forward', title: 'Forward', price: 6.99, description: 'Forward incoming calls to any phone number. Great for personal or small business use.' },
  { id: 'unlimited', title: 'Unlimited', price: 19.99, description: 'Full communication suite with unlimited calling, SMS, and voicemail transcription.' },
  { id: 'business', title: 'Business', price: 9.99, description: 'Professional features for businesses including auto-attendant, call routing, and analytics.' },
];

const comparisonFeatures = [
  { label: 'Number Reservation', park: true, forward: true, unlimited: true, business: true },
  { label: 'Custom Voicemail', park: true, forward: true, unlimited: true, business: true },
  { label: 'Email Notifications', park: true, forward: true, unlimited: true, business: true },
  { label: 'Online Dashboard', park: true, forward: true, unlimited: true, business: true },
  { label: 'Call Forwarding', park: false, forward: true, unlimited: true, business: true },
  { label: 'Caller ID Passthrough', park: false, forward: true, unlimited: true, business: false },
  { label: 'Scheduled Forwarding', park: false, forward: true, unlimited: true, business: true },
  { label: 'Unlimited Calling', park: false, forward: false, unlimited: true, business: false },
  { label: 'SMS / MMS Messaging', park: false, forward: false, unlimited: true, business: false },
  { label: 'Voicemail Transcription', park: false, forward: false, unlimited: true, business: false },
  { label: 'Call Recording', park: false, forward: false, unlimited: true, business: false },
  { label: 'Auto-Attendant / IVR', park: false, forward: false, unlimited: false, business: true },
  { label: 'Business Hours Routing', park: false, forward: false, unlimited: false, business: true },
  { label: 'Call Analytics', park: false, forward: false, unlimited: false, business: true },
  { label: 'Priority Support', park: false, forward: false, unlimited: true, business: true },
];

function FeatureCheck({ included }: { included: boolean }) {
  return included ? (
    <CheckCircleIcon sx={{ color: '#84BD00', fontSize: 22 }} />
  ) : (
    <CancelIcon sx={{ color: '#E0E6ED', fontSize: 22 }} />
  );
}

export default function PricingPage() {
  const [plans, setPlans] = useState<PlanData[]>(fallbackPlans);
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<PlanData[]>('/admin/plans').then((res) => {
        if (res.data) setPlans(res.data);
      }).catch(() => {}),
      api.get<FeeItem[]>('/admin/fees').then((res) => {
        if (Array.isArray(res.data)) setFees(res.data);
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const planCards = plans.map((p) => ({
    ...p,
    icon: planIcons[p.id] || planIcons.park,
    color: planColors[p.id] || '#002664',
    popular: planPopular[p.id] || false,
    features: planFeatures[p.id] || [],
  }));

  const getPlanPrice = (id: string) => plans.find((p) => p.id === id)?.price ?? 0;
  const activeFees = fees.filter((f) => f.amount > 0);

  return (
    <Box className="animate-fadeIn">
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #002664 0%, #001a45 100%)',
          py: { xs: 8, md: 10 },
          textAlign: 'center',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '-30%',
            right: '-15%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(229,57,53,0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Chip
            label="Pricing"
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.15)',
              color: '#fff',
              fontWeight: 700,
              mb: 2,
              fontSize: '0.8rem',
              backdropFilter: 'blur(8px)',
            }}
          />
          <Typography variant="h2" sx={{ mb: 2, fontSize: { xs: '1.75rem', md: '2.75rem', lg: '3rem' }, fontWeight: 800, color: '#fff' }}>
            Simple, Transparent Pricing
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.9, mb: 1, fontSize: { md: '1.15rem' }, color: '#fff' }}>
            Choose the plan that fits your needs. No hidden fees, cancel anytime.
          </Typography>
        </Container>

      </Box>

      {/* Plan Cards */}
      <Container maxWidth="lg" sx={{ mt: -4, mb: 8, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={3}>
          {planCards.map((plan) => (
            <Grid key={plan.title} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                className="card-lift"
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: plan.popular ? `2px solid ${plan.color}` : '1px solid transparent',
                  borderRadius: 4,
                  overflow: 'visible',
                }}
              >
                {plan.popular && (
                  <Chip
                    label="Most Popular"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bgcolor: plan.color,
                      color: '#fff',
                      fontWeight: 700,
                      zIndex: 1,
                    }}
                  />
                )}
                <CardContent sx={{ flex: 1, textAlign: 'center', pt: plan.popular ? 4.5 : 3.5, px: 3 }}>
                  <Box sx={{ color: plan.color, mb: 2 }}>{plan.icon}</Box>
                  <Typography variant="h4" sx={{ mb: 1.5 }}>
                    {plan.title}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      component="span"
                      sx={{ fontSize: '2.75rem', fontWeight: 800, color: 'text.primary', lineHeight: 1 }}
                    >
                      ${plan.price.toFixed(2)}
                    </Typography>
                    <Typography component="span" color="text.secondary" sx={{ fontSize: '1rem' }}>
                      /mo
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3, lineHeight: 1.6, minHeight: 60 }}
                  >
                    {plan.description}
                  </Typography>
                  {plan.features.map((feature) => (
                    <Box
                      key={feature}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25, textAlign: 'left' }}
                    >
                      <CheckCircleIcon sx={{ fontSize: 18, color: plan.color, flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary">
                        {feature}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
                <CardActions sx={{ p: 3, pt: 1 }}>
                  <Button
                    component={Link}
                    href="/search"
                    variant={plan.popular ? 'contained' : 'outlined'}
                    color={plan.popular ? 'secondary' : 'primary'}
                    fullWidth
                    size="large"
                    sx={{ py: 1.25 }}
                  >
                    Get Started
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Setup Fee Notice */}
        <Box
          sx={{
            mt: 4,
            p: 3,
            bgcolor: '#E5393508',
            border: '1px solid #E5393530',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <InfoOutlinedIcon sx={{ color: '#E53935', fontSize: 28, flexShrink: 0 }} />
          <Box>
            {activeFees.length > 0 ? (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Additional Fees
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activeFees.map((f) => `${f.label}: $${f.amount.toFixed(2)}${f.perItem ? ' per number' : ''}`).join(' | ')}
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  No Additional Fees
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All plans are billed monthly with no hidden charges.
                </Typography>
              </>
            )}
          </Box>
        </Box>
      </Container>

      {/* Feature Comparison Table */}
      <Box sx={{ bgcolor: 'background.paper', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ textAlign: 'center', mb: 5 }}>
            Feature Comparison
          </Typography>
          <TableContainer component={Paper} sx={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', minWidth: 200 }}>
                    Feature
                  </TableCell>
                  <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                    Park<br />
                    <Typography component="span" sx={{ fontSize: '0.8rem', opacity: 0.85 }}>
                      ${getPlanPrice('park').toFixed(2)}/mo
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                    Forward<br />
                    <Typography component="span" sx={{ fontSize: '0.8rem', opacity: 0.85 }}>
                      ${getPlanPrice('forward').toFixed(2)}/mo
                    </Typography>
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      bgcolor: '#E53935',
                    }}
                  >
                    Unlimited<br />
                    <Typography component="span" sx={{ fontSize: '0.8rem', opacity: 0.85 }}>
                      ${getPlanPrice('unlimited').toFixed(2)}/mo
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                    Business<br />
                    <Typography component="span" sx={{ fontSize: '0.8rem', opacity: 0.85 }}>
                      ${getPlanPrice('business').toFixed(2)}/mo
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comparisonFeatures.map((feature, i) => (
                  <TableRow
                    key={feature.label}
                    sx={{ bgcolor: i % 2 === 0 ? 'transparent' : 'background.paper' }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>{feature.label}</TableCell>
                    <TableCell align="center"><FeatureCheck included={feature.park} /></TableCell>
                    <TableCell align="center"><FeatureCheck included={feature.forward} /></TableCell>
                    <TableCell align="center" sx={{ bgcolor: '#E5393506' }}>
                      <FeatureCheck included={feature.unlimited} />
                    </TableCell>
                    <TableCell align="center"><FeatureCheck included={feature.business} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Container>
      </Box>

      {/* Telco Cellular Partner Section */}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: '#f0f9fc' }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Chip label="Partner Service" size="small" sx={{ bgcolor: '#0A4F6818', color: '#0A4F68', fontWeight: 700, mb: 2, fontSize: '0.8rem' }} />
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Need Cellular Service Too?
            </Typography>
          </Box>
          <Card
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              border: '2px solid #145C76',
              boxShadow: '0 8px 40px rgba(10,79,104,0.12)',
            }}
          >
            <Box
              sx={{
                background: 'linear-gradient(135deg, #0A4F68 0%, #084860 60%, #0d6a8a 100%)',
                p: { xs: 3, md: 4 },
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                gap: { xs: 3, md: 4 },
              }}
            >
              <Box sx={{ textAlign: 'center', flexShrink: 0 }}>
                <Box component="img" src="/images/telco-logo.png" alt="Telco Cellular" sx={{ height: { xs: 50, md: 65 }, width: 'auto', mb: 1.5, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }} />
                <Chip label="TELCO" sx={{ bgcolor: '#fff', color: '#0A4F68', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.1em' }} />
              </Box>
              <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, mb: 1 }}>
                  Turn Your Number Into Cellular Service
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, justifyContent: { xs: 'center', sm: 'flex-start' }, mb: 1 }}>
                  <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '2.5rem' }}>$19</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>/mo</Typography>
                </Box>
                <Typography sx={{ color: '#fff', fontWeight: 600, mb: 0.5 }}>Unlimited Talk, Text &amp; Data</Typography>
                <Typography sx={{ color: '#4dd9ff', fontWeight: 800, fontSize: '0.95rem', mb: 2 }}>NOT A PENNY MORE!</Typography>
                <Button href="https://telcocellular.com" target="_blank" rel="noopener noreferrer" variant="contained" sx={{ bgcolor: '#fff', color: '#0A4F68', fontWeight: 800, px: 3.5, py: 1.2, borderRadius: 2.5, '&:hover': { bgcolor: '#e0f7ff' } }}>
                  Learn More
                </Button>
              </Box>
            </Box>
          </Card>
        </Container>
      </Box>

      {/* CTA */}
      <Box sx={{ py: { xs: 6, md: 8 }, textAlign: 'center' }}>
        <Container maxWidth="sm">
          <Box
            component="img"
            src="/images/elephant-01.png"
            alt="NumberDepot elephant"
            sx={{
              width: { xs: 110, md: 150 },
              height: 'auto',
              mx: 'auto',
              mb: 3,
              filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.12))',
            }}
          />
          <Typography variant="h3" sx={{ mb: 2 }}>
            Ready to Get Started?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Find your perfect phone number and choose the plan that works for you.
          </Typography>
          <Button
            component={Link}
            href="/search"
            variant="contained"
            color="secondary"
            size="large"
            sx={{ px: 5, py: 1.5, fontSize: '1.05rem' }}
          >
            Browse Numbers
          </Button>
        </Container>
      </Box>
    </Box>
  );
}
