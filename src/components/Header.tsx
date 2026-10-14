import React, { useState } from 'react';
import { User, SystemSettings } from '../types';
import {
  Code2,
  GraduationCap,
  Terminal,
  Settings,
  Users,
  Cpu,
  Share2,
  Check,
  Eye,
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'faculty' | 'student';
  onSelectTab: (tab: 'faculty' | 'student') => void;
  currentUser: User;
  onOpenLogin: () => void;
  onOpenSettings: () => void;
  settings: SystemSettings;
  activeViolationsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onOpenLogin,
  onOpenSettings,
  settings,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const copyStudentLink = () => {
    const origin = window.location.origin;
    const path = window.location.pathname.replace(/\/(faculty|student)\/?$/, '');
    const studentUrl = `${origin}${path}#/student`;
    navigator.clipboard.writeText(studentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-black tracking-tight">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">
                  JavaLab<span className="text-orange-400">Pro</span>
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  JDK 17
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Automated Evaluation & Anti-Cheating System</p>
            </div>
          </div>

          {/* Role-Specific Portal Indicator & Navigation */}
          <div className="flex items-center gap-2">
            {currentTab === 'student' ? (
              /* Student Portal - Strictly shows Student Badge; Faculty tab is HIDDEN */
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 shadow-xs">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Student Examination Workspace</span>
                </div>

                {/* Faculty return preview helper if current logged user is faculty */}
                {currentUser.role === 'FACULTY' && (
                  <button
                    onClick={() => onSelectTab('faculty')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-800/60 font-semibold transition flex items-center gap-1.5"
                    title="Return to Faculty Portal"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Return to Faculty Portal</span>
                  </button>
                )}
              </div>
            ) : (
              /* Faculty Portal - Shows Faculty Badge and Student Link share */
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-300 shadow-xs">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  <span>Faculty Management Portal</span>
                </div>

                {/* Switch to preview student view */}
                <button
                  onClick={() => onSelectTab('student')}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition"
                  title="Preview what students see in their exam workspace"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Preview Student IDE</span>
                </button>

                {/* Share student URL button */}
                <button
                  onClick={copyStudentLink}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition"
                  title="Copy Student Exam URL (/#/student) to share with your students"
                >
                  {copiedLink ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>{copiedLink ? 'Copied Student Link!' : 'Share Student URL'}</span>
                </button>
              </div>
            )}
          </div>

          {/* User Status & Controls */}
          <div className="flex items-center gap-3">
            {/* Runner pill indicator */}
            <div
              onClick={onOpenSettings}
              className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 cursor-pointer hover:border-slate-600 transition"
              title="Click to change execution runner settings"
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px]">
                {settings.useBuiltinRunner ? 'Built-in Sandbox' : 'Remote Docker'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>

            {/* Current User Card */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition group"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentUser.role === 'FACULTY'
                      ? 'bg-indigo-600/40 text-indigo-300 border border-indigo-500/50'
                      : 'bg-emerald-600/40 text-emerald-300 border border-emerald-500/50'
                  }`}
                >
                  {currentUser.role === 'FACULTY' ? 'F' : 'S'}
                </div>
                <div className="hidden md:block">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-white leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span>{currentUser.role === 'FACULTY' ? 'Faculty' : currentUser.regNo || 'Student'}</span>
                  </div>
                </div>
                <Users className="w-3.5 h-3.5 text-slate-400 ml-1 group-hover:text-slate-200" />
              </button>

              {/* Settings button */}
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="System Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
