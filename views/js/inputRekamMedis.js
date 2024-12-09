const {ipcRenderer} = require("electron");

document.getElementById("rekamMedisForm").addEventListener("submit", (event) => {
  event.preventDefault();

  // Get form data
  const formData = new FormData(event.target);
  const tanggal = formData.get("tanggal");
  const jenisTes = formData.get("jenisTes");
  const hasil = formData.get("hasil");
  const instruksi = formData.get("instruksi");
  const riwayatPenyakit = formData.get("riwayatPenyakit");
  const riwayatAlergi = formData.get("riwayatAlergi");
  const obatDikonsumsi = formData.get("obatDikonsumsi");

  // Get patient ID from query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("userId");

  // Send form data to main process
  ipcRenderer.send("save-rekam-medis", {userId, tanggal, jenisTes, hasil, instruksi, riwayatPenyakit, riwayatAlergi, obatDikonsumsi});
});

// Handle response from main process
ipcRenderer.on("save-rekam-medis-response", (event, response) => {
  if (response.success) {
    alert("Rekam medis berhasil disimpan.");
    window.location.href = `rekamMedis.html?userId=${response.userId}`;
  } else {
    alert("Gagal menyimpan rekam medis.");
  }
});
