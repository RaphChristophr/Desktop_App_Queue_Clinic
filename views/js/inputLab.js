document.getElementById("jenisTes").addEventListener("change", function () {
  const formHasilTes = document.getElementById("formHasilTes");
  formHasilTes.innerHTML = ""; // Clear previous form fields

  if (this.value === "darah") {
    formHasilTes.innerHTML = `
      <label class="labelH3">Hasil Tes</label>
      <label for="hemoglobin">Hemoglobin</label>
      <input type="number" id="hemoglobin" name="hemoglobin" placeholder="Jawaban anda" />
      <label for="leukosit">Leukosit</label>
      <input type="number" id="leukosit" name="leukosit" placeholder="Jawaban anda" />
      <label for="trombisut">Trombisut</label>
      <input type="number" id="trombisut" name="trombisut" placeholder="Jawaban anda" />
    `;
  } else if (this.value === "kolesterol") {
    formHasilTes.innerHTML = `
      <label class="labelH3">Hasil Tes</label>
      <label for="kolesterolTotal">Kolesterol Total</label>
      <input type="number" id="kolesterolTotal" name="kolesterolTotal" placeholder="Jawaban anda" />
      <label for="hdl">HDL</label>
      <input type="number" id="hdl" name="hdl" placeholder="Jawaban anda" />
      <label for="ldl">LDL</label>
      <input type="number" id="ldl" name="ldl" placeholder="Jawaban anda" />
    `;
  }
});

// generate lab report
document.getElementById("labForm").addEventListener("submit", (event) => {
  event.preventDefault();

  // Get patient name from query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const patientName = urlParams.get("patientName");

  // Get form data
  const formData = new FormData(event.target);
  const tanggalPelaksanaan = formData.get("tanggalPelaksanaan");
  const jenisTes = formData.get("jenisTes");
  const instruksiDetailLainnya = formData.get("instruksiDetailLainnya");

  let hasilTes = {};
  if (jenisTes === "darah") {
    hasilTes = {
      hemoglobin: formData.get("hemoglobin"),
      leukosit: formData.get("leukosit"),
      trombisut: formData.get("trombisut"),
    };
  } else if (jenisTes === "kolesterol") {
    hasilTes = {
      kolesterolTotal: formData.get("kolesterolTotal"),
      hdl: formData.get("hdl"),
      ldl: formData.get("ldl"),
    };
  }

  // Send form data to main process
  ipcRenderer.send("generate-lab-pdf", {patientName, tanggalPelaksanaan, jenisTes, hasilTes, instruksiDetailLainnya});
});
