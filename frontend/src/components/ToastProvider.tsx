'use client';

import { useCallback } from 'react';
import Toaster, { type ToasterRef } from '@/components/ui/toast';
import { setToastRef } from '@/lib/toast';

export default function ToastProvider() {
  const ref = useCallback((instance: ToasterRef | null) => {
    setToastRef(instance);
  }, []);

  return <Toaster ref={ref} defaultPosition="top-right" />;
}
