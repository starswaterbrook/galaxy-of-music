import {
    MAX_ZOOM,
    MIN_ZOOM,
    ZOOM_INERTIA,
    MOVE_INERTIA,
    INERTIA_THRESHOLD,
    ANIMATION_DURATION,
} from "./config.js";
import { draw } from "./draw.js";
import { easeInOutCubic } from "./utils.js";

function animate(context, canvas, camera, points, state) {
    let moved = false;

    if (state.isDragging) return;

    if (state.animatingToPoint && state.targetCamera) {
        const now = performance.now();

        if (!state.animationStartTime) {
            state.animationStartTime = now;
            state.startCamera = {
                x: camera.x,
                y: camera.y,
                zoom: camera.zoom,
            };
        }

        const elapsed = now - state.animationStartTime;
        const t = Math.min(1, elapsed / ANIMATION_DURATION);

        const targetX = state.targetCamera.x;
        const targetY = state.targetCamera.y;
        const targetZoom = state.targetCamera.zoom;

        camera.x = easeInOutCubic(camera.x, targetX, t);
        camera.y = easeInOutCubic(camera.y, targetY, t);
        camera.zoom = easeInOutCubic(camera.zoom, targetZoom, t);

        if (t >= 1) {
            camera.x = targetX;
            camera.y = targetY;
            camera.zoom = targetZoom;
            state.animatingToPoint = false;
            state.animationStartTime = null;
        }
        moved = true;
    }

    if (
        Math.abs(state.velocityX) > INERTIA_THRESHOLD ||
        Math.abs(state.velocityY) > INERTIA_THRESHOLD
    ) {
        camera.x += state.velocityX * ZOOM_INERTIA;
        camera.y += state.velocityY * ZOOM_INERTIA;

        state.velocityX *= MOVE_INERTIA;
        state.velocityY *= MOVE_INERTIA;
        moved = true;
    } else {
        state.velocityX = 0;
        state.velocityY = 0;
    }

    if (Math.abs(state.velocityZoom) > INERTIA_THRESHOLD) {
        camera.zoom *= Math.exp(state.velocityZoom * ZOOM_INERTIA);
        state.velocityZoom *= MOVE_INERTIA;
        camera.zoom = Math.min(Math.max(camera.zoom, MIN_ZOOM), MAX_ZOOM);
        moved = true;
    } else {
        state.velocityZoom = 0;
    }

    if (moved) {
        draw(context, canvas, camera, points, state);
    }
}

function startAnimation(context, canvas, camera, points, state) {
    function frame() {
        animate(context, canvas, camera, points, state);
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
}

export { startAnimation };
