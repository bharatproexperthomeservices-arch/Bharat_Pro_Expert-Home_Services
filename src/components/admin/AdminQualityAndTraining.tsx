import React, { useState } from 'react';

export const AdminQualityAndTraining: React.FC = () => {
  const [sops, setSops] = useState([
    { id: '1', title: 'Sofa Cleaning Standard Operating Procedure', category: 'Sofa Cleaning', docType: 'PDF Document' },
    { id: '2', title: 'Bathroom Descaling & Disinfection Checklist', category: 'Bathroom Cleaning', docType: 'Photo Verification Requirement' },
  ]);

  const [newSopTitle, setNewSopTitle] = useState<string>('');

  const handleAddSop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSopTitle.trim()) return;
    setSops([...sops, { id: Date.now().toString(), title: newSopTitle, category: 'General Service', docType: 'SOP Module' }]);
    setNewSopTitle('');
  };

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-amber-400">Quality SOPs & Partner Training</h1>
          <p className="text-slate-400 text-sm">Upload Operating Guidelines, Service Checklists & Skill Courses</p>
        </div>
      </div>

      <form onSubmit={handleAddSop} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex gap-4">
        <input
          type="text"
          required
          placeholder="New SOP Title or Quality Requirement..."
          value={newSopTitle}
          onChange={(e) => setNewSopTitle(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
        />
        <button type="submit" className="bg-amber-500 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-sm">
          + Publish SOP
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sops.map((sop) => (
          <div key={sop.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{sop.category}</span>
            <h3 className="font-bold text-white text-base">{sop.title}</h3>
            <p className="text-xs text-slate-400">Format: {sop.docType}</p>
          </div>
        ))}
      </div>
    </div>
  );
};