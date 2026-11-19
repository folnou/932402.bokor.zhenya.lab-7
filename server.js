const path = require('path');
const express = require('express');
const { createComment, listComments, deleteComment } = require('./db');

const app = express();
const PORT = process.env.PORT || 5252;

const MAX_AUTHOR_LENGTH = 100;
const MAX_CONTENT_LENGTH = 2000;
const DEFAULT_AUTHOR = 'Anonymous';

function parsePositiveInt(value) {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  }
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

function validateNewComment(body) {
  const source = body && typeof body === 'object' ? body : {};

  const postId = parsePositiveInt(source.post_id);
  if (postId === null) {
    return { error: 'post_id must be a positive integer' };
  }

  if (typeof source.content !== 'string' || source.content.trim() === '') {
    return { error: 'Content must not be empty' };
  }
  const content = source.content.trim();
  if (content.length > MAX_CONTENT_LENGTH) {
    return { error: `Content must not exceed ${MAX_CONTENT_LENGTH} characters` };
  }

  let author = DEFAULT_AUTHOR;
  if (source.author !== undefined && source.author !== null) {
    if (typeof source.author !== 'string') {
      return { error: 'Author must be a string' };
    }
    const trimmed = source.author.trim();
    if (trimmed.length > MAX_AUTHOR_LENGTH) {
      return { error: `Author must not exceed ${MAX_AUTHOR_LENGTH} characters` };
    }
    if (trimmed !== '') author = trimmed;
  }

  return { value: { postId, author, content } };
}

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get(
  '/api/comments',
  asyncHandler(async (req, res) => {
    const options = {};

    if (req.query.post_id !== undefined) {
      const postId = parsePositiveInt(req.query.post_id);
      if (postId === null) {
        return res.status(400).json({ error: 'post_id must be a positive integer' });
      }
      options.postId = postId;
    }

    if (req.query.order !== undefined) {
      if (req.query.order !== 'asc' && req.query.order !== 'desc') {
        return res.status(400).json({ error: 'order must be asc or desc' });
      }
      options.order = req.query.order;
    }

    res.json(await listComments(options));
  })
);

app.post(
  '/api/comments',
  asyncHandler(async (req, res) => {
    const result = validateNewComment(req.body);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    const comment = await createComment(result.value);
    res.status(201).location(`/api/comments/${comment.id}`).json(comment);
  })
);

app.delete(
  '/api/comments/:id',
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: 'id must be a positive integer' });
    }

    if (!(await deleteComment(id))) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.status(204).end();
  })
);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload too large' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API запущен: http://localhost:${PORT}`);
  });
}

module.exports = app;
