import { Link, Route, Routes } from 'react-router-dom';
import { strings } from './i18n/strings';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import TeacherRegisterPage from './pages/TeacherRegisterPage';
import DirectoryPage from './pages/DirectoryPage';
import SubjectPage from './pages/SubjectPage';
import LibraryPage from './pages/LibraryPage';
import BookPage from './pages/BookPage';
import ChapterPage from './pages/ChapterPage';
import LessonPage from './pages/LessonPage';
import QuizPage from './pages/QuizPage';
import QuizResultPage from './pages/QuizResultPage';
import AdminPage from './pages/AdminPage';
import AiTeacherPage from './pages/AiTeacherPage';
import ExamPage from './pages/ExamPage';
import RoutinePage from './pages/RoutinePage';
import ProgressPage from './pages/ProgressPage';
import SocialPage from './pages/SocialPage';

// Routes mirror page-map.md + the Phase 2 route list.
// /social is a DESIGN PROPOSAL only (blueprint §7): no live social
// features, no messaging, until safety + moderation are ready.
// /ai-teacher is a scripted demonstration, not live AI (blueprint §5).
export default function App() {
  const nav = strings.nav;
  return (
    <div>
      <header
        style={{
          background: '#0b5e3f',
          color: '#fff',
          padding: '12px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <Link to="/" style={{ color: '#f5c542', fontWeight: 700, textDecoration: 'none', fontSize: 20 }}>
          EduOrbit
        </Link>
        <span style={{ fontSize: 14 }}>{strings.tagline.bn}</span>
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginLeft: 'auto' }}>
          <Link to="/directory" style={{ color: '#fff' }}>{nav.directory.bn}</Link>
          <Link to="/library" style={{ color: '#fff' }}>{nav.library.bn}</Link>
          <Link to="/exam" style={{ color: '#fff' }}>{nav.exam.bn}</Link>
          <Link to="/routine" style={{ color: '#fff' }}>{nav.routine.bn}</Link>
          <Link to="/progress" style={{ color: '#fff' }}>{nav.progress.bn}</Link>
          <Link to="/login" style={{ color: '#fff' }}>{nav.login.bn}</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/teacher/register" element={<TeacherRegisterPage />} />
        <Route path="/directory" element={<DirectoryPage />} />
        <Route path="/subjects/:subjectId" element={<SubjectPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/library/:bookId" element={<BookPage />} />
        <Route path="/books/:bookId/chapters/:chapterId" element={<ChapterPage />} />
        <Route path="/lessons/:lessonId" element={<LessonPage />} />
        <Route path="/quiz/:quizId" element={<QuizPage />} />
        <Route path="/quiz/:quizId/result/:attemptId" element={<QuizResultPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/ai-teacher" element={<AiTeacherPage />} />
        <Route path="/exam" element={<ExamPage />} />
        <Route path="/routine" element={<RoutinePage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/social" element={<SocialPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </div>
  );
}
