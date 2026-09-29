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

/* =========================================================
   ARSH CARD ARENA — GAME.JS
   PART 3/3 — THREE.JS 3D ARENA + RENDERING + CONTROLS
   ========================================================= */

/* =========================================================
   THREE.JS INITIALIZATION
   ========================================================= */

let arenaRoot = null;
let tableMesh = null;
let tableRim = null;
let playerGroup = null;
let aiGroup = null;
let deckGroup = null;
let discardGroup = null;

let playerCardMeshes = [];
let aiCardMeshes = [];

let lastRenderTime = 0;
let arenaClock = 0;

function initThreeArena() {

    if (
        typeof THREE === "undefined"
    ) {

        console.warn(
            "Three.js is not loaded."
        );

        return false;

    }

    /*
       Prevent duplicate initialization.
    */

    if (
        renderer &&
        scene &&
        camera
    ) {

        return true;

    }

    const container =
        document.getElementById(
            "gameCanvas"
        ) ||
        document.getElementById(
            "arenaCanvas"
        ) ||
        document.getElementById(
            "threeContainer"
        ) ||
        document.querySelector(
            ".game-canvas"
        ) ||
        document.querySelector(
            ".arena-canvas"
        );

    /*
       Create a fallback container
       if index.html does not have one.
    */

    let target = container;

    if (!target) {

        target =
            document.createElement(
                "div"
            );

        target.id =
            "gameCanvas";

        target.style.position =
            "fixed";

        target.style.inset =
            "0";

        target.style.zIndex =
            "1";

        document.body.appendChild(
            target
        );

    }

    scene =
        new THREE.Scene();

    scene.background =
        new THREE.Color(
            0x05070d
        );

    camera =
        new THREE.PerspectiveCamera(
            42,
            Math.max(
                window.innerWidth,
                1
            ) /
            Math.max(
                window.innerHeight,
                1
            ),
            0.1,
            100
        );

    camera.position.set(
        0,
        12,
        15
    );

    camera.lookAt(
        0,
        0,
        0
    );

    renderer =
        new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference:
                "high-performance"
        });

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            2
        )
    );

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.shadowMap.enabled =
        true;

    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;

    target.innerHTML = "";

    target.appendChild(
        renderer.domElement
    );

    renderer.domElement.style.width =
        "100%";

    renderer.domElement.style.height =
        "100%";

    renderer.domElement.style.display =
        "block";

    raycaster =
        new THREE.Raycaster();

    pointer.set(
        0,
        0
    );

    createArenaLights();

    createArenaTable();

    createArenaGroups();

    createArenaDeck();

    createArenaFloor();

    bindArenaPointerEvents();

    resizeArena();

    startArenaAnimation();

    return true;

}

/* =========================================================
   ARENA LIGHTING
   ========================================================= */

function createArenaLights() {

    const ambient =
        new THREE.AmbientLight(
            0xffffff,
            1.7
        );

    scene.add(
        ambient
    );

    const keyLight =
        new THREE.DirectionalLight(
            0xffffff,
            2.5
        );

    keyLight.position.set(
        4,
        10,
        8
    );

    keyLight.castShadow =
        true;

    scene.add(
        keyLight
    );

    const redLight =
        new THREE.PointLight(
            COLORS.RED,
            35,
            30
        );

    redLight.position.set(
        -8,
        4,
        -5
    );

    scene.add(
        redLight
    );

    const blueLight =
        new THREE.PointLight(
            COLORS.BLUE,
            30,
            30
        );

    blueLight.position.set(
        8,
        4,
        2
    );

    scene.add(
        blueLight
    );

}

/* =========================================================
   ARENA FLOOR
   ========================================================= */

function createArenaFloor() {

    const geometry =
        new THREE.CircleGeometry(
            28,
            64
        );

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x03050a,
            roughness: 0.72,
            metalness: 0.25
        });

    const floor =
        new THREE.Mesh(
            geometry,
            material
        );

    floor.rotation.x =
        -Math.PI / 2;

    floor.position.y =
        -0.35;

    floor.receiveShadow =
        true;

    scene.add(
        floor
    );

}

/* =========================================================
   3D TABLE
   ========================================================= */

function createArenaTable() {

    const tableGeometry =
        new THREE.CylinderGeometry(
            10.5,
            11.2,
            0.65,
            64
        );

    const tableMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x10131c,
            roughness: 0.38,
            metalness: 0.5
        });

    tableMesh =
        new THREE.Mesh(
            tableGeometry,
            tableMaterial
        );

    tableMesh.position.y =
        -0.05;

    tableMesh.scale.z =
        0.72;

    tableMesh.receiveShadow =
        true;

    tableMesh.castShadow =
        true;

    scene.add(
        tableMesh
    );

    /*
       Neon-style rim.
    */

    const rimGeometry =
        new THREE.TorusGeometry(
            10.5,
            0.09,
            12,
            96
        );

    const rimMaterial =
        new THREE.MeshBasicMaterial({
            color: COLORS.RED
        });

    tableRim =
        new THREE.Mesh(
            rimGeometry,
            rimMaterial
        );

    tableRim.rotation.x =
        Math.PI / 2;

    tableRim.scale.z =
        0.72;

    tableRim.position.y =
        0.28;

    scene.add(
        tableRim
    );

}

/* =========================================================
   ARENA GROUPS
   ========================================================= */

function createArenaGroups() {

    arenaRoot =
        new THREE.Group();

    playerGroup =
        new THREE.Group();

    aiGroup =
        new THREE.Group();

    deckGroup =
        new THREE.Group();

    discardGroup =
        new THREE.Group();

    arenaRoot.add(
        playerGroup
    );

    arenaRoot.add(
        aiGroup
    );

    arenaRoot.add(
        deckGroup
    );

    arenaRoot.add(
        discardGroup
    );

    scene.add(
        arenaRoot
    );

}

/* =========================================================
   3D DECK
   ========================================================= */

function createArenaDeck() {

    if (!deckGroup) {

        return;

    }

    while (
        deckGroup.children.length
    ) {

        deckGroup.remove(
            deckGroup.children[0]
        );

    }

    const geometry =
        new THREE.BoxGeometry(
            2.25,
            0.18,
            3.25
        );

    for (
        let i = 0;
        i < 5;
        i++
    ) {

        const material =
            new THREE.MeshStandardMaterial({
                color: 0x151923,
                roughness: 0.32,
                metalness: 0.65
            });

        const card =
            new THREE.Mesh(
                geometry,
                material
            );

        card.position.set(
            -1.7,
            0.38 +
                i * 0.045,
            0.1
        );

        card.rotation.y =
            -0.04;

        card.castShadow =
            true;

        deckGroup.add(
            card
        );

    }

}

/* =========================================================
   CARD MATERIAL
   ========================================================= */

function getCardMaterial(card) {

    let colour =
        COLORS.BLACK;

    if (
        card &&
        card.color &&
        COLORS[card.color]
    ) {

        colour =
            COLORS[card.color];

    }

    /*
       Wild cards use a bright
       neutral material.
    */

    if (
        card &&
        (
            card.type === "wild" ||
            card.type === "wild4"
        )
    ) {

        colour =
            COLORS.BLACK;

    }

    const style =
        CARD_STYLES[
            card?.style ||
            cardStyle
        ] ||
        CARD_STYLES.NORMAL;

    const material =
        new THREE.MeshStandardMaterial({
            color: colour,
            roughness:
                style.metallic
                    ? 0.18
                    : 0.42,
            metalness:
                style.metallic
                    ? 0.78
                    : 0.18,
            emissive:
                style.glow
                    ? colour
                    : 0x000000,
            emissiveIntensity:
                style.glow
                    ? 0.22
                    : 0
        });

    return material;

}

/* =========================================================
   CREATE 3D CARD
   ========================================================= */

function createCardMesh(
    card,
    faceUp = true
) {

    const group =
        new THREE.Group();

    const geometry =
        new THREE.BoxGeometry(
            1.45,
            0.12,
            2.15,
            3,
            1,
            3
        );

    const material =
        faceUp
            ? getCardMaterial(card)
            : new THREE.MeshStandardMaterial({
                color: 0x111827,
                roughness: 0.35,
                metalness: 0.55
            });

    const mesh =
        new THREE.Mesh(
            geometry,
            material
        );

    mesh.castShadow =
        true;

    mesh.receiveShadow =
        true;

    mesh.userData.card =
        card;

    mesh.userData.isCard =
        true;

    group.add(
        mesh
    );

    /*
       Inner card face.
    */

    if (faceUp) {

        const innerGeometry =
            new THREE.PlaneGeometry(
                1.08,
                1.78
            );

        const innerMaterial =
            new THREE.MeshBasicMaterial({
                color:
                    card &&
                    card.color &&
                    COLORS[card.color]
                        ? COLORS[card.color]
                        : 0x151923
            });

        const inner =
            new THREE.Mesh(
                innerGeometry,
                innerMaterial
            );

        inner.position.y =
            0.071;

        inner.rotation.x =
            -Math.PI / 2;

        group.add(
            inner
        );

    }

    /*
       Add text as a sprite.
    */

    if (faceUp) {

        const label =
            createCardLabel(
                card
            );

        if (label) {

            label.position.y =
                0.085;

            group.add(
                label
            );

        }

    }

    return group;

}

/* =========================================================
   CARD LABEL
   ========================================================= */

function createCardLabel(card) {

    if (
        typeof document ===
        "undefined"
    ) {

        return null;

    }

    const canvas =
        document.createElement(
            "canvas"
        );

    canvas.width =
        256;

    canvas.height =
        256;

    const context =
        canvas.getContext(
            "2d"
        );

    if (!context) {

        return null;

    }

    context.clearRect(
        0,
        0,
        256,
        256
    );

    context.fillStyle =
        "#ffffff";

    context.font =
        "bold 82px Arial";

    context.textAlign =
        "center";

    context.textBaseline =
        "middle";

    let value =
        card?.value ||
        "?";

    if (
        value === "REVERSE"
    ) {

        value = "↻";

    }

    if (
        value === "SKIP"
    ) {

        value = "⊘";

    }

    context.fillText(
        value,
        128,
        128
    );

    const texture =
        new THREE.CanvasTexture(
            canvas
        );

    texture.needsUpdate =
        true;

    const material =
        new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });

    const sprite =
        new THREE.Sprite(
            material
        );

    sprite.scale.set(
        1.0,
        1.0,
        1
    );

    return sprite;

}

/* =========================================================
   CLEAR CARD GROUP
   ========================================================= */

function clearGroup(group) {

    if (!group) {

        return;

    }

    while (
        group.children.length
    ) {

        const child =
            group.children[
                group.children.length - 1
            ];

        group.remove(
            child
        );

        child.traverse(
            object => {

                if (
                    object.geometry
                ) {

                    object.geometry.dispose();

                }

                if (
                    object.material
                ) {

                    if (
                        object.material.map
                    ) {

                        object.material.map.dispose();

                    }

                    object.material.dispose();

                }

            }
        );

    }

}

/* =========================================================
   RENDER PLAYER HAND
   ========================================================= */

function renderPlayerHand() {

    if (!playerGroup) {

        return;

    }

    clearGroup(
        playerGroup
    );

    playerCardMeshes =
        [];

    const count =
        playerHand.length;

    if (count === 0) {

        return;

    }

    const spacing =
        Math.min(
            1.35,
            8.2 /
            Math.max(
                count,
                1
            )
        );

    playerHand.forEach(
        (card, index) => {

            const mesh =
                createCardMesh(
                    card,
                    true
                );

            const offset =
                (
                    index -
                    (count - 1) / 2
                ) *
                spacing;

            const selected =
                index ===
                selectedCardIndex;

            const hovered =
                index ===
                hoveredCardIndex;

            mesh.position.set(
                offset,
                selected
                    ? 0.95
                    : hovered
                        ? 0.72
                        : 0.55,
                5.4
            );

            mesh.rotation.x =
                -0.05;

            mesh.rotation.z =
                offset * -0.012;

            mesh.userData.handIndex =
                index;

            mesh.userData.owner =
                "PLAYER";

            playerGroup.add(
                mesh
            );

            playerCardMeshes.push(
                mesh
            );

        }
    );

}

/* =========================================================
   RENDER AI HAND
   ========================================================= */

function renderAIHand() {

    if (!aiGroup) {

        return;

    }

    clearGroup(
        aiGroup
    );

    aiCardMeshes =
        [];

    const count =
        aiHand.length;

    if (count === 0) {

        return;

    }

    const spacing =
        Math.min(
            1.15,
            7.5 /
            Math.max(
                count,
                1
            )
        );

    aiHand.forEach(
        (card, index) => {

            /*
               AI cards stay hidden.
            */

            const mesh =
                createCardMesh(
                    card,
                    false
                );

            const offset =
                (
                    index -
                    (count - 1) / 2
                ) *
                spacing;

            mesh.position.set(
                offset,
                0.5,
                -5.15
            );

            mesh.rotation.x =
                Math.PI +
                0.05;

            mesh.rotation.z =
                offset * 0.012;

            mesh.userData.handIndex =
                index;

            mesh.userData.owner =
                "AI";

            aiGroup.add(
                mesh
            );

            aiCardMeshes.push(
                mesh
            );

        }
    );

}

/* =========================================================
   RENDER DISCARD PILE
   ========================================================= */

function renderDiscardPile() {

    if (!discardGroup) {

        return;

    }

    clearGroup(
        discardGroup
    );

    const topCard =
        getTopCard();

    if (!topCard) {

        return;

    }

    const mesh =
        createCardMesh(
            topCard,
            true
        );

    mesh.position.set(
        1.75,
        0.55,
        0
    );

    mesh.rotation.x =
        0;

    mesh.rotation.z =
        0.015;

    discardGroup.add(
        mesh
    );

    /*
       Active colour ring.
    */

    const ringGeometry =
        new THREE.TorusGeometry(
            1.2,
            0.035,
            8,
            48
        );

    const ringMaterial =
        new THREE.MeshBasicMaterial({
            color:
                COLORS[
                    currentColor
                ] ||
                COLORS.WHITE
        });

    const ring =
        new THREE.Mesh(
            ringGeometry,
            ringMaterial
        );

    ring.rotation.x =
        Math.PI / 2;

    ring.position.set(
        1.75,
        0.29,
        0
    );

    discardGroup.add(
        ring
    );

}

/* =========================================================
   RENDER WHOLE 3D GAME
   ========================================================= */

function renderGame() {

    try {

        updateGameStatus();

        if (
            !renderer ||
            !scene ||
            !camera
        ) {

            initThreeArena();

        }

        if (
            !scene
        ) {

            return;

        }

        renderPlayerHand();

        renderAIHand();

        renderDiscardPile();

        updateHUD();

    } catch (error) {

        console.error(
            "renderGame error:",
            error
        );

    }

}

/* =========================================================
   HUD UPDATE
   ========================================================= */

function updateHUD() {

    const playerCount =
        document.getElementById(
            "playerCardCount"
        );

    const aiCount =
        document.getElementById(
            "aiCardCount"
        );

    const deckCount =
        document.getElementById(
            "deckCount"
        );

    if (playerCount) {

        playerCount.textContent =
            playerHand.length;

    }

    if (aiCount) {

        aiCount.textContent =
            aiHand.length;

    }

    if (deckCount) {

        deckCount.textContent =
            deck.length;

    }

    const modeElement =
        document.getElementById(
            "gameModeText"
        );

    if (modeElement) {

                    modeElement.textContent =
                gameMode;

        }

        const styleElement =
            document.getElementById(
                "cardStyleText"
            );

        if (styleElement) {

            styleElement.textContent =
                cardStyle;

        }

        const difficultyElement =
            document.getElementById(
                "difficultyText"
            );

        if (difficultyElement) {

            difficultyElement.textContent =
                difficulty;

        }

        const turnElement =
            document.getElementById(
                "turnText"
            );

        if (turnElement) {

            turnElement.textContent =
                currentTurn === "PLAYER"
                    ? "YOUR TURN"
                    : "ARSH'S TURN";

        }

        const colorElement =
            document.getElementById(
                "currentColor"
            );

        if (colorElement) {

            colorElement.textContent =
                currentColor ||
                "NONE";

            if (
                currentColor &&
                COLOR_HEX[currentColor]
            ) {

                colorElement.style.color =
                    COLOR_HEX[
                        currentColor
                    ];

            }

        }

        const statusElement =
            document.getElementById(
                "gameStatus"
            );

        if (statusElement) {

            statusElement.textContent =
                getGameStatusText();

        }

    }

/* =========================================================
   RESIZE ARENA
   ========================================================= */

function resizeArena() {

    if (
        !renderer ||
        !camera
    ) {

        return;

    }

    const container =
        renderer.domElement.parentElement;

    const width =
        container
            ? Math.max(
                container.clientWidth,
                1
            )
            : Math.max(
                window.innerWidth,
                1
            );

    const height =
        container
            ? Math.max(
                container.clientHeight,
                1
            )
            : Math.max(
                window.innerHeight,
                1
            );

    camera.aspect =
        width / height;

    camera.updateProjectionMatrix();

    renderer.setSize(
        width,
        height,
        false
    );

}

/* =========================================================
   POINTER POSITION
   ========================================================= */

function updatePointer(event) {

    if (
        !renderer ||
        !renderer.domElement
    ) {

        return;

    }

    const rect =
        renderer.domElement.getBoundingClientRect();

    if (
        !rect.width ||
        !rect.height
    ) {

        return;

    }

    pointer.x =
        (
            event.clientX -
            rect.left
        ) /
        rect.width *
        2 -
        1;

    pointer.y =
        -(
            (
                event.clientY -
                rect.top
            ) /
            rect.height
        ) *
        2 +
        1;

}

/* =========================================================
   FIND PLAYER CARD
   ========================================================= */

function getPlayerCardFromPointer(
    event
) {

    if (
        !raycaster ||
        !camera ||
        !renderer
    ) {

        return -1;

    }

    updatePointer(event);

    raycaster.setFromCamera(
        pointer,
        camera
    );

    const hits =
        raycaster.intersectObjects(
            playerCardMeshes,
            true
        );

    if (
        !hits.length
    ) {

        return -1;

    }

    let object =
        hits[0].object;

    while (
        object &&
        object.userData &&
        object.userData.handIndex ===
            undefined
    ) {

        object =
            object.parent;

    }

    if (
        object &&
        object.userData &&
        object.userData.handIndex !==
            undefined
    ) {

        return Number(
            object.userData.handIndex
        );

    }

    return -1;

}

/* =========================================================
   POINTER MOVE
   ========================================================= */

function handlePointerMove(
    event
) {

    if (
        !gameRunning ||
        gameOver
    ) {

        return;

    }

    const index =
        getPlayerCardFromPointer(
            event
        );

    if (
        index !== hoveredCardIndex
    ) {

        hoveredCardIndex =
            index;

        renderGame();

    }

}

/* =========================================================
   POINTER DOWN
   ========================================================= */

function handlePointerDown(
    event
) {

    if (
        !gameRunning ||
        gameOver
    ) {

        return;

    }

    const index =
        getPlayerCardFromPointer(
            event
        );

    if (
        index < 0
    ) {

        return;

    }

    selectedCardIndex =
        index;

    const card =
        playerHand[index];

    if (!card) {

        return;

    }

    /*
       Wild card.
    */

    if (
        card.type === "wild" ||
        card.type === "wild4"
    ) {

        const chosenColor =
            window.prompt(
                "Choose colour: RED, BLUE, GREEN or YELLOW"
            );

        if (!chosenColor) {

            renderGame();

            return;

        }

        const color =
            safeUpper(
                chosenColor,
                ""
            );

        if (
            !COLOR_NAMES.includes(
                color
            )
        ) {

            notifyGame(
                "Invalid colour."
            );

            return;

        }

        if (
            playPlayerCard(index)
        ) {

            playerChooseColor(
                color
            );

        }

        return;

    }

    /*
       Normal card.
    */

    playPlayerCard(
        index
    );

}

/* =========================================================
   BIND ARENA EVENTS
   ========================================================= */

function bindArenaEvents() {

    if (
        !renderer ||
        !renderer.domElement
    ) {

        return;

    }

    renderer.domElement.addEventListener(
        "pointermove",
        handlePointerMove
    );

    renderer.domElement.addEventListener(
        "pointerdown",
        handlePointerDown
    );

}

/* =========================================================
   BUTTON BINDING
   ========================================================= */

function bindGameButtons() {

    const startButtons =
        document.querySelectorAll(
            "#startGame, #startBtn, #playGame, .start-game"
        );

    startButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    startGame();

                }
            );

        }
    );

    const restartButtons =
        document.querySelectorAll(
            "#restartGame, #restartBtn, .restart-game"
        );

    restartButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    restartGame();

                }
            );

        }
    );

    const drawButtons =
        document.querySelectorAll(
            "#drawCard, #drawBtn, .draw-card"
        );

    drawButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    playerDrawCard();

                }
            );

        }
    );

    const unoButtons =
        document.querySelectorAll(
            "#unoButton, #unoBtn, .uno-button"
        );

    unoButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    callPlayerUNO();

                }
            );

        }
    );

    const colorButtons =
        document.querySelectorAll(
            "[data-color]"
        );

    colorButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    const color =
                        safeUpper(
                            button.dataset.color,
                            ""
                        );

                    playerChooseColor(
                        color
                    );

                }
            );

        }
    );

}

/* =========================================================
   ANIMATION LOOP
   ========================================================= */

function startArenaAnimation() {

    if (
        animationFrame
    ) {

        return;

    }

    function animate(
        time
    ) {

        animationFrame =
            requestAnimationFrame(
                animate
            );

        const delta =
            lastRenderTime
                ? (
                    time -
                    lastRenderTime
                ) / 1000
                : 0;

        lastRenderTime =
            time;

        arenaClock +=
            Math.min(
                delta,
                0.05
            );

        if (
            tableRim
        ) {

            tableRim.rotation.z =
                Math.sin(
                    arenaClock * 0.45
                ) *
                0.01;

        }

        if (
            deckGroup
        ) {

            deckGroup.rotation.y =
                Math.sin(
                    arenaClock * 0.35
                ) *
                0.015;

        }

        playerCardMeshes.forEach(
            (
                mesh,
                index
            ) => {

                const selected =
                    index ===
                    selectedCardIndex;

                const hovered =
                    index ===
                    hoveredCardIndex;

                const targetY =
                    selected
                        ? 0.95
                        : hovered
                            ? 0.72
                            : 0.55;

                mesh.position.y +=
                    (
                        targetY -
                        mesh.position.y
                    ) *
                    0.12;

            }
        );

        if (
            renderer &&
            scene &&
            camera
        ) {

            renderer.render(
                scene,
                camera
            );

        }

    }

    animationFrame =
        requestAnimationFrame(
            animate
        );

}

/* =========================================================
   DOM READY
   ========================================================= */

function initializeArenaGame() {

    try {

        getSelectedGameSettings();

        if (
            !initThreeArena()
        ) {

            return;

        }

        bindArenaEvents();

        bindGameButtons();

        updateHUD();

        renderGame();

        console.log(
            "%cARSH CARD ARENA — 3D ENGINE READY",
            "color:#ffd54a;font-size:18px;font-weight:bold"
        );

    } catch (error) {

        console.error(
            "Arena initialization error:",
            error
        );

    }

}

/* =========================================================
   RESIZE
   ========================================================= */

window.addEventListener(
    "resize",
    resizeArena
);

/* =========================================================
   START WHEN HTML IS READY
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeArenaGame,
        {
            once: true
        }
    );

} else {

    initializeArenaGame();

}

/* =========================================================
   PUBLIC 3D API
   ========================================================= */

window.Arena3D = {

    init:
        initThreeArena,

    render:
        renderGame,

    resize:
        resizeArena

};

/* =========================================================
   FINAL READY
   ========================================================= */

console.log(
    "%cARSH CARD ARENA — GAME.JS COMPLETE",
    "color:#16d98a;font-size:20px;font-weight:bold"
);
