/* patch-hutang.js (v2)
   1. Hutang Pelanggan (IN belum terima) dan Hutang Kita (OUT belum bayar) dipisahkan
   2. Rekod berstatus "Hutang" TIDAK dikira dalam baki / Jumlah IN / Jumlah OUT
   3. Butang "Lunas" pada rekod hutang -> jadi Selesai, terus masuk baki
   Mesti dimuat PALING BAWAH (selepas patch-bayaran.js). Berjalan dalam 'load'
   supaya menimpa kemaskiniRingkasan dari patch-bayaran.js. */
window.addEventListener('load', function () {
  const $ = id => document.getElementById(id);
  if (typeof dataRekod === 'undefined') return;

  const nilai = r => parseFloat(String(r.jumlah).replace(/[^0-9.]/g, '')) || 0;
  const fmt = n => 'RM ' + n.toFixed(2);
  const set = (id, v) => { const e = $(id); if (e) e.innerText = fmt(v); };

  /* Kumpulan akaun: sama seperti patch-bayaran.js */
  function kumpulan(r) {
    if ((r.saluran || 'Kebun') === 'Shopee') return 'shopee';
    if (r.jenisBayar === 'QR' || r.jenisBayar === 'Online Transfer') return 'online';
    if (r.jenisBayar === 'Cash') return 'kebun';
    return r.saluran === 'Live' ? 'online' : 'kebun';
  }

  /* Label + kotak Hutang Kita */
  (function sediakanKotak() {
    const h = $('summary-hutang');
    const box = h && h.closest('.summary-box');
    if (!box) return;
    const p = box.querySelector('p');
    if (p) p.textContent = 'Hutang Pelanggan (RM)';
    if (!$('summary-hutang-kita')) {
      const b = document.createElement('div');
      b.className = 'summary-box';
      b.style.background = '#ad1457';
      b.innerHTML = '<span style="position:absolute;right:-10px;bottom:-10px;font-size:60px;opacity:0.2;">💳</span>' +
        '<p>Hutang Kita (RM)</p><h3 id="summary-hutang-kita">RM 0.00</h3>';
      box.after(b);
    }
  })();

  /* Kiraan ringkasan baharu */
  window.kemaskiniRingkasan = function () {
    const baki = { kebun: 0, online: 0, shopee: 0 };
    let jualan = 0, modal = 0, masuk = 0, keluar = 0, hutangPel = 0, hutangKita = 0;
    dataRekod.forEach(r => {
      const v = nilai(r), isIn = r.jenis === 'IN';
      if (r.kategori === 'Tanaman' && isIn) jualan += v;
      if (r.kategori === 'Lain-lain / Modal' && !isIn) modal += v;
      if (r.status === 'Hutang') {            /* duit belum bergerak */
        if (isIn) hutangPel += v; else hutangKita += v;
        return;
      }
      baki[kumpulan(r)] += isIn ? v : -v;
      if (isIn) masuk += v; else keluar += v;
    });
    set('summary-baki-kebun', baki.kebun);
    set('summary-baki-online', baki.online);
    set('summary-shopee', baki.shopee);
    set('summary-in', masuk);
    set('summary-out', keluar);
    set('summary-jualan', jualan);
    set('summary-modal', modal);
    set('summary-hutang', hutangPel);
    set('summary-hutang-kita', hutangKita);
  };

  /* Butang Lunas */
  window.tandaLunas = function (i) {
    const r = dataRekod[i];
    if (!r || r.status !== 'Hutang') return;
    if (!confirm('Hutang ' + r.jumlah + ' dah dilunaskan? Rekod jadi Selesai dan masuk baki.')) return;
    r.status = 'Selesai';
    r.tarikhLunas = new Date().toLocaleDateString('ms-MY');
    simpanSemuaKeCloud();
    paparRekod();
    showToast('Hutang ditandakan Lunas!');
  };

  function butangLunas() {
    const tb = $('tbody-rekod');
    if (!tb) return;
    tb.querySelectorAll('button[onclick^="padam("]').forEach(pb => {
      const m = pb.getAttribute('onclick').match(/padam\((\d+)\)/);
      const r = m && dataRekod[parseInt(m[1], 10)];
      const td = pb.parentNode;
      if (!r || r.status !== 'Hutang' || td.querySelector('.btn-lunas')) return;
      const b = document.createElement('button');
      b.className = 'btn-lunas';
      b.textContent = '✅ Lunas';
      b.setAttribute('onclick', 'tandaLunas(' + m[1] + ')');
      b.style.cssText = 'display:block;margin-bottom:4px;background:#2e7d32;color:#fff;border:none;border-radius:5px;padding:4px 8px;font-size:11px;font-weight:bold;cursor:pointer;white-space:nowrap;';
      td.insertBefore(b, pb);
    });
  }

  const paparAsal = window.paparRekod;
  window.paparRekod = function () {
    const r = paparAsal.apply(this, arguments);
    butangLunas();
    window.kemaskiniRingkasan();   /* pastikan kiraan kita yang terakhir */
    return r;
  };

  /* Papar semula dengan kiraan baharu */
  window.kemaskiniRingkasan();
  butangLunas();
});
