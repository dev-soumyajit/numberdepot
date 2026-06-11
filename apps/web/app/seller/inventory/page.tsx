'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import { api } from '@/lib/api';
import { useSnackbar } from '@/lib/snackbar';

interface PhoneNumber {
  id: string;
  number: string;
  countryCode: string;
  areaCode: string;
  numberType: string;
  vanityText?: string;
  basePrice: number;
  salePrice?: number;
  licensePrice?: number;
  monthlyPrice?: number;
  listingType: string;
  isVanity: boolean;
  isPremium: boolean;
  isPortable: boolean;
  status: string;
  createdAt: string;
}

type StatusFilter = 'all' | 'active' | 'sold' | 'pending' | 'inactive';

const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: '#84BD0020', text: '#6B9A00' },
  sold: { bg: '#144B6E20', text: '#144B6E' },
  pending: { bg: '#F7941E20', text: '#E8850A' },
  inactive: { bg: '#E0E6ED', text: '#535E66' },
  delisted: { bg: '#E74C3C20', text: '#E74C3C' },
};

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

export default function InventoryPage() {
  const { showSnackbar } = useSnackbar();
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedNumber, setSelectedNumber] = useState<PhoneNumber | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchNumbers = useCallback(async () => {
    try {
      const res = await api.get<PhoneNumber[]>('/numbers/my');
      if (res.data) setNumbers(res.data);
    } catch {
      showSnackbar('Failed to load numbers', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchNumbers();
  }, [fetchNumbers]);

  const filtered = numbers.filter((n) => {
    const matchesFilter = filter === 'all' || n.status === filter;
    const matchesSearch = !search || n.number.includes(search) || n.vanityText?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, num: PhoneNumber) => {
    setMenuAnchor(e.currentTarget);
    setSelectedNumber(num);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedNumber) return;
    setDeleting(true);
    try {
      await api.delete(`/numbers/seller/${selectedNumber.id}`);
      showSnackbar('Number delisted successfully', 'success');
      setNumbers((prev) => prev.filter((n) => n.id !== selectedNumber.id));
    } catch {
      showSnackbar('Failed to delist number', 'error');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedNumber(null);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h3" sx={{ color: '#144B6E', fontWeight: 700 }}>
            My Numbers
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Manage your phone number inventory.
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/seller/inventory/new"
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
        >
          Add Number
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', py: 2, '&:last-child': { pb: 2 } }}>
          <TextField
            placeholder="Search numbers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 260 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(_, val) => val && setFilter(val as StatusFilter)}
            size="small"
          >
            <ToggleButton value="all" sx={{ textTransform: 'capitalize', px: 2 }}>All</ToggleButton>
            <ToggleButton value="active" sx={{ textTransform: 'capitalize', px: 2 }}>Active</ToggleButton>
            <ToggleButton value="sold" sx={{ textTransform: 'capitalize', px: 2 }}>Sold</ToggleButton>
            <ToggleButton value="pending" sx={{ textTransform: 'capitalize', px: 2 }}>Pending</ToggleButton>
            <ToggleButton value="inactive" sx={{ textTransform: 'capitalize', px: 2 }}>Inactive</ToggleButton>
          </ToggleButtonGroup>
          <Typography variant="body2" sx={{ color: 'text.secondary', ml: 'auto' }}>
            {filtered.length} number{filtered.length !== 1 ? 's' : ''}
          </Typography>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Number</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Listing</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Price</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Tags</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', width: 60 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((num) => {
                  const sc = statusColors[num.status] || statusColors.inactive;
                  return (
                    <TableRow key={num.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.95rem' }}>
                          {num.number}
                        </Typography>
                        {num.vanityText && (
                          <Typography variant="caption" sx={{ color: '#F7941E', fontWeight: 600 }}>
                            {num.vanityText}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{num.numberType}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{num.listingType}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }}>
                          {num.salePrice ? formatCurrency(num.salePrice) : num.licensePrice ? `${formatCurrency(num.licensePrice)}/mo` : formatCurrency(num.basePrice)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={num.status}
                          size="small"
                          sx={{ bgcolor: sc.bg, color: sc.text, fontWeight: 600, textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {num.isVanity && (
                            <Chip label="Vanity" size="small" sx={{ bgcolor: '#F7941E20', color: '#E8850A', fontSize: '0.7rem' }} />
                          )}
                          {num.isPremium && (
                            <Chip label="Premium" size="small" sx={{ bgcolor: '#144B6E20', color: '#144B6E', fontSize: '0.7rem' }} />
                          )}
                          {num.isPortable && (
                            <Chip label="Portable" size="small" sx={{ bgcolor: '#4BA0A120', color: '#4BA0A1', fontSize: '0.7rem' }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Actions">
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, num)}>
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                      {search || filter !== 'all' ? 'No numbers match your filters.' : 'You have not listed any numbers yet.'}
                    </Typography>
                    {!search && filter === 'all' && (
                      <Button
                        component={Link}
                        href="/seller/inventory/new"
                        variant="contained"
                        color="secondary"
                        startIcon={<AddIcon />}
                        sx={{ mt: 2 }}
                      >
                        Add Your First Number
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Actions Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem
          component={Link}
          href={selectedNumber ? `/seller/inventory/${selectedNumber.id}/edit` : '#'}
          onClick={handleMenuClose}
        >
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
          <ListItemText>Delist</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Confirm Delist</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delist <strong>{selectedNumber?.number}</strong>? This will remove the number from the marketplace. You can relist it later.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Delisting...' : 'Delist Number'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
