/* Keyboard shortcut list tests. Run with: node tests/shortcuts.test.js (Node 18 or later, no packages needed).
   They load js/components/shortcuts-list.js with the dictionaries and check that every shortcut has its name in
   English, Urdu and Arabic, and that no two shortcuts answer the same key in the same place. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const ctx = { console, localStorage: { getItem: () => null, setItem() {} } };
vm.createContext(ctx);
const load = f => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f });
for (const f of ['js/i18n/i18n.js', 'js/i18n/en.js', 'js/i18n/ur.js', 'js/i18n/ar.js', 'js/components/shortcuts-list.js']) load(f);
const { I18N, KEY_LIST, KEY_GROUPS } = vm.runInContext('({ I18N, KEY_LIST, KEY_GROUPS })', ctx);
const PLACES = ['start', 'chat', 'select', 'message', 'search', 'gallery', 'lb', 'pdf', 'keys', 'dialog'];
const combos = k => Array.isArray(k.keys) ? [k.keys] : [k.keys.mac, k.keys.other];

const tests = {
  'Every shortcut and group has its name in en, ur and ar': () => {
    for (const lang of ['en-US', 'ur', 'ar']) {
      for (const k of KEY_LIST) assert.ok(I18N.look(lang, k.label), lang + ' has no text for ' + k.label + ' (' + k.id + ')');
      for (const [, label] of KEY_GROUPS) assert.ok(I18N.look(lang, label), lang + ' has no text for ' + label);
      for (const key of ['keys.or', 'keys.lead_mac', 'keys.lead_other', 'keys.single', 'keys.single_sub', 'keys.single_off', 'keys.settings_sub', 'chat.search', 'tour_steps.keys.title', 'tour_steps.keys.text', 'tour_steps.keys.textNarrow'])
        assert.ok(I18N.look(lang, key), lang + ' has no text for ' + key);
    }
  },
  'Ids are unique and every entry is complete': () => {
    const ids = new Set();
    for (const k of KEY_LIST) {
      assert.ok(!ids.has(k.id), 'duplicate id ' + k.id); ids.add(k.id);
      assert.ok(KEY_GROUPS.some(g => g[0] === k.group), k.id + ': unknown group ' + k.group);
      for (const list of combos(k)) assert.ok(Array.isArray(list) && list.length, k.id + ': no keys');
      if (k.run) {
        assert.ok(Array.isArray(k.where) && k.where.length, k.id + ': run without where');
        for (const w of k.where) assert.ok(PLACES.includes(w), k.id + ': unknown place ' + w);
      }
    }
  },
  'No two shortcuts share a key in the same place': () => {
    const seen = new Map();
    for (const k of KEY_LIST) {
      if (!k.run) continue;
      for (const list of combos(k)) for (const key of list) for (const w of k.where) {
        const at = w + ' ' + key, other = seen.get(at);
        // A shortcut that hands the key on (when(), or run returning false) may share it; list those here.
        const shared = ['nextMatch Enter', 'prevMatch Shift+Enter'];
        if (other && other !== k.id) assert.ok(shared.includes(k.id + ' ' + key) || shared.includes(other + ' ' + key) || k.when || KEY_LIST.find(x => x.id === other).when, at + ': ' + other + ' and ' + k.id);
        seen.set(at, k.id);
      }
    }
  },
  'No key the browser keeps for itself': () => {
    const reserved = ['Mod+N', 'Mod+T', 'Mod+W', 'Mod+Shift+N', 'Mod+Shift+T', 'Mod+Shift+W', 'Mod+Q', 'Mod+Tab', 'Mod++', 'Mod+-', 'Mod+0', 'Mod+L', 'Mod+D', 'Mod+H', 'Mod+J', 'Mod+R', 'Mod+P', 'Mod+U', 'Mod+K', 'Mod+E', 'Alt+ArrowLeft', 'Alt+ArrowRight', 'F5', 'F6', 'F11', 'F12'];
    for (const k of KEY_LIST) for (const list of combos(k)) for (const key of list) assert.ok(!reserved.includes(key), k.id + ' uses ' + key);
  }
};
let failed = 0;
for (const [name, fn] of Object.entries(tests)) {
  try { fn(); console.log('ok  ', name); } catch (e) { failed++; console.log('FAIL', name, '\n    ', e.message); }
}
console.log(failed ? failed + ' failed' : 'all ' + Object.keys(tests).length + ' passed');
process.exit(failed ? 1 : 0);
