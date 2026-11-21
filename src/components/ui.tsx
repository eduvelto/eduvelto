// Eduvelto shared UI primitives — one Button, one Card, one Skeleton,
// one EmptyState, so every page looks like the same product.
// All styling lives in index.css classes; these components only compose them.

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

/** True when the OS asks for reduced motion — animations then jump to the end state. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Count-up number (e.g. 0 → 609). Jumps straight to the value under reduced motion. */
export function AnimatedNumber(props: { value: number; durationMs?: number }) {
  const [shown, setShown] = useState(0);
  const value = props.value;
  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const duration = props.durationMs ?? 700;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, props.durationMs]);
  return <>{shown.toLocaleString('en-US')}</>;
}

/** Scroll-reveal wrapper: fades + slides content in once when it enters the viewport.
 *  Visible immediately when IntersectionObserver is unavailable or motion is reduced. */
export function Reveal(props: { children: ReactNode; delayMs?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`ev-reveal ${visible ? 'ev-reveal-visible' : ''} ${props.className ?? ''}`.trim()}
      style={props.delayMs ? { transitionDelay: `${props.delayMs}ms` } : undefined}
    >
      {props.children}
    </div>
  );
}

type ButtonVariant = 'primary' | 'accent' | 'gold' | 'outline' | 'outline-light' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClass: Record<ButtonVariant, string> = {
  primary: 'ev-btn-primary',
  accent: 'ev-btn-accent',
  gold: 'ev-btn-gold',
  outline: 'ev-btn-outline',
  'outline-light': 'ev-btn-outline-light',
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
  const { t } = useLanguage();
  return (
    <div role="status" aria-label={t({ bn: 'লোড হচ্ছে', en: 'Loading' })} style={{ margin: '4px 0 16px' }}>
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
  const { t } = useLanguage();
  return (
    <div role="status" aria-label={t({ bn: 'লোড হচ্ছে', en: 'Loading' })}>
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
  const { t } = useLanguage();
  return (
    <div className={`ev-alert ${cls}`} role={props.tone === 'error' ? 'alert' : 'status'}>
      {props.children}
      {props.onRetry ? (
        <span style={{ display: 'block', marginTop: 8 }}>
          <Button variant="outline" size="sm" onClick={props.onRetry}>
            {t({ bn: 'আবার চেষ্টা করুন', en: 'Retry' })}
          </Button>
        </span>
      ) : null}
    </div>
  );
}

/** Stat tile for dashboards / progress / home hero. Pass `numeric` to animate the
 *  number counting up; `suffix` (e.g. "%") is appended after the animated number.
 *  LANGUAGE: one label only — labelBn in Bangla mode, labelEn in English mode. */
export function StatCard(props: { value: string; labelBn: string; labelEn: string; tone?: 'blue' | 'gold'; numeric?: number; suffix?: string }) {
  const { lang } = useLanguage();
  return (
    <div className="ev-card" style={{ textAlign: 'center', padding: '18px 12px' }}>
      <div
        style={{
          fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif",
          fontSize: 30,
          fontWeight: 800,
          lineHeight: 1.2,
          color: props.tone === 'gold' ? '#8A6100' : '#142B3B',
        }}
      >
        {props.numeric !== undefined ? (
          <>
            <AnimatedNumber value={props.numeric} />
            {props.suffix ?? ''}
          </>
        ) : (
          props.value
        )}
      </div>
      <div style={{ fontWeight: 600, color: '#142B3B', marginTop: 2 }}>
        {lang === 'bn' ? props.labelBn : props.labelEn}
      </div>
    </div>
  );
}

/** Thin progress bar (0–100). Animates from 0 to the value on mount;
 *  freezes under reduced motion via CSS. */
export function ProgressBar(props: { value: number; tone?: 'blue' | 'gold'; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(props.value)));
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setWidth(pct));
    return () => cancelAnimationFrame(raf);
  }, [pct]);
  return (
    <div>
      <div className={`ev-progress ${props.tone === 'gold' ? 'ev-progress-gold' : ''}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={props.label ?? `${pct}%`}>
        <span style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
