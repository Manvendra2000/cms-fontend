import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, ChevronRight, ChevronLeft, Check, Globe, Wand2, 
  BookOpen, Sparkles, X, CloudUpload, Minus, Database, LogOut, 
  Search, Edit3, ArrowLeft, LayoutDashboard, FilePlus, Loader2,
  Book as BookIcon, Type, Languages, MessageSquare, AlertCircle
} from 'lucide-react';

// --- CONFIGURATION ---
const STRAPI_URL = "http://localhost:1337";
const STRAPI_API_TOKEN = "5c6b3b5ef3b79a3e8e61ad906060e2ef2502210a6872df54550b83cccee7e1e83ec814a4d72e4f2a0a77447cc6b667e27b4e4b606f11414bb1dd2f05d3e22b59ceefa244e94d85479f18ed794b13956cf5020bdadd2133e21e5010ae57c189b29a3da29d92664622accb575e0245067f8a96c4d4988acc84247dca16a67fdb07"; 

const INITIAL_FORM_STATE = {
  book: '', bookIntro: '', shankaracharyaIntro: '', shankaracharyaIntroTranslation: '', bhashya: '',
  selectedTeekas: [''], hierarchyCount: 2,
  hierarchySanskritNames: { level1: 'अध्याय', level2: 'श्लोक', level3: 'प्रकरण', level4: 'पद' },
  hierarchyValues: { level1: '1', level2: '1', level3: '1', level4: '' },
  sourceText: '', verseTranslations: { english: '', others: [] },
  bhashyaContent: { sanskrit: '', english: '', others: [] },
  teekas: []
};

// --- UTILS ---
const filterDevanagari = (val) => val.replace(/[^\u0900-\u097F\s.,;:!?'"|॥०-९\-\n\r()[\]{}@#$%^&*_+=\/\\<>~`|]/g, '');
const filterEnglish = (val) => val.replace(/[^a-zA-Z0-9\s.,;:!?'"()[\]{}\-\n\r@#$%^&*_+=\/\\<>~`|]/g, '');

const toStrapiBlocks = (text) => {
  if (!text) return [{ type: 'paragraph', children: [{ type: 'text', text: "" }] }];
  return text.split('\n').map(line => ({
    type: 'paragraph',
    children: [{ type: 'text', text: line }]
  }));
};

// --- UI COMPONENTS ---

const SelectWithAdd = ({ label, options, value, onChange, onAdd, placeholder = "Select...", disabled = false }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState('');
  
  const handleAdd = async () => { 
    if (newValue.trim()) { 
      await onAdd(newValue.trim());
      setIsAdding(false); 
      setNewValue(''); 
    } 
  };

  return (
    <div className="flex flex-col space-y-1 w-full text-left">
      {label && <label className="text-sm font-black text-slate-600 mb-1 uppercase tracking-tighter">{label}</label>}
      {isAdding ? (
        <div className="flex items-center space-x-2 animate-in fade-in duration-200">
          <input type="text" className="flex-1 p-3 border-2 border-indigo-100 rounded-xl outline-none text-sm focus:border-indigo-500" value={newValue} onChange={(e) => setNewValue(e.target.value)} autoFocus />
          <button onClick={handleAdd} className="p-3 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition-colors"><Check size={18} /></button>
          <button onClick={() => setIsAdding(false)} className="text-xs text-slate-400 font-bold uppercase tracking-tighter px-2">Cancel</button>
        </div>
      ) : (
        <select className="p-3 border-2 border-slate-100 rounded-xl bg-white disabled:bg-slate-50 text-sm outline-none focus:border-indigo-500 transition-all font-bold text-slate-700" value={value} disabled={disabled} onChange={(e) => e.target.value === '__ADD_NEW__' ? setIsAdding(true) : onChange(e.target.value)}>
          <option value="" disabled>{placeholder}</option>
          {options.map(opt => <option key={opt.id || opt.name || opt} value={opt.name || opt}>{opt.name || opt}</option>)}
          <option value="__ADD_NEW__" className="text-indigo-600 font-black">+ Create New Entry</option>
        </select>
      )}
    </div>
  );
};

// --- MAIN APPLICATION ---

export default function App() {
  const [route, setRoute] = useState(window.location.hash || '#/login');
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [versesQueue, setVersesQueue] = useState([]); 
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  // Dynamic Dropdown States
  const [booksList, setBooksList] = useState([]);
  const [authorsList, setAuthorsList] = useState([]);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${STRAPI_API_TOKEN}`
  });

  // Fetch Dropdown Content from Strapi
  const fetchDropdownData = async () => {
    try {
      const [booksRes, authorsRes] = await Promise.all([
        fetch(`${STRAPI_URL}/api/books?fields[0]=Title&pagination[limit]=100`, { headers: getAuthHeaders() }),
        fetch(`${STRAPI_URL}/api/authors?fields[0]=name&pagination[limit]=100`, { headers: getAuthHeaders() })
      ]);
      const booksData = await booksRes.json();
      const authorsData = await authorsRes.json();

      if (booksData.data) setBooksList(booksData.data.map(b => ({ id: b.documentId, name: b.Title })));
      if (authorsData.data) setAuthorsList(authorsData.data.map(a => ({ id: a.documentId, name: a.name })));
    } catch (err) {
      console.error("Failed to fetch dropdown data:", err);
    }
  };

  useEffect(() => {
    if (user) fetchDropdownData();
  }, [user]);

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (hash) => { window.location.hash = hash; };
  const showNotification = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 6000); };
  const updateData = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const updateNested = (parent, field, value) => setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));

  // Handle Dynamic Creation of New Options
  const handleAddNewBook = async (newTitle) => {
    try {
      const res = await fetch(`${STRAPI_URL}/api/books`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ data: { Title: newTitle } })
      });
      if (res.ok) {
        await fetchDropdownData();
        updateData('book', newTitle);
        showNotification(`Volume "${newTitle}" added to Strapi.`);
      }
    } catch (err) { console.error(err); }
  };

  const handleAddNewAuthor = async (newName, fieldToUpdate) => {
    try {
      const res = await fetch(`${STRAPI_URL}/api/authors`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ data: { name: newName } })
      });
      if (res.ok) {
        await fetchDropdownData();
        if (fieldToUpdate === 'bhashya') updateData('bhashya', newName);
        showNotification(`Author "${newName}" added to Strapi.`);
      }
    } catch (err) { console.error(err); }
  };

  const resetAppSession = () => {
    setVersesQueue([]);
    setFormData({...INITIAL_FORM_STATE});
    setCurrentStep(1);
    navigate('#/dashboard');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setUser({ email: e.target.email.value });
    navigate('#/dashboard');
  };

  const handleSaveAndNext = () => {
    if (!formData.sourceText.trim()) return showNotification("Error: Missing source text.");
    
    const shlokaSnapshot = {
      Verse_Number: parseInt(formData.hierarchyValues.level2) || 1,
      Text: toStrapiBlocks(formData.sourceText),
      Translation: toStrapiBlocks(formData.verseTranslations.english),
      Transliteration: "",
      adhyayTitle: String(formData.hierarchyValues.level1 || ""),
      khandaTitle: String(formData.hierarchyValues.level2 || ""),
      sectionTitle: String(formData.hierarchyValues.level3 || ""),
      Commentry: [
        {
          authorTitle: formData.bhashya || "Principal Bhashya",
          content: toStrapiBlocks(formData.bhashyaContent.sanskrit),
          translation: toStrapiBlocks(formData.bhashyaContent.english),
          tika: formData.teekas.map(t => ({
            authorTitle: t.author,
            content: toStrapiBlocks(t.text),
            translation: toStrapiBlocks(t.englishTranslation)
          }))
        }
      ]
    };

    setVersesQueue([...versesQueue, shlokaSnapshot]);
    const nextValues = { ...formData.hierarchyValues };
    const lastLvlKey = `level${formData.hierarchyCount}`;
    nextValues[lastLvlKey] = (parseInt(nextValues[lastLvlKey]) || 0) + 1 + "";

    setFormData(prev => ({
      ...prev,
      hierarchyValues: nextValues,
      sourceText: '',
      verseTranslations: { english: '', others: [] },
      bhashyaContent: { sanskrit: '', english: '', others: [] },
      teekas: prev.teekas.map(t => ({ ...t, text: '', englishTranslation: '' }))
    }));
    showNotification(`Node cached locally.`);
  };

  const handleFinishAndSubmit = async () => {
    let finalQueue = [...versesQueue];
    if (formData.sourceText.trim()) {
       finalQueue.push({
         Verse_Number: parseInt(formData.hierarchyValues.level2) || 1,
         Text: toStrapiBlocks(formData.sourceText),
         Translation: toStrapiBlocks(formData.verseTranslations.english),
         adhyayTitle: String(formData.hierarchyValues.level1 || ""),
         khandaTitle: String(formData.hierarchyValues.level2 || ""),
         sectionTitle: String(formData.hierarchyValues.level3 || ""),
         Commentry: [{ 
           authorTitle: formData.bhashya, 
           content: toStrapiBlocks(formData.bhashyaContent.sanskrit), 
           translation: toStrapiBlocks(formData.bhashyaContent.english), 
           tika: formData.teekas.map(t => ({ 
             authorTitle: t.author, 
             content: toStrapiBlocks(t.text), 
             translation: toStrapiBlocks(t.englishTranslation) 
           })) 
         }]
       });
    }

    if (finalQueue.length === 0) return showNotification("No content to submit.");

    setIsSubmitting(true);
    try {
      // 1. Link or Find Book (since we might have added it via dropdown)
      const bookLookup = await fetch(`${STRAPI_URL}/api/books?filters[Title][$eq]=${formData.book}`, { headers: getAuthHeaders() });
      const bookData = await bookLookup.json();
      let bookDocId = bookData.data?.[0]?.documentId;

      if (!bookDocId) {
        const bookCreateRes = await fetch(`${STRAPI_URL}/api/books`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ data: { Title: formData.book, description: toStrapiBlocks(formData.bookIntro) } })
        });
        const bookCreateData = await bookCreateRes.json();
        bookDocId = bookCreateData.data.documentId;
      }

      const chapterCache = {}; 
      const sectionCache = {}; 

      for (let i = 0; i < finalQueue.length; i++) {
        const item = finalQueue[i];
        if (!chapterCache[item.adhyayTitle]) {
            const chapRes = await fetch(`${STRAPI_URL}/api/chapters`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ 
                  data: { Title: `${formData.hierarchySanskritNames.level1} ${item.adhyayTitle}`, Chapter_Number: parseInt(item.adhyayTitle) || 1, book: bookDocId } 
                })
            });
            const chapData = await chapRes.json();
            chapterCache[item.adhyayTitle] = chapData.data.documentId;
        }

        let sectionDocId = null;
        if (item.sectionTitle && item.sectionTitle !== "" && item.sectionTitle !== "0") {
            const cacheKey = `${item.adhyayTitle}-${item.sectionTitle}`;
            if (!sectionCache[cacheKey]) {
                const secRes = await fetch(`${STRAPI_URL}/api/sections`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ 
                      data: { Title: `${formData.hierarchySanskritNames.level3} ${item.sectionTitle}`, Section_Number: parseInt(item.sectionTitle) || 1, chapter: chapterCache[item.adhyayTitle] } 
                    })
                });
                const secData = await secRes.json();
                if (secData.data) sectionCache[cacheKey] = secData.data.documentId;
            }
            sectionDocId = sectionCache[cacheKey];
        }

        const payload = {
          data: {
            ...item,
            books: bookDocId, 
            chapter: chapterCache[item.adhyayTitle], 
            section: sectionDocId 
          }
        };

        await fetch(`${STRAPI_URL}/api/shlokas`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      }

      showNotification(`SUCCESS: Relational hierarchy published.`);
      resetAppSession();
    } catch (err) {
      showNotification(`Sync Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDERING ---

  if (route === '#/login' || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4 text-left">
        <div className="w-full max-w-md bg-white p-12 rounded-[3rem] shadow-2xl border border-indigo-50 animate-in fade-in zoom-in duration-700">
          <div className="text-center mb-10">
             <div className="inline-flex items-center gap-4 mb-6">
                <div className="bg-[#D97706] w-14 h-14 rounded-2xl text-white flex items-center justify-center text-3xl shadow-xl">ॐ</div>
                <h1 className="text-4xl font-black text-[#D97706] tracking-tighter text-left">Shloka Portal</h1>
             </div>
             <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] text-center">Administrative Access Only</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input name="email" type="text" placeholder="Username" defaultValue="admin@shlokaportal.com" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-[#D97706] transition-all font-bold text-slate-600" />
            <input name="password" type="password" placeholder="Passkey" defaultValue="123456" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-[#D97706] transition-all font-bold text-slate-600" />
            <button type="submit" className="w-full py-5 bg-[#D97706] text-white rounded-2xl font-black text-xl hover:bg-orange-700 active:scale-95 shadow-2xl transition-all">Initiate Access</button>
          </form>
        </div>
      </div>
    );
  }

  if (route === '#/dashboard') {
    return (
      <div className="min-h-screen bg-[#FDFBF7] text-left">
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-12 py-6 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-4 text-left">
             <span className="text-indigo-600 font-black bg-indigo-50 w-12 h-12 flex items-center justify-center rounded-2xl shadow-sm text-xl border">ॐ</span>
             <h1 className="text-2xl font-black text-slate-800 tracking-tighter text-left">Relational Manager</h1>
          </div>
          <button onClick={() => { setUser(null); navigate('#/login'); }} className="flex items-center gap-2 text-red-500 font-black uppercase tracking-widest text-[10px] bg-red-50 px-5 py-3 rounded-xl hover:bg-red-100 transition-all"><LogOut size={16}/> Logout</button>
        </header>

        <main className="max-w-6xl mx-auto py-32 px-10">
          <div className="text-center mb-24">
             <h2 className="text-6xl font-black text-slate-900 mb-6 tracking-tighter text-center">Digitization Engine</h2>
             <p className="text-slate-400 text-lg font-medium text-center">Coordinate relational data population for manuscripts.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 text-left">
            <div className="group relative bg-white p-16 rounded-[4rem] border shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all cursor-pointer overflow-hidden" onClick={() => navigate('#/edit-list')}>
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-orange-50 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-1000"></div>
              <Edit3 className="text-orange-600 w-20 h-20 mb-10 relative z-10" />
              <h3 className="text-4xl font-black text-slate-800 mb-6 relative z-10">Modify Existing</h3>
              <p className="text-slate-400 leading-relaxed text-lg relative z-10">Adjust existing Shloka records and linked Translation/Commentary components.</p>
            </div>
            <div className="group relative bg-white p-16 rounded-[4rem] border shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all cursor-pointer overflow-hidden" onClick={() => { setVersesQueue([]); setFormData(INITIAL_FORM_STATE); navigate('#/add-entry'); }}>
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-green-50 rounded-full opacity-30 group-hover:scale-150 transition-transform duration-1000"></div>
              <FilePlus className="text-green-600 w-20 h-20 mb-10 relative z-10" />
              <h3 className="text-4xl font-black text-slate-800 mb-6 relative z-10">Archive New</h3>
              <p className="text-slate-400 leading-relaxed text-lg relative z-10">Deploy a fresh relational volume tree including Author, Book, and Shlokas.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-8 font-sans text-slate-900 leading-normal text-left">
      {notification && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-indigo-950 text-white px-10 py-5 rounded-[2rem] shadow-2xl animate-in slide-in-from-top-10 flex items-center gap-4 border-2 border-indigo-500/20 backdrop-blur-xl text-center">
          <AlertCircle size={18}/>
          <span className="font-black text-sm tracking-wide">{notification}</span>
        </div>
      )}

      {isSubmitting && (
        <div className="fixed inset-0 z-[300] bg-indigo-950/60 backdrop-blur-2xl flex flex-col items-center justify-center text-white p-10 text-center">
          <Loader2 className="w-24 h-24 text-white animate-spin mb-10 opacity-80" />
          <h2 className="text-6xl font-black tracking-tighter mb-4 text-center">Relational Tree Sync</h2>
          <p className="text-indigo-200 font-black uppercase tracking-[0.5em] text-xs text-center">Linking {versesQueue.length} Shlokas to Book-Chapter-Section nodes</p>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-10">
        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 flex items-center justify-between text-left">
           <div className="flex items-center gap-8 text-left">
              <button onClick={() => navigate('#/dashboard')} className="p-5 rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all shadow-inner"><ArrowLeft size={32}/></button>
              <div className="text-left">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter text-left">{currentStep === 1 ? 'Manuscript Setup' : 'Node Indexing'}</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 italic text-left">Relational pipeline v2.6</p>
              </div>
           </div>
           <div className="flex gap-6">
              {[1, 2].map(s => (
                <div key={s} className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl transition-all duration-1000 ${currentStep >= s ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40' : 'bg-slate-100 text-slate-300'}`}>
                  {s === 1 ? <BookIcon size={32}/> : <Type size={32}/>}
                </div>
              ))}
           </div>
        </div>

        <div className="bg-white p-20 rounded-[5rem] shadow-2xl border min-h-[800px] relative overflow-hidden text-left">
          {currentStep === 1 ? (
            <div className="space-y-16 animate-in fade-in slide-in-from-bottom-12 duration-1000 text-left">
              <div className="grid grid-cols-2 gap-12 text-left">
                <SelectWithAdd label="Volume Title" options={booksList} value={formData.book} onChange={(v) => updateData('book', v)} onAdd={handleAddNewBook} />
                <SelectWithAdd label="Bhashya Lineage (Author)" options={authorsList} value={formData.bhashya} onChange={(v) => updateData('bhashya', v)} onAdd={(v) => handleAddNewAuthor(v, 'bhashya')} />
              </div>
              <div className="grid gap-10 text-left">
                <div className="space-y-3 text-left">
                   <label className="text-xs font-black text-slate-400 uppercase ml-6 block text-left">Book Description</label>
                   <textarea rows={4} className="w-full p-8 bg-slate-50 border-2 rounded-[2.5rem] outline-none text-sm font-bold shadow-inner" placeholder="Archival context..." value={formData.bookIntro} onChange={(e) => updateData('bookIntro', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-10 text-left">
                  <div className="space-y-3 text-left">
                    <label className="text-xs font-black text-indigo-400 uppercase ml-6 tracking-widest block text-left">Sanskrit Prologue</label>
                    <textarea rows={5} className="w-full p-8 bg-indigo-50/20 border-2 border-indigo-50 rounded-[2.5rem] font-serif text-xl outline-none focus:bg-white transition-all shadow-sm" placeholder="मङ्गलाचरणम्..." value={formData.shankaracharyaIntro} onChange={(e) => updateData('shankaracharyaIntro', filterDevanagari(e.target.value))} />
                  </div>
                  <div className="space-y-3 text-left">
                    <label className="text-xs font-black text-slate-400 uppercase ml-6 block text-left">English Rendering</label>
                    <textarea rows={5} className="w-full p-8 bg-slate-50 border-2 rounded-[2.5rem] outline-none text-sm font-bold shadow-sm" placeholder="Preface translation..." value={formData.shankaracharyaIntroTranslation} onChange={(e) => updateData('shankaracharyaIntroTranslation', filterEnglish(e.target.value))} />
                  </div>
                </div>
              </div>

              <div className="pt-16 border-t-2 border-slate-50 text-left">
                <div className="flex items-center justify-between mb-8 text-left">
                  <div className="text-left">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter text-left">Hierarchy Structural Depth</h3>
                    <p className="text-sm text-slate-400 font-bold uppercase mt-1 italic tracking-widest text-left text-left">Define metadata labels for your structural levels.</p>
                  </div>
                  <div className="flex gap-10 items-center bg-slate-50 p-6 rounded-[3rem] shadow-inner border-2 border-slate-100">
                      <button className="w-16 h-16 bg-white shadow-xl rounded-3xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-all" onClick={() => updateData('hierarchyCount', Math.max(1, formData.hierarchyCount - 1))}><Minus size={32}/></button>
                      <span className="text-6xl font-black text-indigo-600 min-w-[5rem] text-center">{formData.hierarchyCount}</span>
                      <button className="w-16 h-16 bg-white shadow-xl rounded-3xl flex items-center justify-center text-slate-400 hover:text-green-500 transition-all" onClick={() => updateData('hierarchyCount', Math.min(4, formData.hierarchyCount + 1))}><Plus size={32}/></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 text-left">
                  {['level1', 'level2', 'level3', 'level4'].slice(0, formData.hierarchyCount).map((level, idx) => (
                    <div key={level} className="text-left">
                      <label className="text-xs font-black text-slate-400 uppercase ml-2 block mb-2 tracking-widest text-left">स्तर {idx+1} नाम (उदा. अध्याय)</label>
                      <input type="text" className="w-full p-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-400 font-serif font-bold text-indigo-900 bg-indigo-50/20" value={formData.hierarchySanskritNames[level]} onChange={(e) => updateNested('hierarchySanskritNames', level, filterDevanagari(e.target.value))} placeholder="उदा. अध्याय" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-16 border-t-2 border-slate-50 text-left">
                <h3 className="text-xs font-black mb-8 uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3 text-left"><Languages size={20}/> Tika Allocations</h3>
                <div className="grid grid-cols-2 gap-6 text-left">
                  {formData.selectedTeekas.map((teeka, idx) => (
                    <div key={idx} className="flex gap-3 animate-in zoom-in duration-500 text-left">
                      <SelectWithAdd options={authorsList} value={teeka} onChange={(v) => {
                        const newList = [...formData.selectedTeekas]; newList[idx] = v; updateData('selectedTeekas', newList);
                      }} onAdd={(v) => handleAddNewAuthor(v, null)} />
                      {formData.selectedTeekas.length > 1 && (
                        <button onClick={() => updateData('selectedTeekas', formData.selectedTeekas.filter((_, i) => i !== idx))} className="bg-red-50 text-red-400 p-4 rounded-2xl hover:bg-red-100 transition-all border-2 border-red-50"><Trash2 size={20} /></button>
                      )}
                    </div>
                  ))}
                </div>
                <button className="text-[10px] font-black text-indigo-600 flex items-center gap-2 mt-8 bg-indigo-50 px-8 py-4 rounded-2xl hover:bg-indigo-100 transition-all uppercase tracking-widest text-left" onClick={() => updateData('selectedTeekas', [...formData.selectedTeekas, ''])}>
                  <Plus size={16}/> Add Sub-Commentary Slot
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-16 animate-in fade-in slide-in-from-right-12 duration-1000 text-left">
              <div className="bg-indigo-950 p-12 rounded-[4rem] shadow-2xl flex items-center justify-between border-4 border-indigo-900/50">
                {['level1', 'level2', 'level3', 'level4'].slice(0, formData.hierarchyCount).map((lvl) => (
                  <div key={lvl} className="text-center px-10 border-r-2 border-indigo-900 last:border-0 text-left">
                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-4 block tracking-widest text-left">{formData.hierarchySanskritNames[lvl]}</label>
                    <input type="text" className="bg-transparent text-white text-5xl font-black outline-none w-24 text-center border-b-4 border-indigo-800 focus:border-white transition-all" value={formData.hierarchyValues[lvl]} onChange={(e) => updateNested('hierarchyValues', lvl, e.target.value)} />
                  </div>
                ))}
                <div className="bg-indigo-900/50 p-8 rounded-[2.5rem] border-2 border-indigo-800/30 text-right text-left">
                   <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest text-left">Active Queue</p>
                   <p className="text-4xl font-black text-white">{versesQueue.length} <span className="text-sm text-indigo-600 italic">Indexed</span></p>
                </div>
              </div>
              <div className="space-y-6 text-left">
                <div className="flex items-center gap-4 ml-8 text-slate-300 tracking-[0.3em] uppercase text-[10px] font-black text-left">
                   <Sparkles size={24}/> Manuscript Core (Devanagari)
                </div>
                <textarea rows={6} className="w-full p-12 border-4 border-slate-50 rounded-[4rem] font-serif text-4xl outline-none focus:border-indigo-100 transition-all bg-slate-50/30 leading-relaxed shadow-inner" placeholder="धर्मक्षेत्रे..." value={formData.sourceText} onChange={(e) => updateData('sourceText', filterDevanagari(e.target.value))} />
              </div>
              <div className="grid gap-12 text-left">
                <div className="space-y-4 text-left">
                   <label className="text-xs font-black text-slate-400 uppercase ml-10 tracking-widest text-left">English Translation</label>
                   <textarea rows={3} className="w-full p-10 border-2 border-slate-100 rounded-[3rem] outline-none text-xl font-bold shadow-sm focus:border-indigo-200 transition-all" placeholder="Enter translation..." value={formData.verseTranslations.english} onChange={(e) => updateNested('verseTranslations', 'english', filterEnglish(e.target.value))} />
                </div>
                <div className="grid grid-cols-2 gap-12 text-left">
                  <div className="space-y-4 text-left">
                    <label className="text-xs font-black text-indigo-400 uppercase ml-10 tracking-widest block text-left">Bhashyam (Sanskrit)</label>
                    <textarea rows={6} className="w-full p-10 bg-indigo-50/10 border-2 border-indigo-50 rounded-[3rem] font-serif text-2xl outline-none focus:bg-white transition-all shadow-sm focus:border-indigo-200" value={formData.bhashyaContent.sanskrit} onChange={(e) => updateNested('bhashyaContent', 'sanskrit', filterDevanagari(e.target.value))} />
                  </div>
                  <div className="space-y-4 text-left">
                    <label className="text-xs font-black text-slate-400 uppercase ml-10 tracking-widest block text-left">Bhashyam (English)</label>
                    <textarea rows={6} className="w-full p-10 bg-slate-50 border-2 rounded-[3rem] outline-none text-sm font-bold shadow-sm focus:border-indigo-200 transition-all" value={formData.bhashyaContent.english} onChange={(e) => updateNested('bhashyaContent', 'english', filterEnglish(e.target.value))} />
                  </div>
                </div>
              </div>
              
              <div className="space-y-12 pt-20 border-t-2 text-left">
                <div className="flex items-center gap-6">
                   <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Relational Tika Nodes</h3>
                   <div className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase border tracking-widest text-left">{formData.teekas.length} Authors Linked</div>
                </div>
                {formData.teekas.map((teeka, idx) => (
                  <div key={idx} className="p-12 bg-slate-50 rounded-[5rem] border border-slate-100 space-y-10 hover:shadow-2xl transition-all group relative overflow-hidden text-left">
                    <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 opacity-20"></div>
                    <div className="flex justify-between items-center px-6 text-left">
                       <div className="flex items-center gap-4 text-left text-left">
                          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
                          <span className="text-lg font-black uppercase text-indigo-600 tracking-tighter">{teeka.author}</span>
                       </div>
                       <MessageSquare size={28} className="text-slate-200 group-hover:text-indigo-400 transition-all"/>
                    </div>
                    <div className="grid gap-8 text-left text-left">
                       <textarea rows={4} className="w-full p-10 bg-white border-2 border-slate-100 rounded-[3rem] font-serif text-2xl outline-none shadow-sm focus:border-indigo-300 transition-all" placeholder={`Tika Sanskrit...`} value={teeka.text} onChange={(e) => {
                          const news = [...formData.teekas]; news[idx].text = filterDevanagari(e.target.value); updateData('teekas', news);
                       }} />
                       <textarea rows={3} className="w-full p-10 bg-white border-2 border-slate-100 rounded-[3rem] outline-none text-sm font-bold leading-relaxed shadow-sm focus:border-indigo-300 transition-all" placeholder="Tika English..." value={teeka.englishTranslation} onChange={(e) => {
                          const news = [...formData.teekas]; news[idx].englishTranslation = filterEnglish(e.target.value); updateData('teekas', news);
                       }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white/90 p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 flex justify-between items-center sticky bottom-10 z-[150] backdrop-blur-3xl text-left">
          <div className="flex gap-6 text-left">
             <button onClick={() => { if(currentStep === 2) setCurrentStep(1); else navigate('#/dashboard'); }} className="px-12 py-6 rounded-[2rem] font-black text-slate-400 hover:bg-slate-50 transition-all uppercase tracking-[0.2em] text-[10px]">Back</button>
             {versesQueue.length > 0 && (
                <div className="bg-orange-50 text-orange-600 px-8 py-6 rounded-[2rem] flex items-center gap-4 border-2 border-orange-100 animate-in slide-in-from-left-4">
                   <div className="w-3 h-3 bg-orange-600 rounded-full animate-ping"></div>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em]">{versesQueue.length} Linked Nodes Buffered</span>
                </div>
             )}
          </div>
          <div className="flex gap-6 text-left">
            {currentStep === 1 ? (
              <button onClick={() => {
                const syncedTeekas = formData.selectedTeekas.filter(a => a.trim() !== '').map((a, i) => ({ id: Date.now() + i, name: '', author: a, text: '', englishTranslation: '' }));
                setFormData(prev => ({ ...prev, teekas: syncedTeekas }));
                setCurrentStep(2);
              }} disabled={!formData.book} className="px-16 py-6 bg-indigo-600 text-white rounded-[2rem] flex items-center gap-5 font-black hover:bg-indigo-700 shadow-2xl uppercase tracking-widest text-xs border-b-8 border-indigo-800 transition-all active:scale-95">Transcription Phase <ChevronRight size={24}/></button>
            ) : (
              <>
                <button onClick={handleSaveAndNext} disabled={!formData.sourceText.trim() || isSubmitting} className="px-10 py-6 bg-indigo-600 text-white rounded-[2rem] flex items-center gap-4 font-black hover:bg-indigo-700 shadow-2xl uppercase tracking-widest text-xs border-b-8 border-indigo-800 transition-all active:scale-95"><Plus size={26}/> Index Current Node</button>
                <button onClick={handleFinishAndSubmit} disabled={isSubmitting} className="px-16 py-6 bg-green-600 text-white rounded-[2rem] font-black hover:bg-green-700 shadow-2xl active:scale-95 transition-all flex items-center gap-4 uppercase tracking-widest text-xs border-b-8 border-green-800">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <CloudUpload size={26}/>} Sync Archive
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}