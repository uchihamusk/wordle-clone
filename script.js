let WORDS = [];

// LOAD WORD LIST
fetch("words.txt")
  .then(res => res.text())
  .then(text => {
    WORDS = text.split("\n").map(w => w.trim().toUpperCase());
    startGame();
  });

let target, row, col, current, guesses;
let keyColors = {};

function getDailyWord() {
  const start = new Date(2022,0,1);
  const today = new Date();
  const diff = Math.floor((today - start)/(1000*60*60*24));
  return WORDS[diff % WORDS.length];
}

function startGame() {
  target = getDailyWord();
  row = 0;
  col = 0;
  current = "";
  guesses = [];

  createBoard();
  createKeyboard();
  updateTimer();
}

function createBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";

  for (let r=0;r<6;r++){
    const rowDiv = document.createElement("div");
    rowDiv.className = "row";

    for (let c=0;c<5;c++){
      const tile = document.createElement("div");
      tile.className = "tile";
      rowDiv.appendChild(tile);
    }

    board.appendChild(rowDiv);
  }
}

function createKeyboard() {
  const keyboard = document.getElementById("keyboard");
  keyboard.innerHTML = "";

  "QWERTYUIOPASDFGHJKLZXCVBNM".split("").forEach(k=>{
    const btn = document.createElement("div");
    btn.className = "key";
    btn.innerText = k;
    btn.onclick = ()=>press(k);
    keyboard.appendChild(btn);
  });
}

function press(letter){
  if(col<5){
    board.children[row].children[col].innerText = letter;
    current += letter;
    col++;
  }
}

document.addEventListener("keydown", e=>{
  if(e.key==="Backspace"){
    if(col>0){
      col--;
      board.children[row].children[col].innerText="";
      current=current.slice(0,-1);
    }
  }
  else if(e.key==="Enter") submit();
  else if(/^[a-zA-Z]$/.test(e.key)) press(e.key.toUpperCase());
});

function submit(){
  if(current.length<5) return shake();

  if(!WORDS.includes(current)){
    return shake();
  }

  const colors = evaluate(current);
  guesses.push(colors);

  for(let i=0;i<5;i++){
    const tile = board.children[row].children[i];

    setTimeout(()=>{
      tile.classList.add("flip");

      setTimeout(()=>{
        tile.classList.remove("flip");
        tile.classList.add(colors[i]);
        updateKey(current[i], colors[i]);
      },150);

    }, i*300);
  }

  if(current===target){
    setTimeout(()=>showPopup(true),1800);
    return;
  }

  row++;
  col=0;
  current="";

  if(row===6){
    setTimeout(()=>showPopup(false),1800);
  }
}

function evaluate(guess){
  const res = Array(5).fill("gray");
  let temp = target.split("");

  for(let i=0;i<5;i++){
    if(guess[i]===target[i]){
      res[i]="green";
      temp[i]=null;
    }
  }

  for(let i=0;i<5;i++){
    if(res[i]==="gray" && temp.includes(guess[i])){
      res[i]="yellow";
      temp[temp.indexOf(guess[i])] = null;
    }
  }

  return res;
}

// KEY PRIORITY (important!)
function updateKey(letter, color){
  const priority = {gray:1, yellow:2, green:3};

  if(!keyColors[letter] || priority[color] > priority[keyColors[letter]]){
    keyColors[letter] = color;

    [...document.getElementsByClassName("key")].forEach(k=>{
      if(k.innerText===letter){
        k.classList.remove("gray","yellow","green");
        k.classList.add(color);
      }
    });
  }
}

function shake(){
  const rowDiv = board.children[row];
  rowDiv.style.transform="translateX(10px)";
  setTimeout(()=>rowDiv.style.transform="translateX(-10px)",50);
  setTimeout(()=>rowDiv.style.transform="translateX(0)",100);
}

function showPopup(win){
  document.getElementById("popup").classList.remove("hidden");

  document.getElementById("popup-text").innerText =
    win ? "You Win!" : "Word was " + target;

  let stats = JSON.parse(localStorage.getItem("stats")) || {played:0,wins:0,streak:0};
  stats.played++;

  if(win){ stats.wins++; stats.streak++; }
  else stats.streak=0;

  localStorage.setItem("stats", JSON.stringify(stats));

  document.getElementById("stats").innerText =
    `Played: ${stats.played} | Wins: ${stats.wins} | Streak: ${stats.streak}`;

  updateCountdown();
}

// COUNTDOWN
function updateCountdown(){
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setHours(24,0,0,0);

  const diff = tomorrow - now;

  const h = Math.floor(diff/1000/60/60);
  const m = Math.floor(diff/1000/60)%60;
  const s = Math.floor(diff/1000)%60;

  document.getElementById("countdown").innerText =
    `Next Word in ${h}:${m}:${s}`;

  setTimeout(updateCountdown,1000);
}

// SHARE
function copyResult(){
  let text = "Wordle Clone\n\n";

  guesses.forEach(r=>{
    r.forEach(c=>{
      text += c==="green"?"🟩":c==="yellow"?"🟨":"⬛";
    });
    text+="\n";
  });

  navigator.clipboard.writeText(text);
  alert("Copied!");
}

function restart(){
  location.reload();
}

// TIMER TOP
function updateTimer(){
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setHours(24,0,0,0);

  const diff = tomorrow - now;

  const h = Math.floor(diff/1000/60/60);
  const m = Math.floor(diff/1000/60)%60;

  document.getElementById("timer").innerText =
    `Next puzzle in ${h}h ${m}m`;

  setTimeout(updateTimer,60000);
}