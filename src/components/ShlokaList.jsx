import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  MessageSquare, Type, ChevronRight, Sparkles,
  Globe, Layers, Check, Loader2, AlertCircle, Pencil,
} from "lucide-react";

const API_URL = "http://localhost:1337";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const blocksToText = (blocks) => {
  if (!blocks) return "";
  if (typeof blocks === "string") return blocks;
  if (!Array.isArray(blocks)) return "";
  return blocks.map((b) => b.children?.map((c) => c.text || "").join("") || "").join("\n");
};

const textToBlocks = (text) => {
  if (!text?.trim()) return [];
  return text.split("\n").map((line) => ({
    type: "paragraph",
    children: [{ type: "text", text: line }],
  }));
};

const renderBlocks = (blocks) => {
  if (!blocks) return null;
  if (typeof blocks === "string") return <p>{blocks}</p>;
  if (!Array.isArray(blocks)) return null;
  return blocks.map((block, idx) => (
    <p key={idx} className="mb-1 last:mb-0">
      {block.children?.map((c, ci) => {
        let content = c.text || "";
        if (c.bold)   content = <strong key={ci}>{content}</strong>;
        if (c.italic) content = <em key={ci}>{content}</em>;
        return content;
      })}
    </p>
  ));
};

// ─── Save Status Indicator ────────────────────────────────────────────────────
const SaveStatus = ({ status }) => {
  if (!status) return null;
  if (status === "saving") return (
    <span className="flex items-center gap-1 text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">
      <Loader2 size={10} className="animate-spin" /> Saving...
    </span>
  );
  if (status === "saved") return (
    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
      <Check size={10} /> Saved
    </span>
  );
  if (status === "error") return (
    <span className="flex items-center gap-1 text-[10px] font-black text-red-400 uppercase tracking-widest">
      <AlertCircle size={10} /> Failed
    </span>
  );
  return null;
};

// ─── EditableField ─────────────────────────────────────────────────────────────
const EditableField = ({
  value,
  isBlock = true,
  onSave,
  displayClass = "",
  placeholder = "Click to edit...",
  canEdit = true,
  rows = 3,
  isLarge = false,
}) => {
  const displayValue = isBlock ? blocksToText(value) : (value || "");
  const [editing, setEditing]   = useState(false);
  const [draft,   setDraft]     = useState(displayValue);
  const [status,  setStatus]    = useState(null);
  const inputRef  = useRef(null);
  const timerRef  = useRef(null);

  useEffect(() => {
    if (!editing) setDraft(isBlock ? blocksToText(value) : (value || ""));
  }, [value, editing, isBlock]);

  const handleFocus = () => {
    if (!canEdit) return;
    setEditing(true);
    setStatus(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = async () => {
    setEditing(false);
    const original = isBlock ? blocksToText(value) : (value || "");
    if (draft === original) return;
    setStatus("saving");
    try {
      const saveValue = isBlock ? textToBlocks(draft) : draft;
      await onSave(saveValue);
      setStatus("saved");
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setStatus(null), 2000);
    } catch {
      setStatus("error");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") { setDraft(displayValue); setEditing(false); }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") inputRef.current?.blur();
  };

  return (
    <div className="relative group/field">
      {canEdit && !editing && (
        <div className="absolute -top-2 -right-2 opacity-0 group-hover/field:opacity-100 transition-opacity z-10">
          <div className="bg-indigo-600 text-white rounded-lg p-1">
            <Pencil size={10} />
          </div>
        </div>
      )}
      <div className="absolute -top-5 right-0 z-10">
        <SaveStatus status={status} />
      </div>
      {editing ? (
        <textarea
          ref={inputRef}
          value={draft}
          rows={rows}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full resize-none outline-none rounded-2xl border-2 border-indigo-300 bg-indigo-50/30 p-3 transition-all ${isLarge ? "text-3xl font-serif leading-relaxed" : "text-sm font-medium"}`}
        />
      ) : (
        <div
          onClick={handleFocus}
          className={`cursor-pointer rounded-2xl transition-all ${canEdit ? "hover:bg-indigo-50/40 hover:outline hover:outline-2 hover:outline-indigo-100" : ""} ${displayClass}`}
        >
          {displayValue
            ? (isBlock ? renderBlocks(value) : <span>{displayValue}</span>)
            : (canEdit ? <span className="text-slate-300 text-sm italic">{placeholder}</span> : null)
          }
        </div>
      )}
    </div>
  );
};

// ─── EditableNumber ───────────────────────────────────────────────────────────
const EditableNumber = ({ value, onSave, canEdit }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(String(value || ""));
  const [status, setStatus]   = useState(null);
  const timerRef = useRef(null);

  const handleBlur = async () => {
    setEditing(false);
    const num = parseInt(draft);
    if (isNaN(num) || num === value) return;
    setStatus("saving");
    try {
      await onSave(num);
      setStatus("saved");
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setStatus(null), 2000);
    } catch { setStatus("error"); }
  };

  return (
    <div className="relative">
      <div className="absolute -top-5 right-0"><SaveStatus status={status} /></div>
      {editing ? (
        <input
          autoFocus
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
          className="w-16 h-16 bg-indigo-100 text-slate-900 text-2xl font-black text-center rounded-2xl border-2 border-indigo-400 outline-none"
        />
      ) : (
        <div
          onClick={() => canEdit && setEditing(true)}
          className={`w-16 h-16 bg-slate-900 text-white flex items-center justify-center rounded-2xl text-2xl font-black shadow-2xl ${canEdit ? "cursor-pointer hover:bg-indigo-700 transition-colors" : ""}`}
          title={canEdit ? "Click to edit verse number" : ""}
        >
          {value}
        </div>
      )}
    </div>
  );
};

// ─── ShlokaCard ───────────────────────────────────────────────────────────────
const ShlokaCard = ({ item, token, canEdit }) => {
  const [attrs, setAttrs] = useState(item.attributes || item);
  const docId = item.documentId || item.id;

  const authHeaders = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const patchField = useCallback(async (fieldData) => {
    const res = await fetch(`${API_URL}/api/shlokas/${docId}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ data: fieldData }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error?.message || "Save failed");
    }
    const updated = await res.json();
    setAttrs(updated.data?.attributes || updated.data || attrs);
  }, [docId, token]);

  const patchCommentary = useCallback(async (newCommentaries) => {
    await patchField({ Commentry: newCommentaries });
  }, [patchField]);

  const book     = attrs.books?.data?.attributes || attrs.books || null;
  const chapter  = attrs.chapter?.data?.attributes || attrs.chapter || null;
  const section  = attrs.section?.data?.attributes || attrs.section || null;
  const commentaries = Array.isArray(attrs.Commentry)
    ? attrs.Commentry
    : attrs.Commentry?.data?.map((d) => d.attributes || d) || [];

  return (
    <div className="bg-white border border-slate-100 p-8 md:p-12 rounded-[3.5rem] shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full opacity-50 group-hover:scale-110 transition-transform" />

      {/* Header */}
      <div className="flex justify-between items-start mb-10 relative z-10">
        <div className="flex items-center gap-6">
          <EditableNumber
            value={attrs.Verse_Number}
            canEdit={canEdit}
            onSave={(v) => patchField({ Verse_Number: v })}
          />
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 italic">Manuscript Node</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-sm font-bold text-slate-700">{book?.Title || book?.title || "General Volume"}</p>
              <ChevronRight size={14} className="text-slate-300" />
              <p className="text-xs font-medium text-slate-400">{chapter?.Title || chapter?.title || "..."}</p>
              {section && (<>
                <ChevronRight size={14} className="text-slate-300" />
                <p className="text-xs font-medium text-slate-400">{section?.Title || section?.title || "..."}</p>
              </>)}
            </div>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-end gap-2">
          <span className="bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full text-[10px] font-black uppercase border border-indigo-100">
            {book?.category?.name || book?.category?.data?.attributes?.name || "Classical Text"}
          </span>
          {canEdit && (
            <span className="text-[9px] text-indigo-300 font-black uppercase tracking-widest flex items-center gap-1">
              <Pencil size={9} /> Editable
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-10 relative z-10">

        {/* Sanskrit */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-slate-300 text-[10px] font-black uppercase tracking-widest">
            <Sparkles size={16} className="text-amber-300" /> Original Devanagari
          </div>
          <EditableField
            value={attrs.Text} isBlock={true} isLarge={true} rows={4} canEdit={canEdit}
            placeholder="Enter Sanskrit text..."
            displayClass="text-4xl font-serif text-slate-900 leading-[1.6] antialiased p-2"
            onSave={(v) => patchField({ Text: v })}
          />
        </div>

        {/* Translation + Transliteration */}
        <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-slate-50">
          <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              <Globe size={14} /> English Rendering
            </label>
            <EditableField
              value={attrs.Translation} isBlock={true} rows={3} canEdit={canEdit}
              placeholder="Enter English translation..."
              displayClass="text-md text-slate-600 font-medium leading-relaxed italic p-1"
              onSave={(v) => patchField({ Translation: v })}
            />
          </div>
          <div className="bg-indigo-50/20 p-6 rounded-[2.5rem] border border-indigo-50/50">
            <label className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">
              <Type size={14} /> Roman Transliteration
            </label>
            <EditableField
              value={attrs.Transliteration} isBlock={false} rows={2} canEdit={canEdit}
              placeholder="Enter transliteration..."
              displayClass="text-sm font-bold text-indigo-900/60 leading-relaxed tracking-wide font-mono p-1"
              onSave={(v) => patchField({ Transliteration: v })}
            />
          </div>
        </div>

        {/* Commentaries */}
        {commentaries.length > 0 && (
          <div className="space-y-8 pt-6">
            {commentaries.map((comm, cIdx) => {
              const c     = comm.attributes || comm;
              const tikas = Array.isArray(c.tika) ? c.tika : c.tika?.data?.map((t) => t.attributes || t) || [];

              const updateComm = (field, value) => {
                const updated = commentaries.map((cm, i) =>
                  i === cIdx ? { ...(cm.attributes || cm), [field]: value } : (cm.attributes || cm)
                );
                return patchCommentary(updated);
              };

              const updateTika = (tIdx, field, value) => {
                const updatedTikas = tikas.map((t, i) =>
                  i === tIdx ? { ...(t.attributes || t), [field]: value } : (t.attributes || t)
                );
                const updated = commentaries.map((cm, i) =>
                  i === cIdx ? { ...(cm.attributes || cm), tika: updatedTikas } : (cm.attributes || cm)
                );
                return patchCommentary(updated);
              };

              return (
                <div key={cIdx} className="bg-white border-2 border-indigo-50/50 rounded-[3rem] overflow-hidden shadow-sm">
                  <div className="bg-indigo-600 px-8 py-5 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-black text-xs">B</div>
                      <h4 className="font-black text-sm uppercase tracking-tighter">{c.authorTitle || c.author || "Unknown Author"}</h4>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Primary Bhashyam</span>
                  </div>
                  <div className="p-8 grid md:grid-cols-2 gap-8 bg-gradient-to-br from-white to-indigo-50/20">
                    <div className="border-r border-indigo-100/50 pr-8">
                      <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Sanskrit</p>
                      <EditableField
                        value={c.content} isBlock={true} rows={4} canEdit={canEdit}
                        placeholder="Enter Bhashya Sanskrit..."
                        displayClass="text-xl font-serif text-slate-800 leading-relaxed p-1"
                        onSave={(v) => updateComm("content", v)}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">English</p>
                      <EditableField
                        value={c.translation} isBlock={true} rows={4} canEdit={canEdit}
                        placeholder="Enter Bhashya translation..."
                        displayClass="text-sm font-medium text-slate-500 italic leading-relaxed p-1"
                        onSave={(v) => updateComm("translation", v)}
                      />
                    </div>
                  </div>
                  {tikas.length > 0 && (
                    <div className="p-8 bg-slate-50 border-t border-indigo-50">
                      <div className="flex items-center gap-2 mb-6 ml-2">
                        <MessageSquare size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Associated Tikas</span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        {tikas.map((t, tIdx) => {
                          const tika = t.attributes || t;
                          return (
                            <div key={tIdx} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                              <span className="inline-block bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase mb-3">
                                {tika.authorTitle || tika.author || "Tika"}
                              </span>
                              <div className="mb-3">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Sanskrit</p>
                                <EditableField
                                  value={tika.content} isBlock={true} rows={3} canEdit={canEdit}
                                  placeholder="Enter Tika Sanskrit..."
                                  displayClass="text-md font-serif text-slate-700 p-1"
                                  onSave={(v) => updateTika(tIdx, "content", v)}
                                />
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">English</p>
                                <EditableField
                                  value={tika.translation} isBlock={true} rows={2} canEdit={canEdit}
                                  placeholder="Enter Tika translation..."
                                  displayClass="text-xs text-slate-400 italic font-medium p-1"
                                  onSave={(v) => updateTika(tIdx, "translation", v)}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── ShlokaList ───────────────────────────────────────────────────────────────
export default function ShlokaList({ sectionId, token, role }) {
  const [shlokas, setShlokas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const canEdit = role === "admin" || role === "editor";

  useEffect(() => {
    if (sectionId) fetchShlokas();
  }, [sectionId]);

  const fetchShlokas = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try both documentId and id filters to ensure we catch all shlokas
      const urls = [
        `${API_URL}/api/shlokas?filters[section][documentId][$eq]=${sectionId}&populate[books][populate]=*&populate[chapter][populate]=*&populate[section][populate]=*&populate[Commentry][populate]=*&sort=Verse_Number:asc`,
        `${API_URL}/api/shlokas?filters[section][id][$eq]=${sectionId}&populate[books][populate]=*&populate[chapter][populate]=*&populate[section][populate]=*&populate[Commentry][populate]=*&sort=Verse_Number:asc`
      ];
      
      let allShlokas = [];
      
      for (const url of urls) {
        const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) continue;
        const result = await res.json();
        if (result.data && result.data.length > 0) {
          allShlokas = [...allShlokas, ...result.data];
        }
      }
      
      // Remove duplicates based on documentId or id
      const uniqueShlokas = allShlokas.filter((shloka, index, self) => {
        const shlokaId = shloka.documentId || shloka.id;
        return index === self.findIndex(s => (s.documentId || s.id) === shlokaId);
      });
      
      setShlokas(uniqueShlokas);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 text-indigo-600">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
      <p className="font-black uppercase tracking-widest text-xs">Loading Relational Nodes...</p>
    </div>
  );

  if (error) return (
    <div className="p-12 bg-red-50 rounded-[2rem] border-2 border-dashed border-red-200 text-center">
      <p className="text-red-400 font-bold uppercase tracking-widest text-xs mb-2">Fetch Error</p>
      <p className="text-red-500 font-medium text-sm">{error}</p>
    </div>
  );

  if (!shlokas.length) return (
    <div className="p-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-center">
      <Layers className="mx-auto text-slate-300 mb-4" size={48} />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Empty Node</p>
      <p className="text-slate-500 font-medium mt-2 text-sm">No shlokas found for section: {sectionId}</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-8 px-4 text-left">
      {canEdit && (
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-3 w-fit">
          <Pencil size={12} className="text-indigo-500" />
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
            Click any field to edit — saves automatically on blur
          </span>
        </div>
      )}
      {shlokas.map((item) => (
        <ShlokaCard
          key={item.documentId || item.id}
          item={item}
          token={token}
          canEdit={canEdit}
        />
      ))}
    </div>
  );
}
