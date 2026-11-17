/* NZ Rich - Statement 3 bulan + Bonus tahunan Shopee */
window.addEventListener('load', function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = (m, t) => { if (typeof showToast === 'function') showToast(m, t); };
  const rm = n => 'RM ' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const BULAN = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
  const kunciBulan = (y, m) => y * 12 + m;
  const labelBulan = k => BULAN[k % 12] + ' ' + Math.floor(k / 12);

  let aktif = 0, tahun = new Date().getFullYear(), peringkat = '', sedang = false;

  /* ---------- Data ---------- */
  const senarai = () => (typeof dataRekod !== 'undefined' && Array.isArray(dataRekod)) ? dataRekod : [];
  function tarikhRekod(r) {
    const p = String(r.tarikh || '').split(/\D+/).filter(Boolean).map(Number);
    if (p.length < 3) return null;
    let d, m, y;
    if (p[0] > 31) { y = p[0]; m = p[1]; d = p[2]; } else { d = p[0]; m = p[1]; y = p[2]; }
    if (y < 100) y += 2000;
    return new Date(y, m - 1, d);
  }
  const jum = r => parseFloat(String(r.jumlah).replace(/[^0-9.]/g, '')) || 0;
  const akaun = r => r.saluran === 'Shopee' ? 'Shopee' : ((!r.saluran || r.saluran === 'Kebun') ? 'Kebun' : 'Online');
  const dengan = () => senarai().map(r => ({ r, d: tarikhRekod(r) })).filter(x => x.d);

  function ringkas(list) {
    const o = { Kebun: { i: 0, o: 0 }, Online: { i: 0, o: 0 }, Shopee: { i: 0, o: 0 }, hutang: 0 };
    list.forEach(({ r }) => {
      const a = akaun(r), v = jum(r);
      if (r.jenis === 'IN') { if (r.status === 'Hutang') o.hutang += v; else o[a].i += v; }
      else o[a].o += v;
    });
    return o;
  }
  function tigaBulan() {
    const n = new Date(), k = kunciBulan(n.getFullYear(), n.getMonth());
    return [k, k - 1, k - 2];
  }

  /* ---------- HTML kandungan ---------- */
  const TD = 'padding:8px;border-bottom:1px solid #eee;';
  const TH = 'background:#2e7d32;color:#fff;padding:8px;text-align:left;';
  const kotakBaki = (t, v, w) => '<div style="flex:1;min-width:120px;background:' + w + ';border-radius:10px;padding:12px;color:#fff"><div style="font-size:11px">' + t + '</div><div style="font-size:18px;font-weight:700">' + rm(v) + '</div></div>';

  function htmlBulan(k) {
    const list = dengan().filter(x => kunciBulan(x.d.getFullYear(), x.d.getMonth()) === k && akaun(x.r) !== 'Shopee')
      .sort((a, b) => a.d - b.d);
    const o = ringkas(list);
    const jm = o.Kebun.i + o.Online.i, jk = o.Kebun.o + o.Online.o;
    let h = '<div style="font-size:16px;font-weight:700;color:#2e7d32;margin-bottom:10px">Statement ' + labelBulan(k) + '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">' +
        kotakBaki('Jumlah Masuk', jm, '#1976d2') + kotakBaki('Jumlah Keluar', jk, '#d32f2f') + kotakBaki('Baki Bulan', jm - jk, '#388e3c') +
      '</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:10px"><tr>' +
        '<th style="' + TH + '">Akaun</th><th style="' + TH + 'text-align:right">Masuk</th><th style="' + TH + 'text-align:right">Keluar</th><th style="' + TH + 'text-align:right">Baki</th></tr>' +
      ['Kebun', 'Online'].map(a => '<tr><td style="' + TD + '">' + a + '</td><td style="' + TD + 'text-align:right">' + rm(o[a].i) + '</td><td style="' + TD + 'text-align:right">' + rm(o[a].o) + '</td><td style="' + TD + 'text-align:right;font-weight:700">' + rm(o[a].i - o[a].o) + '</td></tr>').join('') +
      '</table>';
    if (o.hutang > 0) h += '<p style="font-size:12px;color:#d32f2f;font-weight:700;margin-bottom:10px">Hutang belum dibayar bulan ini: ' + rm(o.hutang) + ' (tidak dikira dalam Masuk)</p>';
    h += '<div style="font-size:13px;font-weight:700;margin:10px 0 6px">Senarai Transaksi (' + list.length + ')</div>';
    if (!list.length) return h + '<p style="text-align:center;color:#999;font-size:13px">Tiada transaksi bulan ini.</p>';
    h += '<table style="width:100%;border-collapse:collapse;font-size:11px"><tr>' +
      '<th style="' + TH + '">Tarikh</th><th style="' + TH + '">Butiran</th><th style="' + TH + '">Akaun</th><th style="' + TH + 'text-align:right">Masuk</th><th style="' + TH + 'text-align:right">Keluar</th></tr>';
    list.forEach(({ r, d }) => {
      const info = (r.kategori === 'Tanaman' ? r.tanaman : r.kategori) + (r.nota ? ' - ' + r.nota : '');
      const hut = r.status === 'Hutang';
      h += '<tr><td style="' + TD + '">' + pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '</td>' +
        '<td style="' + TD + '">' + esc(info) + (hut ? ' <b style="color:#d32f2f">(Hutang)</b>' : '') + '</td>' +
        '<td style="' + TD + '">' + akaun(r) + '</td>' +
        '<td style="' + TD + 'text-align:right;' + (hut ? 'color:#999;font-style:italic' : '') + '">' + (r.jenis === 'IN' ? rm(jum(r)) : '') + '</td>' +
        '<td style="' + TD + 'text-align:right">' + (r.jenis === 'OUT' ? rm(jum(r)) : '') + '</td></tr>';
    });
    return h + '</table>';
  }
  const pad2 = n => String(n).padStart(2, '0');

  function htmlShopee(y) {
    const list = dengan().filter(x => x.d.getFullYear() === y && akaun(x.r) === 'Shopee');
    let tm = 0, tk = 0, baris = '';
    for (let m = 0; m < 12; m++) {
      const o = ringkas(list.filter(x => x.d.getMonth() === m)).Shopee;
      tm += o.i; tk += o.o;
      baris += '<tr><td style="' + TD + '">' + BULAN[m] + '</td><td style="' + TD + 'text-align:right">' + rm(o.i) + '</td><td style="' + TD + 'text-align:right">' + rm(o.o) + '</td><td style="' + TD + 'text-align:right;font-weight:700">' + rm(o.i - o.o) + '</td></tr>';
    }
    return '<div style="font-size:16px;font-weight:700;color:#e65100;margin-bottom:10px">🛒 Bonus Tahunan Shopee ' + y + '</div>' +
      '<div style="background:#e65100;border-radius:12px;padding:16px;color:#fff;text-align:center;margin-bottom:12px"><div style="font-size:12px">Jumlah Terkumpul Setakat Ini</div><div style="font-size:26px;font-weight:700">' + rm(tm - tk) + '</div></div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:12px"><tr>' +
        '<th style="' + TH + '">Bulan</th><th style="' + TH + 'text-align:right">Masuk</th><th style="' + TH + 'text-align:right">Keluar</th><th style="' + TH + 'text-align:right">Baki</th></tr>' + baris +
        '<tr><td style="padding:8px;font-weight:700">JUMLAH</td><td style="padding:8px;text-align:right;font-weight:700">' + rm(tm) + '</td><td style="padding:8px;text-align:right;font-weight:700">' + rm(tk) + '</td><td style="padding:8px;text-align:right;font-weight:700;color:#e65100">' + rm(tm - tk) + '</td></tr></table>' +
      '<p style="font-size:11px;color:#666;margin-top:8px">Shopee dikumpul setahun sebagai bonus dan tidak dimasukkan dalam statement bulanan.</p>';
  }

  /* ---------- Halaman ---------- */
  const page = document.createElement('div');
  page.id = 'page-statement'; page.className = 'page';
  page.innerHTML =
    '<div class="card">' +
      '<div class="card-title">📑 Statement</div>' +
      '<div id="st-tab" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px"></div>' +
      '<div id="st-tahun" style="display:none;justify-content:center;gap:12px;align-items:center;margin-bottom:10px">' +
        '<button class="btn btn-yellow" style="flex:none;padding:6px 14px" id="st-prev">◀</button><b id="st-th"></b>' +
        '<button class="btn btn-yellow" style="flex:none;padding:6px 14px" id="st-next">▶</button></div>' +
      '<div id="st-isi" style="overflow-x:auto"></div>' +
      '<div class="btn-group"><button class="btn btn-blue" id="st-pdf">🖨️ Cetak PDF (3 Bulan + Bonus Shopee)</button></div>' +
    '</div>';
  document.querySelector('.container').appendChild(page);

  const liRekod = [...document.querySelectorAll('.sidebar-menu li')].find(l => (l.getAttribute('onclick') || '').includes("'rekod'"));
  const li = document.createElement('li');
  li.setAttribute('onclick', "showPage('statement', this)");
  li.innerHTML = '📑 Statement';
  if (liRekod) liRekod.after(li); else document.querySelector('.sidebar-menu').appendChild(li);

  const adaBos = () => !liRekod || liRekod.style.display !== 'none';
  setInterval(() => { li.style.display = adaBos() ? '' : 'none'; }, 1000);

  function papar() {
    const bln = tigaBulan();
    $('st-tab').innerHTML = bln.map((k, i) => '<button class="btn ' + (aktif === i ? 'btn-green' : 'btn-yellow') + '" style="flex:none;padding:8px 12px;font-size:12px" data-t="' + i + '">' + labelBulan(k) + '</button>').join('') +
      '<button class="btn ' + (aktif === 'shopee' ? 'btn-orange' : 'btn-yellow') + '" style="flex:none;padding:8px 12px;font-size:12px" data-t="shopee">🛒 Bonus Shopee</button>';
    $('st-tahun').style.display = aktif === 'shopee' ? 'flex' : 'none';
    $('st-th').innerText = tahun;
    $('st-isi').innerHTML = aktif === 'shopee' ? htmlShopee(tahun) : htmlBulan(bln[aktif]);
  }
  $('st-tab').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; aktif = b.dataset.t === 'shopee' ? 'shopee' : parseInt(b.dataset.t); papar(); });
  $('st-prev').onclick = () => { tahun--; papar(); };
  $('st-next').onclick = () => { tahun++; papar(); };

  if (typeof window.showPage === 'function') {
    const sp = window.showPage;
    window.showPage = function (id) {
      if (id === 'statement' && !adaBos()) return toast('Untuk Bos sahaja.', 'error');
      const r = sp.apply(this, arguments);
      if (id === 'statement') { $('page-title').innerText = 'Statement'; papar(); }
      return r;
    };
  }

  /* ---------- PDF ---------- */
  const muatSkrip = src => new Promise((ok, gagal) => {
    const sc = document.createElement('script');
    sc.src = src; sc.onload = ok; sc.onerror = () => gagal(new Error('Gagal muat ' + src));
    document.head.appendChild(sc);
  });
  async function lib() {
    if (!window.html2canvas) await muatSkrip('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    if (!(window.jspdf && window.jspdf.jsPDF)) await muatSkrip('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  }
  function tambahCanvas(pdf, canvas, pertama) {
    const pw = 190, ph = 277, sliceH = Math.floor(canvas.width * ph / pw);
    let y = 0;
    while (y < canvas.height) {
      const h = Math.min(sliceH, canvas.height - y);
      const c = document.createElement('canvas');
      c.width = canvas.width; c.height = h;
      c.getContext('2d').drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
      if (!pertama) pdf.addPage();
      pertama = false;
      pdf.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', 10, 10, pw, h * pw / canvas.width);
      y += h;
    }
    return pertama;
  }
  async function janaPdf() {
    peringkat = 'muat pustaka'; await lib();
    const pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    const tarikh = new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });
    const bahagian = tigaBulan().map(k => htmlBulan(k)).concat([htmlShopee(tahun)]);
    let pertama = true;
    for (let i = 0; i < bahagian.length; i++) {
      const el = document.createElement('div');
      el.style.cssText = 'position:absolute;left:-10000px;top:0;width:794px;box-sizing:border-box;padding:30px;background:#fff;font-family:Poppins,sans-serif;color:#333';
      el.innerHTML = '<div style="border-bottom:2px solid #2e7d32;padding-bottom:8px;margin-bottom:14px"><div style="font-size:20px;font-weight:700;color:#2e7d32">NZ RICH PINEAPPLE</div><div style="font-size:11px;color:#666">Dicetak: ' + tarikh + '</div></div>' + bahagian[i];
      document.body.appendChild(el);
      try {
        peringkat = 'lukis halaman ' + (i + 1);
        const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', windowWidth: 794 });
        peringkat = 'cipta PDF';
        pertama = tambahCanvas(pdf, canvas, pertama);
      } finally { el.remove(); }
    }
    return new File([pdf.output('blob')], 'NZ Rich Pineapple - Statement.pdf', { type: 'application/pdf' });
  }
  function panel(file) {
    const lama = $('pdf-panel'); if (lama) lama.remove();
    const url = URL.createObjectURL(file);
    const p = document.createElement('div');
    p.id = 'pdf-panel';
    p.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:100000;display:flex;align-items:flex-end;justify-content:center';
    p.innerHTML = '<div style="background:#fff;width:100%;max-width:480px;border-radius:20px 20px 0 0;padding:20px;text-align:center">' +
      '<div style="font-weight:700;color:#2e7d32;font-size:16px">✅ PDF Sedia</div>' +
      '<div style="font-size:12px;color:#666;margin:6px 0 14px">' + file.name + '</div>' +
      '<button id="pdf-kongsi" class="btn btn-green" style="width:100%;margin-bottom:10px">📤 Kongsi / Simpan PDF</button>' +
      '<button id="pdf-buka" class="btn btn-blue" style="width:100%;margin-bottom:10px">👁️ Buka PDF</button>' +
      '<button id="pdf-tutup" class="btn btn-yellow" style="width:100%">Tutup</button></div>';
    document.body.appendChild(p);
    $('pdf-tutup').onclick = () => { p.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); };
    $('pdf-buka').onclick = () => window.open(url, '_blank');
    $('pdf-kongsi').onclick = async () => {
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: file.name });
        else window.open(url, '_blank');
      } catch (e) { if (e.name !== 'AbortError') window.open(url, '_blank'); }
    };
  }
  $('st-pdf').onclick = async () => {
    if (sedang) return;
    sedang = true; toast('Menyediakan PDF...');
    try { panel(await janaPdf()); }
    catch (err) { console.error(err); alert('Ralat PDF (' + peringkat + '): ' + (err && err.message ? err.message : String(err))); }
    sedang = false;
  };
});
