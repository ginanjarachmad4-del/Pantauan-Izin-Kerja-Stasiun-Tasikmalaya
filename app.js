const STORAGE_KEY = "pekerjaan_aktif";
let pekerjaanAktif = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const jobList   = document.getElementById("jobList");
const izinForm  = document.getElementById("izinForm");
const modalForm = document.getElementById("modalForm");
const modal     = document.getElementById("modal");
const jobIndex  = document.getElementById("jobIndex");
const jobInfo   = document.getElementById("jobInfo");
const docForm   = document.getElementById("docForm");
const fileInput = document.getElementById("file");
const permitDoc = document.getElementById("permitDoc");
const previewBox = document.getElementById("previewBox");
const imgPreview = document.getElementById("imgPreview");

function saveStorage(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pekerjaanAktif));
}

function showMenu(id){
  document.querySelectorAll(".menu").forEach(m=>m.style.display="none");
  document.getElementById(id).style.display="block";
}

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
  if(pekerjaanAktif.length===0){
    jobList.innerHTML="<li><i>Tidak ada pekerjaan aktif</i></li>";
    renderPermitDoc();
    return;
  }

  jobList.innerHTML="";
pekerjaanAktif.forEach((j,i)=>{
  jobList.innerHTML+=`
    <li>
      <b>${j.no}</b> - ${j.nama}

      <span class="status ${j.status}">
        ● ${j.status}
      </span>

      <small>${j.lokasi} | ${j.jam_mulai}</small><br>
      <button onclick="openModal(${i})">✅ Laporan Selesai</button>
    </li>`;
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

  if(pekerjaanAktif.some(p => p.no === fd.get("no_permit"))){
    alert("❌ No Permit sudah ada");
    btn.disabled = false;
    btn.innerText = "Kirim Laporan Mulai";
    return;
  }

  fetch("https://script.google.com/macros/s/AKfycbygXu2SKRinm3KYw0rFU3kqYCRX7eu4mdp94xnkKoq1aKX7U9yW_VMHWi8Xv-8gxczZDw/exec", {
    method: "POST",
    mode: "no-cors",
    body: fd
  });

  pekerjaanAktif.push({
    id: Date.now()
    no: fd.get("no_permit"),
    nama: fd.get("nama_pekerjaan"),
    lokasi: fd.get("lokasi"),
    jam_mulai: fd.get("realisasi_jam_mulai"),
    status: "PROSES"
  });

  saveStorage();
  renderList();
  izinForm.reset();

  btn.disabled = false;
  btn.innerText = "Kirim Laporan Mulai";

  showMenu("dokumen");
  alert("✅ Laporan Mulai tersimpan");
};

/* ===== MODAL ===== */
function openModal(i){
  jobIndex.value = i;
  jobInfo.innerText = pekerjaanAktif[i].no+" - "+pekerjaanAktif[i].nama;
  modal.style.display="block";
}
function closeModal(){ modal.style.display="none"; }

modal.onclick = e => { if(e.target === modal) closeModal(); };

/* ===== SUBMIT SELESAI ===== */
modalForm.onsubmit = e => {
  e.preventDefault();
  const i = jobIndex.value;
  if(!confirm("Yakin laporan pekerjaan sudah selesai?")) return;

  const fd = new FormData(modalForm);
  fd.append("no_permit", pekerjaanAktif[i].no);

  fetch("https://script.google.com/macros/s/AKfycbygXu2SKRinm3KYw0rFU3kqYCRX7eu4mdp94xnkKoq1aKX7U9yW_VMHWi8Xv-8gxczZDw/exec", {
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

/* ===== UPLOAD DOKUMEN ===== */
docForm.onsubmit = e => {
  e.preventDefault();
  const f = fileInput.files[0];
  if (!f) return alert("Pilih file");

  const permit = permitDoc.value;
  if (!permit) return alert("Pilih permit");

  const r = new FileReader();
  r.onload = () => {
    const fd = new FormData();
    fd.append("action","upload_dokumentasi");
    fd.append("no_permit",permit);
    fd.append("filename",f.name);
    fd.append("mime",f.type);
    fd.append("file",r.result.split(",")[1]);

    fetch("https://script.google.com/macros/s/AKfycbygXu2SKRinm3KYw0rFU3kqYCRX7eu4mdp94xnkKoq1aKX7U9yW_VMHWi8Xv-8gxczZDw/exec", {
      method:"POST",
      mode:"no-cors",
      body:fd
    });

    alert("📸 Dokumentasi terkirim");
    docForm.reset();
    previewBox.style.display="none";
  };
  r.readAsDataURL(f);
};

/* ===== PREVIEW ===== */
fileInput.onchange = function(){
  const file = this.files[0];
  if(!file || !file.type.startsWith("image/")) return;
  if(file.size > 5*1024*1024) return alert("Maks 5MB");

  const r = new FileReader();
  r.onload = e=>{
    imgPreview.src=e.target.result;
    previewBox.style.display="block";
  };
  r.readAsDataURL(file);
};
