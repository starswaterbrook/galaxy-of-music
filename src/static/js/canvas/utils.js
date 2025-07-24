import { TEXT_HEIGHT, TARGET_ZOOM } from "./config.js";

function centerCamera(points, camera) {
    if (points.length === 0) return;
    let xs = points.map((p) => p.x);
    let ys = points.map((p) => p.y);
    camera.x = (Math.min(...xs) + Math.max(...xs)) / 2;
    camera.y = (Math.min(...ys) + Math.max(...ys)) / 2;
}

function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

function toScreen(x, y, camera, canvas) {
    return [
        (x - camera.x) * camera.zoom + canvas.width / 2,
        (y - camera.y) * camera.zoom + canvas.height / 2,
    ];
}

function easeInOutCubic(start, end, t) {
    t = Math.max(0, Math.min(1, t));

    const easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    return start + (end - start) * easedT;
}

function resetCameraState(state, resetVelocity = true) {
    state.isDragging = false;
    state.animatingToPoint = false;
    state.targetCamera = null;
    state.animationStartTime = null;

    if (resetVelocity) {
        state.velocityX = 0;
        state.velocityY = 0;
        state.velocityZoom = 0;
    }
}

function getNearestPoint(positionX, positionY, points, maxDistance = Infinity) {
    let nearest = null;
    let minDistSq = maxDistance * maxDistance;
    let nearestBox = null;

    for (const point of points) {
        const dxOffset = point.screenDx || 0;
        const dyOffset = point.screenDy || 0;
        const halfWidth = point.textWidth / 2;

        const left = point.screenX - halfWidth + dxOffset;
        const right = point.screenX + halfWidth + dxOffset;
        const top = point.screenY - TEXT_HEIGHT / 2 + dyOffset;
        const bottom = point.screenY + TEXT_HEIGHT / 2 + dyOffset;

        const clampedX = Math.max(left, Math.min(positionX, right));
        const clampedY = Math.max(top, Math.min(positionY, bottom));

        const dx = positionX - clampedX;
        const dy = positionY - clampedY;
        const distSq = dx * dx + dy * dy;

        if (distSq < minDistSq) {
            nearest = point;
            minDistSq = distSq;
            nearestBox = { left, right, top, bottom };
        }
    }

    if (nearest) {
        return {
            point: nearest,
            box: nearestBox,
        };
    }

    return {
        point: null,
        box: null,
    };
}
function updateSelectedPoint(point, infoBox, state) {
    if (point) {
        const infoTitle = infoBox.querySelector(".info-title");
        const infoContent = infoBox.querySelector(".info-content");
        const infoLink = infoBox.querySelector(".info-link");

        infoTitle.textContent = point.name;
        infoContent.textContent = "Loading...";
        infoLink.href = `https://volt.fm`;

        infoBox.style.display = "flex";

        fetch(`/api/genre/${point.id}`)
            .then((res) =>
                res.ok ? res.json() : Promise.reject("Genre not found"),
            )
            .then((data) => {
                infoContent.textContent =
                    data.description || "No description available.";
            })
            .catch(() => {
                infoContent.textContent = "Failed to load description.";
            });

        infoLink.href += `genre/${point.id}`;
        state.targetCamera = {
            x: point.x,
            y: point.y,
            zoom: TARGET_ZOOM,
        };
        state.animatingToPoint = true;
    } else {
        state.targetCamera = null;
        state.animatingToPoint = false;
    }
}

function normalizeText(str) {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

export {
    centerCamera,
    toScreen,
    resetCameraState,
    easeInOutCubic,
    getNearestPoint,
    updateSelectedPoint,
    debounce,
    normalizeText,
};
