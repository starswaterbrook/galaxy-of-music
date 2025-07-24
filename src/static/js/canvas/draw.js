import { toScreen } from "./utils.js";
import {
    MAX_ZOOM,
    VIEWPORT_MARGIN,
    TEXT_RENDER_THRESHOLD,
    TEXT_HEIGHT,
    TEXT_PADDING,
    FONT_NAME,
    FONT_SIZE,
    ZOOM_REPULSION_THRESHOLD,
    EDGE_ALPHA_MULTIPLIER,
} from "./config.js";

function applyRepulsionToPoints(state, repulsionStrength) {
    for (let i = 0; i < state.points.length; i++) {
        const pointA = state.points[i];
        for (let j = i + 1; j < state.points.length; j++) {
            const pointB = state.points[j];

            const dx =
                pointA.screenX +
                pointA.screenDx -
                (pointB.screenX + pointB.screenDx);
            const dy =
                pointA.screenY +
                pointA.screenDy -
                (pointB.screenY + pointB.screenDy);

            const minDistX =
                (pointA.textWidth + pointB.textWidth) / 2 + TEXT_PADDING;

            if (Math.abs(dx) < minDistX && Math.abs(dy) < TEXT_HEIGHT) {
                const overlapX = minDistX - Math.abs(dx);
                const overlapY = TEXT_HEIGHT - Math.abs(dy);

                const ux = dx === 0 ? 1 : dx / Math.abs(dx);
                const uy = dy === 0 ? 1 : dy / Math.abs(dy);

                const axScale =
                    pointA.textWidth / (pointA.textWidth + pointB.textWidth);
                const bxScale =
                    pointB.textWidth / (pointA.textWidth + pointB.textWidth);

                pointA.screenDx +=
                    ux * overlapX * 0.5 * repulsionStrength * 0.05 * bxScale;
                pointB.screenDx -=
                    ux * overlapX * 0.5 * repulsionStrength * 0.05 * axScale;
                pointA.screenDy +=
                    uy * overlapY * 0.5 * repulsionStrength * 0.2 * bxScale;
                pointB.screenDy -=
                    uy * overlapY * 0.5 * repulsionStrength * 0.2 * axScale;
            }
        }
    }
}

function drawEdges(context, canvas, state, camera) {
    for (const edge of state.edges) {
        const { source, target } = edge;
        const [sourceX, sourceY] = toScreen(source.x, source.y, camera, canvas);
        const [targetX, targetY] = toScreen(target.x, target.y, camera, canvas);

        const inViewport =
            (sourceX >= -VIEWPORT_MARGIN &&
                sourceX <= canvas.width + VIEWPORT_MARGIN &&
                sourceY >= -VIEWPORT_MARGIN &&
                sourceY <= canvas.height + VIEWPORT_MARGIN) ||
            (targetX >= -VIEWPORT_MARGIN &&
                targetX <= canvas.width + VIEWPORT_MARGIN &&
                targetY >= -VIEWPORT_MARGIN &&
                targetY <= canvas.height + VIEWPORT_MARGIN);

        if (!inViewport) continue;

        context.beginPath();
        context.moveTo(sourceX, sourceY);
        context.lineTo(targetX, targetY);

        const t = Math.min(1, (camera.zoom - ZOOM_REPULSION_THRESHOLD) / 200);
        const alpha = t * EDGE_ALPHA_MULTIPLIER;
        const hex = edge.color;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        context.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
        context.lineWidth = 1;
        context.stroke();
    }
}

function parsePointData(context, canvas, camera, rawPoints) {
    return rawPoints
        .map((point) => {
            const [sx, sy] = toScreen(point.x, point.y, camera, canvas);
            return { point: point, sx, sy };
        })
        .filter(
            ({ sx, sy }) =>
                sx >= -VIEWPORT_MARGIN &&
                sy >= -VIEWPORT_MARGIN &&
                sx <= canvas.width + VIEWPORT_MARGIN &&
                sy <= canvas.height + VIEWPORT_MARGIN,
        )
        .map(({ point, sx, sy }) => {
            const textWidth = context.measureText(point.name).width;
            return {
                name: point.name,
                id: point.id,
                textWidth: textWidth,
                x: point.x,
                y: point.y,
                color: point.color,
                screenX: sx,
                screenY: sy,
                screenDx: 0,
                screenDy: 0,
            };
        });
}

function drawPoints(context, points, zoom) {
    context.textAlign = "center";
    context.textBaseline = "middle";

    const baseGridCellSize = 2;
    const logZoom = Math.log2(zoom);
    const discreteLogZoom = Math.floor(logZoom * 2) / 2;
    const discreteZoom = Math.pow(2, discreteLogZoom);
    const worldCellSize = baseGridCellSize / discreteZoom;
    const drawnPointsGrid = new Set();

    for (let {
        name,
        x,
        y,
        color,
        screenX,
        screenY,
        screenDx,
        screenDy,
    } of points) {
        if (zoom >= TEXT_RENDER_THRESHOLD) {
            context.save();
            context.translate(screenX + screenDx, screenY + screenDy);
            context.fillStyle = color;
            context.strokeText(name, 0, 0);
            context.fillText(name, 0, 0);
            context.restore();
        } else {
            const gridX = Math.floor(x / worldCellSize);
            const gridY = Math.floor(y / worldCellSize);
            const key = `${gridX},${gridY}`;

            if (drawnPointsGrid.has(key)) continue;
            drawnPointsGrid.add(key);

            context.beginPath();
            context.arc(screenX, screenY, 4, 0, 2 * Math.PI);
            context.fillStyle = color;
            context.fill();
        }
    }
}

function draw(context, canvas, camera, points, state) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    const currentZoom = camera.zoom;

    context.font = `${FONT_SIZE}px '${FONT_NAME}'`;
    context.lineWidth = 1;
    context.strokeStyle = "rgba(0,0,0,0.4)";

    state.points = parsePointData(context, canvas, camera, points);

    if (currentZoom >= ZOOM_REPULSION_THRESHOLD) {
        const repulsionStrength =
            ((currentZoom - ZOOM_REPULSION_THRESHOLD) / MAX_ZOOM) * 20;
        applyRepulsionToPoints(state, repulsionStrength);
    }

    drawPoints(context, state.points, currentZoom);

    if (camera.zoom >= ZOOM_REPULSION_THRESHOLD && state.edges) {
        drawEdges(context, canvas, state, camera);
    }
}

export { draw };
