import React, { useState } from 'react';
import { StudentRecord } from '../../types';
import { Users, Plus, Search, Mail, Hash, Building2, AlertTriangle, CheckCircle } from 'lucide-react';

interface StudentRosterProps {
  students: StudentRecord[];
  onAddStudent: (student: StudentRecord) => void;
}

export const StudentRoster: React.FC<StudentRosterProps> = ({ students, onAddStudent }) => {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [regNo, setRegNo] = useState('');
  const [department, setDepartment] = useState('Computer Science');

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.regNo.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !regNo) return;

    onAddStudent({
      name,
      email: email.trim().toLowerCase(),
      regNo: regNo.trim().toUpperCase(),
      department,
      submissionsCount: 0,
      violationsCount: 0,
    });

    setName('');
    setEmail('');
    setRegNo('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Student Enrollment Roster</h2>
          <p className="text-xs text-slate-400">
            Registered students allowed to access scheduled lab exercises through Google Auth verification.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Enroll New Student
        </button>
      </div>

      {/* Search */}
      <div className="relative bg-slate-900 p-3 rounded-xl border border-slate-800">
        <Search className="w-4 h-4 text-slate-400 absolute left-6 top-5.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student name, registration number (e.g. 21BCE0001), or email..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Roster Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Registration Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Google Account Email</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Submissions</th>
                <th className="py-3 px-4 text-center">Proctoring Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((s) => (
                <tr key={s.regNo} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-400">{s.regNo}</td>
                  <td className="py-3 px-4 font-semibold text-white">{s.name}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{s.email}</td>
                  <td className="py-3 px-4 text-slate-300">{s.department}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold text-[11px]">
                      {s.submissionsCount || 0}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {(s.violationsCount ?? 0) > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-bold text-[11px] border border-rose-500/30">
                        {s.violationsCount} Flags
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium text-[11px]">
                        Clean Record
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Enroll Student in Sheet Database</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya Patel"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Registration Number</label>
                <input
                  type="text"
                  required
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  placeholder="e.g. 21BCE0450"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Google Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. maya.patel@university.edu"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Add to Sheet Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
