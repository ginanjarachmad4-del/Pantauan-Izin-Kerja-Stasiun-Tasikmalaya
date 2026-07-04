let filterStatus = "ALL";
let searchQuery = "";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxdDejh6b4lOfwn1DfaR0TfWcii9D5D_Fwv6EoSSArrn2gOz62pvGXDyoHD_vYuvnFTCg/exec";

const STORAGE_KEY = "pekerjaan_aktif";
const LAST_DATE_KEY = "pekerjaan_tanggal";
let pekerjaanAktif = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const jobList   = document.getElementById("jobList");
const izinForm  = document.getElementById("izinForm");
const modalForm = document.getElementById("modalForm");
const modal     = document.getElementById("modal");
const aboutModal = document.getElementById("aboutModal");
const guideModal = document.getElementById("guideModal");
const helpModal = document.getElementById("helpModal");
const jobIndex  = document.getElementById("jobIndex");
const jobInfo   = document.getElementById("jobInfo");
const docForm   = document.getElementById("docForm");
const fileInput = document.getElementById("file");
const permitDoc = document.getElementById("permitDoc");
const previewBox = document.getElementById("previewBox");
const previewGrid = document.getElementById("previewGrid");
const previewCount = document.getElementById("previewCount");
const fileLabelText = document.getElementById("fileLabelText");

let selectedFiles = [];

/* ===== TAB / MENU SWITCHING ===== */
function showMenu(id, btn){
  document.querySelectorAll(".menu").forEach(m=>m.style.display="none");
  document.getElementById(id).style.display="block";

  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
  if(btn) btn.classList.add("active");

  if(id === "history") loadHistory();
}

/* ===== FILTER ===== */
function setFilter(status, btn){
  filterStatus = status;
  document.querySelectorAll(".filter-btn").forEach(b=>b.classList.remove("active"));
  if(btn) btn.classList.add("active");
  renderList();
}

document.getElementById("searchInput").oninput = (e) => {
  searchQuery = e.target.value.toLowerCase();
  renderList();
};

function saveStorage(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pekerjaanAktif));
}

/* ===== RESET HARIAN =====
   Setiap ganti hari (tanggal lokal berubah), daftar Pekerjaan Aktif
   dikosongkan otomatis. Data yang sudah terkirim tetap aman tersimpan
   di Spreadsheet dan bisa dilihat lagi lewat tab History. */
function getTodayStr(){
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}

(function resetHarian(){
  const todayStr = getTodayStr();
  const lastDate = localStorage.getItem(LAST_DATE_KEY);
  if (lastDate !== todayStr) {
    pekerjaanAktif = [];
    saveStorage();
    localStorage.setItem(LAST_DATE_KEY, todayStr);
  }
})();

document.querySelectorAll(".whatsapp").forEach(i=>{
  i.oninput=()=>i.value=i.value.replace(/\D/g,"").replace(/^0/,"62");
});

function renderPermitDoc(){
  permitDoc.innerHTML = "<option value=''>Pilih Permit</option>";
  pekerjaanAktif.forEach(p=>{
    permitDoc.innerHTML += `<option value="${p.no}">${p.no} - ${p.nama}</option>`;
  });
}

function renderList(){

  let data = pekerjaanAktif;

  // FILTER STATUS
  if(filterStatus !== "ALL"){
    data = data.filter(j => j.status === filterStatus);
  }

  // SEARCH
  if(searchQuery){
    data = data.filter(j =>
  (j.no || "").toLowerCase().includes(searchQuery) ||
  (j.nama || "").toLowerCase().includes(searchQuery)
);
  }

  jobList.innerHTML = "";

  if(data.length === 0){
    jobList.innerHTML = "<li><i>Tidak ada data</i></li>";
    return;
  }

 data.forEach((j)=>{
  const i = pekerjaanAktif.findIndex(p => p.id === j.id);

  jobList.innerHTML += `
    <li>
      <b>${j.no}</b> - ${j.nama}
      <span class="status ${j.status}">● ${j.status}</span>
      <small>${j.lokasi} | ${j.jam_mulai}</small>
      ${j.pic_nama ? `<small>👤 ${j.pic_nama} &middot; ${j.pic_nipp || "-"} &middot; ${j.pic_jabatan || "-"} &middot; ${j.pic_kedudukan || "-"}</small>` : ""}
      ${j.status !== "SELESAI" ? `<button class="btn-mini" onclick="openModal(${i})">✅ Laporan Selesai</button>` : ""}
    </li>
  `;
});

  renderPermitDoc();
}

renderList();

/* ===== SUBMIT MULAI ===== */
izinForm.onsubmit = e => {
  e.preventDefault();
  const btn = izinForm.querySelector("button[type='submit']");
  btn.disabled = true;
  btn.innerText = "Mengirim...";
  const fd = new FormData(izinForm);

  const inputNo   = (fd.get("no_permit") || "").trim().toLowerCase();
  const inputNama = (fd.get("nama_pekerjaan") || "").trim().toLowerCase();

  if(pekerjaanAktif.some(p =>
    (p.no || "").trim().toLowerCase() === inputNo &&
    (p.nama || "").trim().toLowerCase() === inputNama
  )){
    alert("❌ Pekerjaan ini sudah pernah dilaporkan dengan No Permit yang sama");
    btn.disabled = false;
    btn.innerText = "Kirim Laporan Mulai";
    return;
  }
  const newId = Date.now();

  fd.append("action", "laporan_mulai");
  fd.append("id", newId);
  fd.append("pic", `${fd.get("pic_nama")} | ${fd.get("pic_nipp")} | ${fd.get("pic_jabatan")} | ${fd.get("pic_kedudukan")}`);
  fetch(SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    body: fd
  });

  pekerjaanAktif.push({
    id: newId,
    no: fd.get("no_permit"),
    nama: fd.get("nama_pekerjaan"),
    lokasi: fd.get("lokasi"),
    jam_mulai: fd.get("realisasi_jam_mulai"),
    pic_nama: fd.get("pic_nama"),
    pic_nipp: fd.get("pic_nipp"),
    pic_jabatan: fd.get("pic_jabatan"),
    pic_kedudukan: fd.get("pic_kedudukan"),
    status: "PROSES"
  });

  saveStorage();
  renderList();
  izinForm.reset();

  btn.disabled = false;
  btn.innerText = "Kirim Laporan Mulai";

  showMenu("dokumen", document.querySelector('.nav-btn[data-menu="dokumen"]'));
  alert("✅ Laporan Mulai tersimpan");
};

/* ===== MODAL ===== */
function openModal(i){
  if(pekerjaanAktif[i] === undefined) return;

  jobIndex.value = Number(i);
  jobInfo.innerText = pekerjaanAktif[i].no + " - " + pekerjaanAktif[i].nama;
  modal.style.display = "flex";
}
function closeModal(){ modal.style.display="none"; }

modal.onclick = e => { if(e.target === modal) closeModal(); };

/* ===== MODAL: TENTANG SISTEM ===== */
function openAbout(){ aboutModal.style.display = "flex"; }
function closeAbout(){ aboutModal.style.display = "none"; }

aboutModal.onclick = e => { if(e.target === aboutModal) closeAbout(); };

/* ===== MODAL: PANDUAN PENGGUNA ===== */
function openGuide(){ guideModal.style.display = "flex"; }
function closeGuide(){ guideModal.style.display = "none"; }

guideModal.onclick = e => { if(e.target === guideModal) closeGuide(); };

/* ===== MODAL: KONTAK & BANTUAN ===== */
function openHelp(){ helpModal.style.display = "flex"; }
function closeHelp(){ helpModal.style.display = "none"; }

helpModal.onclick = e => { if(e.target === helpModal) closeHelp(); };

/* ===== SUBMIT SELESAI ===== */
modalForm.onsubmit = e => {
  e.preventDefault();
  const i = Number(jobIndex.value);
  if (!pekerjaanAktif[i]) {
    alert("Data tidak ditemukan");
    return;
  }
  if(!confirm("Yakin laporan pekerjaan sudah selesai?")) return;

  const fd = new FormData(modalForm);
  fd.append("action", "laporan_selesai");
  fd.append("id", pekerjaanAktif[i].id);
  fd.append("no_permit", pekerjaanAktif[i].no);

  fetch(SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    body: fd
  });

  pekerjaanAktif[i].status = "SELESAI";
  saveStorage();
  renderList();
  modalForm.reset();
  closeModal();
  alert("Laporan Selesai terkirim");
};

/* ===== UPLOAD DOKUMEN (MULTI FOTO) ===== */
docForm.onsubmit = e => {
  e.preventDefault();

  if (selectedFiles.length === 0) return alert("Pilih minimal 1 foto");

  const permit = permitDoc.value;
  if (!permit) return alert("Pilih permit");

  const btn = docForm.querySelector("button[type='submit']");
  btn.disabled = true;
  btn.innerText = "Mengupload...";

  const totalFiles = selectedFiles.length;
  let done = 0;

  selectedFiles.forEach(f => {
    const r = new FileReader();
    r.onload = () => {
      const fd = new FormData();
      fd.append("action", "upload_dokumentasi");
      fd.append("no_permit", permit);
      fd.append("filename", f.name);
      fd.append("mime", f.type);
      fd.append("file", r.result.split(",")[1]);

      fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: fd
      });

      done++;
      if (done === totalFiles) {
        alert(`📸 ${totalFiles} dokumentasi terkirim`);
        docForm.reset();
        selectedFiles = [];
        renderPreviews();
        btn.disabled = false;
        btn.innerText = "Upload";
      }
    };
    r.readAsDataURL(f);
  });
};

/* ===== PREVIEW (MULTI FOTO) ===== */
function updateFileInputFromSelected(){
  const dt = new DataTransfer();
  selectedFiles.forEach(f => dt.items.add(f));
  fileInput.files = dt.files;
}

function renderPreviews(){
  if (selectedFiles.length === 0) {
    previewBox.style.display = "none";
    previewGrid.innerHTML = "";
    fileLabelText.innerText = "📎 Pilih atau seret beberapa foto sekaligus";
    return;
  }

  fileLabelText.innerText = `✅ ${selectedFiles.length} foto dipilih`;
  previewCount.innerText = selectedFiles.length;
  previewBox.style.display = "block";
  previewGrid.innerHTML = "";

  selectedFiles.forEach((file, idx) => {
    const r = new FileReader();
    r.onload = e => {
      previewGrid.insertAdjacentHTML("beforeend", `
        <div class="preview-thumb">
          <img src="${e.target.result}">
          <button type="button" class="preview-remove" onclick="removePreview(${idx})" title="Hapus">✕</button>
        </div>
      `);
    };
    r.readAsDataURL(file);
  });
}

function removePreview(idx){
  selectedFiles.splice(idx, 1);
  updateFileInputFromSelected();
  renderPreviews();
}

fileInput.onchange = function(){
  const incoming = Array.from(this.files);
  const valid = [];

  incoming.forEach(file => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert(`${file.name} lebih dari 5MB, dilewati`);
      return;
    }
    valid.push(file);
  });

  selectedFiles = valid;
  updateFileInputFromSelected();
  renderPreviews();
};

/* ============================================================
   ===== KALKULATOR WAKTU EFEKTIF ===============================
   Waktu Efektif = Jatah Waktu Kerja - Istirahat - Total Senggang KA
   ============================================================ */

const senggangList = document.getElementById("senggangList");

function addSenggang(){
  const row = document.createElement("div");
  row.className = "senggang-row";
  const count = senggangList.querySelectorAll(".senggang-row").length + 1;
  row.innerHTML = `
    <input type="number" class="senggang-input" min="0" value="0" placeholder="Senggang ke-${count}">
    <button type="button" class="btn-remove" onclick="removeSenggang(this)" title="Hapus">✕</button>
  `;
  senggangList.appendChild(row);
}

function removeSenggang(btn){
  const rows = senggangList.querySelectorAll(".senggang-row");
  if(rows.length <= 1){
    // reset the single remaining row instead of removing it
    btn.closest(".senggang-row").querySelector(".senggang-input").value = 0;
    return;
  }
  btn.closest(".senggang-row").remove();
}

function hitungEfektif(){
  const jatah = Number(document.getElementById("jatahWaktu").value) || 0;
  const istirahat = Number(document.getElementById("istirahat").value) || 0;

  const senggangInputs = senggangList.querySelectorAll(".senggang-input");
  let totalSenggang = 0;
  senggangInputs.forEach(inp => totalSenggang += (Number(inp.value) || 0));

  const efektif = jatah - istirahat - totalSenggang;

  document.getElementById("resJatah").innerText = jatah + " menit";
  document.getElementById("resIstirahat").innerText = istirahat + " menit";
  document.getElementById("resSenggang").innerText = totalSenggang + " menit";

  const jam = Math.floor(Math.abs(efektif) / 60);
  const menit = Math.abs(efektif) % 60;
  const jamMenitText = `${jam} jam ${menit} menit`;

  const resEfektif = document.getElementById("resEfektif");
  const resEfektifJam = document.getElementById("resEfektifJam");
  const resultMainBox = document.getElementById("resultMainBox");

  if(efektif < 0){
    resEfektif.innerText = "-" + Math.abs(efektif) + " menit";
    resEfektifJam.innerText = "⚠️ Waktu tidak cukup (kurang " + jamMenitText + ")";
    resultMainBox.classList.add("negative");
  } else {
    resEfektif.innerText = efektif + " menit";
    resEfektifJam.innerText = "≈ " + jamMenitText;
    resultMainBox.classList.remove("negative");
  }

  document.getElementById("hasilEfektif").style.display = "block";
}

/* ============================================================
   ===== HISTORY PEKERJAAN (dari Spreadsheet via Apps Script) ===
   ============================================================ */

const historyList   = document.getElementById("historyList");
const historyDate   = document.getElementById("historyDate");
const historySearch = document.getElementById("historySearch");

let historyData = [];
let historyLoaded = false;

function loadHistory(){
  historyList.innerHTML = "<li><i>⏳ Memuat data history...</i></li>";

  const dateParam = historyDate.value ? `&date=${encodeURIComponent(historyDate.value)}` : "";

  fetch(`${SCRIPT_URL}?action=history${dateParam}`)
    .then(res => res.json())
    .then(data => {
      historyData = Array.isArray(data) ? data : [];
      historyLoaded = true;
      renderHistory();
    })
    .catch(() => {
      historyList.innerHTML = "<li><i>⚠️ Gagal memuat history. Cek koneksi internet lalu coba lagi.</i></li>";
    });
}

function renderHistory(){
  let data = historyData;
  const q = (historySearch.value || "").toLowerCase();

  if(q){
    data = data.filter(j =>
      (j.no_permit || "").toLowerCase().includes(q) ||
      (j.nama_pekerjaan || "").toLowerCase().includes(q)
    );
  }

  historyList.innerHTML = "";

  if(data.length === 0){
    historyList.innerHTML = "<li><i>Tidak ada data</i></li>";
    return;
  }

  data.forEach(j=>{
    const tgl = j.timestamp
      ? new Date(j.timestamp).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" })
      : "-";
    const status = j.status || "PROSES";

    historyList.innerHTML += `
      <li>
        <b>${j.no_permit || "-"}</b> - ${j.nama_pekerjaan || "-"}
        <span class="status ${status}">● ${status}</span>
        <small>📅 ${tgl} &middot; ${j.lokasi || "-"}</small>
        ${j.pic ? `<small>👤 ${j.pic}</small>` : ""}
      </li>
    `;
  });
}

historyDate.onchange = loadHistory;
historySearch.oninput = renderHistory;
