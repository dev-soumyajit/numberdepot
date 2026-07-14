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
import UploadFileIcon from '@mui/icons-material/UploadFile';
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
  salePrice: number;
  monthlyPrice: number;
  setupFee: number;
  vanityText?: string;
  description?: string;
  city?: string;
  state?: string;
  isPremium: boolean;
  isVanity: boolean;
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
  const [editForm, setEditForm] = useState({ basePrice: '', monthlyPrice: '', setupFee: '', status: '', numberType: '', vanityText: '', isPremium: false, description: '' });
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
      basePrice: String(num.basePrice || num.salePrice || 0),
      monthlyPrice: String(num.monthlyPrice || 0),
      setupFee: String(num.setupFee || 0),
      status: num.status,
      numberType: num.numberType || 'local',
      vanityText: num.vanityText || '',
      isPremium: num.isPremium || false,
      description: num.description || '',
    });
    setEditDialog(num);
  };

  const handleEdit = async () => {
    if (!editDialog) return;
    setSaving(true);
    try {
      await api.put(`/numbers/admin/${editDialog.id}`, {
        basePrice: parseFloat(editForm.basePrice) || 0,
        monthlyPrice: parseFloat(editForm.monthlyPrice) || 0,
        setupFee: parseFloat(editForm.setupFee) || 0,
        status: editForm.status,
        numberType: editForm.numberType,
        vanityText: editForm.vanityText || undefined,
        isPremium: editForm.isPremium,
        description: editForm.description || undefined,
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
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={() => router.push('/admin/numbers/upload')}
            sx={{
              borderColor: '#002664',
              color: '#002664',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Bulk Upload
          </Button>
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
          <MenuItem value="inventory">Inventory</MenuItem>
          <MenuItem value="numberbarn">NumberBarn</MenuItem>
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
                          bgcolor: num.source === 'inventory' ? '#00266414' : '#E5393514',
                          color: num.source === 'inventory' ? '#002664' : '#E53935',
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: (num.basePrice || num.salePrice) ? 'inherit' : 'error.main', fontWeight: (num.basePrice || num.salePrice) ? 400 : 600 }}>
                      {(num.basePrice || num.salePrice) ? `$${(num.basePrice || num.salePrice).toFixed(2)}` : 'No price'}
                    </TableCell>
                    <TableCell sx={{ color: num.monthlyPrice ? 'inherit' : 'text.disabled' }}>
                      {num.monthlyPrice ? `$${num.monthlyPrice.toFixed(2)}` : '—'}
                    </TableCell>
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
        <DialogTitle sx={{ fontWeight: 600 }}>
          Edit Number: {editDialog?.number}
          {editDialog?.city && editDialog?.state && (
            <Typography variant="body2" color="text.secondary">
              {editDialog.city}, {editDialog.state}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Pricing */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a1a2e', mt: 1, mb: -1 }}>
              Pricing
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Sale Price ($)"
                type="number"
                value={editForm.basePrice}
                onChange={(e) => setEditForm({ ...editForm, basePrice: e.target.value })}
                fullWidth
                slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                helperText={!editForm.basePrice || editForm.basePrice === '0' ? 'Price required for listing' : ''}
                error={!editForm.basePrice || editForm.basePrice === '0'}
              />
              <TextField
                label="Monthly ($)"
                type="number"
                value={editForm.monthlyPrice}
                onChange={(e) => setEditForm({ ...editForm, monthlyPrice: e.target.value })}
                fullWidth
                slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              />
            </Box>
            <TextField
              label="Setup Fee ($)"
              type="number"
              value={editForm.setupFee}
              onChange={(e) => setEditForm({ ...editForm, setupFee: e.target.value })}
              fullWidth
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            />

            {/* Classification */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a1a2e', mt: 1, mb: -1 }}>
              Classification
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label="Number Type"
                value={editForm.numberType}
                onChange={(e) => setEditForm({ ...editForm, numberType: e.target.value })}
                fullWidth
              >
                <MenuItem value="local">Local</MenuItem>
                <MenuItem value="toll_free">Toll-Free</MenuItem>
                <MenuItem value="vanity">Vanity</MenuItem>
              </TextField>
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
            <TextField
              label="Vanity Text"
              value={editForm.vanityText}
              onChange={(e) => setEditForm({ ...editForm, vanityText: e.target.value })}
              fullWidth
              placeholder="e.g. 1-800-FLOWERS"
            />
            <TextField
              label="Description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="Location or description..."
            />
            <Box>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editForm.isPremium}
                  onChange={(e) => setEditForm({ ...editForm, isPremium: e.target.checked })}
                />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Premium Number</Typography>
              </label>
            </Box>
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
