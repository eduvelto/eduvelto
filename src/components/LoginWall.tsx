// Eduvelto — the shared login wall (owner instruction 22 Nov 2026).
//
// One component for every exam/reading gate: the visitor sees the same
// Bangla-first wall everywhere, with Login + Register buttons.
// Registration is free — the wall says so, so a guest never wonders
// whether signing up costs anything.

import { Card, LinkButton } from './ui';
import { useLanguage } from '../i18n/LanguageContext';
import { useLocation } from 'react-router-dom';
import { loginState } from '../lib/loginReturn';
import { loginWallCopy, type LoginWallKind } from '../lib/gating';

export default function LoginWall({
  kind,
  contextTitle,
}: {
  kind: LoginWallKind;
  /** Optional context, e.g. the quiz title or the book title. */
  contextTitle?: string;
}) {
  const { t } = useLanguage();
  const location = useLocation();
  // Sections audit (24 Nov 2026): pass the current page so sign-in
  // returns here instead of always landing on /profile.
  const back = loginState(location.pathname + location.search);
  const copy = loginWallCopy(kind);
  return (
    <Card style={{ borderTop: '4px solid #F1B308', textAlign: 'center', padding: '28px 20px' }}>
      <h2
        style={{
          fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif",
          fontSize: 22,
          color: '#0A1F44',
          margin: '0 0 8px',
        }}
      >
        {t({ bn: copy.titleBn, en: copy.titleEn })}
      </h2>
      {contextTitle ? (
        <p style={{ margin: '0 0 8px', color: '#0A1F44', fontWeight: 600 }}>{contextTitle}</p>
      ) : null}
      <p style={{ margin: '0 0 20px', color: '#5A6478' }}>
        {t({ bn: copy.bodyBn, en: copy.bodyEn })}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        <LinkButton to="/login" state={back} size="lg">
          {t({ bn: 'লগইন করুন', en: 'Sign in' })}
        </LinkButton>
        <LinkButton to="/register" state={back} variant="outline" size="lg">
          {t({ bn: 'রেজিস্ট্রেশন করুন', en: 'Register' })}
        </LinkButton>
      </div>
      <p style={{ margin: '16px 0 0', color: '#5A6478', fontSize: 14 }}>
        {t({ bn: 'রেজিস্ট্রেশন ফ্রি — কোনো ফি লাগে না।', en: 'Registration is free — no fee.' })}
      </p>
    </Card>
  );
}
