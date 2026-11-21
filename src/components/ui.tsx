// Eduvelto shared UI primitives — one Button, one Card, one Skeleton,
// one EmptyState, so every page looks like the same product.
// All styling lives in index.css classes; these components only compose them.

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type ButtonVariant = 'primary' | 'accent' | 'gold' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClass: Record<ButtonVariant, string> = {
  primary: 'ev-btn-primary',
  accent: 'ev-btn-accent',
  gold: 'ev-btn-gold',
  outline: 'ev-btn-outline',
  danger: 'ev-btn-danger',
  ghost: 'ev-btn-ghost',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'ev-btn-sm',
  md: '',
  lg: 'ev-btn-lg',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  block?: boolean;
}

/** Primary action button. `loading` shows a spinner and disables the button. */
export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', loading = false, block = false, children, className = '', disabled, ...rest } = props;
  return (
    <button
      type="button"
      className={`ev-btn ${variantClass[variant]} ${sizeClass[size]} ${block ? 'ev-btn-block' : ''} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className={`ev-spinner ${variant === 'outline' || variant === 'ghost' ? 'ev-spinner-dark' : ''}`} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export interface LinkButtonProps {
  to: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  className?: string;
}

/** A router Link styled exactly like a Button (same sizes, states, touch target). */
export function LinkButton(props: LinkButtonProps) {
  const { to, variant = 'primary', size = 'md', children, className = '' } = props;
  return (
    <Link to={to} className={`ev-btn ${variantClass[variant]} ${sizeClass[size]} ${className}`.trim()}>
      {children}
    </Link>
  );
}

export function Card(props: { children: ReactNode; hover?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`ev-card ${props.hover ? 'ev-card-hover' : ''} ${props.className ?? ''}`.trim()} style={props.style}>
      {props.children}
    </div>
  );
}

export function Chip(props: { children: ReactNode; tone?: 'blue' | 'gold' | 'navy' | 'outline' }) {
  const tone = props.tone ?? 'blue';
  const cls = tone === 'gold' ? 'ev-chip-gold' : tone === 'navy' ? 'ev-chip-navy' : tone === 'outline' ? 'ev-chip-outline' : '';
  return <span className={`ev-chip ${cls}`.trim()}>{props.children}</span>;
}

/** Animated loading skeleton. `lines` renders stacked bars; `height` sets each bar. */
export function Skeleton(props: { lines?: number; height?: number; width?: string }) {
  const lines = props.lines ?? 3;
  const height = props.height ?? 18;
  return (
    <div role="status" aria-label="লোড হচ্ছে / Loading" style={{ margin: '4px 0 16px' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="ev-skeleton"
          style={{ height, width: props.width ?? (i === lines - 1 ? '62%' : '100%'), marginBottom: 10 }}
        />
      ))}
    </div>
  );
}

/** Card-shaped skeleton used while a list of cards loads. */
export function SkeletonCards(props: { count?: number }) {
  const count = props.count ?? 3;
  return (
    <div role="status" aria-label="লোড হচ্ছে / Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="ev-card" style={{ marginBottom: 12, padding: 16 }}>
          <div className="ev-skeleton" style={{ height: 20, width: '55%', marginBottom: 10 }} />
          <div className="ev-skeleton" style={{ height: 14, width: '85%', marginBottom: 6 }} />
          <div className="ev-skeleton" style={{ height: 14, width: '40%' }} />
        </div>
      ))}
    </div>
  );
}

export function AlertBox(props: { tone: 'error' | 'ok' | 'info'; children: ReactNode; onRetry?: () => void }) {
  const cls = props.tone === 'error' ? 'ev-alert-error' : props.tone === 'ok' ? 'ev-alert-ok' : 'ev-alert-info';
  return (
    <div className={`ev-alert ${cls}`} role={props.tone === 'error' ? 'alert' : 'status'}>
      {props.children}
      {props.onRetry ? (
        <span style={{ display: 'block', marginTop: 8 }}>
          <Button variant="outline" size="sm" onClick={props.onRetry}>
            আবার চেষ্টা করুন / Retry
          </Button>
        </span>
      ) : null}
    </div>
  );
}

/** Stat tile for dashboards / progress / home hero. */
export function StatCard(props: { value: string; labelBn: string; labelEn: string; tone?: 'blue' | 'gold' }) {
  return (
    <div className="ev-card" style={{ textAlign: 'center', padding: '18px 12px' }}>
      <div
        style={{
          fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif",
          fontSize: 30,
          fontWeight: 800,
          lineHeight: 1.2,
          color: props.tone === 'gold' ? '#F5A623' : '#0A1F44',
        }}
      >
        {props.value}
      </div>
      <div style={{ fontWeight: 600, color: '#0A1F44', marginTop: 2 }}>{props.labelBn}</div>
      <div style={{ fontSize: 13, color: '#5A6478' }}>{props.labelEn}</div>
    </div>
  );
}

/** Thin progress bar (0–100). Animated; freezes under reduced motion via CSS. */
export function ProgressBar(props: { value: number; tone?: 'blue' | 'gold'; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(props.value)));
  return (
    <div>
      <div className={`ev-progress ${props.tone === 'gold' ? 'ev-progress-gold' : ''}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={props.label ?? `${pct}%`}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
