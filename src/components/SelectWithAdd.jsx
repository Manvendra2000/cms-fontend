import React, { useState } from 'react';
import { Check } from 'lucide-react';

const SelectWithAdd = ({ label, options, value, onChange, onAdd, placeholder = "Select...", disabled = false }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState('');
  const handleAdd = async () => { if (newValue.trim()) { await onAdd(newValue.trim()); setIsAdding(false); setNewValue(''); } };
  return (
    <div className="flex flex-col space-y-1 w-full text-left">
      {label && <label className="text-sm font-black text-slate-600 mb-1 uppercase tracking-tighter">{label}</label>}
      {isAdding ? (
        <div className="flex items-center space-x-2 animate-in fade-in duration-200">
          <input type="text" className="flex-1 p-3 border-2 border-indigo-100 rounded-xl outline-none text-sm focus:border-indigo-500" value={newValue} onChange={(e) => setNewValue(e.target.value)} autoFocus />
          <button onClick={handleAdd} className="p-3 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition-colors"><Check size={18} /></button>
          <button onClick={() => setIsAdding(false)} className="text-xs text-slate-400 font-bold uppercase px-2">Cancel</button>
        </div>
      ) : (
        <select className="p-3 border-2 border-slate-100 rounded-xl bg-white disabled:bg-slate-50 text-sm outline-none focus:border-indigo-500 transition-all font-bold text-slate-700" value={value} disabled={disabled} onChange={(e) => e.target.value === '__ADD_NEW__' ? setIsAdding(true) : onChange(e.target.value)}>
          <option value="" disabled>{placeholder}</option>
{options.map(opt => {
  const label = typeof opt === "object"
    ? opt.name || opt.Name || opt.title || ""
    : opt;

  const value = typeof opt === "object"
    ? opt.id || opt.name || opt.Name
    : opt;

  return (
    <option key={value} value={value}>
      {label}
    </option>
  );
})}          <option value="__ADD_NEW__" className="text-indigo-600 font-black">+ Create New Entry</option>
        </select>
      )}
    </div>
  );
};

export default SelectWithAdd;
