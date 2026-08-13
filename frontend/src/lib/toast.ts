import type { ToasterProps, ToasterRef } from '@/components/ui/toast';

let toastRef: ToasterRef | null = null;

export function setToastRef(ref: ToasterRef | null) {
  toastRef = ref;
}

type ToastOptions = Partial<Omit<ToasterProps, 'message'>>;

export function toast(message: string, options?: ToastOptions) {
  toastRef?.show({ message, ...options });
}

export function toastSuccess(message: string, title = 'Success') {
  toastRef?.show({ title, message, variant: 'success' });
}

export function toastError(message: string, title = 'Error') {
  toastRef?.show({ title, message, variant: 'error' });
}

export function toastWarning(message: string, title = 'Warning') {
  toastRef?.show({ title, message, variant: 'warning' });
}

export function toastInfo(message: string, title?: string) {
  toastRef?.show({ title, message, variant: 'default' });
}

export function toastConfirm(options: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
}) {
  toastRef?.show({
    title: options.title,
    message: options.message,
    variant: 'warning',
    duration: 10000,
    actions: {
      label: options.confirmLabel ?? 'Confirm',
      onClick: () => void options.onConfirm(),
      variant: 'outline',
    },
  });
}
