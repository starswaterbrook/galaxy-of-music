from flask import Flask, Response, abort, jsonify, render_template

from src.utils import initialize_genre_data

app = Flask(__name__)

GENRES_DATA = initialize_genre_data(app)


@app.route("/")
def index() -> str:
    return render_template("index.html")


@app.route("/api/genre/<int:genre_id>")
def get_genre_by_id(genre_id: int) -> Response:
    genre = next((genre for genre in GENRES_DATA if genre["id"] == genre_id), None)
    if genre:
        return jsonify(genre)
    abort(404, description="Genre not found")
    return None


if __name__ == "__main__":
    app.run()
