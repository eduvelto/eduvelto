// Eduvelto — Question Paper Generator Phase 2: Smartboard (§2).
//
// Route: /smartboard (own boards + editor) and /smartboard/:boardId
// (read-only share view for students).
//
// OWN Canvas 2D implementation — explicitly NO Excalidraw. A paper
// becomes slides (separate-slides, default, or whole-paper); the
// teacher draws/writes over the question, reveals the answer with
// "উত্তর দেখান", navigates with ←/→, goes fullscreen with F, and runs
// a 10:00 timer (5/10/15/30 selectable). Boards save to `qpgBoards`
// (debounced autosave, 2s) — the rules are in firestore.rules but NOT
// deployed yet, so a save fails honestly with permission-denied until
// the owner approves the rules deploy (§8.6).
//
// Board use is FREE; PDF export + share link are Pro (spec §8.13
// proposal — the page enforces the gate; the rules enforce that only
// the owner may flip shareEnabled). PNG export of the current slide
// is free. The board canvas stays WHITE (black-on-white, like paper).

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Button, Card } from '../components/ui';
import { useAuth } from '../lib/auth';
import { db } from '../firebase';
import {
  QPG_BOARD_LAYOUTS,
  QPG_BOARD_TIMER_OPTIONS,
  addBoardAnnotation,
  blankBoardSlide,
  boardTimerSeconds,
  buildBoardSlides,
  clearBoardAnnotations,
  createDebouncedBoardSaver,
  formatBoardTimer,
  newBoardAnnotationId,
  readPaperForSmartboard,
  removeBoardAnnotation,
  toggleBoardAnswer,
  undoBoardAnnotation,
  type QpgBoardAnnotation,
  type QpgBoardDoc,
  type QpgBoardLayout,
  type QpgBoardSlide,
  type QpgBoardTool,
} from '../lib/qpgSmartboard';
import {
  loadCachedProStatus,
  loadMyQpgBoards,
  loadQpgBoard,
  saveQpgBoard,
} from '../lib/qpgFirestore';
import { QPG_PRO_LOCKED, type QpgProStatus } from '../lib/qpgProOrders';
import type { QpgPaper } from '../lib/questionPaper';

const BOARD_W = 960;
const BOARD_H = 540;
const PEN_COLORS = ['#14532d', '#b45309', '#1d4ed8', '#b00020', '#111111'];

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  let cursorY = y;
  for (const rawLine of text.split('\n')) {
    const words = rawLine.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      cursorY += lineHeight;
      continue;
    }
    let line = '';
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word;
      if (ctx.measureText(trial).width > maxWidth && line) {
        ctx.fillText(line, x, cursorY);
        cursorY += lineHeight;
        line = word;
      } else {
        line = trial;
      }
    }
    if (line) {
      ctx.fillText(line, x, cursorY);
      cursorY += lineHeight;
    }
  }
  return cursorY;
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 12;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(angle - 0.4), y2 - head * Math.sin(angle - 0.4));
  ctx.lineTo(x2 - head * Math.cos(angle + 0.4), y2 - head * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();
}

function drawAnnotation(ctx: CanvasRenderingContext2D, a: QpgBoardAnnotation): void {
  if (a.kind === 'stroke') {
    if (a.points.length === 0) return;
    ctx.strokeStyle = a.color;
    ctx.lineWidth = a.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(a.points[0].x, a.points[0].y);
    for (const p of a.points.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    return;
  }
  if (a.kind === 'shape') {
    ctx.strokeStyle = a.color;
    ctx.lineWidth = a.width;
    if (a.shape === 'rectangle') {
      ctx.strokeRect(Math.min(a.x1, a.x2), Math.min(a.y1, a.y2), Math.abs(a.x2 - a.x1), Math.abs(a.y2 - a.y1));
    } else if (a.shape === 'ellipse') {
      ctx.beginPath();
      ctx.ellipse((a.x1 + a.x2) / 2, (a.y1 + a.y2) / 2, Math.abs(a.x2 - a.x1) / 2, Math.abs(a.y2 - a.y1) / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (a.shape === 'line') {
      ctx.beginPath();
      ctx.moveTo(a.x1, a.y1);
      ctx.lineTo(a.x2, a.y2);
      ctx.stroke();
    } else {
      drawArrow(ctx, a.x1, a.y1, a.x2, a.y2, a.color, a.width);
    }
    return;
  }
  ctx.fillStyle = a.color;
  ctx.font = `${a.fontSize}px 'Hind Siliguri', sans-serif`;
  ctx.fillText(a.text, a.x, a.y);
}

/** Render one slide onto a canvas (white background, black text). */
function renderSlide(canvas: HTMLCanvasElement, slide: QpgBoardSlide, slideNo: number): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const scale = canvas.width / BOARD_W;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, BOARD_W, BOARD_H);
  ctx.fillStyle = '#111111';
  ctx.font = "20px 'Hind Siliguri', sans-serif";
  const afterQ = wrapText(ctx, `${slideNo}. ${slide.questionText}`, 40, 48, BOARD_W - 80, 30);
  ctx.font = "18px 'Hind Siliguri', sans-serif";
  let y = afterQ + 8;
  for (const opt of slide.options) {
    y = wrapText(ctx, `${opt.letter}. ${opt.text}`, 64, y, BOARD_W - 104, 26);
  }
  if (slide.showAnswer && slide.correctLetter) {
    ctx.fillStyle = '#14532d';
    ctx.font = "bold 18px 'Hind Siliguri', sans-serif";
    ctx.fillText(`সঠিক উত্তর: ${slide.correctLetter}`, 40, y + 16);
    if (slide.explanation) {
      ctx.fillStyle = '#333333';
      ctx.font = "16px 'Hind Siliguri', sans-serif";
      wrapText(ctx, slide.explanation, 40, y + 44, BOARD_W - 80, 24);
    }
  }
  for (const a of slide.annotations) drawAnnotation(ctx, a);
}

function newBoardId(): string {
  return `qpg-board-${Date.now().toString(36)}-${Math.floor(Math.random() * 1296).toString(36)}`;
}

const TOOLS: Array<{ id: QpgBoardTool; label: string }> = [
  { id: 'pen', label: 'কলম' },
  { id: 'rectangle', label: 'আয়তক্ষেত্র' },
  { id: 'ellipse', label: 'উপবৃত্ত' },
  { id: 'line', label: 'রেখা' },
  { id: 'arrow', label: 'তীর' },
  { id: 'text', label: 'লেখা' },
  { id: 'eraser', label: 'মোছা' },
];

export default function SmartboardPage() {
  const { boardId: shareBoardId } = useParams();
  const { user } = useAuth();
  const uid = user?.uid ?? 'guest';
  const userName = user?.displayName ?? user?.email ?? '';
  const isGuest = uid === 'guest';

  // --- board state ---------------------------------------------------
  const [paper, setPaper] = useState<QpgPaper | null>(null);
  const [slides, setSlides] = useState<QpgBoardSlide[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [layout, setLayout] = useState<QpgBoardLayout>('separate');
  const [boardId, setBoardId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [shareEnabled, setShareEnabled] = useState(false);
  const [myBoards, setMyBoards] = useState<Array<QpgBoardDoc & { id: string }>>([]);
  const [myBoardsError, setMyBoardsError] = useState('');
  const [saveState, setSaveState] = useState('');
  const [loadError, setLoadError] = useState('');
  const [proStatus, setProStatus] = useState<QpgProStatus>(QPG_PRO_LOCKED);

  // --- drawing state --------------------------------------------------
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tool, setTool] = useState<QpgBoardTool>('pen');
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [penWidth, setPenWidth] = useState(3);
  const [zoom, setZoom] = useState(1);
  const [draftStroke, setDraftStroke] = useState<Array<{ x: number; y: number }> | null>(null);
  const [draftShape, setDraftShape] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [textDraft, setTextDraft] = useState<{ x: number; y: number; value: string } | null>(null);
  const drawingRef = useRef(false);
  const redoRef = useRef<Record<string, QpgBoardAnnotation[]>>({});

  // --- timer -----------------------------------------------------------
  const [timerMinutes, setTimerMinutes] = useState(10);
  const [timerSeconds, setTimerSeconds] = useState(boardTimerSeconds(10));
  const [timerRunning, setTimerRunning] = useState(false);

  const slide = slides[slideIndex] ?? null;
  const isShareView = Boolean(shareBoardId);
  const proUnlocked = proStatus.proUnlocked;

  // --- load ------------------------------------------------------------
  useEffect(() => {
    if (isGuest || !db) return;
    let alive = true;
    void loadCachedProStatus(db, uid)
      .then((s) => {
        if (alive) setProStatus(s);
      })
      .catch(() => undefined);
    void loadMyQpgBoards(db, uid)
      .then((rows) => {
        if (alive) setMyBoards(rows);
      })
      .catch((err) => {
        if (alive) setMyBoardsError(err instanceof Error ? err.message : 'বোর্ড তালিকা আনা যায়নি।');
      });
    return () => {
      alive = false;
    };
  }, [isGuest, uid]);

  // Share view: load the shared board by id.
  useEffect(() => {
    if (!shareBoardId || !db) return;
    let alive = true;
    void loadQpgBoard(db, shareBoardId)
      .then((b) => {
        if (!alive) return;
        if (!b) {
          setLoadError('বোর্ডটি পাওয়া যায়নি।');
          return;
        }
        if (!b.shareEnabled && b.ownerUid !== uid) {
          setLoadError('বোর্ডটি শেয়ার করা হয়নি।');
          return;
        }
        setBoardId(b.id);
        setTitle(b.title);
        setLayout(b.layout);
        setSlides(b.slides);
        setShareEnabled(b.shareEnabled);
      })
      .catch((err) => {
        if (alive) setLoadError(err instanceof Error ? err.message : 'বোর্ড আনা যায়নি।');
      });
    return () => {
      alive = false;
    };
  }, [shareBoardId, uid]);

  // Own mode: pick up the paper handed off from the generator.
  useEffect(() => {
    if (shareBoardId) return;
    const handed = readPaperForSmartboard();
    if (!handed) return;
    setPaper(handed);
    setSlides(buildBoardSlides(handed, 'separate'));
    setSlideIndex(0);
    setBoardId(newBoardId());
    setTitle(handed.setup.title || 'স্মার্টবোর্ড');
  }, [shareBoardId]);

  // --- render ----------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !slide) return;
    renderSlide(canvas, slide, slideIndex + 1);
    if (draftStroke && draftStroke.length > 0) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const scale = canvas.width / BOARD_W;
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        drawAnnotation(ctx, { kind: 'stroke', id: 'draft', points: draftStroke, color, width: penWidth });
      }
    }
    if (draftShape) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const scale = canvas.width / BOARD_W;
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        const shape = tool === 'rectangle' ? 'rectangle' : tool === 'ellipse' ? 'ellipse' : tool === 'arrow' ? 'arrow' : 'line';
        drawAnnotation(ctx, { kind: 'shape', id: 'draft', shape, x1: draftShape.x1, y1: draftShape.y1, x2: draftShape.x2, y2: draftShape.y2, color, width: penWidth });
      }
    }
  }, [slide, slideIndex, draftStroke, draftShape, color, penWidth, tool]);

  // --- timer -----------------------------------------------------------
  useEffect(() => {
    if (!timerRunning) return;
    if (timerSeconds <= 0) {
      setTimerRunning(false);
      return;
    }
    const t = setTimeout(() => setTimerSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timerRunning, timerSeconds]);

  // --- keyboard: ←/→ navigate, F fullscreen ---------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return;
      if (e.key === 'ArrowLeft') setSlideIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setSlideIndex((i) => Math.min(slides.length - 1, i + 1));
      if (e.key === 'f' || e.key === 'F') {
        void containerRef.current?.requestFullscreen?.().catch(() => undefined);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slides.length]);

  // --- autosave ---------------------------------------------------------
  // The saver callback reads the CURRENT boardId from a ref — a
  // useRef(initial) callback would close over the first render's null.
  const boardIdRef = useRef<string | null>(null);
  useEffect(() => {
    boardIdRef.current = boardId;
  }, [boardId]);
  const saverRef = useRef(
    createDebouncedBoardSaver(async (doc) => {
      const id = boardIdRef.current;
      if (!id || !db) return;
      try {
        await saveQpgBoard(db, id, doc);
        setSaveState('সংরক্ষিত ✓');
      } catch (err) {
        setSaveState(
          /permission-denied/i.test(err instanceof Error ? err.message : '')
            ? 'সংরক্ষণ হয়নি — বোর্ড যাচাই ব্যবস্থা এখনো চালু হয়নি।'
            : 'সংরক্ষণ করা যায়নি।',
        );
      }
    }),
  );

  const boardDoc = useCallback((): QpgBoardDoc | null => {
    if (!boardId || uid === 'guest') return null;
    return {
      ownerUid: uid,
      ownerName: userName || undefined,
      title: title.trim() || 'স্মার্টবোর্ড',
      subject: paper?.setup.subject ?? '',
      classLabel: paper?.setup.classLabel ?? '',
      setCode: paper?.setup.setCode ?? '',
      layout,
      paperRef: { paperId: paper?.id ?? '', questionIds: (paper?.questions ?? []).map((q) => q.id) },
      slides,
      shareEnabled,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [boardId, uid, userName, title, paper, layout, slides, shareEnabled]);

  const scheduleSave = useCallback(() => {
    const doc = boardDoc();
    if (!doc) return;
    setSaveState('সংরক্ষণ হচ্ছে…');
    saverRef.current.schedule(doc);
  }, [boardDoc]);

  const updateSlide = useCallback(
    (next: QpgBoardSlide) => {
      setSlides((prev) => prev.map((s, i) => (i === slideIndex ? next : s)));
    },
    [slideIndex],
  );

  // --- pointer handling --------------------------------------------------
  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * BOARD_W,
      y: ((e.clientY - rect.top) / rect.height) * BOARD_H,
    };
  };

  const hitAnnotation = (p: { x: number; y: number }): QpgBoardAnnotation | null => {
    if (!slide) return null;
    for (let i = slide.annotations.length - 1; i >= 0; i -= 1) {
      const a = slide.annotations[i];
      if (a.kind === 'stroke' && a.points.some((pt) => Math.hypot(pt.x - p.x, pt.y - p.y) < 14)) return a;
      if (a.kind === 'shape') {
        const minX = Math.min(a.x1, a.x2) - 8;
        const maxX = Math.max(a.x1, a.x2) + 8;
        const minY = Math.min(a.y1, a.y2) - 8;
        const maxY = Math.max(a.y1, a.y2) + 8;
        if (p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY) return a;
      }
      if (a.kind === 'text') {
        const w = a.text.length * a.fontSize * 0.6;
        if (p.x >= a.x - 4 && p.x <= a.x + w && p.y >= a.y - a.fontSize && p.y <= a.y + 6) return a;
      }
    }
    return null;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isShareView || !slide) return;
    const p = pointFromEvent(e);
    if (tool === 'text') {
      setTextDraft({ x: p.x, y: p.y, value: '' });
      return;
    }
    if (tool === 'eraser') {
      const hit = hitAnnotation(p);
      if (hit) {
        updateSlide(removeBoardAnnotation(slide, hit.id));
        scheduleSave();
      }
      drawingRef.current = true;
      return;
    }
    drawingRef.current = true;
    if (tool === 'pen') setDraftStroke([p]);
    else setDraftShape({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isShareView || !slide || !drawingRef.current) return;
    const p = pointFromEvent(e);
    if (tool === 'pen') {
      setDraftStroke((prev) => (prev ? [...prev, p] : [p]));
      return;
    }
    if (tool === 'eraser') {
      const hit = hitAnnotation(p);
      if (hit) {
        updateSlide(removeBoardAnnotation(slide, hit.id));
        scheduleSave();
      }
      return;
    }
    setDraftShape((prev) => (prev ? { ...prev, x2: p.x, y2: p.y } : null));
  };

  const onPointerUp = () => {
    if (isShareView || !slide || !drawingRef.current) return;
    drawingRef.current = false;
    if (tool === 'pen' && draftStroke && draftStroke.length > 1) {
      updateSlide(addBoardAnnotation(slide, { kind: 'stroke', id: newBoardAnnotationId(), points: draftStroke, color, width: penWidth }));
      redoRef.current[slide.id] = [];
      scheduleSave();
    }
    if (draftShape) {
      const shape = tool === 'rectangle' ? 'rectangle' : tool === 'ellipse' ? 'ellipse' : tool === 'arrow' ? 'arrow' : 'line';
      updateSlide(
        addBoardAnnotation(slide, {
          kind: 'shape', id: newBoardAnnotationId(), shape,
          x1: draftShape.x1, y1: draftShape.y1, x2: draftShape.x2, y2: draftShape.y2, color, width: penWidth,
        }),
      );
      redoRef.current[slide.id] = [];
      scheduleSave();
    }
    setDraftStroke(null);
    setDraftShape(null);
  };

  const commitTextDraft = () => {
    if (!textDraft || !slide) {
      setTextDraft(null);
      return;
    }
    const text = textDraft.value.trim();
    if (text) {
      updateSlide(
        addBoardAnnotation(slide, {
          kind: 'text', id: newBoardAnnotationId(), x: textDraft.x, y: textDraft.y, text, color, fontSize: 22,
        }),
      );
      redoRef.current[slide.id] = [];
      scheduleSave();
    }
    setTextDraft(null);
  };

  const undo = () => {
    if (!slide) return;
    const last = slide.annotations[slide.annotations.length - 1];
    if (!last) return;
    redoRef.current[slide.id] = [...(redoRef.current[slide.id] ?? []), last];
    updateSlide(undoBoardAnnotation(slide));
    scheduleSave();
  };

  const redo = () => {
    if (!slide) return;
    const stack = redoRef.current[slide.id] ?? [];
    const next = stack[stack.length - 1];
    if (!next) return;
    redoRef.current[slide.id] = stack.slice(0, -1);
    updateSlide(addBoardAnnotation(slide, next));
    scheduleSave();
  };

  const changeLayout = (next: QpgBoardLayout) => {
    if (next === layout) return;
    if (!paper) {
      setLayout(next);
      return;
    }
    const hasMarks = slides.some((s) => s.annotations.length > 0);
    if (hasMarks && !window.confirm('লেআউট বদলালে আঁকা/লেখা মুছে যাবে। বদলাবেন?')) return;
    setLayout(next);
    setSlides(buildBoardSlides(paper, next));
    setSlideIndex(0);
  };

  const openBoard = (b: QpgBoardDoc & { id: string }) => {
    setBoardId(b.id);
    setTitle(b.title);
    setLayout(b.layout);
    setSlides(b.slides);
    setSlideIndex(0);
    setShareEnabled(b.shareEnabled);
    setPaper(null);
  };

  const saveNow = async () => {
    const doc = boardDoc();
    if (!doc || !boardId || !db) return;
    saverRef.current.flush();
    setSaveState('সংরক্ষণ হচ্ছে…');
    try {
      await saveQpgBoard(db, boardId, doc);
      setSaveState('সংরক্ষিত ✓');
    } catch (err) {
      setSaveState(
        /permission-denied/i.test(err instanceof Error ? err.message : '')
          ? 'সংরক্ষণ হয়নি — বোর্ড যাচাই ব্যবস্থা এখনো চালু হয়নি।'
          : 'সংরক্ষণ করা যায়নি।',
      );
    }
  };

  const toggleShare = async () => {
    if (!proUnlocked) return;
    const next = !shareEnabled;
    setShareEnabled(next);
    const doc = boardDoc();
    if (!doc || !boardId || !db) return;
    try {
      await saveQpgBoard(db, boardId, { ...doc, shareEnabled: next });
      setSaveState('সংরক্ষিত ✓');
    } catch {
      setShareEnabled(!next);
      setSaveState('শেয়ার বদলানো যায়নি।');
    }
  };

  const exportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas || !slide) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartboard-slide-${slideIndex + 1}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const exportPdf = async () => {
    if (!proUnlocked || slides.length === 0) return;
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
    for (let i = 0; i < slides.length; i += 1) {
      const off = document.createElement('canvas');
      off.width = BOARD_W * 2;
      off.height = BOARD_H * 2;
      renderSlide(off, slides[i], i + 1);
      const img = off.toDataURL('image/png');
      if (i > 0) pdf.addPage();
      pdf.addImage(img, 'PNG', 10, 10, 277, 156);
    }
    pdf.save(`${title || 'smartboard'}.pdf`);
  };

  const shareUrl = boardId ? `${window.location.origin}/smartboard/${boardId}` : '';

  const timerLabel = formatBoardTimer(timerSeconds);

  return (
    <PageShell titleBn="স্মার্টবোর্ড" titleEn="Smartboard" wide className="ev-qpg-theme">
      {isShareView ? (
        <>
          {loadError ? (
            <AlertBox tone="error">{loadError}</AlertBox>
          ) : !slide ? (
            <p style={{ fontSize: 13 }}>বোর্ড আনা হচ্ছে…</p>
          ) : (
            <ShareBoardView
              slide={slide}
              slideIndex={slideIndex}
              slideCount={slides.length}
              title={title}
              onPrev={() => setSlideIndex((i) => Math.max(0, i - 1))}
              onNext={() => setSlideIndex((i) => Math.min(slides.length - 1, i + 1))}
              onToggleAnswer={() => updateSlide(toggleBoardAnswer(slide))}
            />
          )}
          <p style={{ fontSize: 13, marginTop: 12 }}>
            <Link to="/question-paper-generator">প্রশ্নপত্র জেনারেটর</Link>
          </p>
        </>
      ) : (
        <>
          <AlertBox tone="info">
            পেপার স্লাইডে সাজিয়ে পড়ান — লিখুন, আঁকুন, উত্তর দেখান, টাইমার চালান। বোর্ড ব্যবহার ফ্রি; PDF
            এক্সপোর্ট ও শেয়ার লিংক Pro-তে।
          </AlertBox>
          {isGuest ? (
            <AlertBox tone="info">
              বোর্ড সংরক্ষণ করতে <Link to="/login">লগইন করুন</Link> — অতিথি হিসেবে শুধু দেখা ও আঁকা যায়,
              সংরক্ষণ করা যায় না।
            </AlertBox>
          ) : null}

          {/* My boards */}
          {myBoards.length > 0 ? (
            <Card style={{ marginBottom: 16 }}>
              <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>আমার বোর্ড</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {myBoards.map((b) => (
                  <Button key={b.id} variant={b.id === boardId ? 'primary' : 'outline'} onClick={() => openBoard(b)}>
                    {b.title} ({b.slides.length} স্লাইড)
                  </Button>
                ))}
              </div>
            </Card>
          ) : null}
          {myBoardsError ? <AlertBox tone="error">{myBoardsError}</AlertBox> : null}

          {!slide ? (
            <Card style={{ marginBottom: 16 }}>
              <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>বোর্ড শুরু করুন</h2>
              <p style={{ fontSize: 13, margin: '0 0 10px' }}>
                জেনারেটরে পেপার বানিয়ে "Smartboard-এ খুলুন" চাপুন — পেপারটি এখানে স্লাইডে সাজবে। অথবা নিচে
                খালি বোর্ড দিয়ে শুরু করুন।
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button
                  onClick={() => {
                    setPaper(null);
                    setSlides([blankBoardSlide(1)]);
                    setSlideIndex(0);
                    setBoardId(newBoardId());
                    setTitle('খালি বোর্ড');
                  }}
                >
                  খালি বোর্ড
                </Button>
                <Link to="/question-paper-generator">
                  <Button variant="outline">জেনারেটরে পেপার বানান</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <>
              {/* Title + layout */}
              <Card style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    aria-label="বোর্ডের শিরোনাম"
                    style={{ flex: '1 1 200px', padding: 8, boxSizing: 'border-box' }}
                  />
                  {QPG_BOARD_LAYOUTS.map((l) => (
                    <Button key={l.id} variant={layout === l.id ? 'primary' : 'outline'} onClick={() => changeLayout(l.id)}>
                      {l.nameBn}
                    </Button>
                  ))}
                  <Link to="/question-paper-generator">
                    <Button variant="outline">জেনারেটরে ফিরুন</Button>
                  </Link>
                </div>
              </Card>

              {/* Toolbar */}
              <Card style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {TOOLS.map((t) => (
                    <Button key={t.id} variant={tool === t.id ? 'primary' : 'outline'} onClick={() => setTool(t.id)}>
                      {t.label}
                    </Button>
                  ))}
                  {PEN_COLORS.map((c) => (
                    <button
                      key={c}
                      aria-label={`রং ${c}`}
                      onClick={() => setColor(c)}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid #111' : '1px solid #ccc',
                        cursor: 'pointer', padding: 0,
                      }}
                    />
                  ))}
                  <label style={{ fontSize: 13 }}>
                    মোটা
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={penWidth}
                      onChange={(e) => setPenWidth(Number(e.target.value))}
                      style={{ verticalAlign: 'middle', marginLeft: 4 }}
                    />
                  </label>
                  <Button variant="outline" onClick={undo} disabled={!slide.annotations.length}>
                    পূর্বাবস্থা
                  </Button>
                  <Button variant="outline" onClick={redo} disabled={(redoRef.current[slide.id] ?? []).length === 0}>
                    পুনরায়
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (window.confirm('এই স্লাইডের সব আঁকা/লেখা মুছে ফেলবেন?')) {
                        updateSlide(clearBoardAnnotations(slide));
                        scheduleSave();
                      }
                    }}
                  >
                    মুছে ফেলুন
                  </Button>
                </div>
              </Card>

              {/* Canvas + side controls */}
              <div ref={containerRef} style={{ background: '#fff', borderRadius: 12, padding: 12 }}>
                <div style={{ position: 'relative' }}>
                  <canvas
                    ref={canvasRef}
                    width={BOARD_W * 2}
                    height={BOARD_H * 2}
                    style={{
                      width: `${BOARD_W * zoom}px`,
                      maxWidth: '100%',
                      height: 'auto',
                      display: 'block',
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      touchAction: 'none',
                      cursor: tool === 'text' ? 'text' : 'crosshair',
                    }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={onPointerUp}
                  />
                  {textDraft ? (
                    <input
                      autoFocus
                      type="text"
                      value={textDraft.value}
                      onChange={(e) => setTextDraft({ ...textDraft, value: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitTextDraft();
                        if (e.key === 'Escape') setTextDraft(null);
                      }}
                      onBlur={commitTextDraft}
                      placeholder="লিখুন…"
                      style={{
                        position: 'absolute',
                        left: `${(textDraft.x / BOARD_W) * 100}%`,
                        top: `${(textDraft.y / BOARD_H) * 100}%`,
                        fontSize: 22,
                        padding: 4,
                        border: '1px solid #14532d',
                        borderRadius: 4,
                        background: '#fff',
                      }}
                    />
                  ) : null}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
                  <Button variant="outline" onClick={() => setSlideIndex((i) => Math.max(0, i - 1))} disabled={slideIndex === 0}>
                    ← আগের
                  </Button>
                  <span style={{ fontSize: 13 }}>
                    স্লাইড {slideIndex + 1} / {slides.length}
                  </span>
                  <Button variant="outline" onClick={() => setSlideIndex((i) => Math.min(slides.length - 1, i + 1))} disabled={slideIndex >= slides.length - 1}>
                    পরের →
                  </Button>
                  <Button variant={slide.showAnswer ? 'primary' : 'outline'} onClick={() => { updateSlide(toggleBoardAnswer(slide)); scheduleSave(); }}>
                    উত্তর দেখান
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (slides.length >= 120) return;
                      setSlides((prev) => [...prev, blankBoardSlide(prev.length + 1)]);
                      setSlideIndex(slides.length);
                    }}
                  >
                    + খালি স্লাইড
                  </Button>
                  <Button variant="outline" onClick={() => void containerRef.current?.requestFullscreen?.().catch(() => undefined)}>
                    পূর্ণ পর্দা (F)
                  </Button>
                  <label style={{ fontSize: 13 }}>
                    জুম
                    <select value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={{ marginLeft: 4, padding: 4 }}>
                      <option value={1}>১০০%</option>
                      <option value={1.25}>১২৫%</option>
                      <option value={1.5}>১৫০%</option>
                      <option value={2}>২০০%</option>
                    </select>
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
                  <label style={{ fontSize: 13 }}>
                    টাইমার
                    <select
                      value={timerMinutes}
                      onChange={(e) => {
                        const m = Number(e.target.value);
                        setTimerMinutes(m);
                        setTimerSeconds(boardTimerSeconds(m));
                        setTimerRunning(false);
                      }}
                      style={{ marginLeft: 4, padding: 4 }}
                    >
                      {QPG_BOARD_TIMER_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m} মিনিট
                        </option>
                      ))}
                    </select>
                  </label>
                  <strong style={{ fontSize: 20, color: timerSeconds <= 0 ? '#b00020' : '#14532d' }}>{timerLabel}</strong>
                  <Button variant="outline" onClick={() => setTimerRunning((r) => !r)} disabled={timerSeconds <= 0}>
                    {timerRunning ? 'থামান' : 'শুরু'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTimerSeconds(boardTimerSeconds(timerMinutes));
                      setTimerRunning(false);
                    }}
                  >
                    রিসেট
                  </Button>
                  {timerSeconds <= 0 ? <span style={{ fontSize: 13, color: '#b00020' }}>সময় শেষ!</span> : null}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
                  <Button onClick={() => void saveNow()} disabled={isGuest || !boardId}>
                    সংরক্ষণ করুন
                  </Button>
                  {saveState ? <span style={{ fontSize: 13, color: '#555' }}>{saveState}</span> : null}
                  <Button variant="outline" onClick={exportPng}>
                    PNG এক্সপোর্ট (ফ্রি)
                  </Button>
                  <Button variant="outline" onClick={() => void exportPdf()} disabled={!proUnlocked}>
                    PDF এক্সপোর্ট (Pro) {proUnlocked ? '' : '🔒'}
                  </Button>
                  <Button variant="outline" onClick={() => void toggleShare()} disabled={!proUnlocked || !boardId}>
                    {shareEnabled ? 'শেয়ার বন্ধ করুন' : 'শেয়ার লিংক চালু করুন (Pro)'} {proUnlocked ? '' : '🔒'}
                  </Button>
                  {shareEnabled && shareUrl ? (
                    <span style={{ fontSize: 13 }}>
                      <a href={shareUrl} target="_blank" rel="noreferrer">
                        {shareUrl}
                      </a>{' '}
                      <Button
                        variant="outline"
                        onClick={() => {
                          void navigator.clipboard?.writeText(shareUrl).catch(() => undefined);
                        }}
                      >
                        কপি
                      </Button>
                    </span>
                  ) : null}
                  {!proUnlocked ? (
                    <span style={{ fontSize: 12, color: '#666' }}>
                      PDF এক্সপোর্ট ও শেয়ার লিংক Pro-তে — <Link to="/pricing">মূল্য দেখুন</Link>
                    </span>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </PageShell>
  );
}

/** Read-only share view: slides + navigation + answer toggle only. */
function ShareBoardView(props: {
  slide: QpgBoardSlide;
  slideIndex: number;
  slideCount: number;
  title: string;
  onPrev: () => void;
  onNext: () => void;
  onToggleAnswer: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) renderSlide(canvas, props.slide, props.slideIndex + 1);
  }, [props.slide, props.slideIndex]);
  return (
    <Card style={{ marginBottom: 16 }}>
      <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>{props.title}</h2>
      <canvas
        ref={canvasRef}
        width={BOARD_W * 2}
        height={BOARD_H * 2}
        style={{ width: '100%', height: 'auto', display: 'block', border: '1px solid #ddd', borderRadius: 8, background: '#fff' }}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
        <Button variant="outline" onClick={props.onPrev} disabled={props.slideIndex === 0}>
          ← আগের
        </Button>
        <span style={{ fontSize: 13 }}>
          স্লাইড {props.slideIndex + 1} / {props.slideCount}
        </span>
        <Button variant="outline" onClick={props.onNext} disabled={props.slideIndex >= props.slideCount - 1}>
          পরের →
        </Button>
        <Button variant={props.slide.showAnswer ? 'primary' : 'outline'} onClick={props.onToggleAnswer}>
          উত্তর দেখান
        </Button>
      </div>
      <p style={{ fontSize: 12, color: '#666', margin: '10px 0 0' }}>
        শেয়ার করা বোর্ড — শুধু দেখা যায়, আঁকা বা বদলানো যায় না।
      </p>
    </Card>
  );
}
