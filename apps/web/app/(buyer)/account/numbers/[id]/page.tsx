'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhoneForwardedIcon from '@mui/icons-material/PhoneForwarded';
import VoicemailIcon from '@mui/icons-material/Voicemail';
import HistoryIcon from '@mui/icons-material/History';
import SaveIcon from '@mui/icons-material/Save';
import { api } from '@/lib/api';

interface CallLog {
  id: string;
  from: string;
  to: string;
  duration: number;
  date: string;
  type: string;
  status: string;
}

interface OwnedNumber {
  id: string;
  number: string;
  numberType: string;
  areaCode: string;
  planType: string;
  monthlyAmount: number;
  status: string;
  acquiredDate: string;
  forwarding: { enabled: boolean; destination: string; schedule: string };
  voicemail: { enabled: boolean; greeting: string; transcription: boolean };
  callLogs: CallLog[];
}

const statusChipColor: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  answered: 'success',
  missed: 'error',
  voicemail: 'warning',
};

function formatDuration(seconds: number) {
  if (seconds === 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ManageNumberPage() {
  const params = useParams();
  const [num, setNum] = useState<OwnedNumber | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [forwarding, setForwarding] = useState({ enabled: false, destination: '', schedule: 'always' });
  const [voicemail, setVoicemail] = useState({ enabled: false, greeting: 'default', transcription: false });

  useEffect(() => {
    api.get<OwnedNumber>(`/account/numbers/${params.id}`).then((res) => {
      if (res.data) {
        setNum(res.data);
        setForwarding(res.data.forwarding);
        setVoicemail(res.data.voicemail);
      }
      setLoading(false);
    });
  }, [params.id]);

  const handleSave = async () => {
    await api.put(`/account/numbers/${params.id}`, { forwarding, voicemail });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <Box>
        <Skeleton height={60} sx={{ mb: 2 }} />
        <Skeleton height={300} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!num) {
    return <Alert severity="error">Number not found.</Alert>;
  }

  return (
    <Box>
      <Button component={Link} href="/account/numbers" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Back to My Numbers
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{num.number}</Typography>
        <Chip label={num.status} size="small" color={num.status === 'active' ? 'success' : 'error'} />
        <Chip label={`${num.planType} plan`} size="small" variant="outlined" />
        <Typography variant="body2" color="text.secondary">${num.monthlyAmount}/mo</Typography>
      </Box>

      {saved && <Alert severity="success" sx={{ mb: 2 }}>Settings saved successfully.</Alert>}

      <Grid container spacing={3}>
        {/* Forwarding */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PhoneForwardedIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Call Forwarding</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2">Enable forwarding</Typography>
              <Switch
                checked={forwarding.enabled}
                onChange={(e) => setForwarding({ ...forwarding, enabled: e.target.checked })}
              />
            </Box>
            {forwarding.enabled && (
              <>
                <TextField
                  fullWidth label="Forward to" placeholder="(555) 123-4567"
                  value={forwarding.destination}
                  onChange={(e) => setForwarding({ ...forwarding, destination: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth select label="Schedule"
                  value={forwarding.schedule}
                  onChange={(e) => setForwarding({ ...forwarding, schedule: e.target.value })}
                >
                  <MenuItem value="always">Always</MenuItem>
                  <MenuItem value="business_hours">Business Hours Only</MenuItem>
                  <MenuItem value="after_hours">After Hours Only</MenuItem>
                  <MenuItem value="weekdays">Weekdays Only</MenuItem>
                </TextField>
              </>
            )}
          </Card>
        </Grid>

        {/* Voicemail */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <VoicemailIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Voicemail</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2">Enable voicemail</Typography>
              <Switch
                checked={voicemail.enabled}
                onChange={(e) => setVoicemail({ ...voicemail, enabled: e.target.checked })}
              />
            </Box>
            {voicemail.enabled && (
              <>
                <TextField
                  fullWidth select label="Greeting"
                  value={voicemail.greeting}
                  onChange={(e) => setVoicemail({ ...voicemail, greeting: e.target.value })}
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="default">Default Greeting</MenuItem>
                  <MenuItem value="custom">Custom Greeting</MenuItem>
                  <MenuItem value="name_only">Name Only</MenuItem>
                </TextField>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Voicemail transcription</Typography>
                  <Switch
                    checked={voicemail.transcription}
                    onChange={(e) => setVoicemail({ ...voicemail, transcription: e.target.checked })}
                  />
                </Box>
              </>
            )}
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, mb: 4, textAlign: 'right' }}>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
          Save Settings
        </Button>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Call Logs */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <HistoryIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Recent Call Log</Typography>
      </Box>

      {num.callLogs.length === 0 ? (
        <Alert severity="info">No call history yet.</Alert>
      ) : (
        <Card variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>From</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {num.callLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{log.from}</TableCell>
                  <TableCell>{new Date(log.date).toLocaleString()}</TableCell>
                  <TableCell>{formatDuration(log.duration)}</TableCell>
                  <TableCell>
                    <Chip label={log.status} size="small" color={statusChipColor[log.status] || 'default'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </Box>
  );
}
