(() => {
'use strict';

/* ===== PENGATURAN (mudah diedit) ===== */
const CONFIG = {
  namaIbu: '',                    // contoh: 'Siti' -> "Ibu Siti tercinta,"
  namaPengirim: 'Anakmu',         // nama yang tampil di akhir surat
  musik: 'musik/monokrom-tulus.mp3', // lagu Monokrom - Tulus dari file yang disertakan
  fotoOtomatis: true,             // true = foto di assets/foto bernama foto1.jpg, foto2.jpg, ... terbaca otomatis
  caption: {                      // caption untuk foto otomatis: nomor foto: 'tulisan'
    // 1: 'Liburan di Bali 2019',
    // 2: 'Lebaran bersama',
  },
  foto: [                         // (opsional) foto dengan nama bebas
    // { src: 'foto/liburan.jpg', caption: 'Liburan' },
  ],
  surat: [
    'Ibu, hari ini aku ingin berhenti sejenak dan mengatakan hal-hal yang sering tertahan di lidahku. Terima kasih sudah merawat dan membesarkanku, bahkan di hari-hari ketika Ibu sendiri sedang lelah.',
    'Terima kasih untuk setiap pengorbanan yang tidak pernah Ibu hitung, untuk makanan yang selalu tersedia, untuk doa yang diam-diam Ibu panjatkan, dan untuk kasih sayang yang tidak pernah meminta balasan. Banyak hal baru kumengerti setelah aku bertambah dewasa.',
    'Maafkan aku, Bu, untuk kata-kata yang pernah menyakiti, untuk saat-saat aku membuat Ibu khawatir, dan untuk kesalahan yang mungkin belum sempat kuakui. Aku belajar bahwa Ibu selalu memaafkan lebih dulu.',
    'Di hari yang istimewa ini, aku berdoa semoga Ibu selalu diberi kesehatan, kebahagiaan, dan umur yang panjang lagi berkah.',
    'Dan semoga suatu hari nanti aku bisa membahagiakan Ibu, seperti Ibu telah membahagiakanku sepanjang hidupku. Sampai hari itu tiba, aku akan terus berusaha.'
  ]
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rev = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rev.unobserve(e.target); } }), { threshold: .12 });

/* ===== LOADER ===== */
const loadStart = Date.now();
addEventListener('load', async () => {
  await sleep(Math.max(0, 1100 - (Date.now() - loadStart)));
  const l = $('#loader'); l.classList.add('hide'); setTimeout(() => l.remove(), 900);
});

/* ===== MUSIK ===== */
const bgm = $('#bgm'), musicBtn = $('#musicBtn'), toast = $('#toast');
const VOLUME = .85;                // volume akhir lagu (0 sampai 1)
bgm.src = CONFIG.musik;
bgm.preload = 'auto';              // lagu dimuat sejak halaman dibuka, jadi langsung bunyi saat amplop dibuka
bgm.loop = true;
bgm.load();
let playing = false, useSynth = false, fadeRaf = 0, toastTimer = 0, opened = false;

function showToast(text) {
  toast.textContent = text; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3800);
}
if ('mediaSession' in navigator) {
  navigator.mediaSession.metadata = new MediaMetadata({ title: 'Monokrom', artist: 'Tulus' });
  navigator.mediaSession.setActionHandler('play', () => setMusic(true));
  navigator.mediaSession.setActionHandler('pause', () => setMusic(false));
}
const synth = {                    // cadangan: hanya dipakai kalau file lagu tidak ditemukan
  ctx: null, timer: null,
  start() {
    this.stop();
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ctx = this.ctx || new AC(); this.ctx.resume();
    const seq = [261.6, 329.6, 392, 523.3, 392, 329.6, 293.7, 349.2, 440, 523.3, 440, 349.2]; let i = 0;
    const tick = () => {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
      o.type = 'sine'; o.frequency.value = seq[i++ % seq.length];
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.07, t + .15); g.gain.exponentialRampToValueAtTime(.0001, t + 2.4);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + 2.5);
    };
    tick(); this.timer = setInterval(tick, 900);
  },
  stop() { clearInterval(this.timer); this.timer = null; }
};
function fadeTo(target, ms) {      // naik atau turun dengan halus (kurva smoothstep)
  cancelAnimationFrame(fadeRaf);
  const from = bgm.volume, t0 = performance.now();
  const step = now => {
    const k = Math.min(1, (now - t0) / ms), e = k * k * (3 - 2 * k);
    bgm.volume = from + (target - from) * e;
    if (k < 1) fadeRaf = requestAnimationFrame(step);
    else if (target === 0) bgm.pause();
  };
  fadeRaf = requestAnimationFrame(step);
}
async function engineOn() {        // true kalau lagu berhasil bunyi
  if (useSynth) { synth.start(); return true; }
  bgm.volume = .15;                // langsung terdengar, lalu naik perlahan ke volume penuh
  try { await bgm.play(); fadeTo(VOLUME, 1600); return true; }
  catch (err) {
    if (err && err.name === 'NotAllowedError') return false;   // browser menolak: tunggu ketukan berikutnya
    useSynth = true; synth.start(); return true;
  }
}
function engineOff() { fadeTo(0, 450); synth.stop(); }
function renderMusic() {
  musicBtn.setAttribute('aria-pressed', playing); musicBtn.classList.toggle('off', !playing);
  $('.np').classList.toggle('on', playing && !useSynth);
}
function retryOnTap() {            // kalau browser memblokir, lagu mulai di ketukan pertama berikutnya
  const go = () => { if (opened && !playing) setMusic(true); };
  addEventListener('pointerdown', go, { once: true });
}
async function setMusic(on) {
  playing = on;
  if (on) {
    renderMusic();
    const ok = await engineOn();
    if (!ok) { playing = false; renderMusic(); showToast('Ketuk di mana saja untuk memutar lagu'); retryOnTap(); return; }
    showToast('♫  Monokrom · Tulus');
  } else engineOff();
  renderMusic();
}
bgm.addEventListener('error', () => { useSynth = true; if (playing) synth.start(); });
musicBtn.addEventListener('click', () => setMusic(!playing));
document.addEventListener('visibilitychange', () => {
  if (!playing) return;
  if (document.hidden) { bgm.pause(); synth.stop(); } else engineOn();
});

/* ===== PEMBUKAAN AMPLOP ===== */
const openBtn = $('#openBtn'), intro = $('#intro'), site = $('#site');
openBtn.addEventListener('click', async () => {
  if (opened) return; opened = true; openBtn.disabled = true;
  setMusic(true);                                   // musik menyala setelah ketukan pengguna
  intro.classList.add('opening');                   // segel lepas, tutup terbuka, surat naik dan membesar
  await sleep(RM ? 300 : 2600);
  site.classList.remove('pre');                     // halaman utama sudah siap di belakang, tinggal dimunculkan
  document.body.classList.remove('locked');
  scrollTo(0, 0);
  intro.classList.add('leave');
  startPetals(); startDust(); observeAll();
  await sleep(RM ? 100 : 1400);
  intro.hidden = true;
});

/* ===== KELOPAK & HATI ===== */
function startPetals() {
  if (RM) return;
  const box = $('#petals'), n = innerWidth < 640 ? 10 : 18;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i'), s = 10 + Math.random() * 14;
    p.className = 'petal';
    p.style.cssText = `left:${Math.random() * 100}%;width:${s}px;height:${s * 1.3}px;animation-duration:${9 + Math.random() * 9}s;animation-delay:${-Math.random() * 14}s;--dx:${(Math.random() - .5) * 160}px;--c:${Math.random() > .5 ? 'var(--pink)' : 'var(--rose)'}`;
    box.appendChild(p);
  }
}
let heartTimer;
function hearts(on) {
  clearInterval(heartTimer); if (!on || RM) return;
  const box = $('.hearts');
  heartTimer = setInterval(() => {
    if (box.childElementCount > 10) return;
    const h = document.createElement('span');
    h.textContent = Math.random() > .3 ? '❤' : '✿';
    h.style.cssText = `left:${5 + Math.random() * 90}%;font-size:${14 + Math.random() * 18}px;animation-duration:${6 + Math.random() * 4}s`;
    h.addEventListener('animationend', () => h.remove());
    box.appendChild(h);
  }, 700);
}

/* ===== SCROLL: progress, parallax, tombol atas ===== */
const progress = $('#progress'), toTop = $('#toTop'), par = $$('[data-par]');
let ticking = false;
function onScroll() {
  const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  toTop.hidden = y < 600 || $('#site').classList.contains('pre');
  if (!RM) par.forEach(el => el.style.transform = `translate3d(0,${y * el.dataset.par}px,0)`);
  ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }));

/* ===== NAVIGASI ===== */
const nav = $('#nav'), burger = $('#burger');
burger.addEventListener('click', () => burger.setAttribute('aria-expanded', nav.classList.toggle('open')));
nav.addEventListener('click', e => { if (e.target.closest('a')) { nav.classList.remove('open'); burger.setAttribute('aria-expanded', false); } });

const fsBtn = $('#fsBtn'), root = document.documentElement;
const reqFS = root.requestFullscreen || root.webkitRequestFullscreen;
if (!reqFS) fsBtn.hidden = true;
fsBtn.addEventListener('click', () => {
  if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  else reqFS.call(root);
});

/* ===== OBSERVER: reveal, nav aktif, surat, hati ===== */
let observed = false;
function observeAll() {
  if (observed) return; observed = true;
  $$('.card').forEach((c, i) => { c.style.setProperty('--d', i * 130 + 'ms'); rev.observe(c); });
  $$('.reveal').forEach(el => rev.observe(el));
  const links = $$('#nav a');
  const act = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.hash === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main section').forEach(s => act.observe(s));
  const once = new IntersectionObserver(([e]) => { if (e.isIntersecting) { once.disconnect(); typeLetter(); } }, { threshold: .3 });
  once.observe($('.paper'));
  new IntersectionObserver(([e]) => hearts(e.isIntersecting), { threshold: .2 }).observe($('#penutup'));
}

/* ===== SURAT: efek mengetik ===== */
function typeLetter() {
  const body = $('#letterBody'), skipBtn = $('#skipBtn'), sign = $('#sign');
  $('#greet').textContent = 'Ibu' + (CONFIG.namaIbu ? ' ' + CONFIG.namaIbu : '') + ' tercinta,';
  let skip = RM;
  skipBtn.addEventListener('click', () => { skip = true; });
  (async () => {
    for (const t of CONFIG.surat) {
      const p = document.createElement('p'); body.appendChild(p);
      if (skip) { p.textContent = t; continue; }
      p.classList.add('typing');
      for (let i = 1; i <= t.length && !skip; i++) { p.textContent = t.slice(0, i); await sleep(26); }
      p.textContent = t; p.classList.remove('typing');
      if (!skip) await sleep(350);
    }
    sign.innerHTML = 'Dengan segenap cinta,<strong></strong>';
    sign.lastChild.textContent = CONFIG.namaPengirim;
    sign.hidden = false; skipBtn.hidden = true;
  })();
}

/* ===== KUE ULANG TAHUN ===== */
function buildCake() {                              // menggambar kue tiga tingkat sebagai SVG
  let sd = 7; const rnd = () => (sd = sd * 16807 % 2147483647) / 2147483647;
  const T = [{ x: 56, w: 288, t: 292, b: 362, ry: 14, f: '#f6c3cf', g: 'gP' }, { x: 88, w: 224, t: 226, b: 292, ry: 12, f: '#fffaf6', g: 'gW' }, { x: 120, w: 160, t: 164, b: 226, ry: 10, f: '#f6c3cf', g: 'gP' }];
  const arc = (t, x) => t.ry * Math.sqrt(1 - ((x - 200) / (t.w / 2)) ** 2);
  const defs = `<linearGradient id="gS" x2="0" y2="1"><stop offset="0" stop-color="#f6e2cc"/><stop offset=".22" stop-color="#f6e2cc"/><stop offset=".22" stop-color="#e7849b"/><stop offset=".29" stop-color="#e7849b"/><stop offset=".29" stop-color="#f6e2cc"/><stop offset=".62" stop-color="#f6e2cc"/><stop offset=".62" stop-color="#e7849b"/><stop offset=".69" stop-color="#e7849b"/><stop offset=".69" stop-color="#f6e2cc"/></linearGradient>
<linearGradient id="gH"><stop offset="0" stop-color="#5a283a" stop-opacity=".34"/><stop offset=".2" stop-color="#5a283a" stop-opacity=".05"/><stop offset=".42" stop-color="#fff" stop-opacity=".2"/><stop offset=".62" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#5a283a" stop-opacity=".4"/></linearGradient>
<radialGradient id="gW" cx=".4" cy=".4"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fde6e9"/></radialGradient><radialGradient id="gP" cx=".4" cy=".4"><stop offset="0" stop-color="#fbdce3"/><stop offset="1" stop-color="#f0aebd"/></radialGradient>
<linearGradient id="gD"><stop offset="0" stop-color="#b78f4e"/><stop offset=".3" stop-color="#f3deaa"/><stop offset=".6" stop-color="#c8a56a"/><stop offset="1" stop-color="#a47b3c"/></linearGradient>
<radialGradient id="gO" cx=".35" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#f3deaa"/><stop offset="1" stop-color="#c8a56a"/></radialGradient>
<radialGradient id="gG"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset=".5" stop-color="#ff9f4a" stop-opacity=".16"/><stop offset="1" stop-color="#ff9f4a" stop-opacity="0"/></radialGradient>
<linearGradient id="gF" x2="0" y2="1"><stop offset="0" stop-color="#ff8a3d"/><stop offset=".55" stop-color="#ffc857"/><stop offset="1" stop-color="#fff2a8"/></linearGradient>
<linearGradient id="gC"><stop offset="0" stop-color="#5a283a" stop-opacity=".25"/><stop offset=".4" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-color="#5a283a" stop-opacity=".3"/></linearGradient>
<pattern id="st0" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="10" height="10" fill="#fff"/><rect width="5" height="10" fill="#d9a0a8"/></pattern>
<pattern id="st1" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="10" height="10" fill="#fff"/><rect width="5" height="10" fill="#c8a56a"/></pattern>
<filter id="fs" x="-5%" y="-5%" width="110%" height="120%"><feDropShadow dx="0" dy="1.5" stdDeviation="0" flood-color="#8a3d52" flood-opacity=".22"/></filter>`;
  let o = `<defs>${defs}</defs><g class="ghost">${T.map(t => `<path d="M${t.x} ${t.t}V${t.b}A${t.w / 2} ${t.ry} 0 0 0 ${t.x + t.w} ${t.b}V${t.t}"/>`).join('')}</g>`;
  o += '<g class="stand an"><ellipse cx="200" cy="398" rx="96" ry="9" fill="url(#gD)"/><rect x="190" y="372" width="20" height="28" fill="url(#gD)"/><ellipse cx="200" cy="366" rx="170" ry="17" fill="url(#gD)"/><ellipse cx="200" cy="363" rx="166" ry="15" fill="#fff7ef"/></g>';
  T.forEach((t, i) => {
    const R = t.w / 2, p = `M${t.x} ${t.t}V${t.b}A${R} ${t.ry} 0 0 0 ${t.x + t.w} ${t.b}V${t.t}Z`, n = Math.round(t.w / 21); let d = '';
    for (let k = 0; k < n; k++) { const w = 13 + rnd() * 4, cx = t.x + (k + .5) * t.w / n, l = t.ry + 4 + rnd() * (k % 2 ? 10 : 26); d += `<rect class="dr an" style="--k:${k}" x="${(cx - w / 2).toFixed(1)}" y="${t.t + t.ry - 8}" width="${w.toFixed(1)}" height="${l.toFixed(1)}" rx="${(w / 2).toFixed(1)}"/>`; }
    o += `<g class="tier an" style="--i:${i};transform-origin:200px ${t.b}px"><path d="${p}" fill="url(#gS)"/><ellipse cx="200" cy="${t.t}" rx="${R}" ry="${t.ry}" fill="#f1d6bb"/><g class="frost an" filter="url(#fs)" fill="${t.f}" style="--i:${i}"><rect x="${t.x}" y="${t.t}" width="${t.w}" height="${t.ry + 5}"/>${d}<ellipse cx="200" cy="${t.t}" rx="${R}" ry="${t.ry}" fill="url(#${t.g})"/></g><path d="${p}" fill="url(#gH)"/></g>`;
  });
  T.forEach(t => { for (let x = t.x + 7, k = 0; x <= t.x + t.w - 6; x += 13, k++) o += `<circle class="pe an" style="--k:${k}" cx="${x}" cy="${(t.b + arc(t, x)).toFixed(1)}" r="3.3" fill="url(#gO)"/>`; });
  [[98, 226], [302, 226], [70, 292], [330, 292]].forEach(([x, y], k) => o += `<g class="fw an" style="--k:${k}"><ellipse cx="${x - 14}" cy="${y + 4}" rx="10" ry="4" fill="#9db38f" transform="rotate(-25 ${x - 14} ${y + 4})"/><ellipse cx="${x + 14}" cy="${y + 4}" rx="10" ry="4" fill="#9db38f" transform="rotate(25 ${x + 14} ${y + 4})"/><use href="#flower" x="${x - 17}" y="${y - 17}" width="22" height="22" style="color:#e58aa0"/><use href="#flower" x="${x - 3}" y="${y - 13}" width="19" height="19" style="color:#f7c6d0"/><use href="#flower" x="${x - 12}" y="${y - 6}" width="15" height="15" style="color:#fff3ee"/></g>`);
  const xs = [156, 178, 200, 222, 244], hs = [44, 52, 60, 52, 44]; let f = '';
  xs.forEach((x, k) => {
    const h = hs[k], y = 166;
    o += `<g class="cd an" style="--k:${k}"><rect x="${x - 4.5}" y="${y - h}" width="9" height="${h}" rx="3" fill="url(#st${k % 2})"/><rect x="${x - 4.5}" y="${y - h}" width="9" height="${h}" rx="3" fill="url(#gC)"/><rect x="${x - .7}" y="${y - h - 5}" width="1.4" height="6" fill="#5a4147"/></g>`;
    f += `<g transform="translate(${x} ${y - h - 5})"><g class="fl" style="--k:${k}"><circle class="gl" r="30" cy="-14" fill="url(#gG)"/><g class="fi"><path d="M0 0C-7 0-8-9-4-17-2-22 0-26 0-30 2-24 8-19 8-9 8-3 5 0 0 0Z" fill="url(#gF)"/><path d="M0-1C-3-1-3.5-6-1.5-10 0-13 0-14 0-15 1-12 3.5-9 3.5-5 3.5-2 2-1 0-1Z" fill="#fffbe6"/></g></g><path class="ws" d="M0-12c-5-8 5-14 0-24s4-12 0-18"/></g>`;
  });
  for (let x = 132, k = 0; x <= 268; x += 17, k++) o += `<g transform="translate(${x} ${(164 + arc(T[2], x) + 3).toFixed(1)})"><path class="ro an" style="--k:${k}" d="M0-9C3-4 7-3 7 2 7 6 4 8 0 8-4 8-7 6-7 2-7-3-3-4 0-9Z" fill="${k % 2 ? '#f7c6d0' : '#fff'}" stroke="#e58aa0" stroke-width=".8"/></g>`;
  return o + f;
}
(function () {
  const cake = $('#cake'), wish = $('#wish'), blowBtn = $('#blowBtn'), relight = $('#relightBtn');
  const makeBtn = $('#makeBtn'), replayBtn = $('#replayBtn'), stat = $('#cakeStatus');
  $('#cakeSvg').innerHTML = buildCake();
  $('#capName').textContent = 'untuk Ibu' + (CONFIG.namaIbu ? ' ' + CONFIG.namaIbu : '');
  let lit = false, timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, RM ? 0 : ms));
  function status(t) { stat.classList.remove('show'); at(200, () => { stat.textContent = t; stat.classList.add('show'); }); }
  function play() {                                   // dipanggil tombol "Buat Kue"
    timers.forEach(clearTimeout); timers = []; lit = false;
    cake.classList.remove('play', 'out', 'relit', 'lit'); wish.classList.remove('show');
    [makeBtn, blowBtn, relight, replayBtn].forEach(b => b.hidden = true);
    void cake.offsetWidth; cake.classList.add('play');
    [[100, 'Menyiapkan piring dan adonan…'], [900, 'Menumpuk tiga lapis kue…'], [2700, 'Mengoleskan krim lembut…'], [4300, 'Menghias dengan bunga dan mutiara…'], [5300, 'Memasang lilin…'], [6300, 'Menyalakan lilin…']].forEach(([ms, t]) => at(ms, () => status(t)));
    at(7400, () => { lit = true; cake.classList.add('lit'); status('Kuenya sudah jadi! Ayo tiup lilinnya, Bu ❤️'); blowBtn.hidden = false; });
  }
  makeBtn.addEventListener('click', play);
  replayBtn.addEventListener('click', play);
  const colors = ['#f5d3d8', '#d9a0a8', '#ead9b4', '#fffdf9'];
  // Dekorasi pesta tetap memakai palet warna utama website.
  $('#bunting').innerHTML = Array.from({ length: 14 }, (_, i) => `<i style="--c:${colors[i % 4]};animation-delay:${-(Math.random() * 3).toFixed(2)}s"></i>`).join('');
  $('#intro').insertAdjacentHTML('afterbegin', Array.from({ length: 16 }, () => `<i class="star" style="left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-delay:${-(Math.random() * 3).toFixed(2)}s"></i>`).join(''));

  const cv = $('#confetti'), cx = cv.getContext('2d'); let parts = [], raf = 0;
  function confetti() {
    if (RM) return;
    cv.width = innerWidth; cv.height = innerHeight;
    const r = cake.getBoundingClientRect(), cols = ['#f5d3d8', '#d9a0a8', '#c8a56a', '#ead9b4', '#fffaf3', '#a45d69'];
    for (let i = 0; i < (innerWidth < 640 ? 80 : 150); i++)
      parts.push({ x: r.left + r.width / 2, y: r.top + r.height * .3, vx: (Math.random() - .5) * 16, vy: -8 - Math.random() * 13, w: 6 + Math.random() * 6, h: 3 + Math.random() * 5, a: Math.random() * 6, va: (Math.random() - .5) * .3, c: cols[i % cols.length] });
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    cx.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter(p => p.y < cv.height + 20);
    for (const p of parts) {
      p.vy += .28; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); cx.restore();
    }
    raf = parts.length ? requestAnimationFrame(tick) : 0;
    if (!raf) cx.clearRect(0, 0, cv.width, cv.height);
  }
  function balloons() {
    if (RM) return;
    const box = $('#balloons');
    for (let i = 0; i < 7; i++) {
      const balloon = document.createElement('i'); balloon.className = 'bl';
      balloon.style.cssText = `left:${6 + Math.random() * 84}%;--c:${colors[i % 4]};--dx:${(Math.random() - .5) * 90}px;animation-delay:${i * .25}s;animation-duration:${6 + Math.random() * 3}s`;
      balloon.addEventListener('animationend', () => balloon.remove()); box.appendChild(balloon);
    }
  }
  function say(message) {
    wish.classList.remove('show');
    setTimeout(() => { wish.textContent = message; wish.classList.add('show'); }, RM ? 0 : 250);
  }
  function blow() {
    if (!lit || cake.classList.contains('out')) return;
    cake.classList.add('out'); blowBtn.hidden = true; relight.hidden = false; replayBtn.hidden = false;
    stat.classList.remove('show');
    say('Semoga semua harapan Ibu terkabul. Selamat ulang tahun! ❤️');
    setTimeout(() => { confetti(); balloons(); }, RM ? 0 : 450);
  }
  function reset() {
    cake.classList.remove('out'); cake.classList.add('relit');
    wish.classList.remove('show'); blowBtn.hidden = false; relight.hidden = true; replayBtn.hidden = true;
    status('Lilin menyala lagi. Silakan berharap sekali lagi ❤️');
  }
  blowBtn.addEventListener('click', blow);
  cake.addEventListener('click', blow);
  relight.addEventListener('click', reset);
})();

/* ===== TAMAN BUNGA ===== */
(function () {
  const g = $('#garden'), box = $('#plants'), cnt = $('#gcount');
  const cols = ['#f0a8b4', '#d9a0a8', '#f7d9dd', '#e8c27a', '#fffaf3', '#c98592'];
  function update() {
    const k = box.querySelectorAll('.plant:not(.bye)').length;
    cnt.textContent = k === 0 ? 'Belum ada bunga. Ketuk taman untuk menanam.' : k < 10 ? `${k} bunga sudah mekar` : `${k} bunga mekar untuk Ibu. Semoga hari-hari Ibu selalu seindah taman ini ❤️`;
  }
  function plant(x) {
    const p = document.createElement('div'); p.className = 'plant';
    p.style.cssText = `left:${x}%;--h:${(60 + Math.random() * 90).toFixed(0)}px;--s:${(34 + Math.random() * 20).toFixed(0)}px;--c:${cols[Math.floor(Math.random() * cols.length)]};--sd:${(-Math.random() * 4).toFixed(2)}s`;
    p.innerHTML = '<i class="stem"></i><svg class="bloom" viewBox="0 0 100 100" aria-hidden="true"><use href="#flower"/></svg>';
    box.appendChild(p);
    const alive = box.querySelectorAll('.plant:not(.bye)');
    if (alive.length > 36) { const o = alive[0]; o.classList.add('bye'); setTimeout(() => o.remove(), 700); }
    update();
  }
  const rand = () => 6 + Math.random() * 88;
  g.addEventListener('click', e => { const r = g.getBoundingClientRect(); plant(Math.min(95, Math.max(5, (e.clientX - r.left) / r.width * 100))); });
  g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); plant(rand()); } });
  $('#plantBtn').addEventListener('click', () => plant(rand()));
  $('#clearBtn').addEventListener('click', () => { box.innerHTML = ''; update(); });
  update();
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); [22, 50, 78].forEach((x, i) => setTimeout(() => plant(x), 400 + i * 450)); } }, { threshold: .4 });
  io.observe(g);
})();

/* ===== DEBU EMAS & JEJAK KURSOR ===== */
function startDust() {
  if (RM) return;
  const box = $('#dust'), n = innerWidth < 640 ? 10 : 16;
  for (let i = 0; i < n; i++) {
    const d = document.createElement('i'), s = 3 + Math.random() * 5;
    d.style.cssText = `left:${Math.random() * 100}%;width:${s}px;height:${s}px;animation-duration:${14 + Math.random() * 16}s;animation-delay:${-Math.random() * 20}s;--dx:${((Math.random() - .5) * 80).toFixed(0)}px`;
    box.appendChild(d);
  }
}
if (!RM && matchMedia('(hover: hover)').matches) {
  let last = 0;
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || document.body.classList.contains('locked')) return;
    const t = performance.now(); if (t - last < 70) return; last = t;
    const s = document.createElement('i'); s.className = 'trail'; s.textContent = Math.random() > .5 ? '✦' : '❤';
    s.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;--dx:${((Math.random() - .5) * 30).toFixed(0)}px`;
    s.addEventListener('animationend', () => s.remove()); document.body.appendChild(s);
  }, { passive: true });
}

/* ===== KARTU ===== */
$$('.card').forEach(c => c.addEventListener('click', () => c.setAttribute('aria-expanded', c.classList.toggle('open'))));

/* ===== GALERI (foto diambil dari CONFIG.foto) ===== */
const grid = $('#grid'), empty = $('#empty');
const gal = { items: [], filter: 'all' };
const visible = () => gal.items.filter(i => i.ok && (gal.filter === 'all' || i.fav));
function figure(it, n) {
  const f = document.createElement('figure'); f.className = 'ph'; f.dataset.id = it.id; f.style.setProperty('--d', (n % 3) * 120 + 'ms'); f.style.setProperty('--r', it.ratio.toFixed(3)); f.classList.add(it.ratio > 1.15 ? 'land' : 'port');
  const img = new Image(); img.src = it.url; img.alt = it.caption || 'Foto kenangan keluarga'; img.decoding = 'async'; img.loading = 'lazy'; img.style.aspectRatio = it.ratio;
  const open = document.createElement('button'); open.type = 'button'; open.className = 'open'; open.setAttribute('aria-label', 'Perbesar foto'); open.appendChild(img);
  const bar = document.createElement('div'); bar.className = 'bar';
  const cap = document.createElement('span'); cap.className = 'cap'; cap.textContent = it.caption;
  const fv = document.createElement('button'); fv.type = 'button'; fv.className = 'fav'; fv.textContent = '♥'; fv.setAttribute('aria-label', 'Tandai favorit'); fv.setAttribute('aria-pressed', it.fav);
  bar.append(cap, fv); f.append(open, bar); return f;
}
function render() {
  grid.replaceChildren(...visible().map(figure));
  $$('.ph', grid).forEach(el => rev.observe(el));
  empty.textContent = visible().length ? '' : gal.filter === 'fav' ? 'Belum ada foto favorit. Ketuk ♥ pada foto.' : 'Belum ada foto. Simpan foto di folder foto dengan nama foto1.jpg, foto2.jpg, dan seterusnya.';
}
grid.addEventListener('click', e => {
  const fig = e.target.closest('figure'); if (!fig) return;
  const it = gal.items[fig.dataset.id], fav = e.target.closest('.fav'), open = e.target.closest('.open');
  if (fav) { it.fav = !it.fav; fav.setAttribute('aria-pressed', it.fav); if (gal.filter === 'fav') render(); }
  else if (open) openLB(it, open);
});
$$('.tabs button').forEach(b => b.addEventListener('click', () => {
  gal.filter = b.dataset.f; $$('.tabs button').forEach(x => x.setAttribute('aria-pressed', x === b)); render();
}));
// Foto: otomatis mencari foto/foto1.jpg, foto2.jpg, ... ditambah daftar manual di CONFIG.foto
const clampR = r => Math.min(2, Math.max(.6, r));
const probe = src => new Promise(res => { const im = new Image(); im.onload = () => res(clampR(im.naturalWidth / im.naturalHeight)); im.onerror = () => res(0); im.src = src; });
async function firstHit(n) {
  for (const e of ['jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG', 'webp']) { const src = `foto/foto${n}.${e}`, r = await probe(src); if (r) return { src, r }; }
  return null;
}
async function loadPhotos() {
  empty.textContent = 'Memuat foto…';
  const found = [], seen = new Set();
  const add = (src, caption, ratio) => { if (seen.has(src)) return; seen.add(src); found.push({ id: found.length, url: src, caption, fav: false, ok: true, ratio }); };
  const manual = await Promise.all(CONFIG.foto.map(f => probe(f.src)));
  CONFIG.foto.forEach((f, i) => manual[i] && add(f.src, f.caption || '', manual[i]));
  if (CONFIG.fotoOtomatis) {
    for (let s = 1; s <= 120; s += 6) {
      const batch = await Promise.all(Array.from({ length: 6 }, (_, k) => firstHit(s + k)));
      if (!batch.some(Boolean)) break;
      batch.forEach((h, k) => h && add(h.src, (CONFIG.caption || {})[s + k] || '', h.r));
    }
  }
  gal.items = found; render();
}
loadPhotos();

/* ===== LIGHTBOX ===== */
const lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
let list = [], idx = 0, lastFocus = null;
function showLB() { const it = list[idx]; lbImg.style.animation = 'none'; void lbImg.offsetWidth; lbImg.style.animation = ''; lbImg.src = it.url; lbImg.alt = it.caption || 'Foto kenangan'; lbCap.textContent = it.caption; $('.lb-prev').hidden = $('.lb-next').hidden = list.length < 2; }
function openLB(it, from) {
  list = visible(); idx = list.indexOf(it); lastFocus = from; showLB();
  lb.hidden = false; document.body.classList.add('noscroll'); $('.lb-x').focus();
}
function closeLB() { lb.hidden = true; document.body.classList.remove('noscroll'); lbImg.removeAttribute('src'); lastFocus && lastFocus.isConnected && lastFocus.focus(); }
const step = d => { idx = (idx + d + list.length) % list.length; showLB(); };
$('.lb-x').addEventListener('click', closeLB);
$('.lb-prev').addEventListener('click', () => step(-1));
$('.lb-next').addEventListener('click', () => step(1));
lb.addEventListener('click', e => { if (e.target === lb) closeLB(); });
document.addEventListener('keydown', e => {
  if (lb.hidden) return;
  if (e.key === 'Escape') closeLB();
  else if (e.key === 'ArrowLeft' && list.length > 1) step(-1);
  else if (e.key === 'ArrowRight' && list.length > 1) step(1);
  else if (e.key === 'Tab') {
    const f = $$('button', lb).filter(b => !b.hidden), a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  }
});
let tx = 0;
lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', e => { const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50 && list.length > 1) step(d > 0 ? -1 : 1); });
})();
