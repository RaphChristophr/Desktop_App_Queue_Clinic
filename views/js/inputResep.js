const {ipcRenderer} = require("electron");

document.getElementById("pdfForm").addEventListener("submit", (event) => {
  event.preventDefault();

  // Get patient name from query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const patientName = urlParams.get("patientName");

  // Get form data
  const formData = new FormData(event.target);
  const doctorName = formData.get("namaDokter");
  const medication = formData.get("daftarObat");
  const dosage = formData.get("dosis");
  const frequency = formData.get("frekuensi");
  const otherInstructions = formData.get("inputLainnya");

  // Send form data to main process
  ipcRenderer.send("generate-pdf", {patientName, doctorName, medication, dosage, frequency, otherInstructions});
});
