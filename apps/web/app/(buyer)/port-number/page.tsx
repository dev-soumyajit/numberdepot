'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const steps = [
  {
    step: '1',
    title: 'Check Eligibility',
    desc: 'Enter your current phone number to verify it can be ported. Most US numbers are eligible.',
    detail: 'Landline, VoIP, and most wireless numbers can be ported.',
  },
  {
    step: '2',
    title: 'Submit Port Request',
    desc: 'Provide your current carrier info, account number, and PIN. We handle the rest.',
    detail: 'You\'ll need your latest bill and account details from your current provider.',
  },
  {
    step: '3',
    title: 'Verification',
    desc: 'We submit the port request to your current carrier. They verify ownership and approve the transfer.',
    detail: 'This typically takes 1-3 business days for landlines, 4-24 hours for wireless.',
  },
  {
    step: '4',
    title: 'Number Activated',
    desc: 'Your number is live on NumberDepot. Set up forwarding, voicemail, and all features immediately.',
    detail: 'Your old service is automatically cancelled when the port completes.',
  },
];

const requirements = [
  'Active phone number (not disconnected)',
  'Account number from current carrier',
  'Account PIN or password',
  'Name on the account (must match)',
  'Service address on file with carrier',
  'Latest billing statement (recommended)',
];

const faqs = [
  { q: 'How long does porting take?', a: 'Wireless numbers typically port in 4-24 hours. Landline and VoIP numbers take 1-7 business days. Complex ports may take up to 14 days.' },
  { q: 'Will I lose service during the port?', a: 'There may be a brief interruption (a few minutes) when the port completes. We\'ll notify you when it\'s about to happen so you can plan.' },
  { q: 'Can I port my number back?', a: 'Yes. You own your phone number and can port it to any carrier at any time. There are no lock-in periods.' },
  { q: 'Does porting cancel my old service?', a: 'The phone line associated with the ported number is cancelled automatically. Other services on your account (internet, TV) are not affected.' },
  { q: 'Is there a porting fee?', a: 'NumberDepot charges no fee to port in. Your previous carrier may charge an early termination fee if you\'re under contract.' },
];

export default function PortNumberPage() {
  return (
    <Box>
      {/* Hero */}
      <Box sx={{ background: 'linear-gradient(135deg, #bf360c 0%, #8d2209 100%)', color: '#fff', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 2 }}>Port Your Number</Typography>
          <Typography variant="h6" sx={{ opacity: 0.85, maxWidth: 600, mb: 4, fontWeight: 400 }}>
            Bring your existing phone number to NumberDepot. Keep the number your customers know and love while gaining powerful features.
          </Typography>
          <Button component={Link} href="/contact" variant="contained" color="secondary" size="large" endIcon={<ArrowForwardIcon />}>
            Start a Port Request
          </Button>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        {/* Steps */}
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 6, textAlign: 'center' }}>How Porting Works</Typography>

        <Grid container spacing={4} sx={{ mb: 10 }}>
          {steps.map((s) => (
            <Grid key={s.step} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ p: 3, height: '100%' }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'primary.main', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, fontSize: '1.25rem', fontWeight: 900 }}>
                  {s.step}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{s.title}</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>{s.desc}</Typography>
                <Typography variant="caption" color="text.secondary">{s.detail}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Requirements */}
        <Grid container spacing={6} sx={{ mb: 10 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>What You&apos;ll Need</Typography>
            {requirements.map((r) => (
              <Box key={r} sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20, mt: 0.3 }} />
                <Typography variant="body1">{r}</Typography>
              </Box>
            ))}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 4, bgcolor: '#FFF3E0', border: '1px solid #FFB74D' }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <InfoOutlinedIcon sx={{ color: '#E65100' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#E65100' }}>Important Note</Typography>
              </Box>
              <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
                Do <strong>not</strong> cancel your current service before the port is complete.
                Disconnecting your number before the port finishes will cause the port to fail,
                and you may lose the number permanently. Keep your account active until we confirm
                the port is successful.
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* FAQ */}
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, textAlign: 'center' }}>Porting FAQ</Typography>
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          {faqs.map((faq) => (
            <Card key={faq.q} variant="outlined" sx={{ p: 3, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>{faq.q}</Typography>
              <Typography variant="body2" color="text.secondary">{faq.a}</Typography>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
