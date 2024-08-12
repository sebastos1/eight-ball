'use strict';

const YELLOW_COL = "#1CCC7F"; // teal
const RED_COL = "#C43E64"; // purple ish

// Connect
const socket = io();

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
$('#btn-joinQueue').click(() => {
    // Send queue join event to server
    socket.emit('queue-join');
    // Show the queue
    showQueue();
});

// Leave queue button click event
$('#btn-leaveQueue').click(() => {
    // Send queue leave event to server
    socket.emit('queue-leave');
    // Show the menu
    showMenu();
});

// Show menu button click event
$('#btn-requeue').click(() => {
    socket.emit('queue-join');
    showQueue();
});

// Shoot function
const shoot = function (power, angle) {
    // Send shoot event to server
    socket.emit('shoot', { power, angle });
};


// Game start event listener
socket.on('game-start', (data) => {

    // Create a new game with the data
    game = new Game(data);

    // Display player and opponent names
    $('#playerUsername').text(game.player.username);
    $('#opponentUsername').text(game.opponent.username);

    // Add links to the player and opponent's profiles
    $('#playerUsername').attr('href', `/profile/${game.player.id}`);
    $('#opponentUsername').attr('href', `/profile/${game.opponent.id}`);

    // Display player and opponent scores
    $('#playerScore').text(game.player.score);
    $('#opponentScore').text(game.opponent.score);

    // Display player and opponent colors
    $('#playercolor').css('background-color', game.player.color);
    $('#opponentcolor').css('background-color', game.opponent.color);

    $('#playerUsername').addClass(Colors.colorPicker(game.player.id));
    $('#opponentUsername').addClass(Colors.colorPicker(game.opponent.id));

    // If player's turn
    if (game.turn) {
        // Underline player username and score
        $('#playerUsername').css('text-decoration', 'underline');
        $('#playerScore').css('text-decoration', 'underline');
        $('#opponentUsername').css('text-decoration', 'none');
        $('#opponentScore').css('text-decoration', 'none');
        // If opponent's turn
    } else {
        // Underline opponent username and score
        $('#playerUsername').css('text-decoration', 'none');
        $('#playerScore').css('text-decoration', 'none');
        $('#opponentUsername').css('text-decoration', 'underline');
        $('#opponentScore').css('text-decoration', 'underline');
    }

    // Show the game
    showGame();

});

// Game update event listener
socket.on('game-update', (data) => {
    // Update current game with the data
    if (game) game.update(data);
});

socket.on('game-scoreUpdate', (data) => {
    if (game) {
        // Update the game object
        game.player.score = data.player;
        game.opponent.score = data.opponent;
        game.player.color = data.playercolor;
        game.opponent.color = data.opponentcolor;

        // Update the displayed scores
        $('#playerScore').text(game.player.score);
        $('#opponentScore').text(game.opponent.score);

        // Update player and opponent colors
        if (data.gameColorSet) {
            $('#playercolor').css('background-color', (game.player.color == "red") ? RED_COL : YELLOW_COL);
            $('#opponentcolor').css('background-color', (game.opponent.color == "red") ? RED_COL : YELLOW_COL);
        }
    }
});

// Game turn update event listener
socket.on('game-updateTurn', (data) => {
    if (!game) return;

    // Update current game turns with the data
    game.updateTurn(data);

    // If player's turn
    if (game.turn) {
        // Underline player username and score
        $('#playerUsername').css('text-decoration', 'underline');
        $('#playerScore').css('text-decoration', 'underline');
        $('#opponentUsername').css('text-decoration', 'none');
        $('#opponentScore').css('text-decoration', 'none');
        // If opponent's turn
    } else {
        // Underline opponent username and score
        $('#playerUsername').css('text-decoration', 'none');
        $('#playerScore').css('text-decoration', 'none');
        $('#opponentUsername').css('text-decoration', 'underline');
        $('#opponentScore').css('text-decoration', 'underline');
    }
});

// Game end event listener
socket.on('game-end', (data) => {

    let string;

    // If player has won, display win text
    if (data.winner) {
        $('#winnerName').text(game.player.username).addClass(Colors.colorPicker(game.player.id));
        string = "You won ";
    } else {
        $('#winnerName').text(game.opponent.username).addClass(Colors.colorPicker(game.opponent.id));
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

    $('#winReason').text(string);

    game = null;

    // Show game ending
    showGameEnd();
});