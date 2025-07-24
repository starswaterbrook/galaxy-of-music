import {
    centerCamera,
    resetCameraState,
    getNearestPoint,
    updateSelectedPoint,
    debounce,
    normalizeText,
} from "./utils.js";
import {
    MAX_ZOOM,
    MIN_ZOOM,
    ZOOM_FACTOR,
    STARTING_ZOOM,
    TEXT_HEIGHT,
    TEXT_RENDER_THRESHOLD,
    CLICK_DISTANCE_THRESHOLD,
    SEARCH_QUERY_DEBOUNCE,
    RESIZE_DEBOUNCE,
} from "./config.js";
import { draw } from "./draw.js";
import { startAnimation } from "./animate.js";

const luckyButton = document.getElementById("feeling-lucky");
const infoBox = document.getElementById("info-box");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

context.textAlign = "center";
context.textBaseline = "middle";
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let pointsRaw = [];
let camera = { x: 0, y: 0, zoom: STARTING_ZOOM };

const input = document.getElementById("search-input");
const suggestionsBox = document.getElementById("suggestions");

let state = {
    velocityX: 0,
    velocityY: 0,
    velocityZoom: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    points: [],
    edges: [],
    targetCamera: null,
    animatingToPoint: false,
    animationStartTime: null,
};

Promise.all([
    fetch("/static/data/edges.json").then((res) => res.json()),
    fetch("/static/data/points.json").then((res) => res.json()),
])
    .then(([edgesData, pointsData]) => {
        state.edges = edgesData;
        pointsRaw = pointsData.map((p) => ({ ...p }));
        centerCamera(pointsRaw, camera);
        draw(context, canvas, camera, pointsRaw, state);
        startAnimation(context, canvas, camera, pointsRaw, state);
    })
    .catch((error) => {
        console.error("Failed to load data:", error);
    });

canvas.addEventListener("mousedown", (e) => {
    resetCameraState(state);
    state.isDragging = true;
    state.animatingToPoint = false;

    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.mouseDownX = e.clientX;
    state.mouseDownY = e.clientY;

    state.velocityX = 0;
    state.velocityY = 0;
    state.velocityZoom = 0;
});

canvas.addEventListener("mouseup", (e) => {
    resetCameraState(state, false);

    const dx = e.clientX - state.mouseDownX;
    const dy = e.clientY - state.mouseDownY;
    const distSq = dx * dx + dy * dy;

    if (
        distSq <= CLICK_DISTANCE_THRESHOLD * CLICK_DISTANCE_THRESHOLD &&
        camera.zoom >= TEXT_RENDER_THRESHOLD
    ) {
        const { point, box } = getNearestPoint(
            e.clientX,
            e.clientY,
            state.points,
        );
        if (point && box) {
            const isInside =
                e.clientX >= box.left - TEXT_HEIGHT / 4 &&
                e.clientX <= box.right + TEXT_HEIGHT / 4 &&
                e.clientY >= box.top - TEXT_HEIGHT / 8 &&
                e.clientY <= box.bottom + TEXT_HEIGHT / 8;

            if (isInside) {
                updateSelectedPoint(point, infoBox, state);
                state.animatingToPoint = true;
            }
        }
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (state.isDragging) {
        let dx = (e.clientX - state.lastX) / camera.zoom;
        let dy = (e.clientY - state.lastY) / camera.zoom;

        camera.x -= dx;
        camera.y -= dy;

        state.velocityX = -dx;
        state.velocityY = -dy;

        state.lastX = e.clientX;
        state.lastY = e.clientY;
        for (let p of pointsRaw) {
            p.screenDx = 0;
            p.screenDy = 0;
        }
        draw(context, canvas, camera, pointsRaw, state);
    }
});

canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    resetCameraState(state);
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const worldX = (mouseX - canvas.width / 2) / camera.zoom + camera.x;
    const worldY = (mouseY - canvas.height / 2) / camera.zoom + camera.y;

    if (e.deltaY < 0 && camera.zoom >= MAX_ZOOM) return;
    if (e.deltaY > 0 && camera.zoom <= MIN_ZOOM) return;

    let zoomDelta;
    if (e.deltaY < 0) {
        camera.zoom *= ZOOM_FACTOR;
        zoomDelta = Math.log(ZOOM_FACTOR);
    } else {
        camera.zoom /= ZOOM_FACTOR;
        zoomDelta = -Math.log(ZOOM_FACTOR);
    }
    camera.x = worldX - (mouseX - canvas.width / 2) / camera.zoom;
    camera.y = worldY - (mouseY - canvas.height / 2) / camera.zoom;

    state.velocityZoom = zoomDelta;
    draw(context, canvas, camera, pointsRaw, state);
});

luckyButton.addEventListener("click", () => {
    resetCameraState(state);

    const randomIndex = Math.floor(Math.random() * pointsRaw.length);
    const point = pointsRaw[randomIndex];

    updateSelectedPoint(point, infoBox, state);
    state.animatingToPoint = true;
});

input.addEventListener(
    "input",
    debounce(() => {
        const query = input.value.trim();
        const normQuery = normalizeText(query);

        if (normQuery.length < 3) {
            suggestionsBox.style.display = "none";
            return;
        }

        const matches = pointsRaw
            .filter((g) => normalizeText(g.name).includes(normQuery))
            .sort((a, b) => {
                const aName = normalizeText(a.name);
                const bName = normalizeText(b.name);
                const aStarts = aName.startsWith(normQuery);
                const bStarts = bName.startsWith(normQuery);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                return aName.localeCompare(bName);
            })
            .slice(0, 3);

        suggestionsBox.innerHTML = "";

        matches.forEach((match) => {
            const div = document.createElement("div");
            div.textContent = match.name;
            div.onclick = () => {
                console.log("Selected genre:", match);
                suggestionsBox.style.display = "none";
                input.value = "";

                updateSelectedPoint(match, infoBox, state);
                state.animatingToPoint = true;
            };
            suggestionsBox.appendChild(div);
        });

        suggestionsBox.style.display = matches.length ? "block" : "none";
    }, SEARCH_QUERY_DEBOUNCE),
);

window.addEventListener(
    "resize",
    debounce(() => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        draw(context, canvas, camera, pointsRaw, state);
    }, RESIZE_DEBOUNCE),
);
