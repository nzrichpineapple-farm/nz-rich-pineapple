/* NZ Rich - patch bayaran: Cash / QR / Online Transfer, asingkan Baki Online dan Shopee */
window.addEventListener('load', function () {
  const $ = id => document.getElementById(id);
  const st = $('r-status');
  if (!st || typeof dataRekod === 'undefined') return;

  /* 1. Kotak Jenis Pembayaran dalam borang */
  const g = document.createElement('div');
  g.className = 'form-group';
  g.innerHTML = '<label>Jenis Pembayaran</label>' +
    '<select id="r-bayar" class="form-control">' +
    '<option value="Cash">💵 Cash</option>' +
    '<option value="QR">📱 QR</option>' +
    '<option value="Online Transfer">🏦 Online Transfer</option></select>' +
    '<p style="font-size:11px;color:#666;margin-top:5px;">Shopee = Baki Shopee sahaja (apa pun jenis bayaran). Selain Shopee: Cash = Baki Kebun, QR / Online Transfer = Baki Online.</p>';
  st.closest('.form-group').before(g);
  const sel = $('r-bayar');

  /* 2. Simpan jenis pembayaran bersama rekod */
  const simpanAsal = window.simpanRekod;
  window.simpanRekod = function () {
    const byr = sel.value, n = dataRekod.length, asalCloud = window.simpanSemuaKeCloud;
    window.simpanSemuaKeCloud = function () {
      if (dataRekod.length > n) dataRekod[dataRekod.length - 1].jenisBayar = byr;
      window.simpanSemuaKeCloud = asalCloud;
      return asalCloud.apply(this, arguments);
    };
    try { return simpanAsal.apply(this, arguments); }
    finally { window.simpanSemuaKeCloud = asalCloud; }
  };

  const resetAsal = window.resetRekod;
  window.resetRekod = function () { sel.value = 'Cash'; return resetAsal.apply(this, arguments); };

  /* 3. Kiraan baki baharu */
  function kumpulan(r) {
    if ((r.saluran || 'Kebun') === 'Shopee') return 'shopee';
    if (r.jenisBayar === 'QR' || r.jenisBayar === 'Online Transfer') return 'online';
    if (r.jenisBayar === 'Cash') return 'kebun';
    return r.saluran === 'Live' ? 'online' : 'kebun'; // rekod lama tanpa jenis bayaran
  }
  window.kemaskiniRingkasan = function () {
    const baki = { kebun: 0, online: 0, shopee: 0 };
    let jualan = 0, hutang = 0, modal = 0, masuk = 0, keluar = 0;
    dataRekod.forEach(r => {
      const v = parseFloat(String(r.jumlah).replace(/[^0-9.]/g, '')) || 0;
      const isIn = r.jenis === 'IN';
      baki[kumpulan(r)] += isIn ? v : -v;
      if (isIn) masuk += v; else keluar += v;
      if (r.kategori === 'Tanaman' && isIn) { jualan += v; if (r.status === 'Hutang') hutang += v; }
      if (r.kategori === 'Lain-lain / Modal' && r.jenis === 'OUT') modal += v;
    });
    const set = (id, v) => { const e = $(id); if (e) e.innerText = 'RM ' + v.toFixed(2); };
    set('summary-baki-kebun', baki.kebun); set('summary-baki-online', baki.online); set('summary-shopee', baki.shopee);
    set('summary-in', masuk); set('summary-out', keluar); set('summary-jualan', jualan);
    set('summary-hutang', hutang); set('summary-modal', modal);
  };
  const label = (id, teks) => { const e = $(id), p = e && e.previousElementSibling; if (p && p.tagName === 'P') p.textContent = teks; };
  label('summary-baki-kebun', 'Baki Kebun / Cash (RM)');
  label('summary-baki-online', 'Baki Online / QR (RM)');

  /* 4. Papar jenis pembayaran dalam senarai rekod */
  const paparAsal = window.paparRekod;
  window.paparRekod = function () {
    const r = paparAsal.apply(this, arguments);
    const tb = $('tbody-rekod');
    if (tb) [...tb.querySelectorAll('tr')].forEach((tr, i) => {
      const d = dataRekod[i], td = tr.children[1];
      if (!d || !td || !d.jenisBayar) return;
      td.insertAdjacentHTML('afterbegin', '<span style="background:#e8f5e9;color:#2e7d32;padding:2px 5px;border-radius:5px;font-size:10px;margin-right:3px;">' + d.jenisBayar + '</span>');
    });
    return r;
  };

  try { window.kemaskiniRingkasan(); } catch (e) {}
});
