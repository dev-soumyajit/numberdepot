'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { api } from '@/lib/api';
import { useSnackbar } from '@/lib/snackbar';

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

const CATEGORIES = ['Getting Started', 'Pricing', 'Numbers', 'Account', 'Billing', 'General'];

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [form, setForm] = useState({ question: '', answer: '', category: 'General' });
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<Faq | null>(null);

  const { showSnackbar } = useSnackbar();

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Faq[]>('/content/faqs');
      if (res.data) setFaqs(res.data);
    } catch {
      showSnackbar('Failed to load FAQs', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => { fetchFaqs(); }, [fetchFaqs]);

  const openAdd = () => {
    setEditing(null);
    setForm({ question: '', answer: '', category: 'General' });
    setDialog(true);
  };

  const openEdit = (faq: Faq) => {
    setEditing(faq);
    setForm({ question: faq.question, answer: faq.answer, category: faq.category });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      showSnackbar('Question and answer are required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/content/faqs/${editing.id}`, form);
        showSnackbar('FAQ updated', 'success');
      } else {
        await api.post('/content/faqs', { ...form, published: true });
        showSnackbar('FAQ created', 'success');
      }
      setDialog(false);
      fetchFaqs();
    } catch {
      showSnackbar('Failed to save FAQ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await api.delete(`/content/faqs/${deleteDialog.id}`);
      showSnackbar('FAQ deleted', 'success');
      setDeleteDialog(null);
      fetchFaqs();
    } catch {
      showSnackbar('Failed to delete FAQ', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton href="/admin/content" sx={{ color: '#002664' }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>FAQs</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Manage frequently asked questions</Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
          sx={{ bgcolor: '#002664', '&:hover': { bgcolor: '#001a45' }, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
          Add FAQ
        </Button>
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fb' }}>
                <TableCell sx={{ fontWeight: 600 }}>Question</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Order</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6 }}><CircularProgress size={32} sx={{ color: '#002664' }} /></TableCell></TableRow>
              ) : faqs.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>No FAQs yet. Click &quot;Add FAQ&quot; to create one.</TableCell></TableRow>
              ) : (
                faqs.map((faq) => (
                  <TableRow key={faq.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{faq.question}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                        {faq.answer.length > 100 ? faq.answer.substring(0, 100) + '...' : faq.answer}
                      </Typography>
                    </TableCell>
                    <TableCell><Chip label={faq.category} size="small" variant="outlined" /></TableCell>
                    <TableCell>{faq.order}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEdit(faq)} sx={{ color: '#002664' }}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => setDeleteDialog(faq)} sx={{ color: '#E74C3C' }}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{editing ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField label="Question" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} fullWidth />
            <TextField label="Answer" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} fullWidth multiline rows={4} />
            <TextField select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} fullWidth>
              {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialog(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ bgcolor: '#002664', '&:hover': { bgcolor: '#001a45' }, textTransform: 'none', fontWeight: 600 }}>
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create FAQ'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Delete FAQ</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete &quot;{deleteDialog?.question}&quot;?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
