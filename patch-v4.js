/* NZ Rich - patch v4: Nombor auto Invois (NZ-I) & Resit (NZ-R) */
window.addEventListener('load', function () {
  const rujuk = () => db.collection('ladang_nz').doc('data_utama');
  const JENIS = {
    j: { input: 'j-no', kunci: 'inv', awalan: 'NZ-I-', page: 'invoice-jualan', preview: 'paparPreviewJualan', kad: 'preview-jualan' },
    t: { input: 't-no', kunci: 'inv', awalan: 'NZ-I-', page: 'invoice-transport', preview: 'paparPreviewTransport', kad: 'preview-transport' },
    r: { input: 'res-no', kunci: 'res', awalan: 'NZ-R-', page: 'resit', preview: 'paparPreviewResit', kad: 'preview-resit' }
  };
  const format = (J, n) => J.awalan + String(n).padStart(4, '0');
  const pending = {};
  const sedia = () => typeof currentUser !== 'undefined' && currentUser;

  async function baca(kunci) {
    const s = await rujuk().get();
    const d = s.exists ? s.data().dataNombor : null;
    return (d && d[kunci]) || 0;
  }

  function ambil(kunci) {
    return db.runTransaction(async t => {
      const s = await t.get(rujuk());
      const d = s.exists ? s.data().dataNombor : null;
      const baru = ((d && d[kunci]) || 0) + 1;
      t.set(rujuk(), { dataNombor: { [kunci]: baru } }, { merge: true });
      return baru;
    });
  }

  async function isi(k) {
    if (!sedia()) return;
    const J = JENIS[k], el = document.getElementById(J.input);
    if (!el) return;
    if (pending[k]) { el.value = format(J, pending[k]); return; }
    try { el.value = format(J, (await baca(J.kunci)) + 1); } catch (e) { console.error(e); }
  }

  // Bila tekan Preview / Simpan: ambil nombor sebenar dari Firestore
  Object.keys(JENIS).forEach(k => {
    const J = JENIS[k], asal = window[J.preview];
    if (typeof asal !== 'function') return;
    window[J.preview] = async function () {
      const args = arguments;
      try {
        if (!pending[k]) pending[k] = await ambil(J.kunci);
        document.getElementById(J.input).value = format(J, pending[k]);
      } catch (e) {
        console.error(e);
        if (typeof showToast === 'function') showToast('Nombor auto gagal, guna nombor dalam kotak.', 'error');
      }
      return asal.apply(this, args);
    };
  });

  // Bila tekan Cetak PDF: nombor dah dikeluarkan, lepaskan supaya dokumen seterusnya dapat nombor baharu
  document.addEventListener('click', function (e) {
    const b = e.target.closest('button');
    if (!b || !/window\.print/.test(b.getAttribute('onclick') || '')) return;
    const kad = b.closest('.card');
    if (!kad) return;
    Object.keys(JENIS).forEach(k => { if (JENIS[k].kad === kad.id) delete pending[k]; });
  }, true);

  // Bila Edit Balik: papar nombor seterusnya jika tiada nombor tertunggak
  if (typeof window.tutupPreview === 'function') {
    const tp = window.tutupPreview;
    window.tutupPreview = function () {
      const r = tp.apply(this, arguments);
      Object.keys(JENIS).forEach(k => isi(k));
      return r;
    };
  }

  // Bila buka halaman: tunjuk nombor seterusnya dalam kotak
  if (typeof window.showPage === 'function') {
    const sp = window.showPage;
    window.showPage = function (id) {
      const r = sp.apply(this, arguments);
      Object.keys(JENIS).forEach(k => { if (JENIS[k].page === id) isi(k); });
      return r;
    };
  }
});
