'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { api } from '@/lib/api';
import { useSnackbar } from '@/lib/snackbar';

interface Plan {
  id: string;
  title: string;
  price: number;
  description: string;
}

interface FeeItem {
  id: string;
  label: string;
  amount: number;
  perItem: boolean;
}

export default function AdminPricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [originalPlans, setOriginalPlans] = useState<Plan[]>([]);
  const [originalFees, setOriginalFees] = useState<FeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Plan dialog
  const [planDialog, setPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState({ id: '', title: '', price: '', description: '' });

  // Fee dialog
  const [feeDialog, setFeeDialog] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeItem | null>(null);
  const [feeForm, setFeeForm] = useState({ id: '', label: '', amount: '', perItem: true });

  const { showSnackbar } = useSnackbar();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, feesRes] = await Promise.all([
        api.get<Plan[]>('/admin/plans'),
        api.get<FeeItem[]>('/admin/fees'),
      ]);
      const p = plansRes.data || [];
      const f = feesRes.data || [];
      setPlans(p);
      setOriginalPlans(JSON.parse(JSON.stringify(p)));
      setFees(f);
      setOriginalFees(JSON.parse(JSON.stringify(f)));
    } catch {
      showSnackbar('Failed to load pricing data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const hasChanges = JSON.stringify(plans) !== JSON.stringify(originalPlans) ||
    JSON.stringify(fees) !== JSON.stringify(originalFees);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const promises: Promise<unknown>[] = [];
      if (JSON.stringify(plans) !== JSON.stringify(originalPlans)) {
        promises.push(api.put('/admin/plans', { plans }));
      }
      if (JSON.stringify(fees) !== JSON.stringify(originalFees)) {
        promises.push(api.put('/admin/fees', { fees }));
      }
      await Promise.all(promises);
      showSnackbar('Pricing saved successfully', 'success');
      setOriginalPlans(JSON.parse(JSON.stringify(plans)));
      setOriginalFees(JSON.parse(JSON.stringify(fees)));
    } catch {
      showSnackbar('Failed to save pricing', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setPlans(JSON.parse(JSON.stringify(originalPlans)));
    setFees(JSON.parse(JSON.stringify(originalFees)));
  };

  // ── Plan handlers ──
  const openAddPlan = () => {
    setEditingPlan(null);
    setPlanForm({ id: '', title: '', price: '', description: '' });
    setPlanDialog(true);
  };
  const openEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanForm({ id: plan.id, title: plan.title, price: String(plan.price), description: plan.description });
    setPlanDialog(true);
  };
  const handleSavePlan = () => {
    const { id, title, price, description } = planForm;
    if (!id.trim() || !title.trim() || !price.trim()) {
      showSnackbar('ID, Title and Price are required', 'error');
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      showSnackbar('Price must be a valid number', 'error');
      return;
    }
    const plan: Plan = { id: id.trim().toLowerCase().replace(/\s+/g, '_'), title: title.trim(), price: priceNum, description: description.trim() };
    if (editingPlan) {
      setPlans(plans.map((p) => (p.id === editingPlan.id ? plan : p)));
    } else {
      if (plans.some((p) => p.id === plan.id)) { showSnackbar('Plan ID already exists', 'error'); return; }
      setPlans([...plans, plan]);
    }
    setPlanDialog(false);
  };

  // ── Fee handlers ──
  const openAddFee = () => {
    setEditingFee(null);
    setFeeForm({ id: '', label: '', amount: '', perItem: true });
    setFeeDialog(true);
  };
  const openEditFee = (fee: FeeItem) => {
    setEditingFee(fee);
    setFeeForm({ id: fee.id, label: fee.label, amount: String(fee.amount), perItem: fee.perItem });
    setFeeDialog(true);
  };
  const handleSaveFee = () => {
    const { id, label, amount, perItem } = feeForm;
    if (!label.trim()) {
      showSnackbar('Label is required', 'error');
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 0) {
      showSnackbar('Amount must be a valid number', 'error');
      return;
    }
    const feeId = id.trim() || label.trim().toLowerCase().replace(/\s+/g, '_');
    const fee: FeeItem = { id: feeId, label: label.trim(), amount: amountNum, perItem };
    if (editingFee) {
      setFees(fees.map((f) => (f.id === editingFee.id ? fee : f)));
    } else {
      if (fees.some((f) => f.id === feeId)) { showSnackbar('Fee ID already exists', 'error'); return; }
      setFees([...fees, fee]);
    }
    setFeeDialog(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress sx={{ color: '#002664' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e' }}>Pricing Management</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Manage service plans and checkout fees
          </Typography>
        </Box>
      </Box>

      {hasChanges && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }} action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" onClick={handleDiscard} sx={{ textTransform: 'none' }}>Discard</Button>
            <Button size="small" variant="contained" onClick={handleSaveAll} disabled={saving}
              sx={{ bgcolor: '#002664', '&:hover': { bgcolor: '#001a45' }, textTransform: 'none' }}>
              {saving ? 'Saving...' : 'Save All'}
            </Button>
          </Box>
        }>
          You have unsaved changes.
        </Alert>
      )}

      {/* ── Service Plans ── */}
      <Card sx={{ borderRadius: 3, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Service Plans</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={openAddPlan}
              sx={{ textTransform: 'none', color: '#002664', fontWeight: 600 }}>
              Add Plan
            </Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Monthly Price</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No plans configured.</TableCell></TableRow>
                ) : plans.map((plan) => (
                  <TableRow key={plan.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#666' }}>{plan.id}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{plan.title}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 700, color: '#002664' }}>${plan.price.toFixed(2)}/mo</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary" sx={{ maxWidth: 250 }}>{plan.description}</Typography></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEditPlan(plan)} sx={{ color: '#002664' }}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => setPlans(plans.filter(p => p.id !== plan.id))} sx={{ color: '#E53935' }}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* ── Checkout Fees ── */}
      <Card sx={{ borderRadius: 3, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Checkout Fees</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={openAddFee}
              sx={{ textTransform: 'none', color: '#002664', fontWeight: 600 }}>
              Add Fee
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            These fees appear in the cart breakdown at checkout. Set amount to $0 to hide a fee.
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Label</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Applies</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fees.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No fees configured.</TableCell></TableRow>
                ) : fees.map((fee) => (
                  <TableRow key={fee.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{fee.label}</Typography>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#999' }}>{fee.id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: fee.amount > 0 ? '#002664' : '#999' }}>
                        ${fee.amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={fee.perItem ? 'Per Number' : 'Per Order'}
                        size="small"
                        sx={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          bgcolor: fee.perItem ? '#4BA0A118' : '#ff980018',
                          color: fee.perItem ? '#4BA0A1' : '#ff9800',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={fee.amount > 0 ? 'Visible' : 'Hidden'}
                        size="small"
                        sx={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          bgcolor: fee.amount > 0 ? '#84BD0018' : '#66666618',
                          color: fee.amount > 0 ? '#84BD00' : '#999',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEditFee(fee)} sx={{ color: '#002664' }}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => setFees(fees.filter(f => f.id !== fee.id))} sx={{ color: '#E53935' }}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Save buttons */}
      {hasChanges && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={handleDiscard}
            sx={{ textTransform: 'none', borderColor: '#ccc', color: '#666', borderRadius: 2 }}>
            Discard Changes
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveAll} disabled={saving}
            sx={{ bgcolor: '#002664', '&:hover': { bgcolor: '#001a45' }, textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 4 }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      )}

      {/* ── Plan Dialog ── */}
      <Dialog open={planDialog} onClose={() => setPlanDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{editingPlan ? 'Edit Plan' : 'Add New Plan'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField label="Plan ID" placeholder="e.g. park, forward" value={planForm.id}
              onChange={(e) => setPlanForm({ ...planForm, id: e.target.value })} fullWidth disabled={!!editingPlan}
              helperText={editingPlan ? 'ID cannot be changed' : 'Unique identifier (lowercase)'} />
            <TextField label="Title" placeholder="e.g. Park, Forward" value={planForm.title}
              onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })} fullWidth />
            <TextField label="Monthly Price ($)" placeholder="9.99" value={planForm.price}
              onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} fullWidth type="number"
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
            <TextField label="Description" placeholder="Brief description..." value={planForm.description}
              onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} fullWidth multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPlanDialog(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePlan}
            sx={{ bgcolor: '#002664', '&:hover': { bgcolor: '#001a45' }, textTransform: 'none', fontWeight: 600 }}>
            {editingPlan ? 'Update' : 'Add Plan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Fee Dialog ── */}
      <Dialog open={feeDialog} onClose={() => setFeeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{editingFee ? 'Edit Fee' : 'Add New Fee'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField label="Fee Label" placeholder="e.g. Setup Fee, Porting Fee, Regulatory Fee"
              value={feeForm.label} onChange={(e) => setFeeForm({ ...feeForm, label: e.target.value })} fullWidth
              helperText="This label will appear in the cart breakdown" />
            <TextField label="Amount ($)" placeholder="9.99" value={feeForm.amount}
              onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })} fullWidth type="number"
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              helperText="Set to 0 to hide this fee from the cart" />
            <FormControlLabel
              control={<Switch checked={feeForm.perItem} onChange={(e) => setFeeForm({ ...feeForm, perItem: e.target.checked })} />}
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {feeForm.perItem ? 'Per Number' : 'Per Order'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {feeForm.perItem
                      ? 'This fee will be charged for each number in the cart'
                      : 'This fee will be charged once per order, regardless of how many numbers'}
                  </Typography>
                </Box>
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setFeeDialog(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveFee}
            sx={{ bgcolor: '#002664', '&:hover': { bgcolor: '#001a45' }, textTransform: 'none', fontWeight: 600 }}>
            {editingFee ? 'Update' : 'Add Fee'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
