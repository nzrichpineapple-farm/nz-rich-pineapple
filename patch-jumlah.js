/* NZ Rich - patch jumlah: taip Jumlah RM terus dengan tepat */
window.addEventListener('load', function () {
  const $ = id => document.getElementById(id);
  const jum = $('r-jumlah'), kuan = $('r-kuantiti'), harga = $('r-harga');
  if (!jum || !kuan || !harga) return;
  let manual = false;

  [kuan, harga, jum].forEach(el => { el.setAttribute('inputmode', 'decimal'); el.setAttribute('step', 'any'); });
  jum.removeAttribute('readonly');
  jum.setAttribute('placeholder', 'Taip jumlah terus, cth 12.34');
  jum.style.background = '#fff';
  const nilai = () => parseFloat(String(jum.value).replace(/[^0-9.]/g, '')) || 0;

  jum.addEventListener('focus', () => { const n = nilai(); jum.value = n > 0 ? String(n) : ''; });
  jum.addEventListener('input', () => { manual = true; });
  jum.addEventListener('blur', () => {
    if (manual) jum.value = 'RM ' + nilai().toFixed(2);
    else kiraRekod();
  });

  const kiraAsal = window.kiraRekod;
  window.kiraRekod = function () {
    const e = window.event, id = e && e.target && e.target.id;
    if (id === 'r-kuantiti' || id === 'r-harga') manual = false;
    if (manual) return;
    return kiraAsal.apply(this, arguments);
  };

  const simpanAsal = window.simpanRekod;
  window.simpanRekod = function () {
    if (manual) {
      const j = nilai(), k = parseFloat(kuan.value) || 0;
      if (!(j > 0)) return showToast('Masukkan jumlah RM yang sah.', 'error');
      if ($('r-kategori').value === 'Gaji Pekerja') harga.value = String(j);
      else if (k > 0) harga.value = String(j / k);
    }
    return simpanAsal.apply(this, arguments);
  };

  const resetAsal = window.resetRekod;
  window.resetRekod = function () { manual = false; return resetAsal.apply(this, arguments); };
});
