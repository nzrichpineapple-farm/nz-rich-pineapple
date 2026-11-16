/* NZ Rich - Flora Theme + Check-In Rehat/Auto Check-Out */
window.addEventListener('load', function () {
  const BUKA = 7, TUTUP = 18; // sistem on 07:00, auto check-out 18:00
  const $ = id => document.getElementById(id);

  /* ========== 1. TEMA FLORA (SVG) ========== */
  const nenas = (x, y, s, r) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0-34C-8-22-16-26-14-40C-8-34-4-44 0-58C4-44 8-34 14-40C16-26 8-22 0-34Z" fill="#43a047"/><path d="M-6-34C-18-30-24-38-26-46C-16-44-10-40-6-34ZM6-34C18-30 24-38 26-46C16-44 10-40 6-34Z" fill="#2e7d32"/><ellipse rx="22" ry="32" fill="#fbc02d"/><path d="M-14-16L14 16M-18 0L6 28M-6-26L18 2M14-16L-14 16M18 0L-6 28M6-26L-18 2" stroke="#f57f17" stroke-width="1.5" fill="none"/></g>`;
  const daun = (x, y, s, r, c) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0 0C12-24 36-30 58-24C48 0 24 14 0 0Z" fill="${c}"/><path d="M0 0Q30-10 54-22" stroke="#fff" stroke-opacity=".5" fill="none"/></g>`;
  const bunga = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">${[0, 72, 144, 216, 288].map(a => `<ellipse cy="-9" rx="5" ry="9" fill="#fff59d" transform="rotate(${a})"/>`).join('')}<circle r="4" fill="#fbc02d"/></g>`;
  const svg = (w, h, inner, op) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><g opacity="${op}">${inner}</g></svg>`;
  const uri = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;

  const tileInner = nenas(70, 90, .9, -12) + nenas(215, 215, .75, 14) +
    daun(150, 40, .9, -30, '#66bb6a') + daun(250, 100, .8, 40, '#81c784') +
    daun(30, 230, .9, -50, '#66bb6a') + daun(150, 170, .7, 100, '#a5d6a7') +
    bunga(210, 60, 1) + bunga(100, 230, .9) + bunga(20, 150, .8) + bunga(270, 170, .8);
  const tileApp = uri(svg(300, 300, tileInner, .2));
  const tileInv = uri(svg(300, 300, tileInner, .06));

  const cornerBL = uri(svg(220, 200, nenas(60, 120, .9, -10) + daun(100, 175, 1.2, -20, '#66bb6a') + daun(20, 185, 1, -70, '#81c784') + daun(110, 115, 1, -60, '#a5d6a7') + bunga(155, 170, 1), .16));
  const cornerBR = uri(svg(220, 200, nenas(160, 120, .9, 10) + daun(120, 175, 1.2, -160, '#66bb6a') + daun(200, 185, 1, -110, '#81c784') + daun(110, 120, 1, -120, '#a5d6a7') + bunga(60, 170, 1), .16));
  let vineInner = '<path d="M0 11Q100 4 200 11T400 11" stroke="#43a047" fill="none"/>';
  for (let i = 0; i < 10; i++) vineInner += daun(20 + i * 40, 11, .35, i % 2 ? -25 : 25, '#43a047');
  const vine = uri(svg(400, 22, vineInner, .3));

  // SUNTIK TEMA TERUS KE BODY
  const st = document.createElement('style');
  st.textContent = `
  @media screen {
    body { background-color:#f4f8f4 !important; background-image:${tileApp} !important; background-size:300px !important; background-attachment:fixed !important; }
    #auth-screen { background-image:${tileApp} !important; background-size:300px !important; }
    .card { background:rgba(255,255,255,.94) !important; }
  }
  .invoice-preview {
    background-color:#fff;
    background-image:${vine},${cornerBL},${cornerBR},${tileInv};
    background-repeat:repeat-x,no-repeat,no-repeat,repeat;
    background-position:0 0,left bottom,right bottom,0 0;
    background-size:400px 22px,200px auto,200px auto,300px;
    -webkit-print-color-adjust:exact; print-color-adjust:exact;
  }
  @media print { .invoice-preview { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  .btn-checkin:disabled { opacity:.5; cursor:not-allowed; }
  `;
  document.head.appendChild(st);

  /* ========== 2. CHECK-IN: REHAT + AUTO CHECK-OUT ========== */
  const pad = n => String(n).padStart(2, '0');
  const fmtMs = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60); };
  const rehatMs = (k, hingga) => (k.rehat || []).reduce((t, r) => t + ((r.tamat || hingga) - r.mula), 0);
  const sedangRehat = k => { const r = k.rehat || []; return r.length > 0 && r[r.length - 1].tamat === null; };
  const cutoff = k => { const d = new Date(k.timestampMasuk); d.setHours(TUTUP, 0, 0, 0); return d.getTime(); };
  const cariAktif = () => (typeof currentUser !== 'undefined' && currentUser) ? dataKehadiran.find(k => k.email === currentUser.email && k.masaKeluar === null && !k.statusManual) : null;

  function tutupShift(k, ts, auto) {
    if (sedangRehat(k)) k.rehat[k.rehat.length - 1].tamat = ts;
    k.timestampKeluar = ts;
    k.masaKeluar = new Date(ts).toLocaleTimeString('en-GB');
    k.jumlahJam = Math.max(0, (ts - k.timestampMasuk - rehatMs(k, ts)) / 36e5); // rehat ditolak
    if (auto) k.autoCheckout = true;
  }

  function semakAutoCheckout() {
    if (typeof dataKehadiran === 'undefined') return false;
    const now = Date.now(); let ubah = false;
    dataKehadiran.forEach(k => {
      if (!k.statusManual && k.masaKeluar === null && now >= cutoff(k)) { tutupShift(k, cutoff(k), true); ubah = true; }
    });
    if (ubah && typeof simpanSemuaKeCloud === 'function') simpanSemuaKeCloud();
    return ubah;
  }

  // Butang Rehat + kotak info
  const btnRehat = document.createElement('button');
  btnRehat.id = 'btn-rehat'; btnRehat.style.display = 'none'; btnRehat.style.margin = '0 auto 10px';
  btnRehat.onclick = togolRehat;
  
  // SEMAKAN KESELAMATAN: Pastikan butang checkout wujud dulu baru letak butang rehat
  const btnCheckout = $('btn-checkout');
  if (btnCheckout) {
    btnCheckout.before(btnRehat);
    btnCheckout.style.margin = '0 auto';
  }
  
  const info = document.createElement('div');
  info.id = 'kh-info'; info.style.cssText = 'font-size:12px;color:#666;margin:-10px 0 15px;line-height:1.5';
  const masaSemasa = $('masa-semasa');
  if (masaSemasa) masaSemasa.after(info);

  function kemasBox() {
    if (typeof currentUser === 'undefined' || !currentUser) return;
    const k = cariAktif(), now = Date.now(), h = new Date().getHours();
    const dibuka = h >= BUKA && h < TUTUP;
    const box = $('box-kehadiran'), tx = $('teks-status'), jam = $('masa-semasa');
    const bIn = $('btn-checkin'), bOut = $('btn-checkout');
    
    if (!box || !tx || !jam || !bIn || !bOut) return; // Elak crash kalau page tak lengkap

    if (k) {
      const rehat = sedangRehat(k);
      bIn.style.display = 'none'; bOut.style.display = 'flex'; btnRehat.style.display = 'flex';
      btnRehat.innerHTML = rehat ? '▶️ Sambung Kerja' : '☕ Mula Rehat';
      btnRehat.className = 'btn btn-checkin ' + (rehat ? 'btn-green' : 'btn-orange');
      tx.innerText = rehat ? '☕ Anda Sedang Rehat (Masa Dijeda)' : 'Anda Sedang Bekerja';
      tx.style.color = rehat ? '#f57c00' : 'var(--primary-green)';
      box.style.backgroundColor = rehat ? '#fff3e0' : '#e8f5e9';
      box.style.borderColor = rehat ? '#f57c00' : '#4caf50';
      jam.innerText = fmtMs(now - k.timestampMasuk - rehatMs(k, now));
      info.innerHTML = `Masuk: <b>${k.masaMasuk}</b> | Rehat: <b>${Math.floor(rehatMs(k, now) / 60000)} minit</b><br>Auto check-out jam ${TUTUP}:00`;
    } else {
      btnRehat.style.display = 'none'; bOut.style.display = 'none';
      bIn.style.display = 'flex'; bIn.disabled = !dibuka;
      tx.innerText = dibuka ? 'Anda Belum Check-In' : 'Sistem Check-In Ditutup';
      tx.style.color = '#666';
      box.style.backgroundColor = '#fafafa'; box.style.borderColor = '#ccc';
      jam.innerText = new Date().toLocaleTimeString('en-GB');
      info.innerHTML = dibuka ? `Check-in dibuka ${pad(BUKA)}:00 – ${TUTUP}:00` : `Check-in dibuka semula jam ${pad(BUKA)}:00 pagi`;
    }
  }

  function togolRehat() {
    const k = cariAktif(); if (!k) return;
    if (sedangRehat(k)) { k.rehat[k.rehat.length - 1].tamat = Date.now(); if(typeof showToast === 'function') showToast('Sambung kerja. Selamat bekerja!'); }
    else { (k.rehat = k.rehat || []).push({ mula: Date.now(), tamat: null }); if(typeof showToast === 'function') showToast('Rehat bermula. Masa kerja dijeda.'); }
    if(typeof simpanSemuaKeCloud === 'function') simpanSemuaKeCloud(); 
    if(typeof paparKehadiran === 'function') paparKehadiran();
  }

  window.prosesCheckIn = function () {
    if (typeof currentUser === 'undefined' || !currentUser) return;
    const now = new Date(), h = now.getHours();
    if (h < BUKA || h >= TUTUP) return typeof showToast === 'function' ? showToast(`Check-in dibuka jam ${pad(BUKA)}:00 hingga ${TUTUP}:00 sahaja.`, 'error') : alert(`Check-in dibuka jam ${pad(BUKA)}:00 hingga ${TUTUP}:00 sahaja.`);
    
    dataKehadiran.push({
      id: Date.now().toString(), email: currentUser.email,
      tarikh: now.toLocaleDateString('ms-MY'), masaMasuk: now.toLocaleTimeString('en-GB'),
      masaKeluar: null, jumlahJam: null, timestampMasuk: now.getTime(), timestampKeluar: null,
      isGajiDibuat: false, rehat: []
    });
    if(typeof simpanSemuaKeCloud === 'function') simpanSemuaKeCloud(); 
    if(typeof paparKehadiran === 'function') paparKehadiran();
    if(typeof showToast === 'function') showToast('Check-in berjaya! Selamat bekerja.');
  };

  window.prosesCheckOut = function () {
    const k = cariAktif(); if (!k) return;
    tutupShift(k, Date.now(), false);
    if(typeof simpanSemuaKeCloud === 'function') simpanSemuaKeCloud(); 
    if(typeof paparKehadiran === 'function') paparKehadiran();
    if(typeof showToast === 'function') showToast(`Check-out berjaya! Kerja bersih ${k.jumlahJam.toFixed(2)} jam (rehat ditolak).`);
  };

  window.paparKehadiran = function () {
    if (typeof currentUser === 'undefined' || !currentUser) return;
    semakAutoCheckout();
    kemasBox();
    const c = $('kandungan-kehadiran');
    if (!c) return;
    
    const s = [...dataKehadiran].sort((a, b) => b.timestampMasuk - a.timestampMasuk);
    if (!s.length) { c.innerHTML = '<p style="text-align:center; color:#999;">Tiada sejarah kehadiran.</p>'; return; }
    c.innerHTML = s.map(it => {
      const nama = it.namaPekerja || it.email.split('@')[0].toUpperCase();
      let col, tot, body;
      if (it.statusManual) {
        col = it.statusManual === 'Tidak Hadir' ? '#d32f2f' : '#f57c00'; tot = it.statusManual;
        body = `<p>Sebab: ${it.sebab}</p><button onclick="padamRekodManual('${it.id}')" style="color:red; border:none; background:none; font-size:11px; margin-top:8px; cursor:pointer;">❌ Padam Rekod</button>`;
      } else {
        col = it.masaKeluar ? '#388e3c' : '#f57c00';
        tot = it.jumlahJam ? it.jumlahJam.toFixed(2) + ' Jam' : '-';
        const rm = Math.round(rehatMs(it, it.timestampKeluar || Date.now()) / 60000);
        const keluar = it.masaKeluar ? 'Keluar: ' + it.masaKeluar + (it.autoCheckout ? ' (auto 18:00)' : '') : (sedangRehat(it) ? 'Sedang Rehat...' : 'Sedang Bekerja...');
        body = `<p>Masuk: <b>${it.masaMasuk}</b> | ${keluar}</p><p style="font-size:12px;">Rehat: ${rm} minit</p>`;
      }
      return `<div class="list-item" style="border-left-color:${col};"><h4><span style="color:var(--primary-green);">${nama}</span> <span class="badge" style="background:${col}20; color:${col};">${tot}</span></h4><p style="font-size:12px; margin-bottom:5px;">Tarikh: <b>${it.tarikh}</b></p>${body}</div>`;
    }).join('');
  };

  // Semak setiap saat: auto check-out + kemas kini timer
  setInterval(() => {
    if (typeof currentUser === 'undefined' || !currentUser) return;
    if (semakAutoCheckout()) { if(typeof paparKehadiran === 'function') paparKehadiran(); return; }
    const pg = $('page-kehadiran');
    if (pg && pg.classList.contains('active')) kemasBox();
  }, 1000);
});
