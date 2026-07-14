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

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
}

const CATEGORIES = ['Tips', 'Guide', 'Features', 'News', 'Updates'];

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState({ title: '', excerpt: '', content: '', category: 'News' });
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<BlogPost | null>(null);

  const { showSnackbar } = useSnackbar();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<BlogPost[]>('/content/blog');
      if (res.data) setPosts(res.data);
    } catch {
      showSnackbar('Failed to load blog posts', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', excerpt: '', content: '', category: 'News' });
    setDialog(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditing(post);
    setForm({ title: post.title, excerpt: post.excerpt, content: post.content, category: post.category });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      showSnackbar('Title and content are required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/content/blog/${editing.id}`, { ...form, published: true });
        showSnackbar('Post updated', 'success');
      } else {
        await api.post('/content/blog', { ...form, published: true });
        showSnackbar('Post published', 'success');
      }
      setDialog(false);
      fetchPosts();
    } catch {
      showSnackbar('Failed to save post', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await api.delete(`/content/blog/${deleteDialog.id}`);
      showSnackbar('Post deleted', 'success');
      setDeleteDialog(null);
      fetchPosts();
    } catch {
      showSnackbar('Failed to delete post', 'error');
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
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>Blog Posts</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Create and manage blog content</Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
          sx={{ bgcolor: '#002664', '&:hover': { bgcolor: '#001a45' }, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
          New Post
        </Button>
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fb' }}>
                <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6 }}><CircularProgress size={32} sx={{ color: '#002664' }} /></TableCell></TableRow>
              ) : posts.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>No blog posts yet. Click &quot;New Post&quot; to create one.</TableCell></TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow key={post.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{post.title}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                        {post.excerpt.length > 80 ? post.excerpt.substring(0, 80) + '...' : post.excerpt}
                      </Typography>
                    </TableCell>
                    <TableCell><Chip label={post.category} size="small" variant="outlined" /></TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{post.date ? new Date(post.date).toLocaleDateString() : '—'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEdit(post)} sx={{ color: '#002664' }}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => setDeleteDialog(post)} sx={{ color: '#E74C3C' }}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{editing ? 'Edit Post' : 'New Post'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
            <TextField label="Excerpt (short summary)" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} fullWidth multiline rows={2} />
            <TextField
              label="Content (HTML supported)"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              fullWidth multiline rows={12}
              sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: 13 } }}
            />
            <TextField select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} fullWidth>
              {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialog(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ bgcolor: '#002664', '&:hover': { bgcolor: '#001a45' }, textTransform: 'none', fontWeight: 600 }}>
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Publish'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Post</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete &quot;{deleteDialog?.title}&quot;?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
