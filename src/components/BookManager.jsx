import React, { useState, useEffect } from "react";
import { ArrowLeft, BookOpen, ChevronRight, Loader2 } from "lucide-react";
import { STRAPI_URL, STRAPI_API_TOKEN } from "../utils/constants";
import ShlokaList from "./ShlokaList";

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${STRAPI_API_TOKEN}`,
};

const BookManager = ({ onNavigate }) => {
  const [categories, setCategories] = useState([]);
  const [books, setBooks] = useState([]);
  const [chapters, setChapters] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);

  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) loadBooks();
  }, [selectedCategory]);

  const toggle = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const loadCategories = async () => {
    const res = await fetch(
      `${STRAPI_URL}/api/categories?fields[0]=Name&pagination[limit]=100`,
      { headers }
    );
    const json = await res.json();
    setCategories(
      json.data.map((c) => ({
        id: c.documentId,
        name: c.Name,
      }))
    );
  };

  const loadBooks = async () => {
    setLoading(true);
    const res = await fetch(
      `${STRAPI_URL}/api/books?filters[category][Name][$eq]=${selectedCategory}&fields[0]=Title&populate[category][fields][0]=Name`,
      { headers }
    );
    const json = await res.json();
    setBooks(
      json.data.map((b) => ({
        id: b.documentId,
        title: b.Title,
        category: b.category?.Name,
      }))
    );
    setLoading(false);
  };

  const loadStructure = async (book) => {
    setSelectedBook(book);
    setLoading(true);

    // Chapters/sections have no direct book link in Strapi.
    // The only reliable connection is: shloka.books -> shloka.section -> section.chapter
    // So we fetch all shlokas for this book and derive the chapter/section tree.
    const res = await fetch(
      `${STRAPI_URL}/api/shlokas` +
        `?filters[books][documentId][$eq]=${book.id}` +
        `&fields[0]=Verse_Number` +
        `&populate[section][fields][0]=Title&populate[section][fields][1]=Section_Number` +
        `&populate[section][populate][chapter][fields][0]=Title&populate[section][populate][chapter][fields][1]=Chapter_Number` +
        `&pagination[limit]=1000`,
      { headers }
    );

    const json = await res.json();
    const shlokas = json.data || [];

    // Build chapter -> sections map using shloka relations as ground truth
    const chapterMap = {};
    shlokas.forEach((shloka) => {
      const section = shloka.section;
      if (!section) return;
      const chapter = section.chapter;
      if (!chapter) return;

      const chId = chapter.documentId;
      const secId = section.documentId;

      if (!chapterMap[chId]) {
        chapterMap[chId] = {
          id: chId,
          title: chapter.Title,
          number: chapter.Chapter_Number,
          sections: {},
        };
      }
      if (!chapterMap[chId].sections[secId]) {
        chapterMap[chId].sections[secId] = {
          id: secId,
          title: section.Title,
          number: section.Section_Number,
        };
      }
    });

    const chapterList = Object.values(chapterMap)
      .map((ch) => ({
        ...ch,
        sections: Object.values(ch.sections).sort((a, b) => a.number - b.number),
      }))
      .sort((a, b) => a.number - b.number);

    setChapters(chapterList);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">

      {/* HEADER */}
      <header className="bg-white border-b px-10 py-5 flex justify-between items-center">
        <div className="flex gap-3 items-center">
          <button
            onClick={() => onNavigate("#/dashboard")}
            className="p-2 bg-slate-100 rounded-lg"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="bg-orange-100 text-orange-600 w-9 h-9 flex items-center justify-center rounded-lg">
            ॐ
          </span>
          <h1 className="font-bold text-lg">Book Manager</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">

        {/* CATEGORY SELECT */}
        {!selectedBook && (
          <div className="bg-white p-6 rounded-xl border mb-6">
            <h2 className="font-bold mb-4">Categories</h2>
            <div className="grid grid-cols-4 gap-3">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.name)}
                  className={`p-3 border rounded-lg text-left ${
                    selectedCategory === c.name
                      ? "border-indigo-500 bg-indigo-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* BOOK LIST */}
        {!selectedBook && selectedCategory && (
          <div className="bg-white p-6 rounded-xl border">
            <h2 className="font-bold mb-4">Books in {selectedCategory}</h2>
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              books.map((book) => (
                <div
                  key={book.id}
                  onClick={() => loadStructure(book)}
                  className="p-3 border rounded-lg mb-2 hover:bg-slate-50 cursor-pointer flex justify-between"
                >
                  <div className="flex gap-2 items-center">
                    <BookOpen size={18} className="text-indigo-600" />
                    {book.title}
                  </div>
                  <ChevronRight size={16} />
                </div>
              ))
            )}
          </div>
        )}

        {/* BOOK STRUCTURE */}
        {selectedBook && (
          <div className="bg-white p-6 rounded-xl border">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold">{selectedBook.title}</h2>
              <button
                onClick={() => {
                  setSelectedBook(null);
                  setChapters([]);
                }}
                className="text-sm bg-slate-100 px-3 py-1 rounded"
              >
                Back
              </button>
            </div>

            {loading ? (
              <Loader2 className="animate-spin" />
            ) : chapters.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">
                No shlokas found for this book.
              </p>
            ) : (
              chapters.map((chapter) => (
                <div key={chapter.id} className="border rounded mb-3">

                  {/* CHAPTER ROW */}
                  <div
                    onClick={() => toggle(chapter.id)}
                    className="p-3 bg-slate-50 cursor-pointer flex justify-between"
                  >
                    <span>Chapter {chapter.number}: {chapter.title}</span>
                    <ChevronRight
                      className={expanded[chapter.id] ? "rotate-90" : ""}
                      size={16}
                    />
                  </div>

                  {/* SECTIONS */}
                  {expanded[chapter.id] && (
                    <div className="p-3 space-y-2">

                      {chapter.sections.length === 0 && (
                        <ShlokaList chapterId={chapter.id} />
                      )}

                      {chapter.sections.map((section) => (
                        <div key={section.id} className="ml-4 border rounded">
                          <div
                            onClick={() => toggle(section.id)}
                            className="p-2 bg-slate-50 flex justify-between cursor-pointer"
                          >
                            Section {section.number}: {section.title}
                            <ChevronRight
                              className={expanded[section.id] ? "rotate-90" : ""}
                              size={14}
                            />
                          </div>

                          {expanded[section.id] && (
                            <div className="p-3">
                              <ShlokaList sectionId={section.id} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default BookManager;
