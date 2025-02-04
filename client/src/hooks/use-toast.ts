import { useState, useCallback } from 'react';

interface ToastState {
  open: boolean;
  message: string;
  severity?: 'success' | 'info' | 'warning' | 'error';
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

  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
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