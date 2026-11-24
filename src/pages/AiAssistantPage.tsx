// Eduvelto AI Life Assistant — hub page (/ai-assistant).
//
// What this page honestly is, today:
//   - The chat box is NOT connected to any live AI yet. It says so
//     plainly and stays disabled until a provider is connected
//     (owner step: free Gemini key + free Cloudflare proxy).
//   - The 10 tools below work NOW, with zero AI, in the browser.
//     Nothing is saved, nothing is sent anywhere, no login needed.
//
// Ads: none on this page (directive §4 — no ads on AI pages).

import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Button, Card, Chip } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { ASSISTANT_TOOLS, type ToolId as AssistantToolId } from '../lib/aiAssistant';
import { askAssistant, getProviderStatus, type ChatMessage } from '../lib/aiProviders';
import {
  BudgetTool,
  CalculatorTool,
  ConverterTool,
  PhrasebookTool,
  PlannerTool,
  StudyPlanTool,
} from '../components/assistant/AssistantTools';
import { ApplicationTool, CvTool, EmailTool, LetterTool } from '../components/assistant/DocumentBuilders';

const TOOL_COMPONENTS: Record<Exclude<AssistantToolId, 'chat'>, React.ComponentType> = {
  calculator: CalculatorTool,
  converter: ConverterTool,
  budget: BudgetTool,
  planner: PlannerTool,
  letter: LetterTool,
  application: ApplicationTool,
  cv: CvTool,
  email: EmailTool,
  phrases: PhrasebookTool,
  study: StudyPlanTool,
};

interface UiMessage extends ChatMessage {
  kind: 'user' | 'ai' | 'notice';
}

export default function AiAssistantPage() {
  const { t, lang } = useLanguage();
  const [status] = useState(getProviderStatus());
  const [selected, setSelected] = useState<AssistantToolId | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [quotaHit, setQuotaHit] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  const connected = status === 'ready';

  async function send() {
    const text = input.trim();
    if (text === '' || sending) return;
    if (!connected) return;
    setInput('');
    setSending(true);
    const history: ChatMessage[] = [...messages.filter((m) => m.kind !== 'notice'), { role: 'user', text }];
    setMessages(history.map((m) => ({ ...m, kind: m.role === 'user' ? ('user' as const) : ('ai' as const) })));
    const result = await askAssistant(history, { lang });
    setSending(false);
    if (result.kind === 'ai') {
      setMessages((prev) => [...prev, { role: 'assistant', text: result.text, kind: 'ai' }]);
    } else if (result.kind === 'quota-exhausted') {
      setQuotaHit(true);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          kind: 'notice',
          text: t({
            bn: 'আজকের বিনামূল্যের সীমা শেষ হয়েছে। আগামীকাল আবার চেষ্টা করুন — নিচের টুলগুলো এখনো কাজ করছে।',
            en: 'Today’s free limit is used up. Try again tomorrow — the tools below still work.',
          }),
        },
      ]);
    } else if (result.kind === 'not-configured') {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          kind: 'notice',
          text: t({
            bn: 'লাইভ AI এখনো যুক্ত হয়নি। নিচের টুলগুলো ব্যবহার করুন — এগুলো এখনই কাজ করে।',
            en: 'Live AI is not connected yet. Use the tools below — they work right now.',
          }),
        },
      ]);
    } else {
      setMessages((prev) => [...prev, { role: 'assistant', kind: 'notice', text: lang === 'bn' ? result.messageBn : result.messageEn }]);
    }
  }

  function openTool(id: AssistantToolId) {
    setSelected(id);
    setTimeout(() => toolsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  const SelectedTool = selected !== null && selected !== 'chat' ? TOOL_COMPONENTS[selected] : null;
  const selectedMeta = selected !== null ? ASSISTANT_TOOLS.find((tool) => tool.id === selected) : undefined;

  return (
    <PageShell titleBn="AI সহায়ক" titleEn="AI Assistant" wide>
      <p style={{ marginTop: 0, fontSize: 17 }}>
        {t({
          bn: 'দৈনন্দিন জীবনের সহায়ক — প্রশ্নের উত্তর, হিসাব, চিঠি-আবেদন-সিভি, পরিকল্পনা — বাংলা ও ইংরেজিতে।',
          en: 'A daily-life helper — answers, calculations, letters, applications, CVs and plans — in Bangla and English.',
        })}
      </p>

      {!connected ? (
        <AlertBox tone="info">
          {t({
            bn: 'লাইভ AI এখনো যুক্ত হয়নি — সংযুক্ত হলে এই পাতাতেই প্রশ্নের উত্তর দেবে। আপাতত নিচের ১০টি টুল ব্যবহার করুন — এগুলো এখনই কাজ করে, লগইন লাগে না, আপনার লেখা কোথাও পাঠানো হয় না।',
            en: 'Live AI is not connected yet — once connected it will answer questions right on this page. For now, use the 10 tools below — they work right now, need no login, and nothing you type is sent anywhere.',
          })}
        </AlertBox>
      ) : (
        <AlertBox tone="ok">
          {t({
            bn: 'লাইভ AI সংযুক্ত আছে। প্রশ্ন লিখুন — উত্তর AI থেকে আসবে। ব্যক্তিগত তথ্য (নাম, ফোন, ঠিকানা, পাসওয়ার্ড) লিখবেন না।',
            en: 'Live AI is connected. Write your question — the answer comes from AI. Do not write personal information (name, phone, address, password).',
          })}
        </AlertBox>
      )}

      {quotaHit ? (
        <div style={{ marginTop: 12 }}>
          <AlertBox tone="info">
            {t({
              bn: 'আজকের বিনামূল্যের সীমা শেষ — আগামীকাল আবার চেষ্টা করুন। নিচের টুলগুলো এখনো কাজ করছে।',
              en: 'Today’s free limit is finished — try again tomorrow. The tools below still work.',
            })}
          </AlertBox>
        </div>
      ) : null}

      {/* ---- Chat (honest state) ---- */}
      <Card>
        <h2 style={{ marginTop: 0 }}>
          {t({ bn: 'প্রশ্ন করুন', en: 'Ask a question' })}{' '}
          <Chip tone="gold">{connected ? t({ bn: 'লাইভ', en: 'Live' }) : t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</Chip>
        </h2>
        {messages.length === 0 ? (
          <p style={{ color: 'var(--muted, #5b6472)' }}>
            {connected
              ? t({ bn: 'যেমন: "একটি ছুটির আবেদন লিখে দাও" বা "১০,০০০ টাকায় ১২ মাসের কিস্তি কত?"', en: 'For example: "Write me a leave application" or "What is the instalment on ৳10,000 over 12 months?"' })
              : t({ bn: 'AI সংযুক্ত হলে এখানে প্রশ্ন লিখতে পারবেন। আপাতত নিচের টুলগুলো ব্যবহার করুন।', en: 'Once AI is connected you will be able to ask questions here. For now, use the tools below.' })}
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: m.kind === 'user' ? 'var(--surface-muted, #eef2f8)' : 'var(--surface, #fff)',
                  border: '1px solid var(--border, #dbe2ef)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                <strong>{m.kind === 'user' ? t({ bn: 'আপনি', en: 'You' }) : t({ bn: 'AI সহায়ক', en: 'AI Assistant' })}: </strong>
                {m.text}
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="ev-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void send();
            }}
            disabled={!connected || sending}
            placeholder={
              connected
                ? t({ bn: 'প্রশ্ন লিখুন…', en: 'Write your question…' })
                : t({ bn: 'AI সংযুক্ত হলে প্রশ্ন লিখতে পারবেন', en: 'You can ask once AI is connected' })
            }
            aria-label={t({ bn: 'প্রশ্ন', en: 'Question' })}
          />
          <Button onClick={() => void send()} loading={sending} disabled={!connected || input.trim() === ''}>
            {t({ bn: 'পাঠান', en: 'Send' })}
          </Button>
        </div>
        <p style={{ marginBottom: 0, fontSize: 14, color: 'var(--muted, #5b6472)' }}>
          {t({
            bn: 'কথোপকথন শুধু এই পাতায় থাকে — সংরক্ষণ করা হয় না, লগইন লাগে না। ব্যক্তিগত তথ্য লিখবেন না।',
            en: 'The conversation stays only on this page — it is not saved and needs no login. Do not write personal information.',
          })}
        </p>
      </Card>

      {/* ---- Tool grid ---- */}
      <h2 style={{ marginTop: 28 }}>{t({ bn: 'এখনই ব্যবহারের টুল', en: 'Tools you can use right now' })}</h2>
      <p style={{ color: 'var(--muted, #5b6472)' }}>
        {t({
          bn: 'এগুলো AI নয় — আপনার ডিভাইসেই হিসাব ও ছক সাজায়। কোনো তথ্য কোথাও পাঠানো হয় না, লগইন লাগে না।',
          en: 'These are not AI — they calculate and arrange everything on your device. Nothing is sent anywhere, no login needed.',
        })}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {ASSISTANT_TOOLS.filter((tool) => tool.id !== 'chat').map((tool) => (
          <Card key={tool.id} hover>
            <button
              type="button"
              onClick={() => openTool(tool.id)}
              style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }}
              aria-label={lang === 'bn' ? tool.nameBn : tool.nameEn}
            >
              <div style={{ fontWeight: 700, fontSize: 16 }}>{lang === 'bn' ? tool.nameBn : tool.nameEn}</div>
              <div style={{ color: 'var(--muted, #5b6472)', marginTop: 4 }}>{lang === 'bn' ? tool.descBn : tool.descEn}</div>
              <div style={{ marginTop: 8 }}>
                <Chip>{t({ bn: 'ব্যবহার করুন', en: 'Use it' })}</Chip>
              </div>
            </button>
          </Card>
        ))}
      </div>

      {/* ---- Selected tool panel ---- */}
      <div ref={toolsRef} style={{ marginTop: 20 }}>
        {SelectedTool && selectedMeta ? (
          <Card>
            <h2 style={{ marginTop: 0 }}>{lang === 'bn' ? selectedMeta.nameBn : selectedMeta.nameEn}</h2>
            <p style={{ color: 'var(--muted, #5b6472)' }}>{lang === 'bn' ? selectedMeta.descBn : selectedMeta.descEn}</p>
            <SelectedTool />
          </Card>
        ) : null}
      </div>

      <div style={{ marginTop: 28 }}>
        <AlertBox tone="info">
          {t({
            bn: 'AI শিক্ষক (পড়াশোনার জন্য) আলাদা পাতায় আসছে — ',
            en: 'The AI Teacher (for study) is coming on a separate page — ',
          })}
          <Link to="/ai-teacher">{t({ bn: 'AI শিক্ষক দেখুন', en: 'See the AI Teacher' })}</Link>
        </AlertBox>
      </div>
    </PageShell>
  );
}
