/* NZ Rich - Game Ladang (gaya FarmVille, simpan dalam telefon sahaja) */
window.addEventListener('load', function () {
  const $ = id => document.getElementById(id);
  const CROPS = {
    cili:    { n: 'Cili', i: '🌶️', lv: 1, cost: 10,   time: 60,    sell: 18,   xp: 2 },
    keledek: { n: 'Keledek', i: '🍠', lv: 1, cost: 25,   time: 300,   sell: 50,   xp: 5 },
    serai:   { n: 'Serai', i: '🌾', lv: 2, cost: 60,   time: 900,   sell: 130,  xp: 10 },
    betik:   { n: 'Betik', i: '🥭', lv: 3, cost: 150,  time: 1800,  sell: 330,  xp: 20 },
    limau:   { n: 'Limau', i: '🍋', lv: 4, cost: 400,  time: 7200,  sell: 900,  xp: 45 },
    nenas:   { n: 'Nenas', i: '🍍', lv: 5, cost: 1000, time: 14400, sell: 2400, xp: 100 }
  };
  const MAX = 20, MULA = 6, BAJA = 15;
  const kunci = () => 'nz_farm_' + ((typeof currentUser !== 'undefined' && currentUser) ? currentUser.uid : 'tetamu');
  let st = null, stKey = '', pilih = 'cili', modBaja = false, mesej = '';

  function baru() { return { coins: 200, xp: 0, level: 1, open: MULA, plots: Array(MAX).fill(null) }; }
  function muat() {
    if (st && stKey === kunci()) return;
    stKey = kunci();
    try { st = JSON.parse(localStorage.getItem(stKey)); } catch (e) { st = null; }
    if (!st || !Array.isArray(st.plots)) st = baru();
  }
  function simpan() { try { localStorage.setItem(stKey, JSON.stringify(st)); } catch (e) {} }
  const perluXp = () => st.level * 40;
  const kosPetak = i => 150 * (i - 5);
  const masa = s => {
    s = Math.max(0, Math.ceil(s));
    const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), d = s % 60;
    return h ? h + 'j ' + m + 'm' : (m ? m + 'm ' + d + 's' : d + 's');
  };

  /* ---------- Sembunyi game lama, bina kad baharu ---------- */
  const lama = $('farm-grid') && $('farm-grid').closest('.card');
  if (!lama) return;
  lama.style.display = 'none';
  const st8 = document.createElement('style');
  st8.textContent =
    '#fm-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}' +
    '.fm-p{background:#8d6e63;border:2px solid #5d4037;border-radius:12px;height:78px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:30px;cursor:pointer;position:relative;user-select:none;-webkit-user-select:none;background-image:repeating-linear-gradient(45deg,rgba(0,0,0,.07) 0 6px,transparent 6px 12px)}' +
    '.fm-p small{font-size:10px;color:#fff;font-weight:700;margin-top:2px}' +
    '.fm-p.lock{background:#bdbdbd;border-color:#9e9e9e;opacity:.8}' +
    '.fm-p.ready{border-color:#ffeb3b;box-shadow:0 0 12px #ffeb3b;animation:fmb 1s infinite alternate}' +
    '@keyframes fmb{from{transform:translateY(0)}to{transform:translateY(-4px)}}' +
    '.fm-bar{position:absolute;left:6px;right:6px;bottom:4px;height:5px;background:rgba(0,0,0,.4);border-radius:3px;overflow:hidden}' +
    '.fm-bar i{display:block;height:100%;background:#8bc34a}' +
    '.fm-s{flex:1;min-width:92px;padding:8px 4px;border-radius:10px;border:2px solid #c8e6c9;background:#f1f8e9;text-align:center;font-size:11px;cursor:pointer;font-weight:600}' +
    '.fm-s.on{border-color:#2e7d32;background:#c8e6c9}.fm-s.off{opacity:.45}';
  document.head.appendChild(st8);

  const kad = document.createElement('div');
  kad.className = 'card';
  kad.innerHTML =
    '<div class="card-title">🌾 Ladang Impian</div>' +
    '<div id="fm-stat" style="display:flex;justify-content:space-between;background:#e8f5e9;border:2px solid #4caf50;border-radius:10px;padding:10px 14px;font-weight:700;font-size:14px;color:#2e7d32"></div>' +
    '<div style="height:8px;background:#e0e0e0;border-radius:4px;margin-top:8px;overflow:hidden"><div id="fm-xp" style="height:100%;background:#fbc02d;width:0"></div></div>' +
    '<div id="fm-grid"></div>' +
    '<div id="fm-seeds" style="display:flex;gap:6px;flex-wrap:wrap"></div>' +
    '<div class="btn-group">' +
      '<button class="btn btn-green" id="fm-tuai">🧺 Tuai Semua</button>' +
      '<button class="btn btn-yellow" id="fm-baja">✨ Mod Baja: OFF</button>' +
    '</div>' +
    '<p id="fm-msg" style="font-size:12px;text-align:center;font-weight:700;color:#2e7d32;margin-top:10px;min-height:18px"></p>' +
    '<p style="font-size:11px;color:#999;text-align:center">Tanaman terus membesar walaupun app ditutup. Kemajuan disimpan dalam telefon ini.</p>';
  lama.after(kad);

  function msg(t) { mesej = t; const e = $('fm-msg'); if (e) e.innerText = t; }

  function naikLevel() {
    while (st.xp >= perluXp()) { st.xp -= perluXp(); st.level++; msg('🎉 Level ' + st.level + '! Benih baharu mungkin dibuka.'); }
  }

  function tuai(i, senyap) {
    const p = st.plots[i]; if (!p) return 0;
    const C = CROPS[p.seed];
    st.coins += C.sell; st.xp += C.xp; st.plots[i] = null;
    if (!senyap) { msg('+' + C.sell + ' coin, +' + C.xp + ' XP'); naikLevel(); simpan(); render(); }
    return C.sell;
  }

  function tekan(i) {
    muat();
    const now = Date.now();
    if (i > st.open) return msg('Buka petak sebelumnya dahulu.');
    if (i === st.open) {
      const k = kosPetak(i);
      if (st.open >= MAX) return;
      if (st.coins < k) return msg('Perlukan ' + k + ' coin untuk buka petak ini.');
      st.coins -= k; st.open++; simpan(); msg('Petak baharu dibuka!'); return render();
    }
    const p = st.plots[i];
    if (!p) {
      const C = CROPS[pilih];
      if (st.level < C.lv) return msg(C.n + ' dibuka pada Level ' + C.lv + '.');
      if (st.coins < C.cost) return msg('Coin tidak cukup (' + C.cost + ').');
      st.coins -= C.cost; st.plots[i] = { seed: pilih, t: now, f: false };
      simpan(); return render();
    }
    const C = CROPS[p.seed], dur = C.time * 1000, left = p.t + dur - now;
    if (left <= 0) return tuai(i);
    if (modBaja) {
      if (p.f) return msg('Tanaman ini sudah dibaja.');
      if (st.coins < BAJA) return msg('Coin tidak cukup untuk baja (' + BAJA + ').');
      st.coins -= BAJA; p.f = true; p.t -= left / 2;
      simpan(); msg('Baja ditabur! Masa dijimatkan separuh.'); return render();
    }
    msg(C.i + ' ' + C.n + ': ' + masa(left / 1000) + ' lagi');
  }

  function render() {
    muat();
    const now = Date.now();
    $('fm-stat').innerHTML = '<span>🪙 ' + Math.floor(st.coins).toLocaleString() + '</span><span>⭐ Level ' + st.level + '</span><span>XP ' + st.xp + '/' + perluXp() + '</span>';
    $('fm-xp').style.width = Math.min(100, st.xp / perluXp() * 100) + '%';
    let h = '';
    for (let i = 0; i < MAX; i++) {
      if (i > st.open) { h += '<div class="fm-p lock" data-i="' + i + '">🔒</div>'; continue; }
      if (i === st.open) { h += '<div class="fm-p lock" data-i="' + i + '">🔒<small>' + kosPetak(i) + '🪙</small></div>'; continue; }
      const p = st.plots[i];
      if (!p) { h += '<div class="fm-p" data-i="' + i + '"><span style="opacity:.25">＋</span></div>'; continue; }
      const C = CROPS[p.seed], dur = C.time * 1000, left = p.t + dur - now;
      if (left <= 0) { h += '<div class="fm-p ready" data-i="' + i + '">' + C.i + '<small>TUAI</small></div>'; continue; }
      const pct = 100 - left / dur * 100;
      const ic = pct < 34 ? '🌱' : (pct < 67 ? '🌿' : '🪴');
      h += '<div class="fm-p" data-i="' + i + '">' + (p.f ? '✨' : '') + ic + '<small>' + masa(left / 1000) + '</small><div class="fm-bar"><i style="width:' + pct + '%"></i></div></div>';
    }
    $('fm-grid').innerHTML = h;
    $('fm-seeds').innerHTML = Object.keys(CROPS).map(k => {
      const C = CROPS[k], kunciLv = st.level < C.lv;
      return '<div class="fm-s ' + (pilih === k ? 'on ' : '') + (kunciLv ? 'off' : '') + '" data-k="' + k + '">' + C.i + ' ' + C.n + '<br>' +
        (kunciLv ? '🔒 Lv ' + C.lv : C.cost + '🪙 → ' + C.sell + '🪙') + '<br>' + masa(C.time) + '</div>';
    }).join('');
    $('fm-msg').innerText = mesej;
  }

  $('fm-grid').addEventListener('click', e => { const el = e.target.closest('.fm-p'); if (el) tekan(parseInt(el.dataset.i)); });
  $('fm-seeds').addEventListener('click', e => {
    const el = e.target.closest('.fm-s'); if (!el) return;
    muat(); const C = CROPS[el.dataset.k];
    if (st.level < C.lv) return msg(C.n + ' dibuka pada Level ' + C.lv + '.');
    pilih = el.dataset.k; modBaja = false; $('fm-baja').innerText = '✨ Mod Baja: OFF'; render();
  });
  $('fm-baja').onclick = () => { modBaja = !modBaja; $('fm-baja').innerText = '✨ Mod Baja: ' + (modBaja ? 'ON (tekan tanaman)' : 'OFF'); };
  $('fm-tuai').onclick = () => {
    muat(); const now = Date.now(); let n = 0, jum = 0;
    st.plots.forEach((p, i) => { if (p && p.t + CROPS[p.seed].time * 1000 <= now) { jum += tuai(i, true); n++; } });
    if (!n) return msg('Belum ada tanaman yang sedia.');
    naikLevel(); simpan(); msg('Tuai ' + n + ' petak: +' + jum + ' coin'); render();
  };

  /* ---------- Sambung ke app ---------- */
  window.renderGame = render;
  const asalTugas = window.selesaiTugasan;
  if (typeof asalTugas === 'function') {
    window.selesaiTugasan = function (id) {
      const sudah = localStorage.getItem(id) === new Date().toDateString();
      const r = asalTugas.apply(this, arguments);
      if (!sudah) { muat(); st.coins += 500; simpan(); render(); }
      return r;
    };
  }
  setInterval(() => {
    const pg = $('page-catatan');
    if (pg && pg.classList.contains('active')) render();
  }, 1000);
  render();
});
