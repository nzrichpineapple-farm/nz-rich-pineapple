/* patch-hutang.js (v1)
   1. Pisahkan Hutang Pelanggan (IN belum terima) dan Hutang Kita (OUT belum bayar)
   2. Rekod berstatus "Hutang" TIDAK dikira dalam baki / Jumlah IN / Jumlah OUT
   3. Butang "Lunas" pada rekod hutang -> tukar jadi Selesai, terus masuk baki
   Letak SELEPAS patch-tanaman.js (paling bawah) dalam index.html */
(function () {
    function rmVal(r) {
        return parseFloat(String(r.jumlah).replace(/[^0-9.]/g, '')) || 0;
    }
    function setTxt(id, txt) {
        var el = document.getElementById(id);
        if (el) el.innerText = txt;
    }
    function fmt(n) { return 'RM ' + n.toFixed(2); }

    // ---- 1. Ubah label & tambah kotak "Hutang Kita" ----
    function sediakanKotak() {
        var h = document.getElementById('summary-hutang');
        if (!h) return;
        var box = h.closest('.summary-box');
        var label = box ? box.querySelector('p') : null;
        if (label) label.innerText = 'Hutang Pelanggan (RM)';

        if (box && !document.getElementById('summary-hutang-kita')) {
            var baru = document.createElement('div');
            baru.className = 'summary-box';
            baru.style.background = '#ad1457';
            baru.innerHTML =
                '<span style="position:absolute; right:-10px; bottom:-10px; font-size:60px; opacity:0.2;">💳</span>' +
                '<p>Hutang Kita (RM)</p><h3 id="summary-hutang-kita">RM 0.00</h3>';
            box.parentNode.insertBefore(baru, box.nextSibling);
        }
    }

    // ---- 2. Kiraan ringkasan baru ----
    window.kemaskiniRingkasan = function () {
        var inKebun = 0, outKebun = 0, inOnline = 0, outOnline = 0, shopeeIn = 0, shopeeOut = 0;
        var jualan = 0, modal = 0, totalIn = 0, totalOut = 0, hutangPel = 0, hutangKita = 0;

        (typeof dataRekod !== 'undefined' ? dataRekod : []).forEach(function (r) {
            var rm = rmVal(r);
            var saluran = r.saluran || 'Kebun';

            // Jualan & Kos Modal kekal ikut akaun (termasuk yang belum bayar)
            if (r.kategori === 'Tanaman' && r.jenis === 'IN') jualan += rm;
            if (r.kategori === 'Lain-lain / Modal' && r.jenis === 'OUT') modal += rm;

            // Hutang: asingkan, jangan masuk baki / IN / OUT
            if (r.status === 'Hutang') {
                if (r.jenis === 'IN') hutangPel += rm; else hutangKita += rm;
                return;
            }

            // Duit sebenar yang dah bergerak
            if (r.jenis === 'IN') totalIn += rm; else totalOut += rm;
            if (saluran === 'Kebun') {
                if (r.jenis === 'IN') inKebun += rm; else outKebun += rm;
            } else {
                if (r.jenis === 'IN') inOnline += rm; else outOnline += rm;
            }
            if (saluran === 'Shopee') {
                if (r.jenis === 'IN') shopeeIn += rm; else shopeeOut += rm;
            }
        });

        setTxt('summary-baki-kebun', fmt(inKebun - outKebun));
        setTxt('summary-baki-online', fmt(inOnline - outOnline));
        setTxt('summary-shopee', fmt(shopeeIn - shopeeOut));
        setTxt('summary-in', fmt(totalIn));
        setTxt('summary-out', fmt(totalOut));
        setTxt('summary-jualan', fmt(jualan));
        setTxt('summary-modal', fmt(modal));
        setTxt('summary-hutang', fmt(hutangPel));
        setTxt('summary-hutang-kita', fmt(hutangKita));
    };

    // ---- 3. Butang "Lunas" pada jadual rekod ----
    window.tandaLunas = function (i) {
        var r = dataRekod[i];
        if (!r || r.status !== 'Hutang') return;
        var teks = (r.jenis === 'IN')
            ? 'Pelanggan dah bayar ' + r.jumlah + '? Rekod akan jadi Selesai dan masuk baki.'
            : 'Dah bayar ' + r.jumlah + '? Rekod akan jadi Selesai dan masuk baki.';
        if (!confirm(teks)) return;
        r.status = 'Selesai';
        r.tarikhLunas = new Date().toLocaleDateString('ms-MY');
        simpanSemuaKeCloud();
        if (typeof paparRekod === 'function') paparRekod();
        kemaskiniRingkasan();
        showToast('Hutang ditandakan Lunas!');
    };

    function tambahButangLunas() {
        var tbody = document.getElementById('tbody-rekod');
        if (!tbody) return;
        tbody.querySelectorAll('tr').forEach(function (tr) {
            var padamBtn = tr.querySelector('button[onclick^="padam("]');
            if (!padamBtn) return;
            var m = padamBtn.getAttribute('onclick').match(/padam\((\d+)\)/);
            if (!m) return;
            var idx = parseInt(m[1], 10);
            var r = dataRekod[idx];
            if (!r || r.status !== 'Hutang') return;
            var td = padamBtn.parentNode;
            if (td.querySelector('.btn-lunas')) return;
            var b = document.createElement('button');
            b.className = 'btn-lunas';
            b.innerText = '✅ Lunas';
            b.setAttribute('onclick', 'tandaLunas(' + idx + ')');
            b.style.cssText = 'display:block; margin-bottom:4px; background:#2e7d32; color:#fff; border:none; border-radius:5px; padding:4px 8px; font-size:11px; font-weight:bold; cursor:pointer; white-space:nowrap;';
            td.insertBefore(b, padamBtn);
        });
    }

    // Bungkus paparRekod sedia ada (termasuk yang mungkin diubah patch lain)
    var paparAsal = window.paparRekod;
    window.paparRekod = function () {
        if (typeof paparAsal === 'function') paparAsal.apply(this, arguments);
        tambahButangLunas();
    };

    sediakanKotak();
    if (typeof dataRekod !== 'undefined') {
        kemaskiniRingkasan();
        tambahButangLunas();
    }
})();
