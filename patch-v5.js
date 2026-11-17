/* NZ Rich - patch v5: Jadual Baja, banner amaran, kalendar iPhone */
window.addEventListener('load', function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const fmt = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const baca = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const hariIni = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const beza = s => Math.round((baca(s) - hariIni()) / 864e5);
  const cantik = s => baca(s).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' });
  const tambah = (s, unit, n) => {
    const d = baca(s); n = Math.max(1, parseInt(n) || 1);
    if (unit === 'hari') d.setDate(d.getDate() + n);
    else if (unit === 'minggu') d.setDate(d.getDate() + 7 * n);
    else d.setMonth(d.getMonth() + n);
    return fmt(d);
  };
  const toast = (m, t) => { if (typeof showToast === 'function') showToast(m, t); };
  const sedia = () => typeof currentUser !== 'undefined' && currentUser;
  const ref = () => db.collection('ladang_nz').doc('data_utama');

  const TANAMAN = ['Nenas Yankee', 'Betik', 'Cili Bara', 'Limau Kasturi', 'Keledek', 'Ubi Kayu', 'Serai'];
  const BAJA = ['Baja 15-15-15', 'Baja 12-12-17+TE', 'Baja AB', 'Baja Organik', 'Baja Daun', 'Lain-lain'];
  const namaBaja = i => i.baja === 'Lain-lain' ? (i.bajaLain || 'Lain-lain') : i.baja;

  let data = [], editId = null;

  /* ---------- Simpan / muat (guna dokumen sedia ada, tanpa onSnapshot) ---------- */
  async function muat() {
    if (!sedia()) return;
    try {
      const s = await ref().get();
      data = (s.exists && s.data().dataBaja) || [];
      papar();
    } catch (e) { console.error(e); }
  }
  async function ubah(fn) {
    if (!sedia()) return;
    try {
      const s = await ref().get();
      data = (s.exists && s.data().dataBaja) || [];
      fn(data);
      await ref().set({ dataBaja: data }, { merge: true });
      papar();
    } catch (e) { console.error(e); toast('Gagal simpan jadual baja: ' + e.message, 'error'); }
  }

  /* ---------- Halaman Jadual Baja ---------- */
  const page = document.createElement('div');
  page.id = 'page-baja'; page.className = 'page';
  page.innerHTML =
    '<div class="card">' +
      '<div class="card-title" id="bj-tajuk">🌿 Tetapkan Jadual Baja</div>' +
      '<div class="form-group"><label>Tanaman</label><select id="bj-tanaman" class="form-control">' +
        TANAMAN.map(t => '<option>' + t + '</option>').join('') + '</select></div>' +
      '<div class="form-group"><label>Tarikh Baja</label><input type="date" id="bj-tarikh" class="form-control"></div>' +
      '<div class="form-group"><label>Jenis Baja</label><select id="bj-baja" class="form-control">' +
        BAJA.map(t => '<option>' + t + '</option>').join('') + '</select></div>' +
      '<div class="form-group" id="bj-lain-box" style="display:none"><label>Nama Baja (Lain-lain)</label><input type="text" id="bj-lain" class="form-control" placeholder="Cth: Baja urea"></div>' +
      '<div class="row">' +
        '<div class="form-group"><label>Ulang</label><select id="bj-ulang" class="form-control">' +
          '<option value="sekali">Sekali sahaja</option><option value="hari">Setiap N hari</option>' +
          '<option value="minggu">Setiap N minggu</option><option value="bulan">Setiap N bulan</option></select></div>' +
        '<div class="form-group" id="bj-selang-box" style="display:none"><label>Selang (N)</label><input type="number" id="bj-selang" class="form-control" value="1" min="1"></div>' +
      '</div>' +
      '<div class="form-group"><label>Nota</label><input type="text" id="bj-nota" class="form-control" placeholder="Cth: Plot A, 5 beg"></div>' +
      '<div class="btn-group">' +
        '<button class="btn btn-green" id="bj-simpan" onclick="bajaSimpan()">💾 Simpan Jadual</button>' +
        '<button class="btn btn-yellow" id="bj-batal" style="display:none" onclick="bajaReset()">Batal Edit</button>' +
      '</div>' +
    '</div>' +
    '<div class="card"><div class="card-title">📋 Jadual Baja Aktif</div><div id="bj-senarai"></div></div>' +
    '<div class="card"><div class="card-title" style="font-size:15px">✔️ Sudah Selesai</div><div id="bj-selesai"></div></div>';
  document.querySelector('.container').appendChild(page);

  const tli = [...document.querySelectorAll('.sidebar-menu li')].find(l => (l.getAttribute('onclick') || '').includes("'tugasan'"));
  const li = document.createElement('li');
  li.setAttribute('onclick', "showPage('baja', this)");
  li.innerHTML = '🌿 Jadual Baja';
  if (tli) tli.after(li); else document.querySelector('.sidebar-menu').appendChild(li);

  $('bj-baja').onchange = () => { $('bj-lain-box').style.display = $('bj-baja').value === 'Lain-lain' ? 'block' : 'none'; };
  $('bj-ulang').onchange = () => { $('bj-selang-box').style.display = $('bj-ulang').value === 'sekali' ? 'none' : 'block'; };

  /* ---------- Banner (Utama) & senarai (Tugasan Harian) ---------- */
  const ban = document.createElement('div');
  ban.id = 'banner-baja'; ban.className = 'card'; ban.style.cssText = 'display:none;border-left:5px solid #f57c00';
  $('page-utama').prepend(ban);
  const tg = document.createElement('div');
  tg.id = 'baja-tugasan'; tg.className = 'card'; tg.style.cssText = 'display:none;border-left:5px solid #f57c00';
  $('page-tugasan').prepend(tg);

  function status(i) {
    const b = beza(i.tarikh);
    if (b < 0) return { t: 'Tertinggal ' + (-b) + ' hari', c: '#d32f2f' };
    if (b === 0) return { t: 'HARI INI', c: '#f57c00' };
    return { t: b + ' hari lagi', c: b <= 7 ? '#f57c00' : '#388e3c' };
  }
  function ulangTeks(i) {
    if (!i.ulang || i.ulang === 'sekali') return 'Sekali sahaja';
    return 'Setiap ' + (i.selang || 1) + ' ' + i.ulang;
  }
  function baris(i, ringkas) {
    const s = status(i);
    return '<div class="list-item" style="border-left-color:' + s.c + ';margin-bottom:8px;padding:12px">' +
      '<h4 style="font-size:14px">🌿 ' + esc(i.tanaman) + ' <span class="badge" style="background:' + s.c + '20;color:' + s.c + '">' + s.t + '</span></h4>' +
      '<p style="font-size:12px">Baja: <b>' + esc(namaBaja(i)) + '</b> | ' + cantik(i.tarikh) + '</p>' +
      (ringkas ? '' : '<p style="font-size:12px">' + ulangTeks(i) + (i.nota ? ' | ' + esc(i.nota) : '') + '</p>') +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">' +
        '<button class="btn btn-green" style="padding:6px 10px;font-size:12px;flex:none" onclick="bajaSiap(\'' + i.id + '\')">✅ Siap</button>' +
        '<button class="btn btn-blue" style="padding:6px 10px;font-size:12px;flex:none" onclick="bajaIcs(\'' + i.id + '\')">📅 Kalendar</button>' +
        (ringkas ? '' :
          '<button class="btn btn-orange" style="padding:6px 10px;font-size:12px;flex:none" onclick="bajaEdit(\'' + i.id + '\')">✏️ Edit</button>' +
          '<button class="btn btn-red" style="padding:6px 10px;font-size:12px;flex:none" onclick="bajaPadam(\'' + i.id + '\')">❌</button>') +
      '</div></div>';
  }

  function papar() {
    const aktif = data.filter(x => !x.selesai).sort((a, b) => a.tarikh < b.tarikh ? -1 : 1);
    const siap = data.filter(x => x.selesai).sort((a, b) => a.tarikh < b.tarikh ? 1 : -1);
    $('bj-senarai').innerHTML = aktif.length ? aktif.map(i => baris(i, false)).join('') : '<p style="text-align:center;color:#999;font-size:14px">Tiada jadual baja. Tetapkan di atas.</p>';
    $('bj-selesai').innerHTML = siap.length ? siap.map(i =>
      '<div class="list-item" style="margin-bottom:6px;padding:10px"><p style="font-size:12px">' + esc(i.tanaman) + ' - ' + esc(namaBaja(i)) + ' (' + cantik(i.tarikh) + ')</p>' +
      '<button onclick="bajaPadam(\'' + i.id + '\')" style="color:red;border:none;background:none;font-size:11px;cursor:pointer">❌ Padam</button></div>').join('') :
      '<p style="text-align:center;color:#999;font-size:13px">Belum ada.</p>';

    const due = aktif.filter(i => beza(i.tarikh) <= 7);
    const html = due.map(i => baris(i, true)).join('');
    ban.style.display = due.length ? 'block' : 'none';
    ban.innerHTML = '<div class="card-title" style="margin-bottom:8px">⚠️ Baja Hampir Tiba (' + due.length + ')</div>' + html +
      '<button class="btn btn-yellow" style="margin-top:6px" onclick="showPage(\'baja\')">🌿 Lihat Jadual Baja</button>';
    tg.style.display = due.length ? 'block' : 'none';
    tg.innerHTML = '<div class="card-title" style="margin-bottom:8px">🌿 Tugasan Baja (7 Hari)</div>' + html;
  }

  /* ---------- Tindakan ---------- */
  window.bajaReset = function () {
    editId = null;
    $('bj-tajuk').innerText = '🌿 Tetapkan Jadual Baja';
    $('bj-simpan').innerText = '💾 Simpan Jadual';
    $('bj-batal').style.display = 'none';
    $('bj-tarikh').value = fmt(new Date());
    $('bj-lain').value = ''; $('bj-nota').value = '';
    $('bj-baja').value = BAJA[0]; $('bj-ulang').value = 'sekali'; $('bj-selang').value = '1';
    $('bj-baja').onchange(); $('bj-ulang').onchange();
  };

  window.bajaSimpan = async function () {
    const tarikh = $('bj-tarikh').value, baja = $('bj-baja').value, lain = $('bj-lain').value.trim();
    if (!tarikh) return toast('Sila pilih tarikh baja.', 'error');
    if (baja === 'Lain-lain' && !lain) return toast('Sila taip nama baja.', 'error');
    const rekod = {
      tanaman: $('bj-tanaman').value, tarikh, baja, bajaLain: lain,
      ulang: $('bj-ulang').value, selang: Math.max(1, parseInt($('bj-selang').value) || 1),
      nota: $('bj-nota').value.trim()
    };
    const id = editId;
    await ubah(arr => {
      if (id) { const i = arr.find(x => x.id === id); if (i) Object.assign(i, rekod, { selesai: false }); }
      else arr.push(Object.assign({ id: Date.now().toString(), selesai: false, sejarah: [] }, rekod));
    });
    toast(id ? 'Jadual baja dikemaskini!' : 'Jadual baja disimpan!');
    bajaReset();
  };

  window.bajaEdit = function (id) {
    const i = data.find(x => x.id === id); if (!i) return;
    editId = id;
    $('bj-tajuk').innerText = '✏️ Edit Jadual Baja';
    $('bj-simpan').innerText = '💾 Simpan Perubahan';
    $('bj-batal').style.display = 'flex';
    $('bj-tanaman').value = i.tanaman; $('bj-tarikh').value = i.tarikh;
    $('bj-baja').value = i.baja; $('bj-lain').value = i.bajaLain || '';
    $('bj-ulang').value = i.ulang || 'sekali'; $('bj-selang').value = i.selang || 1; $('bj-nota').value = i.nota || '';
    $('bj-baja').onchange(); $('bj-ulang').onchange();
    window.scrollTo(0, 0);
  };

  window.bajaSiap = async function (id) {
    await ubah(arr => {
      const i = arr.find(x => x.id === id); if (!i) return;
      (i.sejarah = i.sejarah || []).push(i.tarikh);
      if (i.ulang && i.ulang !== 'sekali') {
        let n = tambah(i.tarikh, i.ulang, i.selang);
        while (beza(n) < 0) n = tambah(n, i.ulang, i.selang);
        i.tarikh = n;
      } else i.selesai = true;
    });
    toast('Baja ditanda siap.');
  };

  window.bajaPadam = async function (id) {
    if (!confirm('Padam jadual baja ini?')) return;
    await ubah(arr => { const k = arr.findIndex(x => x.id === id); if (k > -1) arr.splice(k, 1); });
  };

  window.bajaIcs = function (id) {
    const i = data.find(x => x.id === id); if (!i) return;
    const t = baca(i.tarikh), e = new Date(t); e.setDate(e.getDate() + 1);
    const d8 = d => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
    const ic = s => String(s).replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n');
    const judul = 'Baja ' + i.tanaman + ' (' + namaBaja(i) + ')';
    let rr = '';
    if (i.ulang && i.ulang !== 'sekali') {
      const n = Math.max(1, parseInt(i.selang) || 1);
      rr = i.ulang === 'bulan' ? 'RRULE:FREQ=MONTHLY;INTERVAL=' + n : 'RRULE:FREQ=DAILY;INTERVAL=' + (i.ulang === 'minggu' ? 7 * n : n);
    }
    const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NZ Rich//Baja//MS', 'BEGIN:VEVENT',
      'UID:' + i.id + '@nzrich', 'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE:' + d8(t), 'DTEND;VALUE=DATE:' + d8(e),
      'SUMMARY:' + ic(judul), 'DESCRIPTION:' + ic(i.nota || 'Jadual baja NZ Rich'), rr,
      'BEGIN:VALARM', 'TRIGGER:-P6DT16H', 'ACTION:DISPLAY', 'DESCRIPTION:' + ic('Seminggu lagi: ' + judul), 'END:VALARM',
      'BEGIN:VALARM', 'TRIGGER:PT8H', 'ACTION:DISPLAY', 'DESCRIPTION:' + ic('Hari ini: ' + judul), 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'].filter(Boolean);
    const blob = new Blob([L.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'Baja-' + i.tanaman.replace(/\s+/g, '-') + '.ics';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    toast('Buka fail itu dan tekan Add All untuk masuk Kalendar.');
  };

  /* ---------- Sambung ke showPage ---------- */
  if (typeof window.showPage === 'function') {
    const sp = window.showPage;
    window.showPage = function (id) {
      const r = sp.apply(this, arguments);
      if (id === 'baja') { $('page-title').innerText = 'Jadual Baja'; }
      if (id === 'baja' || id === 'utama' || id === 'tugasan') muat();
      return r;
    };
  }

  bajaReset();
  const tunggu = setInterval(() => { if (sedia()) { clearInterval(tunggu); muat(); } }, 500);
});
