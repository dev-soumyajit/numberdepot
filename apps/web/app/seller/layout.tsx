'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import styles from './layout.module.css';

const navItems = [
  { label: 'Dashboard', icon: '📊', href: '/seller' },
  { label: 'My Numbers', icon: '📱', href: '/seller/inventory' },
  { label: 'Add Number', icon: '➕', href: '/seller/inventory/new' },
  { label: 'Offers', icon: '💬', href: '/seller/offers' },
  { label: 'Sales', icon: '🛒', href: '/seller/sales' },
  { label: 'Earnings', icon: '💰', href: '/seller/earnings' },
  { label: 'Payouts', icon: '🏦', href: '/seller/payouts' },
  { label: 'Settings', icon: '⚙️', href: '/seller/settings' },
];

interface BrokerProfile {
  id: string;
  status: string;
  businessName?: string;
}

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isSeller, isAdmin } = useAuth();
  const [brokerStatus, setBrokerStatus] = useState<string | null>(null);
  const [brokerLoading, setBrokerLoading] = useState(true);

  // Allow apply page without sidebar
  const isApplyPage = pathname === '/seller/apply';

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
      return;
    }
    if (!loading && user && !isSeller && !isAdmin) {
      router.replace('/');
      return;
    }
  }, [loading, user, isSeller, isAdmin, router]);

  // Check broker profile status
  useEffect(() => {
    if (!user || isApplyPage) {
      setBrokerLoading(false);
      return;
    }
    api.get<BrokerProfile>('/broker/profile')
      .then((res) => {
        setBrokerStatus(res.data?.status || null);
      })
      .catch(() => {
        setBrokerStatus(null); // No broker profile yet
      })
      .finally(() => setBrokerLoading(false));
  }, [user, isApplyPage]);

  // Apply page renders without seller layout
  if (isApplyPage) {
    return <>{children}</>;
  }

  if (loading || brokerLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#002664' }} />
      </Box>
    );
  }

  if (!user) return null;

  // If no broker profile or not approved, redirect to apply
  if (!isAdmin && brokerStatus !== 'approved') {
    if (brokerStatus === 'pending') {
      // Show pending message
      return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 4 }}>
          <Box>
            <Box component="img" src="/images/elephant-01.png" alt="" className="mascot-img" sx={{ height: 80, mb: 2, mx: 'auto' }} />
            <h2 style={{ marginBottom: 8 }}>Application Under Review</h2>
            <p style={{ color: '#535E66', marginBottom: 24, maxWidth: 400 }}>
              Your broker application is being reviewed by our team.
              You will receive an email once it is approved.
            </p>
            <Link href="/" style={{ color: '#002664', fontWeight: 600 }}>Go to Homepage</Link>
          </Box>
        </Box>
      );
    }

    if (brokerStatus === 'suspended' || brokerStatus === 'rejected') {
      return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 4 }}>
          <Box>
            <h2 style={{ marginBottom: 8, color: '#E74C3C' }}>
              {brokerStatus === 'rejected' ? 'Application Rejected' : 'Account Suspended'}
            </h2>
            <p style={{ color: '#535E66', marginBottom: 24, maxWidth: 400 }}>
              {brokerStatus === 'rejected'
                ? 'Unfortunately your broker application was not approved. Please contact support for more details.'
                : 'Your seller account has been suspended. Please contact support.'}
            </p>
            <Link href="/" style={{ color: '#002664', fontWeight: 600 }}>Go to Homepage</Link>
          </Box>
        </Box>
      );
    }

    // No profile at all — redirect to apply
    router.replace('/seller/apply');
    return null;
  }

  const isActive = (href: string) => {
    if (href === '/seller') return pathname === '/seller';
    return pathname.startsWith(href);
  };

  const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`;

  return (
    <div className={styles.container}>
      <div
        className={`${styles.overlay} ${sidebarOpen ? styles.overlayVisible : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logo}>
          <img src="/images/logo.png" alt="NumberDepot" className={styles.logoImg} />
          <div>
            <div className={styles.logoText}>NumberDepot</div>
            <span className={styles.logoSub}>Seller Portal</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive(item.href) ? styles.navItemActive : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>{initials}</div>
          <div>
            <div className={styles.userName}>{user.firstName} {user.lastName}</div>
            <div className={styles.userRole}>Verified Seller</div>
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <div className={styles.topBar}>
          <button className={styles.hamburger} onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <span className={styles.topBarTitle}>NumberDepot Seller</span>
          <div style={{ width: 28 }} />
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
