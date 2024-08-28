import Vector from './Vector.js';
import { BALL_RADIUS } from './Ball.js';
import { shoot } from './clientSocket.js';
import canvas, { TABLE } from './canvas.js';

const MAX_POWER = 50;
const MAX_DRAG_DISTANCE = 200; // max drag in px for max power
const STICK_WIDTH = 20;
const STICK_HEIGHT = 750;
const STICK_COL = '#C66F35';
const GUIDE_COL = 'rgba(0, 0, 0, 0.25)';
const SHAKE_AMPLITUDE = 2; // max shake

const Stick = function (position) {
    this.position = position;
    this.rotation = 0;
    this.power = 0;
    this.isCharging = false;
    this.dragStartPos = null;
    this.shakeOffset = new Vector(0, 0);
    this.hasPowerIncreased = false;
};

// draw stick, guide, power indicator and zero power indicator when applicable
Stick.prototype.draw = function () {
    this.updateRotation();

    if (canvas.mouse.down) {
        if (!this.isCharging) {
            this.isCharging = true;
            this.dragStartPos = new Vector(canvas.mouse.position.x, canvas.mouse.position.y);
        }
        this.updatePower();
    } else if (this.isCharging) {
        // shoot only if power, otherwise reset
        if (this.power > 0) shoot(this.power, this.rotation);
        this.resetStick();
    }

    this.updateShake();
    this.drawStick();
    this.drawPowerIndicator();

    // draw zero power
    if (this.power === 0 && this.hasPowerIncreased) this.drawZeroPowerIndicator();
};

Stick.prototype.updatePower = function () {
    // get the distance along the stick axis
    let dragVector = Vector.subtract(canvas.mouse.position, this.dragStartPos);
    let stickAxis = new Vector(Math.cos(this.rotation), Math.sin(this.rotation));
    let axialDragDistance = Vector.dot(dragVector, stickAxis);

    // update power based on dragged distance along stick axis
    let newPower = Math.max(0, Math.min(MAX_POWER, (axialDragDistance / MAX_DRAG_DISTANCE) * MAX_POWER));

    // to update so that we dont see the x when starting
    if (newPower > this.power) this.hasPowerIncreased = true;

    this.power = newPower;
};


// rotate to face the mouse
Stick.prototype.updateRotation = function () {
    if (!this.isCharging) {
        let opposite = canvas.mouse.position.y - this.position.y;
        let adjacent = canvas.mouse.position.x - this.position.x;
        this.rotation = Math.atan2(opposite, adjacent);
    }
};

Stick.prototype.resetStick = function () {
    this.power = 0;
    this.isCharging = false;
    this.dragStartPos = null;
    this.hasPowerIncreased = false;
};

// shake effect when on high power
Stick.prototype.updateShake = function () {
    if (this.power === MAX_POWER) {
        let shakeAmount = (Math.random() - 0.5) * SHAKE_AMPLITUDE;
        this.shakeOffset = new Vector(
            Math.cos(this.rotation) * shakeAmount,
            Math.sin(this.rotation) * shakeAmount
        );
    } else {
        this.shakeOffset = new Vector(0, 0);
    }
};

// stick
Stick.prototype.drawStick = function () {
    let offset = new Vector(-STICK_WIDTH / 2, this.power + 50);
    let shakePosition = Vector.add(this.position, this.shakeOffset);
    canvas.drawRect(offset, Vector.add(shakePosition, TABLE), new Vector(STICK_WIDTH, STICK_HEIGHT), STICK_COL, this.rotation + Math.PI / 2);
};

// guide
Stick.prototype.drawGuide = function () {
    canvas.drawRect(new Vector(0, -5), Vector.add(this.position, TABLE), new Vector(2000, 10), GUIDE_COL, this.rotation);
};

// power indicator
Stick.prototype.drawPowerIndicator = function () {
    const indicatorWidth = 100;
    const indicatorHeight = 10;
    const padding = 15;
    const numTicks = 5;

    const baseIndicatorPos = Vector.add(this.position, new Vector(-indicatorWidth / 2, -BALL_RADIUS - indicatorHeight - padding));
    const indicatorPos = Vector.add(baseIndicatorPos, this.shakeOffset);

    // bg
    canvas.drawRect(new Vector(0, 0), Vector.add(indicatorPos, TABLE), new Vector(indicatorWidth, indicatorHeight), 'rgba(0, 0, 0, 0.5)');

    // % of max
    const powerPercentage = this.power / MAX_POWER;

    // gradient color bar
    const red = Math.round(255 * powerPercentage);
    const green = Math.round(255 * (1 - powerPercentage));
    const gradientColor = `rgb(${red}, ${green}, 0)`;
    const powerWidth = powerPercentage * indicatorWidth;
    canvas.drawRect(new Vector(0, 0), Vector.add(indicatorPos, TABLE), new Vector(powerWidth, indicatorHeight), gradientColor);

    // ticks
    for (let i = 1; i < numTicks; i++) {
        const tickX = (i / numTicks) * indicatorWidth;
        const tickStart = Vector.add(indicatorPos, new Vector(tickX, 0));
        const tickEnd = Vector.add(indicatorPos, new Vector(tickX, indicatorHeight));

        canvas.drawLine(
            Vector.add(tickStart, TABLE),
            Vector.add(tickEnd, TABLE),
            'rgba(255, 255, 255, 0.7)',
            2
        );
    }

    canvas.strokeRect(new Vector(0, 0), Vector.add(indicatorPos, TABLE), new Vector(indicatorWidth, indicatorHeight), 'rgba(255, 255, 255, 0.7)', 2);
};

// the little x that appears when power is zero
Stick.prototype.drawZeroPowerIndicator = function () {
    const indicatorWidth = 100;
    const indicatorHeight = 10;
    const padding = 15;
    const xSize = 12;

    const baseIndicatorPos = Vector.add(this.position, new Vector(-indicatorWidth / 2, -BALL_RADIUS - indicatorHeight - padding));
    const xPos = Vector.add(baseIndicatorPos, new Vector(-xSize - 5, indicatorHeight / 2)); // Moved to the left of the power bar

    canvas.drawLine(
        Vector.add(Vector.add(xPos, new Vector(-xSize / 2, -xSize / 2)), TABLE),
        Vector.add(Vector.add(xPos, new Vector(xSize / 2, xSize / 2)), TABLE),
        'rgba(255, 0, 0, 0.8)',
        2.5
    );
    canvas.drawLine(
        Vector.add(Vector.add(xPos, new Vector(-xSize / 2, xSize / 2)), TABLE),
        Vector.add(Vector.add(xPos, new Vector(xSize / 2, -xSize / 2)), TABLE),
        'rgba(255, 0, 0, 0.8)',
        2.5
    );
};

export default Stick;