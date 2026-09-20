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

let gameMode = "OFFLINE";
let cardStyle = "NORMAL";
let difficulty = "PRO";

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
