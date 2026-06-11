'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PhoneForwardedIcon from '@mui/icons-material/PhoneForwarded';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DevicesIcon from '@mui/icons-material/Devices';
import TuneIcon from '@mui/icons-material/Tune';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

const features = [
  {
    icon: <PhoneForwardedIcon sx={{ fontSize: 44 }} />,
    title: 'Forward to Any Phone',
    desc: 'Forward calls to your cell phone, office line, home phone, or any number worldwide. Change your destination anytime.',
  },
  {
    icon: <ContactPhoneIcon sx={{ fontSize: 44 }} />,
    title: 'Caller ID Pass-Through',
    desc: "See the original caller's number on your phone, not your NumberDepot number. Know who's calling before you answer.",
  },
  {
    icon: <ScheduleIcon sx={{ fontSize: 44 }} />,
    title: 'Time-Based Routing',
    desc: 'Forward to your office during business hours and your cell after hours. Set different rules for weekends and holidays.',
  },
  {
    icon: <DevicesIcon sx={{ fontSize: 44 }} />,
    title: 'Simultaneous Ring',
    desc: 'Ring multiple phones at once so you never miss a call. First person to answer gets the call.',
  },
  {
    icon: <TuneIcon sx={{ fontSize: 44 }} />,
    title: 'Advanced Controls',
    desc: 'Set ring duration, failover numbers, and conditional forwarding rules. Full control from your dashboard.',
  },
  {
    icon: <NotificationsActiveIcon sx={{ fontSize: 44 }} />,
    title: 'Missed Call Alerts',
    desc: 'Get email or SMS notifications for missed calls. Never lose a lead even when you can\'t answer.',
  },
];

const steps = [
  { step: '1', title: 'Choose a Number', desc: 'Pick any local, toll-free, or vanity number from our marketplace.' },
  { step: '2', title: 'Set Your Destination', desc: 'Enter the phone number where you want calls forwarded to.' },
  { step: '3', title: 'Configure Rules', desc: 'Set up schedules, simultaneous ring, or conditional forwarding.' },
  { step: '4', title: 'Start Receiving Calls', desc: 'Your new number is live instantly. Calls forward in real-time.' },
];

export default function CallForwardingPage() {
  return (
    <Box>
      {/* Hero */}
      <Box sx={{ background: 'linear-gradient(135deg, #00695c 0%, #004d40 100%)', color: '#fff', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 2 }}>Call Forwarding</Typography>
          <Typography variant="h6" sx={{ opacity: 0.85, maxWidth: 600, mb: 4, fontWeight: 400 }}>
            Forward calls from your NumberDepot number to any phone, anywhere. Keep your personal number private while staying reachable.
          </Typography>
          <Button component={Link} href="/search" variant="contained" color="secondary" size="large" endIcon={<ArrowForwardIcon />}>
            Get a Number with Forwarding
          </Button>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        {/* How it works */}
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 6, textAlign: 'center' }}>How It Works</Typography>
        <Grid container spacing={3} sx={{ mb: 10 }}>
          {steps.map((s) => (
            <Grid key={s.step} size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: 'primary.main', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, fontSize: '1.5rem', fontWeight: 900 }}>
                  {s.step}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{s.title}</Typography>
                <Typography variant="body2" color="text.secondary">{s.desc}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Features */}
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, textAlign: 'center' }}>Powerful Forwarding Features</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 6, textAlign: 'center' }}>
          Included with every NumberDepot number at no extra cost.
        </Typography>

        <Grid container spacing={4}>
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
      </Container>
    </Box>
  );
}
