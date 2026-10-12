/* Release-notes tests. Run with: node tests/release-notes.test.js (Node 18 or later, no packages needed).
   The deploy to GitHub Pages runs them, so a release can't ship without its "What's new" notes:
   - js/release-notes.js's newest entry is APP_VERSION (js/components/settings.js) and the top
     released heading of CHANGELOG.md, with the same date;
   - every item has a kind (new, improved or fixed) and English, Urdu and Arabic text;
   - js/components/whats-new.js shows each version once, as PROJECT_RULES.md describes. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

const version = (read('js/components/settings.js').match(/const APP_VERSION = '([^']+)'/) || [])[1];
const notes = vm.runInNewContext(read('js/release-notes.js') + '\n;RELEASE_NOTES');
const top = read('CHANGELOG.md').match(/^## (\d+\.\d+\.\d+) \((\d{4}-\d\d-\d\d)\)/m);

// Loads whats-new.js with a fake localStorage and page, and returns the versions it would show.
function run(keys, opts) {
  const ls = Object.assign({}, keys), shown = [];
  const storage = opts && opts.broken ? {
    get length() { throw new Error('blocked'); }, key() { throw new Error('blocked'); },
    getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); }
  } : {
    get length() { return Object.keys(ls).length; }, key: i => Object.keys(ls)[i],
    getItem: k => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: k => { delete ls[k]; }
  };
  const el = () => ({ hidden: true, addEventListener() {}, focus() {}, scrollTop: 0, innerHTML: '' });
  const els = {};
  const ctx = {
    localStorage: storage, RELEASE_NOTES: notes, APP_VERSION: (opts && opts.app) || version, setTimeout, clearTimeout,
    $: id => els[id] || (els[id] = el()), document: { addEventListener() {} },
    Dialogs: { any: () => false }, Tour: { active: () => false },
    I18N: { lang: 'en-US', stored: (keys || {}).app_language || null, info: () => ({ locale: 'en-US' }) }, t: k => k, esc: s => String(s), ltrKeys: s => String(s), openModal() {}
  };
  vm.createContext(ctx);
  vm.runInContext('function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }', ctx);
  vm.runInContext(read('js/components/whats-new.js') + '\n;this.WN = WhatsNew;', ctx);
  // Loading the file already ran boot(); start again from the given keys and record what boot() shows.
  for (const k of Object.keys(ls)) delete ls[k];
  Object.assign(ls, keys);
  ctx.WN.show = l => shown.push(...l.map(r => r.v));
  ctx.WN.boot();
  return { shown, saved: ls['cv-seen-version'] || null };
}

const tests = {
  'APP_VERSION is set': () => assert.ok(version, 'APP_VERSION not found in js/components/settings.js'),
  'Newest release note is APP_VERSION': () => assert.strictEqual(notes[0].v, version, 'add a RELEASE_NOTES entry for ' + version + ' (see .claude/skills/release-skill)'),
  'CHANGELOG.md top release matches': () => {
    assert.ok(top, 'no "## x.y.z (yyyy-mm-dd)" heading in CHANGELOG.md');
    assert.strictEqual(top[1], version, 'CHANGELOG.md top release is ' + top[1] + ', APP_VERSION is ' + version);
    assert.strictEqual(notes[0].date, top[2], 'RELEASE_NOTES date differs from CHANGELOG.md');
  },
  'Versions are unique and newest first': () => {
    for (let i = 1; i < notes.length; i++) {
      const a = notes[i - 1].v.split('.').map(Number), b = notes[i].v.split('.').map(Number);
      const d = a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
      assert.ok(d > 0, notes[i - 1].v + ' should be newer than ' + notes[i].v);
    }
  },
  'Every item has a kind and en, ur and ar text': () => {
    for (const r of notes) {
      assert.ok(/^\d+\.\d+\.\d+$/.test(r.v) && /^\d{4}-\d\d-\d\d$/.test(r.date), 'bad version or date in ' + r.v);
      assert.ok(r.items.length, r.v + ' has no items');
      for (const it of r.items) {
        assert.ok(['new', 'improved', 'fixed'].includes(it.kind), r.v + ': kind must be new, improved or fixed');
        for (const l of ['en', 'ur', 'ar']) assert.ok(it[l] && it[l].trim(), r.v + ': missing ' + l + ' in "' + it.en + '"');
      }
    }
  },
  'A brand-new user sees nothing and the version is saved': () => {
    const r = run({});
    assert.deepStrictEqual(r.shown, []); assert.strictEqual(r.saved, version);
  },
  'Someone from before the popup sees the current version': () => {
    const r = run({ 'cv-theme': 'dark' });
    assert.deepStrictEqual(r.shown, [version]); assert.strictEqual(r.saved, null, 'saved only when the popup closes');
  },
  'A language saved before counts as a returning user': () => assert.deepStrictEqual(run({ app_language: 'ur' }).shown, [version]),
  'The same version is not shown again': () => assert.deepStrictEqual(run({ 'cv-seen-version': version }).shown, []),
  'Missed versions are listed, newest first, up to three': () => {
    const r = run({ 'cv-seen-version': '1.0.0' }, { app: '1.10.0' });
    assert.deepStrictEqual(r.shown, ['1.10.0', '1.9.0', '1.8.0']);
    assert.deepStrictEqual(run({ 'cv-seen-version': '1.9.0' }, { app: '1.10.0' }).shown, ['1.10.0']);
  },
  '1.10.0 is newer than 1.9.0': () => assert.deepStrictEqual(run({ 'cv-seen-version': '1.9.0' }, { app: '1.10.0' }).shown, ['1.10.0']),
  'A rollback shows nothing': () => {
    const r = run({ 'cv-seen-version': '9.0.0' });
    assert.deepStrictEqual(r.shown, []); assert.strictEqual(r.saved, version);
  },
  'Blocked storage shows nothing': () => assert.deepStrictEqual(run({}, { broken: true }).shown, [])
};

let fail = 0;
for (const [name, fn] of Object.entries(tests)) {
  try { fn(); console.log('ok   ' + name); } catch (e) { fail++; console.log('FAIL ' + name + '\n     ' + e.message); }
}
console.log(fail ? fail + ' failed' : 'all passed');
process.exitCode = fail ? 1 : 0;
