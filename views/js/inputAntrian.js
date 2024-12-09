document.addEventListener("DOMContentLoaded", function () {
  // Restrict the input of the contact field to numbers only
  document.getElementById("kontak").addEventListener("input", function (event) {
    this.value = this.value.replace(/[^0-9]/g, ""); // Remove any non-numeric characters
  });

  const {ipcRenderer} = require("electron"); // Import ipcRenderer from Electron for inter-process communication

  // Handle the form submission
  document.getElementById("antrianForm").addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the default form submission behavior

    const formData = new FormData(event.target); // Get the form data
    const data = {
      nama_pasien: formData.get("nama_pasien"),
      kontak: formData.get("kontak"),
      tanggal: formData.get("tanggal"),
      jam: formData.get("jam"),
      alamat: formData.get("alamat"),
      jenis_layanan: formData.get("jenis_layanan"),
    };

    ipcRenderer.send("add-antrian", data); // Send the form data to the main process

    ipcRenderer.on("add-antrian-response", (event, response) => {
      if (response === "success") {
        alert("Antrian ditambahkan");
      } else if (response === "error") {
        alert("Invalid data");
      } else {
        alert("An error occurred. Please try again.");
      }
    });
  });
});
