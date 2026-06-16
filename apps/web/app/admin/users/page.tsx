'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { api } from '@/lib/api';
import { useSnackbar } from '@/lib/snackbar';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
  phone?: string;
  companyName?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { showSnackbar } = useSnackbar();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page + 1));
      params.set('limit', String(limit));
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await api.get<User[]>(`/users?${params}`);
      if (res.data) setUsers(res.data);
      if (res.pagination) setTotal(res.pagination.total);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load users';
      showSnackbar(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, roleFilter, statusFilter, search, showSnackbar]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(0);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleStatusUpdate = async (userId: string, newStatus: string) => {
    try {
      await api.put(`/users/${userId}/status`, { status: newStatus });
      showSnackbar(`User ${newStatus} successfully`, 'success');
      setAnchorEl(null);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update user status';
      showSnackbar(message, 'error');
    }
  };

  const openMenu = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
      case 'super_admin': return { bgcolor: '#00266414', color: '#002664' };
      case 'seller': return { bgcolor: '#84BD0014', color: '#84BD00' };
      case 'buyer': return { bgcolor: '#4BA0A114', color: '#4BA0A1' };
      default: return { bgcolor: '#eee', color: '#666' };
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'active': return <Chip label="Active" size="small" color="success" />;
      case 'suspended': return <Chip label="Suspended" size="small" color="warning" />;
      case 'banned': return <Chip label="Banned" size="small" color="error" />;
      case 'pending': return <Chip label="Pending" size="small" color="info" />;
      default: return <Chip label={status} size="small" />;
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
          Users Management
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          View and manage all platform users
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by name or email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          size="small"
          sx={{ minWidth: 280 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: searchInput ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleSearch}>
                    <SearchIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />
        <TextField
          select
          label="Role"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
          sx={{ minWidth: 150 }}
          size="small"
        >
          <MenuItem value="">All Roles</MenuItem>
          <MenuItem value="buyer">Buyer</MenuItem>
          <MenuItem value="seller">Seller</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
        </TextField>
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          sx={{ minWidth: 150 }}
          size="small"
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="suspended">Suspended</MenuItem>
          <MenuItem value="banned">Banned</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
        </TextField>
      </Box>

      {/* Table */}
      <Card sx={{ borderRadius: 3, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fb' }}>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Joined</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: '#002664' }} />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            bgcolor: '#002664',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 13,
                            flexShrink: 0,
                          }}
                        >
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {u.firstName} {u.lastName}
                          </Typography>
                          {u.companyName && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {u.companyName}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{u.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={u.role.replace('_', ' ')}
                        size="small"
                        sx={{ ...getRoleColor(u.role), fontWeight: 600, textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>{getStatusChip(u.status)}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => openMenu(e, u)}>
                        <MoreVertIcon fontSize="small" />
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

      {/* Status Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => { setAnchorEl(null); setSelectedUser(null); }}
        slotProps={{ paper: { sx: { minWidth: 180, borderRadius: 2 } } }}
      >
        {selectedUser && selectedUser.status !== 'active' && (
          <MenuItem
            onClick={() => selectedUser && handleStatusUpdate(selectedUser.id, 'active')}
            sx={{ gap: 1.5, color: '#84BD00' }}
          >
            <CheckCircleIcon fontSize="small" /> Activate
          </MenuItem>
        )}
        {selectedUser && selectedUser.status !== 'suspended' && (
          <MenuItem
            onClick={() => selectedUser && handleStatusUpdate(selectedUser.id, 'suspended')}
            sx={{ gap: 1.5, color: '#F39C12' }}
          >
            <RemoveCircleIcon fontSize="small" /> Suspend
          </MenuItem>
        )}
        {selectedUser && selectedUser.status !== 'banned' && (
          <MenuItem
            onClick={() => selectedUser && handleStatusUpdate(selectedUser.id, 'banned')}
            sx={{ gap: 1.5, color: '#E74C3C' }}
          >
            <BlockIcon fontSize="small" /> Ban
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
