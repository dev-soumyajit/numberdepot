'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIcon from '@mui/icons-material/Phone';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';

const navLinks = [
  { label: 'Browse Numbers', href: '/search' },
  { label: 'Local', href: '/local' },
  { label: 'Toll-Free', href: '/toll-free' },
  { label: 'Vanity', href: '/vanity' },
  { label: 'Pricing', href: '/pricing' },
];

export default function Header() {
  const { user, logout, isAdmin, isSeller } = useAuth();
  const { count } = useCart();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenu = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <AppBar position="sticky" sx={{ bgcolor: '#fff', color: 'text.primary' }}>
        <Toolbar sx={{ maxWidth: 1200, width: '100%', mx: 'auto', px: { xs: 2, md: 3 } }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
            <PhoneIcon sx={{ fontSize: 28, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '-0.5px', display: { xs: 'none', sm: 'block' } }}>
              NumberDepot
            </Typography>
          </Link>

          {/* Desktop Nav */}
          <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center', gap: 1 }}>
            {navLinks.map((link) => (
              <Button key={link.href} component={Link} href={link.href} sx={{ color: 'text.secondary', fontWeight: 600, '&:hover': { color: 'primary.main', bgcolor: 'rgba(20,75,110,0.04)' } }}>
                {link.label}
              </Button>
            ))}
          </Box>

          {/* Right Side */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton component={Link} href="/search" sx={{ display: { md: 'none' } }}>
              <SearchIcon />
            </IconButton>

            {user ? (
              <>
                <IconButton component={Link} href="/cart">
                  <Badge badgeContent={count} color="secondary">
                    <ShoppingCartIcon />
                  </Badge>
                </IconButton>

                <IconButton onClick={handleMenu}>
                  <PersonIcon />
                </IconButton>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}
                  slotProps={{ paper: { sx: { minWidth: 200, mt: 1 } } }}>
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle2">{user.firstName} {user.lastName}</Typography>
                    <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                  </Box>
                  <Divider />
                  <MenuItem onClick={() => { handleClose(); router.push('/account'); }}>My Account</MenuItem>
                  <MenuItem onClick={() => { handleClose(); router.push('/account/orders'); }}>Orders</MenuItem>
                  <MenuItem onClick={() => { handleClose(); router.push('/account/numbers'); }}>My Numbers</MenuItem>
                  <MenuItem onClick={() => { handleClose(); router.push('/account/subscriptions'); }}>Subscriptions</MenuItem>
                  {isSeller && <MenuItem onClick={() => { handleClose(); router.push('/seller'); }}>Seller Dashboard</MenuItem>}
                  {isAdmin && <MenuItem onClick={() => { handleClose(); router.push('/admin'); }}>Admin Panel</MenuItem>}
                  <Divider />
                  <MenuItem onClick={() => { handleClose(); logout(); router.push('/'); }} sx={{ color: 'error.main' }}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
                <Button component={Link} href="/login" variant="outlined" size="small">Login</Button>
                <Button component={Link} href="/register" variant="contained" color="secondary" size="small">Sign Up</Button>
              </Box>
            )}

            {/* Mobile Hamburger */}
            <IconButton sx={{ display: { md: 'none' } }} onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)}
        slotProps={{ paper: { sx: { width: 280 } } }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Menu</Typography>
          <IconButton onClick={() => setMobileOpen(false)}><CloseIcon /></IconButton>
        </Box>
        <Divider />
        <List>
          {navLinks.map((link) => (
            <ListItemButton key={link.href} component={Link} href={link.href} onClick={() => setMobileOpen(false)}>
              <ListItemText primary={link.label} />
            </ListItemButton>
          ))}
          <Divider sx={{ my: 1 }} />
          {!user ? (
            <>
              <ListItemButton component={Link} href="/login" onClick={() => setMobileOpen(false)}>
                <ListItemText primary="Login" />
              </ListItemButton>
              <ListItemButton component={Link} href="/register" onClick={() => setMobileOpen(false)}>
                <ListItemText primary="Sign Up" slotProps={{ primary: { sx: { color: 'secondary.main', fontWeight: 600 } } }} />
              </ListItemButton>
            </>
          ) : (
            <>
              <ListItemButton component={Link} href="/account" onClick={() => setMobileOpen(false)}>
                <ListItemText primary="My Account" />
              </ListItemButton>
              <ListItemButton onClick={() => { setMobileOpen(false); logout(); }}>
                <ListItemText primary="Logout" slotProps={{ primary: { sx: { color: 'error.main' } } }} />
              </ListItemButton>
            </>
          )}
        </List>
      </Drawer>
    </>
  );
}
