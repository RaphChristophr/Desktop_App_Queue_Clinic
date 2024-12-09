document.addEventListener("DOMContentLoaded", () => {
  const {ipcRenderer} = require("electron");

  ipcRenderer.on("queue-number-updated", (event, newQueueNumber) => {
    const queueNumberElement = document.getElementById("queue-number");
    queueNumberElement.textContent = `Nomor Antrian: ${newQueueNumber}`;
  });
});
