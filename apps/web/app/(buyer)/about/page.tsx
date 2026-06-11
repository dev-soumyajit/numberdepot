'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import PhoneIcon from '@mui/icons-material/Phone';
import GroupsIcon from '@mui/icons-material/Groups';
import PublicIcon from '@mui/icons-material/Public';
import VerifiedIcon from '@mui/icons-material/Verified';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import HandshakeIcon from '@mui/icons-material/Handshake';
import { useReveal } from '@/lib/useReveal';

const stats = [
  { value: '50,000+', label: 'Phone Numbers', icon: <PhoneIcon sx={{ fontSize: 32 }} /> },
  { value: '10,000+', label: 'Happy Customers', icon: <GroupsIcon sx={{ fontSize: 32 }} /> },
  { value: '300+', label: 'Area Codes', icon: <PublicIcon sx={{ fontSize: 32 }} /> },
  { value: '99.9%', label: 'Uptime', icon: <VerifiedIcon sx={{ fontSize: 32 }} /> },
];

const values = [
  {
    icon: <SupportAgentIcon sx={{ fontSize: 40 }} />,
    title: 'Customer First',
    description: 'Every decision we make starts with the question: how does this benefit our customers? We are committed to delivering an exceptional experience at every touchpoint.',
    color: '#4BA0A1',
  },
  {
    icon: <SpeedIcon sx={{ fontSize: 40 }} />,
    title: 'Simplicity',
    description: 'We believe getting a phone number should be as easy as ordering a pizza. Our platform is designed to be intuitive, fast, and hassle-free.',
    color: '#F7941E',
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 40 }} />,
    title: 'Trust & Security',
    description: 'Your numbers and data are safe with us. We use industry-leading security practices and are transparent about our pricing and policies.',
    color: '#84BD00',
  },
  {
    icon: <HandshakeIcon sx={{ fontSize: 40 }} />,
    title: 'Fair Marketplace',
    description: 'We provide a fair and open marketplace where buyers and sellers can transact with confidence. Every listing is verified for quality and compliance.',
    color: '#144B6E',
  },
];

export default function AboutPage() {
  const revealRef = useReveal();

  return (
    <Box ref={revealRef}>
      {/* Hero */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #144B6E 0%, #0D3A56 40%, #4BA0A1 100%)',
          py: { xs: 10, md: 14 },
          color: '#fff',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(247,148,30,0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Chip
            label="About Us"
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.15)',
              color: '#fff',
              fontWeight: 700,
              mb: 3,
              fontSize: '0.8rem',
              backdropFilter: 'blur(8px)',
            }}
          />
          <Typography variant="h2" sx={{ mb: 2, fontSize: { xs: '2rem', md: '3rem', lg: '3.25rem' }, fontWeight: 800, color: '#fff' }}>
            About NumberDepot
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.9, maxWidth: 600, mx: 'auto', lineHeight: 1.7, fontSize: { md: '1.2rem' }, color: '#fff' }}>
            We are on a mission to make phone numbers accessible, affordable, and easy to manage for everyone.
          </Typography>
        </Container>
      </Box>

      {/* Our Story */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Grid container spacing={6} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 6 }} className="reveal-left">
            <Chip
              label="Our Story"
              size="small"
              sx={{
                bgcolor: '#F7941E18',
                color: '#F7941E',
                fontWeight: 700,
                mb: 2,
                fontSize: '0.8rem',
              }}
            />
            <Typography variant="h3" sx={{ mb: 3, fontSize: { xs: '1.5rem', md: '2rem' } }}>
              Making Phone Numbers Simple Since Day One
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 2, fontSize: { md: '1.05rem' } }}>
              NumberDepot was born from a simple frustration: why is it so hard to get a great phone
              number? Whether you are a small business looking for a memorable toll-free number, or an
              individual wanting a local number with a specific area code, the process was always
              complicated, expensive, and opaque.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 2, fontSize: { md: '1.05rem' } }}>
              We set out to build a marketplace that puts the power back in your hands. A place where
              you can search, compare, and purchase phone numbers in minutes, not days. With transparent
              pricing, flexible plans, and instant activation, NumberDepot is the easiest way to get the
              phone number you need.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, fontSize: { md: '1.05rem' } }}>
              Today, we serve thousands of customers across the country, from solo entrepreneurs to
              growing businesses. And our friendly mascot, Ellie the elephant, is always here to
              guide you through the process.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', justifyContent: 'center' }} className="reveal-right">
            <Box
              component="img"
              src="/images/mascot.png"
              alt="Ellie - NumberDepot mascot, a friendly elephant in a teal hoodie"
              className="animate-float mascot-img"
              sx={{
                maxWidth: { xs: 340, md: 480, lg: 540 },
                width: '100%',
                height: 'auto',
                filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.15))',
              }}
            />
          </Grid>
        </Grid>
      </Container>

      {/* Stats */}
      <Box sx={{ bgcolor: 'primary.main', py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={3} className="stagger-children">
            {stats.map((stat) => (
              <Grid key={stat.label} size={{ xs: 6, md: 3 }}>
                <Box sx={{ textAlign: 'center', color: '#fff' }}>
                  <Box sx={{ mb: 1.5, opacity: 0.8 }}>{stat.icon}</Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.85, fontWeight: 500 }}>
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Values */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: 7 }} className="reveal">
          <Chip
            label="What We Believe"
            size="small"
            sx={{
              bgcolor: '#144B6E18',
              color: '#144B6E',
              fontWeight: 700,
              mb: 2,
              fontSize: '0.8rem',
            }}
          />
          <Typography variant="h3" sx={{ mb: 2, fontSize: { xs: '1.5rem', md: '2rem' } }}>
            Our Values
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', fontSize: { md: '1.1rem' } }}>
            These principles guide everything we do at NumberDepot.
          </Typography>
        </Box>
        <Grid container spacing={3} className="stagger-children">
          {values.map((value) => (
            <Grid key={value.title} size={{ xs: 12, sm: 6 }}>
              <Card className="card-lift" sx={{ height: '100%', borderRadius: 4 }}>
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      width: 76,
                      height: 76,
                      borderRadius: '50%',
                      bgcolor: value.color + '12',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: value.color,
                      mb: 2.5,
                    }}
                  >
                    {value.icon}
                  </Box>
                  <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 700 }}>
                    {value.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {value.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0D3A56 0%, #144B6E 50%, #4BA0A1 100%)',
          py: { xs: 10, md: 14 },
          textAlign: 'center',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(247,148,30,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }} className="reveal-scale">
          <Typography variant="h3" sx={{ mb: 2, fontSize: { xs: '1.5rem', md: '2.25rem' }, fontWeight: 800, color: '#fff' }}>
            Join the NumberDepot Family
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mb: 5, lineHeight: 1.7, fontSize: { md: '1.1rem' }, color: '#fff' }}>
            Whether you need a local number for your business or a vanity number that stands out,
            we have got you covered.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2.5, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={Link}
              href="/search"
              variant="contained"
              color="secondary"
              size="large"
              sx={{
                px: 5,
                py: 1.5,
                borderRadius: 3,
                fontSize: '1.05rem',
                boxShadow: '0 4px 24px rgba(247,148,30,0.4)',
              }}
            >
              Browse Numbers
            </Button>
            <Button
              component={Link}
              href="/register"
              variant="outlined"
              size="large"
              sx={{
                px: 5,
                py: 1.5,
                borderRadius: 3,
                fontSize: '1.05rem',
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.35)',
                '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
              }}
            >
              Create Account
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
