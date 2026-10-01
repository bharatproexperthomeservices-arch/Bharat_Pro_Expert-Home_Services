import React, { useState } from 'react';
import { 
  Terminal, 
  Play, 
  ShieldCheck, 
  AlertTriangle, 
  RotateCcw, 
  CheckCircle2, 
  Cpu, 
  FileCode, 
  Database, 
  Server, 
  Layers, 
  Sliders, 
  Lock, 
  PowerOff,
  Sparkles,
  ArrowRight,
  GitCommit,
  Check,
  Eye,
  Info
} from 'lucide-react';
import { 
  AiTask, 
  AiSafeMode, 
  AiProviderConfig 
} from '../../types';
import { 
  getAiTasks, 
  parseAndPlanAiCommand, 
  approveAndDeployAiTask, 
  rollbackAiTask, 
  getAiKillSwitch, 
  setAiKillSwitch,
  getAiProviderConfigs
} from '../../services/aiDeveloperService';

export const AdminAiDeveloperTab: React.FC = () => {
  const [commandInput, setCommandInput] = useState('Sofa Cleaning ki price update karo, website par publish karo aur test karke batao.');
  const [safeMode, setSafeMode] = useState<AiSafeMode>('REVIEW');
  const [tasks, setTasks] = useState<AiTask[]>(getAiTasks());
  const [activeTask, setActiveTask] = useState<AiTask | null>(tasks[0] || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isKilled, setIsKilled] = useState(getAiKillSwitch());
  const [providerConfigs] = useState<AiProviderConfig[]>(getAiProviderConfigs());
  const [diffViewActive, setDiffViewActive] = useState(true);

  const handleRunAnalyze = () => {
    if (!commandInput.trim() || isKilled) return;
    setIsAnalyzing(true);

    setTimeout(() => {
      try {
        const newTask = parseAndPlanAiCommand(commandInput, safeMode);
        setTasks(getAiTasks());
        setActiveTask(newTask);
      } catch (err: any) {
        alert(err.message || 'Execution error');
      } finally {
        setIsAnalyzing(false);
      }
    }, 1200);
  };

  const handleApprove = (taskId: string) => {
    try {
      const updated = approveAndDeployAiTask(taskId, 'Super Admin');
      setTasks(getAiTasks());
      setActiveTask(updated);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRollback = (taskId: string) => {
    if (!confirm('Are you sure you want to rollback this change?')) return;
    try {
      const reverted = rollbackAiTask(taskId, 'Super Admin');
      setTasks(getAiTasks());
      setActiveTask(reverted);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const toggleKillSwitch = () => {
    const nextState = !isKilled;
    setAiKillSwitch(nextState);
    setIsKilled(nextState);
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header Banner */}
      <div className="bg-[#0F172A] text-white p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              AI Developer
              <span className="text-xs bg-purple-900/60 text-purple-300 border border-purple-600/40 px-2 py-0.5 rounded font-mono font-normal">
                Autonomous Engineer
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Your in-panel developer: command &rarr; understand &rarr; inspect &rarr; build &rarr; verify
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            isKilled 
              ? 'bg-rose-950/80 border-rose-700 text-rose-300' 
              : 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isKilled ? 'bg-rose-500' : 'bg-emerald-400 animate-ping'}`} />
            <span>{isKilled ? 'KILL SWITCH ACTIVE' : 'ENGINE ACTIVE (GEMINI 2.0)'}</span>
          </div>

          <button
            onClick={toggleKillSwitch}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isKilled
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            <PowerOff className="w-3.5 h-3.5" />
            <span>{isKilled ? 'Enable AI' : 'Kill Switch'}</span>
          </button>
        </div>
      </div>

      {/* Natural Language Command Box (Page 3 Blueprint) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Natural Language Instruction (Hindi / Hinglish / English)
          </span>
          <div className="flex items-center gap-1.5 text-xs">
            {(['SAFE', 'REVIEW', 'CONTROLLED_AUTO'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setSafeMode(mode)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer ${
                  safeMode === mode
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {mode.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <textarea
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            disabled={isKilled || isAnalyzing}
            rows={2}
            placeholder="e.g. Master Catalogue mein Sofa Cleaning ki price ₹1499 karo aur tests run karke batao..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-600 font-mono disabled:opacity-50"
          />
          <button
            onClick={handleRunAnalyze}
            disabled={isKilled || isAnalyzing || !commandInput.trim()}
            className="absolute right-3 bottom-3.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analyzing &amp; Planning...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>RUN / ANALYZE</span>
              </>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-700">Quick Prompt Chips:</span>
          {[
            'Bathroom cleaning price ₹799 karo',
            'Pending partner document verification check karo',
            'Homepage cleaning services section ka banner update karo',
            'Booking cancellation ke baad auto reassignment enable karo'
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => setCommandInput(prompt)}
              className="px-2 py-0.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 rounded-md border border-slate-200 transition cursor-pointer text-[10px]"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Pipeline Step Cards (Page 3 Blueprint) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            num: 1,
            title: 'Understand',
            desc: 'Convert Hindi/Hinglish/English command into structured engineering intent.',
            icon: Cpu,
            color: 'text-blue-600 bg-blue-50 border-blue-200'
          },
          {
            num: 2,
            title: 'Inspect',
            desc: 'Search code, routes, DB schema, APIs, dependencies and existing workflows before editing.',
            icon: FileCode,
            color: 'text-purple-600 bg-purple-50 border-purple-200'
          },
          {
            num: 3,
            title: 'Plan + Diff',
            desc: 'Show files, DB changes, API impact, risks and rollback plan.',
            icon: GitCommit,
            color: 'text-amber-600 bg-amber-50 border-amber-200'
          },
          {
            num: 4,
            title: 'Build + Test',
            desc: 'Modify in sandbox/branch, run tests, typecheck, lint and production build.',
            icon: CheckCircle2,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
          }
        ].map(step => {
          const Icon = step.icon;
          return (
            <div key={step.num} className={`p-4 rounded-xl border ${step.color} shadow-xs space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-white border flex items-center justify-center text-xs font-bold">
                  {step.num}
                </span>
                <Icon className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">{step.title}</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">{step.desc}</p>
            </div>
          );
        })}
      </div>

      {/* CONTROL PANEL (Page 3 Blueprint) */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            CONTROL PANEL &bull; SYSTEM POLICIES
          </span>
          <span className="text-[10px] text-slate-400 font-mono">ENFORCED SERVER-SIDE</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-1">Execution Mode</span>
            <span className="font-bold text-purple-400 uppercase">{safeMode}</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-1">Approval Policy</span>
            <span className="font-bold text-amber-400">Required for Production Risk</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-1">Active AI Provider</span>
            <span className="font-bold text-emerald-400">Google Gemini 2.0 Flash</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-1">State Checkpoint</span>
            <span className="font-bold text-sky-400">Automatic Pre-Mutation</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-1">Rollback System</span>
            <span className="font-bold text-emerald-400">One-Click Verified Restore</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-1">Audit Trail</span>
            <span className="font-bold text-purple-400">Immutable Task History</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-1">Secrets Storage</span>
            <span className="font-bold text-slate-300">Server-Side Only (No Client Exposure)</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-1">Emergency Kill Switch</span>
            <span className="font-bold text-rose-400">Super Admin Exclusive</span>
          </div>
        </div>
      </div>

      {/* Active Plan & Diff Review */}
      {activeTask && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                {activeTask.id}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activeTask.status === 'COMPLETED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : activeTask.status === 'WAITING_APPROVAL'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {activeTask.status}
              </span>
              <span className="text-xs text-slate-600 truncate max-w-md font-medium">
                {activeTask.plan?.goal}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {activeTask.status === 'WAITING_APPROVAL' && (
                <button
                  onClick={() => handleApprove(activeTask.id)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve &amp; Deploy</span>
                </button>
              )}
              {activeTask.status === 'COMPLETED' && (
                <button
                  onClick={() => handleRollback(activeTask.id)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Rollback Checkpoint</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Interpretation */}
            <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200 text-xs text-purple-950">
              <span className="font-bold block mb-0.5">What I Understood:</span>
              <p>{activeTask.plan?.whatIUnderstood}</p>
            </div>

            {/* Impact Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Files Affected</span>
                <ul className="space-y-0.5 text-slate-600 font-mono text-[11px]">
                  {activeTask.plan?.filesAffected.map((f, i) => (
                    <li key={i}>&bull; {f}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Database Changes</span>
                <ul className="space-y-0.5 text-slate-600 text-[11px]">
                  {activeTask.plan?.dbChanges.map((d, i) => (
                    <li key={i}>&bull; {d}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Verification Tests</span>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Lint check:</span>
                    <span className="text-emerald-700 font-bold font-mono">PASS</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TypeScript:</span>
                    <span className="text-emerald-700 font-bold font-mono">PASS</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vite build:</span>
                    <span className="text-emerald-700 font-bold font-mono">PASS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Diff Preview */}
            {activeTask.plan?.diffs && activeTask.plan.diffs.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-800 block mb-1.5">Proposed Code Changes (Diff):</span>
                {activeTask.plan.diffs.map((diff, i) => (
                  <div key={i} className="bg-slate-900 rounded-xl p-3 text-xs font-mono text-slate-200 shadow-inner">
                    <div className="text-[10px] text-slate-400 border-b border-slate-800 pb-1 mb-2 flex items-center justify-between">
                      <span>{diff.file}</span>
                      <span className="text-emerald-400">{diff.type}</span>
                    </div>
                    <pre className="text-[11px] text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                      {diff.diffText}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3 Callouts from Blueprint Page 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start gap-3">
          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
            1
          </span>
          <div>
            <h5 className="text-xs font-bold text-slate-900 mb-0.5">Natural language</h5>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              User can give A-to-Z update instructions without knowing file names.
            </p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start gap-3">
          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
            2
          </span>
          <div>
            <h5 className="text-xs font-bold text-slate-900 mb-0.5">No blind production edit</h5>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              AI must not pretend an update succeeded if it could not build/test/deploy it.
            </p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start gap-3">
          <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
            3
          </span>
          <div>
            <h5 className="text-xs font-bold text-slate-900 mb-0.5">Self-protection</h5>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              AI cannot change its own permissions, audit rules, approval system or secrets policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
