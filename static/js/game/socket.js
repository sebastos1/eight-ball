'use strict';

const YELLOW_COL = "#1CCC7F"; // teal
const RED_COL = "#C43E64"; // purple ish

function colorPicker(id) {
    const colors = [
        "id-rainbow",
        "id-green",
    ];
    if (id > colors.length) { return ""; }
    return colors[id - 1];
}

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
$('#btn-showMenu').click(showMenu);

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

    // Display player and opponent colours
    $('#playerColour').css('background-color', game.player.colour);
    $('#opponentColour').css('background-color', game.opponent.colour);

    $('#playerUsername').addClass(colorPicker(game.player.id));
    $('#opponentUsername').addClass(colorPicker(game.opponent.id));

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

// Game turn update event listener
socket.on('game-updateTurn', (data) => {
    if (game) {

        // Update current game turns with the data
        game.updateTurn(data);

        // Update player and oppoenent scores
        $('#playerScore').text(game.player.score);
        $('#opponentScore').text(game.opponent.score);

        // Update player and opponent colours
        $('#playerColour').css('background-color', (game.player.colour == "red") ? RED_COL : YELLOW_COL);
        $('#opponentColour').css('background-color', (game.opponent.colour == "red") ? RED_COL : YELLOW_COL);

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

    }
});

// Game end event listener
socket.on('game-end', (data) => {

    // If player has won, display win text
    if (data.winner) {
        $('#endMsg').text('Winner winner chicken dinner!');
        // If player has lost, display lose text
    } else {
        $('#endMsg').text('Lost :(');
    }

    game = null;

    // Show game ending
    showGameEnd();

});