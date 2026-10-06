"use strict";
/* =====================================================================
   Interface languages. English (US) is the default; Urdu is written right
   to left in a Nastaliq font. Only the app's own words are translated:
   messages, names, file names, system notices, call logs, deleted and omitted
   placeholders and the date rows in the chat are shown exactly as exported.
   The chat (#layer) stays left to right in Urdu: sent messages on the right.

   - Dictionaries: js/i18n/en.js and js/i18n/ur.js. They are scripts, not
     JSON files, because a page opened straight from disk (file://) can't
     fetch JSON. Each one calls I18N.add(lang, { section: { key: text } }).
   - t('section.key', { name: value }) returns the text for the current
     language, falling back to English. {name} is replaced by the value.
     With a number n, a "key_one" entry is used when n is 1.
   - Static HTML is marked with data-i18n (text), data-i18n-html (text with
     <b> or <small> inside) and data-i18n-attr="aria-label:key;title:key".
   - The choice is kept in localStorage as app_language.
   Loaded before every other script.
   ===================================================================== */
const LANGS = [
  { code: 'en-US', name: 'English', dir: 'ltr', locale: 'en-US' },
  { code: 'ur', name: 'اردو', dir: 'rtl', locale: 'ur-PK' },
  { code: 'ar', name: 'العربية', dir: 'rtl', locale: 'ar' }
];
const I18N = {
  dicts: {}, lang: 'en-US',
  add(lang, dict) { this.dicts[lang] = dict; },
  info() { return LANGS.find(l => l.code === this.lang) || LANGS[0]; },
  locale() { return this.info().locale; },
  rtl() { return this.info().dir === 'rtl'; },
  look(lang, key) {
    let o = this.dicts[lang];
    for (const k of key.split('.')) { if (o == null) return undefined; o = o[k]; }
    return typeof o === 'string' ? o : undefined;
  },
  // Sets the language, updates the page and tells the app to redraw what it built in JavaScript.
  set(lang, quiet) {
    if (!LANGS.some(l => l.code === lang)) lang = 'en-US';
    this.lang = lang;
    try { localStorage.setItem('app_language', lang); } catch (e) { /* private mode: still switches */ }
    const info = this.info(), html = document.documentElement;
    html.lang = info.code; html.dir = info.dir;
    applyI18n(document);
    if (!quiet) document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  }
};
function t(key, vars) {
  let s;
  if (vars && vars.n === 1) s = I18N.look(I18N.lang, key + '_one') || I18N.look('en-US', key + '_one');
  if (s === undefined) s = I18N.look(I18N.lang, key);
  if (s === undefined) s = I18N.look('en-US', key);
  if (s === undefined) return key;
  // Each inserted value is isolated (U+2068…U+2069), so a Latin name or a number keeps its place in an Urdu sentence.
  return vars ? s.replace(/\{(\w+)\}/g, (all, k) => vars[k] !== undefined ? '\u2068' + vars[k] + '\u2069' : all) : s;
}
function applyI18n(rootEl) {
  for (const el of rootEl.querySelectorAll('[data-i18n]')) {
    // Only the text is replaced, so icons the app put in the same element stay.
    const s = t(el.dataset.i18n), node = [...el.childNodes].find(n => n.nodeType === 3 && n.nodeValue.trim());
    if (node) node.nodeValue = s; else el.appendChild(document.createTextNode(s));
  }
  for (const el of rootEl.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of rootEl.querySelectorAll('[data-i18n-attr]')) {
    for (const pair of el.dataset.i18nAttr.split(';')) { const [a, k] = pair.split(':'); el.setAttribute(a, t(k)); }
  }
}
// The saved choice, or English. viewer.js applies it before building the date formats.
I18N.saved = (() => { try { return localStorage.getItem('app_language'); } catch (e) { return null; } })() || 'en-US';
