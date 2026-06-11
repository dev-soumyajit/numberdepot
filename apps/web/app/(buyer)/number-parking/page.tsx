'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LockIcon from '@mui/icons-material/Lock';
import VoicemailIcon from '@mui/icons-material/Voicemail';
import ShieldIcon from '@mui/icons-material/Shield';
import SaveIcon from '@mui/icons-material/Save';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TimerIcon from '@mui/icons-material/Timer';

const features = [
  {
    icon: <LockIcon sx={{ fontSize: 44 }} />,
    title: 'Reserve Your Number',
    desc: "Claim a number now and activate it when you're ready. Don't lose the perfect number while you plan your launch.",
  },
  {
    icon: <VoicemailIcon sx={{ fontSize: 44 }} />,
    title: 'Voicemail Included',
    desc: 'Parked numbers include voicemail so callers can leave messages. Get transcribed voicemails via email.',
  },
  {
    icon: <ShieldIcon sx={{ fontSize: 44 }} />,
    title: 'Number Protection',
    desc: 'Your number is securely held in our system. No risk of it being reassigned or released.',
  },
  {
    icon: <SaveIcon sx={{ fontSize: 44 }} />,
    title: 'Low Monthly Cost',
    desc: 'Park numbers for as little as $2.99/month. Much cheaper than maintaining an active phone line.',
  },
  {
    icon: <SwapHorizIcon sx={{ fontSize: 44 }} />,
    title: 'Easy Activation',
    desc: 'Upgrade from parking to a full plan anytime. Add forwarding, business features, or port to your carrier.',
  },
  {
    icon: <TimerIcon sx={{ fontSize: 44 }} />,
    title: 'No Contracts',
    desc: 'Park month-to-month with no long-term commitment. Cancel or upgrade whenever you want.',
  },
];

const useCases = [
  { title: 'Businesses Planning a Launch', desc: 'Secure your vanity number or local number while you prepare your business. Activate when ready.' },
  { title: 'Number Investors', desc: 'Hold premium numbers as an investment. Park them at minimal cost and sell later at a profit.' },
  { title: 'Seasonal Businesses', desc: 'Park your business number during the off-season. Reactivate when you need it without losing the number.' },
  { title: 'Number Collectors', desc: 'Maintain a portfolio of memorable numbers. Manage them all from one dashboard.' },
];

export default function NumberParkingPage() {
  return (
    <Box>
      {/* Hero */}
      <Box sx={{ background: 'linear-gradient(135deg, #4a148c 0%, #311b92 100%)', color: '#fff', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 2 }}>Number Parking</Typography>
          <Typography variant="h6" sx={{ opacity: 0.85, maxWidth: 600, mb: 4, fontWeight: 400 }}>
            Reserve phone numbers at a fraction of the cost. Park them until you&apos;re ready to use them — with voicemail and protection included.
          </Typography>
          <Button component={Link} href="/search" variant="contained" color="secondary" size="large" endIcon={<ArrowForwardIcon />}>
            Find a Number to Park
          </Button>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        {/* Features */}
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 6, textAlign: 'center' }}>Parking Features</Typography>

        <Grid container spacing={4} sx={{ mb: 10 }}>
          {features.map((f) => (
            <Grid key={f.title} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined" sx={{ p: 4, height: '100%' }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>{f.icon}</Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{f.title}</Typography>
                <Typography variant="body2" color="text.secondary">{f.desc}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Use Cases */}
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, textAlign: 'center' }}>Who Parks Numbers?</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 6, textAlign: 'center' }}>
          Number parking is popular across many use cases.
        </Typography>

        <Grid container spacing={3}>
          {useCases.map((uc) => (
            <Grid key={uc.title} size={{ xs: 12, sm: 6 }}>
              <Card variant="outlined" sx={{ p: 4, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{uc.title}</Typography>
                <Typography variant="body2" color="text.secondary">{uc.desc}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
