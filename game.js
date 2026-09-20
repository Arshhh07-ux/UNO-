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
