class SpinningWheel {
  constructor() {
    this.names = [];
    this.isSpinning = false;
    this.wheel = document.getElementById("wheel");
    this.spinBtn = document.getElementById("spinBtn");
    this.result = document.getElementById("result");

    // Scoreboard elements
    this.scoreboardBtn = document.getElementById("scoreboardBtn");
    this.backBtn = document.getElementById("backBtn");
    this.scoreboardContainer = document.getElementById("scoreboardContainer");
    this.scoreboardTableBody = document.getElementById("scoreboardTableBody");
    this.updateBtn = document.getElementById("updateBtn");
    this.addPersonBtn = document.getElementById("addPersonBtn");
    this.container = document.querySelector(".container");
    this.isEditMode = false;
    this.selectedRows = new Set();

    // Modal elements
    this.addPersonModal = document.getElementById("addPersonModal");
    this.closeModalBtn = document.getElementById("closeModalBtn");
    this.newPersonName = document.getElementById("newPersonName");
    this.newPersonRole = document.getElementById("newPersonRole");
    this.addPersonSubmitBtn = document.getElementById("addPersonSubmitBtn");

    this.init();
  }

  async loadNamesFromCSV() {
    try {
      const response = await fetch("/api/scoreboard");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Filter out removed people and extract names
      this.names = data
        .filter((row) => row.isRemoved !== "TRUE")
        .map((row) => row.Name)
        .filter((name) => name && name.trim() !== ""); // Remove empty names

      this.renderWheel();
    } catch (error) {
      console.error("Error loading names from CSV:", error);
      // Fallback to empty array if there's an error
      this.names = [];
      this.renderWheel();
    }
  }

  init() {
    this.loadNamesFromCSV();
    this.renderWheel();
    this.bindEvents();
  }

  bindEvents() {
    this.spinBtn.addEventListener("click", () => this.spin());

    // Scoreboard events
    this.scoreboardBtn.addEventListener("click", () => this.showScoreboard());
    this.backBtn.addEventListener("click", () => this.showTrivia());
    this.updateBtn.addEventListener("click", () => this.toggleEditMode());
    this.addPersonBtn.addEventListener("click", () =>
      this.showAddPersonModal()
    );

    // Modal events
    this.closeModalBtn.addEventListener("click", () =>
      this.hideAddPersonModal()
    );
    this.addPersonSubmitBtn.addEventListener("click", () =>
      this.addNewPerson()
    );
    this.addPersonModal.addEventListener("click", (e) => {
      if (e.target === this.addPersonModal) {
        this.hideAddPersonModal();
      }
    });
    this.newPersonName.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.addNewPerson();
      }
    });
  }

  renderWheel() {
    this.wheel.innerHTML = "";

    if (this.names.length === 0) {
      this.wheel.innerHTML =
        '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; font-size: 18px;">No names available</div>';
      return;
    }

    // Create a simple rectangular display
    const display = document.createElement("div");
    display.className = "name-display";
    display.textContent = this.names[0] || "No names available";
    display.style.background = this.getNameGradient(this.names[0]);
    this.wheel.appendChild(display);
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
    // Reload names from CSV when switching back to trivia view
    this.loadNamesFromCSV();
  }

  async loadScoreboardData() {
    try {
      const response = await fetch("/api/scoreboard");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Filter out rows where isRemoved is TRUE
      const filteredData = data.filter((row) => row.isRemoved !== "TRUE");

      this.displayScoreboard(filteredData);
    } catch (error) {
      console.error("Error loading scoreboard data:", error);
      this.displayScoreboard([]);
    }
  }

  displayScoreboard(data) {
    // Sort by points in descending order
    const sortedData = data.sort((a, b) => {
      const pointsA = parseInt(a.points) || 0;
      const pointsB = parseInt(b.points) || 0;
      return pointsB - pointsA;
    });

    this.scoreboardTableBody.innerHTML = "";

    sortedData.forEach((row, index) => {
      const tr = document.createElement("tr");
      tr.dataset.rowIndex = index;
      tr.dataset.name = row.Name;

      if (this.isEditMode) {
        // In edit mode, add checkbox cell first
        tr.innerHTML = `
          <td><input type="checkbox" class="delete-checkbox"></td>
          <td>${row.Name || ""}</td>
          <td>${row.isDev === "TRUE" ? "Developer" : "Non-Developer"}</td>
          <td>${row.questionsAsked || "0"}</td>
          <td>${row.questionsMissed || "0"}</td>
          <td>${row.questionsAnsweredCorrectly || "0"}</td>
          <td>${row.points || "0"}</td>
        `;
      } else {
        // Normal mode, no checkbox
        tr.innerHTML = `
          <td>${row.Name || ""}</td>
          <td>${row.isDev === "TRUE" ? "Developer" : "Non-Developer"}</td>
          <td>${row.questionsAsked || "0"}</td>
          <td>${row.questionsMissed || "0"}</td>
          <td>${row.questionsAnsweredCorrectly || "0"}</td>
          <td>${row.points || "0"}</td>
        `;
      }

      this.scoreboardTableBody.appendChild(tr);
    });

    // Add event listeners for checkboxes if in edit mode
    if (this.isEditMode) {
      this.addCheckboxListeners();
    }
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;

    if (this.isEditMode) {
      this.updateBtn.textContent = "Save";
      this.updateBtn.classList.add("save-button");
      this.updateBtn.classList.remove("update-button");
      this.addDeleteColumn();
      // Reload the scoreboard data to show checkboxes
      this.loadScoreboardData();
    } else {
      this.updateBtn.textContent = "Update";
      this.updateBtn.classList.add("update-button");
      this.updateBtn.classList.remove("save-button");
      this.removeDeleteColumn();
      this.saveChanges();
    }
  }

  addDeleteColumn() {
    const thead = document.querySelector("#scoreboardTable thead tr");
    const deleteHeader = document.createElement("th");
    deleteHeader.textContent = "Delete";
    thead.insertBefore(deleteHeader, thead.firstChild);
  }

  removeDeleteColumn() {
    const thead = document.querySelector("#scoreboardTable thead tr");
    const deleteHeader = thead.querySelector("th");
    if (deleteHeader) {
      thead.removeChild(deleteHeader);
    }
    // Reload the scoreboard data to remove checkboxes
    this.loadScoreboardData();
  }

  addCheckboxListeners() {
    const checkboxes = document.querySelectorAll(".delete-checkbox");
    checkboxes.forEach((checkbox, index) => {
      checkbox.addEventListener("change", (e) => {
        const row = e.target.closest("tr");
        const name = row.dataset.name;

        if (e.target.checked) {
          this.selectedRows.add(name);
        } else {
          this.selectedRows.delete(name);
        }
      });
    });
  }

  async saveChanges() {
    if (this.selectedRows.size === 0) {
      this.loadScoreboardData();
      return;
    }

    try {
      // Convert Set to Array for API call
      const selectedNames = Array.from(this.selectedRows);

      // Send update request to server
      const response = await fetch("/api/scoreboard/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ selectedNames }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Store the count before clearing
      const removedCount = this.selectedRows.size;

      // Clear selected rows and reload data
      this.selectedRows.clear();
      this.loadScoreboardData();

      alert(result.message);
    } catch (error) {
      console.error("Error saving changes:", error);
      alert("Error saving changes. Please try again.");
    }
  }

  showAddPersonModal() {
    this.addPersonModal.style.display = "block";
    this.newPersonName.value = "";
    this.newPersonRole.value = "Developer";
    this.newPersonName.focus();
  }

  hideAddPersonModal() {
    this.addPersonModal.style.display = "none";
    this.newPersonName.value = "";
  }

  async addNewPerson() {
    const name = this.newPersonName.value.trim();
    const role = this.newPersonRole.value;

    if (!name) {
      alert("Please enter a name.");
      return;
    }

    try {
      const isDev = role === "Developer" ? "TRUE" : "FALSE";

      const response = await fetch("/api/scoreboard/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          isDev: isDev,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        this.hideAddPersonModal();
        this.loadScoreboardData(); // Refresh the scoreboard
        // Also refresh the names list for the trivia wheel
        this.loadNamesFromCSV();
        alert(`Successfully added ${name} to the scoreboard!`);
      } else {
        alert(result.error || "Failed to add person.");
      }
    } catch (error) {
      console.error("Error adding person:", error);
      alert("Error adding person. Please try again.");
    }
  }
}

// Initialize the wheel when the page loads
let wheel;
document.addEventListener("DOMContentLoaded", () => {
  wheel = new SpinningWheel();
});
