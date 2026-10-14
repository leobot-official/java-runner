import React, { useState, useMemo } from 'react';
import { Exercise, StudentRecord, Submission, User } from '../../types';
import {
  Trophy,
  Medal,
  Award,
  Star,
  Search,
  Filter,
  CheckCircle2,
  TrendingUp,
  Flame,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  User as UserIcon,
  BookOpen,
  Sparkles,
  Zap,
} from 'lucide-react';

export interface RankedStudent {
  rank: number;
  regNo: string;
  name: string;
  email: string;
  department: string;
  totalScore: number;
  completedExercisesCount: number; // completed with 100% score
  attemptedExercisesCount: number; // attempted with any score
  totalSubmissions: number;
  violationsCount: number;
  solvedExercises: {
    exerciseId: string;
    exerciseTitle: string;
    score: number;
    status: string;
  }[];
  isCurrentUser: boolean;
}

interface StudentLeaderboardProps {
  students: StudentRecord[];
  submissions: Submission[];
  exercises: Exercise[];
  currentUser: User;
  onSelectExercise?: (exerciseId: string) => void;
}

export const StudentLeaderboard: React.FC<StudentLeaderboardProps> = ({
  students,
  submissions,
  exercises,
  currentUser,
  onSelectExercise,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<RankedStudent | null>(null);

  // Derive unique departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set);
  }, [students]);

  // Compute rankings
  const rankedStudents: RankedStudent[] = useMemo(() => {
    // Map exercise titles
    const exMap = new Map<string, string>();
    exercises.forEach((ex) => exMap.set(ex.id, ex.title));

    // Group submissions by student registration number
    const subByStudent = new Map<string, Submission[]>();
    submissions.forEach((sub) => {
      const reg = sub.regNo.trim().toUpperCase();
      const existing = subByStudent.get(reg) || [];
      existing.push(sub);
      subByStudent.set(reg, existing);
    });

    const list: RankedStudent[] = students.map((stu) => {
      const reg = stu.regNo.trim().toUpperCase();
      const studentSubs = subByStudent.get(reg) || [];

      // Calculate best score per unique exercise
      const bestScorePerEx = new Map<string, { score: number; status: string }>();
      studentSubs.forEach((sub) => {
        const cur = bestScorePerEx.get(sub.exerciseId);
        if (!cur || sub.score > cur.score) {
          bestScorePerEx.set(sub.exerciseId, {
            score: sub.score,
            status: sub.status,
          });
        }
      });

      let totalScore = 0;
      let completedCount = 0;
      const solvedList: RankedStudent['solvedExercises'] = [];

      bestScorePerEx.forEach((val, exId) => {
        totalScore += val.score;
        if (val.score === 100) {
          completedCount++;
        }
        solvedList.push({
          exerciseId: exId,
          exerciseTitle: exMap.get(exId) || exId,
          score: val.score,
          status: val.status,
        });
      });

      const isCurrent =
        currentUser.role === 'STUDENT' &&
        (currentUser.regNo?.toUpperCase() === reg ||
          currentUser.email.toLowerCase() === stu.email.toLowerCase());

      return {
        rank: 0,
        regNo: stu.regNo,
        name: stu.name,
        email: stu.email,
        department: stu.department || 'Computer Science',
        totalScore,
        completedExercisesCount: completedCount,
        attemptedExercisesCount: bestScorePerEx.size,
        totalSubmissions: studentSubs.length || (stu.submissionsCount || 0),
        violationsCount: stu.violationsCount || 0,
        solvedExercises: solvedList,
        isCurrentUser: isCurrent,
      };
    });

    // Sort: 1st by totalScore desc, 2nd by completedExercisesCount desc, 3rd by fewest violations, 4th by name
    list.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.completedExercisesCount !== a.completedExercisesCount)
        return b.completedExercisesCount - a.completedExercisesCount;
      if (a.violationsCount !== b.violationsCount)
        return a.violationsCount - b.violationsCount;
      return a.name.localeCompare(b.name);
    });

    // Assign rank positions (accounting for ties if scores match)
    return list.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [students, submissions, exercises, currentUser]);

  // Find current student's standing
  const currentStudentRank = useMemo(() => {
    return rankedStudents.find((s) => s.isCurrentUser) || null;
  }, [rankedStudents]);

  // Filtered list
  const filteredStudents = useMemo(() => {
    return rankedStudents.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept =
        departmentFilter === 'ALL' || s.department === departmentFilter;
      return matchSearch && matchDept;
    });
  }, [rankedStudents, searchTerm, departmentFilter]);

  const top3 = rankedStudents.slice(0, 3);
  const maxPossibleScore = exercises.length * 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950/50 border border-amber-900/30 p-6 rounded-2xl shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Lab Leaderboard & Rankings
              </span>
              <span className="text-xs text-slate-400">
                Live evaluation points across {exercises.length} exercises
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Hall of Fame & Scoreboard
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Rankings update automatically with every submitted test pass. Solved problems grant up to 100 points each.
            </p>
          </div>

          {/* Current User Quick Ranking Card if Student */}
          {currentStudentRank && (
            <div className="bg-slate-900/90 border border-amber-500/40 p-3.5 rounded-xl shadow-lg flex items-center gap-4 shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex flex-col items-center justify-center text-white shadow-md shadow-orange-500/20">
                <span className="text-[10px] font-bold uppercase leading-none text-amber-100">Rank</span>
                <span className="text-lg font-black leading-none mt-0.5">#{currentStudentRank.rank}</span>
              </div>
              <div>
                <div className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Your Standing
                </div>
                <div className="text-sm font-bold text-white">{currentStudentRank.name}</div>
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                  <span className="text-emerald-400 font-semibold">{currentStudentRank.totalScore} pts</span>
                  <span>•</span>
                  <span>{currentStudentRank.completedExercisesCount}/{exercises.length} Solved</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* #2 Silver (Left on desktop) */}
          {top3[1] && (
            <div
              onClick={() => setSelectedStudentForDetails(top3[1])}
              className="bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 hover:border-slate-500 p-5 rounded-2xl transition cursor-pointer relative overflow-hidden group flex flex-col justify-between order-2 md:order-1"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-400/5 rounded-full blur-2xl pointer-events-none"></div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-300/15 border border-slate-300/30 text-slate-300 flex items-center justify-center font-black text-base shadow-sm">
                    🥈 2nd
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Silver Medalist
                  </span>
                </div>
                <h3 className="font-bold text-base text-white group-hover:text-amber-300 transition flex items-center gap-1.5">
                  {top3[1].name}
                  {top3[1].isCurrentUser && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">You</span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 font-mono">{top3[1].regNo} • {top3[1].department}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">Total Points</span>
                  <span className="text-base font-extrabold text-slate-200">{top3[1].totalScore} pts</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Exercises Solved</span>
                  <span className="text-base font-extrabold text-emerald-400">
                    {top3[1].completedExercisesCount} / {exercises.length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* #1 Gold Champion (Center on desktop) */}
          {top3[0] && (
            <div
              onClick={() => setSelectedStudentForDetails(top3[0])}
              className="bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/60 hover:border-amber-400 p-5 rounded-2xl transition cursor-pointer relative overflow-hidden group shadow-xl shadow-amber-500/10 flex flex-col justify-between order-1 md:order-2 md:-translate-y-2"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-black text-lg shadow-md shadow-amber-500/30">
                    👑 1st
                  </div>
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> Class Leader
                  </span>
                </div>
                <h3 className="font-extrabold text-lg text-white group-hover:text-amber-300 transition flex items-center gap-2">
                  {top3[0].name}
                  {top3[0].isCurrentUser && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 font-bold">You</span>
                  )}
                </h3>
                <p className="text-xs text-amber-200/80 font-mono">{top3[0].regNo} • {top3[0].department}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-amber-500/20 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-amber-300/70 text-[11px] block">Champion Points</span>
                  <span className="text-xl font-black text-amber-300">{top3[0].totalScore} pts</span>
                </div>
                <div>
                  <span className="text-amber-300/70 text-[11px] block">Exercises Solved</span>
                  <span className="text-xl font-black text-emerald-400">
                    {top3[0].completedExercisesCount} / {exercises.length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* #3 Bronze (Right on desktop) */}
          {top3[2] && (
            <div
              onClick={() => setSelectedStudentForDetails(top3[2])}
              className="bg-slate-900/80 hover:bg-slate-900 border border-amber-900/40 hover:border-amber-700/60 p-5 rounded-2xl transition cursor-pointer relative overflow-hidden group flex flex-col justify-between order-3"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-700/5 rounded-full blur-2xl pointer-events-none"></div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-700/20 border border-amber-700/30 text-amber-400 flex items-center justify-center font-black text-base shadow-sm">
                    🥉 3rd
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400/90 border border-amber-800/40">
                    Bronze Medalist
                  </span>
                </div>
                <h3 className="font-bold text-base text-white group-hover:text-amber-300 transition flex items-center gap-1.5">
                  {top3[2].name}
                  {top3[2].isCurrentUser && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">You</span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 font-mono">{top3[2].regNo} • {top3[2].department}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">Total Points</span>
                  <span className="text-base font-extrabold text-amber-300/90">{top3[2].totalScore} pts</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Exercises Solved</span>
                  <span className="text-base font-extrabold text-emerald-400">
                    {top3[2].completedExercisesCount} / {exercises.length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search students by name, registration number, or email..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-400 pl-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Dept:</span>
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 text-center w-16">Rank</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4 text-center">Solved Labs</th>
                <th className="py-3.5 px-4 text-center">Score Progress</th>
                <th className="py-3.5 px-4 text-center">Total Points</th>
                <th className="py-3.5 px-4 text-center">Proctoring Status</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No students found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const percentOfMax = maxPossibleScore > 0 ? Math.round((s.totalScore / maxPossibleScore) * 100) : 0;
                  return (
                    <tr
                      key={s.regNo}
                      className={`hover:bg-slate-800/40 transition ${
                        s.isCurrentUser ? 'bg-amber-500/10 hover:bg-amber-500/15' : ''
                      }`}
                    >
                      {/* Rank Icon / Number */}
                      <td className="py-3.5 px-4 text-center">
                        {s.rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-black text-sm border border-amber-500/30">
                            🥇
                          </span>
                        ) : s.rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-300/15 text-slate-200 font-black text-sm border border-slate-300/30">
                            🥈
                          </span>
                        ) : s.rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-700/20 text-amber-400 font-black text-sm border border-amber-700/30">
                            🥉
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-slate-400 text-xs">
                            #{s.rank}
                          </span>
                        )}
                      </td>

                      {/* Student info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            {s.name}
                            {s.isCurrentUser && (
                              <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                                You
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-indigo-400">{s.regNo}</div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 text-slate-300">{s.department}</td>

                      {/* Completed / Solved Labs */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 font-bold text-slate-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            {s.completedExercisesCount}{' '}
                            <span className="text-slate-500 font-normal">/ {exercises.length}</span>
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">{s.totalSubmissions} submissions</div>
                      </td>

                      {/* Score Progress Bar */}
                      <td className="py-3.5 px-4 text-center w-40">
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              percentOfMax >= 80
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : percentOfMax >= 40
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                : 'bg-gradient-to-r from-indigo-500 to-purple-400'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, percentOfMax))}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                          {percentOfMax}% completed
                        </span>
                      </td>

                      {/* Total Points */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-sm font-black text-amber-400 font-mono">
                          {s.totalScore}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block">pts</span>
                      </td>

                      {/* Proctoring Status */}
                      <td className="py-3.5 px-4 text-center">
                        {s.violationsCount === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" /> Clean Record
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-semibold border border-rose-500/20">
                            <AlertTriangle className="w-3 h-3" /> {s.violationsCount} Flags
                          </span>
                        )}
                      </td>

                      {/* Details view */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedStudentForDetails(s)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition"
                        >
                          View Breakdown
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Solved Exercises Drilldown Modal */}
      {selectedStudentForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Student Scorecard: {selectedStudentForDetails.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStudentForDetails(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Rank</span>
                  <span className="text-lg font-black text-white">#{selectedStudentForDetails.rank}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Score</span>
                  <span className="text-lg font-black text-amber-400">{selectedStudentForDetails.totalScore} pts</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Solved Labs</span>
                  <span className="text-lg font-black text-emerald-400">
                    {selectedStudentForDetails.completedExercisesCount} / {exercises.length}
                  </span>
                </div>
              </div>

              {/* Solved Problems Breakdown */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Exercise Completion Breakdown
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {exercises.map((ex) => {
                    const record = selectedStudentForDetails.solvedExercises.find(
                      (s) => s.exerciseId === ex.id
                    );
                    const isSolved = record && record.score === 100;
                    const isPartial = record && record.score > 0 && record.score < 100;

                    return (
                      <div
                        key={ex.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-semibold text-white">{ex.title}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {ex.id} • {ex.category} ({ex.difficulty})
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isSolved ? (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> 100 pts
                            </span>
                          ) : isPartial ? (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30">
                              {record.score} pts (Partial)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-[11px] font-medium border border-slate-700">
                              Unsolved (0 pts)
                            </span>
                          )}

                          {onSelectExercise && (
                            <button
                              onClick={() => {
                                onSelectExercise(ex.id);
                                setSelectedStudentForDetails(null);
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                              title="Go to exercise in IDE"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForDetails(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
                >
                  Close Scorecard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
