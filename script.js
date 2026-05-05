let WORDS = [];

fetch("words.txt")
  .then(res => res.text())
  .then(text => {
    WORDS = text.split("\n").map(w => w.trim().toUpperCase());
    startGame();
  });

let target, row, col, current;
let guesses = [];
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
  keyColors = {};

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

  const layout = [
    "QWERTYUIOP",
    "ASDFGHJKL",
    "ZXCVBNM"
  ];

  layout.forEach((rowLetters, i)=>{
    const rowDiv = document.createElement("div");
    rowDiv.className = "key-row";

    if(i === 2){
      rowDiv.appendChild(createKey("ENTER", true));
    }

    rowLetters.split("").forEach(l=>{
      rowDiv.appendChild(createKey(l));
    });

    if(i === 2){
      rowDiv.appendChild(createKey("⌫", true));
    }

    keyboard.appendChild(rowDiv);
  });
}

function createKey(label, wide=false){
  const btn = document.createElement("div");
  btn.className = "key";
  if(wide) btn.classList.add("wide");

  btn.innerText = label;
  btn.onclick = () => handleKey(label);

  return btn;
}

function handleKey(key){
  if(key === "ENTER") submit();
  else if(key === "⌫") backspace();
  else press(key);
}

function press(letter){
  if(col<5){
    const tile = board.children[row].children[col];
    tile.innerText = letter;
    tile.classList.add("pop");
    setTimeout(()=>tile.classList.remove("pop"),100);

    current += letter;
    col++;
  }
}

function backspace(){
  if(col>0){
    col--;
    board.children[row].children[col].innerText="";
    current=current.slice(0,-1);
  }
}

document.addEventListener("keydown", e=>{
  if(e.key==="Backspace") backspace();
  else if(e.key==="Enter") submit();
  else if(/^[a-zA-Z]$/.test(e.key)) press(e.key.toUpperCase());
});

function submit(){
  if(current.length<5) return shake();
  if(!WORDS.includes(current)) return shake();

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
  const result = Array(5).fill("gray");
  const targetArr = target.split("");

  for(let i=0;i<5;i++){
    if(guess[i]===target[i]){
      result[i]="green";
      targetArr[i]=null;
    }
  }

  for(let i=0;i<5;i++){
    if(result[i]==="gray"){
      const idx = targetArr.indexOf(guess[i]);
      if(idx!==-1){
        result[i]="yellow";
        targetArr[idx]=null;
      }
    }
  }

  return result;
}

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
