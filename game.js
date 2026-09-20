/* =========================================================
   ARSH CARD ARENA — GAME.JS
   PART 1 / 10
   Core + Game State + Card System
   ========================================================= */

"use strict";

/* =========================================================
   THREE.JS VARIABLES
   ========================================================= */

let scene = null;
let camera = null;
let renderer = null;

let raycaster = null;
let pointer = new THREE.Vector2();

let animationFrame = null;
let resizeHandler = null;

/* =========================================================
   GAME STATE
   ========================================================= */

let gameRunning = false;
let gameOver = false;

let playerHand = [];
let aiHand = [];

let deck = [];
let discardPile = [];

let currentTurn = "PLAYER";
let currentColor = null;

let playerCalledUNO = false;
let playerNeedsUNO = false;

let aiCalledUNO = false;
let aiNeedsUNO = false;

let selectedCardIndex = -1;

let gameObjects = [];
let animationObjects = [];

let playerGroup = null;
let aiGroup = null;
let deckGroup = null;
let discardGroup = null;
let boardGroup = null;

/* =========================================================
   COLORS
   ========================================================= */

const COLOR_NAMES = [
  "RED",
  "BLUE",
  "GREEN",
  "YELLOW"
];

const COLORS = {
  RED: 0xff1744,
  BLUE: 0x1677ff,
  GREEN: 0x16c96b,
  YELLOW: 0xffc400,
  BLACK: 0x10131c,
  WHITE: 0xffffff,
  GOLD: 0xffd54a
};

const COLOR_HEX = {
  RED: "#ff1744",
  BLUE: "#1677ff",
  GREEN: "#16c96b",
  YELLOW: "#ffc400"
};

/* =========================================================
   CARD VALUES
   ========================================================= */

const CARD_VALUES = {
  ZERO: "0",
  SKIP: "SKIP",
  REVERSE: "REVERSE",
  DRAW2: "+2",
  WILD: "WILD",
  WILD4: "+4"
};

/* =========================================================
   CARD STYLE SETTINGS
   ========================================================= */

const CARD_STYLES = {
  NORMAL: {
    name: "NORMAL",
    glow: false,
    metallic: false,
    rainbow: false
  },

  GALAXY: {
    name: "GALAXY",
    glow: true,
    metallic: true,
    rainbow: true
  }
};

/* =========================================================
   UTILITY
   ========================================================= */

function safeUpper(value, fallback) {

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  return String(value).toUpperCase();
}


function getSelectedGameSettings() {

  try {

    if (
      typeof window.gameMode !== "undefined" &&
      window.gameMode
    ) {
      gameMode = window.gameMode;
    }

    if (
      typeof window.cardStyle !== "undefined" &&
      window.cardStyle
    ) {
      cardStyle = window.cardStyle;
    }

    if (
      typeof window.difficulty !== "undefined" &&
      window.difficulty
    ) {
      difficulty = window.difficulty;
    }

  } catch (error) {

    console.warn(
      "Game settings could not be read:",
      error
    );
  }

  gameMode = safeUpper(
    gameMode,
    "OFFLINE"
  );

  cardStyle = safeUpper(
    cardStyle,
    "NORMAL"
  );

  difficulty = safeUpper(
    difficulty,
    "PRO"
  );

  if (!CARD_STYLES[cardStyle]) {
    cardStyle = "NORMAL";
  }
}


/* =========================================================
   CARD FACTORY
   ========================================================= */

function createCard(
  color,
  value,
  type
) {

  return {

    id:
      "card_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2),

    color: color,

    value: value,

    type: type,

    style: cardStyle,

    played: false

  };
}


/* =========================================================
   CREATE DECK
   ========================================================= */

function createDeck() {

  deck = [];

  /* -------------------------------------------------------
     COLOURED CARDS
     ------------------------------------------------------- */

  for (
    const color of COLOR_NAMES
  ) {

    /* ZERO */

    deck.push(
      createCard(
        color,
        "0",
        "number"
      )
    );

    /* 1 - 9 TWO COPIES */

    for (
      let number = 1;
      number <= 9;
      number++
    ) {

      deck.push(
        createCard(
          color,
          String(number),
          "number"
        )
      );

      deck.push(
        createCard(
          color,
          String(number),
          "number"
        )
      );
    }

    /* ACTION CARDS */

    for (
      let i = 0;
      i < 2;
      i++
    ) {

      deck.push(
        createCard(
          color,
          "SKIP",
          "skip"
        )
      );

      deck.push(
        createCard(
          color,
          "REVERSE",
          "reverse"
        )
      );

      deck.push(
        createCard(
          color,
          "+2",
          "draw2"
        )
      );
    }
  }

  /* -------------------------------------------------------
     WILD CARDS
     ------------------------------------------------------- */

  for (
    let i = 0;
    i < 4;
    i++
  ) {

    deck.push(
      createCard(
        null,
        "WILD",
        "wild"
      )
    );

    deck.push(
      createCard(
        null,
        "+4",
        "wild4"
      )
    );
  }

  return deck;
}


/* =========================================================
   SHUFFLE
   ========================================================= */

function shuffle(cards) {

  for (
    let i = cards.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    const temp = cards[i];

    cards[i] = cards[j];

    cards[j] = temp;
  }

  return cards;
}


/* =========================================================
   DRAW FROM DECK
   ========================================================= */

function drawFromDeck() {

  if (
    deck.length === 0
  ) {

    refillDeck();
  }

  if (
    deck.length === 0
  ) {

    console.warn(
      "Deck is empty."
    );

    return null;
  }

  return deck.pop();
}


/* =========================================================
   REFILL DECK
   ========================================================= */

function refillDeck() {

  if (
    discardPile.length <= 1
  ) {
    return;
  }

  const topCard =
    discardPile.pop();

  deck =
    discardPile.splice(
      0,
      discardPile.length
    );

  discardPile = [
    topCard
  ];

  /* Wild cards remain usable,
     but their current colour is
     controlled separately. */

  shuffle(deck);
}


/* =========================================================
   DEAL INITIAL HANDS
   ========================================================= */

function dealInitialCards() {

  playerHand = [];
  aiHand = [];

  for (
    let i = 0;
    i < 7;
    i++
  ) {

    const playerCard =
      drawFromDeck();

    const aiCard =
      drawFromDeck();

    if (playerCard) {
      playerHand.push(
        playerCard
      );
    }

    if (aiCard) {
      aiHand.push(
        aiCard
      );
    }
  }
}


/* =========================================================
   FIRST DISCARD
   ========================================================= */

function startFirstDiscard() {

  let firstCard =
    drawFromDeck();

  if (!firstCard) {
    return;
  }

  /*
   Keep the opening card simple.
   Wild and +4 are returned to deck.
  */

  let attempts = 0;

  while (
    (
      firstCard.type === "wild" ||
      firstCard.type === "wild4"
    ) &&
    attempts < 20
  ) {

    deck.unshift(
      firstCard
    );

    shuffle(deck);

    firstCard =
      drawFromDeck();

    attempts++;
  }

  if (!firstCard) {
    return;
  }

  discardPile.push(
    firstCard
  );

  currentColor =
    firstCard.color ||
    getRandomColor();
}


/* =========================================================
   RANDOM COLOUR
   ========================================================= */

function getRandomColor() {

  return COLOR_NAMES[
    Math.floor(
      Math.random() *
      COLOR_NAMES.length
    )
  ];
}


/* =========================================================
   CARD MATCHING
   ========================================================= */

function canPlayCard(card) {

  if (!card) {
    return false;
  }

  const topCard =
    discardPile[
      discardPile.length - 1
    ];

  if (!topCard) {
    return true;
  }

  /* WILD */

  if (
    card.type === "wild" ||
    card.type === "wild4"
  ) {

    /*
      +4 can only be used when
      the player has no card of
      the current colour.
    */

    if (
      card.type === "wild4"
    ) {

      const hasCurrentColor =
        playerHand.some(
          c =>
            c.color === currentColor
        );

      if (hasCurrentColor) {
        return false;
      }
    }

    return true;
  }

  /* SAME COLOUR */

  if (
    card.color === currentColor
  ) {
    return true;
  }

  /* SAME VALUE */

  if (
    card.value === topCard.value
  ) {
    return true;
  }

  return false;
}


/* =========================================================
   RESET GAME STATE
   ========================================================= */

function resetGameState() {

  gameOver = false;

  currentTurn = "PLAYER";

  currentColor = null;

  selectedCardIndex = -1;

  playerCalledUNO = false;
  playerNeedsUNO = false;

  aiCalledUNO = false;
  aiNeedsUNO = false;

  playerHand = [];
  aiHand = [];

  deck = [];
  discardPile = [];
}


/* =========================================================
   NEXT PART
   =========================================================
   PART 2 WILL ADD:
   - Complete startGame()
   - Game HTML UI
   - UNO button
   - Draw button
   - Wild colour selector
   - End screen
   ========================================================= */
/* =========================================================
   ARSH CARD ARENA
   PART 2 / 10
   GAME START + HTML UI + GAME STYLES
   ========================================================= */

function startGame() {

  if (gameRunning) {
    return;
  }

  gameRunning = true;

  getSelectedGameSettings();

  resetGameState();

  /*
   Completely replace the menu only
   after Enter Arena is pressed.
  */

  document.body.innerHTML = `
    
    <div id="game3d"></div>

    <div id="gameVignette"></div>

    <!-- TOP PLAYER BAR -->

    <div id="topUI">

      <div class="arenaLogo">
        <span class="logoBig">UNO</span>
        <span class="logoSmall">ARENA</span>
      </div>

      <div class="playerInfo">

        <b>ARSH</b>

        <small>
          PRO PLAYER
        </small>

      </div>

      <div class="modeInfo">
        ${gameMode}
      </div>

    </div>


    <!-- TURN -->

    <div id="turnUI">
      YOUR TURN
    </div>


    <!-- CURRENT COLOUR -->

    <div id="colorUI">

      <span class="colorLabel">
        COLOR
      </span>

      <span id="currentColorText">
        ---
      </span>

    </div>


    <!-- AI COUNTER -->

    <div id="aiCounter">

      <span>
        OPPONENT
      </span>

      <b id="aiCardCount">
        7
      </b>

    </div>


    <!-- PLAYER COUNTER -->

    <div id="cardCounter">

      <span>
        YOUR CARDS
      </span>

      <b id="playerCardCount">
        7
      </b>

    </div>


    <!-- DRAW BUTTON -->

    <button
      id="drawCard"
      type="button"
    >
      <span class="drawIcon">
        +
      </span>

      DRAW CARD

    </button>


    <!-- UNO BUTTON -->

    <button
      id="unoButton"
      type="button"
      aria-label="UNO"
    >

      <span>
        UNO
      </span>

    </button>


    <!-- MESSAGE -->

    <div id="gameMessage">
    </div>


    <!-- WILD COLOUR PICKER -->

    <div id="wildChooser">

      <div class="wildPanel">

        <div class="wildTitle">
          CHOOSE COLOR
        </div>

        <div class="wildSubtitle">
          Select the next color
        </div>

        <div class="wildColors">

          <button
            type="button"
            data-color="RED"
            class="wildRed"
          >
            RED
          </button>

          <button
            type="button"
            data-color="BLUE"
            class="wildBlue"
          >
            BLUE
          </button>

          <button
            type="button"
            data-color="GREEN"
            class="wildGreen"
          >
            GREEN
          </button>

          <button
            type="button"
            data-color="YELLOW"
            class="wildYellow"
          >
            YELLOW
          </button>

        </div>

      </div>

    </div>


    <!-- END SCREEN -->

    <div id="endScreen">

      <div class="endBox">

        <div
          id="endTitle"
        >
          YOU WIN
        </div>

        <div
          id="endSub"
        >
          CARD ARENA
        </div>

        <div
          id="endStats"
        >
          GAME COMPLETE
        </div>

        <button
          id="restartGame"
          type="button"
        >
          PLAY AGAIN
        </button>

        <button
          id="backMenu"
          type="button"
        >
          BACK TO MENU
        </button>

      </div>

    </div>

  `;

  injectGameStyles();

  /*
   Important:
   Create Three.js only after
   HTML exists.
  */

  createArena3D();

  /*
   Create the actual deck and hands.
  */

  createDeck();

  shuffle(deck);

  dealInitialCards();

  startFirstDiscard();

  /*
   Draw/render everything.
  */

  renderHands(true);

  renderDeckPile();

  renderDiscard();

  updateUI();

  setupButtons();

  /*
   Start the game.
  */

  currentTurn = "PLAYER";

  gameOver = false;

  showMessage(
    "YOUR TURN",
    1000
  );
}


/* =========================================================
   GAME STYLES
   ========================================================= */

function injectGameStyles() {

  const oldStyle =
    document.getElementById(
      "arenaGameStyles"
    );

  if (oldStyle) {
    oldStyle.remove();
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "arenaGameStyles";

  style.textContent = `

    *{
      box-sizing:border-box;
      -webkit-tap-highlight-color:transparent;
    }


    html,
    body{
      width:100%;
      height:100%;
      margin:0;
      padding:0;
      overflow:hidden;
    }


    body{

      background:#020509;

      color:white;

      font-family:
        Arial,
        Helvetica,
        sans-serif;

      user-select:none;

      touch-action:none;

    }


    button{

      font-family:
        Arial,
        Helvetica,
        sans-serif;

      cursor:pointer;

      -webkit-user-select:none;

      user-select:none;

    }


    #game3d{

      position:fixed;

      inset:0;

      width:100%;

      height:100%;

      overflow:hidden;

      background:

        radial-gradient(
          circle at 50% 42%,
          #105335 0%,
          #062817 30%,
          #02130c 55%,
          #010408 100%
        );

    }


    #game3d canvas{

      position:absolute;

      inset:0;

      width:100%!important;

      height:100%!important;

      display:block;

      outline:none;

    }


    #gameVignette{

      position:fixed;

      inset:0;

      z-index:5;

      pointer-events:none;

      background:

        radial-gradient(
          ellipse at center,
          transparent 42%,
          rgba(0,0,0,.18) 68%,
          rgba(0,0,0,.72) 100%
        );

    }


    /* =====================================================
       TOP UI
       ===================================================== */

    #topUI{

      position:fixed;

      top:14px;

      left:14px;

      right:14px;

      height:58px;

      z-index:20;

      display:flex;

      align-items:center;

      gap:12px;

      pointer-events:none;

    }


    .arenaLogo{

      width:62px;

      height:50px;

      display:flex;

      flex-direction:column;

      justify-content:center;

      align-items:center;

      border:

        2px solid
        rgba(255,255,255,.95);

      border-radius:15px;

      background:

        linear-gradient(
          135deg,
          #ff3157,
          #b0002e
        );

      transform:rotate(-5deg);

      box-shadow:

        0 0 18px
        rgba(255,23,68,.55),

        inset 0 0 12px
        rgba(255,255,255,.15);

    }


    .logoBig{

      font-size:18px;

      font-weight:1000;

      font-style:italic;

      line-height:18px;

      letter-spacing:-1px;

    }


    .logoSmall{

      color:#ffd54a;

      font-size:7px;

      font-weight:900;

      letter-spacing:2px;

    }


    .playerInfo{

      display:flex;

      flex-direction:column;

      justify-content:center;

    }


    .playerInfo b{

      font-size:15px;

      letter-spacing:2px;

    }


    .playerInfo small{

      margin-top:3px;

      color:#9ca9a4;

      font-size:8px;

      letter-spacing:2px;

    }


    .modeInfo{

      margin-left:auto;

      padding:8px 13px;

      border:

        1px solid
        rgba(255,255,255,.16);

      border-radius:20px;

      background:
        rgba(0,0,0,.35);

      color:#ffd54a;

      font-size:9px;

      font-weight:900;

      letter-spacing:2px;

      backdrop-filter:
        blur(10px);

    }


    /* =====================================================
       TURN
       ===================================================== */

    #turnUI{

      position:fixed;

      top:78px;

      left:50%;

      transform:
        translateX(-50%);

      z-index:20;

      color:#ffd54a;

      font-size:12px;

      font-weight:1000;

      letter-spacing:3px;

      text-shadow:

        0 0 8px #ffd54a,

        0 0 20px
        rgba(255,213,74,.65);

      pointer-events:none;

      white-space:nowrap;

    }


    #colorUI{

      position:fixed;

      top:103px;

      left:50%;

      transform:
        translateX(-50%);

      z-index:20;

      display:flex;

      align-items:center;

      gap:6px;

      padding:6px 12px;

      border:

        1px solid
        rgba(255,255,255,.1);

      border-radius:16px;

      background:
        rgba(0,0,0,.28);

      backdrop-filter:
        blur(8px);

      pointer-events:none;

    }


    .colorLabel{

      color:#aebbb6;

      font-size:7px;

      letter-spacing:2px;

    }


    #currentColorText{

      font-size:8px;

      font-weight:1000;

      letter-spacing:1px;

    }


    /* =====================================================
       COUNTERS
       ===================================================== */

    #aiCounter,
    #cardCounter{

      position:fixed;

      z-index:20;

      display:flex;

      flex-direction:column;

      gap:3px;

      padding:8px 11px;

      border:

        1px solid
        rgba(255,255,255,.12);

      border-radius:12px;

      background:
        rgba(0,0,0,.4);

      backdrop-filter:
        blur(8px);

      pointer-events:none;

    }


    #aiCounter{

      top:145px;

      right:14px;

    }


    #cardCounter{

      bottom:126px;

      left:14px;

    }


    #aiCounter span,
    #cardCounter span{

      color:#9ba8a4;

      font-size:7px;

      letter-spacing:1.5px;

    }


    #aiCounter b,
    #playerCardCount{

      color:#fff;

      font-size:16px;

      font-weight:1000;

    }


    /* =====================================================
       DRAW BUTTON
       ===================================================== */

    #drawCard{

      position:fixed;

      z-index:30;

      bottom:22px;

      left:50%;

      transform:
        translateX(-50%);

      min-width:132px;

      height:48px;

      padding:0 19px;

      display:flex;

      align-items:center;

      justify-content:center;

      gap:7px;

      border:

        1px solid
        rgba(255,255,255,.22);

      border-radius:15px;

      color:#fff;

      background:

        linear-gradient(
          135deg,
          #18242e,
          #060a10
        );

      font-size:9px;

      font-weight:1000;

      letter-spacing:1.5px;

      box-shadow:

        0 9px 28px
        rgba(0,0,0,.45),

        inset 0 1px
        rgba(255,255,255,.12);

      transition:

        transform .15s ease,

        filter .15s ease,

        opacity .15s ease;

    }


    #drawCard:active{

      transform:
        translateX(-50%)
        scale(.94);

    }


    #drawCard:disabled{

      opacity:.35;

      filter:grayscale(.7);

    }


    .drawIcon{

      display:flex;

      align-items:center;

      justify-content:center;

      width:19px;

      height:19px;

      border-radius:50%;

      background:#ff1744;

      font-size:16px;

      line-height:19px;

    }


    /* =====================================================
       UNO BUTTON
       ===================================================== */

    #unoButton{

      position:fixed;

      z-index:31;

      right:18px;

      bottom:18px;

      width:72px;

      height:72px;

      border:

        3px solid
        rgba(255,255,255,.95);

      border-radius:50%;

      color:#fff;

      background:

        radial-gradient(
          circle at 32% 25%,
          #ff7387 0%,
          #f01843 48%,
          #9b0029 100%
        );

      font-size:18px;

      font-weight:1000;

      font-style:italic;

      box-shadow:

        0 0 18px
        rgba(255,23,68,.45),

        0 10px 28px
        rgba(0,0,0,.45);

      transition:

        transform .16s ease,

        opacity .16s ease,

        filter .16s ease;

    }


    #unoButton:active{

      transform:
        scale(.9);

    }


    #unoButton.ready{

      animation:
        unoPulse .7s
        ease-in-out
        infinite alternate;

    }


    @keyframes unoPulse{

      from{

        transform:scale(1);

        box-shadow:
          0 0 18px
          rgba(255,23,68,.5);

      }

      to{

        transform:scale(1.1);

        box-shadow:

          0 0 28px
          rgba(255,23,68,.9),

          0 0 55px
          rgba(255,23,68,.35);

      }

    }


    /* =====================================================
       MESSAGE
       ===================================================== */

    #gameMessage{

      position:fixed;

      left:50%;

      top:48%;

      transform:
        translate(-50%,-50%)
        scale(.65);

      z-index:40;

      opacity:0;

      color:#fff;

      font-size:21px;

      font-weight:1000;

      letter-spacing:3px;

      text-align:center;

      white-space:nowrap;

      pointer-events:none;

      text-shadow:

        0 3px 20px
        rgba(0,0,0,.9),

        0 0 25px
        rgba(255,255,255,.3);

      transition:

        opacity .18s ease,

        transform .18s ease;

    }


    #gameMessage.show{

      opacity:1;

      transform:
        translate(-50%,-50%)
        scale(1);

    }


    /* =====================================================
       WILD CHOOSER
       ===================================================== */

    #wildChooser{

      position:fixed;

      inset:0;

      z-index:80;

      display:none;

      align-items:center;

      justify-content:center;

      background:
        rgba(0,0,0,.72);

      backdrop-filter:
        blur(10px);

    }


    #wildChooser.show{

      display:flex;

    }


    .wildPanel{

      width:min(
        88vw,
        340px
      );

      padding:28px 22px;

      border:

        1px solid
        rgba(255,255,255,.18);

      border-radius:24px;

      background:

        linear-gradient(
          145deg,
          #111923,
          #04070b
        );

      box-shadow:

        0 25px 80px
        rgba(0,0,0,.7);

      text-align:center;

    }


    .wildTitle{

      color:#fff;

      font-size:20px;

      font-weight:1000;

      letter-spacing:3px;

    }


    .wildSubtitle{

      margin-top:7px;

      margin-bottom:20px;

      color:#87938f;

      font-size:9px;

      letter-spacing:1px;

    }


    .wildColors{

      display:grid;

      grid-template-columns:
        1fr 1fr;

      gap:12px;

    }


    .wildColors button{

      height:56px;

      border:

        2px solid
        rgba(255,255,255,.75);

      border-radius:15px;

      color:#fff;

      font-size:11px;

      font-weight:1000;

      letter-spacing:1px;

      box-shadow:
        0 8px 20px
        rgba(0,0,0,.3);

      transition:
        transform .12s ease;

    }


    .wildColors button:active{

      transform:scale(.94);

    }


    .wildRed{

      background:
        linear-gradient(
          135deg,
          #ff1744,
          #a90029
        );

    }


    .wildBlue{

      background:
        linear-gradient(
          135deg,
          #2685ff,
          #0743a8
        );

    }


    .wildGreen{

      background:
        linear-gradient(
          135deg,
          #18d875,
          #08733d
        );

    }


    .wildYellow{

      color:#111!important;

      background:
        linear-gradient(
          135deg,
          #ffe45b,
          #d29e00
        );

    }


    /* =====================================================
       END SCREEN
       ===================================================== */

    #endScreen{

      position:fixed;

      inset:0;

      z-index:100;

      display:none;

      align-items:center;

      justify-content:center;

      background:

        radial-gradient(
          circle at center,
          rgba(10,60,40,.72),
          rgba(0,0,0,.94)
        );

      backdrop-filter:
        blur(12px);

    }


    #endScreen.show{

      display:flex;

    }


    .endBox{

      width:min(
        88vw,
        370px
      );

      padding:34px 24px;

      border:

        1px solid
        rgba(255,213,74,.4);

      border-radius:25px;

      text-align:center;

      background:

        linear-gradient(
          145deg,
          rgba(20,31,28,.98),
          rgba(3,6,9,.98)
        );

      box-shadow:

        0 25px 80px
        rgba(0,0,0,.7);

    }


    #endTitle{

      color:#ffd54a;

      font-size:34px;

      font-weight:1000;

      letter-spacing:3px;

    }


    #endSub{

      margin-top:8px;

      color:#9ca8a3;

      font-size:9px;

      letter-spacing:4px;

    }


    #endStats{

      margin-top:18px;

      margin-bottom:20px;

      color:#fff;

      font-size:11px;

      letter-spacing:1px;

    }


    .endBox button{

      width:100%;

      margin-top:10px;

      padding:14px;

      border:

        1px solid
        rgba(255,255,255,.15);

      border-radius:13px;

      color:#fff;

      background:#111923;

      font-size:10px;

      font-weight:1000;

      letter-spacing:1px;

    }


    #restartGame{

      background:
        linear-gradient(
          135deg,
          #f01b45,
          #a7002c
        )!important;

    }


    /* =====================================================
       MOBILE
       ===================================================== */

    @media(max-width:600px){

      #topUI{

        top:9px;

        left:9px;

        right:9px;

      }


      .arenaLogo{

        width:56px;

        height:46px;

      }


      .logoBig{

        font-size:16px;

      }


      #turnUI{

        top:70px;

        font-size:10px;

      }


      #colorUI{

        top:94px;

      }


      #aiCounter{

        top:137px;

        right:9px;

      }


      #cardCounter{

        bottom:115px;

        left:9px;

      }


      #drawCard{

        bottom:19px;

        height:45px;

        min-width:124px;

      }


      #unoButton{

        right:12px;

        bottom:13px;

        width:64px;

        height:64px;

        font-size:16px;

      }


      #gameMessage{

        font-size:17px;

      }

    }

  `;

  document.head.appendChild(
    style
  );
}
/* =========================================================
   PART 3 — DECK + CARD SYSTEM
   ========================================================= */

/* =========================================================
   DRAW FROM DECK
   ========================================================= */

function drawFromDeck() {

  if (deck.length === 0) {
    refillDeck();
  }

  return deck.pop();
}


/* =========================================================
   REFILL DECK
   ========================================================= */

function refillDeck() {

  if (discardPile.length <= 1) {
    return;
  }

  const topCard =
    discardPile[discardPile.length - 1];

  const oldDiscard =
    discardPile.slice(
      0,
      discardPile.length - 1
    );

  discardPile = [topCard];

  deck = oldDiscard.map(card => ({
    color: card.color,
    value: card.value,
    type: card.type
  }));

  shuffle(deck);
}


/* =========================================================
   SHUFFLE
   ========================================================= */

function shuffle(array) {

  for (
    let i = array.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [
      array[i],
      array[j]
    ] = [
      array[j],
      array[i]
    ];
  }

  return array;
}


/* =========================================================
   CARD CAN BE PLAYED
   ========================================================= */

function canPlayCard(card) {

  if (!card) return false;

  const topCard =
    discardPile[
      discardPile.length - 1
    ];

  if (!topCard) return true;

  /* Wild cards can always be played */

  if (
    card.type === "wild" ||
    card.type === "wild4"
  ) {
    return true;
  }

  /* Match current selected color */

  if (
    card.color === currentColor
  ) {
    return true;
  }

  /* Match number/action */

  if (
    card.value === topCard.value
  ) {
    return true;
  }

  return false;
}


/* =========================================================
   PLAY PLAYER CARD
   ========================================================= */

function playPlayerCard(index) {

  if (
    currentTurn !== "PLAYER" ||
    !gameRunning
  ) {
    return;
  }

  if (
    index < 0 ||
    index >= playerHand.length
  ) {
    return;
  }

  const card =
    playerHand[index];

  if (!canPlayCard(card)) {

    showMessage(
      "CAN'T PLAY THIS CARD",
      900
    );

    shakeBoard();

    return;
  }

  selectedCardIndex = index;
  selectedCard = card;

  /* Remove from hand */

  playerHand.splice(
    index,
    1
  );

  /* Add to discard */

  discardPile.push(card);

  /* Wild needs color selection */

  if (
    card.type === "wild" ||
    card.type === "wild4"
  ) {

    renderHands(false);
    renderDiscard();
    updateUI();

    openWildChooser();

    return;
  }

  currentColor = card.color;

  animatePlayedCard(card);

  afterPlayerCardPlayed(card);
}


/* =========================================================
   AFTER PLAYER CARD
   ========================================================= */

function afterPlayerCardPlayed(card) {

  playerCalledUNO = false;

  /*
   * UNO rule:
   * When player has one card,
   * UNO must be pressed before turn changes.
   */

  if (playerHand.length === 1) {

    playerNeedsUNO = true;

    showMessage(
      "PRESS UNO!",
      1000
    );

    updateUI();

    return;
  }

  playerNeedsUNO = false;

  updateSpecialCardEffect(card);

  if (
    playerHand.length === 0
  ) {

    finishGame("YOU WIN");

    return;
  }

  currentTurn = "AI";

  updateUI();

  setTimeout(
    aiTurn,
    850
  );
}


/* =========================================================
   UNO BUTTON
   ========================================================= */

function callUNO() {

  if (
    currentTurn !== "PLAYER" ||
    !gameRunning
  ) {
    return;
  }

  /*
   * UNO is only valid when
   * exactly one card remains.
   */

  if (
    playerHand.length !== 1
  ) {

    showMessage(
      "UNO IS NOT READY",
      800
    );

    return;
  }

  playerCalledUNO = true;
  playerNeedsUNO = false;

  const button =
    document.getElementById(
      "unoButton"
    );

  if (button) {
    button.classList.remove(
      "ready"
    );
  }

  showMessage(
    "UNO!",
    1000
  );

  updateUI();
}


/* =========================================================
   DRAW PLAYER CARD
   ========================================================= */

function drawPlayerCard() {

  if (
    currentTurn !== "PLAYER" ||
    !gameRunning
  ) {
    return;
  }

  /*
   * If player forgot UNO,
   * apply +2 penalty before drawing.
   */

  if (
    playerNeedsUNO &&
    !playerCalledUNO
  ) {

    showMessage(
      "UNO MISSED! +2 CARDS",
      1300
    );

    drawPenaltyCards(
      playerHand,
      2
    );

    playerNeedsUNO = false;
    playerCalledUNO = false;

    renderHands(true);
    updateUI();

    setTimeout(
      () => {

        currentTurn = "AI";

        updateUI();

        setTimeout(
          aiTurn,
          700
        );

      },
      1000
    );

    return;
  }

  const card =
    drawFromDeck();

  if (!card) {
    showMessage(
      "NO CARDS",
      700
    );
    return;
  }

  playerHand.push(card);

  animateDrawCard(
    card,
    "PLAYER"
  );

  renderHands(true);

  updateUI();

  /*
   * Player gets one drawn card.
   * If playable, player may play it.
   * Otherwise turn goes to AI.
   */

  if (
    canPlayCard(card)
  ) {

    showMessage(
      "CARD DRAWN — PLAY OR PASS",
      1000
    );

    return;
  }

  currentTurn = "AI";

  updateUI();

  setTimeout(
    aiTurn,
    800
  );
}


/* =========================================================
   DRAW PENALTY
   ========================================================= */

function drawPenaltyCards(
  hand,
  amount
) {

  for (
    let i = 0;
    i < amount;
    i++
  ) {

    const card =
      drawFromDeck();

    if (card) {
      hand.push(card);
    }
  }

  renderHands(true);
  updateUI();
}


/* =========================================================
   SPECIAL CARD EFFECTS
   ========================================================= */

function updateSpecialCardEffect(card) {

  if (!card) return;

  if (
    card.type === "skip"
  ) {

    showMessage(
      "SKIP!",
      800
    );

    currentTurn = "PLAYER";

    updateUI();

    return;
  }

  if (
    card.type === "reverse"
  ) {

    showMessage(
      "REVERSE!",
      800
    );

    /*
     * In 2-player mode,
     * Reverse behaves like Skip.
     */

    currentTurn = "PLAYER";

    updateUI();

    return;
  }

  if (
    card.type === "draw2"
  ) {

    showMessage(
      "+2!",
      900
    );

    drawPenaltyCards(
      aiHand,
      2
    );

    currentTurn = "PLAYER";

    updateUI();

    return;
  }

  currentTurn = "AI";

  updateUI();

  setTimeout(
    aiTurn,
    700
  );
}


/* =========================================================
   WILD COLOR CHOOSER
   ========================================================= */

function openWildChooser() {

  const chooser =
    document.getElementById(
      "wildChooser"
    );

  if (!chooser) return;

  chooser.classList.add(
    "show"
  );

  const buttons =
    chooser.querySelectorAll(
      "[data-color]"
    );

  buttons.forEach(
    button => {

      button.onclick = () => {

        const color =
          button.dataset.color;

        chooseWildColor(
          color
        );

      };

    }
  );
}


/* =========================================================
   CHOOSE WILD COLOR
   ========================================================= */

function chooseWildColor(color) {

  if (
    !COLOR_NAMES.includes(color)
  ) {
    return;
  }

  const chooser =
    document.getElementById(
      "wildChooser"
    );

  if (chooser) {

    chooser.classList.remove(
      "show"
    );
  }

  currentColor = color;

  if (
    selectedCard &&
    selectedCard.type === "wild4"
  ) {

    showMessage(
      "WILD +4 — " + color,
      1100
    );

    drawPenaltyCards(
      aiHand,
      4
    );

    currentTurn = "PLAYER";

    updateUI();

  } else {

    showMessage(
      "COLOR: " + color,
      900
    );

    currentTurn = "AI";

    updateUI();

    setTimeout(
      aiTurn,
      800
    );
  }

  selectedCard = null;
  selectedCardIndex = -1;

  if (
    playerHand.length === 0
  ) {

    finishGame("YOU WIN");

    return;
  }

  renderHands(true);
  renderDiscard();
  updateUI();
}


/* =========================================================
   AI TURN
   ========================================================= */

function aiTurn() {

  if (
    !gameRunning ||
    currentTurn !== "AI"
  ) {
    return;
  }

  if (
    aiHand.length === 0
  ) {
    finishGame("YOU WIN");
    return;
  }

  showMessage(
    "AI TURN",
    650
  );

  setTimeout(
    () => {

      let playable = [];

      for (
        let i = 0;
        i < aiHand.length;
        i++
      ) {

        if (
          canPlayCard(
            aiHand[i]
          )
        ) {

          playable.push(i);

        }

      }

      let selectedIndex = -1;

      /*
       * PRO AI prefers action cards.
       */

      const actionIndexes =
        playable.filter(
          i =>
            aiHand[i].type !== "number"
        );

      if (
        difficulty === "PRO" &&
        actionIndexes.length
      ) {

        selectedIndex =
          actionIndexes[
            Math.floor(
              Math.random() *
              actionIndexes.length
            )
          ];

      } else if (
        playable.length
      ) {

        selectedIndex =
          playable[
            Math.floor(
              Math.random() *
              playable.length
            )
          ];
      }

      /*
       * No playable card:
       * AI draws one.
       */

      if (
        selectedIndex === -1
      ) {

        const drawn =
          drawFromDeck();

        if (drawn) {

          aiHand.push(drawn);

          animateDrawCard(
            drawn,
            "AI"
          );

          /*
           * If drawn card is playable,
           * AI can immediately play it.
           */

          if (
            canPlayCard(drawn)
          ) {

            selectedIndex =
              aiHand.length - 1;

          } else {

            currentTurn =
              "PLAYER";

            renderHands(true);
            updateUI();

            return;
          }
        }
      }

      if (
        selectedIndex >= 0
      ) {

        playAICard(
          selectedIndex
        );

      } else {

        currentTurn =
          "PLAYER";

        renderHands(true);
        updateUI();

      }

    },
    700
  );
}


/* =========================================================
   AI PLAY CARD
   ========================================================= */

function playAICard(index) {

  const card =
    aiHand[index];

  if (!card) return;

  aiHand.splice(
    index,
    1
  );

  discardPile.push(
    card
  );

  animatePlayedCard(
    card
  );

  /*
   * AI wild chooses the color
   * it currently has most of.
   */

  if (
    card.type === "wild" ||
    card.type === "wild4"
  ) {

    const color =
      chooseBestAIColor();

    currentColor =
      color;

    if (
      card.type === "wild4"
    ) {

      drawPenaltyCards(
        playerHand,
        4
      );

      showMessage(
        "AI PLAYED WILD +4",
        1200
      );

      currentTurn =
        "PLAYER";

    } else {

      showMessage(
        "AI CHANGED COLOR",
        1000
      );

      currentTurn =
        "PLAYER";
    }

  } else {

    currentColor =
      card.color;

    if (
      card.type === "draw2"
    ) {

      drawPenaltyCards(
        playerHand,
        2
      );

      showMessage(
        "AI +2",
        1000
      );

      currentTurn =
        "PLAYER";

    } else if (
      card.type === "skip"
    ) {

      showMessage(
        "AI SKIP",
        900
      );

      currentTurn =
        "AI";

      setTimeout(
        aiTurn,
        700
      );

    } else if (
      card.type === "reverse"
    ) {

      showMessage(
        "AI REVERSE",
        900
      );

      currentTurn =
        "AI";

      setTimeout(
        aiTurn,
        700
      );

    } else {

      currentTurn =
        "PLAYER";
    }
  }

  if (
    aiHand.length === 0
  ) {

    finishGame(
      "AI WINS"
    );

    return;
  }

  renderHands(true);
  renderDiscard();
  updateUI();

}


/* =========================================================
   AI COLOR SELECTION
   ========================================================= */

function chooseBestAIColor() {

  const counts = {
    RED:0,
    BLUE:0,
    GREEN:0,
    YELLOW:0
  };

  aiHand.forEach(
    card => {

      if (
        card.color &&
        counts[
          card.color
        ] !== undefined
      ) {

        counts[
          card.color
        ]++;

      }

    }
  );

  let best =
    "RED";

  let highest =
    -1;

  COLOR_NAMES.forEach(
    color => {

      if (
        counts[color] >
        highest
      ) {

        highest =
          counts[color];

        best =
          color;
      }

    }
  );

  return best;
}


/* =========================================================
   GAME OVER
   ========================================================= */

function finishGame(title) {

  gameRunning = false;

  clearTimeout(
    turnTimer
  );

  const endScreen =
    document.getElementById(
      "endScreen"
    );

  const endTitle =
    document.getElementById(
      "endTitle"
    );

  const endSub =
    document.getElementById(
      "endSub"
    );

  if (endTitle) {
    endTitle.textContent =
      title;
  }

  if (endSub) {
    endSub.textContent =
      "CARD ARENA";
  }

  if (endScreen) {

    endScreen.classList.add(
      "show"
    );
  }

  showMessage(
    title,
    1500
  );
}


/* =========================================================
   CARD CLICK HANDLER
   ========================================================= */

function handleCardClick(index) {

  if (
    currentTurn !== "PLAYER" ||
    !gameRunning
  ) {
    return;
  }

  playPlayerCard(
    index
  );
}


/* =========================================================
   BUTTON SETUP
   ========================================================= */

function setupButtons() {

  const drawButton =
    document.getElementById(
      "drawCard"
    );

  const unoButton =
    document.getElementById(
      "unoButton"
    );

  if (drawButton) {

    drawButton.onclick =
      drawPlayerCard;

  }

  if (unoButton) {

    unoButton.onclick =
      callUNO;

  }

  const restart =
    document.getElementById(
      "restartGame"
    );

  if (restart) {

    restart.onclick =
      () => {

        location.reload();

      };

  }

  const back =
    document.getElementById(
      "backMenu"
    );

  if (back) {

    back.onclick =
      () => {

        location.reload();

      };

  }
}


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
  text,
  duration = 900
) {

  const el =
    document.getElementById(
      "gameMessage"
    );

  if (!el) return;

  clearTimeout(
    messageTimer
  );

  el.textContent =
    text;

  el.classList.add(
    "show"
  );

  messageTimer =
    setTimeout(
      () => {

        el.classList.remove(
          "show"
        );

      },
      duration
    );
}


/* =========================================================
   BOARD SHAKE
   ========================================================= */

function shakeBoard() {

  if (!renderer) return;

  const canvas =
    renderer.domElement;

  canvas.animate(
    [
      {
        transform:
          "translate(0,0)"
      },
      {
        transform:
          "translate(-6px,2px)"
      },
      {
        transform:
          "translate(6px,-2px)"
      },
      {
        transform:
          "translate(-4px,1px)"
      },
      {
        transform:
          "translate(4px,-1px)"
      },
      {
        transform:
          "translate(0,0)"
      }
    ],
    {
      duration:260,
      easing:"ease-out"
    }
  );
}


/* =========================================================
   UI UPDATE
   ========================================================= */

function updateUI() {

  const playerCounter =
    document.querySelector(
      "#cardCounter b"
    );

  const aiCounter =
    document.querySelector(
      "#aiCounter b"
    );

  const turnUI =
    document.getElementById(
      "turnUI"
    );

  const colorSpan =
    document.querySelector(
      "#colorUI span"
    );

  const unoButton =
    document.getElementById(
      "unoButton"
    );

  const drawButton =
    document.getElementById(
      "drawCard"
    );

  if (playerCounter) {

    playerCounter.textContent =
      playerHand.length;

  }

  if (aiCounter) {

    aiCounter.textContent =
      aiHand.length;

  }

  if (turnUI) {

    turnUI.textContent =
      currentTurn === "PLAYER"
        ? "YOUR TURN"
        : "AI TURN";

  }

  if (colorSpan) {

    colorSpan.textContent =
      currentColor || "---";

    if (
      currentColor &&
      COLOR_HEX[currentColor]
    ) {

      colorSpan.style.color =
        COLOR_HEX[
          currentColor
        ];

    }

  }

  /*
   * UNO button only becomes active
   * when exactly one player card remains.
   */

  if (unoButton) {

    if (
      currentTurn === "PLAYER" &&
      playerHand.length === 1 &&
      !playerCalledUNO
    ) {

      unoButton.disabled = false;

      unoButton.classList.add(
        "ready"
      );

    } else {

      unoButton.classList.remove(
        "ready"
      );

      unoButton.disabled =
        true;

    }

  }

  if (drawButton) {

    drawButton.disabled =
      currentTurn !== "PLAYER";

  }
}
/* =========================================================
   PART 4 — 3D CARD RENDERING + CARD STYLES
   ========================================================= */

function clearGroup(group) {

  if (!group) return;

  while (group.children.length) {

    const child =
      group.children.pop();

    disposeObject(child);
  }
}


/* =========================================================
   DISPOSE THREE OBJECT
   ========================================================= */

function disposeObject(object) {

  if (!object) return;

  object.traverse(
    child => {

      if (child.geometry) {
        child.geometry.dispose();
      }

      if (child.material) {

        if (Array.isArray(child.material)) {

          child.material.forEach(
            material => {

              if (material.map) {
                material.map.dispose();
              }

              material.dispose();

            }
          );

        } else {

          if (child.material.map) {
            child.material.map.dispose();
          }

          child.material.dispose();

        }

      }

    }
  );
}


/* =========================================================
   CARD STYLE COLORS
   ========================================================= */

function getCardColor(card) {

  if (!card || !card.color) {

    return 0x11151f;

  }

  return COLORS[
    card.color
  ] || 0x11151f;
}


/* =========================================================
   CARD STYLE
   ========================================================= */

function getCardStyle() {

  return String(
    window.cardStyle ||
    "NORMAL"
  ).toUpperCase();

}


/* =========================================================
   CREATE CARD MATERIAL
   ========================================================= */

function createCardMaterial(
  card,
  back = false
) {

  const style =
    getCardStyle();

  if (back) {

    if (style === "GALAXY") {

      return new THREE.MeshStandardMaterial({
        color:0x10104d,
        roughness:.22,
        metalness:.55,
        emissive:0x1717a0,
        emissiveIntensity:.25
      });

    }

    return new THREE.MeshStandardMaterial({
      color:0x8e0929,
      roughness:.25,
      metalness:.25,
      emissive:0x30000b,
      emissiveIntensity:.15
    });

  }

  const color =
    getCardColor(card);

  if (style === "GALAXY") {

    return new THREE.MeshStandardMaterial({
      color:color,
      roughness:.18,
      metalness:.5,
      emissive:color,
      emissiveIntensity:.16
    });

  }

  if (style === "NEON") {

    return new THREE.MeshStandardMaterial({
      color:color,
      roughness:.12,
      metalness:.25,
      emissive:color,
      emissiveIntensity:.35
    });

  }

  if (style === "GOLD") {

    return new THREE.MeshStandardMaterial({
      color:color,
      roughness:.18,
      metalness:.7,
      emissive:color,
      emissiveIntensity:.1
    });

  }

  return new THREE.MeshStandardMaterial({
    color:color,
    roughness:.25,
    metalness:.12
  });

}


/* =========================================================
   CREATE CARD GROUP
   ========================================================= */

function createCard3D(
  card,
  index = -1,
  faceUp = true
) {

  const group =
    new THREE.Group();

  const width =
    1.08;

  const height =
    .12;

  const depth =
    1.62;

  /*
   * Card body
   */

  const body =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        width,
        height,
        depth,
        3,
        2,
        3
      ),
      createCardMaterial(
        card,
        !faceUp
      )
    );

  body.castShadow = true;
  body.receiveShadow = true;

  group.add(body);


  /*
   * White border
   */

  if (faceUp) {

    const border =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          width * .88,
          height + .018,
          depth * .91
        ),
        new THREE.MeshBasicMaterial({
          color:0xffffff
        })
      );

    border.position.y =
      .068;

    group.add(border);


    /*
     * Colored inner face
     */

    const inner =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          width * .78,
          .025,
          depth * .81
        ),
        createCardMaterial(
          card,
          false
        )
      );

    inner.position.y =
      .084;

    group.add(inner);


    /*
     * Card symbol
     */

    const symbol =
      createCardSymbol(
        card
      );

    symbol.position.y =
      .105;

    group.add(symbol);

  } else {

    /*
     * Back design
     */

    const backPanel =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          width * .78,
          .025,
          depth * .81
        ),
        new THREE.MeshStandardMaterial({
          color:
            getCardStyle() === "GALAXY"
              ? 0x15156e
              : 0x7d0928,
          roughness:.2,
          metalness:.35,
          emissive:
            getCardStyle() === "GALAXY"
              ? 0x12128a
              : 0x25000a,
          emissiveIntensity:.25
        })
      );

    backPanel.position.y =
      .085;

    group.add(backPanel);


    /*
     * Back center logo
     */

    const logo =
      createTextSprite(
        "ARSH",
        "#ffffff",
        34
      );

    logo.scale.set(
      .75,
      .75,
      .75
    );

    logo.position.set(
      0,
      .11,
      0
    );

    logo.rotation.x =
      -Math.PI / 2;

    group.add(logo);

  }


  /*
   * Store card information
   */

  group.userData.card =
    card;

  group.userData.index =
    index;

  group.userData.isCard =
    true;

  group.userData.faceUp =
    faceUp;


  /*
   * Glow
   */

  if (
    faceUp &&
    (
      getCardStyle() === "GALAXY" ||
      getCardStyle() === "NEON"
    )
  ) {

    const glow =
      new THREE.PointLight(
        getCardColor(card),
        .25,
        2.5
      );

    glow.position.y =
      .5;

    group.add(glow);

  }

  return group;
}


/* =========================================================
   CARD SYMBOL
   ========================================================= */

function createCardSymbol(card) {

  let text =
    "?";

  if (card) {

    if (
      card.type === "wild4"
    ) {

      text = "+4";

    } else {

      text =
        String(
          card.value
        );

    }

  }

  const color =
    card &&
    card.color
      ? "#ffffff"
      : "#ffffff";

  const sprite =
    createTextSprite(
      text,
      color,
      text.length > 3
        ? 48
        : 64
    );

  sprite.scale.set(
    .9,
    .9,
    .9
  );

  sprite.rotation.x =
    -Math.PI / 2;

  return sprite;
}


/* =========================================================
   TEXT SPRITE
   ========================================================= */

function createTextSprite(
  text,
  color,
  fontSize
) {

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    512;

  canvas.height =
    512;

  const ctx =
    canvas.getContext(
      "2d"
    );

  ctx.clearRect(
    0,
    0,
    512,
    512
  );

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.font =
    `900 ${fontSize}px Arial`;

  ctx.shadowColor =
    "rgba(0,0,0,.65)";

  ctx.shadowBlur =
    20;

  ctx.lineWidth =
    12;

  ctx.strokeStyle =
    "rgba(0,0,0,.5)";

  ctx.strokeText(
    text,
    256,
    256
  );

  ctx.shadowBlur =
    0;

  ctx.fillStyle =
    color;

  ctx.fillText(
    text,
    256,
    256
  );

  const texture =
    new THREE.CanvasTexture(
      canvas
    );

  texture.colorSpace =
    THREE.SRGBColorSpace;

  const material =
    new THREE.SpriteMaterial({
      map:texture,
      transparent:true,
      depthWrite:false
    });

  return new THREE.Sprite(
    material
  );
}


/* =========================================================
   PLAYER HAND RENDER
   ========================================================= */

function renderHands(animate = false) {

  if (!playerGroup || !aiGroup) {
    return;
  }

  clearGroup(
    playerGroup
  );

  clearGroup(
    aiGroup
  );


  /*
   * PLAYER CARDS
   */

  const count =
    playerHand.length;

  const spacing =
    count > 8
      ? 1.0
      : 1.15;

  const totalWidth =
    Math.max(
      0,
      (count - 1) * spacing
    );

  playerHand.forEach(
    (card, index) => {

      const cardObject =
        createCard3D(
          card,
          index,
          true
        );

      const x =
        -totalWidth / 2 +
        index * spacing;

      const z =
        4.65 -
        Math.abs(
          index -
          (count - 1) / 2
        ) * .025;

      const rotation =
        (
          index -
          (count - 1) / 2
        ) * .045;

      cardObject.position.set(
        x,
        .25,
        z
      );

      cardObject.rotation.y =
        rotation;

      /*
       * Slight fan
       */

      cardObject.rotation.x =
        -.04;

      playerGroup.add(
        cardObject
      );

      if (animate) {

        cardObject.scale.set(
          .01,
          .01,
          .01
        );

        const delay =
          index * 45;

        setTimeout(
          () => {

            animateScaleIn(
              cardObject,
              280
            );

          },
          delay
        );

      }

    }
  );


  /*
   * AI CARDS
   */

  const aiCount =
    aiHand.length;

  const aiSpacing =
    aiCount > 8
      ? .95
      : 1.1;

  const aiWidth =
    Math.max(
      0,
      (aiCount - 1) *
      aiSpacing
    );

  aiHand.forEach(
    (card, index) => {

      const cardObject =
        createCard3D(
          card,
          index,
          false
        );

      const x =
        -aiWidth / 2 +
        index * aiSpacing;

      cardObject.position.set(
        x,
        .24,
        -4.35
      );

      cardObject.rotation.x =
        Math.PI;

      cardObject.rotation.y =
        (
          index -
          (aiCount - 1) / 2
        ) * .035;

      aiGroup.add(
        cardObject
      );

    }
  );


  setupCardPicking();
}


/* =========================================================
   SCALE ANIMATION
   ========================================================= */

function animateScaleIn(
  object,
  duration = 300
) {

  if (!object) return;

  const start =
    performance.now();

  function tick(now) {

    const progress =
      Math.min(
        1,
        (now - start) /
        duration
      );

    const eased =
      1 -
      Math.pow(
        1 - progress,
        3
      );

    object.scale.setScalar(
      eased
    );

    if (progress < 1) {

      requestAnimationFrame(
        tick
      );

    } else {

      object.scale.setScalar(
        1
      );

    }

  }

  requestAnimationFrame(
    tick
  );
}


/* =========================================================
   CARD PICKING
   ========================================================= */

function setupCardPicking() {

  if (!renderer) return;

  renderer.domElement.style.cursor =
    currentTurn === "PLAYER"
      ? "pointer"
      : "default";

}


/* =========================================================
   POINTER SETUP
   ========================================================= */

function setupPointer() {

  if (!renderer) return;

  const canvas =
    renderer.domElement;

  canvas.addEventListener(
    "pointerdown",
    onPointerDown,
    {
      passive:false
    }
  );

  canvas.addEventListener(
    "pointerup",
    onPointerUp,
    {
      passive:false
    }
  );

  canvas.addEventListener(
    "pointercancel",
    onPointerUp,
    {
      passive:false
    }
  );

}


/* =========================================================
   POINTER DOWN
   ========================================================= */

function onPointerDown(event) {

  pointerDown = true;

  updatePointer(
    event
  );

}


/* =========================================================
   POINTER UP
   ========================================================= */

function onPointerUp(event) {

  if (!pointerDown) {
    return;
  }

  pointerDown = false;

  updatePointer(
    event
  );

  if (!raycaster || !camera) {
    return;
  }

  raycaster.setFromCamera(
    pointer,
    camera
  );

  const objects =
    playerGroup
      ? playerGroup.children
      : [];

  const hits =
    raycaster.intersectObjects(
      objects,
      true
    );

  if (!hits.length) {
    return;
  }

  let selected =
    hits[0].object;

  while (
    selected &&
    !selected.userData.isCard
  ) {

    selected =
      selected.parent;

  }

  if (
    selected &&
    selected.userData.isCard
  ) {

    const index =
      selected.userData.index;

    handleCardClick(
      index
    );

  }

}


/* =========================================================
   UPDATE POINTER
   ========================================================= */

function updatePointer(event) {

  const rect =
    renderer
      .domElement
      .getBoundingClientRect();

  pointer.x =
    (
      (event.clientX - rect.left) /
      rect.width
    ) * 2 - 1;

  pointer.y =
    -(
      (event.clientY - rect.top) /
      rect.height
    ) * 2 + 1;

}


/* =========================================================
   DISCARD PILE
   ========================================================= */

function renderDiscard() {

  if (!discardGroup) {

    discardGroup =
      new THREE.Group();

    scene.add(
      discardGroup
    );

  }

  clearGroup(
    discardGroup
  );

  const visibleCards =
    discardPile.slice(
      -3
    );

  visibleCards.forEach(
    (card, index) => {

      const object =
        createCard3D(
          card,
          -1,
          true
        );

      object.position.set(
        (index - 1) * .10,
        .16 +
        index * .015,
        .25
      );

      object.rotation.y =
        (index - 1) * .08;

      object.rotation.z =
        (index - 1) * .04;

      discardGroup.add(
        object
      );

    }
  );

  /*
   * Make the newest card slightly
   * larger and more visible.
   */

  if (
    discardGroup.children.length
  ) {

    const last =
      discardGroup.children[
        discardGroup.children.length - 1
      ];

    last.scale.setScalar(
      1.08
    );

  }

}


/* =========================================================
   DECK PILE
   ========================================================= */

function createPiles() {

  deckGroup =
    new THREE.Group();

  discardGroup =
    new THREE.Group();

  scene.add(
    deckGroup
  );

  scene.add(
    discardGroup
  );

  /*
   * Deck shadow
   */

  const deckBase =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        1.2,
        .16,
        1.72
      ),
      new THREE.MeshStandardMaterial({
        color:0x05070b,
        roughness:.5
      })
    );

  deckBase.position.set(
    -2.05,
    .14,
    .15
  );

  deckBase.rotation.y =
    -.12;

  deckGroup.add(
    deckBase
  );

  /*
   * Visible deck cards
   */

  for (
    let i = 0;
    i < 4;
    i++
  ) {

    const fakeCard =
      {
        color:null,
        value:"WILD",
        type:"wild"
      };

    const card =
      createCard3D(
        fakeCard,
        -1,
        false
      );

    card.position.set(
      -2.05 +
      i * .018,
      .22 +
      i * .025,
      .15 +
      i * .012
    );

    card.rotation.y =
      -.12;

    deckGroup.add(
      card
    );

  }

  /*
   * Discard starts at center.
   */

  renderDiscard();

}


/* =========================================================
   DRAW CARD ANIMATION
   ========================================================= */

function animateDrawCard(
  card,
  owner
) {

  if (!scene || !card) {
    return;
  }

  const fromPlayer =
    owner === "PLAYER";

  const startX =
    fromPlayer
      ? -2.05
      : -2.05;

  const startZ =
    .15;

  const endZ =
    fromPlayer
      ? 4.45
      : -4.15;

  const object =
    createCard3D(
      card,
      -1,
      fromPlayer
    );

  object.position.set(
    startX,
    .6,
    startZ
  );

  scene.add(
    object
  );

  const start =
    performance.now();

  const duration =
    550;

  function move(now) {

    const p =
      Math.min(
        1,
        (now - start) /
        duration
      );

    const eased =
      1 -
      Math.pow(
        1 - p,
        3
      );

    object.position.z =
      startZ +
      (endZ - startZ) *
      eased;

    object.position.y =
      .6 +
      Math.sin(
        p * Math.PI
      ) * .6;

    object.rotation.y +=
      .025;

    object.scale.setScalar(
      .75 +
      eased * .25
    );

    if (p < 1) {

      requestAnimationFrame(
        move
      );

    } else {

      scene.remove(
        object
      );

      disposeObject(
        object
      );

      renderHands(false);
      renderDiscard();

    }

  }

  requestAnimationFrame(
    move
  );

}


/* =========================================================
   PLAY CARD ANIMATION
   ========================================================= */

function animatePlayedCard(
  card
) {

  if (!scene || !card) {
    return;
  }

  const object =
    createCard3D(
      card,
      -1,
      true
    );

  object.position.set(
    0,
    .7,
    currentTurn === "PLAYER"
      ? 4.4
      : -4.2
  );

  object.rotation.z =
    (Math.random() - .5) *
    .25;

  object.scale.setScalar(
    .85
  );

  scene.add(
    object
  );

  const start =
    performance.now();

  const duration =
    500;

  function animate(now) {

    const p =
      Math.min(
        1,
        (now - start) /
        duration
      );

    const eased =
      1 -
      Math.pow(
        1 - p,
        3
      );

    object.position.z =
      (
        currentTurn === "PLAYER"
          ? 4.4
          : -4.2
      ) *
      (1 - eased);

    object.position.y =
      .7 +
      Math.sin(
        p * Math.PI
      ) * .7;

    object.rotation.z *=
      .96;

    object.scale.setScalar(
      .85 +
      eased * .23
    );

    if (p < 1) {

      requestAnimationFrame(
        animate
      );

    } else {

      scene.remove(
        object
      );

      disposeObject(
        object
      );

      renderDiscard();

      /*
       * Small board impact
       */

      shakeBoard();

    }

  }

  requestAnimationFrame(
    animate
  );

       }
/* =========================================================
   GAME LOOP + DECK FIX
   ========================================================= */

function drawFromDeck() {
  if (deck.length === 0) {
    refillDeck();
  }

  if (deck.length === 0) {
    return null;
  }

  return deck.pop();
}


function refillDeck() {
  if (discardPile.length <= 1) {
    return;
  }

  const topCard = discardPile[discardPile.length - 1];

  deck = discardPile.slice(0, -1);
  discardPile = [topCard];

  shuffle(deck);
}


function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }

  return array;
}


/* =========================================================
   THREE.JS ANIMATION LOOP
   ========================================================= */

function animate3D() {
  if (!renderer || !scene || !camera) {
    return;
  }

  requestAnimationFrame(animate3D);

  const time = performance.now() * 0.001;

  if (boardGroup) {
    boardGroup.rotation.y = Math.sin(time * 0.12) * 0.008;
  }

  if (deckGroup) {
    deckGroup.rotation.y += 0.0008;
  }

  if (discardGroup) {
    discardGroup.rotation.y += 0.0005;
  }

  renderer.render(scene, camera);
}


/* =========================================================
   RESIZE
   ========================================================= */

function resizeArena() {
  if (!renderer || !camera) {
    return;
  }

  const gameArea = document.getElementById("game3d");

  if (!gameArea) {
    return;
  }

  const width = gameArea.clientWidth || window.innerWidth;
  const height = gameArea.clientHeight || window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
}


/* =========================================================
   EXTRA CARD MOVEMENT
   ========================================================= */

function moveCardToHand(cardObject, targetGroup, targetPosition, duration = 450) {
  if (!cardObject || !targetGroup) {
    return;
  }

  const startPosition = cardObject.position.clone();

  const startTime = performance.now();

  function moveStep(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const eased = 1 - Math.pow(1 - progress, 3);

    cardObject.position.x =
      startPosition.x +
      (targetPosition.x - startPosition.x) * eased;

    cardObject.position.y =
      startPosition.y +
      (targetPosition.y - startPosition.y) * eased;

    cardObject.position.z =
      startPosition.z +
      (targetPosition.z - startPosition.z) * eased;

    if (progress < 1) {
      requestAnimationFrame(moveStep);
    }
  }

  requestAnimationFrame(moveStep);
}


/* =========================================================
   SAFE CARD DRAW
   ========================================================= */

function playerDrawCard() {
  if (!gameRunning) {
    return;
  }

  if (currentTurn !== "PLAYER") {
    showMessage("WAIT FOR YOUR TURN");
    return;
  }

  const newCard = drawFromDeck();

  if (!newCard) {
    showMessage("NO CARDS LEFT");
    return;
  }

  playerHand.push(newCard);

  playerCalledUNO = false;

  renderHands(true);
  updateUI();

  showMessage("CARD DRAWN");

  setTimeout(() => {
    if (!gameRunning) {
      return;
    }

    if (!canPlayCard(newCard)) {
      currentTurn = "AI";
      updateUI();

      setTimeout(() => {
        aiTurn();
      }, 700);
    } else {
      showMessage("YOUR TURN");
      updateUI();
    }
  }, 400);
}


/* =========================================================
   CARD PLAY CHECK
   ========================================================= */

function canPlayCard(card) {
  if (!card || !currentColor) {
    return false;
  }

  if (
    card.type === "WILD" ||
    card.type === "WILD4"
  ) {
    return true;
  }

  if (card.color === currentColor) {
    return true;
  }

  const topCard =
    discardPile[discardPile.length - 1];

  if (!topCard) {
    return true;
  }

  if (
    card.type === topCard.type &&
    card.value === topCard.value
  ) {
    return true;
  }

  return false;
}


/* =========================================================
   PLAYER CARD PLAY
   ========================================================= */

function playPlayerCard(index) {
  if (!gameRunning) {
    return;
  }

  if (currentTurn !== "PLAYER") {
    showMessage("WAIT FOR YOUR TURN");
    return;
  }

  if (
    index < 0 ||
    index >= playerHand.length
  ) {
    return;
  }

  const card = playerHand[index];

  if (!canPlayCard(card)) {
    showMessage("YOU CAN'T PLAY THAT CARD");
    shakeBoard();
    return;
  }

  selectedCard = card;
  selectedCardIndex = index;

  if (
    card.type === "WILD" ||
    card.type === "WILD4"
  ) {
    openWildChooser(index);
    return;
  }

  executePlayerCard(index, card);
}


/* =========================================================
   EXECUTE PLAYER CARD
   ========================================================= */

function executePlayerCard(index, card) {
  playerHand.splice(index, 1);

  discardPile.push(card);

  currentColor = card.color || currentColor;

  playerNeedsUNO = playerHand.length === 1;
  playerCalledUNO = false;

  renderHands(true);
  renderDiscard();
  updateUI();

  animatePlayedCard(card, "PLAYER");

  updateSpecialCardEffect(card, "PLAYER");

  if (playerHand.length === 0) {
    finishGame("YOU WIN!");
    return;
  }

  currentTurn = "AI";

  updateUI();

  showMessage(
    playerHand.length === 1
      ? "ONE CARD LEFT!"
      : "ARSH IS THINKING..."
  );

  setTimeout(() => {
    if (gameRunning) {
      aiTurn();
    }
  }, 900);
}


/* =========================================================
   WILD CARD PLAYER
   ========================================================= */

function playWildPlayerCard(index, color) {
  if (
    index < 0 ||
    index >= playerHand.length
  ) {
    return;
  }

  const card = playerHand[index];

  playerHand.splice(index, 1);

  discardPile.push(card);

  currentColor = color;

  playerNeedsUNO = playerHand.length === 1;
  playerCalledUNO = false;

  closeWildChooser();

  renderHands(true);
  renderDiscard();
  updateUI();

  animatePlayedCard(card, "PLAYER");

  updateSpecialCardEffect(card, "PLAYER");

  if (playerHand.length === 0) {
    finishGame("YOU WIN!");
    return;
  }

  currentTurn = "AI";

  updateUI();

  showMessage("COLOR: " + color);

  setTimeout(() => {
    if (gameRunning) {
      aiTurn();
    }
  }, 900);
}


/* =========================================================
   WILD CHOOSER CLOSE
   ========================================================= */

function closeWildChooser() {
  const chooser =
    document.getElementById("wildChooser");

  if (!chooser) {
    return;
  }

  chooser.style.display = "none";
}


/* =========================================================
   GAME MESSAGE
   ========================================================= */

function showGameMessage(textValue) {
  const message =
    document.getElementById("gameMessage");

  if (!message) {
    return;
  }

  message.textContent = textValue;

  message.classList.remove("messagePop");

  void message.offsetWidth;

  message.classList.add("messagePop");

  clearTimeout(messageTimer);

  messageTimer = setTimeout(() => {
    message.classList.remove("messagePop");
  }, 1600);
}


/* =========================================================
   KEEP OLD FUNCTION COMPATIBILITY
   ========================================================= */

if (typeof showMessage !== "function") {
  function showMessage(textValue) {
    showGameMessage(textValue);
  }
}
/* =========================================================
   AI TURN + AI CARD LOGIC
   ========================================================= */

function aiTurn() {
  if (!gameRunning) {
    return;
  }

  if (currentTurn !== "AI") {
    return;
  }

  updateUI();
  showMessage("ARSH'S TURN");

  clearTimeout(turnTimer);

  turnTimer = setTimeout(() => {

    if (!gameRunning || currentTurn !== "AI") {
      return;
    }

    const playableIndexes = [];

    for (let i = 0; i < aiHand.length; i++) {
      if (canAIPlayCard(aiHand[i])) {
        playableIndexes.push(i);
      }
    }

    if (playableIndexes.length === 0) {

      const drawnCard = drawFromDeck();

      if (drawnCard) {
        aiHand.push(drawnCard);

        renderHands(true);
        updateUI();

        showMessage("ARSH DREW A CARD");

        setTimeout(() => {

          if (!gameRunning) {
            return;
          }

          if (canAIPlayCard(drawnCard)) {

            const newIndex =
              aiHand.length - 1;

            playAICard(newIndex);

          } else {

            currentTurn = "PLAYER";

            updateUI();
            showMessage("YOUR TURN");

          }

        }, 700);

      } else {

        currentTurn = "PLAYER";

        updateUI();
        showMessage("YOUR TURN");
      }

      return;
    }

    const selectedIndex =
      chooseAICard(playableIndexes);

    playAICard(selectedIndex);

  }, 900);
}


/* =========================================================
   AI PLAY CHECK
   ========================================================= */

function canAIPlayCard(card) {

  if (!card || !currentColor) {
    return false;
  }

  if (
    card.type === "WILD" ||
    card.type === "WILD4"
  ) {
    return true;
  }

  if (card.color === currentColor) {
    return true;
  }

  const topCard =
    discardPile[discardPile.length - 1];

  if (!topCard) {
    return true;
  }

  if (
    card.type === topCard.type &&
    card.value === topCard.value
  ) {
    return true;
  }

  return false;
}


/* =========================================================
   AI CARD SELECTION
   ========================================================= */

function chooseAICard(indexes) {

  if (!indexes || indexes.length === 0) {
    return -1;
  }

  if (
    String(difficulty).toUpperCase() === "EASY"
  ) {

    return indexes[
      Math.floor(Math.random() * indexes.length)
    ];
  }


  if (
    String(difficulty).toUpperCase() === "MEDIUM"
  ) {

    for (const index of indexes) {

      const card = aiHand[index];

      if (
        card.type === "WILD4" ||
        card.type === "PLUS2"
      ) {
        return index;
      }
    }

    return indexes[
      Math.floor(Math.random() * indexes.length)
    ];
  }


  /* PRO AI */

  let bestIndex = indexes[0];
  let bestValue = -1;

  for (const index of indexes) {

    const card = aiHand[index];

    let value = 1;

    if (card.type === "WILD") {
      value = 5;
    }

    if (card.type === "WILD4") {
      value = 10;
    }

    if (card.type === "PLUS2") {
      value = 8;
    }

    if (
      card.type === "SKIP" ||
      card.type === "REVERSE"
    ) {
      value = 6;
    }

    if (
      card.value !== null &&
      Number(card.value) >= 7
    ) {
      value += 2;
    }

    if (value > bestValue) {
      bestValue = value;
      bestIndex = index;
    }
  }

  return bestIndex;
}


/* =========================================================
   PLAY AI CARD
   ========================================================= */

function playAICard(index) {

  if (
    index < 0 ||
    index >= aiHand.length
  ) {
    currentTurn = "PLAYER";
    updateUI();
    return;
  }

  const card = aiHand[index];

  aiHand.splice(index, 1);

  discardPile.push(card);

  if (
    card.type === "WILD" ||
    card.type === "WILD4"
  ) {

    currentColor =
      chooseBestAIColor();

  } else {

    currentColor = card.color;
  }

  renderHands(true);
  renderDiscard();
  updateUI();

  animatePlayedCard(card, "AI");

  showMessage(
    "ARSH PLAYED " +
    getCardDisplayName(card)
  );

  updateSpecialCardEffect(card, "AI");


  /* AI WINS */

  if (aiHand.length === 0) {

    finishGame("ARSH WINS!");

    return;
  }


  /* AI HAS ONE CARD */

  if (aiHand.length === 1) {

    showMessage("ARSH: UNO!");

    setTimeout(() => {

      if (!gameRunning) {
        return;
      }

      currentTurn = "PLAYER";

      updateUI();
      showMessage("YOUR TURN");

    }, 900);

    return;
  }


  /* NORMAL NEXT TURN */

  setTimeout(() => {

    if (!gameRunning) {
      return;
    }

    currentTurn = "PLAYER";

    updateUI();
    showMessage("YOUR TURN");

  }, 900);
}


/* =========================================================
   AI COLOR CHOICE
   ========================================================= */

function chooseBestAIColor() {

  const count = {
    RED: 0,
    BLUE: 0,
    GREEN: 0,
    YELLOW: 0
  };

  for (const card of aiHand) {

    if (card.color && count[card.color] !== undefined) {
      count[card.color]++;
    }
  }

  let bestColor = "RED";
  let highest = -1;

  for (const colorName of COLOR_NAMES) {

    if (count[colorName] > highest) {

      highest = count[colorName];
      bestColor = colorName;

    }
  }

  return bestColor;
}


/* =========================================================
   CARD DISPLAY NAME
   ========================================================= */

function getCardDisplayName(card) {

  if (!card) {
    return "CARD";
  }

  if (
    card.type === "WILD"
  ) {
    return "WILD";
  }

  if (
    card.type === "WILD4"
  ) {
    return "WILD +4";
  }

  if (
    card.type === "PLUS2"
  ) {
    return "+2";
  }

  if (
    card.type === "SKIP"
  ) {
    return "SKIP";
  }

  if (
    card.type === "REVERSE"
  ) {
    return "REVERSE";
  }

  return String(card.value);
}


/* =========================================================
   AI DRAW PENALTY
   ========================================================= */

function aiDrawCards(amount) {

  let drawn = 0;

  for (
    let i = 0;
    i < amount;
    i++
  ) {

    const card = drawFromDeck();

    if (!card) {
      break;
    }

    aiHand.push(card);
    drawn++;
  }

  renderHands(true);
  updateUI();

  return drawn;
}


/* =========================================================
   PLAYER DRAW PENALTY
   ========================================================= */

function playerDrawCards(amount) {

  let drawn = 0;

  for (
    let i = 0;
    i < amount;
    i++
  ) {

    const card = drawFromDeck();

    if (!card) {
      break;
    }

    playerHand.push(card);
    drawn++;
  }

  renderHands(true);
  updateUI();

  return drawn;
}


/* =========================================================
   SPECIAL CARD EFFECT
   ========================================================= */

function updateSpecialCardEffect(card, whoPlayed) {

  if (!card) {
    return;
  }

  if (card.type === "PLUS2") {

    if (whoPlayed === "PLAYER") {

      aiDrawCards(2);

      showMessage("ARSH DRAWS +2");

    } else {

      playerDrawCards(2);

      showMessage("YOU DRAW +2");
    }

    return;
  }


  if (card.type === "WILD4") {

    if (whoPlayed === "PLAYER") {

      aiDrawCards(4);

      showMessage(
        "ARSH DRAWS 4 CARDS"
      );

    } else {

      playerDrawCards(4);

      showMessage(
        "YOU DRAW 4 CARDS"
      );
    }

    return;
  }


  if (card.type === "SKIP") {

    showMessage("TURN SKIPPED");

    return;
  }


  if (card.type === "REVERSE") {

    showMessage("REVERSE");

    return;
  }
}


/* =========================================================
   AI CARD COUNT UI
   ========================================================= */

function updateAICounter() {

  const element =
    document.getElementById("aiCounter");

  if (!element) {
    return;
  }

  element.textContent =
    "ARSH • " + aiHand.length + " CARDS";
}


/* =========================================================
   PLAYER CARD COUNT UI
   ========================================================= */

function updatePlayerCounter() {

  const element =
    document.getElementById("cardCounter");

  if (!element) {
    return;
  }

  element.textContent =
    "YOUR CARDS • " +
    playerHand.length;
}


/* =========================================================
   TURN UI
   ========================================================= */

function updateTurnUI() {

  const element =
    document.getElementById("turnUI");

  if (!element) {
    return;
  }

  if (currentTurn === "PLAYER") {

    element.textContent =
      "YOUR TURN";

    element.classList.add("playerTurn");
    element.classList.remove("aiTurn");

  } else {

    element.textContent =
      "ARSH'S TURN";

    element.classList.add("aiTurn");
    element.classList.remove("playerTurn");
  }
}


/* =========================================================
   COLOR UI
   ========================================================= */

function updateColorUI() {

  const element =
    document.getElementById("colorUI");

  if (!element) {
    return;
  }

  if (!currentColor) {

    element.textContent =
      "COLOR • —";

    return;
  }

  element.textContent =
    "COLOR • " + currentColor;
}


/* =========================================================
   GAME STATE REFRESH
   ========================================================= */

function refreshGameUI() {

  updatePlayerCounter();
  updateAICounter();
  updateTurnUI();
  updateColorUI();
}


/* =========================================================
   FALLBACK
   ========================================================= */

if (typeof updateUI !== "function") {

  function updateUI() {
    refreshGameUI();
  }
   }
/* =========================================================
   CARD CLICK + UNO + WILD COLOR
   ========================================================= */

function handleCardClick(index) {

  if (!gameRunning) {
    return;
  }

  if (currentTurn !== "PLAYER") {
    showMessage("WAIT FOR YOUR TURN");
    return;
  }

  if (
    index < 0 ||
    index >= playerHand.length
  ) {
    return;
  }

  playPlayerCard(index);
}


/* =========================================================
   UNO BUTTON
   ========================================================= */

function callUNO() {

  if (!gameRunning) {
    return;
  }

  if (currentTurn !== "PLAYER") {
    return;
  }

  if (playerHand.length !== 1) {
    showMessage("UNO IS ONLY FOR ONE CARD");
    return;
  }

  if (playerCalledUNO) {
    return;
  }

  playerCalledUNO = true;
  playerNeedsUNO = false;

  const button =
    document.getElementById("unoButton");

  if (button) {
    button.classList.remove("unoActive");
    button.textContent = "UNO ✓";
  }

  showMessage("UNO!");

  updateUI();
}


/* =========================================================
   WILD COLOR CHOOSER
   ========================================================= */

function openWildChooser(index) {

  if (
    index < 0 ||
    index >= playerHand.length
  ) {
    return;
  }

  selectedCardIndex = index;

  const chooser =
    document.getElementById("wildChooser");

  if (!chooser) {
    return;
  }

  chooser.style.display = "flex";

  const buttons =
    chooser.querySelectorAll("[data-color]");

  buttons.forEach(button => {

    button.onclick = () => {

      const color =
        button.dataset.color;

      playWildPlayerCard(
        selectedCardIndex,
        color
      );

    };

  });
}


/* =========================================================
   CHOOSE WILD COLOR
   ========================================================= */

function chooseWildColor(color) {

  if (
    !color ||
    selectedCardIndex < 0
  ) {
    return;
  }

  playWildPlayerCard(
    selectedCardIndex,
    String(color).toUpperCase()
  );
}


/* =========================================================
   BUTTON SETUP
   ========================================================= */

function setupButtons() {

  const drawButton =
    document.getElementById("drawCard");

  const unoButton =
    document.getElementById("unoButton");


  if (drawButton) {

    drawButton.onclick = () => {
      playerDrawCard();
    };

  }


  if (unoButton) {

    unoButton.onclick = () => {
      callUNO();
    };

  }


  const restartButton =
    document.getElementById("restartGame");

  if (restartButton) {

    restartButton.onclick = () => {

      restartArenaGame();

    };

  }


  const menuButton =
    document.getElementById("backToMenu");

  if (menuButton) {

    menuButton.onclick = () => {

      exitArenaToMenu();

    };

  }


  const red =
    document.querySelector(
      '[data-color="RED"]'
    );

  const blue =
    document.querySelector(
      '[data-color="BLUE"]'
    );

  const green =
    document.querySelector(
      '[data-color="GREEN"]'
    );

  const yellow =
    document.querySelector(
      '[data-color="YELLOW"]'
    );


  if (red) {
    red.onclick = () =>
      chooseWildColor("RED");
  }

  if (blue) {
    blue.onclick = () =>
      chooseWildColor("BLUE");
  }

  if (green) {
    green.onclick = () =>
      chooseWildColor("GREEN");
  }

  if (yellow) {
    yellow.onclick = () =>
      chooseWildColor("YELLOW");
  }
}


/* =========================================================
   GAME END
   ========================================================= */

function finishGame(resultText) {

  gameRunning = false;

  clearTimeout(turnTimer);
  clearTimeout(messageTimer);

  const endScreen =
    document.getElementById("endScreen");

  if (!endScreen) {
    return;
  }

  const result =
    endScreen.querySelector(".resultText");

  if (result) {
    result.textContent = resultText;
  }

  endScreen.style.display = "flex";

  showMessage(resultText);

  if (renderer) {
    renderer.domElement.style.pointerEvents =
      "none";
  }
}


/* =========================================================
   RESTART GAME
   ========================================================= */

function restartArenaGame() {

  clearTimeout(turnTimer);
  clearTimeout(messageTimer);

  gameRunning = true;

  playerHand = [];
  aiHand = [];
  deck = [];
  discardPile = [];

  currentTurn = "PLAYER";
  currentColor = null;

  selectedCard = null;
  selectedCardIndex = -1;

  playerNeedsUNO = false;
  playerCalledUNO = false;


  const endScreen =
    document.getElementById("endScreen");

  if (endScreen) {
    endScreen.style.display = "none";
  }


  if (renderer) {
    renderer.domElement.style.pointerEvents =
      "auto";
  }


  setupGame();

  showMessage("NEW MATCH");

  updateUI();
}


/* =========================================================
   EXIT GAME
   ========================================================= */

function exitArenaToMenu() {

  gameRunning = false;

  clearTimeout(turnTimer);
  clearTimeout(messageTimer);

  if (renderer) {

    try {
      renderer.dispose();
    } catch (error) {}

  }

  renderer = null;
  scene = null;
  camera = null;


  const body =
    document.body;

  if (!body) {
    return;
  }


  body.innerHTML = `
    <div id="returnScreen"
         style="
           position:fixed;
           inset:0;
           display:flex;
           align-items:center;
           justify-content:center;
           background:#05060d;
           color:white;
           font-family:Arial,sans-serif;
           flex-direction:column;
           gap:18px;
         ">

      <div style="
        font-size:26px;
        font-weight:800;
        letter-spacing:3px;
      ">
        CARD ARENA
      </div>

      <div style="
        opacity:.65;
        font-size:13px;
      ">
        Returning to menu...
      </div>

    </div>
  `;

  setTimeout(() => {
    location.reload();
  }, 500);
}


/* =========================================================
   BOARD SHAKE
   ========================================================= */

function shakeBoard() {

  const board =
    document.getElementById("game3d");

  if (!board) {
    return;
  }

  board.classList.remove("boardShake");

  void board.offsetWidth;

  board.classList.add("boardShake");

  setTimeout(() => {
    board.classList.remove("boardShake");
  }, 450);
}


/* =========================================================
   CARD HOVER EFFECT
   ========================================================= */

function highlightCard(index) {

  if (!playerGroup) {
    return;
  }

  playerGroup.children.forEach(
    (cardObject, childIndex) => {

      if (!cardObject) {
        return;
      }

      if (childIndex === index) {

        cardObject.position.y += 0.12;

        cardObject.rotation.x -= 0.05;

      }

    }
  );
}


/* =========================================================
   SAFE MESSAGE ALIAS
   ========================================================= */

function gameMessage(textValue) {

  const element =
    document.getElementById("gameMessage");

  if (!element) {
    return;
  }

  element.textContent =
    textValue;

  element.style.opacity = "1";

  clearTimeout(messageTimer);

  messageTimer = setTimeout(() => {

    element.style.opacity = "0";

  }, 1500);
}


/* =========================================================
   FINAL UI REFRESH
   ========================================================= */

function refreshArenaUI() {

  const cardCounter =
    document.getElementById("cardCounter");

  const aiCounter =
    document.getElementById("aiCounter");

  const turnUI =
    document.getElementById("turnUI");

  const colorUI =
    document.getElementById("colorUI");


  if (cardCounter) {

    cardCounter.textContent =
      "YOUR CARDS • " +
      playerHand.length;

  }


  if (aiCounter) {

    aiCounter.textContent =
      "ARSH • " +
      aiHand.length +
      " CARDS";

  }


  if (turnUI) {

    turnUI.textContent =
      currentTurn === "PLAYER"
        ? "YOUR TURN"
        : "ARSH'S TURN";

  }


  if (colorUI) {

    colorUI.textContent =
      currentColor
        ? "COLOR • " + currentColor
        : "COLOR • —";

  }


  const drawButton =
    document.getElementById("drawCard");

  const unoButton =
    document.getElementById("unoButton");


  if (drawButton) {

    drawButton.disabled =
      currentTurn !== "PLAYER";

  }


  if (unoButton) {

    const canCallUNO =
      currentTurn === "PLAYER" &&
      playerHand.length === 1 &&
      !playerCalledUNO;

    unoButton.disabled =
      !canCallUNO;

    unoButton.style.opacity =
      canCallUNO ? "1" : ".45";

  }
}


/* =========================================================
   WINDOW RESIZE
   ========================================================= */

window.addEventListener(
  "resize",
  () => {

    resizeArena();

  }
);
/* =========================================================
   PREMIUM CARD EFFECTS
   ========================================================= */

function applyCardStyleEffect(cardObject, cardData) {

  if (!cardObject || !cardData) {
    return;
  }

  const styleName =
    getCardStyle();

  if (styleName === "NEON") {

    cardObject.scale.set(
      1.02,
      1.02,
      1.02
    );

  }

  if (styleName === "GOLD") {

    cardObject.scale.set(
      1.025,
      1.025,
      1.025
    );

  }

  if (styleName === "GALAXY") {

    cardObject.scale.set(
      1.015,
      1.015,
      1.015
    );

  }
}


/* =========================================================
   CARD HOVER ANIMATION
   ========================================================= */

function animateCardHover(cardObject, active) {

  if (!cardObject) {
    return;
  }

  const targetY =
    active ? 0.35 : 0;

  const startY =
    cardObject.position.y;

  const startTime =
    performance.now();

  const duration = 180;

  function step(now) {

    const progress =
      Math.min(
        (now - startTime) / duration,
        1
      );

    const eased =
      1 - Math.pow(1 - progress, 3);

    cardObject.position.y =
      startY +
      (targetY - startY) * eased;

    if (progress < 1) {
      requestAnimationFrame(step);
    }

  }

  requestAnimationFrame(step);
}


/* =========================================================
   SELECTED CARD EFFECT
   ========================================================= */

function setSelectedCard(index) {

  if (!playerGroup) {
    return;
  }

  playerGroup.children.forEach(
    (object, childIndex) => {

      if (!object) {
        return;
      }

      const selected =
        childIndex === index;

      object.userData =
        object.userData || {};

      object.userData.selected =
        selected;

      animateCardHover(
        object,
        selected
      );

    }
  );

  selectedCardIndex = index;
}


/* =========================================================
   CARD CLICK FEEDBACK
   ========================================================= */

function cardClickFeedback(cardObject) {

  if (!cardObject) {
    return;
  }

  const originalScale =
    cardObject.scale.clone();

  cardObject.scale.multiplyScalar(1.06);

  setTimeout(() => {

    if (!cardObject) {
      return;
    }

    cardObject.scale.copy(
      originalScale
    );

  }, 130);
}


/* =========================================================
   CENTER CARD PULSE
   ========================================================= */

function pulseDiscardPile() {

  if (!discardGroup) {
    return;
  }

  const originalScale =
    discardGroup.scale.clone();

  discardGroup.scale.set(
    1.12,
    1.12,
    1.12
  );

  setTimeout(() => {

    if (!discardGroup) {
      return;
    }

    discardGroup.scale.copy(
      originalScale
    );

  }, 180);
}


/* =========================================================
   PLAY CARD VISUAL
   ========================================================= */

function playCardVisual(cardObject) {

  if (!cardObject) {
    return;
  }

  const startScale =
    cardObject.scale.clone();

  const startRotation =
    cardObject.rotation.z;

  const startTime =
    performance.now();

  const duration = 350;

  function animateCard(now) {

    const progress =
      Math.min(
        (now - startTime) / duration,
        1
      );

    const eased =
      1 -
      Math.pow(
        1 - progress,
        3
      );

    cardObject.scale.set(
      startScale.x +
      (1.08 - startScale.x) * eased,

      startScale.y +
      (1.08 - startScale.y) * eased,

      startScale.z +
      (1.08 - startScale.z) * eased
    );

    cardObject.rotation.z =
      startRotation +
      Math.sin(eased * Math.PI) * 0.08;

    if (progress < 1) {

      requestAnimationFrame(
        animateCard
      );

    } else {

      cardObject.rotation.z =
        startRotation;

    }

  }

  requestAnimationFrame(
    animateCard
  );
}


/* =========================================================
   DISCARD PULSE AFTER PLAY
   ========================================================= */

function afterCardPlayedEffect() {

  pulseDiscardPile();

  const arena =
    document.getElementById("game3d");

  if (!arena) {
    return;
  }

  arena.classList.remove(
    "cardPlayedFlash"
  );

  void arena.offsetWidth;

  arena.classList.add(
    "cardPlayedFlash"
  );

  setTimeout(() => {

    arena.classList.remove(
      "cardPlayedFlash"
    );

  }, 300);
}


/* =========================================================
   PLAYER CARD POSITIONING
   ========================================================= */

function repositionPlayerCards() {

  if (!playerGroup) {
    return;
  }

  const count =
    playerGroup.children.length;

  if (count === 0) {
    return;
  }

  const spacing =
    count <= 7
      ? 1.55
      : Math.max(
          0.78,
          10.2 / count
        );

  const center =
    (count - 1) / 2;

  playerGroup.children.forEach(
    (object, index) => {

      const offset =
        index - center;

      const angle =
        offset * 0.055;

      object.position.x =
        offset * spacing;

      object.position.y =
        Math.abs(offset) * 0.025;

      object.position.z =
        4.25 +
        Math.abs(offset) * 0.12;

      object.rotation.z =
        -angle;

    }
  );
}


/* =========================================================
   AI CARD POSITIONING
   ========================================================= */

function repositionAICards() {

  if (!aiGroup) {
    return;
  }

  const count =
    aiGroup.children.length;

  if (count === 0) {
    return;
  }

  const spacing =
    count <= 7
      ? 1.35
      : Math.max(
          0.7,
          8.8 / count
        );

  const center =
    (count - 1) / 2;

  aiGroup.children.forEach(
    (object, index) => {

      const offset =
        index - center;

      object.position.x =
        offset * spacing;

      object.position.y =
        0;

      object.position.z =
        -4.15 +
        Math.abs(offset) * 0.08;

      object.rotation.z =
        offset * -0.045;

    }
  );
}


/* =========================================================
   CARD COUNT EFFECT
   ========================================================= */

function cardCountPulse(element) {

  if (!element) {
    return;
  }

  element.classList.remove(
    "counterPulse"
  );

  void element.offsetWidth;

  element.classList.add(
    "counterPulse"
  );

  setTimeout(() => {

    element.classList.remove(
      "counterPulse"
    );

  }, 400);
}


/* =========================================================
   TURN CHANGE EFFECT
   ========================================================= */

function turnChangeEffect() {

  const turnElement =
    document.getElementById("turnUI");

  if (!turnElement) {
    return;
  }

  turnElement.classList.remove(
    "turnChange"
  );

  void turnElement.offsetWidth;

  turnElement.classList.add(
    "turnChange"
  );

  setTimeout(() => {

    turnElement.classList.remove(
      "turnChange"
    );

  }, 500);
}


/* =========================================================
   COLOR CHANGE EFFECT
   ========================================================= */

function colorChangeEffect() {

  const colorElement =
    document.getElementById("colorUI");

  if (!colorElement) {
    return;
  }

  colorElement.classList.remove(
    "colorChange"
  );

  void colorElement.offsetWidth;

  colorElement.classList.add(
    "colorChange"
  );

  setTimeout(() => {

    colorElement.classList.remove(
      "colorChange"
    );

  }, 500);
}


/* =========================================================
   ENHANCED MESSAGE
   ========================================================= */

function arenaMessage(messageText) {

  const element =
    document.getElementById(
      "gameMessage"
    );

  if (!element) {
    return;
  }

  element.textContent =
    messageText;

  element.style.opacity = "1";
  element.style.transform =
    "translate(-50%,-50%) scale(1.08)";

  setTimeout(() => {

    if (!element) {
      return;
    }

    element.style.transform =
      "translate(-50%,-50%) scale(1)";

  }, 160);

  clearTimeout(messageTimer);

  messageTimer =
    setTimeout(() => {

      element.style.opacity =
        "0";

    }, 1500);
}


/* =========================================================
   CONNECT VISUAL EFFECTS
   ========================================================= */

const oldShowMessage =
  typeof showMessage === "function"
    ? showMessage
    : null;

function showMessage(textValue) {

  if (oldShowMessage) {

    try {
      oldShowMessage(textValue);
    } catch (error) {}

  }

  arenaMessage(textValue);
}


/* =========================================================
   FINAL VISUAL UPDATE
   ========================================================= */

function updateArenaVisuals() {

  repositionPlayerCards();
  repositionAICards();

  const counter =
    document.getElementById(
      "cardCounter"
    );

  const aiCounter =
    document.getElementById(
      "aiCounter"
    );

  cardCountPulse(counter);
  cardCountPulse(aiCounter);

  turnChangeEffect();
  colorChangeEffect();
  }
