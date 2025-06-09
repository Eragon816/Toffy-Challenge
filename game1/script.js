document.addEventListener("DOMContentLoaded", () => {
  // ... (All code up to the puzzle generators is unchanged from the previous corrected version) ...
  const screens = {
    start: document.getElementById("start-screen"),
    game: document.getElementById("game-screen"),
    end: document.getElementById("end-screen"),
  };
  const ui = {
    highScore: document.getElementById("high-score"),
    score: document.getElementById("score"),
    level: document.getElementById("level"),
    livesContainer: document.getElementById("lives-container"),
    timerBar: document.getElementById("timer-bar"),
    missionTitle: document.getElementById("mission-title"),
    puzzleArea: document.getElementById("puzzle-area"),
    feedbackOverlay: document.getElementById("feedback-overlay"),
    endTitle: document.getElementById("end-title"),
    finalScore: document.getElementById("final-score"),
    gameContainer: document.getElementById("game-container"),
    character: {
      head: document.querySelector("#character-lives .head"),
      torso: document.querySelector("#character-lives .torso"),
      legLeft: document.querySelector("#character-lives .leg.left"),
      legRight: document.querySelector("#character-lives .leg.right"),
    },
  };
  const buttons = {
    mode: document.querySelectorAll(".mode-btn"),
    restart: document.getElementById("restart-btn"),
    menu: document.getElementById("menu-btn"),
  };
  let state = {
    currentLevel: 1,
    score: 0,
    lives: 3,
    gameMode: "arcade",
    highScore: localStorage.getItem("t0ffyChallengeHighScore") || 0,
    timer: null,
    timeLeft: 0,
    totalTime: 0,
    isPlayerTurn: false,
    currentMission: null,
    correctAnswer: null,
    levelInProgress: false,
  };
  const MAX_LEVEL = 30;
  const missions = [
    { type: "simon", title: "اتبع النمط!" },
    { type: "stopTheBar", title: "أوقف الشريط!" },
    { type: "fastClicker", title: "اصطد الأهداف!" },
    { type: "colorBalance", title: "وازن اللون!" },
    { type: "sequenceLink", title: "توصيل التسلسل!" },
  ];
  function init() {
    ui.highScore.textContent = state.highScore;
    buttons.mode.forEach((btn) =>
      btn.addEventListener("click", () => startGame(btn.dataset.mode))
    );
    buttons.restart.addEventListener("click", () => startGame(state.gameMode));
    buttons.menu.addEventListener("click", showStartScreen);
    updateLivesDisplay();
  }
  function showScreen(screenName) {
    Object.values(screens).forEach((screen) =>
      screen.classList.remove("active")
    );
    screens[screenName].classList.add("active");
  }
  function showStartScreen() {
    ui.highScore.textContent = state.highScore;
    showScreen("start");
  }
  function startGame(mode) {
    state.gameMode = mode;
    state.currentLevel = 1;
    state.score = 0;
    state.lives = mode === "arcade" ? 3 : 1;
    updateLivesDisplay();
    showScreen("game");
    loadLevel();
  }
  function loadLevel() {
    state.isPlayerTurn = false;
    state.levelInProgress = true;
    ui.puzzleArea.innerHTML = "";
    ui.puzzleArea.className = "";
    ui.puzzleArea.style.cursor = "default";
    ui.level.textContent = state.currentLevel;
    ui.score.textContent = state.score;
    if (state.currentLevel > MAX_LEVEL) {
      endGame(true);
      return;
    }
    const mission = missions[Math.floor(Math.random() * missions.length)];
    state.currentMission = mission;
    ui.missionTitle.textContent = mission.title;
    state.totalTime = Math.max(6000, 16000 - state.currentLevel * 300);
    state.timeLeft = state.totalTime;
    switch (mission.type) {
      case "fastClicker":
        generateFastClicker();
        break;
      case "simon":
        generateSimon();
        break;
      case "stopTheBar":
        generateStopTheBar();
        break;
      case "colorBalance":
        generateColorBalance();
        break;
      case "sequenceLink":
        generateSequenceLink();
        break;
    }
    startTimer();
  }
  function nextLevel() {
    if (!state.levelInProgress) return;
    state.levelInProgress = false;
    clearInterval(state.timer);
    state.score += 100 + Math.floor(state.timeLeft / 100);
    state.currentLevel++;
    playFeedback(true);
    setTimeout(loadLevel, 800);
  }
  function endGame(isWin) {
    if (!state.levelInProgress && !isWin) return;
    state.levelInProgress = false;
    clearInterval(state.timer);
    if (state.score > state.highScore) {
      state.highScore = state.score;
      localStorage.setItem("t0ffyChallengeHighScore", state.highScore);
    }
    ui.finalScore.textContent = state.score;
    ui.endTitle.textContent = isWin ? "رائع! لقد فزت!" : "انتهت اللعبة!";
    showScreen("end");
  }
  function handleIncorrect() {
    if (!state.levelInProgress) return;
    state.levelInProgress = false;
    state.isPlayerTurn = false;
    clearInterval(state.timer);
    playFeedback(false);
    if (state.currentMission.type === "simon" && state.correctAnswer !== null) {
      const wheel = ui.puzzleArea.querySelector(".simon-wheel-container");
      if (wheel) {
        const correctButton = wheel.children[state.correctAnswer];
        if (correctButton)
          correctButton.classList.add("correct-answer-highlight");
      }
    }
    state.lives--;
    updateLivesDisplay();
    if (state.lives <= 0) {
      if (state.gameMode === "arcade") {
        ui.character.head.classList.add("fall");
      }
      setTimeout(() => endGame(false), 1200);
    } else {
      setTimeout(loadLevel, 1500);
    }
  }
  function startTimer() {
    ui.timerBar.style.transition = "none";
    ui.timerBar.style.width = "100%";
    setTimeout(() => {
      ui.timerBar.style.transition = `width ${state.totalTime / 1000}s linear`;
      ui.timerBar.style.width = "0%";
    }, 50);
    clearInterval(state.timer);
    state.timer = setInterval(() => {
      if (!state.levelInProgress) {
        clearInterval(state.timer);
        return;
      }
      state.timeLeft -= 100;
      if (state.timeLeft <= 0) {
        clearInterval(state.timer);
        handleIncorrect();
      }
    }, 100);
  }
  function updateLivesDisplay() {
    ui.livesContainer.style.display =
      state.gameMode === "arcade" ? "block" : "none";
    const { head, torso, legLeft, legRight } = ui.character;
    Object.values(ui.character).forEach((part) =>
      part.classList.remove("hidden", "fall")
    );
    if (state.lives <= 2) legRight.classList.add("hidden");
    if (state.lives <= 1) legLeft.classList.add("hidden");
    if (state.lives <= 0) torso.classList.add("hidden");
  }
  function playFeedback(isCorrect) {
    ui.feedbackOverlay.style.animation = isCorrect
      ? "correct-feedback 0.5s ease-out"
      : "incorrect-feedback 0.5s ease-out";
    if (!isCorrect) {
      ui.gameContainer.style.animation = "shake 0.5s";
    }
    setTimeout(() => {
      ui.feedbackOverlay.style.animation = "";
      ui.gameContainer.style.animation = "";
    }, 500);
  }

  // === PUZZLE GENERATORS START ===

  // --- REBUILT Simon Says LOGIC ---
  function generateSimon() {
    const patternLength = Math.min(10, 3 + Math.floor(state.currentLevel / 2));
    const showPatternSpeed = Math.max(200, 500 - state.currentLevel * 10);
    let pattern = [];
    let playerPattern = [];
    state.correctAnswer = null;

    for (let i = 0; i < patternLength; i++) {
      pattern.push(Math.floor(Math.random() * 4));
    }

    // Create the wheel structure
    const wheelContainer = document.createElement("div");
    wheelContainer.className = "simon-wheel-container";
    ui.puzzleArea.appendChild(wheelContainer);

    const colors = ["#e94560", "#1e90ff", "#2ecc71", "#fca311"]; // Red, Blue, Green, Orange
    for (let i = 0; i < 4; i++) {
      const slice = document.createElement("div");
      slice.className = `simon-slice slice-${i}`;
      slice.style.backgroundColor = colors[i];
      slice.dataset.index = i; // This is its VISUAL position
      slice.dataset.colorIndex = i; // This is its TRUE color identity
      slice.addEventListener("click", handleSimonClick);
      wheelContainer.appendChild(slice);
    }

    function handleSimonClick(e) {
      if (!state.isPlayerTurn) return;
      // We check the TRUE color index, not its current visual position
      const clickedColorIndex = parseInt(e.target.dataset.colorIndex);
      playerPattern.push(clickedColorIndex);

      // Light up the slice that was clicked
      const visualIndex = parseInt(e.target.dataset.index);
      lightUp(visualIndex, 150);

      const currentStep = playerPattern.length - 1;
      if (playerPattern[currentStep] !== pattern[currentStep]) {
        // Find which slice currently holds the correct color to highlight it
        for (const slice of wheelContainer.children) {
          if (parseInt(slice.dataset.colorIndex) === pattern[currentStep]) {
            state.correctAnswer = parseInt(slice.dataset.index);
            break;
          }
        }
        handleIncorrect();
        return;
      }

      if (playerPattern.length === pattern.length) {
        state.isPlayerTurn = false;
        nextLevel();
      }
    }

    function lightUp(visualIndex, duration) {
      const slice = wheelContainer.children[visualIndex];
      if (slice) {
        slice.classList.add("lit");
        setTimeout(() => slice.classList.remove("lit"), duration);
      }
    }

    function showPattern(i = 0) {
      if (i < pattern.length) {
        setTimeout(() => {
          // Find which slice has the color we need to light up
          const colorToFind = pattern[i];
          for (const slice of wheelContainer.children) {
            if (parseInt(slice.dataset.colorIndex) === colorToFind) {
              lightUp(parseInt(slice.dataset.index), showPatternSpeed);
              break;
            }
          }
          showPattern(i + 1);
        }, showPatternSpeed + 100);
      } else {
        // All pattern shown, now check for the twist!
        if (state.currentLevel > 8) {
          // Twist starts at level 9
          setTimeout(twistWheel, 500);
        } else {
          state.isPlayerTurn = true;
        }
      }
    }

    function twistWheel() {
      const rotationDegrees = [90, 180, 270];
      const randomRotation =
        rotationDegrees[Math.floor(Math.random() * rotationDegrees.length)];
      wheelContainer.style.transform = `rotate(${randomRotation}deg)`;

      setTimeout(() => {
        state.isPlayerTurn = true;
      }, 500);
    }

    setTimeout(() => showPattern(), 800);
  }

  // ... (All other puzzle generator functions are unchanged and correct)
  function generateFastClicker() {
    state.isPlayerTurn = true;
    ui.puzzleArea.classList.add("fast-clicker-area");
    const targetsToClick = Math.min(10, 3 + Math.floor(state.currentLevel / 4));
    const targetSize = Math.max(30, 70 - state.currentLevel);
    const shrinkDuration = Math.max(2.5, 5 - state.currentLevel * 0.08);
    const numPenaltyTargets =
      state.currentLevel > 9 ? Math.floor((state.currentLevel - 5) / 5) : 0;
    const numMovingTargets =
      state.currentLevel > 11 ? Math.floor((state.currentLevel - 7) / 5) : 0;
    let clickedCount = 0;
    const counter = document.createElement("div");
    counter.className = "fc-counter";
    ui.puzzleArea.appendChild(counter);
    const updateCounter = () => {
      counter.textContent = `${clickedCount} / ${targetsToClick}`;
    };
    updateCounter();
    function createParticleExplosion(x, y) {
      for (let i = 0; i < 10; i++) {
        const p = document.createElement("div");
        p.className = "particle";
        p.style.left = `${x}px`;
        p.style.top = `${y}px`;
        const size = Math.random() * 5 + 2;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        const angle = Math.random() * 360;
        const dist = Math.random() * 50 + 20;
        p.style.setProperty(
          "--transform-end",
          `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`
        );
        ui.puzzleArea.appendChild(p);
        setTimeout(() => p.remove(), 500);
      }
    }
    function spawnTarget(targetInfo) {
      const target = document.createElement("div");
      target.classList.add("click-target");
      target.style.width = `${targetSize}px`;
      target.style.height = `${targetSize}px`;
      const maxX = ui.puzzleArea.clientWidth - targetSize;
      const maxY = ui.puzzleArea.clientHeight - targetSize;
      target.style.left = `${Math.random() * maxX}px`;
      target.style.top = `${Math.random() * maxY}px`;
      if (targetInfo.type === "penalty") {
        target.classList.add("penalty-target");
        target.addEventListener("click", (e) => {
          e.stopPropagation();
          if (!state.isPlayerTurn) return;
          handleIncorrect();
        });
      } else {
        target.style.animationDuration = `${shrinkDuration}s`;
        if (targetInfo.type === "moving") {
          target.classList.add("moving");
          target.style.animationDuration = `${shrinkDuration}s, ${
            Math.random() * 2 + 2
          }s`;
        }
        target.addEventListener("click", (e) => {
          e.stopPropagation();
          if (!state.isPlayerTurn || target.classList.contains("popped"))
            return;
          const rect = ui.puzzleArea.getBoundingClientRect();
          createParticleExplosion(e.clientX - rect.left, e.clientY - rect.top);
          target.classList.add("popped");
          clickedCount++;
          updateCounter();
          if (clickedCount >= targetsToClick) {
            state.isPlayerTurn = false;
            document
              .querySelectorAll(".penalty-target")
              .forEach((pt) => pt.remove());
            nextLevel();
          }
        });
        target.addEventListener("animationend", (e) => {
          if (
            e.animationName === "shrink-and-fade" &&
            !target.classList.contains("popped")
          ) {
            handleIncorrect();
          }
        });
      }
      ui.puzzleArea.appendChild(target);
    }
    let targets = [];
    for (let i = 0; i < targetsToClick; i++) targets.push({ type: "standard" });
    for (let i = 0; i < numPenaltyTargets; i++)
      targets.push({ type: "penalty" });
    for (let i = 0; i < numMovingTargets; i++) {
      if (targets[i] && targets[i].type === "standard")
        targets[i].type = "moving";
    }
    targets.sort(() => Math.random() - 0.5);
    targets.forEach((t) => spawnTarget(t));
  }
  function generateStopTheBar() {
    state.isPlayerTurn = true;
    ui.puzzleArea.innerHTML = `<div id="stop-the-bar-container"><div class="stb-track"><div class="stb-target-zone"></div><div class="stb-moving-bar"></div></div><button id="stop-button">أوقف!</button></div>`;
    const bar = ui.puzzleArea.querySelector(".stb-moving-bar");
    const stopBtn = document.getElementById("stop-button");
    const speed = Math.max(0.8, 3 - state.currentLevel * 0.07);
    bar.style.animationDuration = `${speed}s`;
    const target = ui.puzzleArea.querySelector(".stb-target-zone");
    const targetWidth = Math.max(15, 40 - state.currentLevel);
    target.style.width = `${targetWidth}%`;
    const maxPos = 100 - targetWidth;
    const randomPos = Math.random() * maxPos;
    target.style.left = `${randomPos}%`;
    stopBtn.addEventListener("click", () => {
      if (!state.isPlayerTurn) return;
      state.isPlayerTurn = false;
      clearInterval(state.timer);
      bar.classList.add("paused");
      const barRect = bar.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      if (
        barRect.left >= targetRect.left &&
        barRect.right <= targetRect.right
      ) {
        target.style.backgroundColor = "rgba(46, 204, 113, 0.7)";
        nextLevel();
      } else {
        target.style.backgroundColor = "rgba(233, 69, 96, 0.7)";
        handleIncorrect();
      }
    });
  }
  function generateSequenceLink() {
    state.isPlayerTurn = true;
    ui.puzzleArea.innerHTML = `<div class="sequence-area"><canvas class="sequence-canvas"></canvas></div>`;
    const area = ui.puzzleArea.querySelector(".sequence-area");
    const canvas = ui.puzzleArea.querySelector(".sequence-canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = area.clientWidth;
    canvas.height = area.clientHeight;
    const numPoints = Math.min(8, 3 + Math.floor(state.currentLevel / 4));
    const numDecoys = Math.floor(state.currentLevel / 5);
    const dotSize = 50;
    let currentPoint = 0;
    let lastPoint = null;
    function spawnPoint(index, isDecoy = false) {
      const dot = document.createElement("div");
      dot.className = isDecoy ? "sequence-dot decoy" : "sequence-dot";
      dot.textContent = isDecoy ? "X" : index + 1;
      dot.style.width = `${dotSize}px`;
      dot.style.height = `${dotSize}px`;
      dot.style.left = `${Math.random() * (canvas.width - dotSize)}px`;
      dot.style.top = `${Math.random() * (canvas.height - dotSize)}px`;
      if (isDecoy) {
        dot.addEventListener("click", handleIncorrect);
      } else {
        dot.dataset.index = index;
        dot.addEventListener("click", () => {
          if (
            !state.isPlayerTurn ||
            parseInt(dot.dataset.index) !== currentPoint
          ) {
            handleIncorrect();
            return;
          }
          dot.classList.add("connected");
          if (lastPoint) {
            ctx.beginPath();
            ctx.moveTo(
              lastPoint.offsetLeft + dotSize / 2,
              lastPoint.offsetTop + dotSize / 2
            );
            ctx.lineTo(
              dot.offsetLeft + dotSize / 2,
              dot.offsetTop + dotSize / 2
            );
            ctx.strokeStyle = "var(--main-color-alt)";
            ctx.lineWidth = 5;
            ctx.stroke();
          }
          lastPoint = dot;
          currentPoint++;
          if (currentPoint >= numPoints) {
            state.isPlayerTurn = false;
            nextLevel();
          }
        });
      }
      area.appendChild(dot);
    }
    for (let i = 0; i < numPoints; i++) spawnPoint(i);
    for (let i = 0; i < numDecoys; i++) spawnPoint(0, true);
  }
  function generateColorBalance() {
    state.isPlayerTurn = true;
    ui.puzzleArea.innerHTML = `<div class="color-balance-area"><div class="color-swatch target"></div><div class="color-swatch" id="mixed-color"></div><div class="color-mixer"><div class="color-swatch" id="color-a" style="width: 50px; height: 50px;"></div><input type="range" id="color-slider" min="0" max="100" value="50"><div class="color-swatch" id="color-b" style="width: 50px; height: 50px;"></div></div><button id="mix-button">تأكيد</button></div>`;
    const targetSwatch = ui.puzzleArea.querySelector(".target");
    const mixedSwatch = ui.puzzleArea.querySelector("#mixed-color");
    const colorA_Swatch = ui.puzzleArea.querySelector("#color-a");
    const colorB_Swatch = ui.puzzleArea.querySelector("#color-b");
    const slider = ui.puzzleArea.querySelector("#color-slider");
    const mixButton = ui.puzzleArea.querySelector("#mix-button");
    const randomColor = () => [
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
    ];
    const mixRGB = (rgbA, rgbB, ratio) => {
      const iRatio = 1 - ratio;
      const r = Math.round(rgbA[0] * iRatio + rgbB[0] * ratio);
      const g = Math.round(rgbA[1] * iRatio + rgbB[1] * ratio);
      const b = Math.round(rgbA[2] * iRatio + rgbB[2] * ratio);
      return [r, g, b];
    };
    const colorA = randomColor();
    const colorB = randomColor();
    const targetRatio = Math.random();
    const targetColor = mixRGB(colorA, colorB, targetRatio);
    const toCSS = (rgb) => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    colorA_Swatch.style.backgroundColor = toCSS(colorA);
    colorB_Swatch.style.backgroundColor = toCSS(colorB);
    targetSwatch.style.backgroundColor = toCSS(targetColor);
    function updateMixedColor() {
      const currentRatio = slider.value / 100;
      const mixedColor = mixRGB(colorA, colorB, currentRatio);
      mixedSwatch.style.backgroundColor = toCSS(mixedColor);
    }
    slider.addEventListener("input", updateMixedColor);
    updateMixedColor();
    mixButton.addEventListener("click", () => {
      if (!state.isPlayerTurn) return;
      state.isPlayerTurn = false;
      const currentRatio = slider.value / 100;
      const tolerance = 0.1 - state.currentLevel * 0.002;
      if (Math.abs(currentRatio - targetRatio) < tolerance) {
        nextLevel();
      } else {
        handleIncorrect();
      }
    });
  }

  init();
});
