'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BarChartIcon from '@mui/icons-material/BarChart';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import GroupsIcon from '@mui/icons-material/Groups';
import PhoneForwardedIcon from '@mui/icons-material/PhoneForwarded';

const features = [
  {
    icon: <SupportAgentIcon sx={{ fontSize: 48 }} />,
    title: 'Auto-Attendant',
    desc: 'Greet callers with a professional menu. Route them to the right department — press 1 for sales, 2 for support, and so on.',
  },
  {
    icon: <AccessTimeIcon sx={{ fontSize: 48 }} />,
    title: 'Business Hours',
    desc: 'Set custom schedules for when calls are answered. After-hours calls go to voicemail with a custom greeting.',
  },
  {
    icon: <BarChartIcon sx={{ fontSize: 48 }} />,
    title: 'Call Analytics',
    desc: 'Track call volume, duration, peak hours, and missed calls. Understand your call patterns and optimize staffing.',
  },
  {
    icon: <RecordVoiceOverIcon sx={{ fontSize: 48 }} />,
    title: 'Custom Greetings',
    desc: 'Upload professional greetings or use our text-to-speech engine. Seasonal messages, on-hold music, and more.',
  },
  {
    icon: <GroupsIcon sx={{ fontSize: 48 }} />,
    title: 'Multi-Extension',
    desc: 'Create extensions for team members. Each person gets their own voicemail and forwarding settings.',
  },
  {
    icon: <PhoneForwardedIcon sx={{ fontSize: 48 }} />,
    title: 'Smart Routing',
    desc: 'Route calls based on time of day, caller location, or menu selection. Simultaneous ring, sequential ring, or round-robin.',
  },
];

const plans = [
  { name: 'Starter', price: 14.99, features: ['1 business line', 'Auto-attendant', 'Business hours', 'Voicemail', 'Call forwarding'] },
  { name: 'Professional', price: 29.99, features: ['3 business lines', 'Everything in Starter', 'Call analytics', 'Custom greetings', '5 extensions'] },
  { name: 'Enterprise', price: 49.99, features: ['10 business lines', 'Everything in Pro', 'Smart routing', 'Unlimited extensions', 'Priority support'] },
];

export default function BusinessPage() {
  return (
    <Box>
      {/* Hero */}
      <Box sx={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d1642 100%)', color: '#fff', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 2 }}>Business Phone Lines</Typography>
          <Typography variant="h6" sx={{ opacity: 0.85, maxWidth: 600, mb: 4, fontWeight: 400 }}>
            A complete business phone system without the hardware. Auto-attendant, business hours, analytics, and more — all managed from your browser.
          </Typography>
          <Button component={Link} href="/search" variant="contained" color="secondary" size="large" endIcon={<ArrowForwardIcon />}>
            Get a Business Number
          </Button>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        {/* Features */}
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, textAlign: 'center' }}>Everything You Need</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 6, textAlign: 'center', maxWidth: 600, mx: 'auto' }}>
          Professional features that make your small business sound like a Fortune 500 company.
        </Typography>

        <Grid container spacing={4} sx={{ mb: 10 }}>
          {features.map((f) => (
            <Grid key={f.title} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined" sx={{ p: 4, height: '100%', textAlign: 'center' }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>{f.icon}</Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{f.title}</Typography>
                <Typography variant="body2" color="text.secondary">{f.desc}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Plans */}
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, textAlign: 'center' }}>Business Line Plans</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 6, textAlign: 'center' }}>
          Add business features to any NumberDepot number.
        </Typography>

        <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
          {plans.map((plan, i) => (
            <Grid key={plan.name} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                variant="outlined"
                sx={{
                  p: 4,
                  height: '100%',
                  textAlign: 'center',
                  ...(i === 1 ? { borderColor: 'primary.main', borderWidth: 2, boxShadow: 4 } : {}),
                }}
              >
                {i === 1 && <Typography variant="caption" sx={{ bgcolor: 'primary.main', color: '#fff', px: 2, py: 0.5, borderRadius: 1, fontWeight: 700 }}>Most Popular</Typography>}
                <Typography variant="h5" sx={{ fontWeight: 800, mt: i === 1 ? 2 : 0, mb: 1 }}>{plan.name}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', mb: 0.5 }}>${plan.price}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>/month per line</Typography>
                {plan.features.map((f) => (
                  <Typography key={f} variant="body2" sx={{ mb: 1, py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    {f}
                  </Typography>
                ))}
                <Button component={Link} href="/search" variant={i === 1 ? 'contained' : 'outlined'} fullWidth sx={{ mt: 3 }}>
                  Get Started
                </Button>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
