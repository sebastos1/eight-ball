import Ball, { BALL_RADIUS } from './Ball.js';
import Stick from './Stick.js';
import canvas from './canvas.js';
import Vector from './Vector.js';

class Game {
    constructor(data) {
        this.player = data.player;
        this.opponent = data.opponent;
        this.active = data.active;
        this.turn = data.turn;
        this.updateBalls(data.balls);
        this.stick = new Stick(this.cueBall.position);
    }

    updateBalls(ballsData) {
        this.balls = ballsData.map(ball => new Ball(new Vector(ball.x, ball.y), BALL_RADIUS, ball.color));
        this.cueBall = this.balls[0];
    }

    update(data) {
        this.active = data.active;
        this.updateBalls(data.balls);
        this.stick.position = this.cueBall.position;
    }

    updateTurn(data) {
        const { player, opponent, turn } = data;
        Object.assign(this.player, player);
        Object.assign(this.opponent, opponent);
        this.turn = turn;
    }

    draw() {
        canvas.clear();
        canvas.drawTable();

        const isPlayerTurn = !this.active && this.turn;

        if (isPlayerTurn) {
            this.stick.drawGuide();
        }

        canvas.drawBorders();

        for (const ball of this.balls) {
            ball.draw();
        }

        if (isPlayerTurn) {
            this.stick.draw();
        }
    }
}

export default Game;