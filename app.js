const STORAGE_KEY = "pekerjaan_aktif";
let pekerjaanAktif = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

/* ELEMENT */
const jobList = document.getElementById("jobList");
const izinForm = document.getElementById("izinForm");
const modal = document.getElementById("modal");
const modalForm = document.getElementById("modalForm");
const jobIndex = document.getElementById("jobIndex");
const jobInfo = document.getElementById("jobInfo");
const docForm = document.getElementById("docForm");
const fileInput = document.getElementById("file");
const permitDoc = document.getElementById("permitDoc");
const previewBox = document.getElementById("previewBox");
const imgPreview = document.getElementById("imgPreview");

/* SAVE */
function saveStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pekerjaanAktif));
}

/* MENU */
function showMenu(id) {
  document.querySelectorAll(".menu").forEach(m => m.style.display = "none");
  document.getElementById(id).style.display = "block";
}

/* RENDER */
function renderList() {
  jobList.innerHTML = "";

  pekerjaanAktif.forEach((j, i) => {
    jobList.innerHTML += `
      <li>
        <b>${j.no}</b> - ${j.nama}<br>
        <small>${j.lokasi}</small><br>
        <button onclick="openModal(${i})">Selesai</button>
      </li>
    `;
  });

  renderPermit();
}

/* PERMIT */
function renderPermit() {
  permitDoc.innerHTML = "<option value=''>Pilih Permit</option>";
  pekerjaanAktif.forEach(p => {
    permitDoc.innerHTML += `<option value="${p.no}">${p.no}</option>`;
  });
}

renderList();

/* SUBMIT MULAI */
izinForm.onsubmit = e => {
  e.preventDefault();
  const fd = new FormData(izinForm);

  const dataBaru = {
  no_permit: fd.get("no_permit"),
  nama_pekerjaan: fd.get("nama_pekerjaan"),
  unit_kontraktor: fd.get("unit_kontraktor"),
  rencana_jam_mulai: fd.get("rencana_jam_mulai"),
  realisasi_jam_mulai: fd.get("realisasi_jam_mulai"),
  rencana_jam_selesai: fd.get("rencana_jam_selesai"),
  lokasi: fd.get("lokasi"),
  jenis_pekerjaan: fd.get("jenis_pekerjaan"),
  deskripsi: fd.get("deskripsi"),
  pic: fd.get("pic"),
  whatsapp: fd.get("whatsapp"),
  status: "PROSES",
  waktu_input: new Date().toISOString()
};

pekerjaanAktif.push(dataBaru);
saveStorage();
renderList();
izinForm.reset();

// kirim ke Google Sheet
sendToSheet(dataBaru);

/* MODAL */
function openModal(i) {
  jobIndex.value = i;
  jobInfo.innerText = pekerjaanAktif[i].no;
  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
}

/* SUBMIT SELESAI */
modalForm.onsubmit = e => {
  e.preventDefault();
  const i = jobIndex.value;

  pekerjaanAktif.splice(i, 1);
  saveStorage();
  renderList();
  closeModal();
};

/* UPLOAD */
docForm.onsubmit = e => {
  e.preventDefault();
  alert("upload dummy");
};

/* PREVIEW */
fileInput.onchange = e => {
  const file = e.target.files[0];
  const r = new FileReader();
  r.onload = ev => {
    imgPreview.src = ev.target.result;
    previewBox.style.display = "block";
  };
  r.readAsDataURL(file);
};

/* KIRIM KE SPREADSHEET */
const API_URL = "https://script.google.com/macros/s/AKfycbygXu2SKRinm3KYw0rFU3kqYCRX7eu4mdp94xnkKoq1aKX7U9yW_VMHWi8Xv-8gxczZDw/exec";

async function sendToSheet(data) {
  try {
    await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
  } catch (err) {
    console.log("Gagal kirim:", err);
  }
}
