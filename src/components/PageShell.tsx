import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function PageShell(props: {
  titleBn: string;
  titleEn: string;
  children?: ReactNode;
}) {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 26, margin: '0 0 4px' }}>{props.titleBn}</h1>
      <p style={{ color: '#555', margin: '0 0 20px' }}>{props.titleEn}</p>
      {props.children}
      <p style={{ marginTop: 32 }}>
        <Link to="/">← হোম / Home</Link>
      </p>
    </main>
  );
}

export function EmptyState(props: { bn: string; en: string }) {
  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: 8,
        padding: '20px 16px',
        background: '#fafafa',
      }}
    >
      <p style={{ margin: 0 }}>{props.bn}</p>
      <p style={{ margin: '8px 0 0', color: '#555' }}>{props.en}</p>
    </div>
  );
}
