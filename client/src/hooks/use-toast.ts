
import { useState, useCallback } from 'react';

interface ToastState {
  open: boolean;
  message: string | {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
  };
  severity?: 'success' | 'info' | 'warning' | 'error';
  toasts?: Array<{
    id: string;
    title?: string;
    description?: string;
    action?: React.ReactNode;
  }>;
}

interface ToastOptions {
  severity?: 'success' | 'info' | 'warning' | 'error';
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'info'
  });

  const showToast = useCallback((
    message: string | {
      title?: string;
      description?: string;
      variant?: 'default' | 'destructive';
    },
    options: ToastOptions = {}
  ) => {
    setToast({
      open: true,
      message,
      severity: options.severity || 'info'
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, open: false }));
  }, []);

  return {
    toast: showToast,
    toastState: toast,
    hideToast
  };
}
