'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Skeleton from '@mui/material/Skeleton';
import Link from 'next/link';
import MuiLink from '@mui/material/Link';
import { api } from '@/lib/api';
import { useSnackbar } from '@/lib/snackbar';

const numberTypes = [
  { value: 'local', label: 'Local' },
  { value: 'toll_free', label: 'Toll-Free' },
  { value: 'vanity', label: 'Vanity' },
  { value: 'mobile', label: 'Mobile' },
];

const listingTypes = [
  { value: 'sale', label: 'For Sale' },
  { value: 'license', label: 'For License' },
  { value: 'both', label: 'Sale & License' },
];

const patternOptions = [
  { value: '', label: 'None' },
  { value: 'repeating', label: 'Repeating (e.g., 888-8888)' },
  { value: 'sequential', label: 'Sequential (e.g., 1234567)' },
  { value: 'palindrome', label: 'Palindrome' },
  { value: 'ending_0000', label: 'Ending in 0000' },
  { value: 'ending_1111', label: 'Ending in 1111' },
  { value: 'custom', label: 'Custom Pattern' },
];

interface FormData {
  number: string;
  countryCode: string;
  areaCode: string;
  numberType: string;
  vanityText: string;
  basePrice: string;
  monthlyPrice: string;
  salePrice: string;
  licensePrice: string;
  listingType: string;
  isVanity: boolean;
  isPremium: boolean;
  isPortable: boolean;
  allowOffers: boolean;
  minimumOffer: string;
  pattern: string;
  stateName: string;
  cityName: string;
}

export default function EditNumberPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { showSnackbar } = useSnackbar();
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    async function loadNumber() {
      try {
        const res = await api.get<Record<string, unknown>>(`/numbers/my`);
        const numbers = res.data as unknown as Array<Record<string, unknown>>;
        const found = numbers?.find((n) => n.id === id);
        if (!found) {
          showSnackbar('Number not found', 'error');
          router.push('/seller/inventory');
          return;
        }
        setForm({
          number: String(found.number || ''),
          countryCode: String(found.countryCode || '1'),
          areaCode: String(found.areaCode || ''),
          numberType: String(found.numberType || 'local'),
          vanityText: String(found.vanityText || ''),
          basePrice: String(found.basePrice || ''),
          monthlyPrice: String(found.monthlyPrice || ''),
          salePrice: String(found.salePrice || ''),
          licensePrice: String(found.licensePrice || ''),
          listingType: String(found.listingType || 'sale'),
          isVanity: Boolean(found.isVanity),
          isPremium: Boolean(found.isPremium),
          isPortable: Boolean(found.isPortable),
          allowOffers: Boolean(found.allowOffers),
          minimumOffer: String(found.minimumOffer || ''),
          pattern: String(found.pattern || ''),
          stateName: String(found.stateName || ''),
          cityName: String(found.cityName || ''),
        });
      } catch {
        showSnackbar('Failed to load number details', 'error');
        router.push('/seller/inventory');
      } finally {
        setLoading(false);
      }
    }
    loadNumber();
  }, [id, router, showSnackbar]);

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => prev ? ({ ...prev, [field]: value }) : prev);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    if (!form) return false;
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.number.trim()) newErrors.number = 'Phone number is required';
    if (!form.areaCode.trim()) newErrors.areaCode = 'Area code is required';
    if (!form.basePrice || parseFloat(form.basePrice) <= 0) newErrors.basePrice = 'Base price must be greater than 0';
    if (form.listingType === 'sale' || form.listingType === 'both') {
      if (!form.salePrice || parseFloat(form.salePrice) <= 0) newErrors.salePrice = 'Sale price is required';
    }
    if (form.listingType === 'license' || form.listingType === 'both') {
      if (!form.licensePrice || parseFloat(form.licensePrice) <= 0) newErrors.licensePrice = 'License price is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !validate()) return;

    setSubmitting(true);
    try {
      const body = {
        number: form.number,
        countryCode: form.countryCode,
        areaCode: form.areaCode,
        numberType: form.numberType,
        vanityText: form.vanityText || undefined,
        basePrice: parseFloat(form.basePrice),
        monthlyPrice: form.monthlyPrice ? parseFloat(form.monthlyPrice) : undefined,
        salePrice: form.salePrice ? parseFloat(form.salePrice) : undefined,
        licensePrice: form.licensePrice ? parseFloat(form.licensePrice) : undefined,
        listingType: form.listingType,
        isVanity: form.isVanity,
        isPremium: form.isPremium,
        isPortable: form.isPortable,
        allowOffers: form.allowOffers,
        minimumOffer: form.minimumOffer ? parseFloat(form.minimumOffer) : undefined,
        pattern: form.pattern || undefined,
        stateName: form.stateName || undefined,
        cityName: form.cityName || undefined,
      };
      await api.put(`/numbers/seller/${id}`, body);
      showSnackbar('Number updated successfully!', 'success');
      router.push('/seller/inventory');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update number';
      showSnackbar(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton width={300} height={32} sx={{ mb: 1 }} />
        <Skeleton width={200} height={48} sx={{ mb: 2 }} />
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={56} sx={{ mb: 2 }} />
            ))}
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!form) return null;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} href="/seller/inventory" underline="hover" color="text.secondary">
          My Numbers
        </MuiLink>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>Edit Number</Typography>
      </Breadcrumbs>

      <Typography variant="h3" sx={{ color: '#002664', fontWeight: 700, mb: 1 }}>
        Edit Number
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
        Update the details and pricing for this listing.
      </Typography>

      <form onSubmit={handleSubmit}>
        {/* Phone Number Details */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ color: '#002664', fontWeight: 600, mb: 3 }}>
              Number Details
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  label="Phone Number"
                  fullWidth
                  required
                  value={form.number}
                  onChange={handleChange('number')}
                  error={!!errors.number}
                  helperText={errors.number}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  label="Country Code"
                  fullWidth
                  value={form.countryCode}
                  onChange={handleChange('countryCode')}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">+</InputAdornment> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  label="Area Code"
                  fullWidth
                  required
                  value={form.areaCode}
                  onChange={handleChange('areaCode')}
                  error={!!errors.areaCode}
                  helperText={errors.areaCode}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  label="Number Type"
                  fullWidth
                  select
                  value={form.numberType}
                  onChange={handleChange('numberType')}
                >
                  {numberTypes.map((t) => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Vanity Text"
                  fullWidth
                  value={form.vanityText}
                  onChange={handleChange('vanityText')}
                  placeholder="e.g., 1-800-FLOWERS"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Pattern"
                  fullWidth
                  select
                  value={form.pattern}
                  onChange={handleChange('pattern')}
                >
                  {patternOptions.map((p) => (
                    <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="State"
                  fullWidth
                  value={form.stateName}
                  onChange={handleChange('stateName')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="City"
                  fullWidth
                  value={form.cityName}
                  onChange={handleChange('cityName')}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <FormControlLabel
                control={<Switch checked={form.isVanity} onChange={handleChange('isVanity')} color="secondary" />}
                label="Vanity Number"
              />
              <FormControlLabel
                control={<Switch checked={form.isPremium} onChange={handleChange('isPremium')} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#002664' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#002664' } }} />}
                label="Premium Number"
              />
              <FormControlLabel
                control={<Switch checked={form.isPortable} onChange={handleChange('isPortable')} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#4BA0A1' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#4BA0A1' } }} />}
                label="Portable"
              />
            </Box>
          </CardContent>
        </Card>

        {/* Pricing & Listing */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ color: '#002664', fontWeight: 600, mb: 3 }}>
              Pricing & Listing
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  label="Listing Type"
                  fullWidth
                  select
                  value={form.listingType}
                  onChange={handleChange('listingType')}
                >
                  {listingTypes.map((t) => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  label="Base Price"
                  fullWidth
                  required
                  type="number"
                  value={form.basePrice}
                  onChange={handleChange('basePrice')}
                  error={!!errors.basePrice}
                  helperText={errors.basePrice}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  label="Monthly Price"
                  fullWidth
                  type="number"
                  value={form.monthlyPrice}
                  onChange={handleChange('monthlyPrice')}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                />
              </Grid>
              {(form.listingType === 'sale' || form.listingType === 'both') && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    label="Sale Price"
                    fullWidth
                    required
                    type="number"
                    value={form.salePrice}
                    onChange={handleChange('salePrice')}
                    error={!!errors.salePrice}
                    helperText={errors.salePrice}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                  />
                </Grid>
              )}
              {(form.listingType === 'license' || form.listingType === 'both') && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    label="License Price"
                    fullWidth
                    required
                    type="number"
                    value={form.licensePrice}
                    onChange={handleChange('licensePrice')}
                    error={!!errors.licensePrice}
                    helperText={errors.licensePrice}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                  />
                </Grid>
              )}
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
              <FormControlLabel
                control={<Switch checked={form.allowOffers} onChange={handleChange('allowOffers')} color="secondary" />}
                label="Allow Offers"
              />
              {form.allowOffers && (
                <TextField
                  label="Minimum Offer"
                  type="number"
                  value={form.minimumOffer}
                  onChange={handleChange('minimumOffer')}
                  sx={{ width: 200 }}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                />
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button component={Link} href="/seller/inventory" variant="outlined" disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
            sx={{ minWidth: 180 }}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
