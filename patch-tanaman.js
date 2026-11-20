/* NZ Rich - patch tanaman & unit (HANYA untuk Rekod IN/OUT) */
(function () {
  'use strict';

  function tambah(sel, teks) {
    if (![...sel.options].some(o => o.value === teks)) sel.add(new Option(teks, teks));
  }

  function siap() {
    // ---- Jenis Tanaman (Rekod IN/OUT) ----
    const tan = document.getElementById('r-tanaman');
    if (tan) {
      // Ubi Kayu -> pecah jadi Ubi Kayu Putih & Ubi Kayu Kuning (kedudukan sama)
      const lama = [...tan.options].find(o => o.value === 'Ubi Kayu');
      if (lama) lama.replaceWith(new Option('Ubi Kayu Putih', 'Ubi Kayu Putih'), new Option('Ubi Kayu Kuning', 'Ubi Kayu Kuning'));

      ['Ubi Kayu Putih', 'Ubi Kayu Kuning', 'Kangkung', 'Bayam Hijau', 'Bayam Merah',
       'Daun Pandan', 'Tenggek Burung', 'Ulam Pegaga'].forEach(n => tambah(tan, n));
    }

    // ---- Unit (Rekod IN/OUT) ----
    const unit = document.getElementById('r-unit');
    if (unit) tambah(unit, 'ikat');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', siap);
  else siap();
})();
