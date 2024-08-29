import Vector from './Vector.js';
import { BALL_RADIUS } from './Ball.js';
import { shoot } from './clientSocket.js';
import canvas from './canvas.js';
import { TABLE } from "./graphics.js";

const MAX_POWER = 50;
const MAX_DRAG_DISTANCE = 200;
const STICK_WIDTH = 20;
const STICK_HEIGHT = 750;
const STICK_COL = '#C66F35';
const GUIDE_COL = 'rgba(0, 0, 0, 0.25)';
const SHAKE_AMPLITUDE = 2;

class Stick {
    constructor(position) {
        this.position = position;
        this.rotation = 0;
        this.power = 0;
        this.isCharging = false;
        this.dragStartPos = null;
        this.shakeOffset = new Vector(0, 0);
        this.hasPowerIncreased = false;
    }

    draw() {
        this.updateRotation();

        if (canvas.mouse.down) {
            if (!this.isCharging) {
                this.isCharging = true;
                this.dragStartPos = new Vector(canvas.mouse.position.x, canvas.mouse.position.y);
            }
            this.updatePower();
        } else if (this.isCharging) {
            if (this.power > 0) shoot(this.power, this.rotation);
            this.resetStick();
        }

        this.updateShake();
        this.drawStick();
        this.drawPowerIndicator();

        if (this.power === 0 && this.hasPowerIncreased) {
            this.drawZeroPowerIndicator();
        }
    }

    updatePower() {
        const dragVector = Vector.subtract(canvas.mouse.position, this.dragStartPos);
        const stickAxis = new Vector(Math.cos(this.rotation), Math.sin(this.rotation));
        const axialDragDistance = Vector.dot(dragVector, stickAxis);

        const newPower = Math.max(0, Math.min(MAX_POWER, (axialDragDistance / MAX_DRAG_DISTANCE) * MAX_POWER));

        if (newPower > this.power) this.hasPowerIncreased = true;
        this.power = newPower;
    }

    updateRotation() {
        if (!this.isCharging) {
            const opposite = canvas.mouse.position.y - this.position.y;
            const adjacent = canvas.mouse.position.x - this.position.x;
            this.rotation = Math.atan2(opposite, adjacent);
        }
    }

    resetStick() {
        this.power = 0;
        this.isCharging = false;
        this.dragStartPos = null;
        this.hasPowerIncreased = false;
    }

    updateShake() {
        if (this.power === MAX_POWER) {
            const shakeAmount = (Math.random() - 0.5) * SHAKE_AMPLITUDE;
            this.shakeOffset = new Vector(
                Math.cos(this.rotation) * shakeAmount,
                Math.sin(this.rotation) * shakeAmount
            );
        } else {
            this.shakeOffset.x = this.shakeOffset.y = 0;
        }
    }

    drawStick() {
        const offset = new Vector(-STICK_WIDTH / 2, this.power + 50);
        const shakePosition = Vector.add(this.position, this.shakeOffset);
        canvas.drawRect(offset, Vector.add(shakePosition, TABLE), new Vector(STICK_WIDTH, STICK_HEIGHT), STICK_COL, this.rotation + Math.PI / 2);
    }

    drawGuide() {
        canvas.drawRect(new Vector(0, -5), Vector.add(this.position, TABLE), new Vector(2000, 10), GUIDE_COL, this.rotation);
    }

    drawPowerIndicator() {
        const indicatorWidth = 100;
        const indicatorHeight = 10;
        const padding = 15;
        const numTicks = 5;

        const baseIndicatorPos = Vector.add(this.position, new Vector(-indicatorWidth / 2, -BALL_RADIUS - indicatorHeight - padding));
        const indicatorPos = Vector.add(baseIndicatorPos, this.shakeOffset);

        canvas.drawRect(new Vector(0, 0), Vector.add(indicatorPos, TABLE), new Vector(indicatorWidth, indicatorHeight), 'rgba(0, 0, 0, 0.5)');

        const powerPercentage = this.power / MAX_POWER;
        const red = Math.round(255 * powerPercentage);
        const green = Math.round(255 * (1 - powerPercentage));
        const gradientColor = `rgb(${red}, ${green}, 0)`;
        const powerWidth = powerPercentage * indicatorWidth;
        canvas.drawRect(new Vector(0, 0), Vector.add(indicatorPos, TABLE), new Vector(powerWidth, indicatorHeight), gradientColor);

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
    }

    drawZeroPowerIndicator() {
        const indicatorWidth = 100;
        const indicatorHeight = 10;
        const padding = 15;
        const xSize = 12;

        const baseIndicatorPos = Vector.add(this.position, new Vector(-indicatorWidth / 2, -BALL_RADIUS - indicatorHeight - padding));
        const xPos = Vector.add(baseIndicatorPos, new Vector(-xSize - 5, indicatorHeight / 2));

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
    }
}

export default Stick;