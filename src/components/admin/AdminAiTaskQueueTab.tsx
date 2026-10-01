import React, { useState } from 'react';
import { 
  GitCommit, 
  RotateCcw, 
  Check, 
  Clock, 
  Cpu, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  FileCode,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import { AiTask } from '../../types';
import { 
  getAiTasks, 
  approveAndDeployAiTask, 
  rollbackAiTask 
} from '../../services/aiDeveloperService';

export const AdminAiTaskQueueTab: React.FC = () => {
  const [tasks, setTasks] = useState<AiTask[]>(getAiTasks());
  const [selectedTask, setSelectedTask] = useState<AiTask | null>(tasks[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'WAITING_APPROVAL' | 'ROLLED_BACK'>('ALL');

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.command.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = (taskId: string) => {
    try {
      const updated = approveAndDeployAiTask(taskId, 'Super Admin');
      setTasks(getAiTasks());
      setSelectedTask(updated);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRollback = (taskId: string) => {
    if (!confirm('Are you sure you want to rollback this change?')) return;
    try {
      const reverted = rollbackAiTask(taskId, 'Super Admin');
      setTasks(getAiTasks());
      setSelectedTask(reverted);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="bg-[#0F172A] text-white p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              AI Task Queue &bull; Diffs &bull; Rollback
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Immutable audit of every automated software mutation, test result, and deployment checkpoint.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono bg-purple-950/80 text-purple-300 border border-purple-700 px-3 py-1.5 rounded-xl font-bold">
            {tasks.length} AUDITED AI TASKS
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by ID or command..."
            className="w-full bg-transparent outline-none text-slate-800 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(['ALL', 'COMPLETED', 'WAITING_APPROVAL', 'ROLLED_BACK'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === s
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Task List & Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Task List (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
            Task History Log ({filteredTasks.length})
          </div>

          <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
            {filteredTasks.map(task => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`p-4 transition cursor-pointer text-xs space-y-1.5 ${
                  selectedTask?.id === task.id ? 'bg-purple-50/70 border-l-4 border-purple-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900">{task.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    task.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : task.status === 'WAITING_APPROVAL'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {task.status}
                  </span>
                </div>
                <p className="font-medium text-slate-800 line-clamp-2">{task.command}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 font-mono">
                  <span>{task.provider} &bull; {task.model}</span>
                  <span>{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Task Detail Inspector (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          {selectedTask ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">{selectedTask.id}</span>
                    <span className="text-xs text-slate-500 font-mono">Checkpoint: {selectedTask.checkpointId}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedTask.plan?.goal}</h3>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTask.status === 'WAITING_APPROVAL' && (
                    <button
                      onClick={() => handleApprove(selectedTask.id)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve &amp; Deploy</span>
                    </button>
                  )}
                  {selectedTask.status === 'COMPLETED' && (
                    <button
                      onClick={() => handleRollback(selectedTask.id)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Rollback Checkpoint</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Telemetry info */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block mb-0.5">Execution Duration</span>
                  <span className="font-bold text-slate-800 font-mono">{selectedTask.durationSeconds}s</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block mb-0.5">Tokens Consumed</span>
                  <span className="font-bold text-purple-700 font-mono">{selectedTask.tokensUsed || 0}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block mb-0.5">Estimated Cost</span>
                  <span className="font-bold text-emerald-700 font-mono">${selectedTask.estimatedCostUsd || 0.002}</span>
                </div>
              </div>

              {/* Execution Steps */}
              <div>
                <span className="text-xs font-bold text-slate-800 block mb-2">Automated Pipeline Steps:</span>
                <div className="space-y-2">
                  {selectedTask.steps.map(s => (
                    <div key={s.stepNumber} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-white border flex items-center justify-center font-bold text-[10px]">
                          {s.stepNumber}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900">{s.title}</span>
                          <span className="text-slate-500 text-[11px] block">{s.description}</span>
                        </div>
                      </div>
                      <span className="text-emerald-700 font-bold text-[10px] uppercase font-mono">
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diffs */}
              {selectedTask.plan?.diffs && selectedTask.plan.diffs.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-800 block mb-2">Verified Diff Output:</span>
                  {selectedTask.plan.diffs.map((diff, i) => (
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
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select a task from the left queue to inspect its change plan, tests, and diff.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
