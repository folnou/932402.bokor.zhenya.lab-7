# Лабораторная работа №7 (Вариант 6 Комментарии к посту)

**Выполнил:** Бокор Евгений вариант 6

Веб-приложение с REST API на Express и базой данных SQLite для хранения комментариев к постам (связь через `post\\\_id`).

## Что реализовано по заданию

* Создана база данных SQLite (`comments.db`) и таблица `comments` (`id`, `post\\\_id`, `author`, `content`, `created\\\_at`).
* Реализованы модульные CRUD-функции в файле `db.js` (`createComment`, `listComments`, `deleteComment`). Функции обновления нет, так как по заданию PUT не реализуется.
* Настроены маршруты Express: `GET /api/comments`, `POST /api/comments`, `DELETE /api/comments/:id`.
* Фильтрация по query-параметру `?post\\\_id=5`, сортировка по дате создания (по умолчанию старые сверху, `?order=desc` для обратного порядка).
* Пустой `content` возвращает ошибку `400`. Несуществующий `post\\\_id` ошибкой не считается: возвращается пустой список.
* Для проверки добавлена простая страница в папке `public`.

## Стек и библиотеки

* Node.js
* Express (`express`)
* SQLite (`sqlite3`)
* HTML, CSS, Vanilla JS

## Команды для запуска

1. Установить зависимости: `npm install express sqlite3`
2. Запустить сервер: `node server.js`
3. Открыть в браузере: `http://localhost:5252`

## Структура

```
server.js        маршруты Express и проверка данных
db.js            подключение к SQLite, таблица и CRUD-функции
package.json
.gitignore
public/
  index.html
  style.css
  app.js
```

## Маршруты

|Метод|Путь|Описание|
|-|-|-|
|GET|`/api/comments`|Все комментарии|
|GET|`/api/comments?post\\\_id=5`|Комментарии одного поста|
|POST|`/api/comments`|Создать комментарий|
|DELETE|`/api/comments/:id`|Удалить комментарий|

Тело POST: `{ "post\\\_id": 5, "author": "Анна", "content": "Текст" }`. Поле `author` необязательно (по умолчанию `Anonymous`).

## Примеры запросов

```bash
curl -X POST http://localhost:1500/api/comments -H "Content-Type: application/json" -d '{"post\\\_id":5,"author":"Анна","content":"Привет!"}'
curl "http://localhost:5252/api/comments?post\\\_id=5"
curl -i -X DELETE http://localhost:5252/api/comments/1
curl -i -X POST http://localhost:5252/api/comments -H "Content-Type: application/json" -d '{"post\\\_id":5,"content":"   "}'
```

Коды ответов: `200` список, `201` создано, `204` удалено, `400` ошибка данных, `404` комментарий не найден.

