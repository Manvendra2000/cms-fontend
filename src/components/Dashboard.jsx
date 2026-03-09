import React from 'react';
import { LogOut, Edit3, FilePlus, Shield, BookOpen, Eye } from 'lucide-react';
import { ROLES, can } from '../utils/auth';

// Role badge styling
const ROLE_STYLES = {
  [ROLES.ADMIN]:  { bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-100',    label: 'Admin'  },
  [ROLES.EDITOR]: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', label: 'Editor' },
  [ROLES.READER]: { bg: 'bg-slate-50',  text: 'text-slate-500',  border: 'border-slate-200',  label: 'Reader' },
};

const RoleBadge = ({ role }) => {
  const style = ROLE_STYLES[role] || ROLE_STYLES[ROLES.READER];
  return (
    <span className={`${style.bg} ${style.text} border ${style.border} px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5`}>
      <Shield size={11} />
      {style.label}
    </span>
  );
};

const Dashboard = ({ user, role, onNavigate, onLogout, onResetWizard }) => {
  const canAdd  = can.addShloka(role);
  const canEdit = can.editShloka(role);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-left">

      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-12 py-6 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <span className="text-orange-600 font-black bg-orange-50 w-12 h-12 flex items-center justify-center rounded-2xl shadow-sm text-xl border">
            ॐ
          </span>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tighter">
              Relational Manager
            </h1>
            {user && (
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                {user.email}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <RoleBadge role={role} />
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-red-500 font-black uppercase tracking-widest text-[10px] bg-red-50 px-5 py-3 rounded-xl hover:bg-red-100 transition-all"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-6xl mx-auto py-32 px-10 text-left">
        <div className="text-center mb-24">
          <h2 className="text-6xl font-black text-slate-900 mb-6 tracking-tighter text-center">
            Digitization Engine
          </h2>
          <p className="text-slate-400 text-lg font-medium text-center">
            Coordinate relational data population for manuscripts.
          </p>
        </div>

        <div className={`grid gap-12 text-left ${canAdd ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-xl mx-auto'}`}>

          {/* VIEW / EDIT — visible to all roles */}
          <div
            className="group relative bg-white p-16 rounded-[4rem] border shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all cursor-pointer overflow-hidden"
            onClick={() => onNavigate('#/edit-list')}
          >
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-orange-50 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-1000" />
            {canEdit
              ? <Edit3 className="text-orange-600 w-20 h-20 mb-10 relative z-10" />
              : <Eye    className="text-orange-400 w-20 h-20 mb-10 relative z-10" />
            }
            <h3 className="text-4xl font-black text-slate-800 mb-6 relative z-10">
              {canEdit ? 'Modify Existing' : 'Browse Archive'}
            </h3>
            <p className="text-slate-400 leading-relaxed text-lg relative z-10">
              {canEdit
                ? 'Adjust existing Shloka records and linked Translation/Commentary components.'
                : 'Browse and read existing Shloka records and commentaries.'}
            </p>
            {!canEdit && (
              <span className="mt-6 inline-block bg-slate-100 text-slate-400 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest relative z-10">
                Read Only
              </span>
            )}
          </div>

          {/* ADD NEW — editors and admins only */}
          {canAdd && (
            <div
              className="group relative bg-white p-16 rounded-[4rem] border shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all cursor-pointer overflow-hidden"
              onClick={() => { onResetWizard(); onNavigate('#/add-entry'); }}
            >
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-green-50 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-1000" />
              <FilePlus className="text-green-600 w-20 h-20 mb-10 relative z-10" />
              <h3 className="text-4xl font-black text-slate-800 mb-6 relative z-10">
                Add New
              </h3>
              <p className="text-slate-400 leading-relaxed text-lg relative z-10">
                Deploy a fresh relational volume tree including Author, Book, and Shlokas.
              </p>
            </div>
          )}
        </div>

        {/* Reader notice */}
        {!canAdd && (
          <p className="text-center text-slate-300 text-xs font-bold uppercase tracking-widest mt-16">
            Contact an admin to request editor access
          </p>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
