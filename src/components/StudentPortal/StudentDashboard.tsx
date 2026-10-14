import React, { useState, useMemo } from 'react';
import { Exercise, StudentRecord, Submission, SystemSettings, User, Violation } from '../../types';
import { StudentIDE } from './StudentIDE';
import { StudentLeaderboard } from './StudentLeaderboard';
import {
  Terminal,
  Trophy,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  Zap,
  BookOpen,
} from 'lucide-react';

interface StudentDashboardProps {
  currentUser: User;
  exercises: Exercise[];
  submissions: Submission[];
  students: StudentRecord[];
  onSubmitCode: (submission: Submission, localViolations: Violation[]) => void;
  settings: SystemSettings;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  exercises,
  submissions,
  students,
  onSubmitCode,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<'ide' | 'leaderboard'>('ide');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  // Calculate current student's statistics
  const currentStudentStats = useMemo(() => {
    const reg = (currentUser.regNo || '').trim().toUpperCase();
    const studentSubs = submissions.filter(
      (s) => s.regNo.trim().toUpperCase() === reg || s.studentEmail.toLowerCase() === currentUser.email.toLowerCase()
    );

    const bestScores = new Map<string, number>();
    studentSubs.forEach((sub) => {
      const cur = bestScores.get(sub.exerciseId) || 0;
      if (sub.score > cur) bestScores.set(sub.exerciseId, sub.score);
    });

    let totalScore = 0;
    let completedCount = 0;
    bestScores.forEach((score) => {
      totalScore += score;
      if (score === 100) completedCount++;
    });

    // Determine rank
    const studentTotals = new Map<string, number>();
    submissions.forEach((sub) => {
      const sReg = sub.regNo.trim().toUpperCase();
      const existingBest = studentTotals.get(sReg + '_' + sub.exerciseId) || 0;
      if (sub.score > existingBest) {
        studentTotals.set(sReg + '_' + sub.exerciseId, sub.score);
      }
    });

    const studentAggregate = new Map<string, number>();
    students.forEach((s) => {
      const sReg = s.regNo.trim().toUpperCase();
      let sum = 0;
      exercises.forEach((ex) => {
        sum += studentTotals.get(sReg + '_' + ex.id) || 0;
      });
      studentAggregate.set(sReg, sum);
    });

    // Sort to find rank
    const sorted = Array.from(studentAggregate.entries()).sort((a, b) => b[1] - a[1]);
    const rankIndex = sorted.findIndex(([r]) => r === reg);
    const rank = rankIndex !== -1 ? rankIndex + 1 : sorted.length + 1;

    return {
      totalScore,
      completedCount,
      totalExercises: exercises.length,
      rank,
      submissionsCount: studentSubs.length,
    };
  }, [currentUser, submissions, exercises, students]);

  const handleSelectExerciseFromLeaderboard = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    setActiveTab('ide');
  };

  return (
    <div className="space-y-6">
      {/* Student Overview Strip */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-900/40 p-5 rounded-2xl shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Student Portal
              </span>
              <span className="text-xs text-slate-400">
                ID: {currentUser.regNo || '21BCE0001'} • {currentUser.email}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Welcome, {currentUser.name}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Solve Java lab exercises, test your code against sandbox test cases, and climb the class leaderboard.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setActiveTab('leaderboard')}
              className="bg-slate-900/90 border border-amber-500/40 px-3.5 py-2 rounded-xl text-center cursor-pointer hover:bg-slate-800 transition shadow-sm"
              title="Click to view full Leaderboard"
            >
              <div className="text-[10px] text-amber-300 font-bold uppercase flex items-center justify-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" /> Current Rank
              </div>
              <div className="text-lg font-black text-amber-300">#{currentStudentStats.rank}</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Total Score</div>
              <div className="text-lg font-black text-emerald-400">{currentStudentStats.totalScore} pts</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Completed</div>
              <div className="text-lg font-black text-white">
                {currentStudentStats.completedCount}/{currentStudentStats.totalExercises}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher: Lab IDE vs Leaderboard */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ide')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'ide'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Lab IDE & Examination Mode</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'leaderboard'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>Class Leaderboard & Rankings</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-[10px] text-amber-300 font-bold">
              Rank #{currentStudentStats.rank}
            </span>
          </button>
        </div>

        {activeTab === 'ide' && (
          <button
            onClick={() => setActiveTab('leaderboard')}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition hidden sm:flex"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>View Full Leaderboard &rarr;</span>
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'ide' && (
          <StudentIDE
            currentUser={currentUser}
            exercises={exercises}
            onSubmitCode={onSubmitCode}
            settings={settings}
            preselectedExerciseId={selectedExerciseId}
            onOpenLeaderboard={() => setActiveTab('leaderboard')}
            studentRank={currentStudentStats.rank}
          />
        )}

        {activeTab === 'leaderboard' && (
          <StudentLeaderboard
            students={students}
            submissions={submissions}
            exercises={exercises}
            currentUser={currentUser}
            onSelectExercise={handleSelectExerciseFromLeaderboard}
          />
        )}
      </div>
    </div>
  );
};
