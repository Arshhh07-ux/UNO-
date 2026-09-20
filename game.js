/* =========================================================
   CARD ARENA — GAME.JS
   PART 1 — MENU / SCREEN SYSTEM
========================================================= */

"use strict";

/* =========================================================
   GLOBAL GAME SETTINGS
========================================================= */

let gameMode = "OFFLINE";
let cardStyle = "RED";
let difficulty = "PRO";

let roomCode = "";


/* =========================================================
   SCREEN SYSTEM
========================================================= */

function show(id){

  const screens =
    document.querySelectorAll(".screen");

  screens.forEach(screen => {
    screen.classList.add("hidden");
    screen.classList.remove("fadeIn");
  });

  const target =
    document.getElementById(id);

  if(!target){
    console.warn("Screen not found:", id);
    return;
  }

  target.classList.remove("hidden");

  void target.offsetWidth;

  target.classList.add("fadeIn");
}


/* =========================================================
   OPTION SELECTOR
========================================================= */

function selectOption(button){

  if(!button) return;

  const parent =
    button.parentElement;

  if(parent){

    parent
      .querySelectorAll(".option")
      .forEach(option => {

        option.classList.remove("selected");

        const check =
          option.querySelector(".check");

        if(check){
          check.textContent = "";
        }

      });

  }

  button.classList.add("selected");

  const check =
    button.querySelector(".check");

  if(check){
    check.textContent = "✓";
  }

}


/* =========================================================
   DIFFICULTY
========================================================= */

function difficultySet(button){

  if(!button) return;

  const parent =
    button.parentElement;

  if(parent){

    parent
      .querySelectorAll("button")
      .forEach(btn => {

        btn.classList.remove("active");

      });

  }

  button.classList.add("active");

  difficulty =
    button.textContent
      .trim()
      .toUpperCase();

}


/* =========================================================
   CARD STYLE SCREEN
========================================================= */

function openStyles(mode){

  gameMode = mode || "OFFLINE";

  const modeText =
    document.getElementById("styleMode");

  if(modeText){

    modeText.textContent =
      gameMode === "ONLINE"
        ? "ONLINE CARD COLLECTION"
        : "SELECT YOUR CARD COLLECTION";

  }

  show("styles");

}


/* =========================================================
   ROOM CODE
========================================================= */

function generateRoom(){

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for(let i=0;i<6;i++){

    code +=
      chars[
        Math.floor(
          Math.random() * chars.length
        )
      ];

  }

  roomCode = code;

  const el =
    document.getElementById("roomCode");

  if(el){

    el.textContent = roomCode;

  }

  toastMessage(
    "ROOM CREATED • " + roomCode
  );

}


/* =========================================================
   JOIN ROOM
========================================================= */

function joinRoom(){

  const input =
    document.getElementById("joinCode");

  if(!input) return;

  const code =
    input.value
      .trim()
      .toUpperCase();

  if(code.length < 4){

    toastMessage(
      "ENTER A VALID ROOM CODE"
    );

    input.focus();

    return;

  }

  roomCode = code;

  toastMessage(
    "ROOM " + code + " JOINED"
  );

  setTimeout(() => {

    openStyles("ONLINE");

  },700);

}


/* =========================================================
   SIMPLE TOAST
========================================================= */

function toastMessage(message){

  let toast =
    document.getElementById("arenaToast");

  if(!toast){

    toast =
      document.createElement("div");

    toast.id =
      "arenaToast";

    toast.style.position = "fixed";
    toast.style.left = "50%";
    toast.style.bottom = "35px";

    toast.style.transform =
      "translateX(-50%)";

    toast.style.padding =
      "13px 20px";

    toast.style.borderRadius =
      "14px";

    toast.style.background =
      "rgba(20,20,20,.95)";

    toast.style.border =
      "1px solid rgba(255,255,255,.15)";

    toast.style.color =
      "white";

    toast.style.fontSize =
      "12px";

    toast.style.fontWeight =
      "900";

    toast.style.letterSpacing =
      "1px";

    toast.style.zIndex =
      "99999";

    toast.style.opacity =
      "0";

    toast.style.transition =
      ".25s ease";

    document.body.appendChild(toast);

  }

  toast.textContent =
    message;

  toast.style.opacity = "1";

  clearTimeout(
    toastMessage.timer
  );

  toastMessage.timer =
    setTimeout(() => {

      toast.style.opacity = "0";

    },1800);

}


/* =========================================================
   CARD STYLE SELECTION
========================================================= */

document.addEventListener(
  "click",
  function(event){

    const card =
      event.target.closest(".cardStyle");

    if(!card) return;

    document
      .querySelectorAll(".cardStyle")
      .forEach(item => {

        item.classList.remove("selected");

      });

    card.classList.add("selected");

    const name =
      card.querySelector(".styleName");

    if(name){

      cardStyle =
        name.textContent
          .trim()
          .toUpperCase();

    }

    toastMessage(
      "CARD STYLE SELECTED"
    );

  }
);


/* =========================================================
   INTRO
========================================================= */

function startArenaIntro(){

  const intro =
    document.getElementById("intro");

  const menu =
    document.getElementById("menu");

  if(!intro || !menu) return;

  show("intro");

}


/* =========================================================
   SAFE START
========================================================= */

window.addEventListener(
  "load",
  () => {

    /*
      We intentionally DO NOT start
      the 3D game here.

      The player must first go:

      INTRO
        ↓
      MENU
        ↓
      OFFLINE
        ↓
      CARD STYLE
        ↓
      GAME
    */

    console.log(
      "CARD ARENA ENGINE READY"
    );

  }
);


/* =========================================================
   GLOBAL ACCESS
========================================================= */

window.show = show;
window.selectOption = selectOption;
window.difficultySet = difficultySet;
window.openStyles = openStyles;
window.generateRoom = generateRoom;
window.joinRoom = joinRoom;


/* =========================================================
   PART 1 END
========================================================= */
/* =========================================================
   CARD ARENA — PART 2
   3D GAME TABLE + UNO DECK
========================================================= */

const COLORS = ["red", "yellow", "green", "blue"];

const UNO_VALUES = [
  "0","1","2","3","4","5","6","7","8","9",
  "+2","Skip","Reverse"
];

let gameDeck = [];
let playerHand = [];
let arshHand = [];

let currentCard = {
  color: "red",
  value: "7"
};

let gameScore = 0;
let playerTurn = true;
let gameBusy = false;


/* =========================================================
   CREATE REAL UNO DECK
========================================================= */

function createGameDeck(){

  gameDeck = [];

  COLORS.forEach(color => {

    /* One zero */

    gameDeck.push({
      color: color,
      value: "0"
    });

    /* Two of every 1-9 */

    for(let n = 1; n <= 9; n++){

      gameDeck.push({
        color: color,
        value: String(n)
      });

      gameDeck.push({
        color: color,
        value: String(n)
      });

    }

    /* Two action cards */

    ["+2","Skip","Reverse"].forEach(value => {

      gameDeck.push({
        color: color,
        value: value
      });

      gameDeck.push({
        color: color,
        value: value
      });

    });

  });


  /* 4 Wild */

  for(let i = 0; i < 4; i++){

    gameDeck.push({
      color: "black",
      value: "Wild"
    });

  }


  /* 4 Wild +4 */

  for(let i = 0; i < 4; i++){

    gameDeck.push({
      color: "black",
      value: "+4"
    });

  }


  shuffleGameDeck();

}


/* =========================================================
   SHUFFLE
========================================================= */

function shuffleGameDeck(){

  for(let i = gameDeck.length - 1; i > 0; i--){

    const j =
      Math.floor(Math.random() * (i + 1));

    [
      gameDeck[i],
      gameDeck[j]
    ] = [
      gameDeck[j],
      gameDeck[i]
    ];

  }

}


/* =========================================================
   DRAW CARD
========================================================= */

function drawGameCard(){

  if(gameDeck.length === 0){

    createGameDeck();

  }

  return gameDeck.pop();

}


/* =========================================================
   DEAL CARDS
========================================================= */

function dealGameCards(){

  playerHand = [];
  arshHand = [];

  for(let i = 0; i < 7; i++){

    playerHand.push(
      drawGameCard()
    );

    arshHand.push(
      drawGameCard()
    );

  }

}


/* =========================================================
   START REAL GAME
========================================================= */

function startRealGame(){

  gameBusy = false;
  playerTurn = true;
  gameScore = 0;

  createGameDeck();

  dealGameCards();

  let firstCard =
    drawGameCard();

  /*
    Don't start with +4.
  */

  while(
    firstCard.color === "black"
  ){

    gameDeck.unshift(firstCard);

    shuffleGameDeck();

    firstCard =
      drawGameCard();

  }

  currentCard = firstCard;

  show3DGame();

  renderPlayerHand();

  renderCurrentCard();

  updateGameCounters();

  setGameTurn("YOUR TURN");

  toastMessage(
    "MATCH STARTED 🔥"
  );

}


/* =========================================================
   SHOW GAME
========================================================= */

function show3DGame(){

  /*
    Existing HTML may already have
    a game screen. If it doesn't,
    create one automatically.
  */

  let game =
    document.getElementById("game");

  if(!game){

    game =
      document.createElement("section");

    game.id = "game";
    game.className = "screen";

    document.body.appendChild(game);

    buildGameInterface(game);

  }

  document
    .querySelectorAll(".screen")
    .forEach(screen => {

      screen.classList.add("hidden");

    });

  game.classList.remove("hidden");

}


/* =========================================================
   BUILD GAME INTERFACE
========================================================= */

function buildGameInterface(game){

  game.innerHTML = `

    <div id="gameTop">

      <button
        id="gameBack"
        onclick="show('menu')"
      >
        ←
      </button>

      <div id="gameTitle">
        UNO ARENA
      </div>

      <div id="gameScore">
        SCORE <b id="liveScore">0</b>
      </div>

    </div>


    <div id="arshArea">

      <div class="opponentAvatar">
        AR
      </div>

      <div>
        <b>ARSH</b>
        <small id="arshCount">
          7 CARDS
        </small>
      </div>

    </div>


    <div id="gameTable">

      <div id="tableGlow"></div>

      <div id="deckVisual">

        <div class="deckCard back1"></div>
        <div class="deckCard back2"></div>
        <div class="deckCard back3"></div>

        <div id="deckNumber">
          0
        </div>

      </div>


      <div id="currentVisual">
      </div>


      <div id="turnIndicator">
        YOUR TURN
      </div>

    </div>


    <div id="playerArea">

      <div id="playerHand">
      </div>

      <div id="gameControls">

        <button
          id="drawButton"
          onclick="drawPlayerCard()"
        >
          🎴 DRAW
        </button>

        <button
          id="unoButton"
          onclick="sayGameUno()"
        >
          UNO!
        </button>

      </div>

    </div>


    <div id="wildChooser">

      <div>
        CHOOSE COLOR
      </div>

      <button onclick="chooseGameColor('red')">
        🔴
      </button>

      <button onclick="chooseGameColor('yellow')">
        🟡
      </button>

      <button onclick="chooseGameColor('green')">
        🟢
      </button>

      <button onclick="chooseGameColor('blue')">
        🔵
      </button>

    </div>

  `;


  addGameStyles();

}


/* =========================================================
   GAME CSS
========================================================= */

function addGameStyles(){

  if(document.getElementById("gameDynamicCSS"))
    return;

  const style =
    document.createElement("style");

  style.id = "gameDynamicCSS";

  style.textContent = `

    #game{
      background:
        radial-gradient(
          circle at 50% 45%,
          #32101a 0%,
          #10070a 40%,
          #030303 100%
        );
      overflow:hidden;
      z-index:100;
    }

    #gameTop{
      position:absolute;
      top:18px;
      left:18px;
      right:18px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      z-index:20;
    }

    #gameBack{
      width:44px;
      height:44px;
      border-radius:50%;
      background:#171717;
      border:1px solid #444;
      font-size:22px;
    }

    #gameTitle{
      font-size:16px;
      font-weight:1000;
      letter-spacing:3px;
    }

    #gameScore{
      padding:9px 13px;
      border-radius:12px;
      background:#111;
      border:1px solid #333;
      color:#888;
      font-size:9px;
      letter-spacing:1px;
    }

    #gameScore b{
      color:#ffd54a;
      font-size:15px;
      margin-left:5px;
    }

    #arshArea{
      position:absolute;
      top:80px;
      left:50%;
      transform:translateX(-50%);
      display:flex;
      align-items:center;
      gap:10px;
      padding:10px 16px;
      border-radius:18px;
      background:rgba(10,10,10,.8);
      border:1px solid #333;
      z-index:10;
    }

    .opponentAvatar{
      width:42px;
      height:42px;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      background:linear-gradient(145deg,#ff3154,#710018);
      font-size:11px;
      font-weight:1000;
      box-shadow:0 0 20px rgba(255,23,68,.4);
    }

    #arshArea small{
      display:block;
      color:#777;
      margin-top:3px;
      font-size:9px;
    }

    #gameTable{
      position:absolute;
      width:min(700px,120vw);
      height:min(430px,75vw);
      left:50%;
      top:47%;
      transform:
        translate(-50%,-50%)
        perspective(900px)
        rotateX(55deg);
      border-radius:50%;
      background:
        radial-gradient(
          ellipse,
          #24131a 0%,
          #10090c 55%,
          #050505 100%
        );
      border:2px solid #48202a;
      box-shadow:
        0 0 80px rgba(255,23,68,.18),
        inset 0 0 80px #000;
    }

    #tableGlow{
      position:absolute;
      inset:10%;
      border-radius:50%;
      border:1px solid rgba(255,215,80,.15);
      box-shadow:
        0 0 50px rgba(255,193,7,.08);
    }

    #deckVisual{
      position:absolute;
      left:35%;
      top:42%;
      width:75px;
      height:105px;
      transform:
        translate(-50%,-50%)
        rotateZ(-8deg);
    }

    .deckCard{
      position:absolute;
      inset:0;
      border-radius:12px;
      border:3px solid white;
      background:
        linear-gradient(
          135deg,
          #ff3154,
          #710018
        );
      box-shadow:
        5px 8px 15px rgba(0,0,0,.6);
    }

    .back1{
      transform:translate(-8px,-7px)
        rotate(-7deg);
    }

    .back2{
      transform:translate(-4px,-3px)
        rotate(-3deg);
    }

    .back3{
      z-index:3;
    }

    #deckNumber{
      position:absolute;
      z-index:5;
      left:50%;
      top:50%;
      transform:translate(-50%,-50%);
      font-size:14px;
      font-weight:1000;
    }

    #currentVisual{
      position:absolute;
      left:65%;
      top:42%;
      width:82px;
      height:116px;
      transform:
        translate(-50%,-50%)
        rotate(4deg);
      border-radius:14px;
      border:4px solid white;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:42px;
      font-weight:1000;
      box-shadow:
        8px 12px 25px rgba(0,0,0,.7),
        0 0 30px rgba(255,255,255,.15);
      transition:.35s;
    }

    #turnIndicator{
      position:absolute;
      left:50%;
      bottom:18%;
      transform:translateX(-50%);
      padding:8px 15px;
      border-radius:12px;
      background:#111;
      border:1px solid #333;
      font-size:9px;
      font-weight:900;
      letter-spacing:2px;
      white-space:nowrap;
    }

    #      color:white;
      background:#111;
    }

    .gameCard:first-child{
      margin-left:0;
    }

    .gameCard:active{
      transform:translateY(-20px) scale(1.05)!important;
    }

    .gameCard.red{
      background:linear-gradient(145deg,#ff4965,#a90028);
    }

    .gameCard.yellow{
      background:linear-gradient(145deg,#ffe66d,#c28b00);
      color:#241900;
    }

    .gameCard.green{
      background:linear-gradient(145deg,#35efaa,#08784c);
    }

    .gameCard.blue{
      background:linear-gradient(145deg,#55b2ff,#0752a6);
    }

    .gameCard.black{
      background:
        linear-gradient(
          135deg,
          #ff1744,
          #151515 42%,
          #2196ff
        );
    }

    .gameCard.playable{
      box-shadow:
        0 0 12px rgba(255,255,255,.35),
        4px 8px 15px rgba(0,0,0,.7);
    }

    .gameCard.notPlayable{
      filter:brightness(.45);
      opacity:.65;
    }

    #gameControls{
      display:flex;
      justify-content:center;
      gap:10px;
      margin-top:4px;
    }

    #gameControls button{
      padding:12px 20px;
      border-radius:13px;
      font-weight:1000;
      font-size:11px;
      letter-spacing:1px;
    }

    #drawButton{
      background:#202020;
      border:1px solid #444;
    }

    #unoButton{
      background:linear-gradient(100deg,#e80032,#ff3154);
      box-shadow:0 8px 20px rgba(255,23,68,.25);
    }

    #wildChooser{
      position:absolute;
      left:50%;
      bottom:145px;
      transform:translateX(-50%) scale(.8);
      display:none;
      align-items:center;
      gap:8px;
      padding:14px;
      border-radius:18px;
      background:rgba(10,10,10,.97);
      border:1px solid #444;
      box-shadow:0 20px 60px rgba(0,0,0,.8);
      z-index:100;
    }

    #wildChooser.show{
      display:flex;
      animation:wildIn .25s ease forwards;
    }

    @keyframes wildIn{
      to{
        transform:translateX(-50%) scale(1);
      }
    }

    #wildChooser div{
      position:absolute;
      left:50%;
      top:-25px;
      transform:translateX(-50%);
      font-size:8px;
      letter-spacing:2px;
      color:#aaa;
      white-space:nowrap;
    }

    #wildChooser button{
      width:42px;
      height:42px;
      border-radius:50%;
      background:#181818;
      border:1px solid #444;
      font-size:20px;
    }

    @media(max-width:500px){

      #gameTable{
        width:125vw;
        height:70vw;
      }

      #deckVisual{
        left:32%;
        transform:
          translate(-50%,-50%)
          scale(.8)
          rotateZ(-8deg);
      }

      #currentVisual{
        left:68%;
        transform:
          translate(-50%,-50%)
          scale(.8)
          rotateZ(4deg);
      }

      .gameCard{
        width:45px;
        height:67px;
        margin-left:-10px;
        font-size:20px;
      }

      #playerHand{
        min-height:95px;
      }

      #gameControls button{
        padding:10px 15px;
      }

    }

  `;

  document.head.appendChild(style);

}


/* =========================================================
   RENDER PLAYER HAND
========================================================= */

function renderPlayerHand(){

  const handBox =
    document.getElementById("playerHand");

  if(!handBox) return;

  handBox.innerHTML = "";

  playerHand.forEach((card,index) => {

    const el =
      document.createElement("button");

    el.className =
      "gameCard " + card.color;

    el.textContent =
      card.value === "Wild"
        ? "★"
        : card.value;

    if(
      playerTurn &&
      canPlayGameCard(card)
    ){

      el.classList.add("playable");

    }
    else{

      el.classList.add("notPlayable");

    }

    el.onclick =
      () => playGameCard(index);

    handBox.appendChild(el);

  });

}


/* =========================================================
   CHECK PLAYABLE
========================================================= */

function canPlayGameCard(card){

  if(!card) return false;

  return (
    card.color === "black" ||
    card.color === currentCard.color ||
    card.value === currentCard.value
  );

}


/* =========================================================
   CURRENT CARD
========================================================= */

function renderCurrentCard(){

  const el =
    document.getElementById("currentVisual");

  if(!el) return;

  el.className =
    "";

  el.id =
    "currentVisual";

  el.classList.add(
    currentCard.color
  );

  el.textContent =
    currentCard.value === "Wild"
      ? "★"
      : currentCard.value;

}


/* =========================================================
   COUNTERS
========================================================= */

function updateGameCounters(){

  const score =
    document.getElementById("liveScore");

  if(score){

    score.textContent =
      gameScore;

  }


  const arsh =
    document.getElementById("arshCount");

  if(arsh){

    arsh.textContent =
      arshHand.length + " CARDS";

  }


  const deck =
    document.getElementById("deckNumber");

  if(deck){

    deck.textContent =
      gameDeck.length;

  }

}


/* =========================================================
   TURN TEXT
========================================================= */

function setGameTurn(textValue){

  const el =
    document.getElementById(
      "turnIndicator"
    );

  if(el){

    el.textContent =
      textValue;

  }

}


/* =========================================================
   END OF PART 2
========================================================= */
<script>

/* =========================================================
   CARD ARENA — PART 3
   PLAYER CARD ACTIONS + WILD + SCORING
========================================================= */


/* =========================================================
   PLAY PLAYER CARD
========================================================= */

function playGameCard(index){

  if(gameBusy) return;

  if(!playerTurn) return;

  const card =
    playerHand[index];

  if(!card) return;

  if(!canPlayGameCard(card)){

    toastMessage(
      "❌ CARD CANNOT BE PLAYED"
    );

    shakeGameTable();

    return;

  }

  gameBusy = true;

  animatePlayedCard(card);

  setTimeout(() => {

    playerHand.splice(index,1);

    currentCard = {
      color: card.color,
      value: card.value
    };

    addGameScore(card);

    renderPlayerHand();

    renderCurrentCard();

    updateGameCounters();

    specialGameEffect(card);


    /* PLAYER WINS */

    if(playerHand.length === 0){

      setTimeout(() => {

        finishGame(true);

      },600);

      return;

    }


    /*
      Wild card needs a color.
    */

    if(card.color === "black"){

      openGameWild();

      return;

    }


    playerTurn = false;

    renderPlayerHand();

    setGameTurn(
      "ARSH PRO THINKING..."
    );

    setTimeout(() => {

      arshGameTurn();

    },900);

  },450);

}


/* =========================================================
   DRAW
========================================================= */

function drawPlayerCard(){

  if(gameBusy) return;

  if(!playerTurn) return;

  gameBusy = true;

  const card =
    drawGameCard();

  playerHand.push(card);

  renderPlayerHand();

  updateGameCounters();

  toastMessage(
    "🎴 CARD DRAWN"
  );

  /*
    Automatically play if
    the drawn card is playable.
  */

  if(canPlayGameCard(card)){

    setTimeout(() => {

      gameBusy = false;

      toastMessage(
        "✨ YOU CAN PLAY THAT CARD"
      );

    },450);

  }
  else{

    setTimeout(() => {

      gameBusy = false;

      playerTurn = false;

      renderPlayerHand();

      setGameTurn(
        "ARSH PRO THINKING..."
      );

      setTimeout(() => {

        arshGameTurn();

      },700);

    },450);

  }

}


/* =========================================================
   WILD PICKER
========================================================= */

function openGameWild(){

  const chooser =
    document.getElementById(
      "wildChooser"
    );

  if(!chooser){

    chooseGameColor("red");

    return;

  }

  chooser.classList.add("show");

}


/* =========================================================
   CHOOSE WILD COLOR
========================================================= */

function chooseGameColor(color){

  if(
    !["red","yellow","green","blue"]
      .includes(color)
  ){

    return;

  }

  currentCard.color = color;

  const chooser =
    document.getElementById(
      "wildChooser"
    );

  if(chooser){

    chooser.classList.remove("show");

  }

  renderCurrentCard();

  toastMessage(
    "🌈 COLOR → " +
    color.toUpperCase()
  );

  playerTurn = false;

  renderPlayerHand();

  setGameTurn(
    "ARSH PRO THINKING..."
  );

  setTimeout(() => {

    arshGameTurn();

  },850);

}


/* =========================================================
   SCORE
========================================================= */

function addGameScore(card){

  if(!card) return;

  if(card.value === "+4"){

    gameScore += 50;

  }
  else if(card.value === "+2"){

    gameScore += 25;

  }
  else if(card.color === "black"){

    gameScore += 40;

  }
  else if(
    card.value === "Skip" ||
    card.value === "Reverse"
  ){

    gameScore += 20;

  }
  else{

    gameScore += 10;

  }

  const score =
    document.getElementById(
      "liveScore"
    );

  if(score){

    score.textContent =
      gameScore;

  }

}


/* =========================================================
   SPECIAL CARD EFFECTS
========================================================= */

function specialGameEffect(card){

  if(!card) return;


  if(card.value === "+2"){

    toastMessage(
      "💥 +2 ATTACK!"
    );

    shakeGameTable();

    flashGame();

  }


  else if(card.value === "+4"){

    toastMessage(
      "💣 WILD +4!"
    );

    shakeGameTable();

    flashGame();

    createGameParticles();

  }


  else if(card.value === "Skip"){

    toastMessage(
      "⛔ SKIP!"
    );

    flashGame();

  }


  else if(card.value === "Reverse"){

    toastMessage(
      "🔄 REVERSE!"
    );

    shakeGameTable();

  }

}


/* =========================================================
   PLAYED CARD ANIMATION
========================================================= */

function animatePlayedCard(card){

  const el =
    document.createElement("div");

  el.className =
    "gameCard " + card.color;

  el.textContent =
    card.value === "Wild"
      ? "★"
      : card.value;

  el.style.position =
    "fixed";

  el.style.left =
    "50%";

  el.style.bottom =
    "80px";

  el.style.zIndex =
    "9999";

  el.style.margin =
    "0";

  el.style.transition =
    ".55s cubic-bezier(.2,.8,.2,1)";

  document.body.appendChild(el);

  requestAnimationFrame(() => {

    el.style.left =
      "50%";

    el.style.bottom =
      "48%";

    el.style.transform =
      "translate(-50%,-50%) rotate(720deg) scale(.7)";

    el.style.opacity =
      "0";

  });

  setTimeout(() => {

    el.remove();

  },650);

}


/* =========================================================
   TABLE SHAKE
========================================================= */

function shakeGameTable(){

  const table =
    document.getElementById(
      "gameTable"
    );

  if(!table) return;

  table.animate(

    [
      {
        transform:
          "translate(-50%,-50%) perspective(900px) rotateX(55deg)"
      },

      {
        transform:
          "translate(calc(-50% - 8px),-50%) perspective(900px) rotateX(55deg)"
      },

      {
        transform:
          "translate(calc(-50% + 8px),-50%) perspective(900px) rotateX(55deg)"
      },

      {
        transform:
          "translate(-50%,-50%) perspective(900px) rotateX(55deg)"
      }
    ],

    {
      duration:360,
      easing:"ease-out"
    }

  );

}


/* =========================================================
   FLASH
========================================================= */

function flashGame(){

  const el =
    document.createElement("div");

  el.style.position =
    "fixed";

  el.style.inset =
    "0";

  el.style.background =
    "white";

  el.style.opacity =
    "0";

  el.style.zIndex =
    "9998";

  document.body.appendChild(el);

  el.animate(

    [
      {opacity:0},
      {opacity:.25},
      {opacity:0}
    ],

    {
      duration:400
    }

  );

  setTimeout(() => {

    el.remove();

  },450);

}


/* =========================================================
   PARTICLES
========================================================= */

function createGameParticles(){

  for(let i=0;i<30;i++){

    const p =
      document.createElement("div");

    p.style.position =
      "fixed";

    p.style.left =
      "50%";

    p.style.top =
      "50%";

    p.style.width =
      "6px";

    p.style.height =
      "6px";

    p.style.borderRadius =
      "50%";

    p.style.background =
      COLORS[
        Math.floor(
          Math.random() * COLORS.length
        )
      ];

    p.style.zIndex =
      "9999";

    document.body.appendChild(p);

    const angle =
      Math.random() *
      Math.PI * 2;

    const distance =
      100 +
      Math.random() * 250;

    p.animate(

      [
        {
          transform:
            "translate(-50%,-50%) scale(1)",
          opacity:1
        },

        {
          transform:
            `translate(
              calc(-50% + ${Math.cos(angle)*distance}px),
              calc(-50% + ${Math.sin(angle)*distance}px)
            ) scale(0)`,
          opacity:0
        }
      ],

      {
        duration:
          600 +
          Math.random() * 500
      }

    );

    setTimeout(() => {

      p.remove();

    },1200);

  }

}


/* =========================================================
   UNO BUTTON
========================================================= */

function sayGameUno(){

  if(playerHand.length === 1){

    toastMessage(
      "🔥 UNO!"
    );

    gameScore += 25;

    updateGameCounters();

    createGameParticles();

  }
  else{

    toastMessage(
      "YOU NEED 1 CARD!"
    );

  }

}


/* =========================================================
   START GAME BUTTON SUPPORT
========================================================= */

function launchCardArena(){

  startRealGame();

}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.startRealGame =
  startRealGame;

window.launchCardArena =
  launchCardArena;

window.playGameCard =
  playGameCard;

window.drawPlayerCard =
  drawPlayerCard;

window.chooseGameColor =
  chooseGameColor;

window.sayGameUno =
  sayGameUno;


/* =========================================================
   PART 3 END
========================================================= */

</script>
