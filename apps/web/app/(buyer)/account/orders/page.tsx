'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Pagination from '@mui/material/Pagination';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import { api, ApiResponse } from '@/lib/api';
import { useSnackbar } from '@/lib/snackbar';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
  items?: Array<{
    number: string;
    planType: string;
  }>;
}

function getStatusColor(status: string): { bg: string; text: string } {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'paid':
      return { bg: '#84BD0018', text: '#6B9A00' };
    case 'pending':
    case 'processing':
      return { bg: '#E5393518', text: '#C62828' };
    case 'cancelled':
    case 'failed':
      return { bg: '#E74C3C18', text: '#E74C3C' };
    case 'refunded':
      return { bg: '#4BA0A118', text: '#4BA0A1' };
    default:
      return { bg: '#00266418', text: '#002664' };
  }
}

export default function OrdersPage() {
  const { showSnackbar } = useSnackbar();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get<Order[]>(`/orders?page=${page}&limit=10`)
      .then((res: ApiResponse<Order[]>) => {
        setOrders(res.data || []);
        setTotalPages(res.pagination?.totalPages || 1);
      })
      .catch(() => showSnackbar('Failed to load orders', 'error'))
      .finally(() => setLoading(false));
  }, [page, showSnackbar]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Order History
      </Typography>

      {orders.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <ShoppingBagIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              No orders yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              When you purchase phone numbers, your orders will appear here.
            </Typography>
            <Button component={Link} href="/search" variant="contained" color="secondary">
              Browse Numbers
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.paper' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Order Number</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => {
                    const statusColor = getStatusColor(order.status);
                    return (
                      <TableRow
                        key={order.id}
                        sx={{
                          '&:hover': { bgcolor: 'action.hover' },
                          cursor: 'pointer',
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" color="primary.main" sx={{ fontWeight: 700 }}>
                            {order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {order.itemCount || order.items?.length || 0} item{(order.itemCount || order.items?.length || 0) !== 1 ? 's' : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            ${order.totalAmount.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={order.status}
                            size="small"
                            sx={{
                              bgcolor: statusColor.bg,
                              color: statusColor.text,
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              textTransform: 'capitalize',
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* Mobile Cards */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {orders.map((order) => {
              const statusColor = getStatusColor(order.status);
              return (
                <Card key={order.id} sx={{ mb: 2 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700 }}>
                        {order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                      </Typography>
                      <Chip
                        label={order.status}
                        size="small"
                        sx={{
                          bgcolor: statusColor.bg,
                          color: statusColor.text,
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          textTransform: 'capitalize',
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        ${order.totalAmount.toFixed(2)}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {order.itemCount || order.items?.length || 0} item{(order.itemCount || order.items?.length || 0) !== 1 ? 's' : ''}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, p) => setPage(p)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
