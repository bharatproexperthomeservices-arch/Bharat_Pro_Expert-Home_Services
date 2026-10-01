import React, { useState } from 'react';
import { 
  Zap, 
  PowerOff, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  ArrowRight, 
  RotateCcw, 
  Layers, 
  FileText, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  UserCheck,
  RefreshCw,
  Bell,
  Eye,
  Check
} from 'lucide-react';
import { 
  AutomationRule, 
  AutomationRun, 
  AutomationException, 
  OfflineWorkReport 
} from '../../types';
import { 
  getAgentStatus, 
  setAgentStatus, 
  getAutomationRules, 
  toggleAutomationRule, 
  getAutomationRuns, 
  getAutomationExceptions, 
  resolveAutomationException, 
  getOfflineWorkReport,
  dispatchAutomationEvent
} from '../../services/automationAgentService';

export const AdminAutomationAgentTab: React.FC = () => {
  const [agentStatus, setAgentState] = useState(getAgentStatus());
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'scenario_new' | 'scenario_cancel' | 'reports' | 'rules'>('overview');
  const [rules, setRules] = useState<AutomationRule[]>(getAutomationRules());
  const [runs, setRuns] = useState<AutomationRun[]>(getAutomationRuns());
  const [exceptions, setExceptions] = useState<AutomationException[]>(getAutomationExceptions());
  const [offlineReport, setOfflineReport] = useState<OfflineWorkReport>(getOfflineWorkReport());
  const [isSimulating, setIsSimulating] = useState(false);

  const handleToggleAgent = () => {
    const nextOnline = !agentStatus.isOnline;
    setAgentStatus(nextOnline);
    setAgentState(getAgentStatus());
  };

  const handleToggleRule = (ruleId: string, current: boolean) => {
    toggleAutomationRule(ruleId, !current);
    setRules(getAutomationRules());
  };

  const handleResolveException = (excId: string) => {
    resolveAutomationException(excId, 'Super Admin');
    setExceptions(getAutomationExceptions());
  };

  const handleTriggerSimulatedBooking = async () => {
    if (!agentStatus.isOnline) {
      alert('Automation Agent is currently PAUSED. Please resume before dispatching events.');
      return;
    }
    setIsSimulating(true);
    try {
      await dispatchAutomationEvent('booking.created', {
        booking: {
          id: `bk-${Date.now().toString().slice(-4)}`,
          bookingNumber: `BP-${Math.floor(1000 + Math.random() * 9000)}`,
          serviceName: 'Full Home Deep Sanitization',
          price: 2499,
          status: 'NEW',
          address: {
            addressLine: 'Sector 54, Golf Course Road',
            city: 'Gurugram',
            pincode: '122002'
          }
        } as any
      });
      setRuns(getAutomationRuns());
      setOfflineReport(getOfflineWorkReport());
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Banner & Status Bar (Page 4 Blueprint) */}
      <div className="bg-[#0F172A] text-white p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              24&times;7 Automation Agent
              <span className="text-xs bg-teal-900/60 text-teal-300 border border-teal-600/40 px-2 py-0.5 rounded font-mono font-normal">
                Autonomous Engine
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Always-on server-side operations &bull; independent of Admin login &bull; Diversey hygiene SLA
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            agentStatus.isOnline 
              ? 'bg-teal-950/80 border-teal-700 text-teal-300' 
              : 'bg-rose-950/80 border-rose-700 text-rose-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${agentStatus.isOnline ? 'bg-teal-400 animate-ping' : 'bg-rose-500'}`} />
            <span>{agentStatus.isOnline ? 'AGENT STATUS: ONLINE' : 'AGENT STATUS: PAUSED'}</span>
          </div>

          <button
            onClick={handleToggleAgent}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              agentStatus.isOnline
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-teal-600 hover:bg-teal-700 text-white'
            }`}
          >
            <PowerOff className="w-3.5 h-3.5" />
            <span>{agentStatus.isOnline ? 'PAUSE AGENT' : 'RESUME AGENT'}</span>
          </button>
        </div>
      </div>

      {/* Sub navigation tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { key: 'overview', label: 'Engine Overview' },
          { key: 'scenario_new', label: 'Scenario: New Booking' },
          { key: 'scenario_cancel', label: 'Scenario: Cancellation / Reassign' },
          { key: 'reports', label: `Offline Reports (${offlineReport.runs.length})` },
          { key: 'rules', label: `Rules Manager (${rules.length})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key as any)}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeSubTab === tab.key
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}

        <div className="ml-auto">
          <button
            onClick={handleTriggerSimulatedBooking}
            disabled={isSimulating}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>{isSimulating ? 'Simulating...' : 'Simulate Incoming Event'}</span>
          </button>
        </div>
      </div>

      {/* VIEW: ENGINE OVERVIEW (Page 4 Blueprint) */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* 6 Step Engine Pipeline Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                step: 1,
                title: 'EVENT',
                desc: 'Booking created / cancelled / paid / partner status changed.',
                color: 'border-blue-200 bg-blue-50/70 text-blue-900'
              },
              {
                step: 2,
                title: 'UNDERSTAND',
                desc: 'Check service, state, city, hub, area, time and business rules.',
                color: 'border-purple-200 bg-purple-50/70 text-purple-900'
              },
              {
                step: 3,
                title: 'DECIDE',
                desc: 'Select configured workflow; never invent a rule from guesswork.',
                color: 'border-amber-200 bg-amber-50/70 text-amber-900'
              },
              {
                step: 4,
                title: 'ACT',
                desc: 'Assign / reassign / notify / update status / create task atomically.',
                color: 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
              },
              {
                step: 5,
                title: 'VERIFY',
                desc: 'Confirm DB/API/provider response before acknowledging completion.',
                color: 'border-cyan-200 bg-cyan-50/70 text-cyan-900'
              },
              {
                step: 6,
                title: 'REPORT',
                desc: 'Write immutable activity + offline work report for admin review.',
                color: 'border-slate-300 bg-slate-50 text-slate-900'
              }
            ].map(p => (
              <div key={p.step} className={`p-5 rounded-2xl border ${p.color} shadow-xs space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-white border">
                    PHASE 0{p.step}
                  </span>
                  <Zap className="w-4 h-4 opacity-70" />
                </div>
                <h4 className="text-sm font-bold">{p.title}</h4>
                <p className="text-xs leading-relaxed opacity-90">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Real-time Activity Ticker (Matching Page 7 Activity Log) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                Live Agent Activity Feed (Sub-second Event Queue)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {runs.length} events processed
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {runs.slice(0, 6).map((run) => (
                <div key={run.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-400 text-[11px]">
                      {new Date(run.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-bold font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {run.bookingNumber || run.id}
                    </span>
                    <span className="text-slate-700 font-medium">{run.message}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      run.status === 'SUCCESS' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : run.status === 'ATTENTION'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {run.status}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {run.durationMs}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SCENARIO NEW BOOKING (Page 5 Blueprint) */}
      {activeSubTab === 'scenario_new' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Automation Scenario: New Booking</h3>
            <p className="text-xs text-slate-500">Route the job to the correct hub and eligible verified partner atomically.</p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {[
              { label: 'NEW BOOKING', desc: 'Booking API/event creates record and triggers event bus.' },
              { label: 'LOCATION', desc: 'Resolve state → city → area/sector → hub (Gurugram / Patna / Ranchi).' },
              { label: 'SERVICE', desc: 'Read service/category/skill requirements (Hospital-grade Diversey sanitization).' },
              { label: 'PARTNERS', desc: 'Find approved + active + available partners with valid identity documents.' },
              { label: 'MATCH', desc: 'Apply configured distance/coverage/load rules (15km threshold).' },
              { label: 'BROADCAST', desc: 'Offer to eligible partners with 120s countdown.' },
              { label: 'FIRST ACCEPT', desc: 'Atomic server-side lock assigns exactly one partner. Secondary offers expire.' },
              { label: 'NOTIFY', desc: 'Customer + partner + operations updated via WhatsApp and push notifications.' },
              { label: 'AUDIT', desc: 'Every step stored with task ID in immutable audit log.' }
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 bg-slate-50/80">
                <span className="w-28 shrink-0 font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-300 text-center text-[10px]">
                  {step.label}
                </span>
                <span className="text-slate-700 text-xs font-sans">{step.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: SCENARIO CANCELLATION / REASSIGNMENT (Page 6 Blueprint) */}
      {activeSubTab === 'scenario_cancel' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Automation Scenario: Cancellation &amp; Reassignment</h3>
            <p className="text-xs text-slate-500">Cancellation triggers safe recovery, partner capacity release, and refund auditing.</p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {[
              { label: 'CANCEL EVENT', desc: 'Cancellation confirmed by real customer/partner booking source.' },
              { label: 'CHECK STATE', desc: 'Is job assigned / on-the-way / in-progress / completed?' },
              { label: 'APPLY POLICY', desc: 'Read configured cancellation + payout + refund rules.' },
              { label: 'UPDATE BOOKING', desc: 'Persist valid cancellation state + reason.' },
              { label: 'PAYMENT / REFUND', desc: 'Trigger only configured real payment workflow (no fake refund statuses).' },
              { label: 'PARTNER RELEASE', desc: 'Release partner capacity if policy permits for next dispatch.' },
              { label: 'ALTERNATE ACTION', desc: 'If required, create/reassign task using configured rule.' },
              { label: 'REPORT', desc: 'Write customer, finance, partner and automation records.' }
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 bg-slate-50/80">
                <span className="w-32 shrink-0 font-bold text-rose-800 bg-rose-50 px-2 py-1 rounded border border-rose-300 text-center text-[10px]">
                  {step.label}
                </span>
                <span className="text-slate-700 text-xs font-sans">{step.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: OFFLINE REPORTS (Page 7 Blueprint) */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          {/* Offline Summary Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">OFFLINE SUMMARY</span>
                <h3 className="text-base font-bold text-slate-900">Since your last Admin login</h3>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Generated: {new Date(offlineReport.generatedAt).toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 block mb-1">Bookings Handled</span>
                <span className="text-2xl font-bold text-slate-900">{offlineReport.bookingsHandledCount}</span>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-center">
                <span className="text-[10px] text-purple-700 block mb-1">Reassignments</span>
                <span className="text-2xl font-bold text-purple-700">{offlineReport.reassignmentsCount}</span>
              </div>
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-center">
                <span className="text-[10px] text-rose-700 block mb-1">Cancellations</span>
                <span className="text-2xl font-bold text-rose-700">{offlineReport.cancellationsProcessedCount}</span>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
                <span className="text-[10px] text-blue-700 block mb-1">Partner Actions</span>
                <span className="text-2xl font-bold text-blue-700">{offlineReport.partnerActionsCount}</span>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
                <span className="text-[10px] text-amber-700 block mb-1">Exceptions</span>
                <span className="text-2xl font-bold text-amber-700">{offlineReport.exceptionsCount}</span>
              </div>
            </div>
          </div>

          {/* Exceptions Queue */}
          {exceptions.length > 0 && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Operational Exceptions Requiring Supervisor Attention ({exceptions.filter(e => e.status === 'OPEN').length})
                </span>
              </div>

              <div className="space-y-2">
                {exceptions.map((exc) => (
                  <div key={exc.id} className="p-3 bg-white rounded-xl border border-amber-300 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{exc.bookingNumber}</span>
                        <span className="text-rose-700 font-bold">{exc.error}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Recommendation: {exc.recommendedAction}
                      </p>
                    </div>

                    {exc.status === 'OPEN' ? (
                      <button
                        onClick={() => handleResolveException(exc.id)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Acknowledge &amp; Resolve
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Resolved
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: RULES MANAGER */}
      {activeSubTab === 'rules' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Autonomous Dispatch &amp; Recovery Rules
            </span>
          </div>

          {rules.map((rule) => (
            <div key={rule.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{rule.name}</span>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {rule.eventType}
                  </span>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Priority {rule.priority}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">{rule.description}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleRule(rule.id, rule.enabled)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    rule.enabled
                      ? 'bg-teal-600 text-white hover:bg-teal-700'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {rule.enabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3 Callouts from Blueprint Page 4 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start gap-3">
          <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
            1
          </span>
          <div>
            <h5 className="text-xs font-bold text-slate-900 mb-0.5">Works while logged out</h5>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              This is a backend worker/queue, not a browser-only script. Admin login is not required.
            </p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start gap-3">
          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
            2
          </span>
          <div>
            <h5 className="text-xs font-bold text-slate-900 mb-0.5">Controlled autonomy</h5>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Only pre-approved business rules/workflows can execute automatically.
            </p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start gap-3">
          <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
            3
          </span>
          <div>
            <h5 className="text-xs font-bold text-slate-900 mb-0.5">Human visibility</h5>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Every action gets task ID, timestamp, reason, result and related booking/partner.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
