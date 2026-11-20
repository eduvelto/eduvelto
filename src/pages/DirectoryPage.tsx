// Eduvelto — education directory (Phase 2, Step 2 + Step 3).
//
// Browse the cascade type → board → program → class → subject, reading
// only Published educationDirectory rows (one-time read). Each select
// narrows the next; the result list is 20 rows per page. Drafts are
// invisible by the rules.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { listPublishedDirectory, type DirectoryRow } from '../lib/content';

const PAGE_SIZE = 20;

const selectStyle: React.CSSProperties = {
  padding: '8px 10px',
  minHeight: 44,
  fontSize: 15,
  border: '1px solid #999',
  borderRadius: 6,
  fontFamily: 'inherit',
  background: '#fff',
};

export default function DirectoryPage() {
  const [rows, setRows] = useState<DirectoryRow[] | null>(null);
  const [error, setError] = useState('');
  const [type, setType] = useState('');
  const [board, setBoard] = useState('');
  const [program, setProgram] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [dept, setDept] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let live = true;
    listPublishedDirectory()
      .then((r) => {
        if (live) setRows(r);
      })
      .catch(() => {
        if (live) setError('নির্দেশিকা লোড করা যায়নি — আবার চেষ্টা করুন। / Could not load the directory — please try again.');
      });
    return () => {
      live = false;
    };
  }, []);

  const all = rows ?? [];
  const types = useMemo(() => [...new Set(all.map((r) => r.type).filter(Boolean))].sort(), [all]);
  const boards = useMemo(
    () => [...new Set(all.filter((r) => !type || r.type === type).map((r) => r.board).filter(Boolean))].sort(),
    [all, type],
  );
  const programs = useMemo(
    () =>
      [...new Set(all.filter((r) => (!type || r.type === type) && (!board || r.board === board)).map((r) => r.program).filter(Boolean))].sort(),
    [all, type, board],
  );
  const classes = useMemo(
    () =>
      [...new Set(all.filter((r) => (!type || r.type === type) && (!board || r.board === board) && (!program || r.program === program)).map((r) => r.classLevel).filter(Boolean))].sort(),
    [all, type, board, program],
  );
  const departments = useMemo(
    () =>
      [...new Set(all.filter((r) => (!type || r.type === type) && (!board || r.board === board) && (!program || r.program === program) && (!classLevel || r.classLevel === classLevel)).map((r) => r.department).filter(Boolean))].sort(),
    [all, type, board, program, classLevel],
  );

  const filtered = useMemo(
    () =>
      all.filter(
        (r) =>
          (!type || r.type === type) &&
          (!board || r.board === board) &&
          (!program || r.program === program) &&
          (!classLevel || r.classLevel === classLevel) &&
          (!dept || r.department === dept),
      ),
    [all, type, board, program, classLevel, dept],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function resetPage() {
    setPage(1);
  }

  return (
    <PageShell titleBn="শিক্ষা নির্দেশিকা" titleEn="Education Directory">
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {rows === null && !error ? <p>লোড হচ্ছে… / Loading…</p> : null}
      {rows !== null && rows.length === 0 ? (
        <EmptyState bn="এখনো কোনো তথ্য নেই। কনটেন্ট প্রকাশিত হলে এখানে দেখা যাবে।" en="No data yet. Content will appear here once it is published." />
      ) : null}
      {rows !== null && rows.length > 0 ? (
        <>
          <p style={{ color: '#555', margin: '0 0 12px' }}>
            ধাপে ধাপে বাছুন: ধারা → বোর্ড → প্রোগ্রাম → শ্রেণি → বিষয় / Pick step by step: type →
            board → program → class → subject.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setBoard('');
                setProgram('');
                setClassLevel('');
                setDept('');
                resetPage();
              }}
              aria-label="শিক্ষার ধারা / Education type"
              style={selectStyle}
            >
              <option value="">সব ধারা / All types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={board}
              onChange={(e) => {
                setBoard(e.target.value);
                setProgram('');
                setClassLevel('');
                setDept('');
                resetPage();
              }}
              aria-label="বোর্ড / Board"
              style={selectStyle}
            >
              <option value="">সব বোর্ড / All boards</option>
              {boards.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select
              value={program}
              onChange={(e) => {
                setProgram(e.target.value);
                setClassLevel('');
                setDept('');
                resetPage();
              }}
              aria-label="প্রোগ্রাম / Program"
              style={selectStyle}
            >
              <option value="">সব প্রোগ্রাম / All programs</option>
              {programs.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              value={classLevel}
              onChange={(e) => {
                setClassLevel(e.target.value);
                setDept('');
                resetPage();
              }}
              aria-label="শ্রেণি / Class"
              style={selectStyle}
            >
              <option value="">সব শ্রেণি / All classes</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={dept}
              onChange={(e) => {
                setDept(e.target.value);
                resetPage();
              }}
              aria-label="বিষয় / Subject"
              style={selectStyle}
            >
              <option value="">সব বিষয় / All subjects</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <p style={{ color: '#555', margin: '0 0 12px' }}>
            {filtered.length}টি এন্ট্রি / {filtered.length} entries
          </p>
          {filtered.length === 0 ? (
            <p>এই বাছাইয়ে কিছু পাওয়া যায়নি — উপরের ধাপ বদলে আবার চেষ্টা করুন। / Nothing matches — try different steps above.</p>
          ) : null}
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {pageRows.map((r) => (
              <li key={r.id} style={{ marginBottom: 10, lineHeight: 1.5 }}>
                <Link to={`/library/${r.bookId}`}>{r.paperTitle}</Link>
                <span style={{ color: '#555', fontSize: 13 }}>
                  {' '}· {r.type} · {r.program} · {r.classLevel} · {r.department} · কোড {r.paperCode}
                </span>
              </li>
            ))}
          </ul>
          {pageCount > 1 ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                style={{ padding: '10px 16px', minHeight: 44, borderRadius: 6, border: '1px solid #0A1F44', background: '#fff', color: '#0A1F44', cursor: 'pointer' }}
              >
                ← আগের / Previous
              </button>
              <span>
                পাতা {safePage} / {pageCount} / Page {safePage} of {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={safePage >= pageCount}
                style={{ padding: '10px 16px', minHeight: 44, borderRadius: 6, border: '1px solid #0A1F44', background: '#fff', color: '#0A1F44', cursor: 'pointer' }}
              >
                পরের / Next →
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </PageShell>
  );
}
