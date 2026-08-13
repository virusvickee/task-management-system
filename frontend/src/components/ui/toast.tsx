'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Toaster as SonnerToaster,
  toast as sonnerToast,
} from 'sonner';
import {
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/theme-context';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'success' | 'error' | 'warning';
type Position =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

export interface ToasterProps {
  title?: string;
  message: string;
  variant?: Variant;
  duration?: number;
  position?: Position;
  actions?: ActionButton;
  onDismiss?: () => void;
  highlightTitle?: boolean;
}

export interface ToasterRef {
  show: (props: ToasterProps) => void;
}

const variantIcons: Record<Variant, React.ComponentType<{ className?: string }>> = {
  default: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
};

const variantClass: Record<Variant, string> = {
  default: 'app-toast--default',
  success: 'app-toast--success',
  error: 'app-toast--error',
  warning: 'app-toast--warning',
};

const actionClass: Record<Variant, string> = {
  default: 'app-toast__action--theme',
  success: 'app-toast__action--theme',
  error: 'app-toast__action--error',
  warning: 'app-toast__action--theme',
};

const toastAnimation = {
  initial: { opacity: 0, y: -16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
};

const TOAST_OFFSET = { top: 72, right: 16, bottom: 16, left: 16 };

const Toaster = forwardRef<ToasterRef, { defaultPosition?: Position }>(
  ({ defaultPosition = 'top-right' }, ref) => {
    const { theme } = useTheme();
    const toastReference = useRef<ReturnType<typeof sonnerToast.custom> | null>(null);

    useImperativeHandle(ref, () => ({
      show({
        title,
        message,
        variant = 'default',
        duration = 4000,
        position = defaultPosition,
        actions,
        onDismiss,
        highlightTitle,
      }) {
        const Icon = variantIcons[variant];

        toastReference.current = sonnerToast.custom(
          (toastId) => (
            <motion.div
              variants={toastAnimation}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={cn(
                'app-toast relative flex gap-3 w-[min(360px,calc(100vw-32px))] p-3.5 rounded-lg',
                variantClass[variant],
              )}
            >
              <Icon className="app-toast__icon h-4 w-4 mt-0.5 flex-shrink-0" />

              <div className="flex-1 min-w-0 pr-6">
                {title && (
                  <h3
                    className={cn(
                      'app-toast__title text-sm font-semibold leading-tight',
                      highlightTitle && 'app-toast__title--accent',
                    )}
                  >
                    {title}
                  </h3>
                )}
                <p className={cn('app-toast__message text-[13px] leading-snug break-words', title && 'mt-1')}>
                  {message}
                </p>

                {actions?.label && (
                  <Button
                    variant={actions.variant || 'outline'}
                    size="sm"
                    onClick={() => {
                      actions.onClick();
                      sonnerToast.dismiss(toastId);
                    }}
                    className={cn('mt-3 h-7 px-3 text-xs', actionClass[variant])}
                  >
                    {actions.label}
                  </Button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  sonnerToast.dismiss(toastId);
                  onDismiss?.();
                }}
                className="app-toast__dismiss absolute top-3 right-3 rounded-md p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ),
          { duration, position },
        );
      },
    }));

    return (
      <SonnerToaster
        theme={theme}
        position={defaultPosition}
        offset={TOAST_OFFSET}
        gap={10}
        visibleToasts={3}
        toastOptions={{ unstyled: true, className: 'w-auto p-0' }}
      />
    );
  },
);

Toaster.displayName = 'Toaster';

export default Toaster;
