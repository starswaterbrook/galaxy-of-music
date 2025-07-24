import json
from pathlib import Path

from flask import Flask


def initialize_genre_data(app: Flask) -> list[dict]:
    genres_path = Path(app.static_folder or "static") / "data" / "genres.json"
    try:
        with Path.open(genres_path, encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        error_message = f"Failed to load genres data: {e}"
        raise RuntimeError(error_message) from e
