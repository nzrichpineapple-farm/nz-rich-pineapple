/* NZ Rich - Cetak PDF untuk Rekod IN/OUT & Kehadiran (iPhone) */
window.addEventListener('load', function () {
  const $ = id => document.getElementById(id);
  const toast = (m, t) => { if (typeof showToast === 'function') showToast(m, t); };
  const JENIS = {
    'print-rekod': { nama: 'Rekod IN-OUT', tajuk: 'REKOD IN / OUT', baris: 'tbody tr', per: 22 },
    'print-kehadiran': { nama: 'Kehadiran Pekerja', tajuk: 'SEJARAH KEHADIRAN PEKERJA', baris: '.list-item', per: 10 }
  };
  let peringkat = '', sedangJana = false;

  const muatSkrip = src => new Promise((ok, gagal) => {
    const sc = document.createElement('script');
    sc.src = src; sc.onload = ok; sc.onerror = () => gagal(new Error('Gagal muat ' + src));
    document.head.appendChild(sc);
  });
  async function lib() {
    if (!window.html2canvas) await muatSkrip('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    if (!(window.jspdf && window.jspdf.jsPDF)) await muatSkrip('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  }

  async function jana(kad, J) {
    peringkat = 'muat pustaka';
    await lib();
    peringkat = 'sediakan laporan';
    const asas = kad.cloneNode(true);
    asas.querySelectorAll('[id]').forEach(x => x.removeAttribute('id'));
    asas.querySelectorAll('.hide-print').forEach(x => x.remove());
    asas.querySelectorAll('.table-responsive').forEach(x => { x.style.overflow = 'visible'; });
    const jumlah = asas.querySelectorAll(J.baris).length;
    const n = Math.max(1, Math.ceil(jumlah / J.per));
    const tarikh = new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });
    const pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });

    for (let p = 0; p < n; p++) {
      const klon = asas.cloneNode(true);
      [...klon.querySelectorAll(J.baris)].forEach((r, i) => { if (i < p * J.per || i >= (p + 1) * J.per) r.remove(); });
      klon.style.cssText = 'position:absolute;left:-10000px;top:0;width:794px;max-width:none;margin:0;border:none;border-radius:0;box-shadow:none;box-sizing:border-box;padding:30px;background:#fff;font-size:14px;display:flow-root';
      const kepala = document.createElement('div');
      kepala.style.cssText = 'border-bottom:2px solid #2e7d32;padding-bottom:10px;margin-bottom:12px';
      kepala.innerHTML = '<div style="font-size:20px;font-weight:700;color:#2e7d32">NZ RICH PINEAPPLE</div>' +
        '<div style="font-size:15px;font-weight:700;margin-top:2px">' + J.tajuk + '</div>' +
        '<div style="font-size:11px;color:#666">Dicetak: ' + tarikh + '</div>';
      const kaki = document.createElement('div');
      kaki.style.cssText = 'text-align:right;font-size:11px;color:#666;margin-top:10px';
      kaki.innerText = 'Halaman ' + (p + 1) + ' / ' + n;
      klon.prepend(kepala); klon.appendChild(kaki);
      document.body.appendChild(klon);
      let canvas;
      try {
        peringkat = 'lukis halaman ' + (p + 1);
        canvas = await html2canvas(klon, { scale: 2, backgroundColor: '#ffffff', useCORS: true, windowWidth: 794 });
      } finally { klon.remove(); }
      peringkat = 'cipta PDF';
      if (p > 0) pdf.addPage();
      let w = 190, h = w * canvas.height / canvas.width;
      if (h > 277) { h = 277; w = h * canvas.width / canvas.height; }
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', (210 - w) / 2, 10, w, h);
    }
    return new File([pdf.output('blob')], 'NZ Rich Pineapple - ' + J.nama + '.pdf', { type: 'application/pdf' });
  }

  function panel(file) {
    const lama = $('pdf-panel'); if (lama) lama.remove();
    const url = URL.createObjectURL(file);
    const p = document.createElement('div');
    p.id = 'pdf-panel';
    p.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:100000;display:flex;align-items:flex-end;justify-content:center';
    p.innerHTML = '<div style="background:#fff;width:100%;max-width:480px;border-radius:20px 20px 0 0;padding:20px;text-align:center">' +
      '<div style="font-weight:700;color:#2e7d32;font-size:16px">✅ PDF Sedia</div>' +
      '<div style="font-size:12px;color:#666;margin:6px 0 14px;word-break:break-word">' + file.name + '</div>' +
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

  document.addEventListener('click', async function (e) {
    const b = e.target.closest('button');
    if (!b || !/window\.print/.test(b.getAttribute('onclick') || '')) return;
    const kad = b.closest('.card');
    const J = kad && JENIS[kad.id];
    if (!J) return;
    e.preventDefault(); e.stopPropagation();
    if (sedangJana) return;
    sedangJana = true;
    toast('Menyediakan PDF...');
    try { panel(await jana(kad, J)); }
    catch (err) { console.error(err); alert('Ralat PDF (' + peringkat + '): ' + (err && err.message ? err.message : String(err))); }
    sedangJana = false;
  }, true);
});
