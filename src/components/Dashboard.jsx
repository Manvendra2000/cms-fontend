import React from 'react';
import { LogOut, Edit3, FilePlus } from 'lucide-react';

const Dashboard = ({ onNavigate, onLogout, onResetWizard }) => (
  <div className="min-h-screen bg-[#FDFBF7] text-left">
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-12 py-6 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-4 text-left">
        <span className="text-orange-600 font-black bg-orange-50 w-12 h-12 flex items-center justify-center rounded-2xl shadow-sm text-xl border">ॐ</span>
        <h1 className="text-2xl font-black text-slate-800 tracking-tighter text-left">Relational Manager</h1>
      </div>
      <button onClick={onLogout} className="flex items-center gap-2 text-red-500 font-black uppercase tracking-widest text-[10px] bg-red-50 px-5 py-3 rounded-xl hover:bg-red-100 transition-all"><LogOut size={16}/> Logout</button>
    </header>

    <main className="max-w-6xl mx-auto py-32 px-10 text-left">
      <div className="text-center mb-24">
        <h2 className="text-6xl font-black text-slate-900 mb-6 tracking-tighter text-center">Digitization Engine</h2>
        <p className="text-slate-400 text-lg font-medium text-center">Coordinate relational data population for manuscripts.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-12 text-left">
        <div className="group relative bg-white p-16 rounded-[4rem] border shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all cursor-pointer overflow-hidden" onClick={() => onNavigate('#/edit-list')}>
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-orange-50 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-1000"></div>
          <Edit3 className="text-orange-600 w-20 h-20 mb-10 relative z-10" />
          <h3 className="text-4xl font-black text-slate-800 mb-6 relative z-10">Modify Existing</h3>
          <p className="text-slate-400 leading-relaxed text-lg relative z-10 text-left">Adjust existing Shloka records and linked Translation/Commentary components.</p>
        </div>
        <div className="group relative bg-white p-16 rounded-[4rem] border shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all cursor-pointer overflow-hidden" onClick={() => { onResetWizard(); onNavigate('#/add-entry'); }}>
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-green-50 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-1000"></div>
          <FilePlus className="text-green-600 w-20 h-20 mb-10 relative z-10" />
          <h3 className="text-4xl font-black text-slate-800 mb-6 relative z-10">Add New</h3>
          <p className="text-slate-400 leading-relaxed text-lg relative z-10 text-left">Deploy a fresh relational volume tree including Author, Book, and Shlokas.</p>
        </div>
      </div>
    </main>
  </div>
);

export default Dashboard;
