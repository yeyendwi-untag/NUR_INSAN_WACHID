/* Website Yayasan NUR INSAN WACHID — frontend statis (GitHub Pages) */
const S = { pub: null, adm: null, token: sessionStorage.getItem('niw_token'), tab: 'Pengurus', edit: null };
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const $ = (q) => document.querySelector(q);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rp = (n) => 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');
const num = (n) => Number(String(n ?? '').replace(/[^\d.-]/g, '')) || 0;
const tgl = (s) => { if (!s) return '-'; const d = new Date(s); return isNaN(d) ? esc(s) : d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear(); };
const link = (u, t = 'Lihat file') => u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${t}</a>` : '-';
const driveImg = (u) => { const m = String(u || '').match(/\/d\/([\w-]+)/); return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w400` : ''; };
function toast(m, err) { const t = $('#toast'); t.textContent = m; t.className = 'show' + (err ? ' err' : ''); clearTimeout(t._h); t._h = setTimeout(() => (t.className = ''), 4000); }

// ---------- API ----------
const configured = () => window.CONFIG && /^https:\/\/script\.google\.com\//.test(CONFIG.SCRIPT_URL);
async function api(action, payload = {}) {
  const r = await fetch(CONFIG.SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action, token: S.token, ...payload }) });
  const j = await r.json();
  if (!j.ok) { if (j.auth) logout(true); throw new Error(j.error || 'Gagal'); }
  return j.data;
}
async function loadPublic() {
  const r = await fetch(CONFIG.SCRIPT_URL + '?action=public');
  const j = await r.json();
  if (!j.ok) throw new Error(j.error);
  S.pub = j.data;
}
function fileToB64(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res({ name: file.name, mimeType: file.type || 'application/octet-stream', data: String(fr.result).split(',')[1] });
    fr.onerror = rej; fr.readAsDataURL(file);
  });
}

// ---------- KONFIGURASI FORM ADMIN ----------
const SEL_STATUS = ['Rencana', 'Berjalan', 'Selesai', 'Ditunda'];
const FORMS = {
  Pengurus: { title: 'Pengurus', cols: ['urutan', 'nama', 'jabatan', 'telepon', 'foto'], fields: [
    ['nama', 'Nama Lengkap', 'text', 1], ['jabatan', 'Jabatan', 'text', 1], ['urutan', 'Urutan tampil (1 = paling atas)', 'number'],
    ['periode', 'Periode', 'text'], ['telepon', 'Telepon', 'text'], ['email', 'Email', 'email'], ['foto', 'Foto (JPG/PNG)', 'file']] },
  Agenda: { title: 'Agenda', cols: ['tanggal', 'judul', 'pic', 'status'], fields: [
    ['tanggal', 'Tanggal', 'date', 1], ['judul', 'Nama Kegiatan', 'text', 1], ['deskripsi', 'Deskripsi', 'textarea'],
    ['pic', 'Penanggung Jawab', 'text'], ['lokasi', 'Lokasi', 'text'], ['anggaran', 'Estimasi Anggaran (Rp)', 'number'], ['status', 'Status', SEL_STATUS]] },
  Keuangan: { title: 'Kas Masuk & Keluar', cols: ['tanggal', 'jenis', 'kategori', 'uraian', 'jumlah', 'bukti'], fields: [
    ['tanggal', 'Tanggal', 'date', 1], ['jenis', 'Jenis', ['Pemasukan', 'Pengeluaran'], 1],
    ['kategori', 'Kategori', ['Donasi', 'Infaq/Sedekah', 'Zakat', 'Hibah', 'Iuran', 'Operasional', 'Program/Kegiatan', 'Gaji/Honor', 'Sarana Prasarana', 'Lainnya']],
    ['uraian', 'Uraian', 'text', 1], ['jumlah', 'Jumlah (Rp)', 'number', 1], ['bukti', 'Bukti/Nota (gambar/PDF)', 'file']] },
  RAB: { title: 'RAB', cols: ['tahun', 'bulan', 'program', 'uraian', 'volume', 'harga'], fields: [
    ['tahun', 'Tahun', 'number', 1], ['bulan', 'Bulan', BULAN, 1], ['program', 'Program', 'text', 1], ['uraian', 'Uraian Belanja', 'text', 1],
    ['volume', 'Volume', 'number', 1], ['satuan', 'Satuan', 'text'], ['harga', 'Harga Satuan (Rp)', 'number', 1]] },
  SuratMasuk: { title: 'Surat Masuk', cols: ['tanggal_terima', 'nomor', 'pengirim', 'perihal', 'status', 'file'], fields: [
    ['tanggal_terima', 'Tanggal Diterima', 'date', 1], ['tanggal_surat', 'Tanggal Surat', 'date'], ['nomor', 'Nomor Surat', 'text', 1],
    ['pengirim', 'Pengirim / Instansi', 'text', 1], ['perihal', 'Perihal', 'text', 1], ['disposisi', 'Disposisi ke', 'text'],
    ['status', 'Status', ['Diterima', 'Diproses', 'Selesai']], ['file', 'Scan Surat (PDF/JPG)', 'file'], ['keterangan', 'Keterangan', 'textarea']] },
  SuratKeluar: { title: 'Surat Keluar', cols: ['tanggal', 'nomor', 'tujuan', 'perihal', 'status', 'file'] },
  Profil: { title: 'Profil Yayasan' },
  Password: { title: 'Ganti Password' }
};

// ---------- HALAMAN PUBLIK ----------
function pageBeranda() {
  const p = S.pub.profil, now = new Date();
  const k = S.pub.Keuangan, masuk = k.filter((r) => r.jenis === 'Pemasukan').reduce((a, r) => a + num(r.jumlah), 0);
  const keluar = k.filter((r) => r.jenis === 'Pengeluaran').reduce((a, r) => a + num(r.jumlah), 0);
  const up = S.pub.Agenda.filter((a) => new Date(a.tanggal) >= new Date(now.toDateString())).sort((a, b) => a.tanggal.localeCompare(b.tanggal)).slice(0, 3);
  const misi = String(p.misi || '').split('\n').filter(Boolean).map((m) => `<li>${esc(m)}</li>`).join('');
  return `
  <section class="hero"><div class="wrap"><span class="pill">Website Resmi</span><h1>${esc(p.nama)}</h1><p>${esc(p.tagline)}</p>
    <div class="hero-cta"><a class="btn gold" href="#keuangan">Lihat Transparansi Keuangan</a><a class="btn ghost" href="#agenda">Agenda Kegiatan</a></div></div></section>
  <section class="wrap stats">
    ${stat('Pengurus', S.pub.Pengurus.length)}${stat('Agenda', S.pub.Agenda.length)}${stat('Total Pemasukan', rp(masuk))}${stat('Saldo Kas', rp(masuk - keluar))}
  </section>
  <section class="wrap grid2">
    <div class="card"><h2>Visi</h2><p>${esc(p.visi)}</p><h2>Misi</h2><ul class="list">${misi}</ul></div>
    <div class="card"><h2>Agenda Terdekat</h2>${up.length ? up.map(agendaItem).join('') : '<p class="muted">Belum ada agenda mendatang.</p>'}</div>
  </section>
  <section class="wrap card"><h2>Tentang Kami</h2><p>${esc(p.sejarah)}</p><p class="muted">${esc(p.akta)}</p></section>`;
}
const stat = (l, v) => `<div class="stat"><small>${l}</small><b>${v}</b></div>`;
const badge = (s) => `<span class="badge b-${esc(String(s || '').toLowerCase())}">${esc(s || '-')}</span>`;
const agendaItem = (a) => `<div class="ag"><div class="ag-date"><b>${new Date(a.tanggal).getDate() || '-'}</b><small>${BULAN[new Date(a.tanggal).getMonth()]?.slice(0, 3) || ''}</small></div>
  <div><h3>${esc(a.judul)} ${badge(a.status)}</h3><p>${esc(a.deskripsi)}</p><small class="muted">${a.lokasi ? '📍 ' + esc(a.lokasi) + ' · ' : ''}${a.pic ? 'PJ: ' + esc(a.pic) : ''}${num(a.anggaran) ? ' · ' + rp(a.anggaran) : ''}</small></div></div>`;

function pageStruktur() {
  const list = [...S.pub.Pengurus].sort((a, b) => (num(a.urutan) || 99) - (num(b.urutan) || 99));
  if (!list.length) return wrapPage('Struktur Organisasi', '<p class="muted">Belum ada data pengurus.</p>');
  const top = list.slice(0, 1), rest = list.slice(1);
  const card = (m) => `<div class="member">${driveImg(m.foto) ? `<img src="${driveImg(m.foto)}" alt="Foto ${esc(m.nama)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'avatar',textContent:'${esc(m.nama).charAt(0)}'}))">` : `<div class="avatar">${esc(m.nama).charAt(0)}</div>`}
    <h3>${esc(m.nama)}</h3><p class="jab">${esc(m.jabatan)}</p>${m.periode ? `<small class="muted">Periode ${esc(m.periode)}</small>` : ''}</div>`;
  return wrapPage('Struktur Organisasi', `<div class="org-top">${top.map(card).join('')}</div><div class="org-line"></div><div class="org">${rest.map(card).join('')}</div>`);
}

function pageAgenda() {
  const yrs = [...new Set(S.pub.Agenda.map((a) => String(a.tanggal).slice(0, 4)))].sort().reverse();
  const y = S.fy || yrs[0] || String(new Date().getFullYear());
  const items = S.pub.Agenda.filter((a) => String(a.tanggal).startsWith(y)).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  const byM = BULAN.map((b, i) => ({ b, list: items.filter((a) => new Date(a.tanggal).getMonth() === i) })).filter((x) => x.list.length);
  return wrapPage('Agenda & Program Kerja Bulanan', `${yearSel(yrs, y)}${byM.length ? byM.map((m) => `<div class="card"><h2>${m.b} ${y}</h2>${m.list.map(agendaItem).join('')}</div>`).join('') : '<p class="muted">Belum ada agenda untuk tahun ini.</p>'}`);
}
function yearSel(yrs, y) {
  if (!yrs.includes(y)) yrs = [y, ...yrs];
  return `<div class="filters"><label>Tahun <select onchange="S.fy=this.value;render()">${yrs.map((v) => `<option ${v === y ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    <label>Tampilan <select onchange="S.per=this.value;render()">${['Bulanan', 'Triwulan', 'Tahunan'].map((v) => `<option ${v === (S.per || 'Bulanan') ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>`;
}
function groupPeriod(rows, getMonth, valFn) {
  const per = S.per || 'Bulanan';
  const keys = per === 'Bulanan' ? BULAN : per === 'Triwulan' ? ['Triwulan I (Jan–Mar)', 'Triwulan II (Apr–Jun)', 'Triwulan III (Jul–Sep)', 'Triwulan IV (Okt–Des)'] : ['Total Tahunan'];
  const out = keys.map((k) => ({ k, rows: [] }));
  rows.forEach((r) => { const m = getMonth(r); if (m < 0) return; out[per === 'Bulanan' ? m : per === 'Triwulan' ? Math.floor(m / 3) : 0].rows.push(r); });
  return out.map((o) => ({ ...o, v: valFn(o.rows) }));
}

function pageKeuangan() {
  const all = S.pub.Keuangan;
  const yrs = [...new Set(all.map((r) => String(r.tanggal).slice(0, 4)))].filter(Boolean).sort().reverse();
  const y = S.fy || yrs[0] || String(new Date().getFullYear());
  const rows = all.filter((r) => String(r.tanggal).startsWith(y)).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const sum = (rs, j) => rs.filter((r) => r.jenis === j).reduce((a, r) => a + num(r.jumlah), 0);
  const m = sum(rows, 'Pemasukan'), k = sum(rows, 'Pengeluaran');
  const g = groupPeriod(rows, (r) => new Date(r.tanggal).getMonth(), (rs) => ({ m: sum(rs, 'Pemasukan'), k: sum(rs, 'Pengeluaran') }));
  const max = Math.max(1, ...g.map((x) => Math.max(x.v.m, x.v.k)));
  return wrapPage('Transparansi Keuangan', `${yearSel(yrs, y)}
  <div class="stats">${stat('Pemasukan ' + y, rp(m))}${stat('Pengeluaran ' + y, rp(k))}${stat('Saldo ' + y, rp(m - k))}${stat('Jumlah Transaksi', rows.length)}</div>
  <div class="card"><h2>Rekap ${S.per || 'Bulanan'} ${y}</h2>
    <div class="chart">${g.map((x) => `<div class="bar-g"><div class="bars"><i class="in" style="height:${(x.v.m / max) * 100}%" title="${rp(x.v.m)}"></i><i class="out" style="height:${(x.v.k / max) * 100}%" title="${rp(x.v.k)}"></i></div><small>${x.k.split(' ')[0].slice(0, 3)}${x.k.includes('Triwulan') ? ' ' + x.k.split(' ')[1] : ''}</small></div>`).join('')}</div>
    <p class="legend"><i class="in"></i> Pemasukan <i class="out"></i> Pengeluaran</p>
    <div class="tbl"><table><thead><tr><th>Periode</th><th class="r">Pemasukan</th><th class="r">Pengeluaran</th><th class="r">Selisih</th></tr></thead><tbody>
    ${g.map((x) => `<tr><td>${x.k}</td><td class="r">${rp(x.v.m)}</td><td class="r">${rp(x.v.k)}</td><td class="r"><b>${rp(x.v.m - x.v.k)}</b></td></tr>`).join('')}
    </tbody><tfoot><tr><td>Total</td><td class="r">${rp(m)}</td><td class="r">${rp(k)}</td><td class="r">${rp(m - k)}</td></tr></tfoot></table></div></div>
  <div class="card"><h2>Rincian Transaksi (Lembar Pertanggungjawaban)</h2><div class="tbl"><table><thead><tr><th>Tanggal</th><th>Jenis</th><th>Kategori</th><th>Uraian</th><th class="r">Jumlah</th><th>Bukti</th></tr></thead><tbody>
    ${rows.map((r) => `<tr><td>${tgl(r.tanggal)}</td><td>${badge(r.jenis)}</td><td>${esc(r.kategori)}</td><td>${esc(r.uraian)}</td><td class="r">${rp(r.jumlah)}</td><td>${link(r.bukti, 'Bukti')}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">Belum ada transaksi.</td></tr>'}
  </tbody></table></div><button class="btn" onclick="window.print()">Cetak / Simpan PDF</button></div>`);
}

function pageRAB() {
  const all = S.pub.RAB;
  const yrs = [...new Set(all.map((r) => String(r.tahun)))].filter(Boolean).sort().reverse();
  const y = S.fy || yrs[0] || String(new Date().getFullYear());
  const rows = all.filter((r) => String(r.tahun) === y);
  const tot = (rs) => rs.reduce((a, r) => a + num(r.volume) * num(r.harga), 0);
  const g = groupPeriod(rows, (r) => BULAN.indexOf(r.bulan), tot);
  return wrapPage('Rencana Anggaran Belanja (RAB)', `${yearSel(yrs, y)}
  <div class="stats">${stat('Total RAB ' + y, rp(tot(rows)))}${stat('Jumlah Item', rows.length)}${stat('Program', new Set(rows.map((r) => r.program)).size)}</div>
  ${g.filter((x) => x.rows.length).map((x) => `<div class="card"><h2>${x.k} <span class="muted">— ${rp(x.v)}</span></h2><div class="tbl"><table><thead><tr><th>No</th><th>Bulan</th><th>Program</th><th>Uraian</th><th class="r">Vol</th><th>Satuan</th><th class="r">Harga Satuan</th><th class="r">Jumlah</th></tr></thead><tbody>
    ${x.rows.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.bulan)}</td><td>${esc(r.program)}</td><td>${esc(r.uraian)}</td><td class="r">${esc(r.volume)}</td><td>${esc(r.satuan)}</td><td class="r">${rp(r.harga)}</td><td class="r">${rp(num(r.volume) * num(r.harga))}</td></tr>`).join('')}
  </tbody><tfoot><tr><td colspan="7">Subtotal</td><td class="r">${rp(x.v)}</td></tr></tfoot></table></div></div>`).join('') || '<p class="muted">Belum ada RAB untuk tahun ini.</p>'}
  <button class="btn" onclick="window.print()">Cetak / Simpan PDF</button>`);
}
const wrapPage = (t, body) => `<section class="page-head"><div class="wrap"><h1>${t}</h1></div></section><section class="wrap">${body}</section>`;

// ---------- ADMIN ----------
function pageLogin() {
  return `<section class="wrap login"><form class="card" onsubmit="doLogin(event)"><h2>Masuk Admin</h2><p class="muted">Hanya admin yang dapat mengubah data website.</p>
    <label>Username<input name="u" required autocomplete="username"></label><label>Password<input name="p" type="password" required autocomplete="current-password"></label>
    <button class="btn gold full">Masuk</button></form></section>`;
}
async function doLogin(e) {
  e.preventDefault(); const f = e.target, b = f.querySelector('button'); b.disabled = true; b.textContent = 'Memeriksa…';
  try { const d = await api('login', { username: f.u.value, password: f.p.value }); S.token = d.token; sessionStorage.setItem('niw_token', d.token); await loadAdmin(); render(); toast('Selamat datang, Admin'); }
  catch (x) { toast(x.message, 1); b.disabled = false; b.textContent = 'Masuk'; }
}
function logout(silent) { if (!silent && S.token) api('logout').catch(() => {}); S.token = null; S.adm = null; sessionStorage.removeItem('niw_token'); if (!silent) toast('Anda telah keluar'); render(); }
async function loadAdmin() { S.adm = await api('readAll'); }

function pageAdmin() {
  if (!S.token) return pageLogin();
  if (!S.adm) { loadAdmin().then(render).catch((x) => toast(x.message, 1)); return '<div class="wrap loading">Memuat data admin…</div>'; }
  const tabs = Object.keys(FORMS).map((k) => `<button class="${S.tab === k ? 'on' : ''}" onclick="S.tab='${k}';S.edit=null;render()">${FORMS[k].title}</button>`).join('');
  let body;
  if (S.tab === 'Profil') body = profilForm();
  else if (S.tab === 'Password') body = passForm();
  else if (S.tab === 'SuratKeluar') body = suratKeluarForm() + table('SuratKeluar', false);
  else body = crudForm(S.tab) + table(S.tab, true);
  return `<section class="page-head"><div class="wrap row"><h1>Panel Admin</h1><button class="btn ghost" onclick="logout()">Keluar</button></div></section>
  <section class="wrap"><div class="tabs">${tabs}</div>${body}</section>`;
}
function field([k, label, type, req], v = '') {
  const r = req ? 'required' : '', star = req ? ' *' : '';
  if (Array.isArray(type)) return `<label>${label}${star}<select name="${k}" ${r}><option value="">— pilih —</option>${type.map((o) => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`;
  if (type === 'textarea') return `<label class="wide">${label}${star}<textarea name="${k}" rows="3" ${r}>${esc(v)}</textarea></label>`;
  if (type === 'file') return `<label>${label}${v ? ` <small>(${link(v, 'file saat ini')})</small>` : ''}<input type="file" name="${k}" accept="image/*,application/pdf"></label>`;
  return `<label>${label}${star}<input type="${type}" name="${k}" value="${esc(v)}" ${r} ${type === 'number' ? 'step="any"' : ''}></label>`;
}
function crudForm(sheet) {
  const F = FORMS[sheet], row = S.edit || {};
  return `<form class="card form" onsubmit="saveRow(event,'${sheet}')"><h2>${row.id ? 'Ubah' : 'Tambah'} ${F.title}</h2><div class="fgrid">${F.fields.map((f) => field(f, row[f[0]])).join('')}</div>
    <div class="row"><button class="btn gold">Simpan ke Google Sheet</button>${row.id ? '<button type="button" class="btn ghost" onclick="S.edit=null;render()">Batal</button>' : ''}</div></form>`;
}
async function saveRow(e, sheet) {
  e.preventDefault(); const f = e.target, b = f.querySelector('button'); b.disabled = true; b.textContent = 'Menyimpan…';
  try {
    const row = { ...(S.edit || {}) }; let file = null, fileField = null;
    for (const [k, , type] of FORMS[sheet].fields) {
      if (type === 'file') { const fl = f[k].files[0]; if (fl) { file = await fileToB64(fl); fileField = k; } }
      else row[k] = f[k].value;
    }
    await api('save', { sheet, row, file, fileField }); S.edit = null; await refresh(); toast('Data tersimpan di Google Sheet' + (file ? ' & file masuk Google Drive' : ''));
  } catch (x) { toast(x.message, 1); b.disabled = false; b.textContent = 'Simpan ke Google Sheet'; }
}
function table(sheet, editable) {
  const F = FORMS[sheet], rows = [...(S.adm[sheet] || [])].reverse(), q = (S.q || '').toLowerCase();
  const list = q ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q)) : rows;
  const cell = (r, c) => /file|foto|bukti/.test(c) ? link(r[c]) : /jumlah|harga|anggaran/.test(c) ? rp(r[c]) : /tanggal/.test(c) ? tgl(r[c]) : c === 'status' || c === 'jenis' ? badge(r[c]) : esc(r[c]);
  return `<div class="card"><div class="row"><h2>Arsip ${F.title} (${rows.length})</h2><input class="search" placeholder="Cari…" value="${esc(S.q || '')}" oninput="S.q=this.value;clearTimeout(window._q);window._q=setTimeout(()=>{render();const s=document.querySelector('.search');s.focus();s.setSelectionRange(s.value.length,s.value.length)},300)"></div>
  <div class="tbl"><table><thead><tr>${F.cols.map((c) => `<th>${c.replace('_', ' ')}</th>`).join('')}<th></th></tr></thead><tbody>
  ${list.map((r) => `<tr>${F.cols.map((c) => `<td>${cell(r, c)}</td>`).join('')}<td class="act">${editable ? `<button onclick="editRow('${sheet}','${esc(r.id)}')">Ubah</button>` : ''}<button class="del" onclick="delRow('${sheet}','${esc(r.id)}')">Hapus</button></td></tr>`).join('') || `<tr><td colspan="${F.cols.length + 1}" class="muted">Belum ada data.</td></tr>`}
  </tbody></table></div></div>`;
}
function editRow(sheet, id) { S.edit = S.adm[sheet].find((r) => String(r.id) === id); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
async function delRow(sheet, id) {
  if (!confirm('Hapus data ini dari Google Sheet? (File di Google Drive tetap tersimpan)')) return;
  try { await api('delete', { sheet, id }); await refresh(); toast('Data dihapus'); } catch (x) { toast(x.message, 1); }
}
async function refresh() { await Promise.all([loadAdmin(), loadPublic()]); render(); }

const JENIS_SURAT = ['Undangan', 'Pemberitahuan', 'Permohonan', 'Keputusan', 'Keterangan', 'Tugas', 'Lainnya'];
function suratKeluarForm() {
  const today = new Date().toISOString().slice(0, 10);
  return `<form class="card form" onsubmit="sendLetter(event)"><h2>Buat Surat Keluar Otomatis</h2>
  <p class="muted">Nomor surat dibuat otomatis. Surat dibuat dalam bentuk PDF berkop yayasan, disimpan di Google Drive, dicatat di Google Sheet, lalu dikirim lewat email (jika email tujuan diisi).</p>
  <div class="fgrid">${field(['jenis', 'Jenis Surat', JENIS_SURAT, 1])}${field(['tanggal', 'Tanggal Surat', 'date', 1], today)}
  ${field(['tujuan', 'Kepada (nama/instansi)', 'text', 1])}${field(['email', 'Email Tujuan (opsional)', 'email'])}
  ${field(['perihal', 'Perihal', 'text', 1])}${field(['lampiran', 'Lampiran (opsional, PDF/JPG)', 'file'])}
  ${field(['isi', 'Isi Surat', 'textarea', 1])}</div>
  <button class="btn gold">Buat PDF, Arsipkan & Kirim</button></form>`;
}
async function sendLetter(e) {
  e.preventDefault(); const f = e.target, b = f.querySelector('button'); b.disabled = true; b.textContent = 'Memproses surat…';
  try {
    const row = {}; ['jenis', 'tanggal', 'tujuan', 'email', 'perihal', 'isi'].forEach((k) => (row[k] = f[k].value));
    const fl = f.lampiran.files[0], file = fl ? await fileToB64(fl) : null;
    const r = await api('sendLetter', { row, file }); await refresh();
    toast(`Surat ${r.nomor} ${r.status === 'Terkirim' ? 'terkirim ke ' + r.email : 'tersimpan di arsip'}`);
  } catch (x) { toast(x.message, 1); b.disabled = false; b.textContent = 'Buat PDF, Arsipkan & Kirim'; }
}
const PROFIL_KEYS = [['nama', 'Nama Yayasan'], ['singkatan', 'Singkatan (untuk nomor surat)'], ['tagline', 'Tagline'], ['alamat', 'Alamat'], ['kota', 'Kota (untuk tanggal surat)'],
  ['telepon', 'Telepon'], ['email', 'Email'], ['akta', 'Akta / Legalitas'], ['ketua', 'Nama Ketua (penanda tangan)'], ['sekretaris', 'Nama Sekretaris'], ['visi', 'Visi', 'textarea'], ['misi', 'Misi (satu per baris)', 'textarea'], ['sejarah', 'Sejarah / Tentang', 'textarea']];
function profilForm() {
  const p = S.adm.profil;
  return `<form class="card form" onsubmit="saveProfil(event)"><h2>Profil Yayasan</h2><div class="fgrid">${PROFIL_KEYS.map(([k, l, t]) => field([k, l, t || 'text'], p[k])).join('')}</div><button class="btn gold">Simpan Profil</button></form>`;
}
async function saveProfil(e) {
  e.preventDefault(); const f = e.target, d = {}; PROFIL_KEYS.forEach(([k]) => (d[k] = f[k].value));
  try { await api('saveProfil', { data: d }); await refresh(); toast('Profil tersimpan'); } catch (x) { toast(x.message, 1); }
}
function passForm() {
  return `<form class="card form narrow" onsubmit="changePass(event)"><h2>Ganti Password Admin</h2>
  <label>Password Lama<input type="password" name="o" required></label><label>Password Baru (min. 8 karakter)<input type="password" name="n" minlength="8" required></label>
  <label>Ulangi Password Baru<input type="password" name="c" required></label><button class="btn gold">Ganti Password</button></form>`;
}
async function changePass(e) {
  e.preventDefault(); const f = e.target;
  if (f.n.value !== f.c.value) return toast('Konfirmasi password tidak sama', 1);
  try { await api('changePassword', { oldPassword: f.o.value, newPassword: f.n.value }); f.reset(); toast('Password berhasil diganti'); } catch (x) { toast(x.message, 1); }
}

// ---------- ROUTER ----------
const PAGES = { beranda: pageBeranda, struktur: pageStruktur, agenda: pageAgenda, keuangan: pageKeuangan, rab: pageRAB, admin: pageAdmin };
function render() {
  const r = (location.hash.slice(1) || 'beranda');
  document.querySelectorAll('.links a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + r));
  document.body.classList.remove('menu-open');
  if (!configured()) { $('#app').innerHTML = `<div class="wrap card setup"><h2>Website belum terhubung</h2><p>Buka file <code>config.js</code> lalu tempel URL Web App Google Apps Script. Lihat <b>PANDUAN.md</b>.</p></div>`; return; }
  if (!S.pub) return;
  $('#app').innerHTML = (PAGES[r] || pageBeranda)();
}
window.addEventListener('hashchange', () => { S.fy = null; S.q = ''; render(); window.scrollTo(0, 0); });
(async function init() {
  if (!configured()) return render();
  try {
    await loadPublic();
    const p = S.pub.profil; document.title = p.nama || document.title;
    $('#brandName').textContent = p.nama || ''; $('#brandTag').textContent = p.tagline || ''; $('#footName').textContent = p.nama || '';
    $('#footAddr').textContent = [p.alamat, p.telepon, p.email].filter(Boolean).join(' · ');
    render();
  } catch (x) { $('#app').innerHTML = `<div class="wrap card setup"><h2>Gagal memuat data</h2><p>${esc(x.message)}</p></div>`; }
})();
