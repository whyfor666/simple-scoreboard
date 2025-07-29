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
  document.getElementById("inningBox").style.pointerEvents = "none";
  document.getElementById("outBox").style.pointerEvents = "none";
  document.getElementById("tutorialOverlay").style.display = "flex";
  // resetInfoButtonTimer();
}

function closeTutorial() {
  document.getElementById("inningBox").style.pointerEvents = "auto";
  document.getElementById("outBox").style.pointerEvents = "auto";
  document.getElementById("tutorialOverlay").style.display = "none";
  localStorage.setItem("tutorialShown", "true");
  // resetInfoButtonTimer();
}

function resetInfoButtonTimer() {
  const btn = document.getElementById("infoButton");
  btn.classList.remove("faint");
  clearTimeout(window._infoHideTimer);
  window._infoHideTimer = setTimeout(() => {
    btn.classList.add("faint");
  }, 10000);  // Delay until fading
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
      }, 2000); // Delay to fade after appearing
    }
  }, 3000); // Delay before appearing solid

  // OUT box visible then fades
  setTimeout(() => {
    const box = document.getElementById("outBox");
    if (out === 0) {
      box.classList.add("visible");
      setTimeout(() => {
        if (out === 0) {
          box.classList.remove("visible");
          box.classList.add("faint");
        }
      }, 2000); // Delay to fade after appearing
    }
  }, 5000); // Delay before appearing solid
  
  // HR box visible then fades (Left)
  setTimeout(() => {
    const box = document.getElementById("hrBoxLeft");
    if (hr === 0) {
      box.classList.add("visible");
      setTimeout(() => {
        if (hr === 0) {
          box.classList.remove("visible");
          box.classList.add("faint");
        }
      }, 3000); // Delay to fade after appearing
    }
  }, 7000); // Delay before appearing solid

  // HR box visible then fades (Right)
  setTimeout(() => {
    const box = document.getElementById("hrBoxRight");
    if (hr === 0) {
      box.classList.add("visible");
      setTimeout(() => {
        if (hr === 0) {
          box.classList.remove("visible");
          box.classList.add("faint");
        }
      }, 3000); // Delay to fade after appearing 
    }
  }, 7000); // Delay before appearing solid

// Keyboard mapping for home run messages
const keyToMessage = {
  '0': 0, 'r': 0,
  '1': 1, '=': 1, 
  '2': 2, '-': 2, 
  '3': 3, 'h': 3,
  '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
};

function displayHomeRunMessage(number) {
  const overlay = document.getElementById(`homeRunMessage${number}`);
  if (!overlay) return;
  overlay.style.display = 'flex';
  setTimeout(() => {
    overlay.style.display = 'none';
  }, 1000);  // 1000 for testing. Was 5000 [Variable to be added to settings]
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
    setTimeout(() => {
    resetInfoButtonTimer();
  }, 5000); // or your preferred delay before fading
  }

  applySettingsToForm(getStoredSettings());  // <-- ensure checkboxes and fields are pre-filled
  applySettingsToDOM(getStoredSettings());   // <- apply visuals immediately on load
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
  const maxInning = getStoredSettings().maxInning || 7;   //Rollover to 0 at max
  if (inning < maxInning) {
    inning++;
} else {
    inning = 0;
}
updateInningDisplay();
}

function decrementInning() {
  const maxInning = getStoredSettings().maxInning || 7;   //Decrement Roll-under to -1 at max.
  inning = inning === 0 ? maxInning : inning - 1;
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
  } else if (out === 1){
    value.textContent = "●";
    box.classList.add("visible");
  }else{
    value.textContent = "●●";
    box.classList.add("visible");
  }
}

function incrementOut() {
  out = (out + 1) % 3;  // 1-2, then rollover to 0
  updateOutDisplay();
}

function decrementOut() {
  out = out === 0 ? 2 : out - 1;
  updateOutDisplay();
}

// HR box increment/decrement and hidden (faint) at 0
// let hr = 0; 

// function updateHRDisplay(hrElement){
//   const count = parseInt (hrElement.dataset.hr, 10);
//   const valueElement = hrElement.querySelector(".hr-value");

//     if (!valueElement) {
//     console.warn("Missing .hr-value in", hrElement);
//     return;
//   }

//   hrElement.classList.remove("faint","visible");

  // if (count === 0) {
  //   valueElement.innerHTML = "";
  //   hrElement.classList.add("faint");
  // } else {
  //   const icons = count === 1
  //   ? ["🥎"]
  //   : count === 2
  //   ? ["🥎", "🥎"]
  //   : ["❌","🥎", "🥎"];

  //   valueElement.innerHTML = icons
  //     .map(b => `<span class="hr-icon">${b}</span>`)
  //     .join("");

  //   hrElement.classList.add("visible"); 
  // }

let hr = 0;

function updateHRDisplay(hrElement) {
  const count = parseInt(hrElement.dataset.hr, 10);
  const label = getStoredSettings().labels.hr;

  const labelElement = hrElement.querySelector('.hr-label');
  const valueElement = hrElement.querySelector('.hr-value');

  if (count === 0) {
    labelElement.textContent = label;
    hrElement.classList.add('faint');
  } else {
    labelElement.textContent = "";  // or keep if you want "HR"
    hrElement.classList.add('visible');
    hrElement.classList.remove('faint');
  }

  const balls = "🥎".repeat(Math.min(count, 3));
  const x = count > 2 ? "❌" : "";
  valueElement.innerHTML = balls + x;
}

function incrementHR(hrElement) {
  let count = parseInt(hrElement.dataset.hr, 10);
  count = (count + 1) % 4; // 1-3, then rollover to 0
  hrElement.dataset.hr = count;
  updateHRDisplay(hrElement)
  if (count != 0){  // Display HR message only for HR 1 & 2.
   displayHomeRunMessage(count); 
  }
}

function decrementHR(hrElement) {
  let count = parseInt(hrElement.dataset.hr, 10);
  count = count === 0 ? 3 : count -1; // 3-1 rollunder to 3 from 0
  hrElement.dataset.hr = count;
  updateHRDisplay(hrElement);
}

// Default config
const defaultSettings = {
  maxInning: 7,
  faintOpacity: 0.25,
  enableInning: true,
  enableOut: true,
  enableHR: true,
  autoHRAnimation: true,
  showInfoButton: true,
  labels: {
    inning: "INNING",
    out: "OUT",
    hr: "HR"
  }
};

function getStoredSettings() {
  const saved = JSON.parse(localStorage.getItem("scoreboardSettings")) || {};
  return Object.assign({}, defaultSettings, saved);
}

function applySettingsToForm(s) {
  document.getElementById("maxInning").value = s.maxInning;
  document.getElementById("faintOpacity").value = s.faintOpacity;
  document.getElementById("enableInning").checked = s.enableInning;
  document.getElementById("enableOut").checked = s.enableOut;
  document.getElementById("enableHR").checked = s.enableHR;
  document.getElementById("autoHRAnimation").checked = s.autoHRAnimation;
  document.getElementById("showInfoButton").checked = s.showInfoButton;
  document.getElementById("labelInning").value = s.labels.inning;
  document.getElementById("labelOut").value = s.labels.out;
  document.getElementById("labelHR").value = s.labels.hr;
}

function applySettingsToDOM(s) {
  // Apply label text
  const inningLabel = document.querySelector(".inning-label");
  if (inningLabel) inningLabel.textContent = s.labels.inning;

  const outLabel = document.querySelector(".out-label");
  if (outLabel) outLabel.textContent = s.labels.out;

  document.querySelectorAll(".hr-label").forEach(el => el.textContent = s.labels.hr);

  // Apply enable/disable logic
  document.getElementById("inningBox").style.display = s.enableInning ? "block" : "none";
  document.getElementById("outBox").style.display = s.enableOut ? "block" : "none";
  document.getElementById("hrBoxLeft").style.display = s.enableHR ? "flex" : "none";
  document.getElementById("hrBoxRight").style.display = s.enableHR ? "flex" : "none";

  // Info button faint logic
  const infoBtn = document.getElementById("infoButton");
  if (infoBtn) {
    if (!s.showInfoButton) infoBtn.classList.add("faint");
    else infoBtn.classList.remove("faint");
  }

  // Apply faint opacity
  const faintOpacity = s.faintOpacity;
  document.querySelectorAll('.inning-box, .out-box, .hr-box, #infoButton').forEach(el => {
  el.style.setProperty('--faint-opacity', faintOpacity);
});

}

function openSettings() {
  const s = getStoredSettings();
  applySettingsToForm(s);
  document.getElementById("settingsModal").style.display = "flex";
}

function closeSettings() {
  document.getElementById("settingsModal").style.display = "none";
}

function showInstructions() {
  document.getElementById("instructionsModal").style.display = "flex";
}
function closeInstructions() {
  document.getElementById("instructionsModal").style.display = "none";
}

document.getElementById("infoButton").addEventListener("click", () => {
  showInstructions();
});
document.getElementById("infoButton").addEventListener("contextmenu", (e) => {
  e.preventDefault();
  openSettings();
});

document.getElementById("settingsForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const s = {
    maxInning: parseInt(document.getElementById("maxInning").value),
    faintOpacity: parseFloat(document.getElementById("faintOpacity").value),
    enableInning: document.getElementById("enableInning").checked,
    enableOut: document.getElementById("enableOut").checked,
    enableHR: document.getElementById("enableHR").checked,
    autoHRAnimation: document.getElementById("autoHRAnimation").checked,
    showInfoButton: document.getElementById("showInfoButton").checked,
    labels: {
      inning: document.getElementById("labelInning").value,
      out: document.getElementById("labelOut").value,
      hr: document.getElementById("labelHR").value
    }
  };
  localStorage.setItem("scoreboardSettings", JSON.stringify(s));
  applySettingsToDOM(s);
  closeSettings();
});