let WORDS = [];

let target;

let row = 0;
let col = 0;

let current = "";

let guesses = [];

let keyColors = {};

let animating = false;

const board = document.getElementById("board");

fetch("words.txt")
  .then(res => res.text())
  .then(text => {

    WORDS = text
      .split("\n")
      .map(w => w.trim().toUpperCase())
      .filter(w => w.length === 5);

    startGame();
  });

function getPuzzleNumber() {

  const start = new Date(2022, 0, 1);

  const today = new Date();

  return Math.floor(
    (today - start) /
    (1000 * 60 * 60 * 24)
  );
}

function getDailyWord() {

  const puzzleNumber =
    getPuzzleNumber();

  return WORDS[
    puzzleNumber % WORDS.length
  ];
}

function startGame() {

  target = getDailyWord();

  row = 0;
  col = 0;

  current = "";

  guesses = [];

  keyColors = {};

  createBoard();

  createKeyboard();

  updateTimer();
}

function createBoard() {

  board.innerHTML = "";

  for (let r = 0; r < 6; r++) {

    const rowDiv =
      document.createElement("div");

    rowDiv.className = "row";

    for (let c = 0; c < 5; c++) {

      const tile =
        document.createElement("div");

      tile.className = "tile";

      rowDiv.appendChild(tile);
    }

    board.appendChild(rowDiv);
  }
}

function createKeyboard() {

  const keyboard =
    document.getElementById("keyboard");

  keyboard.innerHTML = "";

  const layout = [
    "QWERTYUIOP",
    "ASDFGHJKL",
    "ZXCVBNM"
  ];

  layout.forEach((letters, index) => {

    const rowDiv =
      document.createElement("div");

    rowDiv.className = "key-row";

    if (index === 2) {
      rowDiv.appendChild(
        createKey("ENTER", true)
      );
    }

    letters.split("").forEach(letter => {

      rowDiv.appendChild(
        createKey(letter)
      );

    });

    if (index === 2) {
      rowDiv.appendChild(
        createKey("⌫", true)
      );
    }

    keyboard.appendChild(rowDiv);
  });
}

function createKey(label, wide = false) {

  const key =
    document.createElement("div");

  key.className = "key";

  if (wide) {
    key.classList.add("wide");
  }

  key.innerText = label;

  key.onclick = () => handleKey(label);

  return key;
}

function handleKey(key) {

  if (animating) return;

  if (key === "ENTER") {
    submit();
    return;
  }

  if (key === "⌫") {
    backspace();
    return;
  }

  press(key);
}

function press(letter) {

  if (col >= 5) return;

  const tile =
    board.children[row].children[col];

  tile.innerText = letter;

  tile.classList.add("filled");

  tile.classList.add("pop");

  setTimeout(() => {
    tile.classList.remove("pop");
  }, 120);

  current += letter;

  col++;
}

function backspace() {

  if (col <= 0) return;

  col--;

  const tile =
    board.children[row].children[col];

  tile.innerText = "";

  tile.classList.remove("filled");

  current =
    current.slice(0, -1);
}

document.addEventListener("keydown", e => {

  if (animating) return;

  if (e.key === "Enter") {
    submit();
    return;
  }

  if (e.key === "Backspace") {
    backspace();
    return;
  }

  if (/^[a-zA-Z]$/.test(e.key)) {
    press(e.key.toUpperCase());
  }
});

function submit() {

  if (current.length < 5) {
    shake();
    return;
  }

  if (!WORDS.includes(current)) {
    shake();
    return;
  }

  animating = true;

  const colors =
    evaluate(current);

  guesses.push(colors);

  const guessedWord = current;

  for (let i = 0; i < 5; i++) {

    const tile =
      board.children[row].children[i];

    setTimeout(() => {

      tile.style.transform =
        "rotateX(90deg)";

      setTimeout(() => {

        tile.classList.add(colors[i]);

        updateKey(
          guessedWord[i],
          colors[i]
        );

        tile.style.transform =
          "rotateX(0deg)";

      }, 125);

    }, i * 320);
  }

  setTimeout(() => {

    if (guessedWord === target) {

      showPopup(true);

      animating = false;

      return;
    }

    row++;

    col = 0;

    current = "";

    if (row === 6) {

      showPopup(false);

      animating = false;

      return;
    }

    animating = false;

  }, 1900);
}

function evaluate(guess) {

  const result =
    Array(5).fill("gray");

  const temp =
    target.split("");

  for (let i = 0; i < 5; i++) {

    if (guess[i] === target[i]) {

      result[i] = "green";

      temp[i] = null;
    }
  }

  for (let i = 0; i < 5; i++) {

    if (result[i] === "gray") {

      const index =
        temp.indexOf(guess[i]);

      if (index !== -1) {

        result[i] = "yellow";

        temp[index] = null;
      }
    }
  }

  return result;
}

function updateKey(letter, color) {

  const priority = {
    gray: 1,
    yellow: 2,
    green: 3
  };

  const previous =
    keyColors[letter];

  if (
    !previous ||
    priority[color] >
    priority[previous]
  ) {

    keyColors[letter] = color;

    document
      .querySelectorAll(".key")
      .forEach(key => {

        if (key.innerText === letter) {

          key.classList.remove(
            "gray",
            "yellow",
            "green"
          );

          key.classList.add(color);
        }
      });
  }
}

function shake() {

  const rowDiv =
    board.children[row];

  rowDiv.animate([
    { transform: 'translateX(0px)' },
    { transform: 'translateX(-8px)' },
    { transform: 'translateX(8px)' },
    { transform: 'translateX(-6px)' },
    { transform: 'translateX(6px)' },
    { transform: 'translateX(0px)' }
  ], {
    duration: 350,
    easing: 'ease'
  });
}

function showPopup(win) {

  document
    .getElementById("popup")
    .classList.remove("hidden");

  document
    .getElementById("popup-text")
    .innerText =
      win
        ? "Congratulations!"
        : target;

  let stats =
    JSON.parse(
      localStorage.getItem("stats")
    ) || {
      played: 0,
      wins: 0,
      streak: 0
    };

  stats.played++;

  if (win) {
    stats.wins++;
    stats.streak++;
  }
  else {
    stats.streak = 0;
  }

  localStorage.setItem(
    "stats",
    JSON.stringify(stats)
  );

  document
    .getElementById("stats")
    .innerHTML = `
      <p>Played: ${stats.played}</p>
      <p>Wins: ${stats.wins}</p>
      <p>Streak: ${stats.streak}</p>
    `;

  updateCountdown();
}

function updateCountdown() {

  const now = new Date();

  const tomorrow = new Date();

  tomorrow.setHours(24, 0, 0, 0);

  const diff =
    tomorrow - now;

  const h =
    Math.floor(diff / 1000 / 60 / 60);

  const m =
    Math.floor(diff / 1000 / 60) % 60;

  const s =
    Math.floor(diff / 1000) % 60;

  document
    .getElementById("countdown")
    .innerText =
      `Next word in ${h}:${m}:${s}`;

  setTimeout(updateCountdown, 1000);
}

function copyResult() {

  const puzzleNumber =
    getPuzzleNumber();

  const score =
    row >= 6 && current !== target
      ? "X"
      : (row + 1);

  let text =
    `Wordle ${puzzleNumber} ${score}/6\n\n`;

  guesses.forEach(r => {

    r.forEach(c => {

      if (c === "green") {
        text += "🟩";
      }
      else if (c === "yellow") {
        text += "🟨";
      }
      else {
        text += "⬛";
      }
    });

    text += "\n";
  });

  navigator.clipboard.writeText(text);

  showCopiedToast();
}

function showCopiedToast() {

  const toast =
    document.createElement("div");

  toast.className = "toast";

  toast.innerText =
    "Copied results to clipboard";

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  setTimeout(() => {

    toast.classList.remove("show");

    setTimeout(() => {
      toast.remove();
    }, 300);

  }, 1800);
}

function updateTimer() {

  const now = new Date();

  const tomorrow = new Date();

  tomorrow.setHours(24, 0, 0, 0);

  const diff =
    tomorrow - now;

  const h =
    Math.floor(diff / 1000 / 60 / 60);

  const m =
    Math.floor(diff / 1000 / 60) % 60;

  document
    .getElementById("timer")
    .innerText =
      `Next puzzle in ${h}h ${m}m`;

  setTimeout(updateTimer, 60000);
}
