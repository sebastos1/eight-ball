'use strict';

const Vector = require('./Vector');

const events = {
    ballPotted(game, ball) {

        switch (ball.color) {
            case 'red':
            case 'yellow':
                this.handleColoredBall(game, ball);
                break;
            case 'white':
                this.handleWhiteBall(game, ball);
                break;
            case 'black':
                this.handleBlackBall(game);
                break;
        }

        // update the score immediately
        [game.turn, game.nextTurn].forEach((player, i, array) => {
            var opponent = array[1 - i];
            player.socket.emit('game-scoreUpdate', {
                player: player.score,
                opponent: opponent.score,
                playercolor: player.color,
                opponentcolor: opponent.color
            });
        })
    },

    handleColoredBall(game, ball) {

        // give a color if no ball gone
        if (game.turn.color === undefined) {
            game.turn.color = ball.color;
            game.nextTurn.color = ball.color === 'red' ? 'yellow' : 'red'; // opponent color
        }

        // add if colors is same, or give a foul and give to opponent
        if (game.turn.color === ball.color) {
            game.turn.score++;
        } else {
            game.nextTurn.score++;
            game.foul = true;
        }

        // remove ball from pool
        game.balls.splice(game.balls.indexOf(ball), 1);
    },

    handleWhiteBall(game, ball) {
        game.foul = true;
        ball.position.set(320, 360);
        ball.velocity.set(0, 0);
        ball.acceleration.set(0, 0);
    },

    handleBlackBall(game) {
        game.winner = game.turn.score >= 7 ? game.turn : game.nextTurn;
    },
};

// Export events module 
module.exports = events;