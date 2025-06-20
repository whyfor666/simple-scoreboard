// script.js

// Register service worker if supported
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service worker registered:', reg.scope))
      .catch(err => console.error('Service worker registration failed:', err));
  });
}

// Helper to determine best contrasting text color (black or white) based on background
function getContrastColor(bgColor) {
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.fillStyle = bgColor;
  const hex = ctx.fillStyle.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
  return luminance > 140 ? 'black' : 'white';
}

// Populate team dropdowns with values from teams-config.js
function populateDropdowns() {
  document.querySelectorAll("select").forEach(dropdown => {
    dropdown.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.hidden = true;
    placeholder.textContent = "Select team …";
    placeholder.value = "";
    dropdown.appendChild(placeholder);

    teams.forEach(team => {
      const option = document.createElement("option");
      option.value = team.color;
      option.dataset.logo = team.logo;
      option.textContent = team.name;
      option.style.backgroundColor = team.color;
      option.style.color = getContrastColor(team.color);
      dropdown.appendChild(option);
    });
  });
}

function openDropdown(teamId) {
  populateDropdowns();
  const dropdown = document.getElementById(teamId).querySelector("select");
  dropdown.classList.add("visible");
  dropdown.focus();
}

function closeDropdown(dropdown) {
  dropdown.classList.remove("visible");
}

function updateTeam(select, teamId) {
  const selectedOption = select.options[select.selectedIndex];
  if (!selectedOption || selectedOption.disabled || selectedOption.value === "") return;

  const teamBox = document.getElementById(teamId);
  const teamColor = selectedOption.value;
  const logoSrc = selectedOption.dataset.logo;
  const nameSpan = teamBox.querySelector(".name");
  const score = teamBox.querySelector(".score");
  const logo = teamBox.querySelector(".logo");

  teamBox.style.backgroundColor = teamColor;
  teamBox.querySelector(".grid-score").style.backgroundColor = teamColor;
  nameSpan.textContent = selectedOption.textContent;
  nameSpan.style.color = getContrastColor(teamColor);
  score.style.color = getContrastColor(teamColor);
  logo.src = logoSrc;

  setTimeout(() => {
    select.classList.remove("visible");
    select.blur();
  }, 10);
}

// Score increment/decrement logic
function incrementScore(scoreElement) {
  const currentScore = parseInt(scoreElement.dataset.score, 10);
  scoreElement.dataset.score = currentScore + 1;
  updateScoreUI(scoreElement);
}

function decrementScore(scoreElement) {
  const currentScore = parseInt(scoreElement.dataset.score, 10);
  const newScore = Math.max(currentScore - 1, -1);
  scoreElement.dataset.score = newScore;
  updateScoreUI(scoreElement);
}

function incrementScoreFromLogo(logoElement) {
  const scoreElement = logoElement.closest('.grid-score').querySelector('.score');
  incrementScore(scoreElement);
}

function updateScoreUI(scoreElement) {
  const currentScore = parseInt(scoreElement.dataset.score, 10);
  const logo = scoreElement.parentElement.querySelector(".logo");
  const bgColor = scoreElement.parentElement.style.backgroundColor;
  if (bgColor) scoreElement.style.color = getContrastColor(bgColor);

  if (currentScore < 0) {
    scoreElement.classList.add("hidden-score");
    logo.style.display = "block";
  } else {
    scoreElement.classList.remove("hidden-score");
    logo.style.display = "none";
  }

  scoreElement.textContent = currentScore;
}

// Tutorial logic
function showTutorial() {
  document.getElementById("tutorialOverlay").style.display = "flex";
  resetInfoButtonTimer();
}

function closeTutorial() {
  document.getElementById("tutorialOverlay").style.display = "none";
  localStorage.setItem("tutorialShown", "true");
  resetInfoButtonTimer();
}

function resetInfoButtonTimer() {
  const btn = document.getElementById("infoButton");
  btn.classList.remove("hidden");
  clearTimeout(window._infoHideTimer);
  window._infoHideTimer = setTimeout(() => {
    btn.classList.add("hidden");
  }, 5000);
}

// INNING box visible then fades
setTimeout(() => {
  const box = document.getElementById("inningBox");
  if (inning === 0) {
    box.classList.add("visible"); // Full opacity
    setTimeout(() => {
      // After 2s, fade to faint if still unused
      if (inning === 0) {
        box.classList.remove("visible");
        box.classList.add("faint");
      }
    }, 2000);
  }
}, 5000); // Sync with infoButton hide

// OUT box visible then fades
//  updateOutDisplay();

  setTimeout(() => {
    const box = document.getElementById("outBox");
    if (out === 0) {
      box.classList.add("visible");
      setTimeout(() => {
        if (out === 0) {
          box.classList.remove("visible");
          box.classList.add("faint");
        }
      }, 2000);
    }
  }, 5000);

// Keyboard mapping for home run messages
const keyToMessage = {
  '=': 1, 'h': 1,
  '-': 2, 'r': 2,
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
  '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
};

function displayHomeRunMessage(number) {
  const overlay = document.getElementById(`homeRunMessage${number}`);
  if (!overlay) return;
  overlay.style.display = 'flex';
  setTimeout(() => {
    overlay.style.display = 'none';
  }, 3000);
}

document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  const msgNum = keyToMessage[key];
  if (msgNum !== undefined) displayHomeRunMessage(msgNum);
});

// Install prompt support
let deferredPrompt;
const enableInstallPrompt = false;

window.addEventListener('beforeinstallprompt', (e) => {
  if (!enableInstallPrompt) return;
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById("installButton").style.display = "block";
});

document.getElementById("installButton").addEventListener("click", async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    document.getElementById("installButton").style.display = "none";
  }
});

// Initialize page
window.addEventListener("DOMContentLoaded", () => {
  populateDropdowns();

  // Auto select first two teams if available
  const dropdowns = document.querySelectorAll("select");
  if (teams.length >= 2) {
    const team1 = Array.from(dropdowns[0].options).find(o => o.textContent === teams[0].name);
    const team2 = Array.from(dropdowns[1].options).find(o => o.textContent === teams[1].name);
    if (team1) {
      team1.selected = true;
      updateTeam(dropdowns[0], 'team1');
    }
    if (team2) {
      team2.selected = true;
      updateTeam(dropdowns[1], 'team2');
    }
  }

  // Refresh displayed scores
  document.querySelectorAll(".grid-team .score").forEach(score => updateScoreUI(score));

  // Show tutorial if not shown before
  if (!localStorage.getItem("tutorialShown")) {
    showTutorial();
  } else {
    resetInfoButtonTimer();
  }
});

// INNING box increment/decrement and hidden (faint) at 0
let inning = 0;

function updateInningDisplay() {
  const box = document.getElementById("inningBox");
  const value = box.querySelector(".inning-value");

  // Reset all states
  box.classList.remove("faint", "visible");

  if (inning === 0) {
    value.textContent = "";
    box.classList.add("faint"); 
  } else {
    value.textContent = inning;
    box.classList.add("visible");
  }
}

function incrementInning() {
  inning = (inning + 1) % 8; // 1–7, then rollover to 0
  updateInningDisplay();
}

function decrementInning() {
  inning = inning === 0 ? 7 : inning - 1;
  updateInningDisplay();
}

// OUT box increment/decrement and hidden (faint) at 0
let out = 0;

function updateOutDisplay() {
  const box = document.getElementById("outBox");
  const value = box.querySelector(".out-value");
  box.classList.remove("faint", "visible");

  if (out === 0) {
    value.textContent = "";
    box.classList.add("faint");
  } else {
    value.textContent = out;
    box.classList.add("visible");
  }
}

function incrementOut() {
  out = (out + 1) % 4;  // 1-3, then rollover to 0
  updateOutDisplay();
}

function decrementOut() {
  out = out === 0 ? 3 : out - 1;
  updateOutDisplay();
}

