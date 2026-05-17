import { useEffect, useRef, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { Task } from "./types";

/* ─── helpers ─────────────────────────────────────────────────── */
const COL_META: Record<
  Task["status"],
  { label: string; dotColor: string; accent: string }
> = {
  todo:  { label: "À faire",   dotColor: "#888780", accent: "#888780" },
  doing: { label: "En cours",  dotColor: "#378ADD", accent: "#378ADD" },
  done:  { label: "Terminé",   dotColor: "#639922", accent: "#639922" },
};

const COLUMNS: Task["status"][] = ["todo", "doing", "done"];

/* ─── TaskCard ─────────────────────────────────────────────────── */
function TaskCard({
  task,
  onMove,
  onDelete,
}: {
  task: Task;
  onMove: (id: string, status: Task["status"]) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="task-card">
      <p className="task-title">{task.title}</p>
      <div className="task-actions">
        {task.status !== "todo" && (
          <button className="act-btn back" onClick={() => onMove(task.id, "todo")}>
            ← todo
          </button>
        )}
        {task.status !== "doing" && (
          <button className="act-btn start" onClick={() => onMove(task.id, "doing")}>
            start →
          </button>
        )}
        {task.status !== "done" && (
          <button className="act-btn done" onClick={() => onMove(task.id, "done")}>
            ✓ done
          </button>
        )}
        <button
          className="del-btn"
          onClick={() => onDelete(task.id)}
          aria-label="Supprimer la tâche"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/* ─── App ──────────────────────────────────────────────────────── */
function App() {
  const [tasks, setTasks]   = useState<Task[]>([]);
  const [title, setTitle]   = useState("");
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Firebase realtime listener */
  useEffect(() => {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const addTask = async () => {
    if (!title.trim()) return;
    await addDoc(collection(db, "tasks"), {
      title: title.trim(),
      status: "todo",
      createdAt: Date.now(),
    });
    setTitle("");
    inputRef.current?.focus();
  };

  const updateStatus = async (id: string, status: Task["status"]) => {
    await updateDoc(doc(db, "tasks", id), { status });
  };

  const deleteTask = async (id: string) => {
    await deleteDoc(doc(db, "tasks", id));
  };

  const grouped = {
    todo:  tasks.filter((t) => t.status === "todo"),
    doing: tasks.filter((t) => t.status === "doing"),
    done:  tasks.filter((t) => t.status === "done"),
  };

  const total     = tasks.length;
  const doneCount = grouped.done.length;
  const progress  = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Syne:wght@400;500;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Syne', sans-serif;
          background: #f5f4f0;
          color: #1a1a18;
          min-height: 100vh;
        }

        .app {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
        }

        /* ── Header ── */
        .header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }

        .sprint-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #5f5e5a;
          background: #ebebea;
          border: 0.5px solid #d3d1c7;
          border-radius: 4px;
          padding: 4px 10px;
          margin-bottom: 8px;
        }

        .sprint-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #639922;
          display: inline-block;
        }

        .app-title {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: #1a1a18;
        }

        .app-subtitle {
          font-size: 13px;
          color: #888780;
          margin-top: 2px;
        }

        /* ── Stats ── */
        .stats {
          display: flex;
          gap: 8px;
        }

        .stat {
          background: #fff;
          border: 0.5px solid #d3d1c7;
          border-radius: 8px;
          padding: 8px 16px;
          text-align: center;
          min-width: 64px;
        }

        .stat-num {
          font-size: 20px;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
          color: #1a1a18;
        }

        .stat-num.blue  { color: #185fa5; }
        .stat-num.green { color: #3b6d11; }

        .stat-label {
          font-size: 11px;
          color: #888780;
          margin-top: 1px;
        }

        /* ── Progress ── */
        .progress-wrap {
          margin-bottom: 1.25rem;
        }

        .progress-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #888780;
          margin-bottom: 6px;
          font-family: 'JetBrains Mono', monospace;
        }

        .progress-bar {
          height: 4px;
          background: #d3d1c7;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #639922;
          border-radius: 2px;
          transition: width 0.4s ease;
        }

        /* ── Add bar ── */
        .add-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 1.5rem;
        }

        .add-bar input {
          flex: 1;
          height: 40px;
          background: #fff;
          border: 0.5px solid #b4b2a9;
          border-radius: 8px;
          padding: 0 14px;
          font-size: 14px;
          font-family: 'Syne', sans-serif;
          color: #1a1a18;
          outline: none;
          transition: border-color 0.15s;
        }

        .add-bar input:focus {
          border-color: #888780;
        }

        .add-bar input::placeholder {
          color: #b4b2a9;
        }

        .add-btn {
          height: 40px;
          padding: 0 20px;
          background: #eaf3de;
          border: 0.5px solid #c0dd97;
          border-radius: 8px;
          color: #3b6d11;
          font-size: 13px;
          font-family: 'Syne', sans-serif;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.15s;
          white-space: nowrap;
        }

        .add-btn:hover   { opacity: 0.75; }
        .add-btn:active  { transform: scale(0.98); }

        /* ── Board ── */
        .board {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        @media (max-width: 640px) {
          .board { grid-template-columns: 1fr; }
          .stats  { display: none; }
        }

        /* ── Column ── */
        .col {
          background: #fff;
          border: 0.5px solid #d3d1c7;
          border-radius: 12px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-height: 340px;
        }

        .col-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .col-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
        }

        .col-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .col-count {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #888780;
          background: #f5f4f0;
          border: 0.5px solid #d3d1c7;
          border-radius: 4px;
          padding: 2px 8px;
        }

        .col-tasks {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        /* ── Task card ── */
        .task-card {
          background: #fafaf8;
          border: 0.5px solid #d3d1c7;
          border-radius: 8px;
          padding: 10px 12px;
          transition: border-color 0.15s;
          animation: slideIn 0.2s ease;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .task-card:hover { border-color: #b4b2a9; }

        .task-title {
          font-size: 13px;
          color: #1a1a18;
          margin-bottom: 8px;
          line-height: 1.45;
        }

        .task-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .act-btn {
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
          padding: 3px 8px;
          border-radius: 4px;
          border: 0.5px solid #d3d1c7;
          cursor: pointer;
          background: transparent;
          color: #888780;
          transition: all 0.12s;
          white-space: nowrap;
        }

        .act-btn:hover { border-color: #b4b2a9; color: #1a1a18; }

        .act-btn.start { color: #185fa5; border-color: #b5d4f4; }
        .act-btn.start:hover { background: #e6f1fb; }

        .act-btn.done  { color: #3b6d11; border-color: #c0dd97; }
        .act-btn.done:hover  { background: #eaf3de; }

        .del-btn {
          margin-left: auto;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #b4b2a9;
          font-size: 13px;
          padding: 2px 4px;
          border-radius: 4px;
          line-height: 1;
          transition: color 0.12s;
        }

        .del-btn:hover { color: #a32d2d; }

        /* ── Empty state ── */
        .empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 2rem 0;
        }

        .empty-icon  { font-size: 22px; color: #d3d1c7; }
        .empty-text  { font-size: 12px; color: #b4b2a9; }

        /* ── Loading ── */
        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          font-size: 13px;
          color: #888780;
          font-family: 'JetBrains Mono', monospace;
          gap: 8px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #d3d1c7;
          border-top-color: #639922;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="app">

        {/* ── Header ── */}
        <div className="header">
          <div>
            <div className="sprint-badge">
              <span className="sprint-dot" />
              Sprint 1 — actif
            </div>
            <h1 className="app-title">INF4178 Scrum Tracker</h1>
            <p className="app-subtitle">Sprint Backlog · temps réel</p>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="stat-num">{total}</div>
              <div className="stat-label">total</div>
            </div>
            <div className="stat">
              <div className="stat-num blue">{grouped.doing.length}</div>
              <div className="stat-label">en cours</div>
            </div>
            <div className="stat">
              <div className="stat-num green">{doneCount}</div>
              <div className="stat-label">terminé</div>
            </div>
          </div>
        </div>

        {/* ── Progress ── */}
        <div className="progress-wrap">
          <div className="progress-meta">
            <span>progression sprint</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* ── Add bar ── */}
        <div className="add-bar">
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Nouvelle tâche du sprint..."
            maxLength={120}
          />
          <button className="add-btn" onClick={addTask}>
            + Ajouter
          </button>
        </div>

        {/* ── Board ── */}
        {loading ? (
          <div className="loading">
            <div className="spinner" />
            Chargement depuis Firebase…
          </div>
        ) : (
          <div className="board">
            {COLUMNS.map((col) => {
              const meta = COL_META[col];
              const list = grouped[col];
              return (
                <div className="col" key={col}>
                  <div className="col-header">
                    <div className="col-label">
                      <span
                        className="col-dot"
                        style={{ background: meta.dotColor }}
                      />
                      {meta.label}
                    </div>
                    <span className="col-count">{list.length}</span>
                  </div>

                  <div className="col-tasks">
                    {list.length === 0 ? (
                      <div className="empty">
                        <span className="empty-icon">◻</span>
                        <span className="empty-text">Aucune tâche</span>
                      </div>
                    ) : (
                      list.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onMove={updateStatus}
                          onDelete={deleteTask}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default App;