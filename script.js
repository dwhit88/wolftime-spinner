class SpinningWheel {
  constructor() {
    this.names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"];
    this.isSpinning = false;
    this.wheel = document.getElementById("wheel");
    this.spinBtn = document.getElementById("spinBtn");
    this.result = document.getElementById("result");
    this.nameInput = document.getElementById("nameInput");
    this.addNameBtn = document.getElementById("addNameBtn");
    this.clearNamesBtn = document.getElementById("clearNamesBtn");
    this.nameList = document.getElementById("nameList");

    // Scoreboard elements
    this.scoreboardBtn = document.getElementById("scoreboardBtn");
    this.backBtn = document.getElementById("backBtn");
    this.scoreboardContainer = document.getElementById("scoreboardContainer");
    this.scoreboardTableBody = document.getElementById("scoreboardTableBody");
    this.container = document.querySelector(".container");

    this.init();
  }

  init() {
    this.renderWheel();
    this.renderNameList();
    this.bindEvents();
  }

  bindEvents() {
    this.spinBtn.addEventListener("click", () => this.spin());
    this.addNameBtn.addEventListener("click", () => this.addName());
    this.clearNamesBtn.addEventListener("click", () => this.clearNames());
    this.nameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.addName();
    });

    // Scoreboard events
    this.scoreboardBtn.addEventListener("click", () => this.showScoreboard());
    this.backBtn.addEventListener("click", () => this.showTrivia());
  }

  renderWheel() {
    this.wheel.innerHTML = "";

    if (this.names.length === 0) {
      this.wheel.innerHTML =
        '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; font-size: 18px;">Add some names first!</div>';
      return;
    }

    // Create a simple rectangular display
    const display = document.createElement("div");
    display.className = "name-display";
    display.textContent = this.names[0] || "Add some names first!";
    display.style.background = this.getNameGradient(this.names[0]);
    this.wheel.appendChild(display);
  }

  renderNameList() {
    this.nameList.innerHTML = "";
    this.names.forEach((name, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
                <span>${name}</span>
                <button onclick="wheel.removeName(${index})">Remove</button>
            `;
      this.nameList.appendChild(li);
    });
  }

  addName() {
    const name = this.nameInput.value.trim();
    if (name && !this.names.includes(name)) {
      this.names.push(name);
      this.nameInput.value = "";
      this.renderWheel();
      this.renderNameList();
    }
  }

  removeName(index) {
    this.names.splice(index, 1);
    this.renderWheel();
    this.renderNameList();
  }

  clearNames() {
    this.names = [];
    this.renderWheel();
    this.renderNameList();
    this.result.textContent = "";
  }

  spin() {
    if (this.isSpinning || this.names.length === 0) return;

    this.isSpinning = true;
    this.spinBtn.disabled = true;
    this.result.textContent = "";

    const display = this.wheel.querySelector(".name-display");
    if (!display) return;

    // Animate through names rapidly
    let counter = 0;
    const totalCycles = 60 + Math.floor(Math.random() * 20); // 60-80 cycles (6-8 seconds)
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * this.names.length);
      const randomName = this.names[randomIndex];
      display.textContent = randomName;
      display.style.background = this.getNameGradient(randomName);

      counter++;
      if (counter >= totalCycles) {
        clearInterval(interval);

        // Select final winner
        const winnerIndex = Math.floor(Math.random() * this.names.length);
        const winner = this.names[winnerIndex];

        // Show final result
        display.textContent = winner;
        display.style.background = this.getNameGradient(winner);
        this.result.textContent = `Winner: ${winner}!`;

        this.isSpinning = false;
        this.spinBtn.disabled = false;
      }
    }, 100); // Change name every 100ms
  }

  getNameGradient(name) {
    // Create a hash from the name to ensure consistent colors
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use the hash to select from predefined gradient pairs
    const gradients = [
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Purple
      "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", // Pink
      "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", // Blue
      "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", // Green
      "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", // Orange
      "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)", // Mint
      "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)", // Rose
      "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)", // Peach
      "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)", // Coral
      "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)", // Lavender
      "linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)", // Soft Pink
      "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)", // Warm Orange
    ];

    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  }

  showScoreboard() {
    this.container.style.display = "none";
    this.scoreboardContainer.style.display = "block";
    this.loadScoreboardData();
  }

  showTrivia() {
    this.scoreboardContainer.style.display = "none";
    this.container.style.display = "block";
  }

  async loadScoreboardData() {
    try {
      const response = await fetch("standup_scoreboard.csv");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const csvText = await response.text();
      const data = this.parseCSV(csvText);
      this.displayScoreboard(data);
    } catch (error) {
      console.error("Error loading scoreboard data:", error);
      this.displayScoreboard([]);
    }
  }

  parseCSV(csvText) {
    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",");
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      const row = {};
      headers.forEach((header, index) => {
        const value = index < values.length ? values[index].trim() : "";
        row[header.trim()] = value;
      });
      data.push(row);
    }

    return data;
  }

  displayScoreboard(data) {
    // Sort by points in descending order
    const sortedData = data.sort((a, b) => {
      const pointsA = parseInt(a.points) || 0;
      const pointsB = parseInt(b.points) || 0;
      return pointsB - pointsA;
    });

    this.scoreboardTableBody.innerHTML = "";

    sortedData.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.Name || ""}</td>
        <td>${row.isDev === "TRUE" ? "Developer" : "Non-Developer"}</td>
        <td>${row.questionsAsked || "0"}</td>
        <td>${row.questionsMissed || "0"}</td>
        <td>${row.questionsAnsweredCorrectly || "0"}</td>
        <td>${row.points || "0"}</td>
      `;
      this.scoreboardTableBody.appendChild(tr);
    });
  }
}

// Initialize the wheel when the page loads
let wheel;
document.addEventListener("DOMContentLoaded", () => {
  wheel = new SpinningWheel();
});
