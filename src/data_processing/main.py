import json
from pathlib import Path

import yaml

from src.data_processing.genre_clusterer import GenreClusterer
from src.data_processing.genre_embedder import GenreEmbedder
from src.data_processing.mst_builder import MSTBuilder
from src.data_processing.tsne_reducer import TSNEReducer

if __name__ == "__main__":
    BASE_DIR = Path(__file__).parent.resolve()
    config_path = BASE_DIR / "config.yml"
    output_dir = BASE_DIR / "output"
    output_dir.mkdir(exist_ok=True)

    with Path.open(config_path) as file:
        CONFIG = yaml.safe_load(file)

    embeddings, genres, genre_ids = GenreEmbedder().run(BASE_DIR / "genres.json")
    genre_points = TSNEReducer(CONFIG["tsne_perplexity"]).run(genres, embeddings, genre_ids)
    genre_points_clustered = GenreClusterer(
        CONFIG["top_genres"], CONFIG["clusterer_smoothing"]
    ).run(genre_points)
    mst_data = MSTBuilder().run(genre_points_clustered)

    with Path.open(output_dir / "points.json", "w", encoding="utf-8") as points_file:
        json.dump(genre_points_clustered, points_file, indent=4)

    with Path.open(output_dir / "edges.json", "w", encoding="utf-8") as edges_file:
        json.dump(mst_data, edges_file, indent=4)
