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
