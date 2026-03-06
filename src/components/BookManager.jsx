import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Edit3, ChevronRight, Loader2 } from 'lucide-react';
import { STRAPI_URL, STRAPI_API_TOKEN } from '../utils/constants';

const BookManager = ({ onNavigate }) => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState(new Set());
  const [expandedSections, setExpandedSections] = useState(new Set());

  const getAuthHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${STRAPI_API_TOKEN}` });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchBooksByCategory();
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${STRAPI_URL}/api/categories?fields[0]=Name&pagination[limit]=100`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.data) {
        setCategories(data.data.map(c => ({ id: c.documentId, name: c.Name })));
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchBooksByCategory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${STRAPI_URL}/api/books?filters[category][Name][$eq]=${selectedCategory}&fields[0]=Title&populate[category][fields][0]=Name&pagination[limit]=100`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.data) {
        setBooks(data.data.map(b => ({ 
          id: b.documentId, 
          title: b.Title,
          category: b.category?.Name || 'Uncategorized'
        })));
      }
    } catch (err) {
      console.error('Failed to fetch books:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookStructure = async (book) => {
    setLoading(true);
    setSelectedBook(book);
    try {
      const res = await fetch(`${STRAPI_URL}/api/chapters?filters[book][documentId][$eq]=${book.id}&populate[sections][fields][0]=Title&populate[sections][fields][1]=Section_Number&populate[shlokas][fields][0]=Verse_Number&populate[shlokas][fields][1]=Text&pagination[limit]=100`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.data) {
        const chaptersData = data.data.map(ch => ({
          id: ch.documentId,
          title: ch.Title,
          number: ch.Chapter_Number,
          sections: ch.sections || [],
          shlokas: ch.shlokas || []
        }));
        setChapters(chaptersData);
      }
    } catch (err) {
      console.error('Failed to fetch book structure:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleChapter = (chapterId) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getHierarchyType = (book) => {
    if (!chapters.length) return 'Unknown';
    const hasSections = chapters.some(ch => ch.sections && ch.sections.length > 0);
    const hasSubSections = chapters.some(ch => 
      ch.sections && ch.sections.some(s => s.subsections && s.subsections.length > 0)
    );
    
    if (hasSubSections) return '4 Levels - Detailed Manuscript';
    if (hasSections) return '3 Levels - Complex Upanishad';
    return '2 Levels - Simple Prakarana';
  };

  const getHierarchyPath = (book) => {
    const category = book.category;
    const hierarchyType = getHierarchyType(book);
    
    switch (hierarchyType) {
      case '2 Levels - Simple Prakarana':
        return `${category} → ${book.title} → Adhyaya → Shloka List`;
      case '3 Levels - Complex Upanishad':
        return `${category} → ${book.title} → Adhyaya → Khanda → Shloka List`;
      case '4 Levels - Detailed Manuscript':
        return `${category} → ${book.title} → Adhyaya → Section → Prakarana → Shloka List`;
      default:
        return `${category} → ${book.title}`;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-left">
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-12 py-6 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4 text-left">
          <button onClick={() => onNavigate('#/dashboard')} className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all">
            <ArrowLeft size={20} />
          </button>
          <span className="text-indigo-600 font-black bg-indigo-50 w-10 h-10 flex items-center justify-center rounded-xl shadow-sm text-lg border">ॐ</span>
          <h1 className="text-xl font-black text-slate-800 tracking-tighter text-left">Book Manager</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-6">
        {!selectedBook ? (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-lg">
              <h2 className="text-2xl font-black text-slate-800 mb-4">Select Category</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedCategory === category.name
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-sm">{category.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {selectedCategory && (
              <div className="bg-white p-6 rounded-2xl border shadow-lg">
                <h2 className="text-2xl font-black text-slate-800 mb-4">
                  Books in {selectedCategory}
                </h2>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin mr-2" />
                    Loading books...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {books.map(book => (
                      <div
                        key={book.id}
                        onClick={() => fetchBookStructure(book)}
                        className="p-4 border rounded-xl hover:bg-slate-50 cursor-pointer transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className="text-indigo-600" size={20} />
                          <div>
                            <div className="font-bold text-slate-800">{book.title}</div>
                            <div className="text-sm text-slate-500">{book.category}</div>
                          </div>
                        </div>
                        <ChevronRight className="text-slate-400 group-hover:text-indigo-600 transition-colors" size={20} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">{selectedBook.title}</h2>
                  <p className="text-sm text-slate-500">{getHierarchyPath(selectedBook)}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedBook(null);
                    setChapters([]);
                    setExpandedChapters(new Set());
                    setExpandedSections(new Set());
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Back to Books
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
                <div className="text-sm font-semibold text-indigo-700">Hierarchy Type</div>
                <div className="text-xs text-indigo-600">{getHierarchyType(selectedBook)}</div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin mr-2" />
                  Loading structure...
                </div>
              ) : (
                <div className="space-y-2">
                  {chapters.map(chapter => (
                    <div key={chapter.id} className="border rounded-lg overflow-hidden">
                      <div
                        onClick={() => toggleChapter(chapter.id)}
                        className="p-3 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <ChevronRight 
                            className={`transition-transform ${expandedChapters.has(chapter.id) ? 'rotate-90' : ''}`}
                            size={16} 
                          />
                          <span className="font-semibold">Chapter {chapter.number}: {chapter.title}</span>
                        </div>
                        <div className="text-sm text-slate-500">
                          {chapter.shlokas.length} Shlokas
                        </div>
                      </div>
                      
                      {expandedChapters.has(chapter.id) && (
                        <div className="p-3 bg-white border-t">
                          {chapter.sections && chapter.sections.length > 0 ? (
                            <div className="space-y-2">
                              {chapter.sections.map(section => (
                                <div key={section.id} className="ml-4">
                                  <div
                                    onClick={() => toggleSection(section.id)}
                                    className="p-2 bg-slate-50 hover:bg-slate-100 rounded cursor-pointer transition-colors flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-2">
                                      <ChevronRight 
                                        className={`transition-transform ${expandedSections.has(section.id) ? 'rotate-90' : ''}`}
                                        size={14} 
                                      />
                                      <span className="text-sm font-medium">Section {section.Section_Number}: {section.Title}</span>
                                    </div>
                                  </div>
                                  
                                  {expandedSections.has(section.id) && (
                                    <div className="ml-4 mt-2 p-2 bg-white border rounded">
                                      <div className="text-xs text-slate-500 mb-2">Shlokas in this section:</div>
                                      {chapter.shlokas
                                        .filter(shloka => shloka.section === section.id)
                                        .map(shloka => (
                                          <div key={shloka.id} className="p-2 hover:bg-slate-50 rounded flex items-center justify-between group">
                                            <div className="text-sm">Shloka {shloka.Verse_Number}</div>
                                            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-indigo-100 rounded">
                                              <Edit3 size={12} className="text-indigo-600" />
                                            </button>
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {chapter.shlokas.map(shloka => (
                                <div key={shloka.id} className="p-2 hover:bg-slate-50 rounded flex items-center justify-between group">
                                  <div className="text-sm">Shloka {shloka.Verse_Number}</div>
                                  <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-indigo-100 rounded">
                                    <Edit3 size={12} className="text-indigo-600" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BookManager;
