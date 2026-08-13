'use client';

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Search, X } from 'lucide-react';

export interface ToolbarSearchInputHandle {
  open: () => void;
}

export interface ToolbarSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  'aria-label'?: string;
  className?: string;
}

function SearchShortcutKbd() {
  return (
    <kbd className="dashboard-toolbar-search-kbd hidden sm:inline-flex" aria-hidden="true">
      ⌘F
    </kbd>
  );
}

const ToolbarSearchInput = forwardRef<ToolbarSearchInputHandle, ToolbarSearchInputProps>(
  function ToolbarSearchInput(
    { value, onChange, placeholder = 'Design Homepage', 'aria-label': ariaLabel, className },
    ref,
  ) {
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function focusInput() {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }

    useImperativeHandle(ref, () => ({
      open: () => {
        setOpen(true);
        focusInput();
      },
    }));

    function closeSearch() {
      onChange('');
      setOpen(false);
    }

    if (!open) {
      return (
        <button
          type="button"
          className={`dashboard-toolbar-icon-btn${className ? ` ${className}` : ''}`}
          onClick={() => {
            setOpen(true);
            focusInput();
          }}
          aria-label={ariaLabel ?? 'Search'}
        >
          <Search size={14} strokeWidth={1.75} className="dashboard-toolbar-icon" />
        </button>
      );
    }

    return (
      <label className={`dashboard-toolbar-search${className ? ` ${className}` : ''}`}>
        <Search
          size={14}
          strokeWidth={1.75}
          className="dashboard-toolbar-search-icon dashboard-toolbar-icon"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              closeSearch();
              (e.target as HTMLInputElement).blur();
            }
          }}
          onBlur={() => {
            if (!value.trim()) setOpen(false);
          }}
          placeholder={placeholder}
          aria-label={ariaLabel ?? placeholder}
          className="dashboard-toolbar-search-input"
        />
        {value.trim().length > 0 && (
          <button
            type="button"
            className="dashboard-toolbar-search-clear"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            <X size={14} strokeWidth={1.75} />
          </button>
        )}
        <SearchShortcutKbd />
      </label>
    );
  },
);

export default ToolbarSearchInput;
