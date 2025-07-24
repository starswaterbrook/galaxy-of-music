from random import shuffle

import matplotlib.pyplot as plt
import numpy as np
from colorspacious import cspace_convert


class GenreClusterer:
    def __init__(self, top_genres: list[str], smoothing: int) -> None:
        self.top_genres = top_genres
        self.number_of_clusters = len(self.top_genres)
        self.smoothing = smoothing

    def run(
        self, genre_points: list[dict[str, str | int | float]]
    ) -> list[dict[str, str | int | float]]:
        all_points, all_labels, all_ids = self._preprocess_data(genre_points)

        cluster_centers = np.array(
            [
                point
                for point, label in zip(all_points, all_labels, strict=True)
                if label in self.top_genres
            ]
        )

        cluster_colors = self.generate_soft_tab20(self.number_of_clusters)
        shuffle(cluster_colors)

        weights = self.compute_soft_weights(all_points, cluster_centers, smoothing=self.smoothing)
        colors = np.array([self.blend_colors_all(cluster_colors, w) for w in weights])  # type: ignore[arg-type]

        clustered_genre_points = []
        for (x, y), label, color_rgb, genre_id in zip(
            all_points, all_labels, colors, all_ids, strict=True
        ):
            clustered_genre_points.append(
                {
                    "x": float(x),
                    "y": float(y),
                    "name": label,
                    "color": self.rgb_to_hex(color_rgb),
                    "id": genre_id,
                }
            )
        return clustered_genre_points  # type: ignore[return-value]

    def _preprocess_data(
        self, genre_points: list[dict[str, str | int | float]]
    ) -> tuple[np.ndarray, list[str], list[int]]:
        xs = np.array([p["x"] for p in genre_points])
        ys = np.array([p["y"] for p in genre_points])
        labels = [str(p["name"]) for p in genre_points]
        ids = [int(p["id"]) for p in genre_points]
        points = np.vstack((xs, ys)).T
        return points, labels, ids

    @staticmethod
    def rgb_to_lab(rgb: np.ndarray) -> np.ndarray:
        return cspace_convert(rgb, "sRGB1", "CIELab")

    @staticmethod
    def lab_to_rgb(lab: np.ndarray) -> np.ndarray:
        rgb = cspace_convert(lab, "CIELab", "sRGB1")
        return np.clip(rgb, 0, 1)

    @staticmethod
    def compute_soft_weights(
        points: np.ndarray, centers: np.ndarray, smoothing: float = 3.0
    ) -> np.ndarray:
        dists = np.linalg.norm(points[:, None, :] - centers[None, :, :], axis=2)
        weights = 1 / (dists**smoothing + 1e-8)
        weights /= weights.sum(axis=1, keepdims=True)
        return weights

    @staticmethod
    def blend_colors_all(cluster_colors: np.ndarray, weights: np.ndarray) -> np.ndarray:
        lab_colors = GenreClusterer.rgb_to_lab(cluster_colors)
        blended_lab = np.dot(weights, lab_colors)
        return GenreClusterer.lab_to_rgb(blended_lab)

    @staticmethod
    def soften_color(rgb: tuple[float, float, float], strength: float = 0.15) -> tuple:
        return tuple(np.clip(np.array(rgb) * (1 - strength) + strength, 0, 1))

    @staticmethod
    def generate_soft_tab20(n: int) -> list[tuple]:
        cmap = plt.get_cmap("tab20")
        base_colors = [cmap(i % 20)[:3] for i in range(n)]

        softened_colors = []
        for color in base_colors:
            if np.allclose(color, (1.0, 0.498, 0.054), atol=0.01):
                softened = GenreClusterer.soften_color(color, strength=0.4)
            else:
                softened = GenreClusterer.soften_color(color, strength=0.01)
            softened_colors.append(softened)

        return softened_colors

    @staticmethod
    def rgb_to_hex(rgb: list[float]) -> str:
        return f"#{int(rgb[0] * 255):02x}{int(rgb[1] * 255):02x}{int(rgb[2] * 255):02x}"
