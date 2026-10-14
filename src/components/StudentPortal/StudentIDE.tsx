import React, { useState, useEffect, useRef } from 'react';
import { Exercise, Submission, Violation, User, SystemSettings, ExecutionResult } from '../../types';
import {
  Play,
  Send,
  RotateCcw,
  Maximize2,
  Minimize2,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  FileCode,
  Tag,
  Eye,
  Info,
  Check,
  Zap,
  Trophy,
} from 'lucide-react';
import { JavaRunnerService } from '../../services/javaRunner';

interface StudentIDEProps {
  currentUser: User;
  exercises: Exercise[];
  onSubmitCode: (submission: Submission, localViolations: Violation[]) => void;
  settings: SystemSettings;
  preselectedExerciseId?: string | null;
  onOpenLeaderboard?: () => void;
  studentRank?: number;
}

export const StudentIDE: React.FC<StudentIDEProps> = ({
  currentUser,
  exercises,
  onSubmitCode,
  settings,
  preselectedExerciseId,
  onOpenLeaderboard,
  studentRank,
}) => {
  // Filter active exercises by schedule
  const now = Date.now();
  const activeExercises = exercises.filter((ex) => {
    const open = new Date(ex.openTime).getTime();
    const close = new Date(ex.closeTime).getTime();
    return now >= open && now <= close;
  });

  const [selectedEx, setSelectedEx] = useState<Exercise | undefined>(
    activeExercises[0] || exercises[0]
  );

  const [code, setCode] = useState<string>(selectedEx?.starterCode || `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here
        
    }
}`);

  // Execution state
  const [isRunningPublic, setIsRunningPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publicTestResult, setPublicTestResult] = useState<ExecutionResult | null>(null);
  const [privateTestResult, setPrivateTestResult] = useState<ExecutionResult | null>(null);
  const [officialStatus, setOfficialStatus] = useState<string | null>(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'tests' | 'output' | 'violations'>('tests');

  // Custom Input State
  const [useCustomInput, setUseCustomInput] = useState(false);
  const [customInputText, setCustomInputText] = useState('');
  const [customOutputText, setCustomOutputText] = useState('');

  // Anti-cheating Proctoring state
  const [localViolations, setLocalViolations] = useState<Violation[]>([]);
  const [recentViolationWarning, setRecentViolationWarning] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Update starter code when exercise switches or when exercises loaded
  useEffect(() => {
    if (selectedEx) {
      setCode(
        selectedEx.starterCode ||
          `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        \n    }\n}`
      );
      setPublicTestResult(null);
      setPrivateTestResult(null);
      setOfficialStatus(null);
    } else if (exercises.length > 0) {
      setSelectedEx(activeExercises[0] || exercises[0]);
    }
  }, [selectedEx?.id, exercises.length]);

  // Handle preselected exercise navigation from Leaderboard
  useEffect(() => {
    if (preselectedExerciseId) {
      const found = exercises.find((e) => e.id === preselectedExerciseId);
      if (found) {
        setSelectedEx(found);
      }
    }
  }, [preselectedExerciseId, exercises]);

  // Anti-cheating event listeners
  useEffect(() => {
    const recordViolation = (type: Violation['type'], details: string, severity: 'low' | 'medium' | 'high' = 'medium') => {
      const newVio: Violation = {
        id: 'VIO_LOC_' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        studentEmail: currentUser.email,
        regNo: currentUser.regNo || 'STUDENT',
        studentName: currentUser.name,
        exerciseId: selectedEx?.id || 'EX_UNKNOWN',
        exerciseTitle: selectedEx?.title || 'Unknown',
        type,
        details,
        severity,
      };

      setLocalViolations((prev) => [newVio, ...prev]);
      setRecentViolationWarning(`Anti-Cheating Triggered: ${type} - ${details}`);
      setActiveConsoleTab('violations');

      setTimeout(() => {
        setRecentViolationWarning(null);
      }, 5000);
    };

    // 1. Tab switch detector (window blur)
    const handleBlur = () => {
      if (settings.trackTabSwitches) {
        recordViolation('TAB_SWITCH', 'Switched focus / left browser tab during examination', 'high');
      }
    };

    // 2. Fullscreen exit detector
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active && settings.enforceFullscreen) {
        recordViolation('FULLSCREEN_EXIT', 'Exited mandatory exam fullscreen mode', 'medium');
      }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [selectedEx, currentUser, settings]);

  // Intercept paste in code editor
  const handleCodePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (settings.blockCopyPaste) {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text');
      const snippet = pastedData.slice(0, 30).replace(/\n/g, ' ');

      const newVio: Violation = {
        id: 'VIO_LOC_' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        studentEmail: currentUser.email,
        regNo: currentUser.regNo || 'STUDENT',
        studentName: currentUser.name,
        exerciseId: selectedEx?.id || 'EX_GENERAL',
        exerciseTitle: selectedEx?.title || 'General Exam',
        type: 'PASTE',
        details: `Clipboard paste intercepted (${pastedData.length} chars: "${snippet}...")`,
        severity: 'high',
      };

      setLocalViolations((prev) => [newVio, ...prev]);
      setRecentViolationWarning('Paste Action Blocked: Direct code pasting is restricted during this lab assessment!');
      setActiveConsoleTab('violations');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Run Public Test Case
  const handleRunPublic = async () => {
    if (useCustomInput) {
      setIsRunningPublic(true);
      setActiveConsoleTab('output');
      const res = await JavaRunnerService.execute(code, customInputText, '', {
        remoteUrl: settings.useBuiltinRunner ? undefined : settings.renderServiceUrl,
        apiSecret: settings.apiSecret,
        forceBuiltin: settings.useBuiltinRunner,
      });
      setCustomOutputText(res.actualOutput || res.log);
      setIsRunningPublic(false);
      return;
    }

    setIsRunningPublic(true);
    setActiveConsoleTab('tests');

    if (!selectedEx) {
      alert('No active exercise selected. Please select an exercise from the left panel.');
      setIsRunningPublic(false);
      return;
    }

    const result = await JavaRunnerService.execute(code, selectedEx.publicInput, selectedEx.publicOutput, {
      remoteUrl: settings.useBuiltinRunner ? undefined : settings.renderServiceUrl,
      apiSecret: settings.apiSecret,
      forceBuiltin: settings.useBuiltinRunner,
    });

    setPublicTestResult(result);
    setIsRunningPublic(false);
  };

  // Official Submit Code (Runs both public and private test cases)
  const handleSubmitCode = async () => {
    if (!selectedEx) {
      alert('No active exercise selected. Please select an exercise from the left panel.');
      return;
    }

    setIsSubmitting(true);
    setActiveConsoleTab('tests');

    // Run Public Test
    const pubRes = await JavaRunnerService.execute(code, selectedEx.publicInput, selectedEx.publicOutput, {
      remoteUrl: settings.useBuiltinRunner ? undefined : settings.renderServiceUrl,
      apiSecret: settings.apiSecret,
      forceBuiltin: settings.useBuiltinRunner,
    });

    // Run Private Hidden Test
    const privRes = await JavaRunnerService.execute(code, selectedEx.privateInput, selectedEx.privateOutput, {
      remoteUrl: settings.useBuiltinRunner ? undefined : settings.renderServiceUrl,
      apiSecret: settings.apiSecret,
      forceBuiltin: settings.useBuiltinRunner,
    });

    setPublicTestResult(pubRes);
    setPrivateTestResult(privRes);

    let status: Submission['status'] = 'FAILED';
    let score = 0;

    if (pubRes.passed && privRes.passed) {
      status = 'ALL TEST CASES PASSED';
      score = 100;
    } else if (pubRes.passed || privRes.passed) {
      status = 'PARTIAL PASS';
      score = 50;
    } else if (pubRes.isError || privRes.isError) {
      status = 'COMPILATION ERROR';
      score = 0;
    }

    setOfficialStatus(status);

    const submissionPayload: Submission = {
      id: 'SUB_' + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      studentEmail: currentUser.email,
      regNo: currentUser.regNo || '21BCE0001',
      studentName: currentUser.name,
      exerciseId: selectedEx.id,
      exerciseTitle: selectedEx.title,
      code,
      status,
      publicPassed: pubRes.passed,
      privatePassed: privRes.passed,
      publicLog: pubRes.log,
      privateLog: privRes.log,
      score,
    };

    onSubmitCode(submissionPayload, localViolations);
    setIsSubmitting(false);
  };

  const handleResetBoilerplate = () => {
    if (confirm('Reset code editor to starter boilerplate?')) {
      setCode(selectedEx?.starterCode || `public class Main {\n    public static void main(String[] args) {\n        \n    }\n}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Proctoring HUD Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Proctoring Guard Active
          </div>

          <div className="text-xs text-slate-300 hidden sm:flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="text-slate-500 font-mono">Student:</span>
              <span className="font-semibold text-white">{currentUser.name}</span>
              <span className="text-indigo-400 font-mono text-[11px]">({currentUser.regNo || '21BCE0001'})</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Leaderboard Quick Button */}
          {onOpenLeaderboard && (
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition shadow-xs"
              title="Open Leaderboard and peer rankings"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Leaderboard {studentRank ? `(#${studentRank})` : ''}</span>
            </button>
          )}

          {/* Violations Counter */}
          <div
            onClick={() => setActiveConsoleTab('violations')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
              localViolations.length > 0
                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 animate-pulse'
                : 'bg-slate-800 text-slate-400 border border-slate-700/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Violations Logged: {localViolations.length}</span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition border ${
              isFullscreen
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Lock Fullscreen Exam'}</span>
          </button>
        </div>
      </div>

      {/* Floating Warning for Anti-Cheating Incident */}
      {recentViolationWarning && (
        <div className="bg-rose-950 border border-rose-600 text-rose-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xl animate-bounce">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{recentViolationWarning}</span>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-900 border border-rose-700">
            Recorded in Violations Sheet
          </span>
        </div>
      )}

      {/* Main Grid: Left Exercise Selector & Description, Right IDE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Problem Spec & Active Exercises List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Exercises List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-indigo-400" />
                Scheduled Exercises ({exercises.length})
              </h3>
            </div>

            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {exercises.length === 0 ? (
                <div className="text-center py-5 text-slate-500 text-xs">
                  No exercises scheduled yet.
                </div>
              ) : (
                exercises.map((ex) => {
                  const isSelected = selectedEx?.id === ex.id;
                  return (
                    <button
                      key={ex.id}
                      onClick={() => setSelectedEx(ex)}
                      className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-600/15 border-indigo-500/60 text-white'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <div className="text-xs font-bold truncate">{ex.title}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{ex.id} • {ex.category}</div>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          ex.difficulty === 'Easy'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : ex.difficulty === 'Medium'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {ex.difficulty}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Problem Details & Constraints */}
          {!selectedEx ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
              <FileCode className="w-8 h-8 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Exercise Selected</h4>
              <p className="text-xs text-slate-400">
                There are no active exercises scheduled yet. Once your faculty schedules a lab problem, it will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-indigo-400 font-bold">{selectedEx.id}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-400">{selectedEx.category}</span>
                </div>
                <h2 className="text-lg font-bold text-white">{selectedEx.title}</h2>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                {selectedEx.description}
              </div>

              {/* Sample Public Test Case */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Eye className="w-3.5 h-3.5" /> Sample Test Case (Public)
                  </span>
                </div>

                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 font-mono text-xs space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">Input:</span>
                    <pre className="text-slate-300 text-[11px] whitespace-pre-wrap">{selectedEx.publicInput}</pre>
                  </div>
                  <div className="border-t border-slate-800/80 pt-2">
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">Expected Output:</span>
                    <pre className="text-emerald-400 text-[11px] whitespace-pre-wrap">{selectedEx.publicOutput}</pre>
                  </div>
                </div>
              </div>

              {/* Timing */}
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" /> Closes:
                </span>
                <span className="font-mono text-slate-300">
                  {new Date(selectedEx.closeTime).toLocaleDateString()} {new Date(selectedEx.closeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Code Editor & Execution Console (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            {/* Editor Action Bar */}
            <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-orange-400" />
                  Main.java
                </span>
                <span className="text-[10px] text-slate-500 font-mono">JDK 17 Compatible</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUseCustomInput(!useCustomInput)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition border ${
                    useCustomInput
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  Custom Input: {useCustomInput ? 'ON' : 'OFF'}
                </button>

                <button
                  type="button"
                  onClick={handleResetBoilerplate}
                  className="px-2.5 py-1 text-xs rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center gap-1"
                  title="Reset code"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  type="button"
                  onClick={handleRunPublic}
                  disabled={isRunningPublic || isSubmitting}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 text-emerald-400 ${isRunningPublic ? 'animate-spin' : ''}`} />
                  <span>{isRunningPublic ? 'Running...' : 'Run Public Tests'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitCode}
                  disabled={isSubmitting || isRunningPublic}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-pulse' : ''}`} />
                  <span>{isSubmitting ? 'Evaluating All Tests...' : 'Submit Code'}</span>
                </button>
              </div>
            </div>

            {/* Java Code Editor Textarea */}
            <div className="relative bg-slate-950 font-mono text-xs">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onPaste={handleCodePaste}
                rows={16}
                spellCheck={false}
                placeholder="public class Main { public static void main(String[] args) { ... } }"
                className="w-full bg-slate-950 text-slate-100 p-4 font-mono text-xs leading-relaxed focus:outline-none resize-y selection:bg-indigo-600 selection:text-white"
                style={{ tabSize: 4 }}
              />
            </div>

            {/* Custom Input Drawer if enabled */}
            {useCustomInput && (
              <div className="border-t border-slate-800 bg-slate-950/90 p-3 space-y-2">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Custom Standard Input (System.in):
                </div>
                <textarea
                  rows={2}
                  value={customInputText}
                  onChange={(e) => setCustomInputText(e.target.value)}
                  placeholder="Enter custom input values to feed into Scanner..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Test Execution & Output Results Console */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Console Tab Headers */}
            <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveConsoleTab('tests')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    activeConsoleTab === 'tests'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Test Cases Evaluation</span>
                </button>

                <button
                  onClick={() => setActiveConsoleTab('output')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    activeConsoleTab === 'output'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Execution Console</span>
                </button>

                <button
                  onClick={() => setActiveConsoleTab('violations')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    activeConsoleTab === 'violations'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>Proctoring Audit ({localViolations.length})</span>
                </button>
              </div>

              {officialStatus && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Official Result:</span>
                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-md ${
                      officialStatus === 'ALL TEST CASES PASSED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : officialStatus === 'PARTIAL PASS'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    {officialStatus}
                  </span>
                </div>
              )}
            </div>

            {/* Tab 1: Test Cases */}
            {activeConsoleTab === 'tests' && (
              <div className="p-4 space-y-3">
                {!publicTestResult && !privateTestResult ? (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    Click <strong className="text-slate-300">"Run Public Tests"</strong> to verify your solution against sample input, or <strong className="text-slate-300">"Submit Code"</strong> to evaluate against both public and hidden grading test cases.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Public test card */}
                    {publicTestResult && (
                      <div
                        className={`p-3.5 rounded-xl border ${
                          publicTestResult.passed
                            ? 'bg-emerald-950/20 border-emerald-800/60'
                            : 'bg-rose-950/20 border-rose-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            {publicTestResult.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400" />
                            )}
                            Public Test Case #1
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              publicTestResult.passed
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {publicTestResult.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-[11px] font-mono">
                          <div className="text-slate-400">
                            Expected:{' '}
                            <span className="text-slate-200">{publicTestResult.expectedOutput}</span>
                          </div>
                          <div className="text-slate-400">
                            Your Output:{' '}
                            <span className={publicTestResult.passed ? 'text-emerald-300' : 'text-rose-300'}>
                              {publicTestResult.actualOutput || '(Empty or error)'}
                            </span>
                          </div>
                          {publicTestResult.executionTimeMs && (
                            <div className="text-[10px] text-slate-500 font-sans">
                              Execution time: {publicTestResult.executionTimeMs} ms
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Private test card */}
                    {privateTestResult && (
                      <div
                        className={`p-3.5 rounded-xl border ${
                          privateTestResult.passed
                            ? 'bg-emerald-950/20 border-emerald-800/60'
                            : 'bg-rose-950/20 border-rose-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            {privateTestResult.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400" />
                            )}
                            Hidden Grading Test Case #2
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              privateTestResult.passed
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {privateTestResult.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-[11px] font-mono">
                          <div className="text-slate-400">
                            Hidden Evaluation Result:{' '}
                            <span className={privateTestResult.passed ? 'text-emerald-300' : 'text-rose-300'}>
                              {privateTestResult.passed ? 'All constraints satisfied' : 'Wrong Answer or Output mismatch'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-sans">
                            Private inputs remain hidden to ensure grading integrity.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Console Output */}
            {activeConsoleTab === 'output' && (
              <div className="p-4 bg-slate-950 font-mono text-xs text-slate-200 min-h-28">
                {customOutputText ? (
                  <pre className="whitespace-pre-wrap">{customOutputText}</pre>
                ) : (
                  <div className="text-slate-500">
                    Console output will appear here after running your code.
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Local Proctoring Violations */}
            {activeConsoleTab === 'violations' && (
              <div className="p-4 space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Proctoring Incidents Logged This Session:</span>
                  <span className="text-[11px] text-slate-500">
                    Will be synced to Google Sheet upon submission
                  </span>
                </div>

                {localViolations.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/60 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Clean session! No tab switches, clipboard paste, or fullscreen exits recorded.</span>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {localViolations.map((v) => (
                      <div
                        key={v.id}
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="font-semibold text-rose-300 font-mono">[{v.type}]</span>
                          <span className="text-slate-300">{v.details}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{v.timestamp}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
