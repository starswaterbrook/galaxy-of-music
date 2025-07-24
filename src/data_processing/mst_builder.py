import math

from networkx import Graph, minimum_spanning_tree


class MSTBuilder:
    def __init__(self) -> None:
        self.graph: Graph | None = None

    def run(self, genre_points: list[dict[str, str | float]]) -> list[dict[str, str | float]]:
        self.graph = self._build_graph_from_genre_points(genre_points)
        mst = minimum_spanning_tree(self.graph, algorithm="kruskal")  # type: ignore[assignment, call-overload]
        return [
            {
                "source": {"x": genre_points[u]["x"], "y": genre_points[u]["y"]},  # type: ignore[dict-item]
                "target": {"x": genre_points[v]["x"], "y": genre_points[v]["y"]},  # type: ignore[dict-item]
                "color": genre_points[u]["color"],
            }
            for u, v in mst.edges()
        ]

    def _build_graph_from_genre_points(self, genre_points: list[dict[str, str | float]]) -> Graph:
        graph: Graph = Graph()
        for i, point in enumerate(genre_points):
            graph.add_node(i, **point)

        for i in range(len(genre_points)):
            for j in range(i + 1, len(genre_points)):
                d = self.distance(genre_points[i], genre_points[j])
                graph.add_edge(i, j, weight=d)

        return graph

    @staticmethod
    def distance(p1: dict[str, str | float], p2: dict[str, str | float]) -> float:
        return math.sqrt((p1["x"] - p2["x"]) ** 2 + (p1["y"] - p2["y"]) ** 2)  # type: ignore[operator]
