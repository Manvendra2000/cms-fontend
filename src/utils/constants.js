export const STRAPI_URL = "http://localhost:1337";
export const STRAPI_API_TOKEN = "5c6b3b5ef3b79a3e8e61ad906060e2ef2502210a6872df54550b83cccee7e1e83ec814a4d72e4f2a0a77447cc6b667e27b4e4b606f11414bb1dd2f05d3e22b59ceefa244e94d85479f18ed794b13956cf5020bdadd2133e21e5010ae57c189b29a3da29d92664622accb575e0245067f8a96c4d4988acc84247dca16a67fdb07"; 

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
