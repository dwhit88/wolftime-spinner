class SpinningWheel {
  constructor() {
    this.names = [];
    this.allPeople = [];
    this.filteredPeople = [];
    this.isSpinning = false;
    this.wheel = document.getElementById("wheel");
    this.spinBtn = document.getElementById("spinBtn");
    this.result = document.getElementById("result");
    this.devsOnlyToggle = document.getElementById("devsOnlyToggle");
    this.nameChips = document.getElementById("nameChips");

    // Login elements
    this.loginModal = document.getElementById("loginModal");
    this.passphrase = document.getElementById("passphrase");
    this.loginSubmitBtn = document.getElementById("loginSubmitBtn");
    this.loginError = document.getElementById("loginError");

    // Scoreboard elements
    this.scoreboardBtn = document.getElementById("scoreboardBtn");
    this.backBtn = document.getElementById("backBtn");
    this.scoreboardContainer = document.getElementById("scoreboardContainer");
    this.scoreboardTableBody = document.getElementById("scoreboardTableBody");
    this.updateBtn = document.getElementById("updateBtn");
    this.addPersonBtn = document.getElementById("addPersonBtn");
    this.cancelBtn = document.getElementById("cancelBtn");
    this.clearScoreboardBtn = document.getElementById("clearScoreboardBtn");
    this.container = document.querySelector(".container");
    this.isEditMode = false;
    this.selectedRows = new Set();

    // Modal elements
    this.addPersonModal = document.getElementById("addPersonModal");
    this.closeModalBtn = document.getElementById("closeModalBtn");
    this.newPersonName = document.getElementById("newPersonName");
    this.newPersonRole = document.getElementById("newPersonRole");
    this.addPersonSubmitBtn = document.getElementById("addPersonSubmitBtn");

    // Unsaved changes modal elements
    this.unsavedChangesModal = document.getElementById("unsavedChangesModal");
    this.confirmBackBtn = document.getElementById("confirmBackBtn");
    this.cancelBackBtn = document.getElementById("cancelBackBtn");

    // Clear scoreboard modal elements
    this.clearScoreboardModal = document.getElementById("clearScoreboardModal");
    this.confirmClearBtn = document.getElementById("confirmClearBtn");
    this.cancelClearBtn = document.getElementById("cancelClearBtn");

    this.init();
  }

  async loadNamesFromCSV() {
    try {
      const response = await fetch("/api/scoreboard");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Store the full data for filtering
      this.allPeople = data.filter((row) => row.isRemoved !== "TRUE");

      // Apply current filter
      this.filterNames();
    } catch (error) {
      console.error("Error loading names from CSV:", error);
      // Fallback to empty array if there's an error
      this.allPeople = [];
      this.filteredPeople = [];
      this.names = [];
      this.renderWheel();
      this.renderNameChips();
    }
  }

  filterNames() {
    const isDevsOnly = this.devsOnlyToggle.checked;

    // Filter based on toggle state
    this.filteredPeople = this.allPeople
      .filter((person) => {
        if (isDevsOnly) {
          return person.isDev === "TRUE";
        } else {
          return person.isDev === "FALSE";
        }
      })
      .filter((person) => person.Name && person.Name.trim() !== ""); // Remove empty names

    this.names = this.filteredPeople.map((row) => row.Name);

    this.renderWheel();
    this.renderNameChips();
  }

  renderNameChips() {
    this.nameChips.innerHTML = "";

    if (this.names.length === 0) {
      const filterType = this.devsOnlyToggle.checked
        ? "developers"
        : "non-developers";
      this.nameChips.innerHTML = `<div style="color: #666; font-style: italic;">No ${filterType} available</div>`;
      return;
    }

    this.names.forEach((name) => {
      const chip = document.createElement("div");
      chip.className = "name-chip";
      chip.textContent = name;
      chip.style.background = this.getNameGradient(name);
      this.nameChips.appendChild(chip);
    });
  }

  init() {
    this.bindEvents();
    this.bindLoginEvents();
  }

  bindLoginEvents() {
    this.loginSubmitBtn.addEventListener("click", () => this.checkPassphrase());
    this.passphrase.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.checkPassphrase();
      }
    });
  }

  async checkPassphrase() {
    try {
      const response = await fetch("/api/verify-passphrase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          passphrase: this.passphrase.value,
        }),
      });

      const data = await response.json();

      if (data.success) {
        this.loginModal.style.display = "none";
        this.loginError.style.display = "none";
        this.loadNamesFromCSV();
        this.renderWheel();
      } else {
        this.loginError.style.display = "block";
        this.passphrase.value = "";
      }
    } catch (error) {
      console.error("Error verifying passphrase:", error);
      this.loginError.style.display = "block";
      this.passphrase.value = "";
    }
  }

  bindEvents() {
    this.spinBtn.addEventListener("click", () => this.spin());

    // Toggle event
    this.devsOnlyToggle.addEventListener("change", () => this.filterNames());

    // Scoreboard events
    this.scoreboardBtn.addEventListener("click", () => this.showScoreboard());
    this.backBtn.addEventListener("click", () => {
      if (this.isEditMode) {
        this.showUnsavedChangesModal();
      } else {
        this.showTrivia();
      }
    });
    this.updateBtn.addEventListener("click", () => this.toggleEditMode());
    this.addPersonBtn.addEventListener("click", () =>
      this.showAddPersonModal()
    );
    this.cancelBtn.addEventListener("click", () => this.cancelEditMode());
    this.clearScoreboardBtn.addEventListener("click", () =>
      this.showClearScoreboardModal()
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

    // Unsaved changes modal events
    this.confirmBackBtn.addEventListener("click", () => this.confirmGoBack());
    this.cancelBackBtn.addEventListener("click", () =>
      this.hideUnsavedChangesModal()
    );
    this.unsavedChangesModal.addEventListener("click", (e) => {
      if (e.target === this.unsavedChangesModal) {
        this.hideUnsavedChangesModal();
      }
    });

    // Clear scoreboard modal events
    this.confirmClearBtn.addEventListener("click", () =>
      this.confirmClearScoreboard()
    );
    this.cancelClearBtn.addEventListener("click", () =>
      this.hideClearScoreboardModal()
    );
    this.clearScoreboardModal.addEventListener("click", (e) => {
      if (e.target === this.clearScoreboardModal) {
        this.hideClearScoreboardModal();
      }
    });
  }

  renderWheel() {
    this.wheel.innerHTML = "";

    if (this.names.length === 0) {
      const filterType = this.devsOnlyToggle.checked
        ? "developers"
        : "non-developers";
      this.wheel.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; font-size: 18px;">No ${filterType} available</div>`;
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
      const randomName = this.getWeightedRandomName();
      display.textContent = randomName;
      display.style.background = this.getNameGradient(randomName);

      counter++;
      if (counter >= totalCycles) {
        clearInterval(interval);

        // Select final winner using weighted probability
        const winner = this.getWeightedRandomName();

        // Show final result
        display.textContent = winner;
        display.style.background = this.getNameGradient(winner);
        this.result.textContent = `Winner: ${winner}!`;

        this.isSpinning = false;
        this.spinBtn.disabled = false;
      }
    }, 100); // Change name every 100ms
  }

  getWeightedRandomName() {
    if (this.filteredPeople.length === 0)
      return this.names[0] || "No names available";

    // Calculate weights based on questions asked (inverse relationship)
    const weights = this.filteredPeople.map((person) => {
      const questionsAsked = parseInt(person.questionsAsked) || 0;
      // Higher weight for people who have asked fewer questions
      // Add 1 to avoid division by zero, and use inverse relationship
      return 1 / (questionsAsked + 1);
    });

    // Calculate total weight
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    // Generate random number between 0 and total weight
    let random = Math.random() * totalWeight;

    // Find the selected person based on weights
    for (let i = 0; i < this.filteredPeople.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return this.filteredPeople[i].Name;
      }
    }

    // Fallback to last person if something goes wrong
    return this.filteredPeople[this.filteredPeople.length - 1].Name;
  }

  getNameGradient(name) {
    // Create a hash from the name to ensure consistent colors
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use the hash to select from predefined gradient pairs with better contrast
    const gradients = [
      "linear-gradient(135deg, #4c51bf 0%, #667eea 100%)", // Dark Purple
      "linear-gradient(135deg, #d53f8c 0%, #f093fb 100%)", // Dark Pink
      "linear-gradient(135deg, #3182ce 0%, #4facfe 100%)", // Dark Blue
      "linear-gradient(135deg, #38a169 0%, #43e97b 100%)", // Dark Green
      "linear-gradient(135deg, #dd6b20 0%, #fa709a 100%)", // Dark Orange
      "linear-gradient(135deg, #319795 0%, #38f9d7 100%)", // Dark Teal
      "linear-gradient(135deg, #c53030 0%, #f56565 100%)", // Dark Red
      "linear-gradient(135deg, #b7791f 0%, #f6ad55 100%)", // Dark Amber
      "linear-gradient(135deg, #805ad5 0%, #a18cd1 100%)", // Dark Purple
      "linear-gradient(135deg, #2d3748 0%, #4a5568 100%)", // Dark Gray
      "linear-gradient(135deg, #e53e3e 0%, #f56565 100%)", // Dark Red
      "linear-gradient(135deg, #2b6cb0 0%, #4299e1 100%)", // Dark Blue
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
    // Reset toggle to show all people by default
    this.devsOnlyToggle.checked = false;
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
      tr.dataset.id = row.Id;
      tr.dataset.name = row.Name;

      if (this.isEditMode) {
        // In edit mode, add checkbox cell first and make question fields editable
        tr.innerHTML = `
          <td><input type="checkbox" class="delete-checkbox"></td>
          <td>${row.Name || ""}</td>
          <td class="question-cell">
            <input type="number" class="question-input" data-field="questionsAsked" data-row="${index}" value="${
          row.questionsAsked || "0"
        }" min="0">
          </td>
          <td class="question-cell">
            <input type="number" class="question-input" data-field="questionsMissed" data-row="${index}" value="${
          row.questionsMissed || "0"
        }" min="0">
          </td>
          <td class="question-cell">
            <input type="number" class="question-input" data-field="questionsAnsweredCorrectly" data-row="${index}" value="${
          row.questionsAnsweredCorrectly || "0"
        }" min="0">
          </td>
          <td>${row.points || "0"}</td>
        `;
      } else {
        // Normal mode, no checkbox
        tr.innerHTML = `
          <td>${row.Name || ""}</td>
          <td>${row.questionsAsked || "0"}</td>
          <td>${row.questionsMissed || "0"}</td>
          <td>${row.questionsAnsweredCorrectly || "0"}</td>
          <td>${row.points || "0"}</td>
        `;
      }

      this.scoreboardTableBody.appendChild(tr);
    });

    // Add event listeners for checkboxes and question controls if in edit mode
    if (this.isEditMode) {
      this.addCheckboxListeners();
      this.addQuestionControlListeners();
    }
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;

    if (this.isEditMode) {
      this.updateBtn.textContent = "Save";
      this.updateBtn.classList.add("save-button");
      this.updateBtn.classList.remove("update-button");
      this.addPersonBtn.style.display = "none";
      this.cancelBtn.style.display = "inline-block";
      this.clearScoreboardBtn.style.display = "inline-block";
      this.addDeleteColumn();
      // Reload the scoreboard data to show checkboxes
      this.loadScoreboardData();
    } else {
      this.updateBtn.textContent = "Update";
      this.updateBtn.classList.add("update-button");
      this.updateBtn.classList.remove("save-button");
      this.addPersonBtn.style.display = "inline-block";
      this.cancelBtn.style.display = "none";
      this.clearScoreboardBtn.style.display = "none";
      this.removeDeleteColumn();
      this.saveChanges();
    }
  }

  cancelEditMode() {
    this.isEditMode = false;
    this.updateBtn.textContent = "Update";
    this.updateBtn.classList.add("update-button");
    this.updateBtn.classList.remove("save-button");
    this.addPersonBtn.style.display = "inline-block";
    this.cancelBtn.style.display = "none";
    this.clearScoreboardBtn.style.display = "none";
    this.removeDeleteColumn();
    this.loadScoreboardData();
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
        const id = row.dataset.id;

        if (e.target.checked) {
          this.selectedRows.add(id);
        } else {
          this.selectedRows.delete(id);
        }
      });
    });
  }

  addQuestionControlListeners() {
    // Add listeners for input changes to prevent negative values and update points
    const questionInputs = document.querySelectorAll(".question-input");
    questionInputs.forEach((input) => {
      input.addEventListener("change", (e) => {
        const value = parseInt(e.target.value) || 0;
        if (value < 0) {
          e.target.value = 0;
        }
        this.updatePointsForRow(e.target.closest("tr"));
      });
    });
  }

  updatePointsForRow(row) {
    const questionsAnsweredCorrectly =
      parseInt(
        row.querySelector('[data-field="questionsAnsweredCorrectly"]').value
      ) || 0;
    const questionsMissed =
      parseInt(row.querySelector('[data-field="questionsMissed"]').value) || 0;
    const points = Math.max(0, questionsAnsweredCorrectly - questionsMissed);

    // Update the points cell
    const pointsCell = row.querySelector("td:last-child");
    if (pointsCell) {
      pointsCell.textContent = points.toString();
    }
  }

  async saveChanges() {
    try {
      // Collect all the updated question values
      const updatedData = [];
      const questionInputs = document.querySelectorAll(".question-input");

      questionInputs.forEach((input) => {
        const field = input.dataset.field;
        const rowIndex = parseInt(input.dataset.row);
        const value = parseInt(input.value) || 0;

        // Find the row data by index
        const rows = document.querySelectorAll("#scoreboardTableBody tr");
        const row = rows[rowIndex];
        const id = row.dataset.id;

        // Find existing entry or create new one
        let entry = updatedData.find((item) => item.id === id);
        if (!entry) {
          entry = { id: id };
          updatedData.push(entry);
        }

        entry[field] = value;
      });

      // Calculate points for each updated entry
      updatedData.forEach((entry) => {
        const questionsAnsweredCorrectly =
          parseInt(entry.questionsAnsweredCorrectly) || 0;
        const questionsMissed = parseInt(entry.questionsMissed) || 0;
        const points = Math.max(
          0,
          questionsAnsweredCorrectly - questionsMissed
        );
        entry.points = points;
      });

      // Send update request to server
      const response = await fetch("/api/scoreboard/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedNames: Array.from(this.selectedRows),
          updatedData: updatedData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

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

  showUnsavedChangesModal() {
    this.unsavedChangesModal.style.display = "block";
  }

  hideUnsavedChangesModal() {
    this.unsavedChangesModal.style.display = "none";
  }

  confirmGoBack() {
    this.hideUnsavedChangesModal();
    this.cancelEditMode();
    this.showTrivia();
  }

  showClearScoreboardModal() {
    this.clearScoreboardModal.style.display = "block";
  }

  hideClearScoreboardModal() {
    this.clearScoreboardModal.style.display = "none";
  }

  async confirmClearScoreboard() {
    try {
      this.hideClearScoreboardModal();

      // Send request to clear all question values
      const response = await fetch("/api/scoreboard/clear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Exit edit mode and reload data
        this.isEditMode = false;
        this.updateBtn.textContent = "Update";
        this.updateBtn.classList.add("update-button");
        this.updateBtn.classList.remove("save-button");
        this.addPersonBtn.style.display = "inline-block";
        this.cancelBtn.style.display = "none";
        this.clearScoreboardBtn.style.display = "none";
        this.removeDeleteColumn();
        this.loadScoreboardData();
        alert("Scoreboard cleared successfully!");
      } else {
        alert(result.error || "Failed to clear scoreboard.");
      }
    } catch (error) {
      console.error("Error clearing scoreboard:", error);
      alert("Error clearing scoreboard. Please try again.");
    }
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
