export const filterDevanagari = (val) => val.replace(/[^\u0900-\u097F\s.,;:!?'"|॥०-९\-\n\r()[\]{}@#$%^&*_+=\/\\<>~`|]/g, '');
export const filterEnglish = (val) => val.replace(/[^a-zA-Z0-9\s.,;:!?'"()[\]{}\-\n\r@#$%^&*_+=\/\\<>~`|]/g, '');

export const toStrapiBlocks = (text) => {
  if (!text) return [{ type: 'paragraph', children: [{ type: 'text', text: "" }] }];
  return text.split('\n').map(line => ({
    type: 'paragraph',
    children: [{ type: 'text', text: line }]
  }));
};
