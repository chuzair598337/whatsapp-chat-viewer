"use strict";
/* =====================================================================
   Demo chat: a made-up WhatsApp group shown on first load and used by the
   guided tour (js/tour-controller.js). It covers every message type the
   viewer renders. Its media is generated on this device, so nothing is
   fetched. Loaded before app.js; only read when the sample is shown.
   ===================================================================== */
const L = '‎', N = ' ';
const SAMPLE = [
  `[14/03/2026, 8:02:11${N}AM] Weekend Hiking Crew: ${L}Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them.`,
  `[14/03/2026, 8:02:11${N}AM] Weekend Hiking Crew: ${L}Ayesha Khan created group “Weekend Hiking Crew”`,
  `[14/03/2026, 8:02:15${N}AM] Weekend Hiking Crew: ${L}Ayesha Khan added Bilal Ahmed, Sara Malik and Omar Farooq`,
  `[14/03/2026, 8:02:20${N}AM] Weekend Hiking Crew: ${L}Ayesha Khan changed the message timer. New messages will disappear from this chat 90 days after they're sent, except when kept.`,
  `[14/03/2026, 8:03:40${N}AM] Ayesha Khan: Morning all! Saturday plan for *Trail 5* 🥾`,
  `[14/03/2026, 8:04:02${N}AM] Ayesha Khan: - Meet at 6:30 at the trailhead`, `- Bring 2L water each`, `- Back by noon`,
  `[14/03/2026, 8:05:19${N}AM] Sara Malik: I'm in! _finally_ a cool morning`,
  `[14/03/2026, 8:05:51${N}AM] Omar Farooq: Count me in too 🙌`,
  `[14/03/2026, 8:06:30${N}AM] Bilal Ahmed: Same. I'll bring the first aid kit`,
  `[14/03/2026, 8:07:12${N}AM] Sara Malik: زبردست! میں سب کے لیے چائے کا تھرماس لے آؤں گی ☕`,
  `[14/03/2026, 8:07:12${N}AM] Omar Farooq: ${L}<attached: 00000007-PHOTO-2026-03-14-08-07-12.jpg>`,
  `[14/03/2026, 8:07:30${N}AM] Omar Farooq: That's the route map from last time`,
  `[14/03/2026, 8:09:03${N}AM] Sara Malik: ${L}POLL:`, `${L}Breakfast after the hike?`, `${L}OPTION: Paratha place (3 votes)`, `${L}OPTION: Coffee only (1 vote)`, `${L}OPTION: Straight home (0 votes)`,
  `[14/03/2026, 8:15:44${N}AM] Ayesha Khan: ~Saturday~ Sunday actually, rain is forecast for Saturday ☔`,
  `[14/03/2026, 8:16:02${N}AM] Bilal Ahmed: Sunday works better for me anyway`,
  `[14/03/2026, 8:16:20${N}AM] Bilal Ahmed: اتوار ٹھیک ہے، میں گاڑی لے آؤں گا`,
  `${L}[14/03/2026, 8:16:40${N}AM] Omar Farooq: ${L}This message was deleted.`,
  `${L}[14/03/2026, 8:17:10${N}AM] Bilal Ahmed: ${L}You deleted this message.`,
  `[14/03/2026, 9:20:13${N}PM] Bilal Ahmed: ${L}Missed voice call, ${L}Tap to call back`,
  `[14/03/2026, 9:21:55${N}PM] Ayesha Khan: sorry, was driving. Will call later`,
  `[15/03/2026, 6:00:02${N}AM] Weekend Hiking Crew: ${L}Your security code with Omar Farooq changed. Tap to learn more.`,
  `[15/03/2026, 6:12:08${N}AM] Bilal Ahmed: ${L}Location: https://maps.google.com/?q=33.7380,73.0750`,
  `[15/03/2026, 6:12:30${N}AM] Bilal Ahmed: Parking is full at the main gate, use this one`,
  `[15/03/2026, 6:14:02${N}AM] Sara Malik: GPX file for the route: https://github.com/trail-crew/trail-5-gpx`,
  `[15/03/2026, 6:15:40${N}AM] Ayesha Khan: And last year's video so you know the climb https://www.youtube.com/watch?v=trail5-2025 also the weather https://www.metoffice.gov.uk/weather/forecast`,
  `[15/03/2026, 6:17:05${N}AM] Bilal Ahmed: The ranger desk said "https://www.example.org/trail-5/conditions" is updated every morning`,
  `[15/03/2026, 6:18:30${N}AM] Omar Farooq: Rules from the board at the gate:`, `1. Stay on the marked path`, `2. Pack out all litter`, `10. Be back before sunset (no idea where 3 to 9 went 😅)`,
  `[15/03/2026, 6:20:41${N}AM] Sara Malik: 5 min away`,
  `[15/03/2026, 6:41:09${N}AM] Omar Farooq: Wifi code for the café later is \`\`\`TRAIL-2026\`\`\``,
  `[15/03/2026, 11:47:50${N}AM] Omar Farooq: ${L}<attached: 00000016-GIF-2026-03-15-11-47-50.mp4>`,
  `[15/03/2026, 11:48:22${N}AM] Ayesha Khan: ${L}<attached: 00000017-VIDEO-2026-03-15-11-48-22.mp4>`,
  `${L}[15/03/2026, 11:48:25${N}AM] Omar Farooq: ${L}video omitted`,
  `[15/03/2026, 11:48:31${N}AM] Ayesha Khan: ${L}<attached: 00000018-PHOTO-2026-03-15-11-48-31.jpg>`,
  `[15/03/2026, 11:48:40${N}AM] Ayesha Khan: Summit! 🏔️`,
  `[15/03/2026, 11:49:02${N}AM] Sara Malik: 😍😍`,
  `[15/03/2026, 11:49:05${N}AM] Bilal Ahmed: reacted ❤️ to "Summit!"`,
  `[15/03/2026, 11:49:06${N}AM] Omar Farooq: reacted 🔥 to "Summit!"`,
  `[15/03/2026, 11:49:30${N}AM] Sara Malik: ${L}<attached: 00000019-STICKER-2026-03-15-11-49-30.webp>`,
  `[15/03/2026, 11:52:03${N}AM] Omar Farooq: ${L}<attached: 00000021-PHOTO-2026-03-15-11-52-03.jpg>`,
  `[15/03/2026, 11:50:17${N}AM] Omar Farooq: > Back by noon`, `Not happening 😂 ${L}<This message was edited>`,
  `[15/03/2026, 7:30:55${N}PM] Bilal Ahmed: ${L}<attached: 00000026-Trail-notes.pdf>`,
  `[15/03/2026, 7:31:05${N}PM] Bilal Ahmed: ${L}<attached: 00000027-Gear-checklist.txt>`,
  `[15/03/2026, 7:31:20${N}PM] Bilal Ahmed: Notes and timings for next time. Total *11.4 km*, 3h 52m moving`,
  `[15/03/2026, 7:32:10${N}PM] Ayesha Khan: Trip report for anyone who missed it 📝 We started at 6:40 from the lower car park, a little later than planned because the main gate was full. The first hour through the pine forest was easy and cool, and we stopped at the spring for water. After the spring the trail gets *much steeper and rockier for about two kilometres*, so take it slow and keep your hands free. Omar spotted a family of monkeys near the second viewpoint (please don't feed them!). We reached the summit at 9:55, had tea and parathas, and the views over the valley were completely clear. Coming down took just under two hours. Next time we should start at 6:00 sharp, bring more snacks, and carry a light jacket because it gets windy at the top. Total cost per person was 1,200 for fuel and breakfast. Thanks everyone for a great morning, same crew next month? 🏔️`,
  `[15/03/2026, 7:32:40${N}PM] Sara Malik: Packing list for next time:`, `1. Water, at least 2L`, `2. Snacks and dates`, `3. Light jacket`, `4. Sunscreen and a cap`, `5. First aid kit (Bilal has it)`, `6. Power bank`, `7. Trekking poles if you have them`, `8. Cash for parking`, `9. A small bag for rubbish`, `_Anything else?_`,
  `[15/03/2026, 7:33:02${N}PM] Weekend Hiking Crew: ${L}Sara Malik changed the group description`,
  `[16/03/2026, 9:02:44${N}AM] Ayesha Khan: ${L}Voice call, ${L}12 min`,
  `[16/03/2026, 9:15:10${N}AM] Ayesha Khan: Same time next month? 🗓️`,
  `[16/03/2026, 9:16:03${N}AM] Sara Malik: ${L}<attached: 00000030-AUDIO-2026-03-16-09-16-03.opus>`,
  `[16/03/2026, 9:16:20${N}AM] Bilal Ahmed: ${L}<attached: 00000031-Trail-playlist.mp3>`,
  `[16/03/2026, 9:16:45${N}AM] Bilal Ahmed: ${L}<attached: 00000032-Margalla Park Rangers.vcf>`,
  `[16/03/2026, 9:16:52${N}AM] Bilal Ahmed: Ranger desk number, in case anyone gets lost next time`,
  `[16/03/2026, 9:16:30${N}AM] Omar Farooq: 👍`,
  `[02/04/2026, 7:45:10${N}PM] Sara Malik: ${L}<attached: 00000033-PHOTO-2026-04-02-19-45-10.jpg>`,
  `[02/04/2026, 7:45:30${N}PM] Sara Malik: Scouting photo for April's trail. Route details: https://www.alltrails.com/trail/ridge-loop`,
  `[02/04/2026, 7:46:02${N}PM] Sara Malik: Parking for the ridge loop is behind the tea stall`,
  `Bring coins for the meter ${L}<attached: 00000034-PHOTO-2026-04-02-19-46-02.jpg>`,
  // April: ten more members join, so "Which one is you?" gets its name filter (more than 12 people).
  `[03/04/2026, 8:00:00${N}AM] Weekend Hiking Crew: ${L}Ayesha Khan added Hamza Iqbal, Zainab Raza, Usman Tariq, Mariam Siddiqui, Faisal Qureshi, Hina Aslam, Kamran Shah, Nida Hussain, Imran Javed and Sana Mirza`,
  // An iPhone admin event is "sent" by the admin; the chat's name must still come from the group, not from Ayesha.
  `[03/04/2026, 8:00:30${N}AM] ~ Ayesha Khan: ${L}~ Ayesha Khan changed this group's icon`,
  // Arabic spellings (ك ي) and vowel marks: search for کیا or السلام finds this.
  `[03/04/2026, 8:01:10${N}AM] Hamza Iqbal: السَّلامُ عَلَيْكُم سب کو! كيا حال ہے؟`,
  // An English line, then Urdu ones: each line reads in its own direction.
  `[03/04/2026, 8:02:00${N}AM] Zainab Raza: Trail rules, page 2`, `اپنا کچرا ساتھ واپس لے جائیں۔`, `راستے سے باہر نہ جائیں۔`,
  // English, an Arabic verse and its Urdu translation in one message: each line gets its own font
  // (Arabic in Naskh, Urdu in Nastaliq) and direction, in every interface language.
  `[03/04/2026, 8:02:30${N}AM] Ayesha Khan: Quote for the climb:`, `إِنَّ مَعَ الْعُسْرِ يُسْرًا`, `بے شک ہر مشکل کے ساتھ آسانی ہے۔`,
  // Plain Arabic (no vowel marks), shown in the Arabic font.
  `[03/04/2026, 8:02:45${N}AM] Omar Farooq: صباح الخير يا شباب، هل الجميع جاهز للرحلة؟`,
  `[03/04/2026, 8:03:00${N}AM] Usman Tariq: In ✋`,
  `[03/04/2026, 8:04:00${N}AM] Mariam Siddiqui: Count me in`,
  `[03/04/2026, 8:05:00${N}AM] Faisal Qureshi: Me too, first hike!`,
  `[03/04/2026, 8:06:00${N}AM] Hina Aslam: In, can someone give me a lift?`,
  `[03/04/2026, 8:07:00${N}AM] Kamran Shah: In 👍`,
  `[03/04/2026, 8:08:00${N}AM] Nida Hussain: Maybe, will confirm Friday`,
  `[03/04/2026, 8:09:00${N}AM] Imran Javed: In`,
  `[03/04/2026, 8:10:00${N}AM] Sana Mirza: Bringing my cousin too, if that's okay`,
  // An iPhone animated sticker (.was, plays with the bundled Lottie player) and an iPhone HEIC photo.
  `[03/04/2026, 8:12:00${N}AM] Omar Farooq: ${L}<attached: 00000035-STICKER-2026-04-03-08-12-00.was>`,
  `[03/04/2026, 8:13:00${N}AM] Hamza Iqbal: ${L}<attached: 00000036-PHOTO-2026-04-03-08-13-00.heic>`,
  // Someone saved only as a phone number (a made-up 555 number): give them a nickname in Settings › Participants and nicknames.
  `[03/04/2026, 8:20:00${N}AM] Weekend Hiking Crew: ${L}Ayesha Khan added +1 555 0142`,
  `[03/04/2026, 8:21:00${N}AM] +1 555 0142: Hi all, Zain here 👋 Ayesha's cousin. Save my number!`,
  `[03/04/2026, 8:21:30${N}AM] Sara Malik: Welcome Zain! See you at the trailhead`,
].join('\r\n');
/* Generated stand-ins for the sample's media (nothing is fetched). */
// A two-second Lottie animation: a yellow star that spins and pulses over a bouncing shadow.
function sampleLottie() {
  const st = v => ({ a: 0, k: v }), ease = n => ({ x: Array(n).fill(0.5), y: Array(n).fill(0.5) });
  const keys = (vals, n) => ({ a: 1, k: vals.map(([t, s], k) => k < vals.length - 1 ? { t, s, i: ease(n), o: ease(n) } : { t, s }) });
  const tr = { ty: 'tr', p: st([0, 0]), a: st([0, 0]), s: st([100, 100]), r: st(0), o: st(100), sk: st(0), sa: st(0) };
  const layer = (ind, nm, ks, shapes) => ({ ddd: 0, ind, ty: 4, nm, sr: 1, ao: 0, ip: 0, op: 60, st: 0, bm: 0, ks: Object.assign({ o: st(100), r: st(0), p: st([256, 256, 0]), a: st([0, 0, 0]), s: st([100, 100, 100]) }, ks), shapes });
  return {
    v: '5.7.4', fr: 30, ip: 0, op: 60, w: 512, h: 512, nm: 'Summit star', ddd: 0, assets: [],
    layers: [
      layer(1, 'star', { r: keys([[0, [0]], [60, [360]]], 1), p: keys([[0, [256, 236, 0]], [30, [256, 196, 0]], [60, [256, 236, 0]]], 3), s: keys([[0, [92, 92, 100]], [30, [108, 108, 100]], [60, [92, 92, 100]]], 3) },
        [{ ty: 'gr', nm: 'star', it: [{ ty: 'sr', sy: 1, d: 1, pt: st(5), p: st([0, 0]), r: st(0), ir: st(72), is: st(0), or: st(168), os: st(0) },
          { ty: 'st', c: st([1, 1, 1, 1]), o: st(100), w: st(18), lc: 2, lj: 2 }, { ty: 'fl', c: st([1, 0.83, 0.31, 1]), o: st(100), r: 1 }, tr] }]),
      layer(2, 'shadow', { p: st([256, 452, 0]), s: keys([[0, [100, 100, 100]], [30, [70, 70, 100]], [60, [100, 100, 100]]], 3) },
        [{ ty: 'gr', nm: 'shadow', it: [{ ty: 'el', d: 1, p: st([0, 0]), s: st([220, 40]) }, { ty: 'fl', c: st([0, 0, 0, 1]), o: st(22), r: 1 }, tr] }])
    ]
  };
}
const canvasBlob = (c, type, q) => new Promise(r => c.toBlob(b => r(b), type, q));
function makeWav(sec) {
  const sr = 16000, n = Math.floor(sr * sec), buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const w = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const t = i / sr, env = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2.6)), 2) * Math.min(1, (sec - t) * 4);
    const f = 150 + 35 * Math.sin(t * 1.7);
    const x = (Math.sin(2 * Math.PI * f * t) * 0.6 + Math.sin(4 * Math.PI * f * t) * 0.25 + Math.sin(6 * Math.PI * f * t) * 0.1) * env * 0.22;
    v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, x)) * 32767, true);
  }
  return new Blob([buf], { type: 'audio/wav' });
}
function makePdf(lines) {
  const content = 'BT /F1 20 Tf 72 730 Td (' + lines[0] + ') Tj /F1 12 Tf ' + lines.slice(1).map(l => '0 -24 Td (' + l + ') Tj').join(' ') + ' ET';
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', '<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream'];
  let pdf = '%PDF-1.4\n';
  const offs = [];
  objs.forEach((o, i) => { offs.push(pdf.length); pdf += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
  const x = pdf.length;
  pdf += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') +
    'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + x + '\n%%EOF';
  return new Blob([pdf], { type: 'application/pdf' });
}
async function makeSampleMedia() {
  const staged = new Map();
  // Route map
  let c = document.createElement('canvas'); c.width = 960; c.height = 720;
  let g = c.getContext('2d');
  g.fillStyle = '#dfe9d2'; g.fillRect(0, 0, 960, 720);
  g.strokeStyle = 'rgba(80,110,60,.35)'; g.lineWidth = 2;
  for (let k = 0; k < 9; k++) { g.beginPath(); g.ellipse(620, 300, 70 + k * 46, 50 + k * 34, -0.4, 0, Math.PI * 2); g.stroke(); }
  g.strokeStyle = '#6aa6d8'; g.lineWidth = 8; g.beginPath(); g.moveTo(0, 610); g.bezierCurveTo(260, 560, 380, 700, 960, 640); g.stroke();
  g.setLineDash([18, 12]); g.strokeStyle = '#d6452f'; g.lineWidth = 7; g.beginPath(); g.moveTo(110, 600); g.bezierCurveTo(260, 470, 300, 520, 420, 420); g.bezierCurveTo(520, 330, 520, 280, 620, 300); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#d6452f'; g.beginPath(); g.arc(110, 600, 14, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#1d3a24'; g.beginPath(); g.moveTo(620, 268); g.lineTo(644, 312); g.lineTo(596, 312); g.closePath(); g.fill();
  g.font = '600 34px system-ui, sans-serif'; g.fillText('Trail 5  ·  11.4 km', 60, 80);
  g.font = '26px system-ui, sans-serif'; g.fillText('Start', 80, 650); g.fillText('Summit 1,604 m', 660, 330);
  staged.set('map', ['00000007-PHOTO-2026-03-14-08-07-12.jpg', await canvasBlob(c, 'image/jpeg', 0.86)]);
  // Summit photo (portrait)
  c = document.createElement('canvas'); c.width = 720; c.height = 960; g = c.getContext('2d');
  let gr = g.createLinearGradient(0, 0, 0, 960); gr.addColorStop(0, '#f7b267'); gr.addColorStop(0.5, '#f4845f'); gr.addColorStop(1, '#5b3758');
  g.fillStyle = gr; g.fillRect(0, 0, 720, 960);
  g.fillStyle = '#fff3c4'; g.beginPath(); g.arc(520, 330, 70, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#3d2c4e'; g.beginPath(); g.moveTo(0, 760); g.lineTo(180, 520); g.lineTo(300, 640); g.lineTo(460, 430); g.lineTo(720, 720); g.lineTo(720, 960); g.lineTo(0, 960); g.fill();
  g.fillStyle = '#24182f'; g.beginPath(); g.moveTo(0, 860); g.lineTo(240, 700); g.lineTo(420, 820); g.lineTo(720, 760); g.lineTo(720, 960); g.lineTo(0, 960); g.fill();
  staged.set('summit', ['00000018-PHOTO-2026-03-15-11-48-31.jpg', await canvasBlob(c, 'image/jpeg', 0.86)]);
  // Sticker
  c = document.createElement('canvas'); c.width = 320; c.height = 320; g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(160, 150, 120, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffd34e'; g.beginPath(); g.arc(160, 150, 108, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#3b2a1a'; g.beginPath(); g.arc(120, 125, 13, 0, Math.PI * 2); g.arc(200, 125, 13, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#3b2a1a'; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.arc(160, 160, 55, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  g.fillStyle = '#fff'; g.strokeStyle = '#1d6b4f'; g.lineWidth = 8; g.font = '800 46px system-ui, sans-serif'; g.textAlign = 'center';
  g.strokeText('Summit!', 160, 300); g.fillText('Summit!', 160, 300);
  const webp = await canvasBlob(c, 'image/webp', 0.9) || await canvasBlob(c, 'image/png');
  staged.set('stk', ['00000019-STICKER-2026-03-15-11-49-30.webp', webp]);
  staged.set('pdf', ['00000026-Trail-notes.pdf', makePdf(['Trail 5 notes', 'Distance: 11.4 km', 'Moving time: 3 h 52 min', 'Elevation gain: 720 m', 'Water used: about 1.6 L each', 'Next time: start 30 minutes earlier'])]);
  staged.set('voice', ['00000030-AUDIO-2026-03-16-09-16-03.opus', makeWav(6)]);
  staged.set('song', ['00000031-Trail-playlist.mp3', makeWav(9)]);
  staged.set('vcf', ['00000032-Margalla Park Rangers.vcf', new Blob([['BEGIN:VCARD', 'VERSION:3.0', 'N:;Margalla Park Rangers;;;', 'FN:Margalla Park Rangers',
    'ORG:Margalla Park Rangers', 'TEL;type=WORK;type=VOICE;waid=15550100:+1 555 0100', 'EMAIL;type=WORK:desk@rangers.example', 'END:VCARD'].join('\r\n')], { type: 'text/vcard' })]);
  // April scouting photo (a second month, for the media gallery's month sections)
  c = document.createElement('canvas'); c.width = 720; c.height = 960; g = c.getContext('2d');
  let sky = g.createLinearGradient(0, 0, 0, 960); sky.addColorStop(0, '#f7b267'); sky.addColorStop(1, '#f4845f'); g.fillStyle = sky; g.fillRect(0, 0, 720, 960);
  g.fillStyle = '#5b3a5e'; g.beginPath(); g.moveTo(0, 620); g.lineTo(200, 430); g.lineTo(330, 540); g.lineTo(520, 360); g.lineTo(720, 560); g.lineTo(720, 960); g.lineTo(0, 960); g.fill();
  g.fillStyle = '#3a2440'; g.beginPath(); g.moveTo(0, 760); g.lineTo(260, 640); g.lineTo(460, 720); g.lineTo(720, 650); g.lineTo(720, 960); g.lineTo(0, 960); g.fill();
  g.fillStyle = 'rgba(255,255,255,.9)'; g.font = 'bold 40px sans-serif'; g.fillText('Ridge loop, April', 40, 90);
  staged.set('apr', ['00000033-PHOTO-2026-04-02-19-45-10.jpg', await canvasBlob(c, 'image/jpeg', 0.86)]);
  // Parking photo: its caption runs over two lines before the file tag, as iPhone exports write it
  c = document.createElement('canvas'); c.width = 960; c.height = 720; g = c.getContext('2d');
  g.fillStyle = '#9fb7c9'; g.fillRect(0, 0, 960, 720); g.fillStyle = '#6d7b86'; g.fillRect(0, 430, 960, 290);
  g.strokeStyle = '#f1f1f1'; g.lineWidth = 8; for (let x = 60; x < 960; x += 150) { g.beginPath(); g.moveTo(x, 470); g.lineTo(x + 50, 700); g.stroke(); }
  g.fillStyle = '#1565c0'; g.fillRect(80, 120, 150, 150); g.fillStyle = '#fff'; g.font = 'bold 120px sans-serif'; g.fillText('P', 115, 238);
  g.fillStyle = 'rgba(255,255,255,.92)'; g.font = 'bold 40px sans-serif'; g.fillText('Ridge loop parking', 270, 210);
  staged.set('park', ['00000034-PHOTO-2026-04-02-19-46-02.jpg', await canvasBlob(c, 'image/jpeg', 0.86)]);
  // iPhone animated sticker: a small Lottie animation in a ZIP, like WhatsApp's .was files.
  staged.set('was', ['00000035-STICKER-2026-04-03-08-12-00.was', await new JSZip().file('animation/animation.json', JSON.stringify(sampleLottie())).generateAsync({ type: 'blob' })]);
  // An iPhone HEIC photo (a small made-up mountain picture, 7 KB). Outside Safari it is drawn with the bundled HEIC decoder.
  staged.set('heic', ['00000036-PHOTO-2026-04-03-08-13-00.heic', new Blob([Uint8Array.from(atob(SAMPLE_HEIC), ch => ch.charCodeAt(0))], { type: 'image/heic' })]);
  staged.set('txt', ['00000027-Gear-checklist.txt', new Blob(['Gear checklist\n- 2 L water\n- Rain jacket\n- First aid kit\n- Head torch\n- Snacks\n'], { type: 'text/plain' })]);
  const out = new Map();
  for (const [, [name, blob]] of staged) if (blob) Media.stage(out, name, blob);
  return out;
}
/* The sample's video and GIF are recorded from a canvas animation after the chat is on screen. */
async function makeSampleVideo() {
  if (typeof MediaRecorder === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = 640; c.height = 360;
  const g = c.getContext('2d');
  if (!c.captureStream) return null;
  const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
  const type = types.find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
  if (!type) return null;
  const rec = new MediaRecorder(c.captureStream(30), { mimeType: type, videoBitsPerSecond: 900000 });
  const chunks = [];
  rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  const t0 = performance.now(), dur = 3000;
  const draw = () => {
    const t = Math.min(1, (performance.now() - t0) / dur);
    const gr = g.createLinearGradient(0, 0, 0, 360); gr.addColorStop(0, '#8fd3fe'); gr.addColorStop(1, '#f6e7c1');
    g.fillStyle = gr; g.fillRect(0, 0, 640, 360);
    g.fillStyle = '#ffd34e'; g.beginPath(); g.arc(520, 70 + 30 * t, 34, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#5b7f4f'; g.beginPath(); g.moveTo(0, 360); g.lineTo(0, 260); g.lineTo(200, 140); g.lineTo(330, 220); g.lineTo(470, 110); g.lineTo(640, 250); g.lineTo(640, 360); g.fill();
    const x = 40 + 420 * t, y = 300 - 190 * Math.sin(t * Math.PI / 2) - 6 * Math.abs(Math.sin(t * 40));
    g.fillStyle = '#d6452f'; g.beginPath(); g.arc(x, y, 10, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1d3a24'; g.font = '600 26px system-ui, sans-serif'; g.fillText('Trail 5 summit push', 24, 44);
    if (t < 1) requestAnimationFrame(draw);
  };
  const done = new Promise(r => { rec.onstop = r; });
  rec.start(250); draw();
  await new Promise(r => setTimeout(r, dur + 120));
  rec.stop(); await done;
  return chunks.length ? new Blob(chunks, { type: type.split(';')[0] }) : null;
}
// The sample HEIC photo (480 x 360, made up for the sample chat), base64.
const SAMPLE_HEIC = 'AAAAHGZ0eXBoZWljAAAAAG1pZjFoZWljbWlhZgAAAVdtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAACJpbG9jAAAAAERAAAEAAQAAAAABewABAAAAAAAAGhYAAAAjaWluZgAAAAAAAQAAABVpbmZlAgAAAAABAABodmMxAAAAAA5waXRtAAAAAAABAAAA12lwcnAAAAC4aXBjbwAAAHlodmNDAQNwAAAAAAAAAAAAP/AA/P34+AAADwNgAAEAGEABDAH//wNwAAADAJAAAAMAAAMAP7oCQGEAAQAsQgEBA3AAAAMAkAAAAwAAAwA/oA8IBaWW6kkprm4CGgwIAAADAMgAAAMACEBiAAEAB0QBwXKwYkAAAAATY29scm5jbHgAAQANAAaAAAAAFGlzcGUAAAAAAAAB4AAAAWgAAAAQcGl4aQAAAAADCAgIAAAAF2lwbWEAAAAAAAAAAQABBIECAwQAABoebWRhdAAAGhIoAa8JzDBFUv21D55PICE5MpGYCAKACZvthtpV/EYhTzj5Ut36aeg4eOa8NW7RiP0XvqsaVVWVxwQg4ct6wE4+ef0eK9wn6SvN1uEI+MOKB/ud9F0S/bVxVQU4xBOC2SkPs4AE0ACDAJzERiAkwwRficHQgQOcRueQOdU24VJr5wwfDDpHnYxHta3zYmZeBsPTXnR9vJs5iSNnGNozpElAt8zAZfE5bgQinRQnqmNOj4Lezj8nGNG/Cp+waGXucsyF5emwPOaFgxWUs4rhGhmrYLnv9/5m+sAdLZrmuem5buJCQnIAsMGiZ/8ODGNDCCypYo3s4b+o+YfQAwV5WqprQNzgJOqzaquqjaYrFRk/6Vm9R8AjjVDxOhPOz24VXcsCVMiApj2X+bNPGnhGzXOcuvMJ5lxs3K3VBekCRnzaKtrwxLMSeFVSe6pGg1M17v3mYvlOPAdZRHeoFm5Npb3MnsMim3RD1KkS+QYP0iPIJChoxgCcwEvaD+nYgZz1L/v3stnjfoNX/66zSN/ZmX/s8Xn+R/leGK7GeSZvTaR8bfkBl1r9CTfBW5Y3Fu2ONceDDfxF8GOiCEcsq4zDoQ3LYvxTK0kR2jxi5BJSzyGM6JHksFWL4XOSd/jLH9gXUQnwXzBqKYTBXx90jFCGfyi5CYqyBtwePaG4wj4M0o7QH8vPMrabF+EZd2Wy76T2yM/BDD0t+lq1f3+/wJncXTS0uxY2NQ3xogHSSIeJEbxSso6rlYUOC7LgeD/fpNrR/apDeKYifefvP0iivUeNU0XrN3HkCov/M9TT6a6KrW9+bYlC0nTIFhKysqPIinAzEJXKJ3h8qpEJGnv+KejOdL4JPx527aQS1S1D/7jlPtjRbU4zi+rTr8wkeNFKgu+aiKvuoPlfXQifFsPSoYFi8Ft3Jlz9SnbA/rd36MgWMqI1MTwCOmSiY+aSLGIofPJhh2k8U3DtPXGPQVwawAcS52CABAffrV/9qJxbx2ABZb0Z1JLdIRbuy2v48jFWoZ1pTh5MRiWPyxq3JlEFAP9B2oKCxibeew6e/7Q4BG6vJrZ+Bq3pfbflkeRxQkbjSS6fTCrAcwMBDfmU27QCPTMK7zRnN7c/ItaiZe2KF54AcBZYEF3NX46z1Fq5g+aogjfYNcz11T6TahQCb0e9dnJQkZvvIBJbXG71vfDBbqnQJAE+vq/rjb374GsyetcrwptM07xbOOZTLZztX0nYyfBQmHfUJoBpjQnoXp34LsJ106O/5PsGwWKW5J8Q3GZrygWrqp1dcEsDM/AIMndrYUaD6gkBffdZVP3ECf+Pl99H38/t/5/R0KlPz6+p0N2d7AACR+rpsOXo/je0Ta/5PO8Uup2dRigHS7g+rU65GJAhOkmiWt0Z4oj75wGwhiVRQf8hUd/DVkvclaUJiAFGrXPzoVj5umGtKNvYWgrYLIiFdTZ8YrZzebm6NgU9NgOarGUPaWtn3xtgE6cADbKXtQAy5M2JWSPg3UcSZd8FyjLAkf8yduHzF0d2P5fhxVRQIM19S5tS2nq5+ANL9pvlKUa1s2Uq9fe2mhOCx/OD1KbAWzd391XCVvi/Lzry8kuRKexu3ygO63jvIaee+ITUALqczh+3htWQYAxCOfPH5y/mwOXiGvlF66K1hvc7BcV2olQY/dfWYwUkh0ofXLNnIBHcwj/ATKsadiHFeHTZbE/IiafKnT0pDF4WueeBqpvio4+3139H9vDspktd/t5tWfPtJ/JENpsYKCqbXxXUr7QYSv8XzlVnQH+rXp0ayLhHtfPva5sAUcTsbs9vQMW+eml256UgLb25Ng7fQW1BGRnScq0jqcwMrQ4/uyS2cLujtFWnFV0b3dHQJHon1BMWWpgrSTq+BjTdochqGT1aHTqqMb7Q33A9yLIFXMZDMvV2ujIF4heL0nj1Wz0bLIxgxoavVjAAYBANCf5bJqnjjJ8R3zDVNNNQLWna0otM0BhDp3j70RryJ6QRoUE4BsZuN1+cfVkIljCcgJyqiFZfiMybmdujo2iN3WOBSGqCjOWRSAFIYSpBh7lRDOKB/NBPG/weQVfx/Olj2c6OVQjqCYZr0anImFvYK44CTP4iCBJgGEqWXcXhkqHOw82bunZE2LEAQ+M78c1rbN4oH6vkqwHdWnW0yUSk4pXTk1BGAFnf7aWwU2NmZjPrM/TzD/2k3oPSDf8OYZX7t025Dc4TwtlrihNwBWHFxfWyIU2fTAqhqt81t37qTkIk3B7W4amp9kBpPfD0hPVnBCXT3p/UlXdV5Ay/SfT0eiSCyN1asCUESGgpq3DSVnp0xiK6bMZZ2uDV/bireR9uGxFOKDTd/IPYCVP+ZmYDsnO9RKz6K+IrxgAtAgP2W7W28HkVSBQkcCCxXmdzYmcbl8XlQFOnmam8VmO+xp9GsJfXh4QmO3RGK/2FE4N8NEEww3JO/fhCz8OfPt+XtvrDz1YMJHHjUL2w5nystFzDREQZKFoIRVXXQqLjEpXE3a0nhTs8Z2rTjaYoau3LksFi2Y3Wnp6kY9RuiPWJffyzH28OYFfMMlxMyTT8j8jz8qw2DXP2kHjcpG4MKl8QqAroYbQiC88obxt5D3Bhx98LRnsnznAWMbFuqk+Xc3m7ezWJVylEXIBZOJEqk4ah22zLuE1EKgvMtcThQzlHy3Oe2iIlsc5rwEM56+uCxeoTSi5afECvvgDejL/VcSEpi48QD8AoUvox/+0F0mH+Xarzs5COVX74s5U4are2CYWmA2UFE59NX/1HXcFy/jFySUn0o5Lq80QGTnUjYP2UBKWhtTatDWlLTZZgYL3hpIkpwIk+eGz0Jyi9b6cIynBMQodEOcbj+Nasjl+MeaPHFhm9Ol0IpU3CED8JAT9DSMDqjTzHt31//b1/9s6FNMTa0A+RhnbqcAhpMhHAljGvCRBdJh67uvZ2EF1zj2aLnqdos0NYSiSAUujYEDkmsX+PDCmEVGV/WIOlbgxqMoARO11F/GGFmb9PRNjcDBoOMy6UC+j/rGOjfOT7UbHyO/WPpljFm/pMvaoR9oUKgj18nDiiqZgnHlX48fjywds7iR7ubpejPNX2T0ACOAWQglpgslqqZYJ/03ATd5QiPjJOzc0G9SjJx6UJsymsNHXrYHaPICUooHtTRP8QyQ3mziNYoUJeYZ1o3VSxZvn4ZGLU4vqrQBB6brnaIoza5eosDfHgnl2ldFNxoQ3BjoyWIITIW1QbsPR0JDM+mf9EMRCrXMa12uzlmP+g+pPIyBV0HR030fG7Efos/fZIxDCEVJOoZYm4JwDa4msan9+v/6za8EaXAk4ppFhg6iNJw9Ce26VIytdIdv8BsW0+No1VdubhSeRPrF5qEumVwT9QMH9B6xt0xihTGui9LuhkaJkd4iBDLALTfmiLOR1etEEc1kISlZniD7p9fMzkNXhNaHJNn6+3g7LKl/dgJCJv4B3nUMLnyi9/Gju4FfpQL4SVLWMSXJP9u/gr7Cn70VXu/fgi8Kgk/pQEC49mO3ULT1srFQPJCpKORXjbc0T2bns/hL+qRT5E31/X/26UTDVo4/76Wn+62l2ojrvQaKclsu1jwXyAKkXNscbeP84EAB0KxbKRhTzhdukGgA90ETYlsO8AQIYfezc/0Rvb2G8SeiLL6sfOBdhnA6vN1dnVtH9MG3TRdrbrbtie4aNRVsQMLUWT9Z3RgnFkjsvpAm6WyHpB129wqH9o8oW2ejGTzoybd5bo7if/MOAdlSsFjiwX8POcpNsl8BX/5KWV2wYopWs0eJLWQfHQg5pP5pQ9Zroz2JvXCW5f5nDaNvKa3BiUGPJXt3T2/9T+GSmP22OsMEtliEGuS+nYxMb1IGvIikBfbgeDMR0UlzlsTkUrQY4rubMUrwfRx2qvpu0VisCRzB8EArJX+LtoGUeyA6dVdMa45/1rS3WUl+ViOvg+wPB+lssdI1Ql+wGPQJM/97NAYJhb/jhfnh+rh1T7fonVNTvDOr1wmTalZLQZp5C+/MVUrv4udrVkkO736FBpHR/9QjxiUOEoP3gULNpgDV9Cq1QVL57LeYDDzNeD09S13vn5fb2Ql5b6kKQiH6plJgh/t8sxX5f/IYcI/ctBYQRZdtBBs7xmsz8esS7bMhhEsjheYCA8Uo2AR8NL+lHL9Cdbj7BKfPy9eYKIbuW+jb4dZYsmGORfGCKuya3CbL332QadLUDKucvxp4ZGhcnB1LUR65DyHg0UFDgVZxFJqGzIL9Xr7++z/s5gKqd4FqlyTu/IEP9XJE2wvLZXxEBIPujVxK7+8nT6HPSyIK2Oe+4FZMDpPjkhR9gWtwN313KOu689WgXpEenx4AxShYY6cIsGIiETmf2Rvk6TiAhJaPQKyrMR9u2YBsWFwDMQGz2TpguIGLbTdC4yoAc+3qGaWZtvVRMDENTo2+6dMxJOYOtY5ygHiaM/oZez4waEUy+GuMnk0CfZmcESoX0aQE5P2XJutr3pITTy5kwo+hl9NsjLhy53dw0p9Td5LFhpA4rVbE8tY2njtkKZdebef6XlqBShkhdRcQblqsdX+I29ktZ+ddPu5NCZm1Qgg4Ni/xIoocg04vc93pE7cqxQ+5Ihh8Tl1r0moiVo3jJFYO1pQAj9RrkYaxrhQqXw1brzthq0FFAJ+m+IS4CWgkCQq4KDI6i8ldoF7QAqMafdQwnR29zJGAPR0vJNAKMtmj/DTMulIf+QzC166Ll8WZ09edctbhLkiEMf2r20X0fLdcfRw0OVTeBzwWv8rQpNILeCCe01yUuVxDf7/5LEBlKulB0Sd+SrbywtELMINn6mpdd+BYYllQ6r6ma490eg8lLg2wmG/+30p1tFobHSsA1rxod1jVuyCjJvnWU9GZgABaRb4ms4hH2FUiAAJZfupUwew2rf1GjXklJU+ctIbNBI94kjA2II7OPnb3HUmdDZOO0VQtCPpLINrSo+zz4I9mBBls50juKhBfWHv3b58N+gSJC7hvpCpBXIYtJ9PhhGymcOXLo4jdQxL0q9mMNF768eePQsl/bA5BOdf6ps7Whm0KNVQWZN1o7h9Ugh1t2KzvOdjq5lcQjMiOyEY7bDbClzZw30hVN/mCq6AmnuXN4gJRClum4kYALfIcq3IQX93UKG3yA/JrSjAs0xkGIPZbwzrlMKxFzDd20EHeplLFAqKvLrnJOIhxOE5iMnyFpDuaHoQQAxIgpX5xHbi8QoBl5kPUlQO3kpmg/4JfTNS9t7nddqW6d2dkPJU0g/rWEjsoCUZOcCAAAXSbWgAgoBPWD+Dxqs5iAfajzvNej0z/w0/5x0p3Xz9T9/9iSdA8kg80m6hBZXXKmgFgj3UGo20ZezttdrDmVD9xR34iCLWkD/9gxrZKEj+VztjvKbyKrYy3V03FQHiL8An+8b71f0n0GhXciiMxsmi2agIcHVN2apwETA9iQjlxj5+MnwS4I4gkIdJJhc3TINm0QC1EMR3atDnSS6jcA1DdzYLUierO8Lq3xIh/blfeUpkRDOMT9jxOztDb28iq8ZVEzWzvSU3i4cZYgAfM6UpM4N9eMlsiuickwyY62xf36JSc1pfaUW2J+N7XBWk+ze+w7u1KMZx3AuKzQsgr4JiQ79Vglct2FwAaohBruXzDCX+pvvyv8by3Vuear3UEkr57YzYBDI5ep6Q12Yw3TGl77joKBINxvH2CVYAr7kWIdQhlx/jzMQ8DxY+XH/GRdYefzw179oNsmq+wlzofzsjMGcx0lw25S8pD0vlFh5Hkf+mB/iUx0b44Qw2B9Wdfn4YH6OfJp4MypXrFte8DpDNGvb+SWh6IjrKjdEMizTP5NfKr65homlYgp9UAxrgfaCaYWraDTO4CFV2t+RUs9n+/jyFGow8vT1AgZZ/aXZ3Xar9J07ieAbPQaNpq6bLxNusrElu2jBf3y6lbEqLnAyDqy8l70sDcWYiAKwqGUw4tjN0sN71P2FLE8mdI9IZNh5wfVGVKXlW1czbF6HyIb2FrHAjN/bWOzpfXnqcTmmyQCzi2yozW3Ljy+FEUYMIMCgo2jVFjrBuBVXhLo39aZlStjfhxYizT3sq9BJ5wip9XaqEmsOH9R1IxJwITgwfhtatek+1no33LSjIBywF2pzZf5+1/Cq9V6bQ1gGZZ7rH1DeVDHXix24ONqNMf/2z7J8/Vk+tJKyneRPAXg35giuLmha0U4SiagPWUHQfB5ipcKIAJCI0FkBIpIjVaaM1PD0QdxuoDIBx1jtG65Cj/NQqg+I6NVvz2gdU5R8E5nYqCq5oWHpnp5vIv70QVmwoYaJ5llwwamRDbTnBCx8IQDi1i1zot+cAHMKekbK2Bgmi/OY9DV81BKd1WH3yvKHtlFmaUHlfgP4ELlYvkTce7J/wn/ZirhHO/U7lomju9TV/SzFwac4SnhYjt2apWw8CRZZII+2CKyePSNcCQDFzkDzPccEsiY3/lKVaT4W+4tQvhAJPN/WA+mAOHRmimEcPGAKCxO7/XLa/o5kLfOKMJnsRBnDgoZHN/Y6/qJsFWEPVXn+0AG+NpV3dXgl2oZYnS4Tl+VDlDNRACvcoTWHsK99Y5guKTn9sXlLs9n7zAkdWeShf6vX/j4tMxh4Qz7tyY69TTtASQtM+wxTvWqWmdnKnrgdSpwKhKMgDxCT5i67x8jlUFAFh4q3zNglyrbTdW75yGyBJYubxwOj5b4mbcdhY1xkd0MJXzz5l+11kFWsNONmxWVDB7B6O0AEpwY1MNEiBnVzzQ6B1UEhk45bKqoPbVNAAxSYdCDQzDtbfIesdMPG0mr01OT0xigcZ7Tj8dxQn+wCJLRegIQnICiLMQBFx5LDGIDQFFC+aO0jRkQZh97wVlHUQoCnkr9y5p54IbiEP3sgw6s1nQUZhx61ihTOC4KNuZYEQEYm6lKnYNqybiWEliwDDGDmCDyXCC48aySmqGceRqfHqUe1SJt0DlWFJugV7s6lSsGru7dgzYJNr4EowW5RnDARmUdHYZjVSL/+tGJtqy/qyHFSaTCP87HtDFBC31hxkmbW6+oAoA5kIbENhrj9HLS2mYE2fGqicU+LiI0SmYtO75Ax4QqHQj74JkYvZLSKTPHXFiUn4oMlmy4n4oRlsaQvF1hVNyf028ODr+16rv6oLrRJCmF5jv21Valu4dH78H5BzNWfCb8VIlCf7W3PUE1ffx0dSlrbP6m8rNGQl+1b23b8gHPZGb41dwhugfiEX9cjpiiunP7DmAc5EEgbD+BoIzM9NG8T1iNQ7tTbyVVszj8jqjSEdLkk5eRAcHhwhudfvb0jrJMkqh9+hjyQhiucEAoQUTyaHYmzEG6PkzF5blZKel3g1aucxMYvpp2dJ3MtT8A1PSNQLmnuMJPlkD99tdtsUOoy6+GEgWflXVa8SirrbzDEtBjiORWL1jNokfrfx16S7r6h7JsbeA15M6OnSUxAVmiEngCIDz2MlKWnc8tEMXMwLqcQLTLfIYpiLnY7WGAB6s4jX4ua8yV50pi9madupSoVQvhH8/HXq7RDORLLglE34ht149XCKI98yTRsFE4QSFNpqmzL1IZUPJ4nzU5sz7gQLuWzf3lur5wG0kCpq9UYS9rxxm6+nrrQ6QTDBUWkR+gN5l/+B8MhJQZHEIPLU+73nCG9defSoa30IZmlOSElQ3pIX9TzMmQ5d8WclWPUtYINO/Umap8HyrRiiJTWilbPp4PmFFCYBomoEQt5FnDCgnqtQ+TVvJXPstftnmeIo0FHSPtn+lkCcEAv4SHQmkTX+iZ197HaeFgBChc5PchTnUZjHjfQjFSFxk6eOdJzNzF3Fhg47idaXGw26TFSLxI22Rh2r+BGZ0jhaFyKleUt8KgwhkAB+/1vugEENmx9UyBm2VE99ZzY9DXcELIhVBeJJmKJ6AWX+kh99VqTMrhVOjU5WHS8Q7H3YS5E7sHCFNSS7LggeNadKjfkEHYL1Gy1dCgmnevE8umcIWMaDXShnJvvK3hrG1mU7m8ezXak/p+sRa6OSe8QvHfHRtD/XE19C66yHAu9Ahb2BiAm6f7SrDHq37F8/dOPIdY+3Tf3rSWO4dSlotH/vHu84nFkxYppXIY7FTo7Zw8/lkZkT8RW3CbNyX8Jk7mI4fRc/TIqoYpsFr+Zv+jaVamIAq0oWHprmZ1F3Bjqg5cKOeH+rrQX/Pp9RSsm6zuPMdF0Kc3Ij8vTFZ02LGqKmBZ3tLoDn85RaKU9EeEONr8sinIOlVJ3cHphcJfF2rE3prk7Ay0UboaSS+uRLGR9g/0h/QFnQ0HeMIxW5IZhhWPj+BV2u39/WNnF/H9oNB6jO7b7aTRGG5+62yCy8B0qwfTwYulWat95hYf/I6bvB2E4s2AJDXy3IRPgzImtDXh9r+Su+Jex/YQ4hlzI24i2hsK7EnRmWeGtUPtItFfhMbPDletbb3hfZFGWBGVGk7AZrE+X8ManJUp2KaVyGWjR0+ThSFc7kUXCc1LjBwbcgahwzDIkifY4shs5s5YaT+6uQpnnMNoHknlQHba5dJ72q4oy06UXJx6aBY4Rrdbf0ePWdYbyvVibhi+Z5FWDKnYwb6IjH5FyeUqnhcaEJorCCo8FK+2FHvLm8/jppf+7P9cyCegzUStfs1bLDdS3mwCwS/54/7QskAVjjUajjYiHRc3fBrkYr/8/jiW60md0FaXycH55iEWPF4l8ciZQFciASkHJlvccVFCtMXQwZpPRo19E6yieq4TZvleRoPPre33EnhDu4iGpXr9o25dcRXZh7Jw7Rcnr5UwjNSa5gdcS1DexdN42qjU83fkrsuPBJy9sUgd8raEWEQihMKX5jyV9vwV0/LDOXLcBbNH83yeo9hJwAAS50AAAAwAClAAAAwABGAAAAwAAAwAAAwAAAwAAAwAAAwAAAwAAAwAAAwD3gA==';
