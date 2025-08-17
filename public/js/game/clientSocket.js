import Game from "./Game.js";
import { userColor } from "../site/helpers.js";
import { showMenu, showQueue, showGame, showGameEnd } from "./menu.js";
import { launchConfetti } from "./confetti.js";
import { initQueueTracking } from "../site/online.js";
import { YELLOW_COL, RED_COL } from "./Ball.js";

// Connect
const socket = io();

// queue and online tracking and grab latest
initQueueTracking(socket, "playersInQueue2");
socket.emit("requestOnlineUpdate");

// Initialise game variable
let game;

// Main game loop
const gameloop = function () {
    // If there is a game, draw it to the canvas
    if (game) game.draw();
    window.requestAnimationFrame(gameloop);
};
window.requestAnimationFrame(gameloop);


// Join queue button click event
$("#btn-joinQueue").click(() => {
    joinQueue();
});

// Show menu button click event
$("#btn-requeue").click(() => {
    joinQueue();
});

// couldnt have same name i guess
function joinQueue() {
    socket.emit("queue-join", (response) => {
        if (response.success) {
            showQueue();
        } else {
            $("#queueMessage").text(response.message);
        }
    });
}

// Leave queue button click event
$("#btn-leaveQueue").click(() => {
    // Send queue leave event to server
    socket.emit("queue-leave");
    // Show the menu
    showMenu();
});

// Shoot function
export const shoot = function (power, angle) {
    // Send shoot event to server
    socket.emit("shoot", { power, angle });
};


// Game start event listener
socket.on("game-start", (data) => {

    // Create a new game with the data
    game = new Game(data);

    // Display player and opponent names
    $("#playerUsername").text(game.player.username);
    $("#opponentUsername").text(game.opponent.username);

    // Add links to the player and opponent"s profiles
    $("#playerUsername").attr("href", `/profile/${game.player.id}`);
    $("#opponentUsername").attr("href", `/profile/${game.opponent.id}`);

    // Display player and opponent scores
    $("#playerScore").text(game.player.score);
    $("#opponentScore").text(game.opponent.score);

    // Display player and opponent colors
    $("#playercolor").css("background-color", game.player.color);
    $("#opponentcolor").css("background-color", game.opponent.color);

    // If player"s turn
    if (game.turn) {
        // Underline player username and score
        $("#playerUsername").css("text-decoration", "underline");
        $("#playerScore").css("text-decoration", "underline");
        $("#opponentUsername").css("text-decoration", "none");
        $("#opponentScore").css("text-decoration", "none");
        // If opponent"s turn
    } else {
        // Underline opponent username and score
        $("#playerUsername").css("text-decoration", "none");
        $("#playerScore").css("text-decoration", "none");
        $("#opponentUsername").css("text-decoration", "underline");
        $("#opponentScore").css("text-decoration", "underline");
    }

    // Show the game
    showGame();
});

// Game update event listener
socket.on("game-update", (data) => {
    // Update current game with the data
    if (game) game.update(data);
});

socket.on("game-scoreUpdate", (data) => {
    if (!game) return;

    // Update the game object
    game.player.score = data.player;
    game.opponent.score = data.opponent;
    game.player.color = data.playercolor;
    game.opponent.color = data.opponentcolor;

    // Update the displayed scores
    $("#playerScore").text(game.player.score);
    $("#opponentScore").text(game.opponent.score);

    // Update player and opponent colors
    if (data.gameColorSet) {
        $("#playercolor").css("background-color", (game.player.color == "red") ? RED_COL : YELLOW_COL);
        $("#opponentcolor").css("background-color", (game.opponent.color == "red") ? RED_COL : YELLOW_COL);
    }
});

// Game turn update event listener
socket.on("game-updateTurn", (data) => {
    if (!game) return;

    // Update current game turns with the data
    game.updateTurn(data);

    // If player"s turn
    if (game.turn) {
        // Underline player username and score
        $("#playerUsername").css("text-decoration", "underline");
        $("#playerScore").css("text-decoration", "underline");
        $("#opponentUsername").css("text-decoration", "none");
        $("#opponentScore").css("text-decoration", "none");
        // If opponent"s turn
    } else {
        // Underline opponent username and score
        $("#playerUsername").css("text-decoration", "none");
        $("#playerScore").css("text-decoration", "none");
        $("#opponentUsername").css("text-decoration", "underline");
        $("#opponentScore").css("text-decoration", "underline");
    }
});

// Game end event listener
socket.on("game-end", (data) => {

    let string;

    // If player has won, display win text
    if (data.winner) {
        $("#winnerName").text(game.player.username).css("color", userColor(game.player.username));
        string = "You won ";
        launchConfetti();
    } else {
        $("#winnerName").text(game.opponent.username).css("color", userColor(game.opponent.username));
        string = "You lost ";
    }

    switch (data.winReason) {
        case 1:
            string += "on score"; // medal
            break;
        case 2:
            string += "due to 8-ball 🎱"; // 8 ball emoji
            break;
        case 3:
            string += "because a player left ❌"; // red x
            break;
        default:
            string += "for an unknown reason ❓"; // question mark
            break;
    }

    let color = (data.winner) ? "#4cb568" : "#b54c4c";

    $("#winReason").text(string).css("color", color);

    game = null;

    // Show game ending
    showGameEnd();
});

// dashboard page for live updates on players online/in queue
socket.on("online-update", (data) => {
    $("#playersOnline").text(data.playersOnline);
});

socket.on("queue-update", (data) => {
    $("#playersInQueue").text(data.playersInQueue);
});