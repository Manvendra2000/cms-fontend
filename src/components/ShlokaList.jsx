import React, { useEffect, useState } from "react";
import {
  BookOpen,
  MessageSquare,
  Type,
  ChevronRight,
  Sparkles,
  Globe,
  Layers,
} from "lucide-react";

const API_URL = "http://localhost:1337";

export default function ShlokaList({ sectionId }) {
  const [shlokas, setShlokas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sectionId) {
      fetchShlokas();
    }
  }, [sectionId]);

  const fetchShlokas = async () => {
    setLoading(true);
    setError(null);
    try {
      /**
       * Strapi 5 uses `documentId` for string UIDs like 'pa2l5emg34xk8y4b0zqek41i'.
       * We try documentId first; if empty, fall back to numeric id filter.
       */
      const isNumericId = /^\d+$/.test(String(sectionId));
      const filterKey = isNumericId
        ? "filters[section][id][$eq]"
        : "filters[section][documentId][$eq]";

      const url = `${API_URL}/api/shlokas?${filterKey}=${sectionId}&populate[books][populate]=*&populate[chapter][populate]=*&populate[section][populate]=*&populate[Commentry][populate]=*&sort=Verse_Number:asc`;

      console.log("[ShlokaList] Fetching:", url);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      console.log("[ShlokaList] Raw result:", result);

      setShlokas(result.data || []);
    } catch (err) {
      console.error("[ShlokaList] Error loading shlokas:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Strapi 5 flattened response: item IS the object (no item.attributes wrapper).
   * This helper safely reads from either shape for backwards compatibility.
   */
  const getAttrs = (item) => {
    // Strapi 5: flat structure
    if (item && !item.attributes) return item;
    // Strapi 4: nested under attributes
    return item?.attributes || {};
  };

  /**
   * Render Strapi "Blocks" rich-text content (array of block objects).
   * Also handles plain strings.
   */
  const renderBlocks = (blocks) => {
    if (!blocks) return null;

    // Plain string fallback
    if (typeof blocks === "string") {
      return <p className="mb-2 last:mb-0">{blocks}</p>;
    }

    if (!Array.isArray(blocks)) return null;

    return blocks.map((block, idx) => {
      // Handle paragraph / heading blocks
      if (block.children) {
        const text = block.children
          .map((child) => {
            let content = child.text || "";
            if (child.bold) content = <strong key={Math.random()}>{content}</strong>;
            if (child.italic) content = <em key={Math.random()}>{content}</em>;
            return content;
          });
        return (
          <p key={idx} className="mb-2 last:mb-0">
            {text}
          </p>
        );
      }
      // Fallback for unknown block shapes
      return <p key={idx} className="mb-2 last:mb-0">{JSON.stringify(block)}</p>;
    });
  };

  // ─── Helper: safely get relation data (Strapi 4 vs 5) ─────────────────────
  const getRelation = (field) => {
    if (!field) return null;
    // Strapi 5: field is the object directly or an array
    if (!field.data && typeof field === "object" && !Array.isArray(field)) return field;
    // Strapi 4: field.data.attributes
    return field?.data?.attributes || null;
  };

  const getRelationArray = (field) => {
    if (!field) return [];
    // Strapi 5: already an array
    if (Array.isArray(field)) return field;
    // Strapi 4: field.data is an array
    if (Array.isArray(field?.data)) return field.data.map((d) => d.attributes || d);
    return [];
  };

  // ─── UI States ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-indigo-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="font-black uppercase tracking-widest text-xs">
          Loading Relational Nodes...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 bg-red-50 rounded-[2rem] border-2 border-dashed border-red-200 text-center">
        <p className="text-red-400 font-bold uppercase tracking-widest text-xs mb-2">
          Fetch Error
        </p>
        <p className="text-red-500 font-medium text-sm">{error}</p>
        <p className="text-slate-400 text-xs mt-2">Section ID: {sectionId}</p>
      </div>
    );
  }

  if (!shlokas.length) {
    return (
      <div className="p-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-center">
        <Layers className="mx-auto text-slate-300 mb-4" size={48} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
          Empty Node
        </p>
        <p className="text-slate-500 font-medium mt-2 text-sm">
          No shlokas found for document ID: {sectionId}
        </p>
        <p className="text-slate-400 text-xs mt-1">
          Check console for fetch URL debug info.
        </p>
      </div>
    );
  }

  // ─── Main Render ───────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-8 px-4 text-left">
      {shlokas.map((item) => {
        const attrs = getAttrs(item);

        // Safely resolve nested relations (Strapi 4 & 5 compatible)
        const book = getRelation(attrs.books);
        const chapter = getRelation(attrs.chapter);
        const section = getRelation(attrs.section);
        const commentaries = getRelationArray(attrs.Commentry);

        return (
          <div
            key={item.id || item.documentId}
            className="bg-white border border-slate-100 p-8 md:p-12 rounded-[3.5rem] shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden group"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full opacity-50 group-hover:scale-110 transition-transform"></div>

            {/* ── Header: Identity & Context ── */}
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-900 text-white flex items-center justify-center rounded-2xl text-2xl font-black shadow-2xl">
                  {attrs.Verse_Number}
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 italic">
                    Manuscript Node
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-bold text-slate-700">
                      {book?.Title || book?.title || "General Volume"}
                    </p>
                    <ChevronRight size={14} className="text-slate-300" />
                    <p className="text-xs font-medium text-slate-400">
                      Chapter {chapter?.Title || chapter?.title || "…"}
                    </p>
                    {section && (
                      <>
                        <ChevronRight size={14} className="text-slate-300" />
                        <p className="text-xs font-medium text-slate-400">
                          {section?.Title || section?.title || "…"}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="hidden md:flex flex-col items-end gap-2">
                <span className="bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full text-[10px] font-black uppercase border border-indigo-100">
                  {book?.category?.name ||
                    book?.category?.data?.attributes?.name ||
                    "Classical Text"}
                </span>
                {/* Document ID badge — useful during dev */}
                <span className="text-[9px] text-slate-300 font-mono">
                  {item.documentId || item.id}
                </span>
              </div>
            </div>

            {/* ── Content Body ── */}
            <div className="space-y-10 relative z-10">

              {/* Primary Sanskrit / Devanagari Text */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-300 text-[10px] font-black uppercase tracking-widest">
                  <Sparkles size={16} className="text-amber-300" />
                  Original Devanagari
                </div>
                <div className="text-4xl font-serif text-slate-900 leading-[1.6] antialiased">
                  {renderBlocks(attrs.Text)}
                </div>
              </div>

              {/* Translation & Transliteration Grid */}
              <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-slate-50">
                {/* Translation */}
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 group-hover:bg-white transition-colors">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                    <Globe size={14} /> English Rendering
                  </label>
                  <div className="text-md text-slate-600 font-medium leading-relaxed italic">
                    {renderBlocks(attrs.Translation)}
                  </div>
                </div>

                {/* Transliteration */}
                {attrs.Transliteration && (
                  <div className="bg-indigo-50/20 p-8 rounded-[2.5rem] border border-indigo-50/50">
                    <label className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">
                      <Type size={14} /> Roman Transliteration
                    </label>
                    <div className="text-sm font-bold text-indigo-900/60 leading-relaxed tracking-wide font-mono">
                      {typeof attrs.Transliteration === "string"
                        ? attrs.Transliteration
                        : renderBlocks(attrs.Transliteration)}
                    </div>
                  </div>
                )}
              </div>

              {/* Word-by-Word / Anvaya (if present) */}
              {attrs.Anvaya && (
                <div className="pt-4 border-t border-slate-50">
                  <label className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3">
                    <BookOpen size={14} /> Anvaya / Word Order
                  </label>
                  <div className="text-sm text-slate-600 leading-relaxed font-mono bg-emerald-50/30 p-6 rounded-[2rem] border border-emerald-50">
                    {typeof attrs.Anvaya === "string"
                      ? attrs.Anvaya
                      : renderBlocks(attrs.Anvaya)}
                  </div>
                </div>
              )}

              {/* Meaning / Artha (if present) */}
              {attrs.Meaning && (
                <div className="pt-4 border-t border-slate-50">
                  <label className="flex items-center gap-2 text-[10px] font-black text-violet-500 uppercase tracking-widest mb-3">
                    <Sparkles size={14} /> Meaning / Artha
                  </label>
                  <div className="text-sm text-slate-600 leading-relaxed bg-violet-50/30 p-6 rounded-[2rem] border border-violet-50">
                    {typeof attrs.Meaning === "string"
                      ? attrs.Meaning
                      : renderBlocks(attrs.Meaning)}
                  </div>
                </div>
              )}

              {/* ── Nested Commentaries (Bhashyas & Tikas) ── */}
              {commentaries.length > 0 && (
                <div className="space-y-8 pt-6">
                  {commentaries.map((comm, cIdx) => {
                    // comm may be flat (Strapi 5) or have its own attributes
                    const c = comm.attributes || comm;
                    const tikas = Array.isArray(c.tika)
                      ? c.tika
                      : c.tika?.data?.map((t) => t.attributes || t) || [];

                    return (
                      <div
                        key={cIdx}
                        className="bg-white border-2 border-indigo-50/50 rounded-[3rem] overflow-hidden shadow-sm"
                      >
                        {/* Bhashya Author Header */}
                        <div className="bg-indigo-600 px-8 py-5 flex justify-between items-center text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-black text-xs">
                              B
                            </div>
                            <h4 className="font-black text-sm uppercase tracking-tighter">
                              {c.authorTitle || c.author || "Unknown Author"}
                            </h4>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest opacity-70">
                            Primary Bhashyam
                          </span>
                        </div>

                        {/* Bhashya Content */}
                        <div className="p-8 grid md:grid-cols-2 gap-8 bg-gradient-to-br from-white to-indigo-50/20">
                          <div className="text-xl font-serif text-slate-800 leading-relaxed border-r border-indigo-100/50 pr-8">
                            {renderBlocks(c.content)}
                          </div>
                          <div className="text-sm font-medium text-slate-500 italic leading-relaxed">
                            {renderBlocks(c.translation)}
                          </div>
                        </div>

                        {/* Nested Tikas */}
                        {tikas.length > 0 && (
                          <div className="p-8 bg-slate-50 border-t border-indigo-50">
                            <div className="flex items-center gap-2 mb-6 ml-2">
                              <MessageSquare size={14} className="text-indigo-400" />
                              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                Associated Tikas
                              </span>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                              {tikas.map((t, tIdx) => {
                                const tika = t.attributes || t;
                                return (
                                  <div
                                    key={tIdx}
                                    className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors"
                                  >
                                    <span className="inline-block bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase mb-3">
                                      {tika.authorTitle || tika.author || "Tika"}
                                    </span>
                                    <div className="text-md font-serif text-slate-700 mb-3">
                                      {renderBlocks(tika.content)}
                                    </div>
                                    <div className="text-xs text-slate-400 italic font-medium">
                                      {renderBlocks(tika.translation)}
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
      })}
    </div>
  );
}
