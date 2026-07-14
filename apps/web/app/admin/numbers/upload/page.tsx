'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useSnackbar } from '@/lib/snackbar';

interface UploadResult {
  inserted: number;
  duplicates: number;
  errors: number;
  total: number;
  errorDetails: string[];
}

export default function BulkUploadPage() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    // Parse preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        showSnackbar('CSV must have a header and at least one data row', 'error');
        return;
      }
      const hdrs = lines[0].split(',').map((h) => h.trim());
      setHeaders(hdrs);
      const rows = lines.slice(1, 11).map((l) => l.split(',').map((c) => c.trim()));
      setPreview(rows);
    };
    reader.readAsText(f);
  }, [showSnackbar]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/numbers/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        showSnackbar(data.error || 'Upload failed', 'error');
        return;
      }

      setResult(data.data);
      showSnackbar(`Successfully uploaded ${data.data.inserted} numbers`, 'success');
    } catch (err) {
      showSnackbar('Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/admin/numbers')}
          sx={{ color: 'text.secondary' }}
        >
          Back
        </Button>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
            Bulk Upload Numbers
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Upload a CSV file to add numbers in bulk
          </Typography>
        </Box>
      </Box>

      {/* CSV Format Info */}
      <Card sx={{ mb: 3, borderRadius: 3, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            CSV Format
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Required column: <strong>TN</strong> (or &quot;number&quot;). The system auto-detects toll-free, vanity, and premium numbers. Pricing defaults are applied if not provided.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Supported columns: TN, Nickname, City, State, Account Number, PIN, price, monthlyPrice, setupFee, numberType, isPremium
          </Typography>
          <Typography component="div" variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', bgcolor: '#f5f7fa', p: 1, borderRadius: 1, fontSize: '0.75rem' }}>
            TN,Nickname,Account Number,PIN,City,State,Transfer Lock<br />
            12125551234,(212) 555-1234,ACCT123,PIN1,New York,NY,N<br />
            18005551000,(800) 555-1000,ACCT123,PIN2,Toll Free,,N<br />
            12025559999,202-555-SEXY,ACCT123,PIN3,Washington,DC,N
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Toll-free (800/888/877/866/855/844/833) auto-detected. Vanity detected from Nickname containing letters. Premium detected from repeating/sequential digit patterns. Default prices: Local $99, Toll-Free $199, Vanity $299 (premium numbers get higher defaults).
          </Typography>
        </CardContent>
      </Card>

      {/* File Picker */}
      <Card sx={{ mb: 3, borderRadius: 3, border: '2px dashed #ddd', boxShadow: 'none' }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <UploadFileIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body1" sx={{ mb: 2 }}>
            {file ? file.name : 'Select a CSV file to upload'}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose File
          </Button>
        </CardContent>
      </Card>

      {/* Preview Table */}
      {preview.length > 0 && (
        <Card sx={{ mb: 3, borderRadius: 3, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
              Preview (first {preview.length} rows)
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8f9fb' }}>
                    {headers.map((h, i) => (
                      <TableCell key={i} sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.map((row, i) => (
                    <TableRow key={i}>
                      {row.map((cell, j) => (
                        <TableCell key={j} sx={{ fontSize: '0.8rem' }}>
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Upload Button */}
      {file && !result && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleUpload}
            disabled={uploading}
            startIcon={<UploadFileIcon />}
            sx={{
              bgcolor: '#002664',
              '&:hover': { bgcolor: '#001a45' },
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {uploading ? 'Uploading...' : 'Upload Numbers'}
          </Button>
          {uploading && <LinearProgress sx={{ mt: 1 }} />}
        </Box>
      )}

      {/* Results */}
      {result && (
        <Card sx={{ borderRadius: 3, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CheckCircleIcon sx={{ color: 'success.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Upload Complete
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Chip label={`${result.inserted} Inserted`} color="success" sx={{ fontWeight: 700 }} />
              {result.duplicates > 0 && (
                <Chip label={`${result.duplicates} Duplicates`} color="warning" sx={{ fontWeight: 700 }} />
              )}
              {result.errors > 0 && (
                <Chip label={`${result.errors} Errors`} color="error" sx={{ fontWeight: 700 }} />
              )}
              <Chip label={`${result.total} Total Rows`} variant="outlined" sx={{ fontWeight: 700 }} />
            </Box>
            {result.errorDetails.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Error Details
                </Typography>
                {result.errorDetails.map((err, i) => (
                  <Typography key={i} variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {err}
                  </Typography>
                ))}
              </Alert>
            )}
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={() => router.push('/admin/numbers')}
                sx={{
                  bgcolor: '#002664',
                  '&:hover': { bgcolor: '#001a45' },
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Back to Numbers
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
