// Components
import Ball from './Ball.js';
import Vector from './Vector.js';
import physics from './physics.js';
import events from './events.js';
import Games from '../db/Games.js';
import Users from '../db/Users.js';

// Constants
const WIDTH = 1280;
const HEIGHT = 720;
const BALL_RADIUS = 20;
const MAX_POWER = 50;
const POCKETS = [[0, 0], [WIDTH / 2, 0], [WIDTH, 0], [0, HEIGHT], [WIDTH / 2, HEIGHT], [WIDTH, HEIGHT]]
    .map(params => ({ position: new Vector(params[0], params[1]), radius: BALL_RADIUS, velocity: new Vector() }));

// Game counter
let num = 0;

// Game class constructor
const Game = function (player1, player2) {

    // Game id
    this.id = ++num;

    // Add player reference and set game properties
    this.player1 = player1;
    this.player2 = player2;
    this.player1.game = this;
    this.player2.game = this;
    this.player1.inGame = true;
    this.player2.inGame = true;

    this.player1.score = 0;
    this.player2.score = 0;

    // Game status properties
    this.active = false;
    this.ended = false;

    // Game turn properties
    this.turn = this.player1;
    this.nextTurn = this.player2;
    this.foul = false;
    this.potted = false;
    this.whiteBallPotted = false;

    // This holds the winner and loser temporarily
    this.winner = null;
    this.winReason = null;

    // Create balls
    this.balls = this.setupBalls();

    // Game white and black balls
    this.cueBall = this.balls[0];
    this.blackBall = this.balls[1];
};

const game = Game.prototype;

game.setupBalls = function () {
    // Spawn the white ball in a random position since it's deterministic
    const deviation = 200;
    const whiteX = 320 + (Math.random() * 2 - 1) * deviation;
    const whiteY = 360 + (Math.random() * 2 - 1) * deviation;

    const ballSetup = [
        { pos: [whiteX, whiteY], color: 'white' },
        { pos: [1030, 360], color: 'black' },
        { pos: [960, 360] }, { pos: [995, 340] },
        { pos: [995, 380] }, { pos: [1030, 320] },
        { pos: [1030, 400] }, { pos: [1065, 300] },
        { pos: [1065, 340] }, { pos: [1065, 380] },
        { pos: [1065, 420] }, { pos: [1100, 280] },
        { pos: [1100, 320] }, { pos: [1100, 360] },
        { pos: [1100, 400] }, { pos: [1100, 440] }
    ];

    // Add shuffled colors
    const colors = [...Array(7).fill('red'), ...Array(7).fill('yellow')];
    for (let i = 2; i < ballSetup.length; i++) {
        const randomIndex = Math.floor(Math.random() * colors.length);
        ballSetup[i].color = colors.splice(randomIndex, 1)[0];
    }

    return ballSetup.map(
        ({ pos, color }) => new Ball(new Vector(pos[0], pos[1]), BALL_RADIUS, color)
    );
}


// Update class method
game.update = function () {

    // Set game active property to false by default
    this.active = false;

    // Loop through each ball
    for (let i = 0; i < this.balls.length; i++) {

        // Current ball
        const ball = this.balls[i];

        // Loop through the other balls and resolve their collisions
        for (let j = i + 1; j < this.balls.length; j++) {
            const collidingBall = this.balls[j];
            physics.collideBalls(ball, collidingBall);
        }

        // Resolve the collision with the cushions
        physics.collideCushions(ball, WIDTH, HEIGHT);

        // Update ball motion
        let ballActive = physics.ballMotion(ball);
        // If the ball is moving, set the active property of the game to true
        if (ballActive) this.active = true;

        // Iterate through each pocket and check if the ball has been pocketed
        POCKETS.forEach(pocket => {
            if (physics.doBallsOverlap(ball, pocket)) events.ballPotted(this, ball);
        });

    }

    // If all balls have stopped moving
    if (!this.active) {

        // If there was a foul or no ball potted, change the turn
        if (this.foul || !this.potted) [this.turn, this.nextTurn] = [this.nextTurn, this.turn];

        if (this.whiteBallPotted) {
            this.cueBall.position.set(320, 360);
        }

        // Reset properties
        this.foul = false;
        this.potted = false;
        this.whiteBallPotted = false;
    }

    if (this.winner) {
        this.end(this.winner, this.winReason);
    }

    // Return whether there is an update in turns
    return !this.active;

};

// Shoot class method
game.shoot = function (player, power, angle) {
    // Check if it is the player's turn, the balls have stopped moving, and the power is not above the max power
    if (this.turn == player && !this.active && power <= MAX_POWER) {
        // Update cue ball's velocity and set active to true
        this.cueBall.velocity.set(power * Math.cos(angle), power * Math.sin(angle));
        this.active = true;
    }
};

// Game end method
game.end = async function (winner, winReason) {
    if (this.ended) return;
    // No rank update if a player played against themselves
    if (this.player1.id === this.player2.id) {
        this.cleanUp();
        return;
    }
    // Get loser
    let loser = (winner == this.player1 ? this.player2 : this.player1);

    try {
        // update player rating
        const ratingChanges = await Users.updateRatingsAfterGame(winner.id, loser.id);
        if (!ratingChanges) {
            console.log("Error updating ratings, logging anyway");
        }

        // Create new game in the database
        await Games.create(winner, loser, ratingChanges, winReason, winner.country, loser.country);
    } catch (error) {
        console.error("Error ending game:", error);
    } finally {
        this.cleanUp();
        this.active = false;
        this.ended = true;
    }
};

game.cleanUp = function () {
    // Set player properties
    this.player1.inGame = false;
    this.player2.inGame = false;

    delete this.player1.game;
    delete this.player2.game;
    delete this.player1.color;
    delete this.player2.color;
    delete this.player1.score;
    delete this.player2.score;
    // delete this.winner;
};

// Data that is sent to the players when the game starts
game.startData = function (player) {
    let opponent = (player == this.player1 ? this.player2 : this.player1);
    return {
        player: { id: player.id, username: player.username, score: player.score, color: player.color },
        opponent: { id: opponent.id, username: opponent.username, score: opponent.score, color: opponent.color },
        active: this.active,
        turn: (player == this.turn),
        balls: this.balls.map(ball => { return { x: ball.position.x, y: ball.position.y, color: ball.color }; })
    };
};

// Data that is sent to the players each game update
game.updateData = function () {
    return {
        active: this.active,
        balls: this.balls.map(ball => { return { x: ball.position.x, y: ball.position.y, color: ball.color }; })
    };
};

// Data that is sent to the players when the turn changes
game.turnData = function (player) {
    let opponent = (player == this.player1 ? this.player2 : this.player1);
    return {
        player: { score: player.score, color: player.color },
        opponent: { score: opponent.score, color: opponent.color },
        turn: (player == this.turn)
    };
};

// Data that is sent to the players when the game ends
game.endData = function (player, winReason) {
    return {
        winner: player === this.winner,
        winReason: winReason,
    };
};

export default Game;