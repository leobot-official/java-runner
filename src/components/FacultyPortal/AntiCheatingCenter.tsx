import React, { useState } from 'react';
import { Violation, ViolationType } from '../../types';
import {
  ShieldAlert,
  AlertTriangle,
  Download,
  Search,
  Filter,
  CheckCircle,
  ExternalLink,
  Clock,
  User,
  Copy,
  Maximize2,
  AlertOctagon,
} from 'lucide-react';

interface AntiCheatingCenterProps {
  violations: Violation[];
  onClearViolations?: () => void;
}

export const AntiCheatingCenter: React.FC<AntiCheatingCenterProps> = ({
  violations,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  // Filtered incidents
  const filteredViolations = violations.filter((v) => {
    const matchesSearch =
      v.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.exerciseTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'ALL' || v.type === selectedType;
    const matchesSev = selectedSeverity === 'ALL' || v.severity === selectedSeverity;

    return matchesSearch && matchesType && matchesSev;
  });

  // Calculate statistics
  const tabSwitches = violations.filter((v) => v.type === 'TAB_SWITCH').length;
  const pasteAttempts = violations.filter((v) => v.type === 'PASTE').length;
  const fullscreenExits = violations.filter((v) => v.type === 'FULLSCREEN_EXIT').length;

  // Group by student for high-risk flags
  const studentViolationsCount: Record<string, { count: number; name: string; regNo: string }> = {};
  violations.forEach((v) => {
    if (!studentViolationsCount[v.regNo]) {
      studentViolationsCount[v.regNo] = { count: 0, name: v.studentName || v.studentEmail, regNo: v.regNo };
    }
    studentViolationsCount[v.regNo].count++;
  });

  const flaggedStudents = Object.values(studentViolationsCount)
    .filter((s) => s.count >= 2)
    .sort((a, b) => b.count - a.count);

  const exportCSV = () => {
    const headers = ['Timestamp', 'StudentEmail', 'RegNo', 'ExerciseID', 'ViolationType', 'Details'];
    const rows = violations.map((v) => [
      `"${v.timestamp}"`,
      `"${v.studentEmail}"`,
      `"${v.regNo}"`,
      `"${v.exerciseId}"`,
      `"${v.type}"`,
      `"${v.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `JavaLab_Violations_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeIcon = (type: ViolationType) => {
    switch (type) {
      case 'TAB_SWITCH':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'PASTE':
        return <Copy className="w-4 h-4 text-rose-400" />;
      case 'FULLSCREEN_EXIT':
        return <Maximize2 className="w-4 h-4 text-purple-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Anti-Cheating & Proctoring Monitor</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold border border-rose-500/20">
              Live Tracker
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time batch violations logged from browser focus, clipboard interceptions, and exam mode exits.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
        >
          <Download className="w-4 h-4" />
          Export Violations Sheet (CSV)
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            Total Incidents
          </div>
          <div className="text-2xl font-black text-white">{violations.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Synced to Google Sheet</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Tab Switches
          </div>
          <div className="text-2xl font-black text-amber-400">{tabSwitches}</div>
          <div className="text-[11px] text-slate-500 mt-1">Focus lost to browser tabs</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Copy className="w-3.5 h-3.5 text-rose-400" />
            Paste Attempts
          </div>
          <div className="text-2xl font-black text-rose-400">{pasteAttempts}</div>
          <div className="text-[11px] text-slate-500 mt-1">External code injections</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
            Fullscreen Exits
          </div>
          <div className="text-2xl font-black text-purple-400">{fullscreenExits}</div>
          <div className="text-[11px] text-slate-500 mt-1">Exam window minimizations</div>
        </div>
      </div>

      {/* High-risk Alert Banner if any student has multiple violations */}
      {flaggedStudents.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-900/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-rose-200">
                High Proctoring Risk Detected ({flaggedStudents.length} Students)
              </div>
              <div className="text-xs text-rose-300/80">
                {flaggedStudents.map((s) => `${s.name} (${s.regNo}: ${s.count} violations)`).join(', ')}
              </div>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-rose-300 bg-rose-900/50 px-3 py-1 rounded-lg border border-rose-800">
            Automated Audit Flagged
          </span>
        </div>
      )}

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, registration number, or exercise..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Violation Types</option>
            <option value="TAB_SWITCH">Tab Switches</option>
            <option value="PASTE">Paste Interceptions</option>
            <option value="FULLSCREEN_EXIT">Fullscreen Exits</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Violations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Time & ID</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Violation Type</th>
                <th className="py-3 px-4">Incident Details</th>
                <th className="py-3 px-4">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredViolations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No violations found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredViolations.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      <div>{v.timestamp}</div>
                      <span className="text-[10px] text-slate-600">{v.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{v.studentName || 'Student'}</div>
                      <div className="font-mono text-[11px] text-indigo-400">{v.regNo}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-semibold">
                        {getTypeIcon(v.type)}
                        <span>{v.type.replace('_', ' ')}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{v.exerciseTitle || v.exerciseId}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <span className="text-slate-300">{v.details}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          v.severity === 'high'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : v.severity === 'medium'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {v.severity}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
