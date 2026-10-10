/* Link cards for chat bubbles and Media > Links.
   Everything comes from the URL itself: the site's logo (bundled in js/vendor/brand-icons, never fetched),
   its name and colour, and what the link points to ("Reel · @name", "Spreadsheet", "WhatsApp channel").
   A WhatsApp export carries no link previews, so there is no title or picture to show offline. */

// Plain glyphs for brands with no licence-safe logo (Microsoft, LinkedIn, Amazon…) and for site types.
const LINK_GLYPH = {
  sheet: 'M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm1 2v3h5V5H5zm7 0v3h7V5h-7zM5 10v4h5v-4H5zm7 0v4h7v-4h-7zM5 16v3h5v-3H5zm7 0v3h7v-3h-7z',
  doc: 'M6 2h9l5 5v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm8 1.5V8h4.5L14 3.5zM8 11v1.6h8V11H8zm0 3.4V16h8v-1.6H8zm0 3.4v1.6h5v-1.6H8z',
  slides: 'M3 4h18a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-8v2h3v1.5H8V19h3v-2H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm1 2v9h16V6H4zm2 2h7v5H6V8z',
  cloud: 'M6.5 19a4.5 4.5 0 0 1-.9-8.91A6 6 0 0 1 17.3 8.6 5.2 5.2 0 0 1 17.5 19h-11z',
  team: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm7.5 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 19c0-3.3 3.1-6 7-6s7 2.7 7 6v1H2v-1zm15.2 1H22v-.8c0-2.8-2.4-5-5.5-5.1 1 1.3 1.6 2.9 1.6 4.7V20z',
  mail: 'M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2.3V17h16V7.3l-8 5.2-8-5.2zM5.6 7l6.4 4.1L18.4 7H5.6z',
  gov: 'M12 2 2 7v2h20V7L12 2zM4 10.5v7h2.5v-7H4zm4.5 0v7H11v-7H8.5zm4.5 0v7h2.5v-7H13zm4.5 0v7H20v-7h-2.5zM2 19v3h20v-3H2z',
  edu: 'M12 3 1 9l11 6 9-4.9V17h2V9L12 3zM5 13.2V17c0 1.7 3.1 3.5 7 3.5s7-1.8 7-3.5v-3.8l-7 3.8-7-3.8z',
  short: 'M10.6 13.4a1 1 0 0 1 0-1.4l3.5-3.5a1 1 0 1 1 1.4 1.4L12 13.4a1 1 0 0 1-1.4 0zM13 6.3l1.4-1.4a4.5 4.5 0 0 1 6.4 6.4l-2.6 2.6a4.5 4.5 0 0 1-6.4 0 1 1 0 0 1 1.4-1.4 2.5 2.5 0 0 0 3.6 0l2.6-2.6a2.5 2.5 0 0 0-3.6-3.6L14.4 7.7A1 1 0 0 1 13 6.3zm-1.9 2.8a1 1 0 0 1 0 1.4 2.5 2.5 0 0 0-3.6 0l-2.6 2.6a2.5 2.5 0 0 0 3.6 3.6l1.4-1.4a1 1 0 0 1 1.4 1.4L9.9 18.1a4.5 4.5 0 0 1-6.4-6.4l2.6-2.6a4.5 4.5 0 0 1 6.4 0z'
};

// [host test, brand: a BRAND_ICONS key or [name, colour, glyph or short text], what the path means (optional)]
const lkHost = re => h => re.test(h);
const lkAt = s => s && !/^(p|reel|reels|tv|stories|explore|watch|share|groups|events|search|channel|c|user|video|status|i|home|login|hashtag|accounts|about|privacy|terms)$/i.test(s) ? '@' + lkDec(s).replace(/^@/, '') : '';
const lkDec = s => { try { return decodeURIComponent(s); } catch (e) { return s; } };
const lkSeg = x => x.pathname.split('/').filter(Boolean);
const MS_APPS = { x: ['Microsoft Excel', '#217346', 'sheet'], w: ['Microsoft Word', '#2B579A', 'doc'], p: ['Microsoft PowerPoint', '#C43E1C', 'slides'], m: ['Outlook', '#0F6CBD', 'mail'], o: ['OneDrive', '#0078D4', 'cloud'] };
function msApp(x) {
  const s = (x.hostname + x.pathname).toLowerCase(), m = /^(?:1drv\.ms\/|[^/]+\/:)([xwp])[:/]/.exec(s);
  if (m) return m[1];
  if (/excel|\.xlsx?$/.test(s)) return 'x';
  if (/word|\.docx?$/.test(s)) return 'w';
  if (/powerpoint|\.pptx?$/.test(s)) return 'p';
  return /outlook/.test(s) ? 'm' : 'o';
}
const SITE_RULES = [
  [lkHost(/^music\.youtube\.com$/), 'youtubemusic', () => ['music']],
  [lkHost(/(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/), 'youtube', x => {
    const p = lkSeg(x);
    if (x.hostname.endsWith('youtu.be')) return ['video'];
    if (p[0] === 'shorts') return ['short'];
    if (p[0] === 'live') return ['live'];
    if (p[0] === 'watch' || p[0] === 'embed') return [x.searchParams.has('list') && !x.searchParams.has('v') ? 'playlist' : 'video'];
    if (p[0] === 'playlist') return ['playlist'];
    if (p[0] && p[0][0] === '@') return ['channel', p[0]];
    if (p[0] === 'channel' || p[0] === 'c' || p[0] === 'user') return ['channel'];
    return [];
  }],
  [lkHost(/(^|\.)tiktok\.com$/), 'tiktok', x => {
    const p = lkSeg(x);
    if (/^v[mt]\./.test(x.hostname) || p[0] === 't') return ['shared'];
    const who = p[0] && p[0][0] === '@' ? p[0] : '';
    if (p[1] === 'video') return ['video', who];
    if (p[1] === 'photo') return ['photo', who];
    if (p[0] === 'music') return ['sound'];
    return who ? ['profile', who] : [];
  }],
  [lkHost(/(^|\.)(instagram\.com|instagr\.am)$/), 'instagram', x => {
    const p = lkSeg(x);
    if (p[0] === 'reel' || p[0] === 'reels') return p[1] ? ['reel'] : [];
    if (p[0] === 'p') return ['post'];
    if (p[0] === 'tv') return ['video'];
    if (p[0] === 'stories') return ['story', lkAt(p[1])];
    if (p[1] === 'reel' || p[1] === 'p') return [p[1] === 'reel' ? 'reel' : 'post', lkAt(p[0])];
    return p.length === 1 && lkAt(p[0]) ? ['profile', lkAt(p[0])] : [];
  }],
  [lkHost(/(^|\.)(m\.me|messenger\.com)$/), 'messenger', () => ['chat']],
  [lkHost(/(^|\.)(facebook\.com|fb\.com|fb\.watch|fb\.me)$/), 'facebook', x => {
    const p = lkSeg(x);
    if (x.hostname.endsWith('fb.watch') || p[0] === 'watch' || p.includes('videos')) return ['video'];
    if (p[0] === 'reel' || p[1] === 'r') return ['reel'];
    if (p[0] === 'share') return ['shared'];
    if (p[0] === 'groups') return ['group'];
    if (p[0] === 'events') return ['event'];
    if (p.includes('posts') || p[0] === 'permalink.php' || p[0] === 'story.php') return ['post'];
    if (p[0] === 'photo' || p[0] === 'photo.php' || p.includes('photos')) return ['photo'];
    return p.length === 1 && lkAt(p[0]) && !/\.php$/.test(p[0]) ? ['page', lkAt(p[0])] : [];
  }],
  [lkHost(/(^|\.)(twitter\.com|x\.com)$/), 'x', x => { const p = lkSeg(x); return p[1] === 'status' ? ['post', lkAt(p[0])] : p.length === 1 ? ['profile', lkAt(p[0])] : []; }],
  [lkHost(/(^|\.)threads\.(net|com)$/), 'threads', x => { const p = lkSeg(x); return p[1] === 'post' ? ['post', p[0]] : p.length === 1 ? ['profile', p[0]] : []; }],
  [lkHost(/^chat\.whatsapp\.com$/), 'whatsapp', () => ['wa_group']],
  [lkHost(/(^|\.)(wa\.me|whatsapp\.com)$/), 'whatsapp', x => {
    const p = lkSeg(x);
    if (p[0] === 'channel') return ['channel'];
    if (p[0] === 'c' || p[0] === 'catalog') return ['catalog'];
    const n = x.hostname === 'wa.me' ? p[0] : x.searchParams.get('phone');
    return n && /^\+?\d{6,}$/.test(n) ? ['chat', '+' + n.replace(/^\+/, '')] : x.hostname === 'wa.me' || p[0] === 'send' ? ['chat'] : [];
  }],
  [lkHost(/(^|\.)(t\.me|telegram\.me|telegram\.org)$/), 'telegram', x => { const p = lkSeg(x); return p[0] && x.hostname !== 'telegram.org' ? [p[1] ? 'post' : 'channel', lkAt(p[0] === 's' ? p[1] : p[0])] : []; }],
  [lkHost(/(^|\.)snapchat\.com$/), 'snapchat', x => { const p = lkSeg(x); return p[0] === 'add' ? ['profile', lkAt(p[1])] : p[0] === 'spotlight' ? ['video'] : []; }],
  [lkHost(/(^|\.)(pinterest\.[a-z.]+|pin\.it)$/), 'pinterest', x => lkSeg(x)[0] === 'pin' ? ['post'] : []],
  [lkHost(/(^|\.)(reddit\.com|redd\.it)$/), 'reddit', x => { const p = lkSeg(x); return p.includes('comments') || x.hostname === 'redd.it' ? ['post', p[0] === 'r' ? 'r/' + p[1] : ''] : p[0] === 'r' ? ['community', 'r/' + p[1]] : []; }],
  [lkHost(/(^|\.)tumblr\.com$/), 'tumblr'],
  [lkHost(/(^|\.)linkedin\.com$|^lnkd\.in$/), ['LinkedIn', '#0A66C2', 'in'], x => { const p = lkSeg(x); return p[0] === 'in' ? ['profile'] : p[0] === 'company' ? ['page'] : p[0] === 'jobs' ? ['job'] : p[0] === 'posts' || p[0] === 'feed' ? ['post'] : []; }],
  [lkHost(/(^|\.)github\.com$/), 'github', x => { const p = lkSeg(x); return p[2] === 'issues' ? ['issue', p[0] + '/' + p[1]] : p[2] === 'pull' ? ['pr', p[0] + '/' + p[1]] : p.length >= 2 ? ['repo', p[0] + '/' + p[1]] : []; }],
  [lkHost(/(^|\.)gitlab\.com$/), 'gitlab'],
  [lkHost(/(^|\.)stackoverflow\.com$/), 'stackoverflow', x => lkSeg(x)[0] === 'questions' ? ['question'] : []],
  [lkHost(/(^|\.)wikipedia\.org$/), 'wikipedia', x => { const p = lkSeg(x); return p[0] === 'wiki' && p[1] ? ['article', lkDec(p[1]).replace(/_/g, ' ')] : []; }],
  [lkHost(/(^|\.)medium\.com$/), 'medium', () => ['article']],
  [lkHost(/(^|\.)quora\.com$/), 'quora', () => ['question']],
  [lkHost(/(^|\.)(open\.spotify\.com|spotify\.com|spotify\.link)$/), 'spotify', x => { const p = lkSeg(x).filter(s => !/^intl-/.test(s)); return { track: ['song'], album: ['album'], playlist: ['playlist'], episode: ['episode'], show: ['podcast'], artist: ['artist'] }[p[0]] || []; }],
  [lkHost(/^music\.apple\.com$/), 'applemusic', x => { const p = lkSeg(x); return p.includes('album') ? [x.searchParams.has('i') ? 'song' : 'album'] : p.includes('playlist') ? ['playlist'] : p.includes('artist') ? ['artist'] : []; }],
  [lkHost(/^podcasts\.apple\.com$/), 'applepodcasts', () => ['podcast']],
  [lkHost(/^apps\.apple\.com$/), 'appstore', () => ['app']],
  [lkHost(/(^|\.)icloud\.com$/), 'icloud'],
  [lkHost(/(^|\.)apple\.com$/), 'apple'],
  [lkHost(/(^|\.)soundcloud\.com$/), 'soundcloud', x => lkSeg(x).length >= 2 ? ['song'] : []],
  [lkHost(/(^|\.)netflix\.com$/), 'netflix', x => lkSeg(x).some(s => s === 'title' || s === 'watch') ? ['show'] : []],
  [lkHost(/(^|\.)twitch\.tv$/), 'twitch', x => { const p = lkSeg(x); return p[1] === 'clip' || x.hostname.startsWith('clips.') ? ['clip'] : p[0] === 'videos' ? ['video'] : p.length === 1 ? ['channel', p[0]] : []; }],
  [lkHost(/(^|\.)kick\.com$/), 'kick'],
  [lkHost(/(^|\.)vimeo\.com$/), 'vimeo', x => /^\d+$/.test(lkSeg(x)[0] || '') ? ['video'] : []],
  [lkHost(/(^|\.)(dailymotion\.com|dai\.ly)$/), 'dailymotion', () => ['video']],
  [lkHost(/(^|\.)(discord\.gg|discord\.com)$/), 'discord', x => x.hostname === 'discord.gg' || lkSeg(x)[0] === 'invite' ? ['invite'] : []],
  [lkHost(/(^|\.)zoom\.(us|com)$/), 'zoom', x => /^(j|w|my)$/.test(lkSeg(x)[0] || '') ? ['meeting'] : []],
  [lkHost(/^meet\.google\.com$/), 'googlemeet', () => ['meeting']],
  [lkHost(/^(maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl)$/), 'googlemaps', x => x.hostname === 'goo.gl' && lkSeg(x)[0] !== 'maps' ? ['shared'] : ['place']],
  [lkHost(/^docs\.google\.com$/), x => ({ document: 'googledocs', spreadsheets: 'googlesheets', presentation: 'googleslides', forms: 'googleforms' }[lkSeg(x)[0]] || 'googledrive'),
    x => /^(document|spreadsheets|presentation|forms)$/.test(lkSeg(x)[0] || '') ? [] : ['file']], // the app's name already says what it is
  [lkHost(/^forms\.gle$/), 'googleforms'],
  [lkHost(/^drive\.google\.com$/), 'googledrive', x => [lkSeg(x).includes('folders') ? 'folder' : 'file']],
  [lkHost(/^mail\.google\.com$/), 'gmail', () => ['email']],
  [lkHost(/^(photos\.google\.com|photos\.app\.goo\.gl)$/), 'googlephotos', () => ['album']],
  [lkHost(/^play\.google\.com$/), 'googleplay', x => [lkSeg(x).includes('apps') ? 'app' : '']],
  [lkHost(/^calendar\.google\.com$/), 'googlecalendar', () => ['event']],
  [lkHost(/^classroom\.google\.com$/), 'googleclassroom', () => ['class']],
  [lkHost(/^translate\.google\.[a-z.]+$/), 'googletranslate'],
  [lkHost(/^gemini\.google\.com$/), 'googlegemini', x => lkSeg(x)[0] === 'share' ? ['chat_ai'] : []],
  [lkHost(/^news\.google\.com$/), 'googlenews', () => ['article']],
  [lkHost(/^keep\.google\.com$/), 'googlekeep', () => ['note']],
  [lkHost(/^lens\.google$/), 'googlelens'],
  [lkHost(/^(share\.google|g\.co|goo\.gle)$/), 'google', () => ['shared']],
  [lkHost(/(^|\.)google\.[a-z.]+$/), x => lkSeg(x)[0] === 'maps' ? 'googlemaps' : 'google', x => lkSeg(x)[0] === 'maps' ? ['place'] : lkSeg(x)[0] === 'search' && x.searchParams.get('q') ? ['search', '“' + x.searchParams.get('q') + '”'] : []],
  // Microsoft: Office links name the app in the path (/:x:/ or 1drv.ms/x/ Excel, w Word, p PowerPoint) or the host.
  [lkHost(/(^|\.)(sharepoint\.com|onedrive\.live\.com|1drv\.ms|office\.com|office\.live\.com|cloud\.microsoft|live\.com)$/), x => MS_APPS[msApp(x)],
    x => msApp(x) === 'o' ? [/^\/(:f:|f)\//.test(x.pathname) ? 'folder' : 'file'] : []],
  [lkHost(/^teams\.(microsoft|live)\.com$/), ['Microsoft Teams', '#5059C9', 'team'], () => ['meeting']],
  [lkHost(/(^|\.)dropbox\.com$|^db\.tt$/), 'dropbox', () => ['file']],
  [lkHost(/(^|\.)notion\.(so|site)$/), 'notion', () => ['page']],
  [lkHost(/(^|\.)figma\.com$/), 'figma', () => ['design']],
  [lkHost(/(^|\.)canva\.com$|^canva\.link$/), ['Canva', '#00C4CC', 'C'], () => ['design']],
  [lkHost(/(^|\.)trello\.com$/), 'trello', x => [lkSeg(x)[0] === 'c' ? 'card' : 'board']],
  [lkHost(/(^|\.)(chatgpt\.com|chat\.openai\.com|openai\.com)$/), ['ChatGPT', '#10A37F', 'AI'], x => lkSeg(x)[0] === 'share' ? ['chat_ai'] : []],
  [lkHost(/(^|\.)claude\.ai$/), 'claude', x => lkSeg(x)[0] === 'share' ? ['chat_ai'] : []],
  [lkHost(/(^|\.)anthropic\.com$/), 'anthropic'],
  [lkHost(/(^|\.)paypal\.(com|me)$/), 'paypal'],
  [lkHost(/(^|\.)(amazon\.[a-z.]+|amzn\.to|amzn\.eu|a\.co)$/), ['Amazon', '#FF9900', 'a'], x => /\/(dp|gp\/product)\//.test(x.pathname) || /^(amzn\.|a\.co)/.test(x.hostname) ? ['product'] : []],
  [lkHost(/(^|\.)ebay\.[a-z.]+$/), 'ebay', x => lkSeg(x)[0] === 'itm' ? ['product'] : []],
  [lkHost(/(^|\.)aliexpress\.(com|us|ru)$/), 'aliexpress', x => lkSeg(x)[0] === 'item' ? ['product'] : []],
  [lkHost(/(^|\.)etsy\.com$/), 'etsy', x => lkSeg(x)[0] === 'listing' ? ['product'] : []],
  [lkHost(/(^|\.)daraz\.(pk|com\.bd|lk|com\.np)$/), ['Daraz', '#F85606', 'D'], x => /^products$/.test(lkSeg(x)[0] || '') ? ['product'] : []],
  [lkHost(/(^|\.)foodpanda\.[a-z.]+$/), 'foodpanda'],
  [lkHost(/(^|\.)uber\.com$/), 'uber'],
  [lkHost(/(^|\.)airbnb\.[a-z.]+$/), 'airbnb', x => lkSeg(x)[0] === 'rooms' ? ['stay'] : []],
  [lkHost(/(^|\.)booking\.com$/), 'bookingdotcom', x => lkSeg(x)[0] === 'hotel' ? ['stay'] : []],
  [lkHost(/(^|\.)tripadvisor\.[a-z.]+$/), 'tripadvisor'],
  [lkHost(/(^|\.)imdb\.com$/), 'imdb', x => lkSeg(x)[0] === 'title' ? ['show'] : lkSeg(x)[0] === 'name' ? ['person'] : []],
  [lkHost(/(^|\.)udemy\.com$/), 'udemy', x => lkSeg(x)[0] === 'course' ? ['course'] : []],
  [lkHost(/(^|\.)coursera\.org$/), 'coursera', x => /^(learn|specializations|professional-certificates)$/.test(lkSeg(x)[0] || '') ? ['course'] : []],
  [lkHost(/(^|\.)khanacademy\.org$/), 'khanacademy'],
  [lkHost(/(^|\.)duolingo\.com$/), 'duolingo'],
  [lkHost(/(^|\.)linktr\.ee$/), 'linktree', x => lkSeg(x)[0] ? ['profile', lkAt(lkSeg(x)[0])] : []],
  [lkHost(/(^|\.)patreon\.com$/), 'patreon'],
  [lkHost(/(^|\.)(steampowered\.com|steamcommunity\.com)$/), 'steam', x => lkSeg(x)[0] === 'app' ? ['game'] : []],
  [lkHost(/(^|\.)roblox\.com$/), 'roblox', x => lkSeg(x)[0] === 'games' ? ['game'] : []],
  [lkHost(/(^|\.)epicgames\.com$/), 'epicgames'],
  [lkHost(/(^|\.)playstation\.com$/), 'playstation'],
  [lkHost(/(^|\.)signal\.(me|org|group)$/), 'signal'],
  [lkHost(/(^|\.)viber\.com$|^invite\.viber\.com$/), 'viber'],
  [lkHost(/(^|\.)(line\.me)$/), 'line'],
  [lkHost(/(^|\.)(wechat\.com|weixin\.qq\.com)$/), 'wechat'],
  [lkHost(/(^|\.)(vk\.com|vk\.ru)$/), 'vk'],
  [lkHost(/(^|\.)tinder\.com$/), 'tinder'],
  [lkHost(/(^|\.)pubg\.com$/), 'pubg'],
  [lkHost(/(^|\.)bilibili\.com$|^b23\.tv$/), 'bilibili', x => lkSeg(x)[0] === 'video' ? ['video'] : []],
  [lkHost(/^bit\.ly$/), 'bitly', () => ['short_link']],
  // Link shorteners hide where they go; say so.
  [lkHost(/^(tinyurl\.com|t\.co|ow\.ly|is\.gd|cutt\.ly|rb\.gy|shorturl\.at|tiny\.cc|rebrand\.ly|s\.id|buff\.ly)$/), h => ['', '#5f6b75', 'short'], () => ['short_link']],
  // Government and education sites by their address ending (.gov, .gov.pk, .gouv.fr, .edu.pk, .ac.uk…).
  [lkHost(/(^|\.)(gov|gouv|gob|govt|go|mil)(\.[a-z]{2})?$|\.gov\.[a-z]{2,3}$|\.(gc\.ca|gv\.at|admin\.ch|bund\.de|europa\.eu)$/), h => ['', '#2E6B4F', 'gov'], () => ['gov']],
  [lkHost(/(^|\.)edu(\.[a-z]{2})?$|\.ac\.[a-z]{2}$|\.edu\.[a-z]{2,3}$/), h => ['', '#3B5BA9', 'edu'], () => ['edu']]
];
const FILE_KINDS = [[/\.pdf$/i, 'pdf'], [/\.(jpe?g|png|gif|webp|heic|svg)$/i, 'image'], [/\.(mp4|mov|webm|mkv|avi|m3u8)$/i, 'video_file'], [/\.(mp3|m4a|ogg|opus|wav|aac|flac)$/i, 'audio'], [/\.(zip|rar|7z|tar|gz)$/i, 'archive'], [/\.(apk|ipa|exe|dmg|msi)$/i, 'app_file'], [/\.(docx?|odt|rtf)$/i, 'document'], [/\.(xlsx?|ods|csv)$/i, 'spreadsheet'], [/\.(pptx?|odp|key)$/i, 'presentation']];

const lightHex = c => { const m = /^#([\da-f]{6})$/i.exec(c); if (!m) return false; const n = parseInt(m[1], 16); return (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255 > 0.66; };

// The site's name, colour, logo and what the link is, all worked out from the URL itself.
function siteOf(x) {
  const host = x.hostname.replace(/^(www|m|mobile)\./, '').toLowerCase();
  const shownRaw = (host + x.pathname + x.search).replace(/\/$/, '');
  const shown = shownRaw.length > 70 ? shownRaw.slice(0, 68) + '…' : shownRaw;
  const rule = SITE_RULES.find(r => r[0](host));
  let brand = rule ? (typeof rule[1] === 'function' ? rule[1](x) : rule[1]) : null;
  if (typeof brand === 'string' && !BRAND_ICONS[brand]) brand = null;
  let kind = rule && rule[2] ? rule[2](x) : [];
  if (!kind[0]) { const f = FILE_KINDS.find(([re]) => re.test(x.pathname)); if (f) kind = [f[1]]; }
  let name, color, logo;
  if (typeof brand === 'string') {
    const b = BRAND_ICONS[brand];
    name = b[0]; color = b[1];
    logo = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + b[2] + '"/></svg>';
  } else if (Array.isArray(brand)) {
    name = brand[0] || host; color = brand[1];
    logo = LINK_GLYPH[brand[2]] ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + LINK_GLYPH[brand[2]] + '"/></svg>' : '<i' + (brand[2].length > 1 ? ' class="lsm"' : '') + '>' + esc(brand[2]) + '</i>';
  } else {
    name = host; color = 'var(--n' + colorIdx(host) + ')';
    logo = '<i>' + esc((host[0] || '?').toUpperCase()) + '</i>';
  }
  const what = kind[0] ? t('link_kind.' + kind[0]) : '';
  const detail = [what, kind[1] || ''].filter(Boolean).join(' · ');
  return { name, color, shown, detail, badge: '<span class="lbadge' + (lightHex(color) ? ' dark' : '') + '" style="background:' + color + '">' + logo + '</span>' };
}

// Every link in the message gets a card, up to three; more are counted below them.
const LINK_CARDS_MAX = 3;
function linksIn(text) {
  const urls = [];
  for (const u of urlsIn(text)) { const x = safeUrl(u); if (x && !urls.some(u => u.href === x.href)) urls.push(x); }
  return urls;
}
function linkCards(text) {
  const urls = linksIn(text);
  if (!urls.length) return '';
  const cards = urls.slice(0, LINK_CARDS_MAX).map(x => {
    const s = siteOf(x);
    return '<div class="lcard"><a class="lmain" href="' + esc(x.href) + '" target="_blank" rel="noopener noreferrer">' + s.badge +
      '<span class="ltxt"><b>' + esc(s.name) + '</b>' + (s.detail ? '<span class="ldet" dir="auto">' + esc(s.detail) + '</span>' : '') + '<small title="' + esc(x.href) + '">' + esc(s.shown) + '</small></span></a>' +
      '<button class="lcopy" data-url="' + esc(x.href) + '" aria-label="' + t('link.copy') + '" title="' + t('link.copy') + '">' + ICON.copy + '</button></div>';
  }).join('');
  const more = urls.length - LINK_CARDS_MAX;
  return cards + (more > 0 ? '<div class="lmore">' + (more === 1 ? t('link.more_one') : t('link.more', { n: more })) + '</div>' : '');
}
// Height of a message's link cards, for the virtual list's first guess (rows are measured once shown).
function linkCardsH(text) {
  const urls = linksIn(text), n = Math.min(urls.length, LINK_CARDS_MAX);
  let h = 0;
  for (let k = 0; k < n; k++) h += siteOf(urls[k]).detail ? 72 : 58;
  return h + (urls.length > LINK_CARDS_MAX ? 18 : 0);
}
