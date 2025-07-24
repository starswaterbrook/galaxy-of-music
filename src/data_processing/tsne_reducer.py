import numpy as np
from sklearn.manifold import TSNE


class TSNEReducer:
    def __init__(self, perplexity: int, dimensions: int = 2) -> None:
        self.perplexity = perplexity
        self.dimensions = dimensions

    def run(self, genres: list[str], embeddings: np.ndarray, ids: list[str]) -> list[dict]:
        tsne = TSNE(n_components=self.dimensions, perplexity=self.perplexity)
        reduced_embeddings = tsne.fit_transform(embeddings)

        points = []
        for genre, embedding, genre_id in zip(genres, reduced_embeddings, ids, strict=True):
            points.append({"x": embedding[0], "y": embedding[1], "name": genre, "id": genre_id})
        return points
