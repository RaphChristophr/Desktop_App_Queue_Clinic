document.addEventListener("DOMContentLoaded", () => {
  const { ipcRenderer } = require("electron");

  // Get the query string from the URL
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const userId = urlParams.get("userId");

  // Send a request to fetch rekam medis data
  ipcRenderer.send("get-rekam-medis", userId);

  // Listen for the response with the rekam medis data
  ipcRenderer.on("get-rekam-medis-response", (event, rekamMedisData) => {
    const rekamMedisList = document.getElementById("rekamMedisList");
    rekamMedisList.innerHTML = ""; // Clear previous data

    if (rekamMedisData.length === 0) {
      rekamMedisList.innerHTML = "<p>No data available.</p>";
    } else {
      rekamMedisData.forEach(data => {
        const rekamMedisItem = document.createElement("div");
        rekamMedisItem.className = "rekam-medis-item";
        rekamMedisItem.innerHTML = `
          <p>Tanggal: ${data.tanggal}</p>
          <p>Jenis Tes: ${data.jenis_tes}</p>
          <p>Hasil: ${data.hasil}</p>
          <p>Instruksi: ${data.instruksi}</p>
          <p>Riwayat Penyakit: ${data.riwayat_penyakit}</p>
          <p>Riwayat Alergi: ${data.riwayat_alergi}</p>
          <p>Obat-obatan yang Dikonsumsi: ${data.obat_dikonsumsi}</p>
        `;
        rekamMedisList.appendChild(rekamMedisItem);
      });
    }
  });

  // Handle adding new rekam medis
  document.getElementById("addRekamMedis").addEventListener("click", () => {
    window.location.href = `inputRekamMedis.html?userId=${userId}`;
  });
});
