// Wait for the DOM to fully load before executing the script
document.addEventListener("DOMContentLoaded", async () => {
  const {ipcRenderer} = require("electron"); // Import ipcRenderer from Electron for inter-process communication

  try {
    // Request the list of queue entries from the main process
    const antrianData = await ipcRenderer.invoke("get-antrian");
    const tableBody = document.querySelector("#antrian-table tbody"); // Get the table body element

    // Populate the table with the received data
    antrianData.forEach((antrian) => {
      // Determine the status class based on the status value
      let statusClass;
      switch (antrian.status.toLowerCase()) {
        case "waiting":
          statusClass = "status-waiting";
          break;
        case "in-progress":
          statusClass = "status-in-progress";
          break;
        case "completed":
          statusClass = "status-completed";
          break;
        case "cancelled":
          statusClass = "status-cancelled";
          break;
        default:
          statusClass = "";
      }

      const row = document.createElement("tr"); // Create a new table row
      row.innerHTML = `
        <td>${antrian.nomor_antrian}</td>
        <td>${antrian.jenis_layanan}</td>
        <td>${antrian.tanggal}</td>
        <td>${antrian.jam}</td>
        <td>${antrian.nama_pasien}</td>
        <td class="status ${statusClass}">${antrian.status}</td>
      `; // Set the row's inner HTML with the data

      // Add a click event to navigate to the detail page
      row.addEventListener("click", () => {
        window.location.href = `detail.html?userId=${antrian.id}`; // Redirect to the detail page with the userId
      });

      tableBody.appendChild(row); // Append the row to the table body
    });
  } catch (error) {
    console.error("Error fetching antrian data:", error); // Log any errors
  }

  // Calendar functionality
  let date = new Date(); // Get the current date
  let year = date.getFullYear();
  let month = date.getMonth();

  // Get references to calendar elements
  const day = document.querySelector(".calendar-dates");
  const currdate = document.querySelector(".calendar-current-date");
  const prenexIcons = document.querySelectorAll(".calendar-navigation span");

  // Array of month names
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  ipcRenderer.send("get-current-queue-number");

  ipcRenderer.on("current-queue-number", (event, currentQueueNumber) => {
    if (currentQueueNumber !== null) {
      queueNumber = currentQueueNumber;
      const queueNumberParagraph = document.getElementById("queue-now");
      queueNumberParagraph.textContent = `Antrian Sekarang: ${queueNumber}`;
    } else {
      console.error("Failed to fetch the current queue number");
    }
  });

  const callQueueButton = document.getElementById("call-queue-btn");
  callQueueButton.addEventListener("click", async () => {
    if (isNaN(queueNumber)) {
      console.error("Queue number is not a valid number");
      return;
    }

    queueNumber += 1;

    const audio = document.getElementById("audioElement");
    audio.play();

    ipcRenderer.send("update-queue-number", queueNumber);

    ipcRenderer.on("queue-number-updated", (event, {success, newQueueNumber}) => {
      if (success) {
        const queueNumberParagraph = document.getElementById("queue-now");
        queueNumberParagraph.textContent = `Antrian Sekarang: ${newQueueNumber}`;
      } else {
        console.error("Failed to update queue number");
      }
    });
  });

  // Function to manipulate the calendar display
  const manipulate = () => {
    let dayone = new Date(year, month, 1).getDay(); // Get the first day of the month
    let lastdate = new Date(year, month + 1, 0).getDate(); // Get the last date of the month
    let dayend = new Date(year, month, lastdate).getDay(); // Get the day of the week for the last date
    let monthlastdate = new Date(year, month, 0).getDate(); // Get the last date of the previous month

    let lit = "";

    // Add inactive days from the previous month
    for (let i = dayone; i > 0; i--) {
      lit += `<li class="inactive">${monthlastdate - i + 1}</li>`;
    }

    // Add days of the current month
    for (let i = 1; i <= lastdate; i++) {
      let isToday = i === date.getDate() && month === new Date().getMonth() && year === new Date().getFullYear() ? "active" : "";
      lit += `<li class="${isToday}">${i}</li>`;
    }

    // Add inactive days for the next month
    for (let i = dayend; i < 6; i++) {
      lit += `<li class="inactive">${i - dayend + 1}</li>`;
    }

    currdate.innerText = `${months[month]} ${year}`; // Set the current month and year
    day.innerHTML = lit; // Set the calendar days
  };

  manipulate(); // Initial call to display the calendar

  // Add event listeners for navigation icons
  prenexIcons.forEach((icon) => {
    icon.addEventListener("click", () => {
      month = icon.id === "calendar-prev" ? month - 1 : month + 1;

      // Adjust the year and month if necessary
      if (month < 0 || month > 11) {
        date = new Date(year, month, new Date().getDate());
        year = date.getFullYear();
        month = date.getMonth();
      } else {
        date = new Date();
      }

      manipulate(); // Update the calendar display
    });
  });
});
