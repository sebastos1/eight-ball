import Ball from './Ball.js';
import Vector from './Vector.js';
import physics from './physics.js';
import events from './events.js';
import Games from '../db/Games.js';
import Users from '../db/Users.js';

const WIDTH = 1280;
const HEIGHT = 720;
const BALL_RADIUS = 20;
const MAX_POWER = 50;
const POCKETS = [[0, 0], [WIDTH / 2, 0], [WIDTH, 0], [0, HEIGHT], [WIDTH / 2, HEIGHT], [WIDTH, HEIGHT]]
    .map(([x, y]) => ({ position: new Vector(x, y), radius: BALL_RADIUS, velocity: new Vector() }));

let gameCounter = 0;

class Game {
    constructor(player1, player2) {
        this.id = ++gameCounter;
        this.initializePlayers(player1, player2);
        this.initializeGameState();
        this.balls = this.setupBalls();
        this.cueBall = this.balls[0];
        this.blackBall = this.balls[1];
    }

    initializePlayers(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;
        [this.player1, this.player2].forEach(player => {
            player.game = this;
            player.inGame = true;
            player.score = 0;
        });
    }

    initializeGameState() {
        this.active = false;
        this.ended = false;
        this.turn = this.player1;
        this.nextTurn = this.player2;
        this.foul = false;
        this.potted = false;
        this.whiteBallPotted = false;
        this.winner = null;
        this.winReason = null;
    }

    setupBalls() {
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

        const colors = [...Array(7).fill('red'), ...Array(7).fill('yellow')];
        for (let i = 2; i < ballSetup.length; i++) {
            const randomIndex = Math.floor(Math.random() * colors.length);
            ballSetup[i].color = colors.splice(randomIndex, 1)[0];
        }

        return ballSetup.map(({ pos, color }) => new Ball(new Vector(...pos), BALL_RADIUS, color));
    }

    update() {
        this.active = false;

        for (let i = 0; i < this.balls.length; i++) {
            const ball = this.balls[i];

            for (let j = i + 1; j < this.balls.length; j++) {
                physics.collideBalls(ball, this.balls[j]);
            }

            physics.collideCushions(ball, WIDTH, HEIGHT);

            if (physics.ballMotion(ball)) this.active = true;

            POCKETS.forEach(pocket => {
                if (physics.doBallsOverlap(ball, pocket)) events.ballPotted(this, ball);
            });
        }

        if (!this.active) {
            this.handleTurnEnd();
        }

        if (this.winner) {
            this.end(this.winner, this.winReason);
        }

        return !this.active;
    }

    handleTurnEnd() {
        if (this.foul || !this.potted) {
            [this.turn, this.nextTurn] = [this.nextTurn, this.turn];
        }

        if (this.whiteBallPotted) {
            this.cueBall.position.set(320, 360);
        }

        this.foul = false;
        this.potted = false;
        this.whiteBallPotted = false;
    }

    shoot(player, power, angle) {
        if (this.turn === player && !this.active && power <= MAX_POWER) {
            this.cueBall.velocity.set(power * Math.cos(angle), power * Math.sin(angle));
            this.active = true;
        }
    }

    async end(winner, winReason) {
        if (this.ended) return;
        this.ended = true;

        if (this.player1.id === this.player2.id) {
            this.cleanUp();
            return;
        }

        const loser = winner === this.player1 ? this.player2 : this.player1;

        try {
            let ratingChanges = null;

            if (!winner.isGuest && !loser.isGuest) {
                ratingChanges = await Users.updateRatingsAfterGame(winner.id, loser.id);
                if (!ratingChanges) console.log("Error updating ratings, logging anyway");
            }

            await Games.create(winner, loser, ratingChanges, winReason);
        } catch (error) {
            console.error("Error ending game:", error);
        }

        this.active = false;
        this.cleanUp();
    }

    cleanUp() {
        [this.player1, this.player2].forEach(player => {
            player.inGame = false;
            delete player.game;
            delete player.color;
            delete player.score;
        });
    }

    startData(player) {
        const opponent = player === this.player1 ? this.player2 : this.player1;
        return {
            player: this.playerData(player),
            opponent: this.playerData(opponent),
            active: this.active,
            turn: player === this.turn,
            balls: this.ballsData()
        };
    }

    updateData() {
        return {
            active: this.active,
            balls: this.ballsData()
        };
    }

    turnData(player) {
        const opponent = player === this.player1 ? this.player2 : this.player1;
        return {
            player: { score: player.score, color: player.color },
            opponent: { score: opponent.score, color: opponent.color },
            turn: player === this.turn
        };
    }

    endData(player, winReason) {
        return {
            winner: player === this.winner,
            winReason: winReason,
        };
    }

    playerData(player) {
        return {
            id: player.id,
            username: player.username,
            score: player.score,
            color: player.color
        };
    }

    ballsData() {
        return this.balls.map(ball => ({
            x: ball.position.x,
            y: ball.position.y,
            color: ball.color
        }));
    }
}

export default Game;