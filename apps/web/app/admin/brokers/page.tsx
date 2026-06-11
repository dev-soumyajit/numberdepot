'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { api } from '@/lib/api';
import { useSnackbar } from '@/lib/snackbar';

interface BrokerApplication {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  companyName?: string;
  status: string;
  reason?: string;
  businessLicense?: string;
  experience?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function AdminBrokersPage() {
  const [applications, setApplications] = useState<BrokerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [actionDialog, setActionDialog] = useState<{ app: BrokerApplication; action: 'approved' | 'rejected' } | null>(null);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const { showSnackbar } = useSnackbar();

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);

      const res = await api.get<BrokerApplication[]>(`/admin/broker-applications?${params}`);
      if (res.data) setApplications(res.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load applications';
      showSnackbar(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showSnackbar]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleAction = async () => {
    if (!actionDialog) return;
    setProcessing(true);
    try {
      await api.put(`/admin/broker-applications/${actionDialog.app.id}`, {
        status: actionDialog.action,
        reason: reason.trim() || undefined,
      });
      showSnackbar(
        `Application ${actionDialog.action} successfully`,
        'success'
      );
      setActionDialog(null);
      setReason('');
      fetchApplications();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to process application';
      showSnackbar(message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'pending': return <Chip label="Pending" size="small" color="warning" />;
      case 'approved': return <Chip label="Approved" size="small" color="success" />;
      case 'rejected': return <Chip label="Rejected" size="small" color="error" />;
      default: return <Chip label={status} size="small" />;
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
          Broker Applications
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Review and manage broker applications
        </Typography>
      </Box>

      {/* Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 180 }}
          size="small"
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
        </TextField>
      </Box>

      {/* Applications */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#144B6E' }} />
        </Box>
      ) : applications.length === 0 ? (
        <Card sx={{ borderRadius: 3, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              No applications found
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled', mt: 1 }}>
              {statusFilter === 'pending' ? 'No pending broker applications at this time.' : 'Try changing the filter to see results.'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {applications.map((app) => (
            <Grid size={{ xs: 12, md: 6 }} key={app.id}>
              <Card sx={{ borderRadius: 3, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                        {app.userName || 'Unknown User'}
                      </Typography>
                      {app.companyName && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {app.companyName}
                        </Typography>
                      )}
                    </Box>
                    {getStatusChip(app.status)}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <EmailIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {app.userEmail || 'No email provided'}
                      </Typography>
                    </Box>
                    {app.businessLicense && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <BusinessIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          License: {app.businessLicense}
                        </Typography>
                      </Box>
                    )}
                    {app.experience && (
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <PersonIcon sx={{ fontSize: 18, color: 'text.disabled', mt: 0.3 }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {app.experience}
                        </Typography>
                      </Box>
                    )}
                    {app.notes && (
                      <Box sx={{ mt: 1, p: 1.5, bgcolor: '#f8f9fb', borderRadius: 1.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Notes
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                          {app.notes}
                        </Typography>
                      </Box>
                    )}
                    {app.reason && (
                      <Box sx={{ mt: 1, p: 1.5, bgcolor: app.status === 'rejected' ? '#E74C3C08' : '#84BD0008', borderRadius: 1.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Admin Reason
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                          {app.reason}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                      <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        Applied: {new Date(app.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>

                  {app.status === 'pending' && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button
                          variant="contained"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => setActionDialog({ app, action: 'approved' })}
                          sx={{
                            flex: 1,
                            bgcolor: '#84BD00',
                            '&:hover': { bgcolor: '#6B9A00' },
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 2,
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<CancelIcon />}
                          onClick={() => setActionDialog({ app, action: 'rejected' })}
                          sx={{
                            flex: 1,
                            borderColor: '#E74C3C',
                            color: '#E74C3C',
                            '&:hover': { borderColor: '#c0392b', bgcolor: '#E74C3C08' },
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 2,
                          }}
                        >
                          Reject
                        </Button>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Approve/Reject Dialog */}
      <Dialog open={!!actionDialog} onClose={() => { setActionDialog(null); setReason(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {actionDialog?.action === 'approved' ? 'Approve' : 'Reject'} Application
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {actionDialog?.action === 'approved'
              ? `Are you sure you want to approve ${actionDialog.app.userName || 'this user'} as a broker?`
              : `Please provide a reason for rejecting ${actionDialog?.app.userName || 'this user'}'s application.`
            }
          </Typography>
          <TextField
            label={actionDialog?.action === 'rejected' ? 'Reason (required)' : 'Reason (optional)'}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline
            rows={3}
            fullWidth
            placeholder="Enter reason..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => { setActionDialog(null); setReason(''); }}
            disabled={processing}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAction}
            disabled={processing || (actionDialog?.action === 'rejected' && !reason.trim())}
            sx={{
              bgcolor: actionDialog?.action === 'approved' ? '#84BD00' : '#E74C3C',
              '&:hover': {
                bgcolor: actionDialog?.action === 'approved' ? '#6B9A00' : '#c0392b',
              },
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {processing
              ? 'Processing...'
              : actionDialog?.action === 'approved'
              ? 'Approve'
              : 'Reject'
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
