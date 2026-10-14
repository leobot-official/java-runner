import React, { useState } from 'react';
import {
  INITIAL_EXERCISES,
  INITIAL_FACULTY,
  INITIAL_STUDENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_VIOLATIONS,
} from './data/mockData';
import {
  Exercise,
  FacultyRecord,
  StudentRecord,
  Submission,
  SystemSettings,
  User,
  Violation,
} from './types';
import { Header } from './components/Header';
import { FacultyDashboard } from './components/FacultyPortal/FacultyDashboard';
import { StudentDashboard } from './components/StudentPortal/StudentDashboard';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

function detectPortalFromUrl(): 'faculty' | 'student' {
  if (typeof window === 'undefined') return 'student';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();

  if (path.includes('/faculty') || hash.includes('faculty') || search.includes('faculty')) {
    return 'faculty';
  }
  if (path.includes('/student') || hash.includes('student') || search.includes('student')) {
    return 'student';
  }
  return 'student';
}

export default function App() {
  const initialPortal = detectPortalFromUrl();

  // Navigation & User State
  const [currentTab, setCurrentTab] = useState<'faculty' | 'student'>(initialPortal);
  const [currentUser, setCurrentUser] = useState<User>(() => {
    if (initialPortal === 'faculty') {
      return {
        role: 'FACULTY',
        email: INITIAL_FACULTY[0]?.email || 'faculty@university.edu',
        name: INITIAL_FACULTY[0]?.name || 'Prof. Sathish',
      };
    }
    return {
      role: 'STUDENT',
      email: 'student@university.edu',
      name: 'Student Candidate',
      regNo: '21BCE0001',
    };
  });

  // Listen to hash / URL changes
  React.useEffect(() => {
    const handleUrlChange = () => {
      const portal = detectPortalFromUrl();
      setCurrentTab(portal);
      if (portal === 'student' && currentUser.role === 'FACULTY') {
        // keep role as is or allow student preview
      }
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [currentUser.role]);

  const handleSelectTab = (tab: 'faculty' | 'student') => {
    setCurrentTab(tab);
    window.location.hash = '#/' + tab;
    if (tab === 'faculty' && currentUser.role !== 'FACULTY') {
      setCurrentUser({
        role: 'FACULTY',
        email: INITIAL_FACULTY[0]?.email || 'faculty@university.edu',
        name: INITIAL_FACULTY[0]?.name || 'Prof. Sathish',
      });
    }
  };

  // Database Data States
  const [exercises, setExercises] = useState<Exercise[]>(INITIAL_EXERCISES);
  const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_SUBMISSIONS);
  const [violations, setViolations] = useState<Violation[]>(INITIAL_VIOLATIONS);
  const [students, setStudents] = useState<StudentRecord[]>(INITIAL_STUDENTS);
  const [faculty, setFaculty] = useState<FacultyRecord[]>(INITIAL_FACULTY);

  // System & Execution Settings
  const [settings, setSettings] = useState<SystemSettings>({
    renderServiceUrl: 'https://YOUR-RENDER-APP-NAME.onrender.com/execute',
    apiSecret: 'MY_SECURE_LAB_KEY_123',
    googleSheetsUrl: '',
    enforceFullscreen: true,
    blockCopyPaste: true,
    trackTabSwitches: true,
    useBuiltinRunner: true, // Default to built-in browser sandbox for instant zero-config evaluation
  });

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warn' } | null>(null);

  const showToast = (text: string, type: 'success' | 'warn' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Faculty: Save / Schedule new exercise
  const handleSaveExercise = (newEx: Exercise) => {
    setExercises((prev) => {
      const idx = prev.findIndex((e) => e.id === newEx.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = newEx;
        return copy;
      }
      return [newEx, ...prev];
    });
    showToast(`Exercise "${newEx.title}" (${newEx.id}) scheduled and appended to Exercises sheet!`);
  };

  // Faculty: Add student to roster
  const handleAddStudent = (newStu: StudentRecord) => {
    setStudents((prev) => [newStu, ...prev]);
    showToast(`Student ${newStu.name} (${newStu.regNo}) enrolled in Students sheet!`);
  };

  // Student: Submit code
  const handleSubmitCode = (submission: Submission, sessionViolations: Violation[]) => {
    setSubmissions((prev) => [submission, ...prev]);

    // Batch log any new session violations to database
    if (sessionViolations.length > 0) {
      setViolations((prev) => [...sessionViolations, ...prev]);
    }

    // Increment student stats
    setStudents((prev) =>
      prev.map((s) => {
        if (s.regNo === submission.regNo) {
          return {
            ...s,
            submissionsCount: (s.submissionsCount || 0) + 1,
            violationsCount: (s.violationsCount || 0) + sessionViolations.length,
          };
        }
        return s;
      })
    );

    showToast(
      `Submission recorded! Status: ${submission.status} (${submission.score}/100). Synced to Submissions sheet.`,
      submission.score === 100 ? 'success' : 'warn'
    );
  };

  // Handle Login & Auto-Route
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'FACULTY') {
      setCurrentTab('faculty');
      showToast(`Logged in as Faculty Admin: ${user.name}`);
    } else {
      setCurrentTab('student');
      showToast(`Logged in as Student: ${user.name} (${user.regNo})`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-600 selection:text-white">
      {/* Top Header with Portal Switcher */}
      <Header
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        currentUser={currentUser}
        onOpenLogin={() => setIsAuthOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        settings={settings}
        activeViolationsCount={violations.filter((v) => v.severity === 'high').length}
      />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950 border-emerald-700 text-emerald-200'
                : 'bg-amber-950 border-amber-700 text-amber-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'faculty' && (
          <FacultyDashboard
            currentUser={currentUser}
            exercises={exercises}
            submissions={submissions}
            violations={violations}
            students={students}
            onSaveExercise={handleSaveExercise}
            onAddStudent={handleAddStudent}
          />
        )}

        {currentTab === 'student' && (
          <StudentDashboard
            currentUser={currentUser}
            exercises={exercises}
            submissions={submissions}
            students={students}
            onSubmitCode={handleSubmitCode}
            settings={settings}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>JavaLab Pro • Automated Grading, Docker Sandbox & Anti-Cheating System</div>
          <div className="flex items-center gap-4 text-[11px] text-slate-600">
            <span>Eclipse Temurin OpenJDK 17</span>
            <span>•</span>
            <span>Google Apps Script SPA Architecture</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        facultyList={faculty}
        studentsList={students}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />
    </div>
  );
}
