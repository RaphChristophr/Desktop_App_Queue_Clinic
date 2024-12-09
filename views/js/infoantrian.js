document.addEventListener("DOMContentLoaded", () => {
  const {ipcRenderer} = require("electron"); // Import ipcRenderer from Electron for inter-process communication

  // Get the query string from the URL
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString); // Parse the query string
  const userId = urlParams.get("userId"); // Get the userId from the URL parameters

  // Mapping of service types to specialists
  const dokterSpesialisMapping = {
    "Pemeriksaan Lab": "Dr. Spesialis Lab",
    "Pemeriksaan Umum": "Dr. Umum",
  };

  // Send a request to fetch details of the selected queue entry
  ipcRenderer.send("get-antrian-detail", userId);

  // Listen for the response with the queue details
  ipcRenderer.on("get-antrian-detail-response", (event, antrian) => {
    if (antrian) {
      // Populate the detail fields with the received data
      document.getElementById("nama-pasien").textContent = `Nama Lengkap : ${antrian.nama_pasien}`;
      document.getElementById("kontak").textContent = `Kontak : ${antrian.kontak}`;
      document.getElementById("alamat").textContent = `Alamat : ${antrian.alamat}`;
      document.getElementById("jenis-layanan").textContent = `Jenis Pelayanan : ${antrian.jenis_layanan}`;
      document.getElementById("no-antrian").textContent = `No. Antrian : ${antrian.id}`;
      document.getElementById("dokter-spesialis").textContent = `Dokter Spesialis : ${
        dokterSpesialisMapping[antrian.jenis_layanan] || "Tidak Diketahui"
      }`;
      document.getElementById("tanggal-janji").textContent = `Tanggal Janji Temu : ${antrian.tanggal}`;
      document.getElementById("waktu-janji").textContent = `Waktu Janji Temu : ${antrian.jam}`;

      document.getElementById("resep-link").href = `inputTesResep.html?patientName=${encodeURIComponent(antrian.nama_pasien)}`;
      document.getElementById("lab-link").href = `inputLab.html?patientName=${encodeURIComponent(antrian.nama_pasien)}`;
    }
  });

  // // Handle "Selesai" button click
  // const selesaiButton = document.getElementById("selesaiButton");
  // selesaiButton.addEventListener("click", () => {
  //   ipcRenderer.send("mark-as-completed", userId);
  // });

  // ipcRenderer.on("mark-as-completed-response", (event, response) => {
  //   if (response.success) {
  //     alert("Antrian berhasil diselesaikan.");
  //     window.location.href = "home.html";
  //   } else {
  //     alert("Gagal menyelesaikan antrian.");
  //   }
  // });

  // show hidden dropdown

  const generateMoreButton = document.getElementById("generate-more");
  const moreOptions = document.querySelector(".showMore");

  generateMoreButton.addEventListener("click", function () {
    if (moreOptions.style.display === "none" || moreOptions.style.display === "") {
      moreOptions.style.display = "flex";
    } else {
      moreOptions.style.display = "none";
    }
  });

  const generateReportButton = document.getElementById("generate-report");
  const reportOptions = document.querySelector(".dropdown");

  generateReportButton.addEventListener("click", function () {
    if (reportOptions.style.display === "none" || reportOptions.style.display === "") {
      reportOptions.style.display = "flex";
    } else {
      reportOptions.style.display = "none";
    }
  });

  const generateStatusButton = document.getElementById("statusButton");
  const statusOptions = document.querySelector(".dropdown-status");

  generateStatusButton.addEventListener("click", function () {
    if (statusOptions.style.display === "none" || statusOptions.style.display === "") {
      statusOptions.style.display = "flex";
    } else {
      statusOptions.style.display = "none";
    }
  });

  /// Handle status updates
  const updateStatus = (status) => {
    ipcRenderer.send("update-antrian-status", {userId, status});
  };

  const inProgressButton = document.getElementById("inProgress");
  inProgressButton.addEventListener("click", () => updateStatus("in-progress"));

  const completeButton = document.getElementById("complete");
  completeButton.addEventListener("click", () => updateStatus("completed"));

  const cancelButton = document.getElementById("cancelButton");
  cancelButton.addEventListener("click", () => updateStatus("cancelled"));

  ipcRenderer.on("update-antrian-status-response", (event, response) => {
    if (response.success) {
      alert("Status antrian berhasil diperbarui.");
      window.location.href = "home.html";
    } else {
      alert("Gagal memperbarui status antrian.");
    }
  });

  document.getElementById("info-rekam-medis").addEventListener("click", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("userId");
    window.location.href = `rekamMedis.html?userId=${userId}`;
  });
});
