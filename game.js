/* =========================================================
UNO 3D ULTIMATE — GAME.JS
PART 1/4 — CORE ENGINE + GAME STATE
========================================================= */

const Game = {
started: false,
paused: false,

player: {
name: "PLAYER",
hand: [],
score: 0
},

bot: {
name: "CPU",
hand: [],
score: 0
},

deck: [],
discard: [],

currentColor: null,
currentPlayer: "player",
direction: 1,

turn: 0,
winner: null,

settings: {
sound: true,
music: true,
difficulty: "normal"
}
};

/* =========================================================
UNO CARD DATA
========================================================= */

const COLORS = ["red", "yellow", "green", "blue"];

const COLOR_HEX = {
red: "#ff1744",
yellow: "#ffd600",
green: "#00e676",
blue: "#2979ff",
wild: "#111827"
};

const NUMBERS = [
"0", "1", "2", "3", "4",
"5", "6", "7", "8", "9"
];

const ACTIONS = [
"skip",
"reverse",
"draw2"
];

const WILD_CARDS = [
"wild",
"wild4"
];

/* =========================================================
CARD CREATOR
========================================================= */

function createCard(color, value) {
return {
id:
Date.now().toString(36) +
Math.random().toString(36).slice(2),

color: color,
value: value,

playable: true

};
}

/* =========================================================
CREATE UNO DECK
========================================================= */

function createDeck() {

const deck = [];

COLORS.forEach(color => {

// One zero card
deck.push(createCard(color, "0"));

// Two of every 1-9
for (let n = 1; n <= 9; n++) {
  deck.push(createCard(color, String(n)));
  deck.push(createCard(color, String(n)));
}

// Two action cards
ACTIONS.forEach(action => {
  deck.push(createCard(color, action));
  deck.push(createCard(color, action));
});

});

// Four Wild
for (let i = 0; i < 4; i++) {
deck.push(createCard("wild", "wild"));
}

// Four Wild Draw Four
for (let i = 0; i < 4; i++) {
deck.push(createCard("wild", "wild4"));
}

return deck;
}

/* =========================================================
SHUFFLE
========================================================= */

function shuffle(array) {

for (let i = array.length - 1; i > 0; i--) {

const j = Math.floor(Math.random() * (i + 1));

[array[i], array[j]] =
  [array[j], array[i]];

}

return array;
}

/* =========================================================
START NEW GAME
========================================================= */

function startGame(playerName = "PLAYER") {

Game.started = true;
Game.paused = false;
Game.winner = null;

Game.player.name =
playerName.trim() || "PLAYER";

Game.player.hand = [];
Game.bot.hand = [];

Game.player.score = 0;
Game.bot.score = 0;

Game.deck = shuffle(createDeck());
Game.discard = [];

Game.currentPlayer = "player";
Game.direction = 1;
Game.turn = 0;

// Deal 7 cards to player
for (let i = 0; i < 7; i++) {
drawCard("player", false);
}

// Deal 7 cards to CPU
for (let i = 0; i < 7; i++) {
drawCard("bot", false);
}

// First discard card
let firstCard;

do {
firstCard = Game.deck.pop();
} while (
firstCard &&
firstCard.color === "wild"
);

Game.discard.push(firstCard);

Game.currentColor = firstCard.color;

updateUI();

console.log("UNO GAME STARTED");
}

/* =========================================================
DRAW CARD
========================================================= */

function drawCard(who = "player", update = true) {

if (Game.deck.length === 0) {
reshuffleDeck();
}

const card = Game.deck.pop();

if (!card) return null;

if (who === "player") {
Game.player.hand.push(card);
} else {
Game.bot.hand.push(card);
}

if (update) {
updateUI();
}

return card;
}

/* =========================================================
RESHUFFLE DISCARD PILE
========================================================= */

function reshuffleDeck() {

if (Game.discard.length <= 1) {
return;
}

const top =
Game.discard.pop();

Game.deck =
shuffle(Game.discard);

Game.discard = [top];

console.log("Deck reshuffled");
}

/* =========================================================
GET TOP CARD
========================================================= */

function getTopCard() {

if (Game.discard.length === 0) {
return null;
}

return Game.discard[
Game.discard.length - 1
];
}

/* =========================================================
CARD PLAYABILITY
========================================================= */

function canPlayCard(card) {

if (!card) return false;

const top = getTopCard();

if (!top) return true;

// Wild card
if (card.color === "wild") {
return true;
}

// Same color
if (card.color === Game.currentColor) {
return true;
}

// Same value
if (card.value === top.value) {
return true;
}

return false;
}

/* =========================================================
PLAY PLAYER CARD
========================================================= */

function playPlayerCard(index) {

if (!Game.started) return;

if (Game.paused) return;

if (Game.currentPlayer !== "player") {
return;
}

const card =
Game.player.hand[index];

if (!card) return;

if (!canPlayCard(card)) {

showMessage(
  "You cannot play this card!"
);

return;

}

Game.player.hand.splice(index, 1);

playCard(card);

if (Game.player.hand.length === 0) {
endGame("player");
return;
}

if (card.color === "wild") {

chooseWildColor();

return;

}

applyCardEffect(card);

}

/* =========================================================
PLAY CARD INTO DISCARD
========================================================= */

function playCard(card) {

Game.discard.push(card);

if (card.color !== "wild") {
Game.currentColor = card.color;
}

Game.turn++;

updateUI();
}

/* =========================================================
APPLY SPECIAL CARD EFFECT
========================================================= */

function applyCardEffect(card) {

switch (card.value) {

case "skip":

  switchTurn();

  switchTurn();

  break;


case "reverse":

  Game.direction *= -1;

  switchTurn();

  break;


case "draw2":

  switchTurn();

  drawCard(
    Game.currentPlayer,
    false
  );

  drawCard(
    Game.currentPlayer,
    false
  );

  switchTurn();

  break;


default:

  switchTurn();

  break;

}

updateUI();

if (Game.currentPlayer === "bot") {
setTimeout(botTurn, 700);
}
}

/* =========================================================
WILD COLOR
========================================================= */

function chooseWildColor() {

const choice =
prompt(
"Choose color:\n1 = Red\n2 = Yellow\n3 = Green\n4 = Blue"
);

const colors = [
"red",
"yellow",
"green",
"blue"
];

const selected =
colors[
Number(choice) - 1
];

Game.currentColor =
selected || "red";

const last =
getTopCard();

if (
last &&
last.value === "wild4"
) {

switchTurn();

drawCard(
  Game.currentPlayer,
  false
);

drawCard(
  Game.currentPlayer,
  false
);

drawCard(
  Game.currentPlayer,
  false
);

drawCard(
  Game.currentPlayer,
  false
);

switchTurn();

} else {

switchTurn();

}

updateUI();

if (Game.currentPlayer === "bot") {
setTimeout(botTurn, 800);
}
}

/* =========================================================
SWITCH TURN
========================================================= */

function switchTurn() {

Game.currentPlayer =
Game.currentPlayer === "player"
? "bot"
: "player";
}

/* =========================================================
END GAME
========================================================= */

function endGame(winner) {

Game.winner = winner;
Game.started = false;

let message;

if (winner === "player") {

message =
  "🎉 YOU WIN!";

} else {

message =
  "💀 CPU WINS!";

}

showMessage(message);

updateUI();
}

/* =========================================================
MESSAGE SYSTEM
========================================================= */

function showMessage(message) {

console.log(message);

const elements = [
document.getElementById("gameMessage"),
document.getElementById("message"),
document.getElementById("status")
];

for (const el of elements) {

if (el) {

  el.textContent = message;

  el.classList.add("show");

  setTimeout(() => {
    el.classList.remove("show");
  }, 1800);

  break;
}

}
}

/* =========================================================
BASIC UI UPDATE
========================================================= */

function updateUI() {

if (
typeof renderGame === "function"
) {
renderGame();
}

if (
typeof renderPlayerHand === "function"
) {
renderPlayerHand();
}

if (
typeof renderBotHand === "function"
) {
renderBotHand();
}

if (
typeof updateScores === "function"
) {
updateScores();
}

if (
typeof updateTurnUI === "function"
) {
updateTurnUI();
}
}

/* =========================================================
AUTO START HOOK
========================================================= */

document.addEventListener(
"DOMContentLoaded",
() => {

console.log(
  "UNO 3D Engine Loaded — Part 1"
);

if (
  typeof initGame === "function"
) {
  initGame();
}

}
);
/* =========================================================
UNO 3D ULTIMATE — GAME.JS
PART 2/4 — CPU + GAME LOGIC + CARD HELPERS
========================================================= */

/* =========================================================
CPU TURN
========================================================= */

function botTurn() {

if (!Game.started) return;

if (Game.paused) return;

if (Game.currentPlayer !== "bot") {
return;
}

showMessage("🤖 CPU is thinking...");

setTimeout(() => {

if (!Game.started) return;

const hand = Game.bot.hand;

// Find playable cards
const playable = [];

for (let i = 0; i < hand.length; i++) {

  if (canPlayCard(hand[i])) {
    playable.push(i);
  }
}

// CPU has no playable card
if (playable.length === 0) {

  const card = drawCard(
    "bot",
    false
  );

  updateUI();

  // Drawn card can immediately be played
  if (
    card &&
    canPlayCard(card)
  ) {

    setTimeout(() => {

      playBotCard(
        Game.bot.hand.indexOf(card)
      );

    }, 500);

  } else {

    switchTurn();

    updateUI();

  }

  return;
}

// Choose a card
const index =
  chooseBotCard(playable);

playBotCard(index);

}, 600);
}

/* =========================================================
CPU CARD SELECTION
========================================================= */

function chooseBotCard(playableIndexes) {

const hand = Game.bot.hand;

// Prefer Wild Draw Four
for (const index of playableIndexes) {

if (
  hand[index] &&
  hand[index].value === "wild4"
) {

  return index;
}

}

// Then normal Wild
for (const index of playableIndexes) {

if (
  hand[index] &&
  hand[index].value === "wild"
) {

  return index;
}

}

// Prefer action cards
for (const index of playableIndexes) {

const card = hand[index];

if (
  card &&
  (
    card.value === "draw2" ||
    card.value === "skip" ||
    card.value === "reverse"
  )
) {

  return index;
}

}

// Otherwise random playable card
return playableIndexes[
Math.floor(
Math.random() *
playableIndexes.length
)
];
}

/* =========================================================
CPU PLAY CARD
========================================================= */

function playBotCard(index) {

if (!Game.started) return;

const card =
Game.bot.hand[index];

if (!card) return;

if (!canPlayCard(card)) {
return;
}

Game.bot.hand.splice(
index,
1
);

playCard(card);

showMessage(
"🤖 CPU played " +
getCardDisplayName(card)
);

updateUI();

// CPU wins
if (Game.bot.hand.length === 0) {

endGame("bot");

return;

}

// Wild
if (card.color === "wild") {

botChooseWildColor();

return;

}

applyCardEffect(card);
}

/* =========================================================
CPU WILD COLOR
========================================================= */

function botChooseWildColor() {

const counts = {
red: 0,
yellow: 0,
green: 0,
blue: 0
};

// Count colors in CPU hand
Game.bot.hand.forEach(card => {

if (
  counts[card.color] !== undefined
) {

  counts[card.color]++;
}

});

let bestColor = "red";
let highest = -1;

COLORS.forEach(color => {

if (counts[color] > highest) {

  highest =
    counts[color];

  bestColor = color;
}

});

Game.currentColor =
bestColor;

showMessage(
"🤖 CPU chose " +
bestColor.toUpperCase()
);

const last =
getTopCard();

if (
last &&
last.value === "wild4"
) {

switchTurn();

for (let i = 0; i < 4; i++) {

  drawCard(
    Game.currentPlayer,
    false
  );
}

switchTurn();

} else {

switchTurn();

}

updateUI();
}

/* =========================================================
UNO BUTTON
========================================================= */

function callUNO() {

if (!Game.started) return;

if (
Game.currentPlayer !== "player"
) {
return;
}

if (
Game.player.hand.length === 1
) {

showMessage("🔥 UNO!");

Game.player.uno = true;

return;

}

showMessage(
"You can only call UNO with 1 card!"
);
}

/* =========================================================
DRAW BUTTON
========================================================= */

function playerDraw() {

if (!Game.started) return;

if (Game.paused) return;

if (
Game.currentPlayer !== "player"
) {

showMessage(
  "Wait for your turn!"
);

return;

}

const card =
drawCard(
"player",
false
);

updateUI();

if (!card) return;

// Automatically play if possible
if (canPlayCard(card)) {

showMessage(
  "Card drawn: " +
  getCardDisplayName(card)
);

} else {

showMessage(
  "You drew a card."
);

switchTurn();

updateUI();

if (
  Game.currentPlayer === "bot"
) {

  setTimeout(
    botTurn,
    700
  );
}

}
}

/* =========================================================
PAUSE GAME
========================================================= */

function togglePause() {

if (!Game.started) return;

Game.paused =
!Game.paused;

updateUI();

showMessage(
Game.paused
? "⏸ GAME PAUSED"
: "▶ GAME RESUMED"
);
}

/* =========================================================
RESET GAME
========================================================= */

function resetGame() {

Game.started = false;
Game.paused = false;

Game.deck = [];
Game.discard = [];

Game.player.hand = [];
Game.bot.hand = [];

Game.currentColor = null;
Game.currentPlayer = "player";

Game.winner = null;
Game.turn = 0;

updateUI();

console.log(
"UNO game reset"
);
}

/* =========================================================
CARD DISPLAY NAME
========================================================= */

function getCardDisplayName(card) {

if (!card) {
return "";
}

const names = {
skip: "SKIP",
reverse: "REVERSE",
draw2: "DRAW +2",
wild: "WILD",
wild4: "WILD +4"
};

return (
names[card.value] ||
card.value
);
}

/* =========================================================
CARD SYMBOL
========================================================= */

function getCardSymbol(card) {

if (!card) {
return "";
}

const symbols = {

skip: "⊘",

reverse: "↻",

draw2: "+2",

wild: "★",

wild4: "+4"

};

return (
symbols[card.value] ||
card.value
);
}

/* =========================================================
CARD COLOR
========================================================= */

function getCardColor(card) {

if (!card) {
return "#111827";
}

return (
COLOR_HEX[card.color] ||
"#111827"
);
}

/* =========================================================
GET PLAYER PLAYABLE CARDS
========================================================= */

function getPlayablePlayerCards() {

const result = [];

Game.player.hand.forEach(
(card, index) => {

  if (
    canPlayCard(card)
  ) {

    result.push(index);
  }
}

);

return result;
}

/* =========================================================
GET CPU PLAYABLE CARDS
========================================================= */

function getPlayableBotCards() {

const result = [];

Game.bot.hand.forEach(
(card, index) => {

  if (
    canPlayCard(card)
  ) {

    result.push(index);
  }
}

);

return result;
}

/* =========================================================
SCORE CALCULATION
========================================================= */

function getCardPoints(card) {

if (!card) return 0;

if (
card.value === "wild" ||
card.value === "wild4"
) {

return 50;

}

if (
card.value === "skip" ||
card.value === "reverse" ||
card.value === "draw2"
) {

return 20;

}

const number =
Number(card.value);

if (!Number.isNaN(number)) {
return number;
}

return 0;
}

function calculateHandScore(hand) {

if (!Array.isArray(hand)) {
return 0;
}

return hand.reduce(
(total, card) =>
total + getCardPoints(card),
0
);
}

/* =========================================================
UPDATE SCORE
========================================================= */

function updateScores() {

Game.player.currentScore =
calculateHandScore(
Game.player.hand
);

Game.bot.currentScore =
calculateHandScore(
Game.bot.hand
);

const playerScore =
document.getElementById(
"playerScore"
);

const botScore =
document.getElementById(
"botScore"
);

if (playerScore) {

playerScore.textContent =
  Game.player.currentScore;

}

if (botScore) {

botScore.textContent =
  Game.bot.currentScore;

}
}

/* =========================================================
TURN UI
========================================================= */

function updateTurnUI() {

const turnElement =
document.getElementById(
"turn"
);

if (!turnElement) return;

if (
Game.currentPlayer ===
"player"
) {

turnElement.textContent =
  "YOUR TURN";

} else {

turnElement.textContent =
  "CPU TURN";

}
}

/* =========================================================
CURRENT COLOR UI
========================================================= */

function updateColorUI() {

const colorElement =
document.getElementById(
"currentColor"
);

if (!colorElement) return;

colorElement.textContent =
Game.currentColor
? Game.currentColor.toUpperCase()
: "-";

colorElement.style.color =
getColorTextColor(
Game.currentColor
);
}

/* =========================================================
COLOR TEXT
========================================================= */

function getColorTextColor(color) {

return (
COLOR_HEX[color] ||
"#ffffff"
);
}

/* =========================================================
GAME INFORMATION
========================================================= */

function getGameInfo() {

return {

started:
  Game.started,

paused:
  Game.paused,

playerCards:
  Game.player.hand.length,

botCards:
  Game.bot.hand.length,

deckCards:
  Game.deck.length,

discardCards:
  Game.discard.length,

currentColor:
  Game.currentColor,

currentPlayer:
  Game.currentPlayer,

turn:
  Game.turn

};
}

/* =========================================================
DEBUG COMMAND
========================================================= */

window.UNO_DEBUG = {

game: Game,

start: startGame,

draw: playerDraw,

callUNO: callUNO,

pause: togglePause,

reset: resetGame,

info: getGameInfo
};

console.log(
"UNO 3D Engine Loaded — Part 2"
);
/* =========================================================
UNO 3D ULTIMATE — GAME.JS
PART 3/4 — 3D CARD RENDERING + UI + ANIMATIONS
========================================================= */

/* =========================================================
DOM HELPERS
========================================================= */

function $(id) {
return document.getElementById(id);
}

function createElement(tag, className = "") {

const element =
document.createElement(tag);

if (className) {
element.className = className;
}

return element;
}

/* =========================================================
RENDER COMPLETE GAME
========================================================= */

function renderGame() {

renderPlayerHand();

renderBotHand();

renderDiscard();

renderDeck();

updateScores();

updateTurnUI();

updateColorUI();

updateGameCounters();
}

/* =========================================================
PLAYER HAND
========================================================= */

function renderPlayerHand() {

const container =
$("playerHand") ||
$("playerCards") ||
$("hand");

if (!container) return;

container.innerHTML = "";

Game.player.hand.forEach(
(card, index) => {

  const cardElement =
    createCardElement(
      card,
      false,
      index
    );

  container.appendChild(
    cardElement
  );
}

);
}

/* =========================================================
BOT HAND
========================================================= */

function renderBotHand() {

const container =
$("botHand") ||
$("botCards") ||
$("opponentHand");

if (!container) return;

container.innerHTML = "";

Game.bot.hand.forEach(
(card, index) => {

  const cardElement =
    createHiddenCardElement(
      index
    );

  container.appendChild(
    cardElement
  );
}

);
}

/* =========================================================
CREATE PLAYER CARD
========================================================= */

function createCardElement(
card,
hidden = false,
index = -1
) {

const cardElement =
createElement(
"div",
"uno-card"
);

if (!card) {
return cardElement;
}

cardElement.dataset.color =
card.color;

cardElement.dataset.value =
card.value;

cardElement.dataset.index =
index;

cardElement.style.setProperty(
"--card-color",
getCardColor(card)
);

if (
canPlayCard(card) &&
Game.currentPlayer === "player" &&
Game.started
) {

cardElement.classList.add(
  "playable"
);

cardElement.addEventListener(
  "click",
  () => {

    playPlayerCard(index);

  }
);

} else {

cardElement.classList.add(
  "not-playable"
);

}

/* Card inner */

const inner =
createElement(
"div",
"card-inner"
);

/* Corner */

const topLeft =
createElement(
"div",
"card-corner top-left"
);

topLeft.textContent =
getCardSymbol(card);

/* Center */

const center =
createElement(
"div",
"card-center"
);

center.textContent =
getCardSymbol(card);

/* Bottom corner */

const bottomRight =
createElement(
"div",
"card-corner bottom-right"
);

bottomRight.textContent =
getCardSymbol(card);

inner.appendChild(
topLeft
);

inner.appendChild(
center
);

inner.appendChild(
bottomRight
);

cardElement.appendChild(
inner
);

/* Hover animation */

cardElement.addEventListener(
"mouseenter",
() => {

  if (
    cardElement.classList.contains(
      "playable"
    )
  ) {

    cardElement.style.transform =
      "translateY(-25px) rotateX(8deg) scale(1.08)";
  }

}

);

cardElement.addEventListener(
"mouseleave",
() => {

  cardElement.style.transform =
    "";
}

);

return cardElement;
}

/* =========================================================
CREATE HIDDEN CPU CARD
========================================================= */

function createHiddenCardElement(
index
) {

const card =
createElement(
"div",
"uno-card hidden-card"
);

card.dataset.index =
index;

const inner =
createElement(
"div",
"card-back"
);

const logo =
createElement(
"div",
"card-back-logo"
);

logo.textContent =
"UNO";

inner.appendChild(
logo
);

card.appendChild(
inner
);

return card;
}

/* =========================================================
DISCARD PILE
========================================================= */

function renderDiscard() {

const container =
$("discardPile") ||
$("discard") ||
$("centerCard");

if (!container) return;

container.innerHTML = "";

const top =
getTopCard();

if (!top) return;

const cardElement =
createCardElement(
top,
false,
-1
);

cardElement.classList.add(
"discard-card"
);

cardElement.classList.remove(
"playable"
);

container.appendChild(
cardElement
);
}

/* =========================================================
DECK RENDER
========================================================= */

function renderDeck() {

const container =
$("deck") ||
$("drawPile");

if (!container) return;

container.innerHTML = "";

const deckCard =
createElement(
"div",
"uno-card hidden-card deck-card"
);

const back =
createElement(
"div",
"card-back"
);

const logo =
createElement(
"div",
"card-back-logo"
);

logo.textContent =
"UNO";

back.appendChild(
logo
);

deckCard.appendChild(
back
);

deckCard.addEventListener(
"click",
() => {

  playerDraw();

}

);

container.appendChild(
deckCard
);
}

/* =========================================================
GAME COUNTERS
========================================================= */

function updateGameCounters() {

const deckCount =
$("deckCount");

const playerCount =
$("playerCardCount");

const botCount =
$("botCardCount");

const turnCount =
$("turnCount");

if (deckCount) {

deckCount.textContent =
  Game.deck.length;

}

if (playerCount) {

playerCount.textContent =
  Game.player.hand.length;

}

if (botCount) {

botCount.textContent =
  Game.bot.hand.length;

}

if (turnCount) {

turnCount.textContent =
  Game.turn;

}
}

/* =========================================================
CARD PLAY ANIMATION
========================================================= */

function animateCardPlay(
card,
fromPlayer = true
) {

const animation =
createElement(
"div",
"card-fly-animation"
);

animation.style.setProperty(
"--card-color",
getCardColor(card)
);

animation.textContent =
getCardSymbol(card);

document.body.appendChild(
animation
);

if (fromPlayer) {

animation.classList.add(
  "from-player"
);

} else {

animation.classList.add(
  "from-bot"
);

}

setTimeout(() => {

animation.remove();

}, 700);
}

/* =========================================================
SCREEN EFFECT
========================================================= */

function screenShake(
strength = 8,
duration = 300
) {

const body =
document.body;

body.style.setProperty(
"--shake-strength",
strength + "px"
);

body.classList.add(
"screen-shake"
);

setTimeout(() => {

body.classList.remove(
  "screen-shake"
);

}, duration);
}

/* =========================================================
FLASH EFFECT
========================================================= */

function screenFlash(
color = "white"
) {

const flash =
createElement(
"div",
"screen-flash"
);

flash.style.background =
color;

document.body.appendChild(
flash
);

requestAnimationFrame(() => {

flash.classList.add(
  "active"
);

});

setTimeout(() => {

flash.remove();

}, 400);
}

/* =========================================================
SPECIAL CARD EFFECT
========================================================= */

function specialCardEffect(
card
) {

if (!card) return;

if (
card.value === "draw2"
) {

screenShake(
  5,
  250
);

}

if (
card.value === "wild4"
) {

screenShake(
  12,
  450
);

screenFlash(
  "rgba(255,255,255,.8)"
);

}

if (
card.value === "skip"
) {

screenFlash(
  "rgba(255,255,255,.35)"
);

}

if (
card.value === "reverse"
) {

screenShake(
  4,
  250
);

}
}

/* =========================================================
ENHANCED PLAY PLAYER CARD
========================================================= */

const originalPlayPlayerCard =
playPlayerCard;

playPlayerCard =
function(index) {

if (!Game.started) return;

const card =
  Game.player.hand[index];

if (!card) return;

if (
  !canPlayCard(card)
) {

  showMessage(
    "❌ You cannot play this card!"
  );

  screenShake(
    3,
    180
  );

  return;
}

animateCardPlay(
  card,
  true
);

specialCardEffect(
  card
);

originalPlayPlayerCard(
  index
);

};

/* =========================================================
ENHANCED CPU PLAY
========================================================= */

const originalPlayBotCard =
playBotCard;

playBotCard =
function(index) {

const card =
  Game.bot.hand[index];

if (!card) return;

animateCardPlay(
  card,
  false
);

specialCardEffect(
  card
);

originalPlayBotCard(
  index
);

};

/* =========================================================
WIN SCREEN
========================================================= */

function showWinnerScreen(
winner
) {

let overlay =
$("winnerScreen");

if (!overlay) {

overlay =
  createElement(
    "div",
    "winner-screen"
  );

overlay.id =
  "winnerScreen";

document.body.appendChild(
  overlay
);

}

overlay.innerHTML = "";

const box =
createElement(
"div",
"winner-box"
);

const title =
createElement(
"div",
"winner-title"
);

if (winner === "player") {

title.textContent =
  "🎉 YOU WIN!";

} else {

title.textContent =
  "🤖 CPU WINS!";

}

const score =
createElement(
"div",
"winner-score"
);

score.textContent =
"Your cards: " +
Game.player.hand.length +
"  •  CPU cards: " +
Game.bot.hand.length;

const button =
createElement(
"button",
"winner-button"
);

button.textContent =
"PLAY AGAIN";

button.addEventListener(
"click",
() => {

  overlay.remove();

  startGame(
    Game.player.name
  );

}

);

box.appendChild(
title
);

box.appendChild(
score
);

box.appendChild(
button
);

overlay.appendChild(
box
);

requestAnimationFrame(() => {

overlay.classList.add(
  "visible"
);

});
}

/* =========================================================
ENHANCED END GAME
========================================================= */

const originalEndGame =
endGame;

endGame =
function(winner) {

originalEndGame(
  winner
);

setTimeout(() => {

  showWinnerScreen(
    winner
  );

}, 300);

};

/* =========================================================
COLOR INDICATOR
========================================================= */

function createColorIndicator() {

let indicator =
$("colorIndicator");

if (!indicator) {

indicator =
  createElement(
    "div",
    "color-indicator"
  );

indicator.id =
  "colorIndicator";

document.body.appendChild(
  indicator
);

}

indicator.style.background =
getColorTextColor(
Game.currentColor
);

indicator.textContent =
Game.currentColor
? Game.currentColor.toUpperCase()
: "COLOR";
}

/* =========================================================
ENHANCED UI UPDATE
========================================================= */

const originalUpdateUI =
updateUI;

updateUI =
function() {

originalUpdateUI();

createColorIndicator();

};

/* =========================================================
START SCREEN CONNECTOR
========================================================= */

function initGame() {

console.log(
"Initializing UNO 3D..."
);

const startButtons =
document.querySelectorAll(
"#startGame, #startBtn, .start-game, .start-button"
);

startButtons.forEach(
button => {

  button.addEventListener(
    "click",
    () => {

      const nameInput =
        $("playerName") ||
        $("nameInput") ||
        $("username");

      const name =
        nameInput
          ? nameInput.value
          : "PLAYER";

      startGame(
        name
      );

    }
  );

}

);

const drawButtons =
document.querySelectorAll(
"#drawBtn, #drawCard, .draw-button"
);

drawButtons.forEach(
button => {

  button.addEventListener(
    "click",
    playerDraw
  );

}

);

const pauseButtons =
document.querySelectorAll(
"#pauseBtn, #pauseGame, .pause-button"
);

pauseButtons.forEach(
button => {

  button.addEventListener(
    "click",
    togglePause
  );

}

);

const unoButtons =
document.querySelectorAll(
"#unoBtn, #unoButton, .uno-button"
);

unoButtons.forEach(
button => {

  button.addEventListener(
    "click",
    callUNO
  );

}

);

renderGame();

console.log(
"UNO 3D initialized"
);
}

/* =========================================================
INITIAL UI BOOT
========================================================= */

document.addEventListener(
"DOMContentLoaded",
() => {

setTimeout(() => {

  renderGame();

}, 100);

}
);

console.log(
"UNO 3D Engine Loaded — Part 3"
);
/* =========================================================
UNO 3D ULTIMATE — GAME.JS
PART 4/4 — FINAL CONTROLS + AUDIO + POLISH
========================================================= */

/* =========================================================
AUDIO SYSTEM
========================================================= */

const AudioSystem = {

ctx: null,

init() {

if (this.ctx) return;

try {

  this.ctx =
    new (
      window.AudioContext ||
      window.webkitAudioContext
    )();

} catch (error) {

  console.log(
    "Audio not supported"
  );

}

},

beep(
frequency = 440,
duration = 0.08,
type = "sine",
volume = 0.04
) {

if (!Game.settings.sound) {
  return;
}

this.init();

if (!this.ctx) return;

try {

  const oscillator =
    this.ctx.createOscillator();

  const gain =
    this.ctx.createGain();

  oscillator.type =
    type;

  oscillator.frequency.value =
    frequency;

  gain.gain.value =
    volume;

  oscillator.connect(
    gain
  );

  gain.connect(
    this.ctx.destination
  );

  oscillator.start();

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    this.ctx.currentTime +
    duration
  );

  oscillator.stop(
    this.ctx.currentTime +
    duration
  );

} catch (error) {

  console.log(
    "Audio error"
  );
}

},

card() {

this.beep(
  520,
  0.07,
  "triangle",
  0.035
);

},

click() {

this.beep(
  700,
  0.05,
  "sine",
  0.03
);

},

win() {

this.beep(
  523,
  0.12,
  "triangle",
  0.05
);

setTimeout(
  () => this.beep(
    659,
    0.12,
    "triangle",
    0.05
  ),
  120
);

setTimeout(
  () => this.beep(
    784,
    0.2,
    "triangle",
    0.05
  ),
  240
);

},

lose() {

this.beep(
  300,
  0.15,
  "sawtooth",
  0.04
);

setTimeout(
  () => this.beep(
    180,
    0.25,
    "sawtooth",
    0.04
  ),
  150
);

}

};

/* =========================================================
CLICK AUDIO
========================================================= */

document.addEventListener(
"click",
() => {

AudioSystem.click();

},
{
passive: true
}
);

/* =========================================================
CARD AUDIO WRAPPER
========================================================= */

const oldPlayPlayerCard =
playPlayerCard;

playPlayerCard =
function(index) {

const card =
  Game.player.hand[index];

if (
  card &&
  canPlayCard(card)
) {

  AudioSystem.card();

}

oldPlayPlayerCard(
  index
);

};

/* =========================================================
WIN / LOSE AUDIO
========================================================= */

const oldWinnerScreen =
showWinnerScreen;

showWinnerScreen =
function(winner) {

if (winner === "player") {

  AudioSystem.win();

} else {

  AudioSystem.lose();

}

oldWinnerScreen(
  winner
);

};

/* =========================================================
KEYBOARD CONTROLS
========================================================= */

document.addEventListener(
"keydown",
event => {

if (!Game.started) {
  return;
}


// P = pause
if (
  event.key.toLowerCase() === "p"
) {

  togglePause();

  return;
}


// D = draw
if (
  event.key.toLowerCase() === "d"
) {

  playerDraw();

  return;
}


// U = UNO
if (
  event.key.toLowerCase() === "u"
) {

  callUNO();

  return;
}


// Escape = pause
if (
  event.key === "Escape"
) {

  togglePause();

  return;
}

}
);

/* =========================================================
TOUCH FEEDBACK
========================================================= */

document.addEventListener(
"touchstart",
event => {

const target =
  event.target;

if (
  target &&
  (
    target.closest(
      "button"
    ) ||
    target.closest(
      ".uno-card"
    )
  )
) {

  target.classList.add(
    "touch-active"
  );

  setTimeout(() => {

    target.classList.remove(
      "touch-active"
    );

  }, 150);
}

},
{
passive: true
}
);

/* =========================================================
PREVENT DOUBLE TAP ZOOM
========================================================= */

let lastTouchEnd = 0;

document.addEventListener(
"touchend",
event => {

const now =
  Date.now();

if (
  now - lastTouchEnd <= 300
) {

  event.preventDefault();

}

lastTouchEnd =
  now;

},
{
passive: false
}
);

/* =========================================================
FULLSCREEN
========================================================= */

function toggleFullscreen() {

if (!document.fullscreenElement) {

if (
  document.documentElement.requestFullscreen
) {

  document.documentElement
    .requestFullscreen()
    .catch(() => {});

}

} else {

if (
  document.exitFullscreen
) {

  document
    .exitFullscreen()
    .catch(() => {});

}

}
}

/* =========================================================
FULLSCREEN BUTTON
========================================================= */

document.addEventListener(
"DOMContentLoaded",
() => {

const buttons =
  document.querySelectorAll(
    "#fullscreenBtn, #fullScreen, .fullscreen-button"
  );

buttons.forEach(
  button => {

    button.addEventListener(
      "click",
      toggleFullscreen
    );

  }
);

}
);

/* =========================================================
VISIBILITY PAUSE
========================================================= */

document.addEventListener(
"visibilitychange",
() => {

if (
  document.hidden &&
  Game.started &&
  !Game.paused
) {

  Game.paused = true;

  updateUI();

}

}
);

/* =========================================================
RESIZE HANDLER
========================================================= */

window.addEventListener(
"resize",
() => {

updateUI();

},
{
passive: true
}
);

/* =========================================================
SAFE GAME START
========================================================= */

window.startUNO =
function(name) {

AudioSystem.init();

startGame(
  name || "PLAYER"
);

};

/* =========================================================
GLOBAL GAME API
========================================================= */

window.UNO = {

start: startGame,

draw: playerDraw,

play: playPlayerCard,

pause: togglePause,

reset: resetGame,

uno: callUNO,

fullscreen:
toggleFullscreen,

info:
getGameInfo,

game:
Game

};

/* =========================================================
FINAL INITIALIZATION
========================================================= */

function finalGameInit() {

console.log(
"================================="
);

console.log(
" UNO 3D ULTIMATE READY"
);

console.log(
"================================="
);

// Make sure UI exists
setTimeout(() => {

try {

  renderGame();

} catch (error) {

  console.log(
    "Initial render waiting for UI..."
  );

}

}, 250);

}

if (
document.readyState ===
"loading"
) {

document.addEventListener(
"DOMContentLoaded",
finalGameInit
);

} else {

finalGameInit();

}

/* =========================================================
END OF GAME.JS
========================================================= */

console.log(
"✅ game.js — ALL 4 PARTS LOADED"
);
