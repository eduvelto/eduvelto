// Eduvelto AI Chat — the real AI chat shell.
//
// HONEST STATE (21 Nov 2026): the AI service is NOT connected.
// There is no model, no API key and no paid service. The page below
// is a complete, working shell — conversations, history, copy/share,
// usage display, reporting — but every question is answered with the
// honest "AI is not live yet" notice, NEVER with a generated answer.
// The notice is a SYSTEM card, not an AI reply: nothing in this file
// renders fake AI text as if a model wrote it.
//
// When the owner approves a provider + the Blaze gateway (see
// team/ai-teacher-approval-package.md), the gateway writes real
// assistant replies into the same messages sub-collection and this
// page displays them unchanged. Voice input and image questions are
// DISABLED controls labelled "coming soon" — they are never faked.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { strings } from '../i18n/strings';
import { aiProvider } from '../lib/aiProvider';
import {
  AI_MESSAGES_PAGE_SIZE,
  deleteConversation,
  getTodayAiUsage,
  getTodayPlatformUsage,
  listConversations,
  listMessages,
  remainingExchangesToday,
  reportAiResponse,
  sendUserMessage,
  validateMessageBody,
  type AiConversation,
  type AiDailyUsage,
  type AiMessage,
  type AiPlatformUsage,
} from '../lib/aiChat';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

const s = strings.aiChat;

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the textarea fallback.
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

async function shareText(text: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (typeof navigator.share === 'function') {
      await navigator.share({ text });
      return 'shared';
    }
  } catch {
    return 'failed';
  }
  return (await copyText(text)) ? 'copied' : 'failed';
}

function formatTime(d: Date): string {
  return d.toLocaleString('bn-BD', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const btnStyle: React.CSSProperties = {
  padding: '10px 18px',
  minHeight: 44,
  fontSize: 15,
  borderRadius: 8,
  border: 'none',
  background: '#0A1F44',
  color: '#fff',
  cursor: 'pointer',
};

const secondaryBtnStyle: React.CSSProperties = {
  ...btnStyle,
  background: '#fff',
  color: '#0A1F44',
  border: '1px solid #0A1F44',
};

export default function AiChatPage() {
  const { user, profile, loading } = useAuth();
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [convCursor, setConvCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [convLoading, setConvLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [msgCursor, setMsgCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [msgLoading, setMsgLoading] = useState(false);
  const [composer, setComposer] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  // The provider's honest answer for the latest question in this
  // conversation — ephemeral UI state, NOT stored as an AI reply.
  const [providerNotice, setProviderNotice] = useState<{ bn: string; en: string } | null>(null);
  const [usage, setUsage] = useState<AiDailyUsage | null>(null);
  const [platformUsage, setPlatformUsage] = useState<AiPlatformUsage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState<'spam' | 'abuse' | 'copyright' | 'personal-info' | 'other'>('other');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const role = profile?.role ?? 'student';
  const remaining = usage ? remainingExchangesToday(usage, role) : null;

  useEffect(() => {
    if (!user) return;
    let live = true;
    setConvLoading(true);
    listConversations(user.uid)
      .then(({ conversations: list, lastDoc }) => {
        if (!live) return;
        setConversations(list);
        setConvCursor(lastDoc);
      })
      .catch(() => {
        if (live) setConversations([]);
      })
      .finally(() => {
        if (live) setConvLoading(false);
      });
    getTodayAiUsage(user.uid)
      .then((u) => {
        if (live) setUsage(u);
      })
      .catch(() => undefined);
    getTodayPlatformUsage()
      .then((p) => {
        if (live) setPlatformUsage(p);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [user]);

  const loadMoreConversations = async () => {
    if (!user || !convCursor) return;
    setConvLoading(true);
    try {
      const { conversations: list, lastDoc } = await listConversations(user.uid, 20, convCursor);
      setConversations((prev) => [...prev, ...list]);
      setConvCursor(lastDoc);
    } finally {
      setConvLoading(false);
    }
  };

  const openConversation = async (id: string) => {
    if (!user) return;
    setSelectedId(id);
    setProviderNotice(null);
    setShowReport(false);
    setReportSent(false);
    setConfirmDelete(false);
    setMsgLoading(true);
    try {
      const { messages: list, lastDoc } = await listMessages(id, AI_MESSAGES_PAGE_SIZE);
      setMessages(list);
      setMsgCursor(lastDoc);
    } catch {
      setMessages([]);
    } finally {
      setMsgLoading(false);
    }
  };

  const loadOlderMessages = async () => {
    if (!selectedId || !msgCursor) return;
    setMsgLoading(true);
    try {
      const { messages: older, lastDoc } = await listMessages(selectedId, AI_MESSAGES_PAGE_SIZE, msgCursor);
      setMessages((prev) => [...older, ...prev]);
      setMsgCursor(lastDoc);
    } finally {
      setMsgLoading(false);
    }
  };

  const startNewConversation = () => {
    setSelectedId(null);
    setMessages([]);
    setMsgCursor(null);
    setProviderNotice(null);
    setShowReport(false);
    setReportSent(false);
    setConfirmDelete(false);
    setComposer('');
    composerRef.current?.focus();
  };

  const handleSend = async () => {
    if (!user || sending) return;
    const error = validateMessageBody(composer);
    if (error) {
      setSendError(error === 'empty' ? '' : s.sendFailed.bn);
      return;
    }
    setSendError(null);
    setSending(true);
    try {
      const { conversationId, messageId } = await sendUserMessage(
        user.uid,
        composer,
        profile?.language === 'en' ? 'en' : 'bn',
        selectedId,
      );
      const sentText = composer.trim();
      setComposer('');
      // New conversation: add it to the top of the list.
      if (!selectedId) {
        setSelectedId(conversationId);
        setConversations((prev) => [
          {
            id: conversationId,
            ownerId: user.uid,
            title: sentText.length > 60 ? `${sentText.slice(0, 60)}…` : sentText,
            language: profile?.language === 'en' ? 'en' : 'bn',
            status: 'active',
            messageCount: 1,
            lastMessageAt: null,
            createdAt: null,
            updatedAt: null,
          },
          ...prev,
        ]);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: messageId,
          conversationId,
          role: 'user',
          senderId: user.uid,
          ownerId: user.uid,
          body: sentText,
          createdAt: null,
        },
      ]);
      // Ask the provider. Today it is ALWAYS the not-connected stub:
      // the notice below is the honest answer — never a generated one.
      const res = await aiProvider.sendMessage({
        conversationId,
        text: sentText,
        language: profile?.language === 'en' ? 'en' : 'bn',
        classLevel: profile?.classLevel ?? undefined,
      });
      if (!res.ok) {
        setProviderNotice({ bn: res.messageBn, en: res.messageEn });
      }
    } catch {
      setSendError(s.sendFailed.bn);
    } finally {
      setSending(false);
    }
  };

  const handleCopy = async (id: string, text: string) => {
    if (await copyText(text)) {
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
    }
  };

  const handleShare = async (text: string) => {
    const result = await shareText(text);
    setShareNote(result === 'shared' ? s.share.bn : result === 'copied' ? s.shareFallback.bn : s.sendFailed.bn);
    setTimeout(() => setShareNote(null), 3000);
  };

  const handleDelete = async () => {
    if (!user || !selectedId) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deleteConversation(user.uid, selectedId);
    setConversations((prev) => prev.filter((c) => c.id !== selectedId));
    startNewConversation();
  };

  const handleReport = async () => {
    if (!user || !selectedId) return;
    await reportAiResponse(user.uid, selectedId, reportReason, reportDetails);
    setReportSent(true);
    setShowReport(false);
  };

  const platformWarning =
    platformUsage && platformUsage.totalExchanges >= 450
      ? platformUsage.totalExchanges >= 500
        ? 'platform-full'
        : 'platform-nearly-full'
      : null;

  if (loading) {
    return (
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
        <p>লোড হচ্ছে… / Loading…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 26, margin: '0 0 4px' }}>{s.title.bn}</h1>
        <p style={{ color: '#555', margin: '0 0 20px' }}>{s.title.en}</p>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '20px 16px', background: '#fafafa' }}>
          <p style={{ margin: 0 }}>{s.signInPrompt.bn}</p>
          <p style={{ margin: '8px 0 0', color: '#555' }}>{s.signInPrompt.en}</p>
          <p style={{ marginTop: 16 }}>
            <Link to="/login" style={{ ...btnStyle, display: 'inline-block', textDecoration: 'none' }}>
              {strings.nav.login.bn} / {strings.nav.login.en}
            </Link>
          </p>
        </div>
        <p style={{ marginTop: 32 }}>
          <Link to="/">← হোম / Home</Link>
        </p>
      </main>
    );
  }

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 26, margin: '0 0 4px' }}>{s.title.bn}</h1>
      <p style={{ color: '#555', margin: '0 0 12px' }}>
        {s.subtitle.bn} · {s.subtitle.en}
      </p>

      {/* Honest status banner — always visible while no provider is connected. */}
      <div
        style={{
          border: '1px solid #F1B308',
          borderLeft: '6px solid #F1B308',
          borderRadius: 8,
          padding: '12px 14px',
          background: '#fff8e1',
          marginBottom: 12,
        }}
      >
        <p style={{ margin: 0 }}>
          <strong>⚠ {s.notConnectedBanner.bn}</strong>
        </p>
        <p style={{ margin: '6px 0 0', color: '#555' }}>{s.notConnectedBanner.en}</p>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: '#555' }}>{s.aiIsNotHuman.bn}</p>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: '#555' }}>{s.aiIsNotHuman.en}</p>
      </div>

      {platformWarning ? (
        <div
          style={{
            border: '1px solid #b00020',
            borderRadius: 8,
            padding: '12px 14px',
            background: '#fdf0f0',
            marginBottom: 12,
          }}
        >
          <p style={{ margin: 0 }}>
            {platformWarning === 'platform-full'
              ? 'আজকের AI সীমা শেষ হয়েছে (প্ল্যাটফর্মের দৈনিক সীমা)। আগামীকাল আবার চেষ্টা করুন। / Today’s AI limit is reached (platform daily limit). Please try again tomorrow.'
              : 'আজকের AI সীমা প্রায় শেষ — সংক্ষিপ্ত প্রশ্ন করুন। / Today’s AI limit is almost reached — please keep questions short.'}
          </p>
        </div>
      ) : null}

      {/* Usage display (counts only — never message content). */}
      <p style={{ fontSize: 14, color: '#555', margin: '0 0 16px' }}>
        {s.usedToday.bn}: {usage?.exchanges ?? 0} · {s.remainingToday.bn}:{' '}
        {remaining === null ? '…' : remaining === Number.POSITIVE_INFINITY ? '∞' : remaining} · {s.dailyLimitInfo.bn}
      </p>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Conversation list */}
        <aside
          style={{
            flex: '0 0 260px',
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: 12,
            background: '#fafafa',
            maxWidth: '100%',
          }}
        >
          <button type="button" onClick={startNewConversation} style={{ ...btnStyle, width: '100%' }}>
            + {s.newConversation.bn}
          </button>
          <h2 style={{ fontSize: 16, margin: '16px 0 8px' }}>{s.conversations.bn}</h2>
          {convLoading && conversations.length === 0 ? <p>লোড হচ্ছে…</p> : null}
          {conversations.length === 0 && !convLoading ? <p style={{ color: '#555' }}>{s.noConversations.bn}</p> : null}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {conversations.map((c) => (
              <li key={c.id} style={{ marginBottom: 6 }}>
                <button
                  type="button"
                  onClick={() => void openConversation(c.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: selectedId === c.id ? '2px solid #0A1F44' : '1px solid #ddd',
                    background: selectedId === c.id ? '#e8eefc' : '#fff',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  <span style={{ display: 'block', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.title}
                  </span>
                  <span style={{ color: '#555', fontSize: 12 }}>
                    {c.messageCount} বার্তা / messages
                    {c.updatedAt ? ` · ${formatTime(c.updatedAt.toDate())}` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {convCursor ? (
            <button type="button" onClick={() => void loadMoreConversations()} disabled={convLoading} style={{ ...secondaryBtnStyle, width: '100%', marginTop: 8 }}>
              {s.loadMore.bn} / {s.loadMore.en}
            </button>
          ) : null}
        </aside>

        {/* Chat pane */}
        <section style={{ flex: '1 1 420px', minWidth: 0 }}>
          {selected ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <h2 style={{ fontSize: 18, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selected.title}
              </h2>
              <button type="button" onClick={() => void handleDelete()} style={{ ...secondaryBtnStyle, padding: '8px 12px', minHeight: 40, fontSize: 13, borderColor: confirmDelete ? '#b00020' : '#0A1F44', color: confirmDelete ? '#b00020' : '#0A1F44' }}>
                {confirmDelete ? 'নিশ্চিত? মুছুন / Confirm delete' : `${s.deleteConversation.bn}`}
              </button>
            </div>
          ) : null}

          {msgCursor ? (
            <button type="button" onClick={() => void loadOlderMessages()} disabled={msgLoading} style={{ ...secondaryBtnStyle, marginBottom: 12 }}>
              {s.olderMessages.bn} / {s.olderMessages.en}
            </button>
          ) : null}

          {msgLoading && messages.length === 0 ? <p>লোড হচ্ছে…</p> : null}
          {!selected && messages.length === 0 ? (
            <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '20px 16px', background: '#fafafa', marginBottom: 12 }}>
              <p style={{ margin: 0 }}>{s.noConversations.bn}</p>
              <p style={{ margin: '8px 0 0', color: '#555' }}>{s.noConversations.en}</p>
              <p style={{ margin: '12px 0 0' }}>
                <Link to="/library">{s.quickLibrary.bn}</Link>
                {' · '}
                <Link to="/routine">{s.quickRoutine.bn}</Link>
                {' · '}
                <Link to="/progress">{s.quickProgress.bn}</Link>
              </p>
            </div>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            {messages.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div
                    style={{
                      background: '#0A1F44',
                      color: '#fff',
                      borderRadius: '12px 12px 4px 12px',
                      padding: '10px 14px',
                      maxWidth: '85%',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {m.body}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#555' }}>
                      {s.you.bn}
                      {m.createdAt ? ` · ${formatTime(m.createdAt.toDate())}` : ''}
                    </span>
                    <button type="button" onClick={() => void handleCopy(m.id, m.body)} style={{ background: 'none', border: 'none', color: '#0A1F44', cursor: 'pointer', fontSize: 13, padding: '6px 8px' }}>
                      {copiedId === m.id ? s.copied.bn : s.copy.bn}
                    </button>
                    <button type="button" onClick={() => void handleShare(m.body)} style={{ background: 'none', border: 'none', color: '#0A1F44', cursor: 'pointer', fontSize: 13, padding: '6px 8px' }}>
                      {s.share.bn}
                    </button>
                  </div>
                </div>
              ) : (
                // Assistant replies (written ONLY by the future gateway)
                // and system notices render as plain cards — never as
                // a chat bubble pretending a model is talking now.
                <div
                  key={m.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '12px 12px 12px 4px',
                    padding: '10px 14px',
                    maxWidth: '85%',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  <p style={{ margin: 0, fontSize: 12, color: '#555' }}>{s.aiTeacherName.bn}</p>
                  <p style={{ margin: '6px 0 0' }}>{m.body}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button type="button" onClick={() => void handleCopy(m.id, m.body)} style={{ background: 'none', border: 'none', color: '#0A1F44', cursor: 'pointer', fontSize: 13, padding: '6px 8px' }}>
                      {copiedId === m.id ? s.copied.bn : s.copy.bn}
                    </button>
                    <button type="button" onClick={() => void handleShare(m.body)} style={{ background: 'none', border: 'none', color: '#0A1F44', cursor: 'pointer', fontSize: 13, padding: '6px 8px' }}>
                      {s.share.bn}
                    </button>
                  </div>
                </div>
              ),
            )}

            {/* Provider notice — a SYSTEM card, never an AI reply. */}
            {providerNotice ? (
              <div
                style={{
                  border: '1px solid #F1B308',
                  borderLeft: '6px solid #F1B308',
                  borderRadius: 8,
                  padding: '12px 14px',
                  background: '#fff8e1',
                }}
              >
                <p style={{ margin: 0, fontSize: 12, color: '#555' }}>সিস্টেম বার্তা / System notice</p>
                <p style={{ margin: '6px 0 0' }}>
                  <strong>{providerNotice.bn}</strong>
                </p>
                <p style={{ margin: '6px 0 0', color: '#555' }}>{providerNotice.en}</p>
                <p style={{ margin: '8px 0 0', fontSize: 14, color: '#555' }}>{s.safetyNote.bn}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <Link to="/library" style={{ ...secondaryBtnStyle, display: 'inline-block', textDecoration: 'none', padding: '8px 12px', minHeight: 40, fontSize: 13 }}>
                    {s.quickLibrary.bn}
                  </Link>
                  <Link to="/routine" style={{ ...secondaryBtnStyle, display: 'inline-block', textDecoration: 'none', padding: '8px 12px', minHeight: 40, fontSize: 13 }}>
                    {s.quickRoutine.bn}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowReport((v) => !v)}
                    style={{ ...secondaryBtnStyle, padding: '8px 12px', minHeight: 40, fontSize: 13 }}
                  >
                    {s.report.bn} / {s.report.en}
                  </button>
                </div>
                {showReport && selectedId ? (
                  <div style={{ marginTop: 12, borderTop: '1px solid #F1B308', paddingTop: 12 }}>
                    <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>
                      {s.reportReason.bn} / {s.reportReason.en}
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value as typeof reportReason)}
                      style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #999', minHeight: 44, fontSize: 15 }}
                    >
                      <option value="other">অন্যান্য / Other</option>
                      <option value="abuse">অপব্যবহার / Abuse</option>
                      <option value="spam">স্প্যাম / Spam</option>
                      <option value="personal-info">ব্যক্তিগত তথ্য / Personal info</option>
                    </select>
                    <label style={{ display: 'block', fontSize: 14, margin: '10px 0 4px' }}>
                      {s.reportDetails.bn} / {s.reportDetails.en}
                    </label>
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      rows={2}
                      maxLength={2000}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 6, border: '1px solid #999', fontSize: 15 }}
                    />
                    <button type="button" onClick={() => void handleReport()} style={{ ...btnStyle, marginTop: 8 }}>
                      {s.reportSubmit.bn}
                    </button>
                  </div>
                ) : null}
                {reportSent ? <p style={{ color: '#0a7a2e', margin: '10px 0 0' }}>{s.reportSent.bn}</p> : null}
              </div>
            ) : null}
          </div>

          {shareNote ? <p style={{ color: '#555', fontSize: 14 }}>{shareNote}</p> : null}
          {sendError ? <p style={{ color: '#b00020' }}>{sendError}</p> : null}

          {/* Composer */}
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, background: '#fff' }}>
            <textarea
              ref={composerRef}
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={s.askPlaceholder.bn}
              rows={3}
              maxLength={4000}
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 6, border: '1px solid #999', fontSize: 16, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button type="button" onClick={() => void handleSend()} disabled={sending || composer.trim().length === 0} style={{ ...btnStyle, opacity: sending || composer.trim().length === 0 ? 0.5 : 1 }}>
                {sending ? '…' : s.send.bn}
              </button>
              {/* Voice + image inputs exist as DISABLED controls with
                  honest "coming soon" labels — never faked. */}
              <button type="button" disabled title={s.voiceSoon.bn} style={{ ...secondaryBtnStyle, opacity: 0.5, cursor: 'not-allowed' }}>
                🎙 {s.voiceSoon.bn}
              </button>
              <button type="button" disabled title={s.imageSoon.bn} style={{ ...secondaryBtnStyle, opacity: 0.5, cursor: 'not-allowed' }}>
                🖼 {s.imageSoon.bn}
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#555', margin: '10px 0 0' }}>
              {s.voiceSoon.en} · {s.imageSoon.en}
            </p>
          </div>
        </section>
      </div>

      <p style={{ marginTop: 32 }}>
        <Link to="/">← হোম / Home</Link>
        {' · '}
        <Link to="/ai-teacher">{strings.aiTeacher.title.bn} (প্রদর্শনী)</Link>
      </p>
    </main>
  );
}
