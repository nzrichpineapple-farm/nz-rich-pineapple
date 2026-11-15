/* NZ Rich - patch v2 (dimuatkan dalam <head>, selepas skrip Firebase) */
(function () {
'use strict';
// KEMASKINI: Guna senarai (Array) untuk benarkan lebih dari 1 orang akses 'Bos'
const UID_BOS = [
  'K5l2unI6EEUdlraPMItm0GNiJBi2', // UID Kau (Bos)
  'uY213u6svVVy36FVQlB2y6vTzGC3'  // UID Staff
];
const SEMBUNYI = ['laporan','rekod','invoice-jualan','invoice-transport','resit','sewa','katalog','notis'];
let isBoss = false, kewSedia = false, migJalan = false, lastUmum = '', lastKew = '', siapTerap = false;
const ref = n => db.collection('ladang_nz').doc(n);
const kunciGame = () => 'nz_game_' + (currentUser ? currentUser.uid : 'tetamu');
const ralat = e => { console.error(e); showToast('Gagal simpan: ' + e.message, 'error'); };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const umum = () => ({ dataInventori, dataKatalog, dataNotis, dataKalendar, dataKehadiran, dataCatatan });

function muatGame() {
  try { const g = JSON.parse(localStorage.getItem(kunciGame())); if (g && g.plots) gameData = g; } catch (e) {}
}

function aturAkses() {
  document.querySelectorAll('.sidebar-menu li, .bottom-nav-item').forEach(el => {
    const m = (el.getAttribute('onclick') || '').match(/showPage\('([^']+)'/);
    if (m && SEMBUNYI.includes(m[1])) el.style.display = isBoss ? '' : 'none';
  });
  const tutup = el => { if (el) el.style.display = isBoss ? '' : 'none'; };
  
  // Tambah safety check (if) supaya tak error kalau elemen tak jumpa
  const elBakiKebun = document.getElementById('summary-baki-kebun');
  if (elBakiKebun) tutup(elBakiKebun.closest('.card'));
  
  const elManNama = document.getElementById('man-nama');
  if (elManNama) tutup(elManNama.closest('.card'));
  
  tutup(document.querySelector('button[onclick="janaGajiKeRekod()"]'));
}

async function migrasiKewangan(lama) {
  migJalan = true;
  try {
    const r = ref('data_kewangan'), snap = await r.get(), d = snap.exists ? snap.data() : {};
    const ada = (d.dataRekod || []).length || (d.dataSewa || []).length;
    if (!ada) await r.set({ dataRekod: lama.dataRekod || [], dataSewa: lama.dataSewa || [] }, { merge: true });
    if (lama.gameData && !localStorage.getItem(kunciGame())) {
      gameData = lama.gameData; localStorage.setItem(kunciGame(), JSON.stringify(gameData));
    }
    const FV = firebase.firestore.FieldValue;
    await ref('data_utama').update({ dataRekod: FV.delete(), dataSewa: FV.delete(), gameData: FV.delete() });
    showToast('Data kewangan dipindahkan ke tempat selamat.');
  } catch (e) { console.error(e); showToast('Migrasi gagal: ' + e.message, 'error'); }
  migJalan = false; kewSedia = true;
}

function mulaSyncKewangan() {
  ref('data_kewangan').onSnapshot(d => {
    if (d.exists) { const x = d.data(); dataRekod = x.dataRekod || []; dataSewa = x.dataSewa || []; }
    lastKew = JSON.stringify({ dataRekod, dataSewa });
    kewSedia = !migJalan;
    paparRekod(); paparSewa(); kemaskiniRingkasan();
  }, e => { console.error(e); showToast('Data kewangan tidak dapat dibaca. Semak rules.', 'error'); });
}

function simpanBaru() {
  if (!currentUser) return;
  try { localStorage.setItem(kunciGame(), JSON.stringify(gameData)); } catch (e) {}
  const meta = { lastUpdated: new Date().toISOString(), updatedBy: currentUser.email };
  const u = umum(), ju = JSON.stringify(u);
  if (ju !== lastUmum) { lastUmum = ju; ref('data_utama').set({ ...u, ...meta }, { merge: true }).catch(ralat); }
  if (isBoss && kewSedia) {
    const k = { dataRekod, dataSewa }, jk = JSON.stringify(k);
    if (jk !== lastKew) { lastKew = jk; ref('data_kewangan').set({ ...k, ...meta }, { merge: true }).catch(ralat); }
  }
}

function terapkan() {
  if (siapTerap) return; siapTerap = true;
  window.simpanSemuaKeCloud = simpanBaru;
  const asal = window.showPage;
  window.showPage = function (id, el) {
    if (!isBoss && SEMBUNYI.includes(id)) return showToast('Untuk Bos sahaja.', 'error');
    return asal(id, el);
  };
  window.kiraAI = kiraAIBaru;
}

function mulaV2(rd, asalOnSnap) {
  terapkan();
  // KEMASKINI: Guna .includes() untuk semak dalam senarai array
  isBoss = !!currentUser && UID_BOS.includes(currentUser.uid);
  
  // KEMASKINI: Semak kalau UID placeholder masih ada
  if (UID_BOS.some(uid => uid.startsWith('TAMPAL') || uid.startsWith('MASUKKAN'))) {
      showToast('UID Bos belum diisi dalam patch-v2.js', 'error');
  }
  
  muatGame(); aturAkses();
  if (isBoss) mulaSyncKewangan();
  return asalOnSnap.call(rd, doc => {
    if (doc.exists) {
      const d = doc.data();
      dataInventori = d.dataInventori || []; dataKatalog = d.dataKatalog || [];
      if (d.dataNotis) dataNotis = d.dataNotis;
      if (d.dataKalendar) dataKalendar = d.dataKalendar;
      if (d.dataKehadiran) dataKehadiran = d.dataKehadiran;
      if (d.dataCatatan) dataCatatan = d.dataCatatan;
      lastUmum = JSON.stringify(umum());
      if (isBoss && !migJalan && (d.dataRekod || d.dataSewa || d.gameData)) migrasiKewangan(d);
      paparInventori(); paparKatalog(); paparNotis(); paparKalendar(); paparKehadiran(); paparCatatan(); renderGame();
      if (isBoss) { paparRekod(); paparSewa(); }
      kemaskiniRingkasan();
    } else if (isBoss) { simpanBaru(); }
    document.getElementById('loading-screen').style.display = 'none';
  }, e => {
    console.error(e); showToast('Tiada kebenaran atau sambungan gagal.', 'error');
    document.getElementById('loading-screen').style.display = 'none';
  });
}

/* Ganti penyegerakan lama dengan v2, tanpa bergantung pada susunan muat */
const DR = window.firebase && firebase.firestore && firebase.firestore.DocumentReference;
if (DR && DR.prototype && DR.prototype.onSnapshot) {
  const asal = DR.prototype.onSnapshot;
  DR.prototype.onSnapshot = function (...a) {
    if (this.path === 'ladang_nz/data_utama' && typeof a[0] === 'function') return mulaV2(this, asal);
    return asal.apply(this, a);
  };
} else {
  addEventListener('DOMContentLoaded', () => setTimeout(() => showToast('Patch v2 tidak aktif', 'error'), 2000));
}

/* ===== KALKULATOR PINTAR ===== */
const ANDAIAN = {
  nenas:   { ekar: 5000,  baja: 0.3, buah: 1.5, nota: '5,000 pokok/ekar, 0.3 kg baja/pokok, 1.5 kg/buah' },
  cili:    { ekar: 10000, nota: 'dikira dari jarak 60x45 cm, 70% ruang boleh ditanam' },
  keledek: { ekar: 10000, nota: 'dikira dari jarak 90x30 cm, 70% ruang boleh ditanam' },
  betik:   { ekar: 700,   nota: 'dikira dari jarak 2x2 m, 70% ruang boleh ditanam' }
};
function kiraAIBaru() {
  const asal = document.getElementById('ai-input').value.trim();
  if (!asal) return showToast('Sila taip soalan anda.', 'error');
  const t = ' ' + asal.toLowerCase().replace(/(\d),(?=\d{3}\b)/g, '$1') + ' ';
  const N = '(\\d+(?:\\.\\d+)?)\\s*(k|ribu|juta|jt)?\\s*', K = { k: 1e3, ribu: 1e3, juta: 1e6, jt: 1e6 };
  const cari = u => { const m = t.match(new RegExp(N + '(?:' + u + ')\\b')); return m ? parseFloat(m[1]) * (K[m[2]] || 1) : null; };
  const f = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

  let harga = cari('ringgit|rm');
  if (harga === null) { const m = t.match(/\brm\s*(\d+(?:\.\d+)?)/); if (m) harga = parseFloat(m[1]); }
  if (harga === null) { const s = cari('sen'); if (s !== null) harga = s / 100; }
  let luas = cari('ekar|acre|ac');
  if (luas === null) { const h = cari('hektar|hektare|hectare|ha'); if (h !== null) luas = h * 2.471; }
  if (luas === null) { const r = cari('relong'); if (r !== null) luas = r * 0.711; }
  const pokok = cari('pokok|batang|sulur|benih|anak pokok'), biji = cari('biji|buah');
  const tn = cari('tan|ton'), kg = cari('kg|kilo|kilogram');
  const berat = tn !== null ? tn * 1000 : kg;
  const perKg = /sekilo|sekg|per\s*kg|\/\s*kg|se\s*kilo/.test(t);
  const kunci = /nenas|nanas|yankee/.test(t) ? 'nenas' : /cili/.test(t) ? 'cili' : /keledek/.test(t) ? 'keledek' : /betik|papaya/.test(t) ? 'betik' : null;
  const A = ANDAIAN[kunci || 'nenas'];
  const mahuBaja = /baja/.test(t), mahuJual = harga !== null || /jual|untung|pendapatan|hasil/.test(t);
  const baris = [], nota = [];

  let p = null;
  if (luas !== null) {
    p = luas * A.ekar;
    baris.push(`<b>Benih:</b> ${f(luas, 2)} ekar × ${f(A.ekar)} = <b>${f(p)} pokok</b>`);
    baris.push(`<b>Tukaran luas:</b> ${f(luas, 2)} ekar = ${f(luas / 2.471, 2)} hektar = ${f(luas / 0.711, 2)} relong`);
  } else if (pokok !== null) {
    p = pokok; const lu = p / A.ekar;
    baris.push(`<b>Luas diperlukan:</b> ${f(p)} ÷ ${f(A.ekar)} = <b>${f(lu, 2)} ekar</b> (${f(lu / 2.471, 2)} hektar)`);
  }
  if (p !== null && A.baja && (mahuBaja || !mahuJual)) baris.push(`<b>Baja:</b> ${f(p)} × ${A.baja} kg = <b>${f(p * A.baja, 1)} kg</b>`);

  let bj = biji;
  if (bj === null && berat !== null && A.buah) bj = berat / A.buah;
  if (bj === null && p !== null && A.buah && mahuJual) bj = p;
  if (berat !== null && harga === null && A.buah) baris.push(`<b>Anggaran buah:</b> ${f(berat)} kg ÷ ${A.buah} kg = <b>${f(berat / A.buah)} biji</b>`);
  if (harga !== null) {
    const kgJ = berat !== null ? berat : (bj !== null && A.buah ? bj * A.buah : null);
    if (perKg && kgJ !== null) baris.push(`<b>Jualan:</b> ${f(kgJ, 1)} kg × RM ${f(harga, 2)} = <b style="color:var(--primary-green);font-size:16px;">RM ${f(kgJ * harga, 2)}</b>`);
    else if (!perKg && bj !== null) baris.push(`<b>Jumlah biji:</b> ${f(bj)} biji<br><b>Jualan:</b> ${f(bj)} × RM ${f(harga, 2)} = <b style="color:var(--primary-green);font-size:16px;">RM ${f(bj * harga, 2)}</b>`);
  }
  if (!kunci) nota.push('tanaman tak dinyatakan, guna Nenas Yankee');
  nota.push(A.nota); if (harga !== null && !perKg) nota.push('harga dianggap sebiji (taip "sekilo" untuk harga per kg)');

  document.getElementById('ai-text').innerHTML = baris.length
    ? `<p style="margin-bottom:10px;">Kiraan untuk <b>"${esc(asal)}"</b>:</p><div style="background:#f8fafc;padding:10px;border-radius:8px;border:1px dashed #cbd5e1;line-height:1.9;">${baris.join('<br><br>')}</div><p style="font-size:11px;color:#64748b;margin-top:10px;">*Andaian: ${esc(nota.join('. '))}</p>`
    : `Maaf, saya belum faham. Cuba contoh:<br>• <b>Nak tanam nenas 2.5 hektar</b><br>• <b>Baja untuk 5k pokok</b><br>• <b>1.5 tan harga RM3 sebiji</b><br>• <b>2 tan nenas RM2 sekilo</b><br>• <b>3 relong cili</b>`;
  document.getElementById('ai-result').style.display = 'block';
}
})();
