'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import PersonIcon from '@mui/icons-material/Person';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '@/lib/auth';

const navItems = [
  { label: 'Profile', href: '/account', icon: <PersonIcon /> },
  { label: 'My Numbers', href: '/account/numbers', icon: <PhoneInTalkIcon /> },
  { label: 'Orders', href: '/account/orders', icon: <ReceiptLongIcon /> },
  { label: 'My Offers', href: '/account/offers', icon: <LocalOfferIcon /> },
  { label: 'Subscriptions', href: '/account/subscriptions', icon: <AutorenewIcon /> },
  { label: 'Notifications', href: '/account/notifications', icon: <NotificationsIcon /> },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Skeleton height={300} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 9 }}>
            <Skeleton height={400} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (!user) return null;

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '80vh' }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #144B6E 0%, #0D3A56 100%)',
          py: { xs: 3, md: 4 },
          color: '#fff',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            My Account
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.85, mt: 0.5 }}>
            Welcome back, {user.firstName}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Grid container spacing={4}>
          {/* Sidebar */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <Box sx={{ p: 2.5, textAlign: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 1.5,
                    fontSize: '1.5rem',
                    fontWeight: 800,
                  }}
                >
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
              <List sx={{ py: 1 }}>
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <ListItemButton
                      key={item.href}
                      component={Link}
                      href={item.href}
                      sx={{
                        mx: 1,
                        borderRadius: 1.5,
                        mb: 0.5,
                        bgcolor: isActive ? 'primary.main' + '10' : 'transparent',
                        color: isActive ? 'primary.main' : 'text.secondary',
                        '&:hover': {
                          bgcolor: isActive ? 'primary.main' + '15' : 'action.hover',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        slotProps={{ primary: { sx: { fontWeight: isActive ? 700 : 500 } } }}
                      />
                    </ListItemButton>
                  );
                })}
                <ListItemButton
                  onClick={() => { logout(); router.push('/'); }}
                  sx={{
                    mx: 1,
                    borderRadius: 1.5,
                    mt: 1,
                    color: 'error.main',
                    '&:hover': { bgcolor: 'error.main' + '08' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Logout"
                    slotProps={{ primary: { sx: { fontWeight: 500 } } }}
                  />
                </ListItemButton>
              </List>
            </Card>
          </Grid>

          {/* Content */}
          <Grid size={{ xs: 12, md: 9 }}>
            {children}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
