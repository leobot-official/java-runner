import React, { useState } from 'react';
import { Submission, Exercise } from '../../types';
import {
  FileCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Terminal,
  Eye,
  Check,
  RotateCcw,
  Clock,
  User,
} from 'lucide-react';
import { JavaRunnerService } from '../../services/javaRunner';

interface SubmissionsHubProps {
  submissions: Submission[];
  exercises: Exercise[];
  onUpdateSubmission?: (submission: Submission) => void;
}

export const SubmissionsHub: React.FC<SubmissionsHubProps> = ({
  submissions,
  exercises,
}) => {
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [filterExercise, setFilterExercise] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  const [reTesting, setReTesting] = useState(false);
  const [reTestFeedback, setReTestFeedback] = useState<string | null>(null);

  const filtered = submissions.filter((s) => {
    const matchesEx = filterExercise === 'ALL' || s.exerciseId === filterExercise;
    const matchesStat = filterStatus === 'ALL' || s.status === filterStatus;
    const matchesSearch =
      s.studentEmail.toLowerCase().includes(search.toLowerCase()) ||
      s.regNo.toLowerCase().includes(search.toLowerCase()) ||
      (s.studentName && s.studentName.toLowerCase().includes(search.toLowerCase()));

    return matchesEx && matchesStat && matchesSearch;
  });

  const handleReTest = async () => {
    if (!selectedSub) return;
    const ex = exercises.find((e) => e.id === selectedSub.exerciseId);
    if (!ex) return;

    setReTesting(true);
    setReTestFeedback(null);

    const pubRes = await JavaRunnerService.execute(selectedSub.code, ex.publicInput, ex.publicOutput);
    const privRes = await JavaRunnerService.execute(selectedSub.code, ex.privateInput, ex.privateOutput);

    setReTesting(false);
    setReTestFeedback(
      `Re-Evaluation Result: Public=${pubRes.passed ? 'PASS' : 'FAIL'}, Private=${
        privRes.passed ? 'PASS' : 'FAIL'
      }`
    );
  };

  const exportCSV = () => {
    const headers = [
      'Timestamp',
      'StudentEmail',
      'RegNo',
      'ExerciseID',
      'Status',
      'Score',
      'PublicResult',
      'PrivateResult',
    ];
    const rows = submissions.map((s) => [
      `"${s.timestamp}"`,
      `"${s.studentEmail}"`,
      `"${s.regNo}"`,
      `"${s.exerciseId}"`,
      `"${s.status}"`,
      s.score,
      `"${s.publicLog.replace(/"/g, '""')}"`,
      `"${s.privateLog.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `JavaLab_Submissions_Grading_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ALL TEST CASES PASSED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100/100 All Passed
          </span>
        );
      case 'PARTIAL PASS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> 50/100 Partial Pass
          </span>
        );
      case 'COMPILATION ERROR':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5" /> Compile Error
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> 0/100 Failed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Student Submissions & Evaluation</h2>
          <p className="text-xs text-slate-400">
            Official records from the Google Sheet Submissions tab with code inspection & automated grading.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
        >
          <Download className="w-4 h-4" />
          Export Gradebook (CSV)
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, registration number, or email..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterExercise}
            onChange={(e) => setFilterExercise(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Exercises</option>
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.id} - {ex.title}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ALL TEST CASES PASSED">All Passed</option>
            <option value="PARTIAL PASS">Partial Pass</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp & ID</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Exercise</th>
                <th className="py-3 px-4">Evaluation Status</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No submissions found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      <div>{s.timestamp}</div>
                      <span className="text-[10px] text-slate-600">{s.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{s.studentName || s.studentEmail}</div>
                      <div className="font-mono text-[11px] text-indigo-400">{s.regNo}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{s.exerciseTitle || s.exerciseId}</div>
                      <div className="text-[10px] font-mono text-slate-500">{s.exerciseId}</div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(s.status)}</td>
                    <td className="py-3 px-4 font-bold text-white text-sm">
                      <span className={s.score === 100 ? 'text-emerald-400' : s.score > 0 ? 'text-amber-400' : 'text-rose-400'}>
                        {s.score}
                      </span>
                      <span className="text-slate-500 font-normal text-xs">/100</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedSub(s);
                          setReTestFeedback(null);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Code
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Inspection & Test Details Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <FileCode className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Submission Code Inspection: {selectedSub.studentName || selectedSub.regNo}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedSub.exerciseTitle} • Submitted on {selectedSub.timestamp}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Submission Summary Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <div className="text-[11px] text-slate-400">Student Info</div>
                  <div className="text-sm font-semibold text-white">{selectedSub.studentName}</div>
                  <div className="text-xs font-mono text-indigo-400">{selectedSub.regNo}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Evaluation Status</div>
                  <div className="mt-1">{getStatusBadge(selectedSub.status)}</div>
                </div>
                <div className="flex items-center sm:justify-end gap-2">
                  <button
                    onClick={handleReTest}
                    disabled={reTesting}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${reTesting ? 'animate-spin text-indigo-400' : ''}`} />
                    {reTesting ? 'Re-evaluating...' : 'Re-Run Sandbox Test'}
                  </button>
                </div>
              </div>

              {reTestFeedback && (
                <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800 text-xs text-indigo-200 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{reTestFeedback}</span>
                </div>
              )}

              {/* Submitted Java Code Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono">Submitted Source File: Main.java</span>
                  <span>{selectedSub.code.split('\n').length} lines</span>
                </div>
                <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-200 border border-slate-800 overflow-x-auto max-h-80 leading-relaxed">
                  <pre>{selectedSub.code}</pre>
                </div>
              </div>

              {/* Test Case Execution Output Logs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-emerald-400">Public Test Case Log</span>
                    <span className="text-[10px] font-mono text-slate-400">Standard Test</span>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-300 bg-slate-900/80 p-2.5 rounded-lg whitespace-pre-wrap">
                    {selectedSub.publicLog}
                  </pre>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-amber-400">Hidden / Private Test Case Log</span>
                    <span className="text-[10px] font-mono text-slate-400">Grading Test</span>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-300 bg-slate-900/80 p-2.5 rounded-lg whitespace-pre-wrap">
                    {selectedSub.privateLog}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
