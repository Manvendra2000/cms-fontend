import React from 'react';

const Login = ({ onLogin }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({ email: e.target.email.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4 text-left">
      <div className="w-full max-w-md bg-white p-12 rounded-[3rem] shadow-2xl border border-indigo-50">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="bg-[#D97706] w-14 h-14 rounded-2xl text-white flex items-center justify-center text-3xl shadow-xl">ॐ</div>
            <h1 className="text-4xl font-black text-[#D97706] tracking-tighter text-left">Shloka Portal</h1>
          </div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] text-center">Administrative Access Only</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input name="email" type="text" placeholder="Username" defaultValue="admin@shlokaportal.com" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-[#D97706] transition-all font-bold text-slate-600" />
          <input name="password" type="password" placeholder="Passkey" defaultValue="123456" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-[#D97706] transition-all font-bold text-slate-600" />
          <button type="submit" className="w-full py-5 bg-[#D97706] text-white rounded-2xl font-black text-xl hover:bg-orange-700 active:scale-95 shadow-2xl transition-all">Initiate Access</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
