import { useLanguage } from '../i18n/LanguageContext';

// Branded loading screen (app audit, 24 Nov 2026): the app shell used
// to render a blank white page while auth state loaded
// (DashboardRedirect returned null) and before the JS bundle booted.
// This paints the Eduvelto navy + logo instead. Used by
// DashboardRedirect while auth loads; index.html carries the same look
// as static HTML for the pre-JS first paint.
export function AppLoadingScreen() {
  const { t } = useLanguage();
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A1F44',
        color: '#F4F1E9',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <img
        src="/logo.png"
        alt="Eduvelto"
        style={{ width: 200, height: 'auto', marginBottom: 16 }}
      />
      <p style={{ fontSize: 17, margin: 0 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
    </main>
  );
}
