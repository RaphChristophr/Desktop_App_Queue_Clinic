function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  ipcRenderer.send("login-attempt", username, password);

  ipcRenderer.on("login-response", (event, response) => {
    if (response === "success") {
      alert("Login successful!");
    } else if (response === "fail") {
      alert("Invalid credentials!");
    } else {
      alert("An error occurred. Please try again.");
    }
  });
}


// Add event listeners to input fields
document.getElementById('username').addEventListener('keypress', function(event) {
  if (event.key === 'Enter') {
    login();
  }
});

document.getElementById('password').addEventListener('keypress', function(event) {
  if (event.key === 'Enter') {
    login();
  }
});