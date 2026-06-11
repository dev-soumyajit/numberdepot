'use client';

import { create } from 'zustand';
import { ReactNode } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

type Severity = 'success' | 'error' | 'warning' | 'info';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: Severity;
  showSnackbar: (message: string, severity?: Severity) => void;
  close: () => void;
}

export const useSnackbar = create<SnackbarState>((set) => ({
  open: false,
  message: '',
  severity: 'info',
  showSnackbar: (message, severity = 'info') => set({ open: true, message, severity }),
  close: () => set({ open: false }),
}));

/** Mount this once in Providers to render the actual Snackbar UI */
export function SnackbarProvider({ children }: { children: ReactNode }) {
  const { open, message, severity, close } = useSnackbar();

  return (
    <>
      {children}
      <Snackbar open={open} autoHideDuration={4000} onClose={close}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={close} severity={severity} variant="filled" sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </>
  );
}
