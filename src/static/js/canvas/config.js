const STARTING_ZOOM = 2.5;
const MAX_ZOOM = 1000;
const MIN_ZOOM = 2.5;
const ZOOM_FACTOR = 1.03;
const VIEWPORT_MARGIN = 100;
const ZOOM_REPULSION_THRESHOLD = 400; // zoom level at which repulsion starts
const TARGET_ZOOM = 800; // target zoom level when focused on a point
const FONT_SIZE = 16;
const FONT_NAME = "Source Code Pro";
const TEXT_PADDING = 4;
const TEXT_HEIGHT = FONT_SIZE + TEXT_PADDING * 2;
const TEXT_RENDER_THRESHOLD = 20; // minimum zoom to render text
const EDGE_ALPHA_MULTIPLIER = 0.3;

const RESIZE_DEBOUNCE = 200; // debounce time for resize events
const ZOOM_INERTIA = 0.93; // 0-1, 1 = no friction, 0 = instant stop
const MOVE_INERTIA = 0.95; // 0-1, 1 = no friction, 0 = instant stop
const INERTIA_THRESHOLD = 0.0001; // minimum velocity to consider inertia

const ANIMATION_DURATION = 800; // duration of animation to a point in ms
const CLICK_DISTANCE_THRESHOLD = 5; // distance threshold between last mouse position for click detection

const SEARCH_QUERY_DEBOUNCE = 150;

export {
    STARTING_ZOOM,
    MAX_ZOOM,
    MIN_ZOOM,
    ZOOM_FACTOR,
    VIEWPORT_MARGIN,
    ZOOM_INERTIA,
    MOVE_INERTIA,
    INERTIA_THRESHOLD,
    TEXT_RENDER_THRESHOLD,
    FONT_SIZE,
    TEXT_PADDING,
    TEXT_HEIGHT,
    FONT_NAME,
    ZOOM_REPULSION_THRESHOLD,
    CLICK_DISTANCE_THRESHOLD,
    TARGET_ZOOM,
    RESIZE_DEBOUNCE,
    SEARCH_QUERY_DEBOUNCE,
    EDGE_ALPHA_MULTIPLIER,
    ANIMATION_DURATION,
};
