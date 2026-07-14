'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DescriptionIcon from '@mui/icons-material/Description';
import { api } from '@/lib/api';
import { useSnackbar } from '@/lib/snackbar';

interface ContentPage {
  id?: string;
  slug: string;
  title: string;
  content: string;
  updatedAt?: string;
}

const PAGE_DEFINITIONS = [
  { slug: 'about', title: 'About Us', description: 'Company info and mission statement', color: '#84BD00' },
  { slug: 'terms', title: 'Terms of Service', description: 'Legal terms and conditions', color: '#002664' },
  { slug: 'privacy', title: 'Privacy Policy', description: 'Data privacy and cookie policy', color: '#E53935' },
];

export default function AdminPagesPage() {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [editPage, setEditPage] = useState<ContentPage | null>(null);
  const [form, setForm] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);

  const { showSnackbar } = useSnackbar();

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ContentPage[]>('/content/pages');
      if (res.data) setPages(res.data);
    } catch {
      // No pages yet — that's fine
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const openEdit = async (slug: string, defaultTitle: string) => {
    const existing = pages.find((p) => p.slug === slug);
    setEditPage({ slug, title: defaultTitle, content: '', ...existing });
    setForm({
      title: existing?.title || defaultTitle,
      content: existing?.content || '',
    });
    setEditDialog(true);
  };

  const handleSave = async () => {
    if (!editPage) return;
    setSaving(true);
    try {
      await api.put(`/content/pages/${editPage.slug}`, form);
      showSnackbar('Page updated', 'success');
      setEditDialog(false);
      fetchPages();
    } catch {
      showSnackbar('Failed to save page', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getPageStatus = (slug: string) => {
    const page = pages.find((p) => p.slug === slug);
    if (page?.content) return { label: 'Custom', color: 'success' as const };
    return { label: 'Default', color: 'default' as const };
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#002664' }} /></Box>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton href="/admin/content" sx={{ color: '#002664' }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>Static Pages</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Edit About, Terms, and Privacy pages</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {PAGE_DEFINITIONS.map((def) => {
          const status = getPageStatus(def.slug);
          return (
            <Grid size={{ xs: 12, md: 4 }} key={def.slug}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: `${def.color}14`, color: def.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <DescriptionIcon />
                    </Box>
                    <Chip label={status.label} size="small" color={status.color} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>{def.title}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>{def.description}</Typography>
                  <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => openEdit(def.slug, def.title)}
                    sx={{ textTransform: 'none', borderColor: def.color, color: def.color }}>
                    Edit Content
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Edit: {editPage?.title}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField label="Page Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
            <TextField
              label="Content (HTML supported)"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              fullWidth
              multiline
              rows={16}
              placeholder="Enter page content... HTML tags are supported for formatting."
              sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: 13 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditDialog(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ bgcolor: '#002664', '&:hover': { bgcolor: '#001a45' }, textTransform: 'none', fontWeight: 600 }}>
            {saving ? 'Saving...' : 'Save Page'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
