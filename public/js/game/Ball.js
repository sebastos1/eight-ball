import canvas from "./canvas.js";
import { TABLE } from "./graphics.js";

export const YELLOW_COL = "#1CCC7F"; // teal
export const RED_COL = "#C43E64"; // purple ish
export const BALL_RADIUS = 20;

const GLEAM_RADIUS = BALL_RADIUS / 4;
const GLEAM_OFFSET = BALL_RADIUS / 3;

const skull = new Image();
skull.src = "/img/AINTNOWAY.png";

class Ball {
    constructor(position, radius, color) {
        this.position = position;
        this.radius = radius;
        this.color = color;
        this.x = TABLE.x + position.x;
        this.y = TABLE.y + position.y;
        this.gradientCache = null;
    }

    draw() {
        const ctx = canvas._context;

        switch (this.color) {
            case "black":
                canvas.drawImage(this.position, TABLE, this.radius * 2, skull);
                break;
            case "white":
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                break;
            default:
                this.drawColoredBall(ctx);
        }
    }

    drawColoredBall(ctx) {
        const ballColor = this.color === "yellow" ? YELLOW_COL : RED_COL;

        if (!this.gradientCache) {
            this.gradientCache = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
            this.gradientCache.addColorStop(0, ballColor);
            this.gradientCache.addColorStop(0.7, ballColor);
            this.gradientCache.addColorStop(1, Ball.adjustColor(ballColor, -10));
        }

        ctx.fillStyle = this.gradientCache;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw gleam
        ctx.fillStyle = Ball.adjustColor(ballColor, 10);
        ctx.beginPath();
        ctx.arc(this.x - GLEAM_OFFSET, this.y - GLEAM_OFFSET, GLEAM_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    }

    static adjustColor(color, percent) {
        const num = parseInt(color.slice(1), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, Math.max(0, (num >> 16) + amt));
        const G = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + amt));
        const B = Math.min(255, Math.max(0, (num & 0xFF) + amt));
        return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
    }
}

export default Ball;