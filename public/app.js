const list = document.getElementById('list');
const filterInput = document.getElementById('filter-post');
const errorBox = document.getElementById('error');
const form = document.getElementById('comment-form');

async function loadComments() {
  const query = filterInput.value ? `?post_id=${encodeURIComponent(filterInput.value)}` : '';
  const response = await fetch(`/api/comments${query}`);
  const data = await response.json();
  list.replaceChildren();

  if (!response.ok) {
    errorBox.textContent = data.error;
    return;
  }

  if (data.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'Комментариев пока нет';
    list.append(empty);
    return;
  }

  data.forEach((comment) => {
    const item = document.createElement('li');
    const head = document.createElement('header');

    const meta = document.createElement('span');
    meta.textContent = `#${comment.id} · пост ${comment.post_id} · ${comment.author} · ${comment.created_at}`;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'delete';
    removeBtn.textContent = 'Удалить';
    removeBtn.addEventListener('click', async () => {
      await fetch(`/api/comments/${comment.id}`, { method: 'DELETE' });
      loadComments();
    });

    head.append(meta, removeBtn);

    const text = document.createElement('p');
    text.textContent = comment.content;

    item.append(head, text);
    list.append(item);
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.textContent = '';

  const response = await fetch('/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      post_id: Number(document.getElementById('post-id').value),
      author: document.getElementById('author').value,
      content: document.getElementById('content').value
    })
  });

  if (!response.ok) {
    const data = await response.json();
    errorBox.textContent = data.error;
    return;
  }

  document.getElementById('content').value = '';
  loadComments();
});

filterInput.addEventListener('input', loadComments);
loadComments();
