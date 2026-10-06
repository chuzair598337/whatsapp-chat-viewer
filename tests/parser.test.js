/* Parser tests. Run with: node tests/parser.test.js (Node 18 or later, no packages needed).
   They load js/parser.js as the browser does and check export lines the sample chat can't show,
   since the sample is an English iPhone export. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const ctx = { TextDecoder, setTimeout, Blob, URL, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/parser.js'), 'utf8') + '\n;this.P = parserModule();', ctx);
const parse = (text, opts) => ctx.P.parse(new Blob([text]), opts || {});
const at = r => Array.from(r.messages, m => m.timestamp); // copied out of the vm context so deepStrictEqual compares plain arrays

const tests = {
  'English iPhone, 12-hour': async () => {
    const r = await parse('[14/03/2026, 8:05:19 AM] A: hi\n[14/03/2026, 1:05:19 PM] B: yo');
    assert.deepStrictEqual(at(r), ['2026-03-14T08:05:19', '2026-03-14T13:05:19']);
    assert.strictEqual(r.format, 'ios');
  },
  'Chinese 上午/下午 before the time': async () => assert.deepStrictEqual(at(await parse('2021/1/2 上午10:00 - A: x\n2021/1/2 下午3:05 - B: y')), ['2021-01-02T10:00:00', '2021-01-02T15:05:00']),
  'Japanese 午前/午後': async () => assert.deepStrictEqual(at(await parse('2021/01/02 午前10:00 - A: x\n2021/01/02 午後1:00 - B: y')), ['2021-01-02T10:00:00', '2021-01-02T13:00:00']),
  'Korean 오후 (iPhone)': async () => assert.deepStrictEqual(at(await parse('[2021-01-02 오후 2:30:00] A: x')), ['2021-01-02T14:30:00']),
  'German vorm./nachm.': async () => assert.deepStrictEqual(at(await parse('02.01.21, 10:00 vorm. - A: x\n02.01.21, 3:00 nachm. - B: y')), ['2021-01-02T10:00:00', '2021-01-02T15:00:00']),
  'Arabic comma and م': async () => assert.deepStrictEqual(at(await parse('2/1/21، 10:00 م - A: x')), ['2021-01-02T22:00:00']),
  'Spanish p. m.': async () => assert.deepStrictEqual(at(await parse('2/1/21, 10:00 p. m. - A: x')), ['2021-01-02T22:00:00']),
  'Android "null" is not shown as text': async () => {
    const r = await parse('1/1/21, 00:02 - Bob: null\n1/1/21, 00:03 - Bob: ok');
    assert.strictEqual(r.messages[0].kind, 'unsupported');
    assert.strictEqual(r.messages[1].message, 'ok');
  },
  'A forced date order that gives month 13 is rejected': async () => {
    const r = await parse('13/01/2021, 10:00 - A: x\n12/01/2021, 10:00 - A: y', { order: 'mdy' });
    assert.strictEqual(r.order, 'dmy'); assert.strictEqual(r.rejected, true);
    assert.strictEqual(r.messages[0].timestamp, '2021-01-13T10:00:00');
  },
  'iPhone: a caption over several lines before the file keeps the photo': async () => {
    const r = await parse('[19/08/2022, 9:15:02 PM] Ali: First line\nSecond line \u200e<attached: 00000127-PHOTO-2022-08-19-21-15-02.jpg>');
    const m = r.messages[0];
    assert.strictEqual(m.kind, 'media'); assert.strictEqual(m.attachments.length, 1);
    assert.strictEqual(m.attachments[0].name, '00000127-PHOTO-2022-08-19-21-15-02.jpg');
    assert.strictEqual(m.message, 'First line\nSecond line');
  },
  'iPhone: a caption with "<" before the file, and text after it': async () => {
    const r = await parse('[19/08/2022, 9:15:02 PM] Ali: 2 < 3 <attached: 00000128-PHOTO-2022-08-19-21-15-03.jpg>\nafter');
    assert.strictEqual(r.messages[0].attachments[0].name, '00000128-PHOTO-2022-08-19-21-15-03.jpg');
    assert.strictEqual(r.messages[0].message, '2 < 3\nafter');
  },
  'iPhone: a document title and page count still read as the title': async () => {
    const r = await parse('[19/08/2022, 9:15:02 PM] Ali: Report.pdf • 2 pages <attached: 00000022-Report.pdf>');
    const a = r.messages[0].attachments[0];
    assert.strictEqual(a.title, 'Report.pdf'); assert.strictEqual(a.detail, '2 pages'); assert.strictEqual(r.messages[0].message, '');
  },
  'iPhone group: admin events do not make the admin the chat name': async () => {
    const L = '‎';
    const r = await parse(['[1/2/2024, 9:00:00 AM] Crew: ' + L + 'Ali added Sara',
      '[1/2/2024, 9:01:00 AM] ~ Ali: ' + L + "~ Ali changed this group's icon",
      '[1/2/2024, 9:02:00 AM] ~ Ali: ' + L + '~ Ali changed the group description',
      '[1/2/2024, 9:03:00 AM] ~ Ali: ' + L + '~ Ali turned on admin approval',
      '[1/2/2024, 9:04:00 AM] ~ Ali: hello', '[1/2/2024, 9:05:00 AM] Sara: hi'].join('\n'));
    assert.strictEqual(r.chatName, 'Crew');
  },
  'iPhone: the encryption notice names the chat': async () => {
    const L = '‎';
    const r = await parse(['[1/2/2024, 9:00:00 AM] Crew: ' + L + 'Messages and calls are end-to-end encrypted. No one outside of this chat can read them.',
      '[1/2/2024, 9:01:00 AM] Bob: ' + L + 'Bob joined using this group\'s invite link',
      '[1/2/2024, 9:02:00 AM] Zed: ' + L + 'Zed left', '[1/2/2024, 9:03:00 AM] Zed: ' + L + 'Zed joined', '[1/2/2024, 9:04:00 AM] Bob: hi'].join('\n'));
    assert.strictEqual(r.chatName, 'Crew');
  },
  'A forced date order that fits is used': async () => {
    const r = await parse('03/01/2021, 10:00 - A: x', { order: 'mdy' });
    assert.strictEqual(r.order, 'mdy'); assert.strictEqual(r.rejected, false);
  }
};
(async () => {
  let failed = 0;
  for (const [name, fn] of Object.entries(tests)) {
    try { await fn(); console.log('ok   ' + name); } catch (e) { failed++; console.log('FAIL ' + name + '\n     ' + e.message.split('\n').join('\n     ')); }
  }
  console.log(failed ? failed + ' failed' : 'all ' + Object.keys(tests).length + ' passed');
  process.exit(failed ? 1 : 0);
})();
