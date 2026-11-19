/* DAILY FUEL GUIDED session player. One file for every day: the page sets <body data-day="YYYY-MM/DD">.
   Design: SOCIAL MEDIA v7. Data: schema 0.4 (APP ROADMAP). Events: v0.5 measurement plan. */
(function () {
'use strict';

const BASE = document.currentScript.src.replace(/[^/]+$/, '');
const CFG = {
  stream: 'https://customer-jjfzxadb1d7p720a.cloudflarestream.com',
  hls: 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js',
  ga: 'G-4GXCXXJYKB',
  fbAction: 'https://docs.google.com/forms/d/e/1FAIpQLScM9cbKI8xYO8rPioDpQo0LBNl6Pl1N9aIoupxgalVZO6h6xA/formResponse', // beta feedback form (APP ROADMAP), posted from our own panel (v13)
  mail: 'training@fitforthecross.com',
  // Prayer requests (v10): Google Form owned by training@ (private to Trey). Empty = keep the old mailto + Copy email.
  // entry ids: request, name, pastor (Yes/No), email, date, title
  prayer: { action: 'https://docs.google.com/forms/d/e/1FAIpQLSfZUA17E5qv6rQYf1q8OrD-wx9koELf20iQNa5xfVb9RnUTIw/formResponse',
    f: { request: 'entry.1341268396', name: 'entry.2033617424', pastor: 'entry.1880467524', email: 'entry.2070687422', date: 'entry.121619071', title: 'entry.1931207764' } }, // "GUIDED prayer requests", published Nov 18
  actName: 'Active Fueling',
  actMinutes: 4,
  actPrompt: 'Ask God to call to mind someone who needs this today. Then ask Him for the courage to do it.',
  doneHead: 'SESSION COMPLETE',
  doneLine: 'Your soul was made to run on the clean fuel of God. Keep stacking these fuel sessions and leaning in to quality time with the Lord.',
};

const MON = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
const WK = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const IC = {
  play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><rect x="5.5" y="3" width="4.5" height="18" rx="2.2"/><rect x="14" y="3" width="4.5" height="18" rx="2.2"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M3 5.5c3-1.3 6-1.3 9 .8 3-2.1 6-2.1 9-.8V19c-3-1.3-6-1.3-9 .8-3-2.1-6-2.1-9-.8z"/><path d="M12 6.3V19.8"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>',
  down: '<svg class="dn" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  dots: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
};

const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sec = ms => Math.max(0, Math.round(ms / 1000));
const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
const Q = new URLSearchParams(location.search);
const DESK = matchMedia('(hover:hover) and (pointer:fine)').matches;
if (DESK) document.documentElement.classList.add('desk');
const DESKTOP = matchMedia('(min-width:900px) and (hover:hover) and (pointer:fine)').matches; // v10 computer defaults

/* ---------- team mode + analytics ---------- */
try {
  if (Q.get('team') === '1') localStorage.setItem('fftc_team', '1');
  if (Q.get('team') === '0') localStorage.removeItem('fftc_team');
} catch (e) {}
let TEAM = false;
try { TEAM = localStorage.getItem('fftc_team') === '1'; } catch (e) {}
const SPEED = TEAM && Q.get('fast') ? 30 : 1;

if (!TEAM) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', CFG.ga);
  const g = document.createElement('script');
  g.async = true;
  g.src = 'https://www.googletagmanager.com/gtag/js?id=' + CFG.ga;
  document.head.appendChild(g);
}

let DAY = null, S = null, WRAP = -1, NEXT = null;
let n = -1, cur = null, hiddenAt = null, runStart = null, viewed = new Set(), completeSent = false;

function stepType(k) {
  if (!S) return 'opening';
  if (k < 0) return 'opening';
  if (k >= S.length) return 'end';
  return S[k].t;
}
function stepName(k) {
  if (!S || k < 0 || k >= S.length) return stepType(k);
  const s = S[k];
  return s.t === 'video' ? s.role : s.t === 'action' ? s.descriptor : s.nutrient;
}
function ev(name, extra) {
  const p = Object.assign({
    session_date: DAY ? DAY.date : '',
    day_title: DAY ? DAY.title : '',
    step_index: n + 1,
    step_type: stepType(n),
    step_name: stepName(n),
    device_mode: DESK ? 'desktop' : 'touch',
  }, extra || {});
  if (TEAM) { console.log('[guided] ' + name + ' ' + JSON.stringify(p)); return; }
  p.transport_type = 'beacon';
  gtag('event', name, p);
}
const sentErr = new Set();
function errEv(kind, detail) {
  const key = kind + (cur ? cur.k : '');
  if (sentErr.has(key)) return;
  sentErr.add(key);
  ev('guided_error', { kind: kind, detail: String(detail || '').slice(0, 60) });
}

/* ---------- page shell ---------- */
document.body.insertAdjacentHTML('afterbegin',
  '<div class="app" id="app"><section class="stage" id="stage">' +
  '<div class="room dim" id="room"><i id="bW" class="blr on"></i><i id="bR" class="blr"></i><div id="rW" class="on"></div><div id="rR"></div><video id="vid" playsinline webkit-playsinline preload="none"></video></div>' +
  
  '<div class="top off" id="top"><div class="segs" id="segs"></div><div class="util">' +
  '<button class="ic" data-act="close" aria-label="Close">' + IC.x + '</button>' +
  '<button class="snd" id="snd" data-act="unmute" aria-label="Tap for sound"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="spk" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path class="x" d="M16 9.5l5 5M21 9.5l-5 5"/></svg><span class="lbl">Tap for sound</span></button>' +
  '<button class="ic dots" data-act="menu" aria-label="More">' + IC.dots + '</button></div></div>' +
  '<div class="mid" id="midw"><div class="cont full sc" id="cont"></div><div class="more-cue" id="cue"></div><div class="edge" id="edge"><b id="eb"></b></div><div class="vline" id="vline"><b id="vlb"></b></div>' +
  '<div class="cap" id="cap" aria-live="off"><p><span id="capt"></span></p></div><div class="pill2" id="det"><button class="pp" id="pp" data-act="toggle" aria-label="Pause"></button><div class="track scrub" id="tr"><b id="tb"></b></div><span class="rem" id="rem"></span></div></div>' +
  '<div class="bar off" id="bar"><img class="bmark" src="' + BASE + 'fftc-mark-w.png" alt=""><div class="hline"><b id="hb"></b></div><div class="hint" id="hint">' + IC.up + '<span class="m">Swipe up when you’re ready</span><span class="d">Click Next when you’re ready</span>' + IC.down + '</div>' +
  '<div class="l1" id="l1"></div><div class="l2" id="l2"></div>' +
  '<div class="dnav"><button data-act="back">← Back</button><button data-act="next">Next →</button></div></div>' +
  '</section></div>');
const app = $('app'), V = $('vid');
bindScrub();

function brand() {
  return '<div class="mast"><div class="mbox"><img src="' + BASE + 'fftc-mark-w.png" alt=""><span>FIT FOR THE CROSS</span></div></div>' +
    '<div class="dfg">DAILY FUEL<small>GUIDED</small></div><div class="band"></div>';
}
function holding() {
  S = null;
  $('cont').innerHTML = brand() + '<div class="hold"><p>SESSION NOT AVAILABLE YET</p></div>';
}

/* ---------- data ---------- */
function streamThumb(v, t) {
  return v && v.provider === 'stream' ? CFG.stream + '/' + v.id + '/thumbnails/thumbnail.jpg?time=' + t + 's&height=1280' : '';
}
function load(d) {
  DAY = d;
  S = d.session.map(x => {
    if (x.type === 'video') return { t: 'video', role: x.role, video: x.video, total: x.seconds };
    if (x.type === 'action') {
      const m = x.minutes || CFG.actMinutes;
      return { t: 'action', label: CFG.actName, descriptor: x.descriptor, instruction: x.instruction, min: m, total: m * 60 };
    }
    return { t: 'nutrient', nutrient: x.nutrient, label: x.name_as_written || x.nutrient, word: x.macro === 'word', prompt: x.prompt, min: x.minutes, total: x.minutes * 60 };
  });
  WRAP = S.findIndex(s => s.t === 'video' && s.role === 'wrapup');
  const w = S.find(s => s.role === 'warmup'), r = S.find(s => s.role === 'wrapup');
  if (w) { $('rW').style.backgroundImage = $('bW').style.backgroundImage = 'url("' + streamThumb(w.video, 1) + '")'; document.body.style.setProperty('--roombg', 'url("' + streamThumb(w.video, 1) + '")'); }
  if (r) $('rR').style.backgroundImage = $('bR').style.backgroundImage = 'url("' + streamThumb(r.video, Math.max(1, (r.total || 3) - 2)) + '")';
  const [y, m, dd] = d.date.split('-').map(Number), nx = new Date(Date.UTC(y, m - 1, dd + 1));
  const np = nx.getUTCFullYear() + '-' + String(nx.getUTCMonth() + 1).padStart(2, '0') + '/' + String(nx.getUTCDate()).padStart(2, '0');
  fetch(BASE + '../data/' + np + '.json', { cache: 'no-cache' })
    .then(r => r.ok ? r.json() : null).then(j => { if (j && j.status === 'LOCKED') NEXT = j.title; }).catch(() => {});
}

/* ---------- screens ---------- */
function totalMin() { return Math.round(S.reduce((a, s) => a + (s.total || 0), 0) / 60); }
function verseHTML() { return '“' + esc(DAY.verse.text) + '”<cite>' + esc(DAY.verse.reference + ' ' + (DAY.verse.translation || 'NIV')) + '</cite>'; }
function homeHTML() {
  const [y, m, d] = DAY.date.split('-').map(Number), dt = new Date(y, m - 1, d), mo = MON[m - 1];
  const li = S.filter(s => s.t !== 'video').map(s => '<li>' + esc(s.label) + '</li>').join('');
  return brand() + '<div class="std1">' + WK[dt.getDay()] + ', ' + mo[0] + mo.slice(1).toLowerCase() + ' ' + d + '</div>' +
    '<div class="trow"><div class="htitle">' + esc(DAY.title) + '</div></div><div class="htag">' + esc(DAY.tagline) + '</div>' +
    '<blockquote class="hverse">' + verseHTML() + '</blockquote>' +
    '<div class="shead"><span>Today’s session</span><span>' + totalMin() + ' min</span></div><ol class="steps">' + li + '</ol>' +
    '<div class="start"><div class="sw">' + IC.up + 'Swipe up to begin</div>' +
    '<button class="btn dk" data-act="begin">Begin →</button></div>';
}
function endHTML() {
  const m = +DAY.date.split('-')[1], d = +DAY.date.split('-')[2], mo = MON[m - 1];
  const subj = 'Prayer request · ' + mo[0] + mo.slice(1, 3).toLowerCase() + ' ' + d + ' · ' + DAY.title;
  return '<div class="endpad">' + brand() + '<div class="close">' + CFG.doneHead + '</div><p class="closel">' + CFG.doneLine + '</p>' +
    (NEXT ? '<div class="tmr"><div class="kick">Tomorrow’s DAILY FUEL</div><div class="tt">' + esc(NEXT) + '</div></div>' : '') +
    (CFG.prayer.action
      ? '<div class="pray"><button class="btn" data-act="prayer">Submit a prayer request</button></div>'
      : '<div class="pray"><a class="btn" data-act="prayer" href="mailto:' + CFG.mail + '?subject=' + encodeURIComponent(subj) + '">Submit a prayer request</a>' +
        '<div class="copy"><span>' + CFG.mail + '</span><button data-act="copy">Copy email</button></div></div>') +
    '<button class="btn ghost fb efb" data-act="fb-end">Share beta feedback</button>' +
    '<button class="btn ghost fb ers" data-act="restart-end">Restart session</button>' +
    '<img class="emark" src="' + BASE + 'fftc-mark-w.png" alt=""></div>';
}
function content(k) {
  if (k < 0) return homeHTML();
  if (k >= S.length) return endHTML();
  const s = S[k];
  if (s.t === 'video') {
    const li = S.map((x, j) => x.t === 'video' ? '' : '<li>' + esc(x.label) + (j < k ? '<b class="tick">✓</b>' : '') + '</li>').join('');
    return '<div class="vsum"><div class="htitle">' + esc(DAY.title) + '</div><div class="htag">' + esc(DAY.tagline) + '</div>' +
      '<blockquote class="hverse">' + verseHTML() + '</blockquote><div class="shead"><span>Today’s session</span><span>' + totalMin() + ' min</span></div><ol class="steps">' + li + '</ol></div>';
  }
  if (s.t === 'action') return '<div class="kick">' + s.min + ' MINUTES OF</div><div class="nword">' + esc(s.label) + '</div>' +
    '<blockquote class="nverse">' + esc(s.instruction) + '<cite>' + esc(s.descriptor) + '</cite></blockquote><hr class="nsep"><p class="nprompt">' + CFG.actPrompt + '</p>';
  return '<div class="kick">' + s.min + ' MINUTES OF</div><div class="nword">' + esc(s.label) + '</div>' +
    (s.word ? '<blockquote class="nverse">' + verseHTML() + '</blockquote><hr class="nsep">' : '') +
    (s.prompt ? '<p class="nprompt">' + esc(s.prompt) + '</p>' : '');
}
function segs() { $('segs').innerHTML = S.map((_, j) => '<i class="' + (j < n || n >= S.length ? 'done' : j === n ? 'cur' : '') + '"></i>').join(''); }

/* ---------- video ---------- */
let hls = null, hlsLoading = null, stallT = null;
const NATIVE_HLS = !!V.canPlayType('application/vnd.apple.mpegurl');
function needHls() {
  if (NATIVE_HLS || window.Hls || hlsLoading) return;
  hlsLoading = new Promise((ok, no) => { const s = document.createElement('script'); s.src = CFG.hls; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  hlsLoading.catch(() => errEv('video_error', 'hls_load'));
}
function attach(v) {
  if (v.provider === 'file') { V.src = v.id; return; }
  const url = CFG.stream + '/' + v.id + '/manifest/video.m3u8';
  if (NATIVE_HLS || !(window.Hls && Hls.isSupported())) { V.src = url; return; }
  hls = new Hls({ capLevelToPlayerSize: true });
  hls.on(Hls.Events.ERROR, (_, e) => { if (e.fatal) errEv('video_error', 'hls_' + e.type); });
  hls.loadSource(url);
  hls.attachMedia(V);
}
// Sound (v8): try sound; if the phone refuses (a swipe isn't a tap), play muted and show TAP FOR SOUND for 4 s.
// Once sound is on it stays on for the session. If the person switched Sound off in the menu, start muted, no pill.
let soundPref = null, sndT = null;
function startVideo(s) {
  V.classList.add('on');
  userPaused = false;
  attach(s.video);
  loadCaps(s);
  if (soundPref === false) { V.muted = true; V.play().then(setPP).catch(() => { setPP(); detail(true); }); return; }
  V.muted = false;
  const p = V.play();
  if (p && p.then) p.then(() => { soundPref = true; }, e => {
    if (!e || e.name !== 'NotAllowedError' || !V.classList.contains('on')) { setPP(); detail(true); return; }
    errEv('sound_blocked', 'play');
    V.muted = true;
    V.play().then(() => { snd(true); setPP(); }).catch(() => { V.muted = false; setPP(); detail(true); });
  });
}
function snd(on) {
  clearTimeout(sndT);
  const b = $('snd');
  b.classList.toggle('on', on);
  if (on) sndT = setTimeout(() => b.classList.remove('on'), 4000);
}
function setSound(on, control) {
  soundPref = on;
  if (V.classList.contains('on')) {
    V.muted = !on;
    if (on && V.paused && cur && !cur.completed) V.play().catch(() => {});
  }
  if (on) snd(false); // the same tap unlocks the chime silently (unlockAudio)
  ev('guided_control', { control });
}
function unmute() { if (V.muted && V.classList.contains('on')) setSound(true, 'unmute'); }
function stopVideo() {
  clearTimeout(stallT);
  V.pause();
  if (hls) { hls.destroy(); hls = null; }
  V.removeAttribute('src');
  V.load();
  V.classList.remove('on');
  snd(false);
  CAPS = null; showCap('');
}
V.addEventListener('timeupdate', () => {
  if (!cur || stepType(cur.k) !== 'video') return;
  const t = V.currentTime;
  if (cur.lastT != null && !V.paused) { const d = t - cur.lastT; if (d > 0 && d < 1.5) cur.watched += d; }
  cur.lastT = t;
  drawCap(t);
  if (!V.paused && V.duration && isFinite(V.duration) && V.duration - t < 0.05) finishVideo('timeupdate');
});
V.addEventListener('seeked', () => { if (cur) cur.lastT = V.currentTime; drawCap(V.currentTime); });
V.addEventListener('play', setPP);
V.addEventListener('pause', () => { setPP(); if (isVid() && cur && !userPaused && !dragging && V.currentTime > 1 && endOf() - V.currentTime < 0.1) finishVideo('pause_event_at_end'); });
V.addEventListener('waiting', () => {
  if (V.duration && isFinite(V.duration) && V.duration - V.currentTime < 0.1 && V.currentTime > 1) { finishVideo('waiting_at_end'); return; } clearTimeout(stallT); stallT = setTimeout(() => errEv('video_stall', 'waiting_4s'), 4000); });
V.addEventListener('playing', () => clearTimeout(stallT));
V.addEventListener('error', () => { if (V.getAttribute('src')) errEv('video_error', 'media_' + (V.error ? V.error.code : '')); });
function finishVideo(why) {
  if (!cur || stepType(cur.k) !== 'video' || cur.completed || dragging) return;
  cur.completed = true;
  draw();
  const here = n;
  clearTimeout(autoT);
  autoT = setTimeout(() => { if (n === here) go(n + 1, 'auto'); }, 0);
}
V.addEventListener('ended', finishVideo);

/* ---------- captions: our own layer from .vtt files (ON by default, off in the menu) ---------- */
// Files live at daily-fuel/captions/YYYY-MM/DD-warmup.vtt (copied in by build_guided_pages.py).
// No file yet = no captions, nothing breaks.
let CC = true, CAPS = null, capKey = '';
CC = !DESKTOP;
try { const c = localStorage.getItem('fftc_cc'); if (c) CC = c !== '0'; } catch (e) {}
const capCache = {};
function vttTime(t) { const p = t.trim().split(':').map(parseFloat); return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1]; }
function parseVtt(txt) {
  const out = [];
  txt.replace(/\r/g, '').split(/\n\n+/).forEach(b => {
    const L = b.split('\n'), i = L.findIndex(l => l.includes('-->'));
    if (i < 0) return;
    const [a, z] = L[i].split('-->'), text = L.slice(i + 1).join('\n').replace(/<[^>]+>/g, '').trim();
    if (text) out.push({ a: vttTime(a), z: vttTime(z.trim().split(/\s+/)[0]), text });
  });
  return out;
}
function loadCaps(s) {
  CAPS = null; showCap('');
  const key = document.body.dataset.day + '-' + s.role;
  capKey = key;
  const got = capCache[key] || (capCache[key] = fetch(BASE + '../captions/' + key + '.vtt').then(r => r.ok ? r.text() : '').then(parseVtt).catch(() => []));
  got.then(c => { if (capKey === key && V.classList.contains('on')) { CAPS = c; drawCap(V.currentTime || 0); } });
}
function drawCap(t) {
  if (!CC || !CAPS || !CAPS.length) return showCap('');
  const c = CAPS.find(c => t >= c.a && t < c.z);
  showCap(c ? c.text : '');
}
function showCap(text) {
  const el = $('capt');
  if (el.textContent === text) return;
  el.textContent = text;
  $('cap').classList.toggle('on', !!text);
}

/* ---------- scrub: drag the orange line (tap lands where the finger is) ---------- */
let dragging = false, dragFrom = 0, dragWas = false;
function seekTo(x) {
  if (!V.duration || !isFinite(V.duration)) return;
  const r = $('tr').getBoundingClientRect();
  const to = Math.max(0, Math.min(V.duration - 0.5, (x - r.left) / r.width * V.duration));
  if (V.fastSeek && dragging) V.fastSeek(to); else V.currentTime = to;
  $('tb').style.width = (to / V.duration) * 100 + '%';
  $('hb').style.width = (to / V.duration) * 100 + '%';
  $('rem').textContent = fmt(to) + ' / ' + fmt(V.duration);
}
function scrubStart(e) {
  if (!isVid() || !cur || cur.completed) return;
  e.preventDefault(); e.stopPropagation();
  dragging = true; dragFrom = V.currentTime; dragWas = !V.paused;
  try { $('tr').setPointerCapture(e.pointerId); } catch (_) {}
  $('tr').classList.add('drag');
  clearTimeout(detT);
  seekTo(e.clientX);
}
function scrubMove(e) { if (dragging) { e.preventDefault(); seekTo(e.clientX); } }
function scrubEnd(e) {
  if (!dragging) return;
  dragging = false;
  $('tr').classList.remove('drag');
  seekTo(e.clientX);
  V.currentTime = V.currentTime; // settle an exact seek after fastSeek
  if (V.currentTime < dragFrom - 1) cur.scrubBack++;
  ev('guided_control', { control: 'scrub' });
  if (dragWas && V.paused) V.play().catch(() => {});
  detail(true);
}
function bindScrub() {
  const tr = $('tr');
  tr.addEventListener('pointerdown', scrubStart);
  tr.addEventListener('pointermove', scrubMove);
  tr.addEventListener('pointerup', scrubEnd);
  tr.addEventListener('pointercancel', scrubEnd);
  ['touchstart', 'touchend'].forEach(t => tr.addEventListener(t, e => e.stopPropagation(), { passive: true }));
}

/* ---------- nutrient timer ---------- */
let T = null, tm = null, autoT = null;
function tSec() { return T ? Math.min(T.total, (T.acc + (T.run ? (Date.now() - T.since) * SPEED : 0)) / 1000) : 0; }
function isVid() { return S && n >= 0 && n < S.length && S[n].t === 'video'; }
function running() { return isVid() ? !V.paused : !!(T && T.run); }
function finished() { return isVid() ? !!(cur && cur.completed) : !!(cur && cur.chimeAt); }
function pos() {
  if (isVid()) return [V.currentTime || 0, V.duration && isFinite(V.duration) ? V.duration : S[n].total];
  return [tSec(), T ? T.total : 0];
}
let lastVT = -1, sameSince = 0;
let userPaused = false;
// The clip's real end. The day file's length is only a fallback until the video reports its own (never a cap: it used to cut ~0.6 s early).
function endOf() { return V.duration && isFinite(V.duration) ? V.duration : S[n].total; }
function videoEndWatch() {
  // Steady end check (iPhone fires few position updates and can hold the last frame before 'ended').
  if (!cur || cur.completed || dragging) { sameSince = 0; return; }
  const t = V.currentTime, end = endOf();
  // iPhone can stop by itself at the very end without sending 'ended': that's the end, unless the person paused.
  if (V.paused) { sameSince = 0; if (!userPaused && end && end - t < 0.1 && t > 1) finishVideo('paused_at_end'); return; }
  if (end && t >= end - 0.05) return finishVideo('near_end');
  const now = Date.now();
  if (t !== lastVT) { lastVT = t; sameSince = now; return; }
  if (end && end - t < 0.1 && sameSince && now - sameSince > 350) finishVideo('stuck_at_end'); // stuck at the very end
}
function tick() {
  if (isVid()) videoEndWatch();
  draw();
  if (!isVid() && T && tSec() >= T.total && !cur.chimeAt) {
    cur.chimeAt = Date.now();
    T.acc = T.total * 1000;
    T.run = false;
    clearInterval(tm); tm = null;
    chime();
    unwake();
    $('cont').classList.add('done');
    $('det').classList.remove('open');
    setPP();
    hint(true);
  }
}
function draw() {
  const [s, t] = pos(), p = t ? Math.min(1, s / t) : 0;
  $('tb').style.width = p * 100 + '%';
  $('hb').style.width = p * 100 + '%';
  $('rem').textContent = fmt(s) + ' / ' + fmt(t);
  if (!isVid()) $('eb').style.height = p * 100 + '%';
  else $('vlb').style.width = p * 100 + '%';
}
function toggle() {
  if (!cur || finished()) return;
  if (isVid()) {
    if (V.paused) { userPaused = false; V.play().catch(() => {}); ev('guided_control', { control: 'play' }); }
    else { userPaused = true; V.pause(); cur.paused++; ev('guided_control', { control: 'pause' }); }
  } else if (T) {
    if (T.run) { T.acc += (Date.now() - T.since) * SPEED; T.run = false; cur.paused++; unwake(); ev('guided_control', { control: 'pause' }); }
    else { T.since = Date.now(); T.run = true; wake(); ev('guided_control', { control: 'play' }); }
  }
  setPP();
  detail(true);
}
function setPP() { $('pp').innerHTML = running() ? IC.pause : IC.play; }
let detT = null;
function detail(on, quiet) {
  const b = $('det');
  if (!cur || n < 0 || n >= S.length || finished() || (DESKTOP && !isVid())) { b.classList.remove('open'); return; }
  if (on && !quiet && !b.classList.contains('open')) ev('guided_control', { control: 'pill_open' });
  b.classList.toggle('open', on);
  clearTimeout(detT);
  if (on && running()) detT = setTimeout(() => { if (running()) b.classList.remove('open'); }, 3500);
}
function hint(on) { $('hint').classList.toggle('on', on); $('bar').classList.toggle('ready', on && DESKTOP); }

/* ---------- wake lock, chime, haptics ---------- */
let WL = null, wantWake = false;
// Backup for iPhone: a tiny muted looping video keeps the screen on even where the Wake Lock API fails.
const AW = document.createElement('video');
AW.src = BASE + 'awake.mp4'; AW.muted = true; AW.loop = true; AW.playsInline = true;
AW.setAttribute('playsinline', ''); AW.setAttribute('muted', ''); AW.setAttribute('aria-hidden', 'true');
AW.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0.01;pointer-events:none;left:0;top:0';
document.body.appendChild(AW);
function wake() {
  wantWake = true;
  const p = AW.play(); if (p && p.catch) p.catch(() => {});
  if (!('wakeLock' in navigator) || WL) return;
  navigator.wakeLock.request('screen').then(l => {
    if (!wantWake) { l.release().catch(() => {}); return; }
    WL = l; l.addEventListener('release', () => { if (WL === l) WL = null; });
  }).catch(e => errEv('wake_lock_failed', e && e.name));
}
function unwake() { clearTimeout(wakeT); wantWake = false; AW.pause(); if (WL) { WL.release().catch(() => {}); WL = null; } }
// Wake Lock needs a tap on some phones: retry on every tap while a timer runs.
['touchend', 'click'].forEach(e => addEventListener(e, () => { if (wantWake && !WL) wake(); }, { passive: true }));
// Chime through Web Audio: once the context is running (any tap resumes it), it can play
// from a timer with no tap, which an <audio> element on iPhone often can't.
const AC = window.AudioContext || window.webkitAudioContext;
let actx = null, chimeBuf = null;
function audioCtx() {
  if (!AC) return null;
  if (!actx) {
    actx = new AC();
    fetch(BASE + 'fftc-chime.mp3').then(r => r.arrayBuffer())
      .then(b => new Promise((ok, no) => actx.decodeAudioData(b, ok, no)))
      .then(b => { chimeBuf = b; }).catch(e => errEv('chime_failed', 'decode'));
  }
  return actx;
}
function unlockAudio() {
  const c = audioCtx();
  if (!c || c.state === 'running') return;
  c.resume().catch(() => {});
  try { const b = c.createBuffer(1, 1, 22050), src = c.createBufferSource(); src.buffer = b; src.connect(c.destination); src.start(0); } catch (e) {}
}
['touchstart', 'touchend', 'pointerup', 'click', 'keydown'].forEach(e => addEventListener(e, unlockAudio, { passive: true, capture: true }));
const CHIME = new Audio(BASE + 'fftc-chime.mp3');
CHIME.preload = 'auto';
function chime() {
  const c = actx;
  if (c && chimeBuf) {
    const play = () => { try { const src = c.createBufferSource(); src.buffer = chimeBuf; src.connect(c.destination); src.start(0); } catch (e) { errEv('chime_failed', e.name); } };
    if (c.state === 'running') return play();
    c.resume().then(() => { if (c.state === 'running') play(); else errEv('chime_failed', 'ctx_' + c.state); }).catch(e => errEv('chime_failed', 'ctx_resume'));
    return;
  }
  try { CHIME.currentTime = 0; const p = CHIME.play(); if (p && p.catch) p.catch(e => errEv('chime_failed', e && e.name)); }
  catch (e) { errEv('chime_failed', e.name); }
}
function haptic() { try { navigator.vibrate && navigator.vibrate(12); } catch (e) {} }

/* ---------- step lifecycle ---------- */
function closeStep() {
  if (!cur || cur.closed) return;
  cur.closed = true;
  const t = stepType(cur.k), now = Date.now();
  if (t === 'video') {
    const vs = S[cur.k].total || 0;
    ev('guided_video_end', {
      video_seconds: Math.round(vs), watched_seconds: Math.round(cur.watched),
      pct_watched: vs ? Math.min(100, Math.round(cur.watched / vs * 100)) : 0,
      completed: cur.completed, scrub_back_count: cur.scrubBack, paused_count: cur.paused,
      sound_on: !V.muted, captions_on: CC,
    });
  } else if (t === 'nutrient' || t === 'action') {
    const hid = cur.hidden + (hiddenAt ? now - hiddenAt : 0);
    ev(t === 'nutrient' ? 'guided_nutrient_end' : 'guided_action_end', {
      minutes: S[cur.k].min, timer_seconds: Math.round(tSec()), seconds_on_screen: sec(now - cur.t0),
      reached_chime: !!cur.chimeAt, seconds_after_chime: cur.chimeAt ? sec(now - cur.chimeAt) : 0,
      paused_count: cur.paused, hidden_seconds: sec(hid),
    });
  }
}
// Leaving a video forward: the video slides up and off while the next screen rises in behind it,
// like a swipe (Trey, Nov 18), instead of fading the background in over the video.
let leaveT = null, wakeT = null;
function endLeave() {
  if (!leaveT) return;
  clearTimeout(leaveT); leaveT = null;
  V.style.transition = 'none'; // no fade-back: the video is already off screen
  stopVideo();
  V.classList.remove('leave');
  void V.offsetWidth;
  V.style.transition = '';
  $('stage').classList.remove('rise');
}
function leaveStep(slide) {
  closeStep();
  clearInterval(tm); tm = null;
  clearTimeout(autoT);
  T = null;
  unwake();
  endLeave();
  if (!V.classList.contains('on')) return;
  if (!slide) { stopVideo(); return; }
  V.pause(); showCap(''); snd(false);
  const st = $('stage');
  st.classList.remove('rise'); void st.offsetWidth;
  st.classList.add('rise');
  V.classList.add('leave');
  leaveT = setTimeout(endLeave, 600);
}
let swapT = null, first = true;
function go(k, via) {
  if (!S || k < -1 || k > S.length) return;
  const prev = n;
  if (prev === -1 && k >= 0 && cur) { ev('guided_start', { seconds_on_opening: sec(Date.now() - cur.t0) }); runStart = Date.now(); viewed = new Set(); completeSent = false; }
  const slide = prev >= 0 && prev < S.length && S[prev].t === 'video' && k > prev && !(k < S.length && S[k].t === 'video');
  leaveStep(slide);
  closeSheets(true);
  hint(false);
  n = k;
  cur = { k: n, t0: Date.now(), hidden: 0, paused: 0, scrubBack: 0, watched: 0, lastT: null, completed: false, chimeAt: null, closed: false };
  const isStep = n >= 0 && n < S.length, s = isStep ? S[n] : null, vid = isStep && s.t === 'video', timed = isStep && !vid, c = $('cont');
  const how = k < prev && via !== 'restart' ? 'back' : via === 'restart' ? 'button' : via;

  if (n < 0) ev('guided_open');
  else if (isStep) { viewed.add(n); ev('guided_step_view', Object.assign({ via: how }, timed ? { minutes: s.min } : {})); }
  else if (!completeSent) { completeSent = true; ev('guided_complete', { total_seconds: runStart ? sec(Date.now() - runStart) : 0, steps_viewed: viewed.size }); }

  $('room').classList.add('dim'); // always blurred: hidden behind videos anyway, and no first-time blur work at the warm-up's end
  const wrap = n >= WRAP;
  $('rR').classList.toggle('on', wrap);
  $('rW').classList.toggle('on', !wrap);
  $('bR').classList.toggle('on', wrap);
  $('bW').classList.toggle('on', !wrap);
  $('room').classList.toggle('onvid', vid);
  const stg = $('stage');
  stg.classList.toggle('isvid', vid); stg.classList.toggle('isnut', timed); stg.classList.toggle('ishome', n < 0); stg.classList.toggle('isend', n >= S.length);
  $('top').classList.toggle('off', !isStep);
  segs();
  $('det').classList.remove('open');
  clearTimeout(detT);
  $('bar').classList.toggle('isvid', vid);
  $('bar').classList.toggle('off', !isStep);
  $('bar').classList.toggle('notrack', isStep && !vid);
  $('edge').classList.toggle('on', timed);
  $('eb').style.height = '0';
  $('vlb').style.width = '0';
  $('cue').classList.remove('on');
  if (isStep) {
    $('l1').textContent = DAY.title;
    const l2 = $('l2'), tap = !vid && !s.word;
    l2.innerHTML = esc(DAY.verse.reference) + (tap ? IC.book : '');
    l2.className = 'l2' + (tap ? ' tap' : '');
    if (tap) l2.dataset.act = 'verse'; else delete l2.dataset.act;
  }
  c.classList.remove('done');
  c.classList.add('out');
  clearTimeout(swapT);
  swapT = setTimeout(() => { c.innerHTML = content(n); c.classList.toggle('full', !isStep); c.scrollTop = 0; c.classList.remove('out'); cue(); }, first || slide ? 0 : 280);
  first = false;

  if (vid) startVideo(s);
  // After a slide, wait for it to finish before starting keep-awake (a second video starting mid-slide stutters on iPhone).
  if (timed) { T = { total: s.total, acc: 0, since: Date.now(), run: true }; if (slide) { clearTimeout(wakeT); wakeT = setTimeout(() => { if (T && T.run) wake(); }, 650); } else wake(); }
  requestAnimationFrame(fitVid);
  if (isStep) { tm = setInterval(tick, vid ? 100 : 250); draw(); setPP(); }
  haptic();
}

/* ---------- v10 computer: hover shows the controls; video fits between the frame top and the bar ---------- */
let mvT = 0;
app.addEventListener('mousemove', e => {
  if (!DESKTOP || !S || !cur || n < 0 || n >= S.length || finished() || app.querySelector('.sheet')) return;
  const r = $('room').getBoundingClientRect(), over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  if (!over) { if (!e.target.closest('#det') && running()) $('det').classList.remove('open'); return; }
  const t = Date.now(); if (t - mvT < 250) return; mvT = t;
  detail(true, true);
});
app.addEventListener('mouseleave', () => { if (DESKTOP && running()) $('det').classList.remove('open'); });
function fitVid() { const b = $('bar'); if (b && !b.classList.contains('off')) app.style.setProperty('--vb', b.offsetHeight + 'px'); }
addEventListener('resize', fitVid);

/* ---------- prayer request panel (v10, Trey's final wording Nov 18) ---------- */
function prayer() {
  sheet('<button class="shx" data-act="x-sheet" aria-label="Close">' + IC.x + '</button>' + '<form class="pr" novalidate>' +
    '<div class="prh">Prayer request</div><p class="prsub">We are humbled and honored to pray for you. All prayer requests are kept confidential and only seen by one of our pastors.</p>' +
    '<label class="prl">Your request<textarea name="request" rows="5" required placeholder="How can we pray for you?"></textarea></label>' +
    '<label class="prl"><span>Your name <i class="opt">(optional)</i></span><input name="name" autocomplete="name"></label>' +
    '<label class="prc"><input type="checkbox" name="pastor"><span class="bx"></span><span>I’d like a pastor to reach out to me</span></label>' +
    '<label class="prl pre">Your email<input name="email" type="email" autocomplete="email" placeholder="you@email.com"></label>' +
    '<p class="prerr" id="prerr" role="alert"></p>' +
    '<button class="btn prsend" type="submit"><span class="txt">Send prayer request</span><span class="dots"><i></i><i></i><i></i></span></button></form>' +
    '<div class="prdone"><div class="chk">✓</div><div class="prh">Your prayers are on their way</div><p><span class="prall">We will be praying for you.</span><span class="prpast">One of our pastors will review your prayer request and be in touch.</span></p></div>');
  const sh = app.querySelector('.sheet'), f = sh.querySelector('form');
  sh.classList.add('prsheet');
  f.pastor.addEventListener('change', () => f.classList.toggle('want', f.pastor.checked));
  f.addEventListener('submit', e => { e.preventDefault(); sendPrayer(f, sh); });
}
function sendPrayer(f, sh) {
  const r = f.request.value.trim(), em = f.email.value.trim(), err = $('prerr'), want = f.pastor.checked;
  err.textContent = '';
  if (!r) { err.textContent = 'Please write your request.'; f.request.focus(); return; }
  if (want && !f.elements['name'].value.trim()) { err.textContent = 'Tell us who we are reaching out to.'; f.elements['name'].focus(); return; }
  if (want && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { err.textContent = 'Add your email so one of our pastors can reach out.'; f.email.focus(); return; }
  const b = f.querySelector('.prsend'); b.classList.add('sending'); b.disabled = true;
  const P = CFG.prayer, body = new URLSearchParams();
  body.append(P.f.request, r);
  if (P.f.name) body.append(P.f.name, f.elements['name'].value.trim());
  if (P.f.pastor) body.append(P.f.pastor, want ? 'Yes' : 'No');
  if (P.f.email) body.append(P.f.email, want ? em : '');
  if (P.f.date) body.append(P.f.date, DAY ? DAY.date : '');
  if (P.f.title) body.append(P.f.title, DAY ? DAY.title : '');
  // Google Forms accepts a plain POST; the reply can't be read (no-cors), but a network failure still rejects.
  fetch(P.action, { method: 'POST', mode: 'no-cors', body })
    .then(() => {
      ev('guided_control', { control: 'prayer_sent', pastor_contact: want }); // never the text, name or email
      sh.classList.toggle('want', want); sh.classList.add('sent');
    })
    .catch(() => { b.classList.remove('sending'); b.disabled = false; err.textContent = 'That didn’t send. Check your connection and try again; your request is still here.'; errEv('prayer_failed', 'network'); });
}

/* ---------- sheets, toast, cue ---------- */
function sheet(h) {
  closeSheets(true);
  const sc = document.createElement('div'); sc.className = 'scrim'; sc.onclick = () => closeSheets();
  const sh = document.createElement('div'); sh.className = 'sheet'; sh.innerHTML = '<div class="grab"></div>' + h;
  app.append(sc, sh);
  requestAnimationFrame(() => { sc.classList.add('on'); sh.classList.add('on'); });
  let sy = null, d = 0;
  // Swipe down closes the panel only when it is already scrolled to the top; otherwise the drag just scrolls it.
  sh.addEventListener('touchstart', e => { if (e.target.closest('textarea,input,label,button') || sh.scrollTop > 0 || (e.target.closest('.fbmid') && e.target.closest('.fbmid').scrollTop > 0)) { sy = null; return; } sy = e.touches[0].clientY; d = 0; sh.style.transition = 'none'; }, { passive: true });
  sh.addEventListener('touchmove', e => { if (sy === null) return; const fm = sh.querySelector('.fbmid'); if (sh.scrollTop > 0 || (fm && fm.scrollTop > 0)) { sy = null; d = 0; sh.style.transition = ''; sh.style.transform = ''; return; } d = Math.max(0, e.touches[0].clientY - sy); sh.style.transform = 'translateY(' + d + 'px)'; }, { passive: true });
  sh.addEventListener('touchend', () => { if (sy === null) return; sy = null; sh.style.transition = ''; if (d > 60) closeSheets(); else sh.style.transform = ''; }, { passive: true });
}
const WIDE = matchMedia('(min-width:900px)');
function closeSheets(now) {
  const fbs = app.querySelector('.fbsheet'); // closing the feedback panel early still sends what was answered
  if (fbs && fbs._close) { const f = fbs._close; fbs._close = null; f(); }
  app.querySelectorAll('.scrim,.sheet').forEach(e => {
    if (now) { e.remove(); return; }
    e.style.transition = 'transform .25s ease,opacity .25s';
    if (e.classList.contains('sheet') && !WIDE.matches) e.style.transform = 'translateY(105%)'; else e.style.opacity = '0';
    setTimeout(() => e.remove(), 260);
  });
}
function toast(t) {
  const e = document.createElement('div'); e.className = 'toast'; e.textContent = t; app.appendChild(e);
  requestAnimationFrame(() => e.classList.add('on'));
  setTimeout(() => { e.classList.remove('on'); setTimeout(() => e.remove(), 400); }, 2200);
}
/* ---------- beta feedback panel v13 (SOCIAL MEDIA spec, Trey approved Nov 19): one question per screen, a few a day ----------
   Options are the live Google Form's (APP ROADMAP, 11:21 AM lists). Shown with curly apostrophes, sent with the form's straight ones.
   Sends whatever was answered (on SUBMIT, or quietly when the panel closes); nothing answered = nothing sent. GA4 gets no answers. */
const FBX = {
  rec: { e: 'entry.1058114054', q: 'How likely are you to recommend DAILY FUEL GUIDED to a friend?', t: 'nps' },
  work: { e: 'entry.1820652490', q: 'Did anything not work?', t: 'gate', yes: 'Everything worked', no: 'Something didn’t',
    o: ['Video', 'Sound', 'Captions', 'The chime at the end of a timer', 'My screen went dark during a nutrient session'] },
  conf: { e: 'entry.1844087575', q: 'Was anything confusing or difficult to find?', t: 'gate', yes: 'Nothing, it was clear', no: 'Yes, something was',
    o: ['Turning sound or captions on or off', 'Pausing a timer', 'Going back a step', 'Knowing how much of the session was left', 'Seeing the full verse', 'Other'], other: 'Other' },
  email: { e: 'entry.1980362433', q: 'How did today’s session compare with the DAILY FUEL email?', t: 'one', o: ['Better', 'About the same', 'Not as good', 'I don’t really use the email'], once: 1 },
  music: { e: 'entry.397976073', q: 'Would background music help or distract during the spiritual nutrient sections?', t: 'one', o: ['Help', 'Distract', 'No difference'], once: 1 },
  cal: { e: 'entry.89823510', q: 'If you could put GUIDED sessions on your own calendar for the days and times you choose, would you?', t: 'one',
    o: ['Yes, I’d set it up right away', 'Maybe, I’d try it', 'No, the daily email is enough for me', 'No, I don’t use a calendar for this kind of thing'], once: 1 },
  timed: { e: 'entry.1857659000', q: 'How did the timed elements of the spiritual nutrients feel?', t: 'one', o: ['Too short', 'About right', 'Too long'] },
  more: { e: 'entry.1279951195', q: 'Is there anything else that would make this more useful or make you more likely to use it?', t: 'text' }
};
const FBKEY = 'fftc_guided_fb_v1'; let fbMemo = {};
function fbMem() { try { return JSON.parse(localStorage.getItem(FBKEY)) || {}; } catch (e) { return fbMemo; } }
function fbSave(m) { fbMemo = m; try { localStorage.setItem(FBKEY, JSON.stringify(m)); } catch (e) {} }
function fbToday() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
const fbDays = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);
// [recommend, weekly] · work · confusing · [ONE extra on non-recommend days: next unanswered one-time question, else timed every 3 days] · anything else
function fbPlan(m, d) {
  const p = [], recDue = !m.rec || fbDays(m.rec, d) >= 7;
  if (recDue) p.push('rec');
  p.push('work', 'conf');
  if (!recDue) { const nx = ['email', 'music', 'cal'].find(k => !(m.once || {})[k]); if (nx) p.push(nx); else if (!m.timed || fbDays(m.timed, d) >= 3) p.push('timed'); }
  p.push('more');
  return p;
}
let FB = null;
const fbSent = s => s.replace(/’/g, "'");
function feedback() {
  const m = fbMem(), d = fbToday();
  FB = { plan: fbPlan(m, d), i: 0, a: {}, sub: null, sent: false };
  if (FB.plan.includes('rec')) m.rec = d;   // weekly / rotating questions count as asked when shown
  if (FB.plan.includes('timed')) m.timed = d;
  fbSave(m);
  sheet('<button class="shx" data-act="x-sheet" aria-label="Close">' + IC.x + '</button>' +
    '<div class="fbhead"><div class="fbtop"><span class="fbeye">Beta feedback</span><span class="fbdots" id="fbdots"></span></div><div id="fbq"></div></div>' +
    '<div class="fbmidw"><div class="fbmid" id="fbmid"></div><button type="button" class="fbmore" id="fbmore" tabindex="-1">More' + IC.down.replace(' class="dn"', '') + '</button></div>' +
    '<div class="fbfoot" id="fbfoot"><div id="fbact"></div><div class="fbnav" id="fbnav"><button type="button" id="fbback">Back</button><button type="button" id="fbskip">Skip</button></div></div>');
  const sh = app.querySelector('.sheet');
  sh.classList.add('fbsheet');
  sh._close = () => fbSend(false);
  $('fbmid').addEventListener('scroll', fbMore, { passive: true });
  sh.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'fbmore') return $('fbmid').scrollBy({ top: $('fbmid').clientHeight * .7, behavior: 'smooth' });
    if (b.id === 'fbback') return fbBack();
    if (b.id === 'fbskip' || b.dataset.fb === 'next') return fbNext();
    if (b.dataset.fb === 'submit') return fbSubmit(b);
    if (b.dataset.fb === 'open') return fbOpen();
    if (b.dataset.pick != null) return fbPick(b, b.dataset.pick);
    if (b.dataset.tick != null) return fbTick(b, +b.dataset.tick);
  });
  sh.addEventListener('input', e => { if (e.target.id === 'fboth') FB.a.conf_other = e.target.value; if (e.target.id === 'fbtxt') FB.a.more = e.target.value; });
  fbDraw();
}
function fbDraw(dir) {
  const k = FB.plan[FB.i], q = FBX[k], sub = FB.sub === k, an = dir < 0 ? ' back' : '', A = FB.a[k];
  $('fbdots').innerHTML = FB.plan.map((_, j) => '<i class="' + (j < FB.i ? 'done' : j === FB.i ? 'now' : '') + '"></i>').join('');
  $('fbq').innerHTML = '<div class="fbscr' + an + '">' + (FB.i === 0 && !sub ? '<p class="fbintro">Your feedback makes a huge difference, so thank you.</p>' : '') +
    '<div class="fbq2">' + esc(q.q) + '</div>' + (q.t === 'gate' && sub ? '<div class="fbsub">Choose any that apply</div>' : '') + '</div>';
  const row = (lab, on, attr, cls) => '<button type="button" class="fbrow' + (cls || '') + (on ? ' on' : '') + '" ' + attr + '>' + esc(lab) + '<span class="tk">✓</span></button>';
  let h = '', act = '';
  if (q.t === 'nps') {
    h += '<div class="fbnps">';
    for (let i = 0; i <= 10; i++) h += '<button type="button" class="fbrow' + (A === String(i) ? ' on' : '') + '" data-pick="' + i + '">' + i + '</button>';
    h += '</div><div class="fbnpsl"><span>Not at all likely</span><span>Extremely likely</span></div><div class="fbnpsk"><b>0</b> = Not at all likely · <b>10</b> = Extremely likely</div>';
  } else if (q.t === 'one') h += '<div class="fbrows">' + q.o.map((o, j) => row(o, A === o, 'data-pick="' + j + '"')).join('') + '</div>';
  else if (q.t === 'gate' && !sub) h += '<div class="fbrows">' + row(q.yes, A && A[0] === q.yes, 'data-pick="-1"') + row(q.no, A && A[0] !== q.yes, 'data-fb="open"') + '</div>';
  else if (q.t === 'gate') {
    const sel = A && A[0] !== q.yes ? A : [];
    h += '<div class="fbrows">' + q.o.map((o, j) => row(o, sel.includes(o), 'data-tick="' + j + '"', ' m') +
      (q.other && o === q.other ? '<input class="fboth" id="fboth" placeholder="Tell us what" value="' + esc(FB.a[k + '_other'] || '') + '"' + (sel.includes(q.other) ? '' : ' hidden') + '>' : '')).join('') + '</div>';
    act = '<button type="button" class="btn fbgo" data-fb="next">Next</button>';
  } else if (q.t === 'text') {
    h += '<textarea class="fbtxt" id="fbtxt" rows="4">' + esc(A || '') + '</textarea>';
    act = '<button type="button" class="btn fbgo fbsend" data-fb="submit"><span class="txt">Submit feedback</span><span class="dots"><i></i><i></i><i></i></span></button>';
  }
  $('fbmid').innerHTML = '<div class="fbscr' + an + '">' + h + '</div>';
  $('fbmid').closest('.sheet').classList.toggle('fblist', q.t === 'gate' && sub); // computer: the panel grows to fit an opened list (Trey + APP ROADMAP, 11:21)
  $('fbmid').scrollTop = 0; requestAnimationFrame(fbMore);
  $('fbact').innerHTML = act;
  $('fbback').classList.toggle('gone', FB.i === 0 && !sub);
  $('fbskip').classList.toggle('gone', q.t === 'text');
}
function fbPick(b, j) {
  const k = FB.plan[FB.i], q = FBX[k];
  FB.a[k] = q.t === 'nps' ? String(j) : q.t === 'gate' ? [q.yes] : q.o[+j];
  if (q.once) { const m = fbMem(); m.once = m.once || {}; m.once[k] = 1; fbSave(m); }
  b.parentNode.querySelectorAll('.fbrow').forEach(r => r.classList.remove('on', 'pick'));
  b.classList.add('pick'); haptic();
  const at = FB.i; setTimeout(() => { if (FB && FB.i === at && !FB.done) fbNext(); }, 320);
}
function fbOpen() { const k = FB.plan[FB.i]; if (FB.a[k] && FB.a[k][0] === FBX[k].yes) delete FB.a[k]; FB.sub = k; fbDraw(1); }
function fbTick(b, j) {
  const k = FB.plan[FB.i], q = FBX[k], o = q.o[j];
  let s = (FB.a[k] || []).filter(x => x !== q.yes);
  s = s.includes(o) ? s.filter(x => x !== o) : s.concat(o);
  if (s.length) FB.a[k] = s; else delete FB.a[k];
  b.classList.toggle('on', s.includes(o));
  if (q.other && o === q.other) { const f = $('fboth'); f.hidden = !s.includes(o); if (!f.hidden) f.focus(); }
  fbMore();
}
function fbMore() { const m = $('fbmid'), b = $('fbmore'); if (!m || !b) return; b.classList.toggle('on', m.scrollHeight > m.clientHeight + 4 && m.scrollTop + m.clientHeight < m.scrollHeight - 24); }
addEventListener('resize', fbMore);
function fbNext() { FB.sub = null; if (FB.i < FB.plan.length - 1) { FB.i++; fbDraw(1); } }
function fbBack() { if (FB.sub) { FB.sub = null; fbDraw(-1); return; } if (FB.i > 0) { FB.i--; fbDraw(-1); } }
function fbPayload() {
  const p = new URLSearchParams();
  for (const k in FBX) {
    const v = FB.a[k], e = FBX[k].e;
    if (v == null || v === '' || (typeof v === 'string' && !v.trim())) continue;
    if (Array.isArray(v)) v.forEach(x => { if (FBX[k].other && x === FBX[k].other) { p.append(e, '__other_option__'); p.append(e + '.other_option_response', FB.a[k + '_other'] || ''); } else p.append(e, fbSent(x)); });
    else p.append(e, fbSent(v));
  }
  if (![...p.keys()].length) return null;
  const ua = navigator.userAgent;
  p.append('entry.1652624993', DAY ? DAY.date : '');
  p.append('entry.784985040', DAY ? DAY.title : '');
  p.append('entry.1768002246', /iPhone|iPad/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : 'Computer');
  return p;
}
function fbSend(final) {
  if (!FB || FB.sent) return Promise.resolve();
  const body = fbPayload(); if (!body) return Promise.resolve();
  FB.sent = true;
  return fetch(CFG.fbAction, { method: 'POST', mode: 'no-cors', body, keepalive: !final })
    .then(() => ev('guided_control', { control: 'feedback_sent' }))
    .catch(() => { ev('guided_control', { control: 'feedback_failed' }); errEv('feedback_failed', 'network'); });
}
function fbSubmit(b) {
  b.classList.add('sending'); b.disabled = true; $('fbnav').style.visibility = 'hidden'; FB.done = true;
  // Trey (Nov 19): a failed send still shows thanks (logged as feedback_failed); no link to the Google Form.
  Promise.all([fbSend(true), new Promise(ok => setTimeout(ok, 900))]).then(() => {
    if (!$('fbmid')) return;
    $('fbdots').innerHTML = ''; $('fbq').innerHTML = ''; const f = $('fbfoot'); if (f) f.remove();
    $('fbmid').innerHTML = '<div class="fbdone"><div class="chk">✓</div><div class="prh">Thank you for helping make DAILY FUEL better</div><p>We are grateful for our community who contributes to the work we do and the impact we can make.</p></div>';
    fbMore();
  });
}
function cue() { const el = $('cont'), c = $('cue'); c.classList.toggle('on', el.scrollHeight > el.clientHeight + 2 && el.scrollTop + el.clientHeight < el.scrollHeight - 4); }
$('cont').addEventListener('scroll', cue, { passive: true });
addEventListener('resize', cue);

/* ---------- input ---------- */
function flip(act, on) {
  const b = document.querySelector('.sheet [data-act=' + act + ']');
  if (!b) return;
  b.setAttribute('aria-checked', on);
  b.querySelector('.tgl').classList.toggle('on', on);
}
function act(a) {
  switch (a) {
    case 'close': go(-1, 'button'); break;
    case 'menu': ev('guided_control', { control: 'menu_open' });
      { const on = soundPref !== false && !(V.classList.contains('on') && V.muted);
        const sw = (act, label, v) => '<button class="mi" data-act="' + act + '" role="switch" aria-checked="' + v + '">' + label + '<span class="tgl' + (v ? ' on' : '') + '"></span></button>';
        sheet('<button class="shx" data-act="x-sheet" aria-label="Close">' + IC.x + '</button>' + '<button class="mi" data-act="fb-menu">Share beta feedback</button>' + sw('sound', 'Sound', on) + sw('cc', 'Captions', CC) + '<button class="mi" data-act="restart-menu">Restart session</button>'); }
      break;
    case 'toggle': toggle(); break;
    case 'unmute': unmute(); break;
    case 'pr-done': case 'x-sheet': closeSheets(); break;
    case 'cc': CC = !CC; try { localStorage.setItem('fftc_cc', CC ? '1' : '0'); } catch (e) {} ev('guided_control', { control: CC ? 'captions_on' : 'captions_off' }); flip('cc', CC); drawCap(V.currentTime || 0); break;
    case 'sound': { const sb = document.querySelector('.sheet [data-act=sound]'), on = !(sb && sb.getAttribute('aria-checked') === 'true'); setSound(on, on ? 'sound_on' : 'sound_off'); flip('sound', on); } break;
    case 'back': go(n - 1, 'button'); break;
    case 'next': go(n + 1, 'button'); break;
    case 'begin': go(0, 'button'); break;
    case 'verse': ev('guided_control', { control: 'verse_open' }); sheet('<button class="shx" data-act="x-sheet" aria-label="Close">' + IC.x + '</button>' + '<blockquote>' + verseHTML() + '</blockquote>'); app.querySelector('.sheet').classList.add('vsheet'); break;
    case 'fb-menu': closeSheets(); feedback(); break;
    case 'fb-end': ev('guided_end_action', { action: 'feedback' }); feedback(); break;
    case 'restart-menu': ev('guided_control', { control: 'restart' }); go(0, 'restart'); break;
    case 'restart-end': ev('guided_end_action', { action: 'restart' }); go(0, 'restart'); break;
    case 'prayer': ev('guided_end_action', { action: 'prayer' }); if (CFG.prayer.action) prayer(); break;
    case 'copy': ev('guided_end_action', { action: 'copy_email' });
      try { navigator.clipboard.writeText(CFG.mail); } catch (e) {} toast('Email address copied'); break;
  }
}
app.addEventListener('click', e => {
  const a = e.target.closest('[data-act]');
  if (a) { act(a.dataset.act); return; }
  if (V.muted && V.classList.contains('on')) { unmute(); return; }
  if (!S || !cur || n < 0 || n >= S.length || e.target.closest('a,button,.sheet,.scrim')) return;
  if (e.target.closest('#tr')) { detail(true); return; }
  if (e.target.closest('#det') || !running()) { detail(true); return; }
  detail(!$('det').classList.contains('open'));
});
let y0 = null, x0 = null, top1 = true, bot1 = true;
app.addEventListener('touchstart', e => {
  if (e.target.closest('.sheet,.scrim,button,.track')) return;
  y0 = e.touches[0].clientY; x0 = e.touches[0].clientX;
  const el = $('cont');
  if (el.scrollHeight > el.clientHeight + 2) { top1 = el.scrollTop <= 1; bot1 = el.scrollTop + el.clientHeight >= el.scrollHeight - 2; } else top1 = bot1 = true;
}, { passive: true });
app.addEventListener('touchend', e => {
  if (y0 === null) return;
  const dy = e.changedTouches[0].clientY - y0, dx = e.changedTouches[0].clientX - x0;
  y0 = null;
  if (Math.abs(dy) > 50 && Math.abs(dy) > Math.abs(dx)) { if (dy < 0 && bot1) go(n + 1, 'swipe'); else if (dy > 0 && top1) go(n - 1, 'swipe'); }
}, { passive: true });
addEventListener('keydown', e => {
  if (e.target.closest && e.target.closest('input,textarea,select')) return; // typing in the prayer form
  if (app.querySelector('.sheet')) { if (e.key === 'Escape') closeSheets(); return; } // arrows/space do nothing while a panel is open
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') go(n + 1, 'key');
  if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') go(n - 1, 'key');
  if (e.key === ' ') { e.preventDefault(); toggle(); }
  if (e.key === 'Escape') closeSheets();
});
let wl = 0;
app.addEventListener('wheel', e => {
  if (e.target.closest('.cont') || app.querySelector('.sheet')) return; // never move a step while a panel is open
  const t = Date.now();
  if (t - wl < 800 || Math.abs(e.deltaY) < 25) return;
  wl = t;
  go(n + (e.deltaY > 0 ? 1 : -1), 'key');
}, { passive: true });

document.addEventListener('visibilitychange', () => {
  if (!S) return;
  if (document.visibilityState === 'hidden') {
    if (hiddenAt) return;
    hiddenAt = Date.now();
    if (n < S.length && cur) { closeStep(); ev('guided_exit', { seconds_into_step: sec(hiddenAt - cur.t0) }); }
  } else if (hiddenAt) {
    const away = Date.now() - hiddenAt;
    if (cur) cur.hidden += away;
    hiddenAt = null;
    if (n < S.length) ev('guided_return', { away_seconds: sec(away) });
    if (T && T.run) wake();
  }
});

/* ---------- start ---------- */
needHls();
fetch(BASE + '../data/' + document.body.dataset.day + '.json', { cache: 'no-cache' })
  .then(r => { if (!r.ok) throw new Error('http_' + r.status); return r.json(); })
  .then(d => { if (d.status !== 'LOCKED') { holding(); return; } load(d); go(-1); })
  .catch(e => { errEv('data_load_failed', e && e.message); holding(); });
})();
