import Vector from "./Vector.js";
import { BALL_RADIUS } from "./Ball.js";

const HOLE_COL = "#1E211A";
const EDGE_COL = "#563220";
const PLAYFIELD_COL = "#2C5B2B";

export const WIDTH = 1280;
export const HEIGHT = 720;

export const BORDER = 50;
export const TABLE = new Vector(BORDER, BORDER); // top left or maybe bottom left of playfield, whatever

export const setupGraphics = (canvas) => {
    const ctx = canvas._context;

    // Canvas clear method
    canvas.clear = function () {
        canvas._context.clearRect(0, 0, canvas.width, canvas.height);
    };

    // Draw a filled rectangle
    canvas.drawRect = (position, origin, dimensions, color, rotation = 0) => {
        ctx.fillStyle = color;
        ctx.save();
        ctx.translate(origin.x, origin.y);
        if (rotation) ctx.rotate(rotation);
        ctx.fillRect(position.x, position.y, dimensions.x, dimensions.y);
        ctx.restore();
    };

    // Draw a filled circle
    canvas.drawCircle = (position, origin, radius, color) => {
        ctx.fillStyle = color;
        const x = origin.x + position.x;
        const y = origin.y + position.y;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
    };

    // Draw image
    canvas.drawImage = (position, origin, size, image) => {
        const x = origin.x + position.x;
        const y = origin.y + position.y;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(image, x - size / 2, y - size / 2, size, size);
        ctx.restore();
    };

    // Draw a stroked rectangle
    canvas.strokeRect = (position, origin, dimensions, color, strokeSize, rotation = 0) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeSize;
        ctx.save();
        ctx.translate(origin.x + position.x, origin.y + position.y);
        if (rotation) ctx.rotate(rotation);
        ctx.strokeRect(-position.x, -position.y, dimensions.x, dimensions.y);
        ctx.restore();
    };

    // table borders
    canvas.drawBorders = () => {
        const ctx = canvas._context;
        const holeRadius = BALL_RADIUS * 2;

        // outer border
        ctx.strokeStyle = EDGE_COL;
        ctx.lineWidth = 100;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        // holes
        ctx.fillStyle = HOLE_COL;
        const holePositions = [
            [0, 0],
            [WIDTH / 2, -10],
            [WIDTH, 0],
            [0, HEIGHT],
            [WIDTH / 2, HEIGHT + 10],
            [WIDTH, HEIGHT]
        ];

        ctx.beginPath();
        for (const [x, y] of holePositions) {
            ctx.moveTo(x + TABLE.x + holeRadius, y + TABLE.y);
            ctx.arc(x + TABLE.x, y + TABLE.y, holeRadius, 0, Math.PI * 2);
        }
        ctx.fill();

        // inner border
        ctx.lineWidth = 50;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
    };

    canvas.drawLine = (start, end, color, lineWidth = 1) => {
        if (ctx.strokeStyle !== color) ctx.strokeStyle = color;
        if (ctx.lineWidth !== lineWidth) ctx.lineWidth = lineWidth;

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
    };

    const createTableTexture = (width, height) => {
        const textureCanvas = document.createElement("canvas");
        textureCanvas.width = width;
        textureCanvas.height = height;
        const ctx = textureCanvas.getContext("2d");

        // vignette
        const gradient = ctx.createRadialGradient(
            textureCanvas.width / 2, textureCanvas.height / 2, 0,
            textureCanvas.width / 2, textureCanvas.height / 2, Math.max(textureCanvas.width, textureCanvas.height) / 1.5
        );
        gradient.addColorStop(0, PLAYFIELD_COL);
        gradient.addColorStop(1, "#1A3A19");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

        // noise
        const cellSize = 5;
        const rows = Math.ceil(textureCanvas.height / cellSize);
        const cols = Math.ceil(textureCanvas.width / cellSize);

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const randomShade = Math.random() * 4 - 2;
                ctx.fillStyle = `rgba(0, 0, 0, ${0.01 + randomShade / 100})`;
                ctx.fillRect(
                    x * cellSize,
                    y * cellSize,
                    cellSize,
                    cellSize
                );
            }
        }

        return textureCanvas;
    };

    // only draw texture once
    let tableTexture = createTableTexture(WIDTH, HEIGHT);

    canvas.drawTable = function () {
        canvas._context.drawImage(tableTexture, BORDER, BORDER);
    };
}