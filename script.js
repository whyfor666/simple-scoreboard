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

// Tutorial logic — synced to #instructionsModal
function showTutorial() {
  const inning = document.getElementById("inningBox");
  const out = document.getElementById("outBox");
  const modalEl = document.getElementById("instructionsModal");

  // If no modal exists, mark as shown and bail without disabling clicks
  if (!modalEl) {localStorage.setItem("tutorialShown", "true"); return;}

  // If you really want to disable clicks while modal is up, keep these:
  if (inning) inning.style.pointerEvents = "none";
  if (out) out.style.pointerEvents = "none";

  modalEl.style.display = "flex";
}

function closeTutorial() {
  const inning = document.getElementById("inningBox");
  const out = document.getElementById("outBox");
  const modalEl = document.getElementById("instructionsModal");

  if (inning) inning.style.pointerEvents = "auto";
  if (out) out.style.pointerEvents = "auto";
  if (modalEl) modalEl.style.display = "none";

  localStorage.setItem("tutorialShown", "true");
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
  '0': 0, 
  '1': 1,  
  '2': 2,  
  '3': 3, 
  '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
};

function displayHomeRunMessage(number) {
  const overlay = document.getElementById(`homeRunMessage${number}`);
  if (!overlay) return;

  const animDuration = getStoredSettings().animationTime;
  if (animDuration === 0) return; // Don't show animation if 0

  overlay.style.display = 'flex';
  setTimeout(() => {
    overlay.style.display = 'none';
  }, animDuration * 1000);
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

    const resetHint = document.getElementById("resetHint");
    const resetBtn = document.getElementById("resetDefaultsBtn");
    
    let resetTimer  ;

  resetBtn.addEventListener("mousedown", (e) => {
    if (e.button === 2) {  // Right-click
      performResetDefaults();
    } else {
      // Show hint
      resetHint.style.display = "inline";
    }
  })  ;

  resetBtn.addEventListener("mouseup", () => {
    resetHint.style.display = "none";
  })  ;

  resetBtn.addEventListener("mouseleave", () => {
    resetHint.style.display = "none";
  })  ;

  resetBtn.addEventListener("touchstart", () => {
    resetTimer = setTimeout(() => {
      performResetDefaults();
    }, 1500); // Long press = 1.5s
  })  ;

  resetBtn.addEventListener("touchend", () => {
    clearTimeout(resetTimer);
    resetHint.style.display = "none";
  })  ;

  resetBtn.addEventListener("click", () => {
    // Normal tap/click should NOT trigger reset, just show hint
    resetHint.style.display = "inline";
    setTimeout(() => resetHint.style.display = "none", 2000);
  })  ;

  applySettingsToForm(getStoredSettings());  // <-- ensure checkboxes and fields are pre-filled
  applySettingsToDOM(getStoredSettings());   // <- apply visuals immediately on load


  attachCharHints();


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

let hr = 0;

function updateHRDisplay(hrElement){
  const count = parseInt (hrElement.dataset.hr, 10);
  const valueElement = hrElement.querySelector(".hr-value");
  const labelElement = hrElement.querySelector(".hr-label");

  if (!valueElement) {
    console.warn("Missing .hr-value in", hrElement);
    return;
  }

  hrElement.classList.remove("faint","visible");

  if (count === 0) {
    labelElement.textContent = "HR";
    valueElement.textContent = "";
    hrElement.classList.add("faint");
  } else if (count === 1) {
      valueElement.textContent = "🥎";
      labelElement.innerHTML = '<span class="hr-label" dir="ltr">HR:<br>1</span>';
      hrElement.classList.add("visible"); 
  } else if (count === 2) { 
      labelElement.innerHTML = '<span class="hr-label" dir="ltr">HR:<br>2</span>';
      valueElement.textContent = "🥎🥎";
      hrElement.classList.add("visible"); 
  } else{
      labelElement.innerHTML = '<span class="hr-label" dir="ltr">HR:<br>OUT</span>';
      valueElement.textContent = "🥎🥎❌";
      hrElement.classList.add("visible"); 
  }
}

function incrementHR(hrElement) {
  let count = parseInt(hrElement.dataset.hr, 10);
  count = (count + 1) % 4;
  hrElement.dataset.hr = count;
  updateHRDisplay(hrElement);

  const settings = getStoredSettings();
  if (settings.autoHRAnimation && count !== 0) {
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
  animationTime: 9,
  enableInning: true,
  enableOut: true,
  enableHR: true,
  autoHRAnimation: true,
  invisibleInfoButton: false,
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
  document.getElementById("animationTime").value = s.animationTime;
  document.getElementById("enableInning").checked = s.enableInning;
  document.getElementById("enableOut").checked = s.enableOut;
  document.getElementById("enableHR").checked = s.enableHR;
  document.getElementById("autoHRAnimation").checked = s.autoHRAnimation;
  document.getElementById("invisibleInfoButton").checked = s.invisibleInfoButton;
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
  if (s.invisibleInfoButton) {
    infoBtn.style.opacity = "0";
    infoBtn.style.pointerEvents = "auto";  // clickable even if invisible
  } else {
    infoBtn.style.opacity = getStoredSettings().faintOpacity ?? 0.25;
    infoBtn.style.pointerEvents = "auto";
  }

    // Apply faint opacity
    const faintOpacity = s.faintOpacity;
    document.querySelectorAll('.inning-box, .out-box, .hr-box, #infoButton').forEach(el => {
    el.style.setProperty('--faint-opacity', faintOpacity);
  });
}

// function performResetDefaults() {
//   localStorage.removeItem("scoreboardSettings");
//   applySettingsToForm(defaultSettings);
//   applySettingsToDOM(defaultSettings);
//   // closeSettings();
//   alert("Settings were reset to [default] values.");
// }

function performResetDefaults() {
  // capture current form values before reset
  const changedEls = [];
  const sBefore = getStoredSettings();

  localStorage.removeItem("scoreboardSettings");
  applySettingsToForm(defaultSettings);
  applySettingsToDOM(defaultSettings);
  // closeSettings();

  // compare & mark changed inputs (numbers, text, checkboxes)
  const map = {
    maxInning: defaultSettings.maxInning,
    faintOpacity: defaultSettings.faintOpacity,
    animationTime: defaultSettings.animationTime,
    enableInning: defaultSettings.enableInning,
    enableOut: defaultSettings.enableOut,
    enableHR: defaultSettings.enableHR,
    autoHRAnimation: defaultSettings.autoHRAnimation,
    invisibleInfoButton: defaultSettings.invisibleInfoButton,
    labelInning: defaultSettings.labels.inning,
    labelOut: defaultSettings.labels.out,
    labelHR: defaultSettings.labels.hr
  };

  Object.entries(map).forEach(([id, defVal]) => {
    const el = document.getElementById(id);
    if (!el) return;

    const was = (id in sBefore.labels)
      ? sBefore.labels[id] // labelInning/labelOut/labelHR path
      : sBefore[id];

    // normalize checkbox vs input
    const changed = el.type === 'checkbox' ? (was !== el.checked) : (String(was) !== String(el.value));
    if (changed) {
      el.classList.add('input-flash');
      changedEls.push(el);
    }
  });

  // after flash, add strong highlight for a few seconds
  setTimeout(() => {
    changedEls.forEach(el => {
      el.classList.remove('input-flash');
      el.classList.add('input-changed');
    });
    setTimeout(() => {
      changedEls.forEach(el => el.classList.remove('input-changed'));
    }, 4000);
  }, 1000);

  // alert("Settings reset to defaults.");
}

function closeSettings() {
  document.getElementById("settingsModal").style.display = "none";
}

function showInstructions() {
  document.getElementById("instructionsModal").style.display = "flex";
}

// Your Close button calls closeInstructions() in index.html.
// Make it re-enable clicks too.
function closeInstructions() {
  closeTutorial();
}

document.getElementById("infoButton").addEventListener("click", () => {
  showInstructions();
});
document.getElementById("infoButton").addEventListener("contextmenu", (e) => {
  e.preventDefault();
  openSettings();
  attachCharHints();

});

document.getElementById("settingsForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const s = {
    maxInning: parseInt(document.getElementById("maxInning").value),
    faintOpacity: parseFloat(document.getElementById("faintOpacity").value),
    animationTime: parseFloat(document.getElementById("animationTime").value),
    enableInning: document.getElementById("enableInning").checked,
    enableOut: document.getElementById("enableOut").checked,
    enableHR: document.getElementById("enableHR").checked,
    autoHRAnimation: document.getElementById("autoHRAnimation").checked,
    invisibleInfoButton: document.getElementById("invisibleInfoButton").checked,
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

const infoBtn = document.getElementById("infoButton");

let touchingInfo = false;

document.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  touchingInfo = target === infoBtn;

  if (touchingInfo && getStoredSettings().invisibleInfoButton) {
    infoBtn.style.opacity = "1";
  }
});

document.addEventListener("touchmove", (e) => {
  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  const nowOverButton = target === infoBtn;

  if (getStoredSettings().invisibleInfoButton) {
    infoBtn.style.opacity = nowOverButton ? "1" : "0";
  }

  touchingInfo = nowOverButton;
});

document.addEventListener("touchend", () => {
  if (getStoredSettings().invisibleInfoButton) {
    infoBtn.style.opacity = "0";
  }
});


function escapeHTML(s) {
  return s.replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
}

// Optional: if you populate the form when opening settings, refresh then too
function openSettings() {
  const s = getStoredSettings();
  applySettingsToForm(s);
  document.getElementById("settingsModal").style.display = "flex";
}
function attachCharHints() {
  const pairs = [
    { inputId: 'labelInning' },
    { inputId: 'labelOut'    },
    { inputId: 'labelHR'     },
  ];

  pairs.forEach(({ inputId }) => {
    const input = document.getElementById(inputId);
    if (!input) return;

    const hint = input.parentElement?.querySelector('.char-hint');
    if (!hint) return;

    const max = input.maxLength > 0 ? input.maxLength : 0;

    const update = () => {
      hint.textContent = `(${input.value.length}/${max})`;
    };

    input.addEventListener('input', update);
    update();
  });
}
document.addEventListener('DOMContentLoaded', () => {
  const inning = document.getElementById('inningBox');
  const out = document.getElementById('outBox');
  const modal = document.getElementById('instructionsModal');

  if (inning) inning.style.pointerEvents = 'auto';
  if (out) out.style.pointerEvents = 'auto';

  if (!modal) localStorage.setItem('tutorialShown', 'true');
});
