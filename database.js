const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const dbDir = path.join(__dirname, "database");
const dbPath = path.join(dbDir, "users.db");

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database opening error: ", err);
  } else {
    console.log("Database connected.");
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      password TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS antrian (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_pasien TEXT NOT NULL,
      kontak TEXT NOT NULL,
      tanggal TEXT NOT NULL,
      nomor_antrian INTEGER,
      jam TEXT NOT NULL,
      alamat TEXT NOT NULL,
      jenis_layanan TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT "waiting"
    )
  `);

  db.run(`CREATE TABLE IF NOT EXISTS rekam_medis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    tanggal TEXT,
    jenis_tes TEXT,
    hasil TEXT,
    instruksi TEXT,
    riwayat_penyakit TEXT,
    riwayat_alergi TEXT,
    obat_dikonsumsi TEXT
)`);

  db.run(`
  CREATE TABLE IF NOT EXISTS antrian_sekarang (
    id INTEGER PRIMARY KEY,
    current_number INTEGER NOT NULL
  )
`);

  db.run(`
INSERT INTO antrian_sekarang (current_number) VALUES (0);
`);

  db.get(`SELECT * FROM users WHERE username = ?`, ["admin"], (err, row) => {
    if (err) {
      console.error(err);
    } else if (!row) {
      db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, ["admin", "admin123"]);
    }
  });
});

module.exports = db;
