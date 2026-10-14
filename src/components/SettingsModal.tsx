import React, { useState } from 'react';
import { SystemSettings } from '../types';
import { X, Server, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Key, Link2, Database } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onSave: (newSettings: SystemSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [formData, setFormData] = useState<SystemSettings>(settings);
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [pingMessage, setPingMessage] = useState<string>('');
  const [sheetPingStatus, setSheetPingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [sheetPingMessage, setSheetPingMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!formData.renderServiceUrl || formData.renderServiceUrl.includes('YOUR-RENDER-APP-NAME')) {
      setPingStatus('error');
      setPingMessage('Please enter a valid live Render or local Docker URL (e.g. https://java-runner.onrender.com/execute)');
      return;
    }

    setPingStatus('testing');
    setPingMessage('Pinging execution container...');

    try {
      const res = await fetch(formData.renderServiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': formData.apiSecret || 'MY_SECURE_LAB_KEY_123',
        },
        body: JSON.stringify({
          code: 'public class Main { public static void main(String[] args) { System.out.println("PONG"); } }',
          input: '',
          expectedOutput: 'PONG',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.passed) {
          setPingStatus('success');
          setPingMessage('Connected successfully! Docker sandbox responded with valid Java execution.');
        } else {
          setPingStatus('error');
          setPingMessage(`Connected but response failed: ${data.log || 'Unknown response'}`);
        }
      } else {
        setPingStatus('error');
        setPingMessage(`HTTP Error ${res.status}: Check that API Key matches API_SECRET on Render.`);
      }
    } catch (err: any) {
      setPingStatus('error');
      setPingMessage(`Connection failed (${err.message || 'Network error'}). Note: If testing from localhost, ensure CORS is enabled on the runner.`);
    }
  };

  const handleTestSheetConnection = async () => {
    if (!formData.googleSheetsUrl || !formData.googleSheetsUrl.startsWith('http')) {
      setSheetPingStatus('error');
      setSheetPingMessage('Please enter a valid Google Apps Script Web App URL (ending in /exec)');
      return;
    }

    setSheetPingStatus('testing');
    setSheetPingMessage('Connecting to Google Apps Script API...');

    try {
      const url = `${formData.googleSheetsUrl}${formData.googleSheetsUrl.includes('?') ? '&' : '?'}action=getActiveExercises`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSheetPingStatus('success');
        setSheetPingMessage(`Connected! Google Sheet responded successfully (${Array.isArray(data) ? data.length : 0} exercises active).`);
      } else {
        setSheetPingStatus('error');
        setSheetPingMessage(`HTTP Error ${res.status}: Ensure Web App is deployed with "Access: Anyone".`);
      }
    } catch (err: any) {
      setSheetPingStatus('error');
      setSheetPingMessage(`Connection failed (${err.message}). Check that the Web App is deployed with "Execute as: Me" and "Access: Anyone".`);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white">System & Execution Engine Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Engine Mode */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
            <label className="text-sm font-medium text-slate-200 block">Execution Backend Engine</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, useBuiltinRunner: true })}
                className={`px-4 py-3 rounded-lg border text-left text-xs transition ${
                  formData.useBuiltinRunner
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200 font-medium'
                    : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="font-semibold text-sm text-white mb-1">Built-in JVM Sandbox</div>
                Runs client-side immediately in the browser. Zero server setup required for testing.
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, useBuiltinRunner: false })}
                className={`px-4 py-3 rounded-lg border text-left text-xs transition ${
                  !formData.useBuiltinRunner
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200 font-medium'
                    : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="font-semibold text-sm text-white mb-1">External Docker / Render</div>
                Calls your live Node.js + OpenJDK Docker container at the specified URL.
              </button>
            </div>
          </div>

          {/* Docker Service URL */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-slate-400" />
                Render / Docker Runner URL:
              </span>
              <span className="text-xs text-slate-400">Step 2 Endpoint</span>
            </label>
            <input
              type="text"
              value={formData.renderServiceUrl}
              onChange={(e) => setFormData({ ...formData, renderServiceUrl: e.target.value })}
              placeholder="https://java-runner-xxxx.onrender.com/execute"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* API Secret */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-slate-400" />
              Docker Container API Secret (<code className="text-xs text-indigo-300">x-api-key</code>)
            </label>
            <input
              type="text"
              value={formData.apiSecret}
              onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
              placeholder="MY_SECURE_LAB_KEY_123"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Ping connection tester */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={pingStatus === 'testing'}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-2 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${pingStatus === 'testing' ? 'animate-spin text-indigo-400' : ''}`} />
              Test Remote Runner Ping
            </button>

            {pingStatus === 'success' && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Runner Online
              </span>
            )}
            {pingStatus === 'error' && (
              <span className="text-xs text-rose-400 flex items-center gap-1 font-medium">
                <AlertCircle className="w-4 h-4" /> {pingMessage}
              </span>
            )}
          </div>

          {/* Google Apps Script Web App URL (Headless Database API) */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <label className="text-sm font-medium text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-400" />
                Google Apps Script Database API URL:
              </span>
              <span className="text-xs text-slate-400">Code.gs Endpoint</span>
            </label>
            <input
              type="text"
              value={formData.googleSheetsUrl}
              onChange={(e) => setFormData({ ...formData, googleSheetsUrl: e.target.value })}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400">
              When hosted on GitHub, this API endpoint stores and reads exercises, submissions, and violations from your Google Sheet with zero multiple-account redirect bugs.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleTestSheetConnection}
                disabled={sheetPingStatus === 'testing'}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-2 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${sheetPingStatus === 'testing' ? 'animate-spin text-emerald-400' : ''}`} />
                Test Sheet API Connection
              </button>

              {sheetPingStatus === 'success' && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> {sheetPingMessage}
                </span>
              )}
              {sheetPingStatus === 'error' && (
                <span className="text-xs text-rose-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-4 h-4" /> {sheetPingMessage}
                </span>
              )}
            </div>
          </div>

          {/* Anti-Cheating & Proctoring Rules */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-1">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Anti-Cheating Proctoring Rules
            </div>
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.trackTabSwitches}
                onChange={(e) => setFormData({ ...formData, trackTabSwitches: e.target.checked })}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Record browser tab switches & window blur events as violations</span>
            </label>
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.blockCopyPaste}
                onChange={(e) => setFormData({ ...formData, blockCopyPaste: e.target.checked })}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Intercept clipboard paste events in student editor & log violation</span>
            </label>
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enforceFullscreen}
                onChange={(e) => setFormData({ ...formData, enforceFullscreen: e.target.checked })}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Require fullscreen mode during student exams</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
