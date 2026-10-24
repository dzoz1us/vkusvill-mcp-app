# Менюшка: фронтенд

React 18 + TypeScript + Vite + Tailwind CSS 4. Архитектура FSD: `app / pages / widgets / features / entities / shared` (импорты через `@/`).

## Запуск

    npm install
    npm run dev

Откройте http://localhost:5173. Запросы `/api` проксируются на бэкенд (`http://localhost:8000`, см. `vite.config.js`), поэтому сначала запустите `backend-java` и PostgreSQL (см. корневой README) или всё сразу командой `docker compose up --build`.

## Команды

* `npm run dev` — разработка
* `npm run build` — сборка в `dist/`
* `npm run typecheck` — проверка типов

## Устройство

* `shared/api` — HTTP-клиент с JWT и типы ответов бэкенда.
* `shared/ui` — общие компоненты: значки, иллюстрации, логотип, окно, плашки.
* `entities/` — пользователь, уведомления, план, рецепт, блюдо, позиция списка покупок.
* `features/` — вход, избранное, правка блюд и списка покупок, сбор корзины, параметры мастера.
* `widgets/` — оболочка с нижним меню, мастер, список покупок, дни плана.
* `pages/` — главная, мастер, каталог, рецепт, планы, список покупок, корзина, заказы, профиль, админка.

Иллюстрации блюд, овощей и продуктов нарисованы в SVG (`shared/ui/dish-art`, `produce`, `art`). Фото блюд лежат в `shared/assets/dishes` (Pexels, ссылки в `CREDITS.md`).
