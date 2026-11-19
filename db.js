const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'comments.db');
const db = new sqlite3.Database(DB_PATH);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) return reject(error);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => (error ? reject(error) : resolve(row || null)));
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => (error ? reject(error) : resolve(rows)));
  });
}

const ready = (async () => {
  await run(`
    CREATE TABLE IF NOT EXISTS comments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id     INTEGER NOT NULL,
      author      TEXT    NOT NULL,
      content     TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await run(
    'CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments (post_id, created_at)'
  );
})();

const FIELDS = 'id, post_id, author, content, created_at';

async function getComment(id) {
  await ready;
  return get(`SELECT ${FIELDS} FROM comments WHERE id = ?`, [id]);
}

async function createComment({ postId, author, content }) {
  await ready;
  const result = await run(
    'INSERT INTO comments (post_id, author, content) VALUES (?, ?, ?)',
    [postId, author, content]
  );
  return getComment(result.lastID);
}

async function listComments({ postId, order = 'asc' } = {}) {
  await ready;
  const direction = order === 'desc' ? 'DESC' : 'ASC';
  const params = [];
  let sql = `SELECT ${FIELDS} FROM comments`;

  if (postId !== undefined) {
    sql += ' WHERE post_id = ?';
    params.push(postId);
  }

  sql += ` ORDER BY created_at ${direction}, id ${direction}`;
  return all(sql, params);
}

async function deleteComment(id) {
  await ready;
  const result = await run('DELETE FROM comments WHERE id = ?', [id]);
  return result.changes > 0;
}

module.exports = { createComment, getComment, listComments, deleteComment };
