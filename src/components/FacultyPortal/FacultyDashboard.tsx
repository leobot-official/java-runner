import React, { useState } from 'react';
import { Exercise, Submission, Violation, StudentRecord, User } from '../../types';
import { ExerciseManager } from './ExerciseManager';
import { AntiCheatingCenter } from './AntiCheatingCenter';
import { SubmissionsHub } from './SubmissionsHub';
import { StudentRoster } from './StudentRoster';
import {
  Calendar,
  ShieldAlert,
  FileCheck2,
  Users,
  LayoutDashboard,
  CheckCircle,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

interface FacultyDashboardProps {
  currentUser: User;
  exercises: Exercise[];
  submissions: Submission[];
  violations: Violation[];
  students: StudentRecord[];
  onSaveExercise: (exercise: Exercise) => void;
  onAddStudent: (student: StudentRecord) => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  currentUser,
  exercises,
  submissions,
  violations,
  students,
  onSaveExercise,
  onAddStudent,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'exercises' | 'submissions' | 'violations' | 'roster'>('exercises');

  // Stats calculation
  const passedCount = submissions.filter((s) => s.status === 'ALL TEST CASES PASSED').length;
  const passRate = submissions.length > 0 ? Math.round((passedCount / submissions.length) * 100) : 0;
  const highRiskViolations = violations.filter((v) => v.severity === 'high').length;
  const [copiedStudentLink, setCopiedStudentLink] = useState(false);

  const copyStudentUrl = () => {
    const origin = window.location.origin;
    const path = window.location.pathname.replace(/\/faculty\/?$/, '');
    const studentUrl = `${origin}${path}#/student`;
    navigator.clipboard.writeText(studentUrl);
    setCopiedStudentLink(true);
    setTimeout(() => setCopiedStudentLink(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Faculty Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-900/40 p-6 rounded-2xl shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Welcome, {currentUser.name}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Schedule lab assessments, monitor live anti-cheating signals, and audit student Java code executions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={copyStudentUrl}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-2 transition shadow-sm"
              title="Copy the direct Student Exam URL to share with your students"
            >
              <span>{copiedStudentLink ? 'Copied Student Link!' : 'Copy Student Exam URL'}</span>
            </button>

            <div className="bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl text-right">
              <div className="text-[11px] text-slate-400">Class Pass Rate</div>
              <div className="text-lg font-black text-emerald-400">{passRate}%</div>
            </div>
          </div>
        </div>

        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div
            onClick={() => setActiveSubTab('exercises')}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              activeSubTab === 'exercises'
                ? 'bg-indigo-600/15 border-indigo-500/60'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
              <span>Scheduled Labs</span>
              <Calendar className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white">{exercises.length}</div>
            <div className="text-[10px] text-indigo-300 font-medium mt-0.5">Manage & Schedule &rarr;</div>
          </div>

          <div
            onClick={() => setActiveSubTab('submissions')}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              activeSubTab === 'submissions'
                ? 'bg-emerald-600/15 border-emerald-500/60'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
              <span>Submissions</span>
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">{submissions.length}</div>
            <div className="text-[10px] text-emerald-300 font-medium mt-0.5">Audit Code & Logs &rarr;</div>
          </div>

          <div
            onClick={() => setActiveSubTab('violations')}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              activeSubTab === 'violations'
                ? 'bg-rose-600/15 border-rose-500/60'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
              <span>Cheating Flags</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400">{violations.length}</div>
            <div className="text-[10px] text-rose-300 font-medium mt-0.5">
              {highRiskViolations > 0 ? `${highRiskViolations} High Severity` : 'Review Incidents &rarr;'}
            </div>
          </div>

          <div
            onClick={() => setActiveSubTab('roster')}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              activeSubTab === 'roster'
                ? 'bg-amber-600/15 border-amber-500/60'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
              <span>Enrolled Students</span>
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">{students.length}</div>
            <div className="text-[10px] text-amber-300 font-medium mt-0.5">Registration Roster &rarr;</div>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('exercises')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'exercises'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Exercises & Test Cases ({exercises.length})
        </button>

        <button
          onClick={() => setActiveSubTab('submissions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'submissions'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          Submissions Hub ({submissions.length})
        </button>

        <button
          onClick={() => setActiveSubTab('violations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'violations'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Anti-Cheating Monitor ({violations.length})
        </button>

        <button
          onClick={() => setActiveSubTab('roster')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'roster'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Student Roster ({students.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeSubTab === 'exercises' && (
          <ExerciseManager exercises={exercises} onSaveExercise={onSaveExercise} />
        )}
        {activeSubTab === 'submissions' && (
          <SubmissionsHub submissions={submissions} exercises={exercises} />
        )}
        {activeSubTab === 'violations' && (
          <AntiCheatingCenter violations={violations} />
        )}
        {activeSubTab === 'roster' && (
          <StudentRoster students={students} onAddStudent={onAddStudent} />
        )}
      </div>
    </div>
  );
};
