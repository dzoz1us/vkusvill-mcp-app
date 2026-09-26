# Edimo

Планировщик питания с подбором рецептов, списком покупок и интеграцией со ВкусВилл.

## Стек

- Frontend: React 18, TypeScript, Vite, Zustand, Tailwind CSS.
- Backend: FastAPI, SQLAlchemy, Pydantic, SQLite.
- Интеграция: VkusVill MCP с кэшем, подбором товаров и ссылками на корзину.

## Быстрый запуск

Требуются Node.js 20+ и Python 3.11+.

### Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m uvicorn app.main:app --reload
```

При первом запуске база и каталог рецептов создаются автоматически. API: <http://localhost:8000>, Swagger: <http://localhost:8000/docs>.

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

Интерфейс: <http://localhost:5173>.

По умолчанию frontend использует mock-данные. Для работы с FastAPI скопируйте `frontend/.env.example` в `frontend/.env` и установите:

```dotenv
VITE_USE_MOCK=false
VITE_API_URL=
```

Пустой `VITE_API_URL` в dev-режиме включает Vite proxy на `localhost:8000`.

## Проверки

```bash
cd backend
.venv\Scripts\python -m ruff check app tests
.venv\Scripts\python -m black --check app tests
.venv\Scripts\python -m pytest -q

cd ../frontend
npm run check
npm audit --audit-level=moderate
```

## VkusVill MCP

Живая MCP-интеграция отключена по умолчанию. Для её включения скопируйте `backend/.env.example` в `backend/.env` и задайте `ENABLE_LIVE_MCP=true`.
