'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { api } from '@/lib/api';
import { useSnackbar } from '@/lib/snackbar';

interface PhoneNumber {
  id: string;
  number: string;
  areaCode: string;
  numberType: string;
  source: string;
  status: string;
  basePrice: number;
  monthlyPrice: number;
  vanityText?: string;
  createdAt: string;
}

export default function AdminNumbersPage() {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<PhoneNumber | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editDialog, setEditDialog] = useState<PhoneNumber | null>(null);
  const [editForm, setEditForm] = useState({ basePrice: '', monthlyPrice: '', status: '' });
  const [saving, setSaving] = useState(false);

  const { showSnackbar } = useSnackbar();
  const router = useRouter();

  const fetchNumbers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page + 1));
      params.set('limit', String(limit));
      if (sourceFilter) params.set('source', sourceFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await api.get<PhoneNumber[]>(`/numbers/admin/all?${params}`);
      if (res.data) setNumbers(res.data);
      if (res.pagination) setTotal(res.pagination.total);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load numbers';
      showSnackbar(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sourceFilter, statusFilter, showSnackbar]);

  useEffect(() => {
    fetchNumbers();
  }, [fetchNumbers]);

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setDeleting(true);
    try {
      await api.delete(`/numbers/admin/${deleteDialog.id}`);
      showSnackbar('Number deleted successfully', 'success');
      setDeleteDialog(null);
      fetchNumbers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete number';
      showSnackbar(message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (num: PhoneNumber) => {
    setEditForm({
      basePrice: String(num.basePrice),
      monthlyPrice: String(num.monthlyPrice),
      status: num.status,
    });
    setEditDialog(num);
  };

  const handleEdit = async () => {
    if (!editDialog) return;
    setSaving(true);
    try {
      await api.put(`/numbers/admin/${editDialog.id}`, {
        basePrice: parseFloat(editForm.basePrice),
        monthlyPrice: parseFloat(editForm.monthlyPrice),
        status: editForm.status,
      });
      showSnackbar('Number updated successfully', 'success');
      setEditDialog(null);
      fetchNumbers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update number';
      showSnackbar(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'sold': return 'default';
      case 'reserved': return 'warning';
      case 'inactive': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
            Numbers Management
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Manage all platform and broker numbers
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/admin/numbers/new')}
          sx={{
            bgcolor: '#002664',
            '&:hover': { bgcolor: '#001a45' },
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Add Number
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          select
          label="Source"
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setPage(0); }}
          sx={{ minWidth: 160 }}
          size="small"
        >
          <MenuItem value="">All Sources</MenuItem>
          <MenuItem value="platform">Platform</MenuItem>
          <MenuItem value="broker">Broker</MenuItem>
        </TextField>
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          sx={{ minWidth: 160 }}
          size="small"
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="available">Available</MenuItem>
          <MenuItem value="sold">Sold</MenuItem>
          <MenuItem value="reserved">Reserved</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </TextField>
      </Box>

      {/* Table */}
      <Card sx={{ borderRadius: 3, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fb' }}>
                <TableCell sx={{ fontWeight: 600 }}>Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Area Code</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Source</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Monthly</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: '#002664' }} />
                  </TableCell>
                </TableRow>
              ) : numbers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No numbers found
                  </TableCell>
                </TableRow>
              ) : (
                numbers.map((num) => (
                  <TableRow key={num.id} hover>
                    <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{num.number}</TableCell>
                    <TableCell>{num.areaCode}</TableCell>
                    <TableCell>
                      <Chip label={num.numberType} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={num.source}
                        size="small"
                        sx={{
                          bgcolor: num.source === 'platform' ? '#00266414' : '#E5393514',
                          color: num.source === 'platform' ? '#002664' : '#E53935',
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>${num.basePrice?.toFixed(2)}</TableCell>
                    <TableCell>${num.monthlyPrice?.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip label={num.status} size="small" color={getStatusColor(num.status) as any} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEdit(num)} sx={{ color: '#002664' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => setDeleteDialog(num)} sx={{ color: '#E74C3C' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Number</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteDialog?.number}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editDialog} onClose={() => setEditDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Edit Number: {editDialog?.number}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Base Price"
              type="number"
              value={editForm.basePrice}
              onChange={(e) => setEditForm({ ...editForm, basePrice: e.target.value })}
              fullWidth
            />
            <TextField
              label="Monthly Price"
              type="number"
              value={editForm.monthlyPrice}
              onChange={(e) => setEditForm({ ...editForm, monthlyPrice: e.target.value })}
              fullWidth
            />
            <TextField
              select
              label="Status"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              fullWidth
            >
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="sold">Sold</MenuItem>
              <MenuItem value="reserved">Reserved</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditDialog(null)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEdit}
            disabled={saving}
            sx={{ bgcolor: '#002664', '&:hover': { bgcolor: '#001a45' } }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
