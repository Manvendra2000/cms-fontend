export const STRAPI_URL = "http://localhost:1337";
export const STRAPI_API_TOKEN = import.meta.env.VITE_STRAPI_API_TOKEN;

export const INITIAL_FORM_STATE = {
  book: '', category: '', bookIntro: '', shankaracharyaIntro: '', // Added category
  shankaracharyaIntroTranslation: '', bhashya: '',
  selectedTeekas: [''], hierarchyCount: 2,
  hierarchySanskritNames: { level1: 'अध्याय', level2: 'श्लोक', level3: 'प्रकरण', level4: 'पद' },
  hierarchyValues: { level1: '1', level2: '1', level3: '1', level4: '' },
  sourceText: '', verseTranslations: { english: '', others: [] },
  bhashyaContent: { sanskrit: '', english: '', others: [] },
  teekas: []
};
