/* =========================================================
   ARSH CARD ARENA — GAME.JS
   PART 1/3 — CORE + CARD SYSTEM
   ========================================================= */

"use strict";

/* =========================================================
   THREE.JS
   ========================================================= */

let scene = null;
let camera = null;
let renderer = null;
let raycaster = null;

const pointer = new THREE.Vector2();

let animationFrame = null;

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

let selectedCardIndex = -1;
let hoveredCardIndex = -1;

let playerCalledUNO = false;
let playerNeedsUNO = false;

let aiCalledUNO = false;
let aiNeedsUNO = false;

let pendingWildCard = null;

let aiTimer = null;

/* =========================================================
   GAME SETTINGS
   ========================================================= */

let gameMode = "OFFLINE";
let cardStyle = "NORMAL";
let difficulty = "PRO";

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
   CARD STYLES
   ========================================================= */

const CARD_STYLES = {

    NORMAL: {

        name: "NORMAL",

        glow: false,

        metallic: false,

        rainbow: false

    },

    SHINING: {

        name: "SHINING",

        glow: true,

        metallic: false,

        rainbow: false

    },

    GOLD: {

        name: "GOLD",

        glow: true,

        metallic: true,

        rainbow: false

    },

    NEON: {

        name: "NEON",

        glow: true,

        metallic: false,

        rainbow: true

    },

    GALAXY: {

        name: "GALAXY",

        glow: true,

        metallic: true,

        rainbow: true

    }

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

/* =========================================================
   READ SETTINGS FROM INDEX.HTML
   ========================================================= */

function getSelectedGameSettings() {

    try {

        if (
            typeof window.gameMode !== "undefined" &&
            window.gameMode
        ) {

            gameMode =
                safeUpper(
                    window.gameMode,
                    "OFFLINE"
                );

        }

        if (
            typeof window.cardStyle !== "undefined" &&
            window.cardStyle
        ) {

            cardStyle =
                safeUpper(
                    window.cardStyle,
                    "NORMAL"
                );

        }

        if (
            typeof window.difficulty !== "undefined" &&
            window.difficulty
        ) {

            difficulty =
                safeUpper(
                    window.difficulty,
                    "PRO"
                );

        }

    } catch (error) {

        console.warn(
            "Could not read game settings:",
            error
        );

    }

    if (
        gameMode !== "ONLINE" &&
        gameMode !== "OFFLINE"
    ) {

        gameMode = "OFFLINE";

    }

    if (!CARD_STYLES[cardStyle]) {

        cardStyle = "NORMAL";

    }

    if (
        difficulty !== "EASY" &&
        difficulty !== "NORMAL" &&
        difficulty !== "PRO" &&
        difficulty !== "HARD"
    ) {

        difficulty = "PRO";

    }

    window.gameMode = gameMode;

    window.cardStyle = cardStyle;

    window.difficulty = difficulty;

}

/* =========================================================
   UNIQUE CARD ID
   ========================================================= */

function createCardID() {

    return (

        "card_" +

        Date.now() +

        "_" +

        Math.random()
            .toString(36)
            .substring(2, 10)

    );

}

/* =========================================================
   CREATE CARD
   ========================================================= */

function createCard(
    color,
    value,
    type
) {

    return {

        id: createCardID(),

        color: color,

        value: value,

        type: type,

        style: cardStyle

    };

}

/* =========================================================
   CREATE UNO DECK
   ========================================================= */

function createDeck() {

    const newDeck = [];

    /* -----------------------------------------------------
       COLOURED CARDS
       ----------------------------------------------------- */

    COLOR_NAMES.forEach(color => {

        /* ZERO */

        newDeck.push(
            createCard(
                color,
                CARD_VALUES.ZERO,
                "number"
            )
        );

        /* 1 - 9 */

        for (
            let number = 1;
            number <= 9;
            number++
        ) {

            newDeck.push(
                createCard(
                    color,
                    String(number),
                    "number"
                )
            );

            newDeck.push(
                createCard(
                    color,
                    String(number),
                    "number"
                )
            );

        }

        /* ACTION CARDS */

        for (let i = 0; i < 2; i++) {

            newDeck.push(
                createCard(
                    color,
                    CARD_VALUES.SKIP,
                    "skip"
                )
            );

            newDeck.push(
                createCard(
                    color,
                    CARD_VALUES.REVERSE,
                    "reverse"
                )
            );

            newDeck.push(
                createCard(
                    color,
                    CARD_VALUES.DRAW2,
                    "draw2"
                )
            );

        }

    });

    /* -----------------------------------------------------
       WILD CARDS
       ----------------------------------------------------- */

    for (let i = 0; i < 4; i++) {

        newDeck.push(
            createCard(
                null,
                CARD_VALUES.WILD,
                "wild"
            )
        );

        newDeck.push(
            createCard(
                null,
                CARD_VALUES.WILD4,
                "wild4"
            )
        );

    }

    return newDeck;

}

/* =========================================================
   SHUFFLE
   ========================================================= */

function shuffleDeck(cards) {

    for (
        let i = cards.length - 1;
        i > 0;
        i--
    ) {

        const randomIndex =
            Math.floor(
                Math.random() *
                (i + 1)
            );

        [
            cards[i],
            cards[randomIndex]
        ] = [
            cards[randomIndex],
            cards[i]
        ];

    }

    return cards;

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
        discardPile[
            discardPile.length - 1
        ];

    const oldDiscard =
        discardPile.slice(
            0,
            discardPile.length - 1
        );

    deck =
        oldDiscard.map(card => ({
            ...card
        }));

    discardPile = [
        topCard
    ];

    shuffleDeck(deck);

}

/* =========================================================
   DRAW ONE CARD
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

/* =========================================================
   DRAW MULTIPLE CARDS
   ========================================================= */

function drawCards(
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

        if (!card) {

            break;

        }

        hand.push(card);

    }

}

/* =========================================================
   RESET GAME STATE
   ========================================================= */

function resetGameState() {

    clearTimeout(aiTimer);

    gameOver = false;

    currentTurn = "PLAYER";

    currentColor = null;

    selectedCardIndex = -1;

    hoveredCardIndex = -1;

    playerCalledUNO = false;

    playerNeedsUNO = false;

    aiCalledUNO = false;

    aiNeedsUNO = false;

    pendingWildCard = null;

    playerHand = [];

    aiHand = [];

    deck = [];

    discardPile = [];

}

/* =========================================================
   DEAL STARTING CARDS
   ========================================================= */

function dealStartingCards() {

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
   FIRST DISCARD CARD
   ========================================================= */

function createFirstDiscard() {

    let card =
        drawFromDeck();

    let safety = 0;

    /*
       Do not begin the game
       with a WILD or +4.
    */

    while (
        card &&
        (
            card.type === "wild" ||
            card.type === "wild4"
        ) &&
        safety < 20
    ) {

        deck.unshift(card);

        shuffleDeck(deck);

        card =
            drawFromDeck();

        safety++;

    }

    if (!card) {

        return;

    }

    discardPile.push(card);

    currentColor =
        card.color ||
        COLOR_NAMES[
            Math.floor(
                Math.random() *
                COLOR_NAMES.length
            )
        ];

}

/* =========================================================
   CHECK IF CARD IS PLAYABLE
   ========================================================= */

function canPlayCard(
    card,
    hand = playerHand
) {

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
        card.type === "wild"
    ) {

        return true;

    }

    /* WILD +4 */

    if (
        card.type === "wild4"
    ) {

        /*
           +4 is allowed only when
           player has no current colour.
        */

        const hasCurrentColour =
            hand.some(
                currentCard =>
                    currentCard.color ===
                    currentColor
            );

        if (hasCurrentColour) {

            return false;

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
   GET PLAYABLE CARDS
   ========================================================= */

function getPlayableCards(
    hand
) {

    const playable = [];

    hand.forEach(
        (card, index) => {

            if (
                canPlayCard(
                    card,
                    hand
                )
            ) {

                playable.push(
                    index
                );

            }

        }
    );

    return playable;

}

/* =========================================================
   NEXT TURN
   ========================================================= */

function changeTurn() {

    if (
        currentTurn === "PLAYER"
    ) {

        currentTurn = "AI";

    } else {

        currentTurn = "PLAYER";

    }

}

/* =========================================================
   CARD PRIORITY
   ========================================================= */

function getCardPriority(card) {

    if (!card) {

        return 0;

    }

    if (
        card.type === "wild4"
    ) {

        return 100;

    }

    if (
        card.type === "draw2"
    ) {

        return 80;

    }

    if (
        card.type === "skip"
    ) {

        return 70;

    }

    if (
        card.type === "reverse"
    ) {

        return 65;

    }

    if (
        card.type === "wild"
    ) {

        return 60;

    }

    if (
        card.type === "number"
    ) {

        return (
            Number(card.value) ||
            0
        );

    }

    return 10;

}

/* =========================================================
   RESET ROUND
   ========================================================= */

function resetRound() {

    resetGameState();

    deck =
        shuffleDeck(
            createDeck()
        );

    dealStartingCards();

    createFirstDiscard();

    currentTurn = "PLAYER";

    gameOver = false;

}

/* =========================================================
   GAME START DATA
   ========================================================= */

function prepareGame() {

    getSelectedGameSettings();

    resetRound();

    console.log(
        "CARD ARENA SETTINGS:",
        {
            mode: gameMode,
            style: cardStyle,
            difficulty: difficulty
        }
    );

}

/* =========================================================
   PUBLIC CARD HELPERS
   ========================================================= */

window.ArenaCards = {

    createDeck,

    shuffleDeck,

    drawFromDeck,

    canPlayCard,

    getPlayableCards,

    drawCards,

    getCardPriority

};

/* =========================================================
   INITIAL SETTINGS
   ========================================================= */

getSelectedGameSettings();

console.log(
    "%cARSH CARD ARENA CORE READY",
    "color:#ffd54a;font-size:16px;font-weight:bold"
);
