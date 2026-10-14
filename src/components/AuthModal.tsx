import React, { useState } from 'react';
import { User, FacultyRecord, StudentRecord } from '../types';
import { X, ShieldCheck, UserCheck, GraduationCap, Terminal, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onLogin: (user: User) => void;
  facultyList: FacultyRecord[];
  studentsList: StudentRecord[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  facultyList,
  studentsList,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [regNoInput, setRegNoInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanReg = regNoInput.trim().toUpperCase();

    // 1. Check Faculty
    const fac = facultyList.find((f) => f.email.toLowerCase() === cleanEmail);
    if (fac) {
      onLogin({
        role: 'FACULTY',
        email: fac.email,
        name: fac.name,
      });
      onClose();
      return;
    }

    // 2. Check Student
    if (!cleanReg) {
      setErrorMsg('Students must provide their Registration Number (e.g. 21BCE0001) matching the Google Sheet.');
      return;
    }

    const stu = studentsList.find(
      (s) => s.email.toLowerCase() === cleanEmail && s.regNo.toUpperCase() === cleanReg
    );

    if (stu) {
      onLogin({
        role: 'STUDENT',
        email: stu.email,
        name: stu.name,
        regNo: stu.regNo,
      });
      onClose();
      return;
    }

    setErrorMsg(
      'Authentication Failed: Email or Registration Number not found in Google Sheets database (Check "Faculty" or "Students" tab).'
    );
  };

  const selectPreset = (user: User) => {
    onLogin(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white">Google Account & Role Authentication</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Preset Selector for instant testing */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
              Instant Persona Switcher (For Testing & Evaluation)
            </label>
            <div className="space-y-2">
              {/* Faculty Preset */}
              <button
                type="button"
                onClick={() =>
                  selectPreset({
                    role: 'FACULTY',
                    email: facultyList[0]?.email || 'sathish89visit@gmail.com',
                    name: facultyList[0]?.name || 'Prof. Sathish Kumar',
                  })
                }
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                  currentUser.role === 'FACULTY'
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {facultyList[0]?.name || 'Prof. Sathish Kumar'}
                    </div>
                    <div className="text-xs text-slate-400">
                      {facultyList[0]?.email || 'sathish89visit@gmail.com'}
                    </div>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 font-medium">
                  Faculty Admin
                </span>
              </button>

              {/* Student Presets */}
              {studentsList.slice(0, 2).map((stu) => (
                <button
                  key={stu.regNo}
                  type="button"
                  onClick={() =>
                    selectPreset({
                      role: 'STUDENT',
                      email: stu.email,
                      name: stu.name,
                      regNo: stu.regNo,
                    })
                  }
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                    currentUser.regNo === stu.regNo
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      <Terminal className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{stu.name}</div>
                      <div className="text-xs text-slate-400">
                        {stu.email} • {stu.regNo}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-medium">
                    Student
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex items-center py-1">
            <div className="grow border-t border-slate-800"></div>
            <span className="shrink mx-4 text-xs text-slate-500 uppercase">Or Test Custom Login</span>
            <div className="grow border-t border-slate-800"></div>
          </div>

          {/* Custom Login Form */}
          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Google Account Email</label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="e.g. sathish89visit@gmail.com or alex.rivera@university.edu"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">
                Registration Number <span className="text-slate-500">(Leave blank for faculty)</span>
              </label>
              <input
                type="text"
                value={regNoInput}
                onChange={(e) => setRegNoInput(e.target.value)}
                placeholder="e.g. 21BCE0001"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-900 hover:bg-white transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Verify with Google Sheets Database
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
