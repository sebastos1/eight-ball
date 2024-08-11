'use strict';

const skull = new Image();
skull.src = "/img/AINTNOWAY.png";

// lol
// const YELLOW_COL = "#1CCC7F"; // teal
// const RED_COL = "#C43E64"; // purple ish

// Ball class constructor
const Ball = function (position, radius, color) {

    // Properties
    this.position = position;
    this.radius = radius;
    this.color = color;

};

// Ball draw method
Ball.prototype.draw = function () {
    if (this.color == "black") {
        canvas.drawImage(this.position, TABLE, this.radius * 2, skull);
        return;
    }

    if (this.color == "yellow") {
        canvas.drawCircle(this.position, TABLE, this.radius, YELLOW_COL);
        return;
    }

    if (this.color == "red") {
        canvas.drawCircle(this.position, TABLE, this.radius, RED_COL);
        return;
    }

    // Draw a circle on the canvas
    canvas.drawCircle(this.position, TABLE, this.radius, this.color);
};