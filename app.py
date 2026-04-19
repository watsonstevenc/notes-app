import sqlite3
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)
DB = "notes.db"


def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row  # lets us access columns by name
    return conn


def init_db():
    with open("schema.sql") as f:
        sql = f.read()
    with get_db() as conn:
        conn.executescript(sql)


@app.route("/")
def index():
    return render_template("index.html")


# READ all notes
@app.route("/api/notes", methods=["GET"])
def get_notes():
    search = request.args.get("q", "")
    with get_db() as conn:
        if search:
            rows = conn.execute(
                "SELECT * FROM notes WHERE title LIKE ? OR body LIKE ? ORDER BY id DESC",
                (f"%{search}%", f"%{search}%")
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM notes ORDER BY id DESC"
            ).fetchall()
    return jsonify([dict(r) for r in rows])


# CREATE a note
@app.route("/api/notes", methods=["POST"])
def create_note():
    data = request.get_json()
    title = data.get("title", "").strip()
    body = data.get("body", "").strip()
    if not title or not body:
        return jsonify({"error": "Title and body are required"}), 400
    with get_db() as conn:
        cursor = conn.execute(
            "INSERT INTO notes (title, body) VALUES (?, ?)",
            (title, body)
        )
        note_id = cursor.lastrowid
        note = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
    return jsonify(dict(note)), 201


# DELETE a note
@app.route("/api/notes/<int:note_id>", methods=["DELETE"])
def delete_note(note_id):
    with get_db() as conn:
        result = conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
        if result.rowcount == 0:
            return jsonify({"error": "Note not found"}), 404
    return jsonify({"deleted": note_id})


if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5050)
