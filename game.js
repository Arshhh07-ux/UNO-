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
/* =========================================================
   ARSH CARD ARENA — GAME.JS
   PART 2/3 — GAME LOGIC + ARSH PRO AI
   ========================================================= */

/* =========================================================
   TURN / GAME STATUS HELPERS
   ========================================================= */

function isPlayerTurn() {

    return (
        gameRunning &&
        !gameOver &&
        currentTurn === "PLAYER"
    );

}

function isAITurn() {

    return (
        gameRunning &&
        !gameOver &&
        currentTurn === "AI"
    );

}

function getTopCard() {

    return (
        discardPile[
            discardPile.length - 1
        ] || null
    );

}

/* =========================================================
   START GAME
   ========================================================= */

function startGame() {

    clearTimeout(aiTimer);

    gameRunning = false;

    gameOver = false;

    prepareGame();

    gameRunning = true;

    updateGameStatus();

    console.log(
        "%cGAME STARTED",
        "color:#16d98a;font-weight:bold"
    );

    emitGameEvent(
        "gameStarted",
        {
            mode: gameMode,
            style: cardStyle,
            difficulty: difficulty
        }
    );

    renderGame();

    /*
       If the first player is AI,
       start AI automatically.
    */

    if (
        currentTurn === "AI"
    ) {

        scheduleAITurn();

    }

}

/* =========================================================
   STOP GAME
   ========================================================= */

function stopGame() {

    clearTimeout(aiTimer);

    gameRunning = false;

    gameOver = false;

    selectedCardIndex = -1;

    hoveredCardIndex = -1;

    updateGameStatus();

    emitGameEvent(
        "gameStopped"
    );

    renderGame();

}

/* =========================================================
   RESTART GAME
   ========================================================= */

function restartGame() {

    clearTimeout(aiTimer);

    startGame();

}

/* =========================================================
   PLAY CARD FROM PLAYER HAND
   ========================================================= */

function playPlayerCard(index) {

    if (!isPlayerTurn()) {

        return false;

    }

    if (
        index < 0 ||
        index >= playerHand.length
    ) {

        return false;

    }

    const card =
        playerHand[index];

    if (
        !canPlayCard(
            card,
            playerHand
        )
    ) {

        notifyGame(
            "That card cannot be played."
        );

        return false;

    }

    /*
       UNO requirement.
    */

    if (
        playerHand.length === 2 &&
        !playerCalledUNO
    ) {

        playerNeedsUNO = true;

        notifyGame(
            "You must call UNO!"
        );

        return false;

    }

    playerCalledUNO = false;

    playerNeedsUNO = false;

    playCardFromHand(
        playerHand,
        index,
        "PLAYER"
    );

    return true;

}

/* =========================================================
   PLAY CARD FROM ANY HAND
   ========================================================= */

function playCardFromHand(
    hand,
    index,
    owner
) {

    if (
        index < 0 ||
        index >= hand.length
    ) {

        return false;

    }

    const card =
        hand.splice(
            index,
            1
        )[0];

    if (!card) {

        return false;

    }

    discardPile.push(card);

    /*
       Coloured card changes
       the active colour.
    */

    if (card.color) {

        currentColor =
            card.color;

    }

    /*
       WILD cards need a colour
       selection.
    */

    if (
        card.type === "wild" ||
        card.type === "wild4"
    ) {

        pendingWildCard = {
            card,
            owner
        };

        /*
           AI chooses immediately.
        */

        if (
            owner === "AI"
        ) {

            const chosenColor =
                aiChooseColor();

            applyWildColor(
                chosenColor
            );

        }

    }

    handleCardEffect(
        card,
        owner
    );

    checkWinner();

    if (gameOver) {

        return true;

    }

    /*
       WILD pauses normal turn
       only when the player needs
       to choose a colour.
    */

    if (
        pendingWildCard &&
        owner === "PLAYER"
    ) {

        updateGameStatus();

        renderGame();

        return true;

    }

    changeTurn();

    updateGameStatus();

    renderGame();

    if (
        currentTurn === "AI"
    ) {

        scheduleAITurn();

    }

    return true;

}

/* =========================================================
   APPLY WILD COLOUR
   ========================================================= */

function applyWildColor(color) {

    if (
        !COLOR_NAMES.includes(color)
    ) {

        return false;

    }

    currentColor = color;

    pendingWildCard = null;

    updateGameStatus();

    renderGame();

    return true;

}

/* =========================================================
   PLAYER WILD COLOUR
   ========================================================= */

function playerChooseColor(color) {

    if (!pendingWildCard) {

        return false;

    }

    if (
        pendingWildCard.owner !==
        "PLAYER"
    ) {

        return false;

    }

    applyWildColor(color);

    changeTurn();

    updateGameStatus();

    renderGame();

    if (
        currentTurn === "AI"
    ) {

        scheduleAITurn();

    }

    return true;

}

/* =========================================================
   CARD EFFECTS
   ========================================================= */

function handleCardEffect(
    card,
    owner
) {

    if (!card) {

        return;

    }

    switch (card.type) {

        case "number":

            break;

        case "skip":

            /*
               Skip the opponent.
            */

            if (
                !gameOver
            ) {

                changeTurn();

            }

            break;

        case "reverse":

            /*
               Two-player UNO:
               Reverse behaves like Skip.
            */

            if (
                !gameOver
            ) {

                changeTurn();

            }

            break;

        case "draw2":

            drawCards(
                owner === "PLAYER"
                    ? aiHand
                    : playerHand,
                2
            );

            /*
               Draw victim loses turn.
            */

            if (
                !gameOver
            ) {

                changeTurn();

            }

            break;

        case "wild":

            break;

        case "wild4":

            drawCards(
                owner === "PLAYER"
                    ? aiHand
                    : playerHand,
                4
            );

            /*
               Victim loses turn.
            */

            if (
                !gameOver
            ) {

                changeTurn();

            }

            break;

        default:

            break;

    }

}

/* =========================================================
   DRAW PLAYER CARD
   ========================================================= */

function playerDrawCard() {

    if (!isPlayerTurn()) {

        return null;

    }

    const card =
        drawFromDeck();

    if (!card) {

        notifyGame(
            "No cards left to draw."
        );

        return null;

    }

    playerHand.push(card);

    playerCalledUNO = false;

    playerNeedsUNO = false;

    emitGameEvent(
        "playerDraw",
        {
            card
        }
    );

    /*
       Automatically play the drawn card
       is NOT allowed.
    */

    changeTurn();

    updateGameStatus();

    renderGame();

    scheduleAITurn();

    return card;

}

/* =========================================================
   AI DRAW CARD
   ========================================================= */

function aiDrawCard() {

    if (!isAITurn()) {

        return null;

    }

    const card =
        drawFromDeck();

    if (!card) {

        return null;

    }

    aiHand.push(card);

    aiCalledUNO = false;

    aiNeedsUNO = false;

    emitGameEvent(
        "aiDraw",
        {
            card
        }
    );

    return card;

}

/* =========================================================
   PLAYER UNO
   ========================================================= */

function callPlayerUNO() {

    if (
        !gameRunning ||
        gameOver
    ) {

        return false;

    }

    if (
        playerHand.length === 1
    ) {

        playerCalledUNO = true;

        playerNeedsUNO = false;

        notifyGame(
            "UNO!"
        );

        emitGameEvent(
            "playerUNO"
        );

        renderGame();

        return true;

    }

    notifyGame(
        "You can call UNO only with one card."
    );

    return false;

}

/* =========================================================
   AI UNO
   ========================================================= */

function aiCallUNO() {

    if (
        aiHand.length === 1
    ) {

        aiCalledUNO = true;

        aiNeedsUNO = false;

        emitGameEvent(
            "aiUNO"
        );

        notifyGame(
            "ARSH: UNO!"
        );

        return true;

    }

    return false;

}

/* =========================================================
   CHECK UNO STATE
   ========================================================= */

function checkUNOState() {

    if (
        playerHand.length === 1 &&
        !playerCalledUNO
    ) {

        playerNeedsUNO = true;

    } else {

        playerNeedsUNO = false;

    }

    if (
        aiHand.length === 1 &&
        !aiCalledUNO
    ) {

        aiNeedsUNO = true;

    } else {

        aiNeedsUNO = false;

    }

}

/* =========================================================
   WINNER CHECK
   ========================================================= */

function checkWinner() {

    checkUNOState();

    if (
        playerHand.length === 0
    ) {

        endGame(
            "PLAYER"
        );

        return "PLAYER";

    }

    if (
        aiHand.length === 0
    ) {

        endGame(
            "AI"
        );

        return "AI";

    }

    return null;

}

/* =========================================================
   END GAME
   ========================================================= */

function endGame(winner) {

    gameOver = true;

    gameRunning = false;

    clearTimeout(aiTimer);

    selectedCardIndex = -1;

    hoveredCardIndex = -1;

    let message = "";

    if (
        winner === "PLAYER"
    ) {

        message =
            "YOU WIN!";

    } else if (
        winner === "AI"
    ) {

        message =
            "ARSH WINS!";

    } else {

        message =
            "GAME OVER";

    }

    notifyGame(
        message
    );

    emitGameEvent(
        "gameOver",
        {
            winner,
            message
        }
    );

    updateGameStatus();

    renderGame();

}

/* =========================================================
   ARSH PRO AI
   ========================================================= */

function aiChooseCard() {

    if (
        aiHand.length === 0
    ) {

        return -1;

    }

    const playable =
        getPlayableCards(
            aiHand
        );

    if (
        playable.length === 0
    ) {

        return -1;

    }

    /*
       EASY
    */

    if (
        difficulty === "EASY"
    ) {

        return (
            playable[
                Math.floor(
                    Math.random() *
                    playable.length
                )
            ]
        );

    }

    /*
       NORMAL
    */

    if (
        difficulty === "NORMAL"
    ) {

        let best =
            playable[0];

        for (
            const index of playable
        ) {

            if (
                getCardPriority(
                    aiHand[index]
                ) >
                getCardPriority(
                    aiHand[best]
                )
            ) {

                best = index;

            }

        }

        return best;

    }

    /*
       PRO / HARD
       ARSH analyses the hand,
       current colour and opponent.
    */

    let bestIndex =
        playable[0];

    let bestScore =
        -Infinity;

    playable.forEach(
        index => {

            const card =
                aiHand[index];

            let score =
                getCardPriority(card) * 2;

            /*
               Prefer cards that
               reduce the AI hand.
            */

            score +=
                (10 - aiHand.length);

            /*
               Strong action cards.
            */

            if (
                card.type === "draw2"
            ) {

                score += 35;

            }

            if (
                card.type === "skip"
            ) {

                score += 30;

            }

            if (
                card.type === "reverse"
            ) {

                score += 25;

            }

            /*
               Wild cards are valuable
               when colour control is useful.
            */

            if (
                card.type === "wild"
            ) {

                score += 20;

            }

            if (
                card.type === "wild4"
            ) {

                score += 45;

            }

            /*
               Avoid wasting wild cards
               when another playable card
               is available.
            */

            if (
                (
                    card.type === "wild" ||
                    card.type === "wild4"
                ) &&
                playable.length > 1
            ) {

                score -= 12;

            }

            /*
               Prefer colours that AI
               already has many of.
            */

            if (
                card.color
            ) {

                const colourCount =
                    aiHand.filter(
                        c =>
                            c.color ===
                            card.color
                    ).length;

                score +=
                    colourCount * 8;

            }

            /*
               If AI is close to UNO,
               aggressive cards get
               extra priority.
            */

            if (
                aiHand.length <= 3
            ) {

                if (
                    card.type === "draw2" ||
                    card.type === "skip" ||
                    card.type === "wild4"
                ) {

                    score += 40;

                }

            }

            /*
               Small random factor prevents
               identical games every time.
            */

            score +=
                Math.random() * 8;

            if (
                score > bestScore
            ) {

                bestScore = score;

                bestIndex = index;

            }

        }
    );

    return bestIndex;

}

/* =========================================================
   ARSH PRO — CHOOSE COLOUR
   ========================================================= */

function aiChooseColor() {

    const counts = {

        RED: 0,

        BLUE: 0,

        GREEN: 0,

        YELLOW: 0

    };

    aiHand.forEach(
        card => {

            if (
                card.color &&
                counts[card.color]
                !== undefined
            ) {

                counts[
                    card.color
                ]++;

            }

        }
    );

    /*
       ARSH chooses the colour
       with the most cards.
    */

    let bestColor =
        COLOR_NAMES[0];

    let bestCount =
        -1;

    COLOR_NAMES.forEach(
        color => {

            if (
                counts[color] >
                bestCount
            ) {

                bestCount =
                    counts[color];

                bestColor =
                    color;

            }

        }
    );

    return bestColor;

}

/* =========================================================
   AI TURN
   ========================================================= */

function runAITurn() {

    if (!isAITurn()) {

        return;

    }

    clearTimeout(aiTimer);

    checkUNOState();

    /*
       Call UNO when appropriate.
    */

    if (
        aiHand.length === 2
    ) {

        /*
           AI knows it may be able
           to reach one card.
        */

    }

    let cardIndex =
        aiChooseCard();

    /*
       No playable card:
       draw one.
    */

    if (
        cardIndex === -1
    ) {

        aiDrawCard();

        cardIndex =
            aiHand.length > 0
                ? aiHand.length - 1
                : -1;

        /*
           Only play the drawn card
           if it is legally playable.
        */

        if (
            cardIndex >= 0 &&
            !canPlayCard(
                aiHand[cardIndex],
                aiHand
            )
        ) {

            changeTurn();

            updateGameStatus();

            renderGame();

            return;

        }

    }

    if (
        cardIndex >= 0
    ) {

        /*
           AI calls UNO before
           playing its second-last card.
        */

        if (
            aiHand.length === 2
        ) {

            const selected =
                aiHand[cardIndex];

            /*
               If this move leaves
               one card, call UNO.
            */

            if (selected) {

                aiCalledUNO = true;

            }

        }

        playCardFromHand(
            aiHand,
            cardIndex,
            "AI"
        );

        /*
           playCardFromHand normally
           changes turn automatically.
        */

        return;

    }

    /*
       Safety fallback.
    */

    changeTurn();

    updateGameStatus();

    renderGame();

}

/* =========================================================
   SCHEDULE AI
   ========================================================= */

function scheduleAITurn(
    delay = 850
) {

    clearTimeout(aiTimer);

    if (!gameRunning) {

        return;

    }

    if (gameOver) {

        return;

    }

    if (
        currentTurn !== "AI"
    ) {

        return;

    }

    aiTimer =
        setTimeout(
            runAITurn,
            delay
        );

}

/* =========================================================
   GAME EVENT SYSTEM
   ========================================================= */

function emitGameEvent(
    eventName,
    data = {}
) {

    try {

        window.dispatchEvent(
            new CustomEvent(
                "arena:" + eventName,
                {
                    detail: data
                }
            )
        );

    } catch (error) {

        console.warn(
            "Game event error:",
            error
        );

    }

}

/* =========================================================
   STATUS TEXT
   ========================================================= */

function getGameStatusText() {

    if (gameOver) {

        if (
            playerHand.length === 0
        ) {

            return "YOU WIN!";

        }

        if (
            aiHand.length === 0
        ) {

            return "ARSH WINS!";

        }

        return "GAME OVER";

    }

    if (
        pendingWildCard &&
        pendingWildCard.owner ===
        "PLAYER"
    ) {

        return "CHOOSE A COLOUR";

    }

    if (
        currentTurn === "PLAYER"
    ) {

        return "YOUR TURN";

    }

    return "ARSH IS THINKING...";

}

/* ======================================
