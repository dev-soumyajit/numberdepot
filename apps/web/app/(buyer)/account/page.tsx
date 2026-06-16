'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '@/lib/auth';
import { useSnackbar } from '@/lib/snackbar';
import { api } from '@/lib/api';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyName?: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function AccountProfilePage() {
  const { user, refreshUser } = useAuth();
  const { showSnackbar } = useSnackbar();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    api.get<UserProfile>('/users/me')
      .then((res) => {
        if (res.data) {
          setProfile(res.data);
          setFirstName(res.data.firstName);
          setLastName(res.data.lastName);
          setPhone(res.data.phone || '');
          setCompanyName(res.data.companyName || '');
        }
      })
      .catch(() => showSnackbar('Failed to load profile', 'error'))
      .finally(() => setLoading(false));
  }, [showSnackbar]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/users/me', { firstName, lastName, phone, companyName });
      await refreshUser();
      setEditing(false);
      showSnackbar('Profile updated successfully', 'success');
      setProfile((prev) => prev ? { ...prev, firstName, lastName, phone, companyName } : prev);
    } catch {
      showSnackbar('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setPhone(profile.phone || '');
      setCompanyName(profile.companyName || '');
    }
    setEditing(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      showSnackbar('Please fill in all password fields', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showSnackbar('New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showSnackbar('New password must be at least 8 characters', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      await api.put('/users/me/password', { currentPassword, newPassword });
      showSnackbar('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      showSnackbar('Failed to change password. Check your current password.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Profile
        </Typography>
        {!editing ? (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setEditing(true)}
          >
            Edit Profile
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              sx={{ color: 'text.secondary', borderColor: 'divider' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              Save Changes
            </Button>
          </Box>
        )}
      </Box>

      <Card>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={!editing}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={!editing}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Email Address"
                value={profile?.email || ''}
                disabled
                helperText="Email cannot be changed"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!editing}
                placeholder="(555) 123-4567"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={!editing}
                placeholder="Optional"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card sx={{ mt: 3 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant="h6" sx={{ mb: 2.5 }}>
            Account Information
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Account Type
              </Typography>
              <Chip
                label={profile?.role === 'buyer' ? 'Buyer' : profile?.role || 'Unknown'}
                size="small"
                sx={{
                  mt: 0.5,
                  fontWeight: 700,
                  bgcolor: '#00266418',
                  color: '#002664',
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Account Status
              </Typography>
              <Chip
                label={profile?.status || 'Active'}
                size="small"
                sx={{
                  mt: 0.5,
                  fontWeight: 700,
                  bgcolor: profile?.status === 'active' ? '#84BD0018' : '#E5393518',
                  color: profile?.status === 'active' ? '#84BD00' : '#E53935',
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Member Since
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Account ID
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  mt: 0.5,
                  fontFamily: 'monospace',
                  color: 'text.secondary',
                }}
              >
                {profile?.id || 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card sx={{ mt: 3 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <LockIcon sx={{ color: 'primary.main', fontSize: 22 }} />
            <Typography variant="h6">
              Change Password
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={savingPassword ? <CircularProgress size={18} color="inherit" /> : <LockIcon />}
                onClick={handleChangePassword}
                disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
              >
                {savingPassword ? 'Changing Password...' : 'Change Password'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
