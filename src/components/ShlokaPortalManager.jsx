import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, ChevronRight, ChevronLeft, Check, Globe, Wand2, 
  BookOpen, Sparkles, X, CloudUpload, Minus, Database, LogOut, 
  Search, Edit3, ArrowLeft, LayoutDashboard, FilePlus, Loader2,
  Book as BookIcon, Type, Languages, MessageSquare, AlertCircle
} from 'lucide-react';
import { STRAPI_URL, STRAPI_API_TOKEN, INITIAL_FORM_STATE } from '../utils/constants';
import { filterDevanagari, filterEnglish, toStrapiBlocks } from '../utils/helpers';
import SelectWithAdd from './SelectWithAdd';

const ShlokaPortalManager = ({ onNavigate }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null); // { verses: [], onProceed, onCancel }
  const [notification, setNotification] = useState(null);
  const [versesQueue, setVersesQueue] = useState([]); 
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [booksList, setBooksList] = useState([]);
  const [authorsList, setAuthorsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);

  const getAuthHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${STRAPI_API_TOKEN}` });

  const fetchDropdownData = async () => {
    try {
      const [booksRes, authorsRes, categoriesRes] = await Promise.all([
        fetch(`${STRAPI_URL}/api/books?fields[0]=Title&pagination[limit]=100`, { headers: getAuthHeaders() }),
        fetch(`${STRAPI_URL}/api/authors?fields[0]=name&pagination[limit]=100`, { headers: getAuthHeaders() }),
        fetch(`${STRAPI_URL}/api/categories?fields[0]=Name&pagination[limit]=100`, { headers: getAuthHeaders() })
      ]);
      const booksData = await booksRes.json();
      const authorsData = await authorsRes.json();
      const categoriesData = await categoriesRes.json();
      
      if (booksData.data) setBooksList(booksData.data.map(b => ({ id: b.documentId, name: b.Title })));
      if (authorsData.data) setAuthorsList(authorsData.data.map(a => ({ id: a.documentId, name: a.name })));
      if (categoriesData.data) setCategoriesList(categoriesData.data.map(c => ({ id: c.documentId, name: c.Name })));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchDropdownData(); }, []);

  useEffect(() => {
    const fetchExistingBookIntro = async () => {
      if (!formData.book || formData.book === '') return;
      try {
        const res = await fetch(`${STRAPI_URL}/api/books?filters[Title][$eq]=${formData.book}&fields[0]=description&fields[1]=shankaracharyaIntro&fields[2]=shankaracharyaIntroTranslation&populate[category][fields][0]=Name`, { headers: getAuthHeaders() });
        const data = await res.json();
        const book = data.data?.[0];
        if (book) {
          if (book.category?.Name) updateData('category', book.category.Name);
        }
      } catch (err) { console.error("Failed to fetch existing book data:", err); }
    };
    fetchExistingBookIntro();
  }, [formData.book]);

  const handleAddNewCategory = async (newName) => {
    const res = await fetch(`${STRAPI_URL}/api/categories`, { 
      method: 'POST', 
      headers: getAuthHeaders(), 
      body: JSON.stringify({ data: { Name: newName } }) 
    });
    if (res.ok) { 
      await fetchDropdownData(); 
      updateData('category', newName); 
      showNotification(`Category "${newName}" added.`); 
    }
  };

  const showNotification = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 6000); };
  const updateData = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const updateNested = (parent, field, value) => setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));

  const handleAddNewBook = async (newTitle) => {
    const res = await fetch(`${STRAPI_URL}/api/books`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ data: { Title: newTitle } }) });
    if (res.ok) { await fetchDropdownData(); updateData('book', newTitle); showNotification(`Volume "${newTitle}" added.`); }
  };

  const handleAddNewAuthor = async (newName, field) => {
    const res = await fetch(`${STRAPI_URL}/api/authors`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ data: { name: newName } }) });
    if (res.ok) { await fetchDropdownData(); if (field === 'bhashya') updateData('bhashya', newName); showNotification(`Author "${newName}" added.`); }
  };

  const handleSaveAndNext = () => {
    if (!formData.sourceText.trim()) return showNotification("Error: Missing source text.");
    const snapshot = {
      Verse_Number: parseInt(formData.hierarchyValues.level2) || 1,
      Text: toStrapiBlocks(formData.sourceText),
      Translation: toStrapiBlocks(formData.verseTranslations.english),
      adhyayTitle: String(formData.hierarchyValues.level1 || ""),
      khandaTitle: String(formData.hierarchyValues.level2 || ""),
      sectionTitle: String(formData.hierarchyValues.level3 || ""),
      Commentry: [{
        authorTitle: formData.bhashya || "Principal Bhashya",
        content: toStrapiBlocks(formData.bhashyaContent.sanskrit),
        translation: toStrapiBlocks(formData.bhashyaContent.english),
        tika: formData.teekas.map(t => ({ authorTitle: t.author, content: toStrapiBlocks(t.text), translation: toStrapiBlocks(t.englishTranslation) }))
      }]
    };
    setVersesQueue([...versesQueue, snapshot]);
    const nextValues = { ...formData.hierarchyValues };
    const lastLvlKey = `level${formData.hierarchyCount}`;
    nextValues[lastLvlKey] = (parseInt(nextValues[lastLvlKey]) || 0) + 1 + "";
    setFormData(prev => ({ ...prev, hierarchyValues: nextValues, sourceText: '', verseTranslations: { english: '', others: [] }, bhashyaContent: { sanskrit: '', english: '', others: [] }, teekas: prev.teekas.map(t => ({ ...t, text: '', englishTranslation: '' })) }));
    showNotification(`Node cached locally.`);
  };

  // Extracted submit loop — called after duplicate check resolves
  const submitQueue = async (queue, bookDocId, findOrCreateChapter, findOrCreateSection) => {
    for (const item of queue) {
      const chapterDocId = await findOrCreateChapter(item.adhyayTitle);
      let sDocId = null;
      if (item.sectionTitle && item.sectionTitle !== "" && item.sectionTitle !== "0") {
        sDocId = await findOrCreateSection(item.adhyayTitle, item.sectionTitle, chapterDocId);
      }
      const { adhyayTitle, khandaTitle, sectionTitle, ...shlokaFields } = item;
      await fetch(`${STRAPI_URL}/api/shlokas`, {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ data: {
          ...shlokaFields,
          books:   { connect: [bookDocId] },
          chapter: { connect: [chapterDocId] },
          ...(sDocId ? { section: { connect: [sDocId] } } : {}),
        }})
      });
    }
    showNotification('SUCCESS: Sync complete.');
    setVersesQueue([]);
    setFormData({...INITIAL_FORM_STATE});
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
           authorTitle: formData.bhashya, content: toStrapiBlocks(formData.bhashyaContent.sanskrit), translation: toStrapiBlocks(formData.bhashyaContent.english), 
           tika: formData.teekas.map(t => ({ authorTitle: t.author, content: toStrapiBlocks(t.text), translation: toStrapiBlocks(t.englishTranslation) })) 
         }]
       });
    }
    if (finalQueue.length === 0) return showNotification("No content.");
    setIsSubmitting(true);
    try {
      const bookLookup = await fetch(`${STRAPI_URL}/api/books?filters[Title][$eq]=${formData.book}`, { headers: getAuthHeaders() });
      const bLookupData = await bookLookup.json();
      let bookDocId = bLookupData.data?.[0]?.documentId;

      const selectedCategory = categoriesList.find(c => c.name === formData.category);
      const categoryId = selectedCategory?.id || null;

      if (!bookDocId) {
        const bRes = await fetch(`${STRAPI_URL}/api/books`, { 
          method: 'POST', 
          headers: getAuthHeaders(), 
          body: JSON.stringify({ 
            data: { 
              Title: formData.book, 
              description: toStrapiBlocks(formData.bookIntro),
              shankaracharyaIntro: formData.shankaracharyaIntro,
              shankaracharyaIntroTranslation: formData.shankaracharyaIntroTranslation,
              category: categoryId
            } 
          }) 
        });
        const bData = await bRes.json();
        bookDocId = bData.data.documentId;
      } else {
        await fetch(`${STRAPI_URL}/api/books/${bookDocId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ 
            data: { 
              description: toStrapiBlocks(formData.bookIntro),
              shankaracharyaIntro: formData.shankaracharyaIntro,
              shankaracharyaIntroTranslation: formData.shankaracharyaIntroTranslation,
              category: categoryId
            } 
          })
        });
      }

      // ── FIND-OR-CREATE: chapters ─────────────────────────────────────────────
      // Silently reuse existing chapters/sections rather than creating duplicates.
      const chapCache = {};
      const secCache  = {};

      const findOrCreateChapter = async (adhyayTitle) => {
        if (chapCache[adhyayTitle]) return chapCache[adhyayTitle];
        const chNum = parseInt(adhyayTitle) || 1;
        // Check if chapter already exists for this book + number
        const existing = await fetch(
          `${STRAPI_URL}/api/shlokas?filters[books][documentId][$eq]=${bookDocId}` +
          `&filters[section][chapter][Chapter_Number][$eq]=${chNum}` +
          `&fields[0]=Verse_Number&populate[section][populate][chapter][fields][0]=documentId&populate[section][populate][chapter][fields][1]=Chapter_Number&pagination[limit]=1`,
          { headers: getAuthHeaders() }
        );
        const exData = await existing.json();
        const existingChDocId = exData.data?.[0]?.section?.chapter?.documentId;
        if (existingChDocId) {
          chapCache[adhyayTitle] = existingChDocId;
          return existingChDocId;
        }
        // Not found — create fresh
        const cRes = await fetch(`${STRAPI_URL}/api/chapters`, {
          method: 'POST', headers: getAuthHeaders(),
          body: JSON.stringify({ data: {
            Title: `${formData.hierarchySanskritNames.level1} ${adhyayTitle}`,
            Chapter_Number: chNum,
            book: { connect: [bookDocId] },
          }})
        });
        const cData = await cRes.json();
        if (!cData.data) throw new Error(`Chapter creation failed: ${JSON.stringify(cData.error)}`);
        chapCache[adhyayTitle] = cData.data.documentId;
        return cData.data.documentId;
      };

      // ── FIND-OR-CREATE: sections ──────────────────────────────────────────
      const findOrCreateSection = async (adhyayTitle, sectionTitle, chapterDocId) => {
        const key = `${adhyayTitle}-${sectionTitle}`;
        if (secCache[key]) return secCache[key];
        const secNum = parseInt(sectionTitle) || 1;
        // Check if section already exists under this chapter
        const existing = await fetch(
          `${STRAPI_URL}/api/sections` +
          `?filters[chapter][documentId][$eq]=${chapterDocId}` +
          `&filters[Section_Number][$eq]=${secNum}` +
          `&fields[0]=documentId&pagination[limit]=1`,
          { headers: getAuthHeaders() }
        );
        const exData = await existing.json();
        const existingSecDocId = exData.data?.[0]?.documentId;
        if (existingSecDocId) {
          secCache[key] = existingSecDocId;
          return existingSecDocId;
        }
        // Not found — create fresh
        const sRes = await fetch(`${STRAPI_URL}/api/sections`, {
          method: 'POST', headers: getAuthHeaders(),
          body: JSON.stringify({ data: {
            Title: `${formData.hierarchySanskritNames.level3} ${sectionTitle}`,
            Section_Number: secNum,
            chapter: { connect: [chapterDocId] },
          }})
        });
        const sData = await sRes.json();
        if (!sData.data) throw new Error(`Section creation failed: ${JSON.stringify(sData.error)}`);
        secCache[key] = sData.data.documentId;
        return sData.data.documentId;
      };

      // ── DUPLICATE SHLOKA CHECK ────────────────────────────────────────────
      // Before writing anything, check if any verse numbers already exist
      // in this book at the same chapter/section position.
      const duplicates = [];
      for (const item of finalQueue) {
        const chNum  = parseInt(item.adhyayTitle) || 1;
        const secNum = parseInt(item.sectionTitle) || 0;
        const query  = secNum > 0
          ? `filters[books][documentId][$eq]=${bookDocId}&filters[section][chapter][Chapter_Number][$eq]=${chNum}&filters[section][Section_Number][$eq]=${secNum}&filters[Verse_Number][$eq]=${item.Verse_Number}`
          : `filters[books][documentId][$eq]=${bookDocId}&filters[section][chapter][Chapter_Number][$eq]=${chNum}&filters[Verse_Number][$eq]=${item.Verse_Number}`;
        const dupRes  = await fetch(`${STRAPI_URL}/api/shlokas?${query}&fields[0]=Verse_Number&pagination[limit]=1`, { headers: getAuthHeaders() });
        const dupData = await dupRes.json();
        if (dupData.data?.length > 0) {
          duplicates.push({
            label: `${item.adhyayTitle}${secNum > 0 ? `.${secNum}` : ''}.${item.Verse_Number}`,
            verse: item,
          });
        }
      }

      // If duplicates found — pause and show warning modal, let user decide
      if (duplicates.length > 0) {
        setIsSubmitting(false);
        await new Promise((resolve, reject) => {
          setDuplicateWarning({
            duplicates,
            onSkip: () => {
              setDuplicateWarning(null);
              // Remove duplicates from queue and continue with remaining
              const dupLabels = new Set(duplicates.map(d => d.label));
              const filtered = finalQueue.filter(item => {
                const secNum = parseInt(item.sectionTitle) || 0;
                const label = `${item.adhyayTitle}${secNum > 0 ? `.${secNum}` : ''}.${item.Verse_Number}`;
                return !dupLabels.has(label);
              });
              if (filtered.length === 0) {
                showNotification('All verses already exist. Nothing to sync.');
                resolve('abort');
              } else {
                resolve({ filtered });
              }
            },
            onOverwrite: () => { setDuplicateWarning(null); resolve({ filtered: finalQueue }); },
            onCancel:    () => { setDuplicateWarning(null); reject(new Error('Cancelled by user.')); },
          });
        }).then(async (result) => {
          if (result === 'abort') return;
          setIsSubmitting(true);
          await submitQueue(result.filtered, bookDocId, findOrCreateChapter, findOrCreateSection);
          onNavigate('#/dashboard');
        }).catch((err) => {
          if (err.message !== 'Cancelled by user.') showNotification(`Error: ${err.message}`);
        }).finally(() => setIsSubmitting(false));
        return;
      }

      await submitQueue(finalQueue, bookDocId, findOrCreateChapter, findOrCreateSection);
      onNavigate('#/dashboard');
    } catch (err) { showNotification(`Error: ${err.message}`); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-8 font-sans text-slate-900 leading-normal text-left">
      {notification && <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-indigo-950 text-white px-10 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 border-2 border-indigo-500/20 backdrop-blur-xl">
        <AlertCircle size={18}/><span>{notification}</span></div>}
      
      {/* ── DUPLICATE WARNING MODAL ─────────────────────────────────────── */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-[400] bg-slate-900/70 backdrop-blur-xl flex items-center justify-center p-8">
          <div className="bg-white rounded-[3rem] shadow-2xl border border-amber-100 p-12 max-w-lg w-full">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} className="text-amber-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter text-center mb-2">
              Duplicate Verses Detected
            </h3>
            <p className="text-slate-400 text-sm font-medium text-center mb-6">
              The following verse positions already exist in this book:
            </p>
            <div className="bg-amber-50 rounded-2xl p-4 mb-8 flex flex-wrap gap-2 justify-center">
              {duplicateWarning.duplicates.map((d, i) => (
                <span key={i} className="bg-white border border-amber-200 text-amber-700 px-3 py-1 rounded-lg text-xs font-black">
                  {d.label}
                </span>
              ))}
            </div>
            <div className="space-y-3">
              <button
                onClick={duplicateWarning.onSkip}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all"
              >
                Skip Duplicates — Add Only New Verses
              </button>
              <button
                onClick={duplicateWarning.onOverwrite}
                className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-sm hover:bg-amber-600 transition-all"
              >
                Overwrite — Replace All (Including Duplicates)
              </button>
              <button
                onClick={duplicateWarning.onCancel}
                className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all"
              >
                Cancel — Go Back and Review
              </button>
            </div>
          </div>
        </div>
      )}

      {isSubmitting && <div className="fixed inset-0 z-[300] bg-indigo-950/60 backdrop-blur-2xl flex flex-col items-center justify-center text-white p-10 text-center">
        <Loader2 className="w-24 h-24 text-white animate-spin mb-10 opacity-80" /><h2 className="text-6xl font-black tracking-tighter mb-4 text-center">Relational Tree Sync</h2></div>}

      <div className="max-w-5xl mx-auto space-y-10">
        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 flex items-center justify-between text-left">
           <div className="flex items-center gap-8 text-left">
              <button onClick={() => onNavigate('#/dashboard')} className="p-5 rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all shadow-inner"><ArrowLeft size={32}/></button>
              <div className="text-left"><h1 className="text-4xl font-black text-slate-900 tracking-tighter text-left">{currentStep === 1 ? 'Manuscript Setup' : 'Node Indexing'}</h1><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 italic text-left">Relational pipeline v2.6</p></div>
           </div>
           <div className="flex gap-6">
              {[1, 2].map(s => (<div key={s} className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl transition-all duration-1000 ${currentStep >= s ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40' : 'bg-slate-100 text-slate-300'}`}>{s === 1 ? <BookIcon size={32}/> : <Type size={32}/>}</div>))}
           </div>
        </div>

        <div className="bg-white p-20 rounded-[5rem] shadow-2xl border min-h-[800px] relative overflow-hidden text-left">
          {currentStep === 1 ? (
            <div className="space-y-16 animate-in fade-in slide-in-from-bottom-12 duration-1000 text-left">
              <div className="grid gap-10 text-left">
                <div className="grid grid-cols-3 gap-12 text-left">
                  <SelectWithAdd label="Category" options={categoriesList} value={formData.category} onChange={(v) => updateData('category', v)} onAdd={handleAddNewCategory} placeholder="Select Category..." />
                  <SelectWithAdd label="Volume Title" options={booksList} value={formData.book} onChange={(v) => updateData('book', v)} onAdd={handleAddNewBook} />
                  <SelectWithAdd label="Bhashya Lineage (Author)" options={authorsList} value={formData.bhashya} onChange={(v) => updateData('bhashya', v)} onAdd={(v) => handleAddNewAuthor(v, 'bhashya')} />
                </div>
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
                      <SelectWithAdd options={authorsList} value={teeka} onChange={(v) => { const newList = [...formData.selectedTeekas]; newList[idx] = v; updateData('selectedTeekas', newList); }} onAdd={(v) => handleAddNewAuthor(v, null)} />
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
                  <div key={lvl} className="text-center px-10 border-r-2 border-indigo-900 last:border-0 text-left"><label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-4 block tracking-widest text-left">{formData.hierarchySanskritNames[lvl]}</label><input type="text" className="bg-transparent text-white text-5xl font-black outline-none w-24 text-center border-b-4 border-indigo-800 focus:border-white transition-all" value={formData.hierarchyValues[lvl]} onChange={(e) => updateNested('hierarchyValues', lvl, e.target.value)} /></div>
                ))}
                <div className="bg-indigo-900/50 p-8 rounded-[2.5rem] border-2 border-indigo-800/30 text-right text-left"><p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest text-left">Active Queue</p><p className="text-4xl font-black text-white">{versesQueue.length} <span className="text-sm text-indigo-600 italic">Indexed</span></p></div>
              </div>
              <div className="space-y-6 text-left"><div className="flex items-center gap-4 ml-8 text-slate-300 tracking-[0.3em] uppercase text-[10px] font-black text-left"><Sparkles size={24}/> Manuscript Core (Devanagari)</div><textarea rows={6} className="w-full p-12 border-4 border-slate-50 rounded-[4rem] font-serif text-4xl outline-none focus:border-indigo-100 transition-all bg-slate-50/30 leading-relaxed shadow-inner" placeholder="धर्मक्षेत्रे..." value={formData.sourceText} onChange={(e) => updateData('sourceText', filterDevanagari(e.target.value))} /></div>
              <div className="grid gap-12 text-left">
                <div className="space-y-4 text-left"><label className="text-xs font-black text-slate-400 uppercase ml-10 tracking-widest text-left">English Translation</label><textarea rows={3} className="w-full p-10 border-2 border-slate-100 rounded-[3rem] outline-none text-xl font-bold shadow-sm focus:border-indigo-200 transition-all" placeholder="Enter translation..." value={formData.verseTranslations.english} onChange={(e) => updateNested('verseTranslations', 'english', filterEnglish(e.target.value))} /></div>
                <div className="grid grid-cols-2 gap-12 text-left">
                  <div className="space-y-4 text-left"><label className="text-xs font-black text-indigo-400 uppercase ml-10 tracking-widest block text-left">Bhashyam (Sanskrit)</label><textarea rows={6} className="w-full p-10 bg-indigo-50/10 border-2 border-indigo-50 rounded-[3rem] font-serif text-2xl outline-none focus:bg-white transition-all shadow-sm focus:border-indigo-200" value={formData.bhashyaContent.sanskrit} onChange={(e) => updateNested('bhashyaContent', 'sanskrit', filterDevanagari(e.target.value))} /></div>
                  <div className="space-y-4 text-left"><label className="text-xs font-black text-slate-400 uppercase ml-10 tracking-widest block text-left">Bhashyam (English)</label><textarea rows={6} className="w-full p-10 bg-slate-50 border-2 rounded-[3rem] outline-none text-sm font-bold shadow-sm focus:border-indigo-200 transition-all" value={formData.bhashyaContent.english} onChange={(e) => updateNested('bhashyaContent', 'english', filterEnglish(e.target.value))} /></div>
                </div>
              </div>
              <div className="space-y-12 pt-20 border-t-2 text-left">
                <div className="flex items-center gap-6"><h3 className="text-4xl font-black text-slate-900 tracking-tighter">Relational Tika Nodes</h3><div className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase border tracking-widest text-left">{formData.teekas.length} Authors Linked</div></div>
                {formData.teekas.map((teeka, idx) => (
                  <div key={idx} className="p-12 bg-slate-50 rounded-[5rem] border border-slate-100 space-y-10 hover:shadow-2xl transition-all group relative overflow-hidden text-left">
                    <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 opacity-20"></div>
                    <div className="flex justify-between items-center px-6 text-left"><div className="flex items-center gap-4 text-left"><div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div><span className="text-lg font-black uppercase text-indigo-600 tracking-tighter">{teeka.author}</span></div><MessageSquare size={28} className="text-slate-200 group-hover:text-indigo-400 transition-all"/></div>
                    <div className="grid gap-8 text-left"><textarea rows={4} className="w-full p-10 bg-white border-2 border-slate-100 rounded-[3rem] font-serif text-2xl outline-none shadow-sm focus:border-indigo-300 transition-all" placeholder={`Tika Sanskrit...`} value={teeka.text} onChange={(e) => { const news = [...formData.teekas]; news[idx].text = filterDevanagari(e.target.value); updateData('teekas', news); }} /><textarea rows={3} className="w-full p-10 bg-white border-2 border-slate-100 rounded-[3rem] outline-none text-sm font-bold leading-relaxed shadow-sm focus:border-indigo-300 transition-all" placeholder="Tika English..." value={teeka.englishTranslation} onChange={(e) => { const news = [...formData.teekas]; news[idx].englishTranslation = filterEnglish(e.target.value); updateData('teekas', news); }} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white/90 p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 flex justify-between items-center sticky bottom-10 z-[150] backdrop-blur-3xl text-left">
          <div className="flex gap-6 text-left">
             <button onClick={() => { if(currentStep === 2) setCurrentStep(1); else onNavigate('#/dashboard'); }} className="px-12 py-6 rounded-[2rem] font-black text-slate-400 hover:bg-slate-50 transition-all uppercase tracking-[0.2em] text-[10px]">Back</button>
             {versesQueue.length > 0 && <div className="bg-orange-50 text-orange-600 px-8 py-6 rounded-[2rem] flex items-center gap-4 border-2 border-orange-100 animate-in slide-in-from-left-4"><div className="w-3 h-3 bg-orange-600 rounded-full animate-ping"></div><span className="text-[10px] font-black uppercase tracking-[0.3em]">{versesQueue.length} Linked Nodes Buffered</span></div>}
          </div>
          <div className="flex gap-6 text-left">
            {currentStep === 1 ? (
              <button onClick={() => { const syncedTeekas = formData.selectedTeekas.filter(a => a.trim() !== '').map((a, i) => ({ id: Date.now() + i, name: '', author: a, text: '', englishTranslation: '' })); setFormData(prev => ({ ...prev, teekas: syncedTeekas })); setCurrentStep(2); }} disabled={!formData.book} className="px-16 py-6 bg-indigo-600 text-white rounded-[2rem] flex items-center gap-5 font-black hover:bg-indigo-700 shadow-2xl uppercase tracking-widest text-xs border-b-8 border-indigo-800 transition-all active:scale-95">Transcription Phase <ChevronRight size={24}/></button>
            ) : (
              <>
                <button onClick={handleSaveAndNext} disabled={!formData.sourceText.trim() || isSubmitting} className="px-10 py-6 bg-indigo-600 text-white rounded-[2rem] flex items-center gap-4 font-black hover:bg-indigo-700 shadow-2xl uppercase tracking-widest text-xs border-b-8 border-indigo-800 transition-all active:scale-95"><Plus size={26}/> Index Current Node</button>
                <button onClick={handleFinishAndSubmit} disabled={isSubmitting} className="px-16 py-6 bg-green-600 text-white rounded-[2rem] font-black hover:bg-green-700 shadow-2xl active:scale-95 transition-all flex items-center gap-4 uppercase tracking-widest text-xs border-b-8 border-green-800">{isSubmitting ? <Loader2 className="animate-spin" /> : <CloudUpload size={26}/>} Sync Archive</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShlokaPortalManager;
