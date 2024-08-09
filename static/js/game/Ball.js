'use strict';

const skull = new Image();
skull.src = "/img/AINTNOWAY.png";

// lol
// const YELLOW_COL = "#1CCC7F"; // teal
// const RED_COL = "#C43E64"; // purple ish

// Ball class constructor
const Ball = function (position, radius, colour) {

    // Properties
    this.position = position;
    this.radius = radius;
    this.colour = colour;

};

// Ball draw method
Ball.prototype.draw = function () {
    if (this.colour == "black") {
        canvas.drawImage(this.position, TABLE, this.radius * 2, skull);
        return;
    }

    if (this.colour == "yellow") {
        canvas.drawCircle(this.position, TABLE, this.radius, YELLOW_COL);
        return;
    }

    if (this.colour == "red") {
        canvas.drawCircle(this.position, TABLE, this.radius, RED_COL);
        return;
    }

    // Draw a circle on the canvas
    canvas.drawCircle(this.position, TABLE, this.radius, this.colour);
};