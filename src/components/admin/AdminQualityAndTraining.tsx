import React, { useState } from 'react';
import { SOPRule, TrainingCourse, Partner } from '../../types';
import { INITIAL_SOP_RULES, INITIAL_TRAINING_COURSES } from '../../data';
import { 
  ShieldCheck, 
  GraduationCap, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Award, 
  Search, 
  Plus, 
  RefreshCw, 
  Camera, 
  Sparkles,
  Layers,
  Clock,
  BookOpen
} from 'lucide-react';

interface AdminQualityAndTrainingProps {
  partners: Partner[];
  onAuditLog?: (action: string, targetId: string, details: string) => void;
}

export const AdminQualityAndTraining: React.FC<AdminQualityAndTrainingProps> = ({
  partners,
  onAuditLog
}) => {
  const [sopRules, setSopRules] = useState<SOPRule[]>(INITIAL_SOP_RULES);
  const [courses, setCourses] = useState<TrainingCourse[]>(INITIAL_TRAINING_COURSES);
  const [activeTab, setActiveTab] = useState<'SOP_CHECKLISTS' | 'TRAINING_COURSES' | 'QUALITY_AUDITS' | 'REFRESHER_TRIGGERS'>('SOP_CHECKLISTS');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Filtered SOPs
  const filteredSops = sopRules.filter(r => 
    selectedCategory === 'ALL' || r.category === selectedCategory
  );

  // Trigger Refresher for partner
  const handleAssignRefresher = (partnerName: string) => {
    onAuditLog?.('ASSIGN_REFRESHER', partnerName, `Assigned mandatory chemical refresher course to ${partnerName}`);
    alert(`Refresher Course BPE-TRN-101 assigned to ${partnerName}. Technician notified via App.`);
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1E] text-white text-[10px] font-bold tracking-wider uppercase font-mono">
              Module 10 &amp; 11 &bull; Quality &amp; Training
            </span>
            <span className="text-xs text-[#8E8E93]">Standard Operating Procedures &amp; Certifications</span>
          </div>
          <h3 className="text-xl font-black text-[#1C1C1E] mt-1 font-['Outfit']">
            Cleaning SOP Verification &amp; Partner Training Academy
          </h3>
          <p className="text-xs text-[#8E8E93] mt-0.5 max-w-2xl">
            Enforces scientific cleaning standards (Diversey chemicals, dilution ratios, step sequences). 
            Partners with customer ratings &lt; 4.5 are automatically enrolled in mandatory refresher training modules.
          </p>
        </div>

        <button
          onClick={() => {
            const title = window.prompt("Enter new SOP Title (e.g., Tile Descaling Standard):");
            if (!title) return;
            const newRule: SOPRule = {
              id: `sop-${Date.now()}`,
              categoryId: 'bathroom-cleaning',
              category: 'bathroom-cleaning',
              title,
              description: 'Standard cleaning operating procedure',
              chemicalUsed: 'Taski R2 & R6',
              dilutionRatio: '20ml per 1 Litre Water',
              steps: ['Inspection', 'Dilution', 'Application', 'Buffing', 'Photo Upload'],
              mandatoryPhotoProof: true,
              penaltyIfViolated: '₹250 + Quality Warning'
            };
            setSopRules([newRule, ...sopRules]);
            alert(`SOP "${title}" created and published to partner app.`);
          }}
          className="px-4 py-2.5 rounded-xl bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 text-[#D4A24E]" />
          <span>Add Standard SOP Rule</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E5EA] pb-3">
        {[
          { id: 'SOP_CHECKLISTS', label: `Standard SOP Rules (${sopRules.length})`, icon: FileText },
          { id: 'TRAINING_COURSES', label: `Training Academy (${courses.length} Courses)`, icon: GraduationCap },
          { id: 'QUALITY_AUDITS', label: 'Random 10% Quality Audits', icon: ShieldCheck },
          { id: 'REFRESHER_TRIGGERS', label: 'Auto-Refresher Escalations (< 4.5★)', icon: AlertTriangle }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-[#1C1C1E] text-white shadow-sm'
                  : 'bg-white hover:bg-[#F2F2F7] text-[#48484A] border border-[#E5E5EA]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4A24E]' : 'text-[#8E8E93]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SOP RULES */}
      {activeTab === 'SOP_CHECKLISTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSops.map((sop) => (
            <div key={sop.id} className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded bg-neutral-100 font-mono text-[10px] font-bold text-[#1C1C1E] uppercase">
                    {sop.category}
                  </span>
                  <h4 className="text-sm font-bold text-[#1C1C1E] mt-1">{sop.title}</h4>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                  <Camera className="w-3 h-3" /> PHOTO MANDATORY
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#8E8E93]">Chemical Grade:</span>
                  <span className="font-bold text-[#1C1C1E]">{sop.chemicalUsed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E8E93]">Dilution Ratio:</span>
                  <span className="font-mono text-[#B8892E] font-bold">{sop.dilutionRatio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E8E93]">Non-compliance Penalty:</span>
                  <span className="font-semibold text-rose-700">{sop.penaltyIfViolated}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#48484A] block mb-1">
                  Operational Step Sequence:
                </span>
                <ol className="list-decimal list-inside text-xs text-[#48484A] space-y-1 pl-1">
                  {(sop.steps || []).map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: TRAINING ACADEMY */}
      {activeTab === 'TRAINING_COURSES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => (
            <div key={course.id} className="p-5 rounded-3xl bg-white border border-[#E5E5EA] shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 font-mono text-[10px] font-bold">
                    {course.code}
                  </span>
                  <h4 className="text-sm font-bold text-[#1C1C1E] mt-1">{course.title}</h4>
                  <p className="text-xs text-[#8E8E93]">{course.description}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                  {course.durationHours}h DURATION
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#F8F9FB] border border-[#E5E5EA] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#8E8E93]">Passing Threshold:</span>
                  <span className="font-bold text-emerald-700">{course.passingScorePct}% on Practical Exam</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E8E93]">Enrolled Technicians:</span>
                  <span className="font-bold text-[#1C1C1E]">{course.enrolledCount} Partners</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E8E93]">Mandatory For:</span>
                  <span className="font-semibold text-indigo-600">{course.mandatoryFor}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#48484A] block mb-1">Modules Covered:</span>
                <div className="flex flex-wrap gap-1">
                  {(course.modules || []).map((m, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-[#F2F2F7] text-[10px] font-medium text-[#1C1C1E]">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: QUALITY AUDITS */}
      {activeTab === 'QUALITY_AUDITS' && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-[#1C1C1E]">
                Automated 10% Random Sampling &amp; Quality Inspections
              </h4>
              <p className="text-xs text-[#8E8E93]">
                AI-triggered random spot checks and on-site hub supervisor inspections to maintain top-tier ratings.
              </p>
            </div>
            <button
              onClick={() => alert("Audit triggered: 3 ongoing jobs randomly flagged for hub manager phone check.")}
              className="px-3.5 py-2 rounded-xl bg-[#1C1C1E] text-white text-xs font-bold"
            >
              Trigger Spot Audit
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <span className="font-bold block">Current Platform Quality Benchmark: 4.88 / 5.00★</span>
            <p>
              99.2% of completed cleaning tasks met Diversey SOP standards with verified Before &amp; After photo records.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: REFRESHER TRIGGERS */}
      {activeTab === 'REFRESHER_TRIGGERS' && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA] shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-[#1C1C1E]">
                Technicians Flagged for Refresher Training
              </h4>
              <p className="text-xs text-[#8E8E93]">
                Section 11 rule: Partners with rating &lt; 4.5★ or customer rework complaints are queued for immediate refresher.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
              Automated Quality Gate
            </span>
          </div>

          <div className="divide-y divide-[#F2F2F7]">
            {partners.filter(p => p.rating < 4.8).map(partner => (
              <div key={partner.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#1C1C1E] block">{partner.name}</span>
                  <span className="text-[#8E8E93]">{partner.assignedHubName} &bull; Rating: {partner.rating}★</span>
                </div>

                <button
                  onClick={() => handleAssignRefresher(partner.name)}
                  className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border border-amber-200"
                >
                  Assign Refresher Training
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
