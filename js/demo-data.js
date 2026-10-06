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
].join('\r\n');
/* Generated stand-ins for the sample's media (nothing is fetched). */
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
