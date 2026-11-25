// Done-for-you custom paper service — order request page (owner
// 25 Nov 10:50, "koro").
//
// Route: /custom-paper (routing-agnostic mount for now; the SSG branch
// moves public routes under /:lang — SSG merges first, then this route
// moves under that pattern; see App.tsx).
//
// FLOW (human service, never automated): the buyer fills the form →
// the page builds the order text → the buyer copies it and sends it on
// WhatsApp (eduvelto.com/whatsapp redirect — the raw number is never
// shown) → pays ৳49/paper via bKash/Nagad + TrxID → the owner/team
// builds the paper and delivers the PDF via WhatsApp. The order is NOT
// stored in Firestore in this build (deliberate — a new collection
// would deepen the BRT-11 donations drift before the merge; see the
// MVP report §5). Firestore-backed order tracking is a Phase 2
// follow-up. No delivery time is promised anywhere on this page.
import { useState } from 'react';
import { PageShell } from '../components/PageShell';
import { AlertBox, Button, Card, Chip, LinkButton } from '../components/ui';
import {
  QPG_CUSTOM_PAPER_BDT,
  QPG_CUSTOM_PAPER_THEIR_MAX_BDT,
  QPG_CUSTOM_PAPER_THEIR_MIN_BDT,
  QPG_PAYMENT_NUMBER,
  QPG_PRICE_CLAIM_BN,
  QPG_WHATSAPP_URL,
} from '../lib/questionPaper';
import {
  buildCustomPaperOrderText,
  emptyCustomPaperOrder,
  validateCustomPaperOrder,
  type CustomPaperOrder,
} from '../lib/customPaperOrder';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontSize: 14,
  border: '1px solid #ccc',
  borderRadius: 6,
  boxSizing: 'border-box',
};

function Field(props: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label style={{ display: 'block', marginBottom: 12, fontSize: 14 }}>
      <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>{props.label}</span>
      {props.children}
      {props.hint ? (
        <span style={{ display: 'block', fontSize: 12, color: '#666', marginTop: 4 }}>{props.hint}</span>
      ) : null}
    </label>
  );
}

export default function CustomPaperPage() {
  const [order, setOrder] = useState<CustomPaperOrder>(emptyCustomPaperOrder);
  const [problems, setProblems] = useState<string[]>([]);
  const [orderText, setOrderText] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');

  const set = <K extends keyof CustomPaperOrder>(key: K, value: CustomPaperOrder[K]) =>
    setOrder((o) => ({ ...o, [key]: value }));

  const onBuildOrder = () => {
    const found = validateCustomPaperOrder(order);
    setProblems(found);
    setCopied(false);
    setCopyError('');
    if (found.length > 0) {
      setOrderText('');
      return;
    }
    setOrderText(buildCustomPaperOrderText(order));
  };

  const onCopy = async () => {
    setCopyError('');
    try {
      await navigator.clipboard.writeText(orderText);
      setCopied(true);
    } catch {
      setCopyError('কপি করা যায়নি — নিচের লেখাটি হাতে সিলেক্ট করে কপি করুন।');
    }
  };

  return (
    <PageShell titleBn="কাস্টম প্রশ্নপত্র — আমরা বানিয়ে দিই" titleEn="Custom Question Paper — We Make It For You" wide>
      <AlertBox tone="info">
        নিজে বানাতে না চাইলে আমরাই বানিয়ে দিই — অর্ডার দিন WhatsApp-এ, পেপার তৈরি করে PDF পাঠিয়ে দেওয়া হবে।
        এটি মানুষের সেবা (owner/team হাতে বানায়) — স্বয়ংক্রিয় নয়।
      </AlertBox>

      <Card style={{ marginTop: 16 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 17 }}>কাস্টম প্রশ্নপত্র — ১ পেপার</h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 8px' }}>
          <s style={{ color: '#888' }}>
            বাজার মূল্য ৳{QPG_CUSTOM_PAPER_THEIR_MIN_BDT}–{QPG_CUSTOM_PAPER_THEIR_MAX_BDT}
          </s>{' '}
          <Chip tone="gold">{QPG_PRICE_CLAIM_BN}</Chip>{' '}
          <strong style={{ fontSize: 22 }}>৳{QPG_CUSTOM_PAPER_BDT}</strong>
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          নম্বর বণ্টন + যা যা লাগবে, লিখে পাঠান — আপনার পরীক্ষার জন্য হাতে বানানো প্রশ্নপত্র। নিজে বানাতে চাইলে{' '}
          <LinkButton to="/question-maker" variant="ghost" size="sm">
            জেনারেটর ব্যবহার করুন
          </LinkButton>{' '}
          (ফ্রি ৩টি/মাস)।
        </p>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 17 }}>১. অর্ডারের বিবরণ লিখুন</h2>
        <Field label="আপনার নাম">
          <input
            style={inputStyle}
            value={order.buyerName}
            onChange={(e) => set('buyerName', e.target.value)}
            placeholder="যেমন: রহিম উদ্দিন"
          />
        </Field>
        <Field label="আপনার WhatsApp নম্বর (ঐচ্ছিক)" hint="টিম যাতে উত্তরে যোগাযোগ করতে পারে।">
          <input
            style={inputStyle}
            value={order.buyerWhatsapp}
            onChange={(e) => set('buyerWhatsapp', e.target.value)}
            placeholder="যেমন: 01XXXXXXXXX"
          />
        </Field>
        <Field label="শ্রেণি *">
          <input
            style={inputStyle}
            value={order.className}
            onChange={(e) => set('className', e.target.value)}
            placeholder="যেমন: ৯ম শ্রেণি"
          />
        </Field>
        <Field label="বিষয় *">
          <input
            style={inputStyle}
            value={order.subject}
            onChange={(e) => set('subject', e.target.value)}
            placeholder="যেমন: গণিত"
          />
        </Field>
        <Field label="অধ্যায় / টপিক" hint="কোন অধ্যায়গুলো থেকে প্রশ্ন চান, লিখুন।">
          <textarea
            style={{ ...inputStyle, minHeight: 64 }}
            value={order.chapters}
            onChange={(e) => set('chapters', e.target.value)}
            placeholder="যেমন: বীজগণিত — সূচক ও লগারিদম; জ্যামিতি — বৃত্ত"
          />
        </Field>
        <Field label="প্রশ্নের ধরন ও সংখ্যা" hint="যেমন: MCQ ২০টি, সৃজনশীল ৫টি, সংক্ষিপ্ত ১০টি।">
          <input
            style={inputStyle}
            value={order.questionTypes}
            onChange={(e) => set('questionTypes', e.target.value)}
            placeholder="যেমন: MCQ ২০টি, সৃজনশীল ৫টি"
          />
        </Field>
        <Field label="মোট নম্বর *">
          <input
            style={inputStyle}
            type="number"
            min={1}
            value={order.totalMarks || ''}
            onChange={(e) => set('totalMarks', Number(e.target.value) || 0)}
            placeholder="যেমন: ১০০"
          />
        </Field>
        <Field label="নম্বর বণ্টন" hint="প্রতি বিভাগে কত নম্বর, লিখুন।">
          <input
            style={inputStyle}
            value={order.markDistribution}
            onChange={(e) => set('markDistribution', e.target.value)}
            placeholder="যেমন: ক-বিভাগ ২০, খ-বিভাগ ৩০, গ-বিভাগ ৫০"
          />
        </Field>
        <Field label="পরীক্ষার নাম">
          <input
            style={inputStyle}
            value={order.examTitle}
            onChange={(e) => set('examTitle', e.target.value)}
            placeholder="যেমন: বার্ষিক পরীক্ষা ২০২৬"
          />
        </Field>
        <Field label="প্রতিষ্ঠানের নাম">
          <input
            style={inputStyle}
            value={order.institutionName}
            onChange={(e) => set('institutionName', e.target.value)}
            placeholder="যেমন: মডেল হাই স্কুল"
          />
        </Field>
        <Field label="কবে নাগাদ লাগবে *">
          <input
            style={inputStyle}
            value={order.dateNeeded}
            onChange={(e) => set('dateNeeded', e.target.value)}
            placeholder="যেমন: ২৮ নভেম্বর"
          />
        </Field>
        <Field label="বিশেষ নির্দেশনা">
          <textarea
            style={{ ...inputStyle, minHeight: 64 }}
            value={order.instructions}
            onChange={(e) => set('instructions', e.target.value)}
            placeholder="যেমন: সহজ-মাঝারি প্রশ্ন বেশি রাখবেন; উত্তরপত্রও লাগবে।"
          />
        </Field>
        <Button onClick={onBuildOrder}>অর্ডারের বিবরণ তৈরি করুন</Button>
        {problems.length > 0 ? (
          <AlertBox tone="error">
            {problems.map((p) => (
              <div key={p}>{p}</div>
            ))}
          </AlertBox>
        ) : null}
      </Card>

      {orderText ? (
        <Card style={{ marginTop: 16 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 17 }}>২. WhatsApp-এ অর্ডার পাঠান</h2>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              fontSize: 13,
              lineHeight: 1.7,
              background: '#f7f7f7',
              padding: 12,
              borderRadius: 6,
              margin: '0 0 12px',
            }}
          >
            {orderText}
          </pre>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button onClick={onCopy}>{copied ? 'কপি হয়েছে ✓' : 'অর্ডারের বিবরণ কপি করুন'}</Button>
            <a className="ev-btn" href={QPG_WHATSAPP_URL} target="_blank" rel="noreferrer">
              WhatsApp-এ অর্ডার করুন
            </a>
          </div>
          {copyError ? <p style={{ fontSize: 13, color: '#a00' }}>{copyError}</p> : null}
          <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7 }}>
            কপি করা লেখাটি WhatsApp চ্যাটে পেস্ট করে পাঠান। অর্ডার পেলে টিম WhatsApp-এ নিশ্চিত করবে।
          </p>
        </Card>
      ) : null}

      <Card style={{ marginTop: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 17 }}>৩. পেমেন্ট — ৳{QPG_CUSTOM_PAPER_BDT}</h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 8px' }}>
          বিকাশ/নগদ <strong>{QPG_PAYMENT_NUMBER}</strong> নম্বরে ৳{QPG_CUSTOM_PAPER_BDT} পাঠান, তারপর TrxID +
          পাঠানো নম্বরের শেষ ৩ ডিজিট WhatsApp-এ জানান। পেমেন্ট নিশ্চিত হলে পেপার তৈরি শুরু হবে, আর তৈরি PDF
          WhatsApp-এ পাঠিয়ে দেওয়া হবে।
        </p>
        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, margin: 0 }}>
          কোনো সমস্যা হলে একই WhatsApp-এ যোগাযোগ করুন। পেমেন্টের রেকর্ড হিসেবে TrxID-ই যথেষ্ট — আলাদা ফরম
          পূরণ করতে হয় না।
        </p>
      </Card>
    </PageShell>
  );
}
