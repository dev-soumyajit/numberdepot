'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { api } from '@/lib/api';
import { useSnackbar } from '@/lib/snackbar';

interface SettingsMap {
  [key: string]: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [originalSettings, setOriginalSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [addDialog, setAddDialog] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const { showSnackbar } = useSnackbar();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<SettingsMap>('/admin/settings');
      if (res.data) {
        const data = typeof res.data === 'object' ? res.data : {};
        setSettings({ ...data });
        setOriginalSettings({ ...data });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load settings';
      showSnackbar(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const hasChanges = () => {
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const changedSettings: SettingsMap = {};
      for (const key of Object.keys(settings)) {
        if (settings[key] !== originalSettings[key]) {
          changedSettings[key] = settings[key];
        }
      }

      if (Object.keys(changedSettings).length === 0) {
        showSnackbar('No changes to save', 'info');
        setSaving(false);
        return;
      }

      await api.put('/admin/settings', changedSettings);
      showSnackbar('Settings saved successfully', 'success');
      setOriginalSettings({ ...settings });
      setEditingKey(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save settings';
      showSnackbar(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSetting = async () => {
    const key = newKey.trim();
    const value = newValue.trim();
    if (!key) {
      showSnackbar('Key is required', 'error');
      return;
    }
    if (settings[key] !== undefined) {
      showSnackbar('Setting already exists', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.put('/admin/settings', { [key]: value });
      showSnackbar('Setting added successfully', 'success');
      setSettings({ ...settings, [key]: value });
      setOriginalSettings({ ...originalSettings, [key]: value });
      setAddDialog(false);
      setNewKey('');
      setNewValue('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add setting';
      showSnackbar(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleValueChange = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleDiscard = () => {
    setSettings({ ...originalSettings });
    setEditingKey(null);
  };

  const formatKeyLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
        <CircularProgress sx={{ color: '#002664' }} />
      </Box>
    );
  }

  const settingKeys = Object.keys(settings).sort();

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
            Platform Settings
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Configure platform-wide settings
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchSettings}
            sx={{ textTransform: 'none', borderColor: '#ccc', color: '#666', borderRadius: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setAddDialog(true)}
            sx={{
              textTransform: 'none',
              borderColor: '#E53935',
              color: '#E53935',
              '&:hover': { borderColor: '#C62828', bgcolor: '#E5393508' },
              borderRadius: 2,
            }}
          >
            Add Setting
          </Button>
        </Box>
      </Box>

      {hasChanges() && (
        <Alert
          severity="info"
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" onClick={handleDiscard} sx={{ textTransform: 'none' }}>
                Discard
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                sx={{
                  bgcolor: '#002664',
                  '&:hover': { bgcolor: '#001a45' },
                  textTransform: 'none',
                }}
              >
                {saving ? 'Saving...' : 'Save All'}
              </Button>
            </Box>
          }
        >
          You have unsaved changes.
        </Alert>
      )}

      <Card sx={{ borderRadius: 3, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <CardContent sx={{ p: 0 }}>
          {settingKeys.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                No settings configured
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.disabled', mt: 1 }}>
                Click &quot;Add Setting&quot; to create your first platform setting.
              </Typography>
            </Box>
          ) : (
            settingKeys.map((key, index) => (
              <Box key={key}>
                {index > 0 && <Divider />}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    px: 3,
                    py: 2.5,
                    '&:hover': { bgcolor: '#f8f9fb' },
                  }}
                >
                  <Box sx={{ flex: '0 0 240px' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                      {formatKeyLabel(key)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: 'monospace' }}>
                      {key}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    {editingKey === key ? (
                      <TextField
                        value={settings[key]}
                        onChange={(e) => handleValueChange(key, e.target.value)}
                        size="small"
                        fullWidth
                        autoFocus
                        onBlur={() => setEditingKey(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setEditingKey(null);
                          if (e.key === 'Escape') {
                            setSettings({ ...settings, [key]: originalSettings[key] });
                            setEditingKey(null);
                          }
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: settings[key] !== originalSettings[key] ? '#E53935' : 'text.secondary',
                            fontWeight: settings[key] !== originalSettings[key] ? 600 : 400,
                            fontFamily: 'monospace',
                            cursor: 'pointer',
                            '&:hover': { color: '#002664' },
                          }}
                          onClick={() => setEditingKey(key)}
                        >
                          {settings[key] || '(empty)'}
                        </Typography>
                        <IconButton size="small" onClick={() => setEditingKey(key)} sx={{ color: '#999' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            ))
          )}
        </CardContent>
      </Card>

      {hasChanges() && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleDiscard}
            sx={{ textTransform: 'none', borderColor: '#ccc', color: '#666', borderRadius: 2 }}
          >
            Discard Changes
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            sx={{
              bgcolor: '#002664',
              '&:hover': { bgcolor: '#001a45' },
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 4,
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      )}

      {/* Add Setting Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Add New Setting</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Setting Key"
              placeholder="e.g. commissionRate, platformFee"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              fullWidth
              helperText="Use camelCase or snake_case"
            />
            <TextField
              label="Value"
              placeholder="Enter value..."
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddDialog(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddSetting}
            disabled={saving || !newKey.trim()}
            sx={{
              bgcolor: '#002664',
              '&:hover': { bgcolor: '#001a45' },
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {saving ? 'Adding...' : 'Add Setting'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
