const {app, BrowserWindow, ipcMain, screen, nativeImage, shell} = require("electron");
const path = require("path");
const fs = require("fs");
const db = require("./database");
const jsPDF = require("jspdf").jsPDF;

let mainWindow;
let queueWindow;

// Function to create the main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("./views/login.html");
}

function createQueueWindow() {
  // Get the primary display's width
  const {width} = screen.getPrimaryDisplay().workAreaSize;

  queueWindow = new BrowserWindow({
    width: 400,
    height: 200,
    x: width - 400, // Position the queue window to the right edge of the screen
    y: 0,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Load the queue HTML file
  queueWindow.loadFile("./views/queue.html");

  // Cleanup queueWindow on close
  queueWindow.on("closed", () => {
    queueWindow = null;
  });
}

app.on("ready", () => {
  createWindow();
  createQueueWindow();
});

// Handle login attempts
ipcMain.on("login-attempt", (event, username, password) => {
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
    if (err) {
      console.error(err);
      event.reply("login-response", "error");
    } else if (row) {
      event.reply("login-response", "success");
      mainWindow.loadFile("./views/home.html");
    } else {
      event.reply("login-response", "fail");
    }
  });
});

ipcMain.on("get-current-queue-number", (event) => {
  db.get("SELECT current_number FROM antrian_sekarang WHERE id = 1", (err, row) => {
    if (err) {
      console.error("Error fetching current queue number:", err);
      event.reply("current-queue-number", null);
    } else {
      const currentQueueNumber = row ? row.current_number : 0;
      event.reply("current-queue-number", currentQueueNumber);
    }
  });
});

ipcMain.on("update-queue-number", (event, newQueueNumber) => {
  console.log("Received request to update queue number:", newQueueNumber);
  const query = "UPDATE antrian_sekarang SET current_number = ? WHERE id = 1;";
  db.run(query, [newQueueNumber], function (err) {
    if (err) {
      console.error("Error updating queue number:", err);
      event.reply("queue-number-updated", {success: false});
    } else {
      console.log("Queue number updated successfully:", newQueueNumber);
      event.reply("queue-number-updated", {success: true, newQueueNumber: newQueueNumber});
      queueWindow.webContents.send("queue-number-updated", newQueueNumber);
    }
  });
});

// IPC event for adding a new queue entry
ipcMain.on("add-antrian", (event, data) => {
  const {nama_pasien, kontak, tanggal, jam, alamat, jenis_layanan} = data;

  // First, get the current maximum nomor_antrian
  db.get("SELECT MAX(nomor_antrian) AS maxAntrian FROM antrian", (err, row) => {
    if (err) {
      console.error("Error fetching max nomor_antrian:", err);
      event.reply("add-antrian-response", "error");
      return;
    }

    const nextNomorAntrian = (row.maxAntrian || 0) + 1; // Increment the max value by 1

    // Then, insert the new entry with the calculated nomor_antrian
    db.run(
      `INSERT INTO antrian (nama_pasien, kontak, tanggal, jam, alamat, jenis_layanan, nomor_antrian) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nama_pasien, kontak, tanggal, jam, alamat, jenis_layanan, nextNomorAntrian],
      (err) => {
        if (err) {
          console.error("Error inserting new antrian:", err);
          event.reply("add-antrian-response", "error");
        } else {
          event.reply("add-antrian-response", "success");
          mainWindow.loadFile("./views/home.html");
        }
      }
    );
  });
});

ipcMain.handle("get-antrian", async () => {
  const currentDate = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format

  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM antrian WHERE tanggal >= ? ORDER BY 
           CASE status
               WHEN 'waiting' THEN 1
               WHEN 'in-progress' THEN 2
               WHEN 'completed' THEN 3
               ELSE 4
           END, id`,
      [currentDate], // Add current date as a parameter
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
});

// Handle request to mark an entry as completed
// ipcMain.on("mark-as-completed", (event, userId) => {
//   const query = `UPDATE antrian SET status = 'completed' WHERE id = ?`;
//   db.run(query, [userId], function (err) {
//     if (err) {
//       event.reply("mark-as-completed-response", {success: false});
//     } else {
//       event.reply("mark-as-completed-response", {success: true});
//     }
//   });
// });

// Handle request to mark an entry as cancelled
ipcMain.on("mark-as-cancelled", (event, userId) => {
  // Mengubah nama pesan menjadi "mark-as-cancelled"
  const query = `UPDATE antrian SET status = 'cancelled' WHERE id = ?`; // Mengubah status ke "cancelled"
  db.run(query, [userId], function (err) {
    if (err) {
      event.reply("mark-as-cancelled-response", {success: false}); // Mengirim respons dengan pesan yang sesuai
    } else {
      event.reply("mark-as-cancelled-response", {success: true});
    }
  });
});

// Handle request to fetch details of a specific queue entry
ipcMain.on("get-antrian-detail", (event, id) => {
  db.get("SELECT * FROM antrian WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error(err);
      event.reply("get-antrian-detail-response", null);
    } else {
      event.reply("get-antrian-detail-response", row);
    }
  });
});

// Handle update antrian status
ipcMain.on("update-antrian-status", (event, data) => {
  const {userId, status} = data;
  db.run(`UPDATE antrian SET status = ? WHERE id = ?`, [status, userId], (err) => {
    if (err) {
      console.error(err);
      event.reply("update-antrian-status-response", {success: false});
    } else {
      event.reply("update-antrian-status-response", {success: true});
    }
  });
});

// handle pdf generator
ipcMain.on("generate-pdf", (event, formData) => {
  const {patientName, doctorName, medication, dosage, frequency, otherInstructions} = formData;

  // Create a new jsPDF instance
  const doc = new jsPDF();

  // Load logo image using nativeImage
  const logoPath = path.join(__dirname, "views", "img", "logo.png");
  const logoImage = nativeImage.createFromPath(logoPath);

  // Convert logo image to base64
  const logoBase64 = logoImage.toDataURL();

  // Add logo
  doc.addImage(logoBase64, "PNG", 20, 10, 30, 30);

  // Hospital name and other content...
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Hospital Name", 55, 20); // Adjust the x-coordinate for alignment
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Hospital Address Line 1", 55, 30);
  doc.text("Hospital Address Line 2", 55, 35);
  doc.text("Phone: (123) 456-7890", 55, 40);
  doc.text("Email: info@hospital.com", 55, 45);

  // Add a horizontal line
  doc.setLineWidth(0.5);
  doc.line(20, 50, 190, 50);

  // Set title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Medical Prescription", 105, 60, {align: "center"});

  // Add doctor name and patient name
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Doctor Information", 20, 70);
  doc.setFont("helvetica", "normal");
  doc.text(`Doctor Name: ${doctorName}`, 20, 80);
  doc.text(`Patient Name: ${patientName}`, 20, 90);

  // Add medication
  doc.setFont("helvetica", "bold");
  doc.text("Prescription Details", 20, 100);
  doc.setFont("helvetica", "normal");
  const medicationLines = doc.splitTextToSize(medication, 170);
  doc.text(`Medication:`, 20, 110);
  doc.text(medicationLines, 20, 120);

  // Add dosage and frequency
  const dosageAndFrequencyStartY = 120 + medicationLines.length * 10;
  doc.text(`Dosage: ${dosage}`, 20, dosageAndFrequencyStartY);
  doc.text(`Frequency: ${frequency}`, 20, dosageAndFrequencyStartY + 10);

  // Add other instructions
  const otherInstructionsStartY = dosageAndFrequencyStartY + 20;
  doc.text(`Other Instructions:`, 20, otherInstructionsStartY);
  const otherInstructionsLines = doc.splitTextToSize(otherInstructions, 170);
  doc.text(otherInstructionsLines, 20, otherInstructionsStartY + 10);
  // Save the PDF to a specific folder with a specific name
  const specificFolderPath = path.join(__dirname, "pdfs");
  const specificFileName = `prescription_${patientName.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
  const pdfPath = path.join(specificFolderPath, specificFileName);

  // Ensure the directory exists
  if (!fs.existsSync(specificFolderPath)) {
    fs.mkdirSync(specificFolderPath);
  }

  // Save the PDF file
  fs.writeFileSync(pdfPath, doc.output(), "binary");

  shell.openPath(pdfPath);

  // Send a response back to the renderer process
  event.reply("pdf-generated", pdfPath);
});

// handle pdf generator for lab results
ipcMain.on("generate-lab-pdf", (event, formData) => {
  const {patientName, tanggalPelaksanaan, jenisTes, hasilTes, instruksiDetailLainnya} = formData;

  // Create a new jsPDF instance
  const doc = new jsPDF();

  // Load logo image using nativeImage
  const logoPath = path.join(__dirname, "views", "img", "logo.png");
  const logoImage = nativeImage.createFromPath(logoPath);

  // Convert logo image to base64
  const logoBase64 = logoImage.toDataURL();

  // Add logo
  doc.addImage(logoBase64, "PNG", 20, 10, 30, 30);

  // Hospital name and other content...
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Hospital Name", 55, 20); // Adjust the x-coordinate for alignment
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Hospital Address Line 1", 55, 30);
  doc.text("Hospital Address Line 2", 55, 35);
  doc.text("Phone: (123) 456-7890", 55, 40);
  doc.text("Email: info@hospital.com", 55, 45);

  // Add a horizontal line
  doc.setLineWidth(0.5);
  doc.line(20, 50, 190, 50);

  // Set title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Lab Test Results", 105, 60, {align: "center"});

  // Add patient name and test date
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Patient Information", 20, 70);
  doc.setFont("helvetica", "normal");
  doc.text(`Patient Name: ${patientName}`, 20, 80);
  doc.text(`Test Date: ${tanggalPelaksanaan}`, 20, 90);

  // Add test results
  doc.setFont("helvetica", "bold");
  doc.text("Test Results", 20, 100);
  doc.setFont("helvetica", "normal");
  let resultY = 110;

  for (const [key, value] of Object.entries(hasilTes)) {
    doc.text(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`, 20, resultY);
    resultY += 10;
  }

  // Add other instructions
  doc.setFont("helvetica", "bold");
  doc.text("Additional Instructions", 20, resultY + 10);
  doc.setFont("helvetica", "normal");
  const otherInstructionsLines = doc.splitTextToSize(instruksiDetailLainnya, 170);
  doc.text(otherInstructionsLines, 20, resultY + 20);

  // Save the PDF to a specific folder with a specific name
  const specificFolderPath = path.join(__dirname, "pdfs");
  const specificFileName = `lab_result_${patientName.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
  const pdfPath = path.join(specificFolderPath, specificFileName);

  // Ensure the directory exists
  if (!fs.existsSync(specificFolderPath)) {
    fs.mkdirSync(specificFolderPath);
  }

  // Save the PDF file
  fs.writeFileSync(pdfPath, doc.output(), "binary");

  // Open the PDF file with the default PDF viewer
  shell.openPath(pdfPath);

  // Send a response back to the renderer process
  event.reply("lab-pdf-generated", pdfPath);
});

// save rekam medis
ipcMain.on("save-rekam-medis", (event, data) => {
  const {userId, tanggal, jenisTes, hasil, instruksi, riwayatPenyakit, riwayatAlergi, obatDikonsumsi} = data;
  db.run(
    `INSERT INTO rekam_medis (user_id, tanggal, jenis_tes, hasil, instruksi, riwayat_penyakit, riwayat_alergi, obat_dikonsumsi) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, tanggal, jenisTes, hasil, instruksi, riwayatPenyakit, riwayatAlergi, obatDikonsumsi],
    function (err) {
      if (err) {
        event.reply("save-rekam-medis-response", {success: false, message: err.message});
      } else {
        event.reply("save-rekam-medis-response", {success: true, userId});
      }
    }
  );
});

// get rekam medis
ipcMain.on("get-rekam-medis", (event, userId) => {
  db.all(`SELECT * FROM rekam_medis WHERE user_id = ?`, [userId], (err, rows) => {
    if (err) {
      event.reply("get-rekam-medis-response", []);
    } else {
      event.reply("get-rekam-medis-response", rows);
    }
  });
});

app.on("before-quit", () => {
  db.run("UPDATE antrian_sekarang SET current_number = 0 WHERE id = 1", (err) => {
    if (err) {
      console.error("Error resetting queue number on app quit:", err);
    } else {
      console.log("Queue number reset to 0 on app quit.");
    }
  });
});

// Quit the app when all windows are closed, except on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Recreate the window when the app is activated (macOS)
// app.on("activate", () => {
//   if (BrowserWindow.getAllWindows().length === 0) {
//     createWindow();
//   }
// });

app.on("activate", () => {
  // Re-create a window if none exist when the app is activated
  if (mainWindow === null) {
    createWindow();
  }
  if (queueWindow === null) {
    createQueueWindow();
  }
});
