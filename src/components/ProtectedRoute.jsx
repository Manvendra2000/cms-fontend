import React from 'react';
import { ShieldOff } from 'lucide-react';
import { ROLES } from '../utils/auth';

/**
 * ProtectedRoute
 *
 * Usage:
 *   <ProtectedRoute role={role} allowed={[ROLES.ADMIN, ROLES.EDITOR]}>
 *     <SomeComponent />
 *   </ProtectedRoute>
 *
 * Props:
 *   role      — current user's role string
 *   allowed   — array of roles permitted to view this route
 *   onBack    — optional callback for the "Go Back" button
 *   children  — content to render if authorized
 */
const ProtectedRoute = ({ role, allowed = [], onBack, children }) => {
  const isAuthorized = role && allowed.includes(role);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-8">
        <div className="bg-white rounded-[3rem] shadow-2xl border border-red-50 p-16 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <ShieldOff size={36} className="text-red-400" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-3">
            Access Restricted
          </h2>
          <p className="text-slate-400 font-medium mb-2">
            Your role <span className="font-black text-slate-600 uppercase">{role || 'unknown'}</span> does not have permission to view this page.
          </p>
          <p className="text-slate-300 text-xs font-bold uppercase tracking-widest mb-10">
            Required: {allowed.join(' or ')}
          </p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-700 transition-all"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
