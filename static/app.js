const titleInput  = document.getElementById("title");
const bodyInput   = document.getElementById("body");
const addBtn      = document.getElementById("add-btn");
const searchInput = document.getElementById("search");
const clearBtn    = document.getElementById("clear-btn");
const notesList   = document.getElementById("notes-list");
const searchHint  = document.getElementById("search-hint");

// ── Fetch & render notes (SELECT) ────────────────────────────────────────────
async function loadNotes(query = "") {
    const url = query ? `/api/notes?q=${encodeURIComponent(query)}` : "/api/notes";

    if (query) {
        searchHint.innerHTML = `SQL: <code>SELECT * FROM notes WHERE title LIKE '%${query}%' OR body LIKE '%${query}%'</code>`;
    } else {
        searchHint.innerHTML = `SQL: <code>SELECT * FROM notes ORDER BY id DESC</code>`;
    }

    const res   = await fetch(url);
    const notes = await res.json();

    if (notes.length === 0) {
        notesList.innerHTML = `<p class="empty-state">${query ? "No notes match your search." : "No notes yet — add one above!"}</p>`;
        return;
    }

    notesList.innerHTML = notes.map(note => `
        <div class="note-card" id="note-${note.id}">
            <div class="note-content">
                <div class="note-title">${escapeHtml(note.title)}</div>
                <div class="note-body">${escapeHtml(note.body)}</div>
                <div class="note-date">${note.created}</div>
            </div>
            <button class="delete-btn" onclick="deleteNote(${note.id})">Delete</button>
        </div>
    `).join("");
}

// ── Create a note (INSERT) ───────────────────────────────────────────────────
addBtn.addEventListener("click", async () => {
    const title = titleInput.value.trim();
    const body  = bodyInput.value.trim();
    if (!title || !body) {
        alert("Please fill in both a title and a body.");
        return;
    }

    const res = await fetch("/api/notes", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title, body }),
    });

    if (res.ok) {
        titleInput.value = "";
        bodyInput.value  = "";
        loadNotes(searchInput.value.trim());
    } else {
        const err = await res.json();
        alert(err.error);
    }
});

// ── Delete a note (DELETE) ───────────────────────────────────────────────────
async function deleteNote(id) {
    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (res.ok) {
        document.getElementById(`note-${id}`).remove();
        if (notesList.children.length === 0) loadNotes(searchInput.value.trim());
    }
}

// ── Search (SELECT with WHERE LIKE) ─────────────────────────────────────────
let searchTimer;
searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => loadNotes(searchInput.value.trim()), 300);
});

clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    loadNotes();
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function escapeHtml(str) {
    return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// Initial load
loadNotes();
