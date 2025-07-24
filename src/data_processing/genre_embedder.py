import json
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer
from torch import Tensor


class GenreEmbedder:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2") -> None:
        self.model = SentenceTransformer(model_name)

    def _load_genres(self, genres_path: Path) -> list[dict[str, str | int]]:
        with Path.open(genres_path, "r", encoding="utf-8") as genre_file:
            return json.load(genre_file)

    def _embed_genre(self, genre: dict[str, str | int]) -> Tensor:
        text = f"{genre['name']}: {genre['description']}"
        return self.model.encode(text)

    def run(self, genres_path: Path) -> tuple[np.ndarray, list[str], list[str]]:
        genre_data = self._load_genres(genres_path)
        embedded = []
        labels = []
        genre_ids = []
        for genre in genre_data:
            vector = self._embed_genre(genre)
            embedded.append(vector)
            labels.append(str(genre["name"]))
            genre_ids.append(str(genre["id"]))
        return np.array(embedded), labels, genre_ids
