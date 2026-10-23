# Edimo

Планировщик питания с подбором рецептов, списком покупок и интеграцией со ВкусВилл.

## 🛠 Стек

* **Frontend:** React 18, TypeScript, Vite, Zustand, Tailwind CSS.
* **Backend:** Java 21, Spring Boot 3.3, Spring Data JPA, Hibernate 6, Flyway, SQLite.
* **Интеграция:** VkusVill MCP (JSON-RPC 2.0) с кэшем товаров, подбором фасовок и генерацией share_basket-ссылок.

## 📂 Структура репозитория

* `backend-java/` — Актуальный backend на Java
* `backend/` — Python-версия (архив, для сравнения, не используется)
* `frontend/` — React-приложение
* `docs/` — Документация (архитектура, API, ERD)

## 🚀 Быстрый запуск

Требуются **JDK 21**, **Maven 3.9+** и **Node.js 20+**.

### Backend (Java)

Перейди в папку бэкенда:

    cd backend-java

Собери проект:

    mvn clean package -DskipTests

Первичное наполнение БД (41 ингредиент, 64 рецепта). *После сидинга процесс завершится — это нормально.*

    java -jar target/vkusplan-backend-0.1.0.jar --spring.profiles.active=seed

Запуск приложения на порту 8000:

    java -jar target/vkusplan-backend-0.1.0.jar

*Миграции схемы БД применяются автоматически через Flyway при старте. API доступно по адресу: `http://localhost:8000`.*

### Frontend

    cd frontend
    npm ci
    npm run dev

Интерфейс будет доступен по адресу: `http://localhost:5173`.

По умолчанию frontend использует mock-данные. Для работы с Java backend скопируй `frontend/.env.example` в `frontend/.env` и установи:

    VITE_USE_MOCK=false
    VITE_API_URL=

*Пустой `VITE_API_URL` в dev-режиме включает Vite proxy на `localhost:8000`.*

## ✅ Проверки

### Backend

    cd backend-java
    mvn clean test

Backend-тесты покрывают расчётное ядро (QuantityService, GroceryService, PricingService), алгоритм планирования (MealPlanService), REST-контроллеры и сидинг. MCP тестируется через in-memory H2 + mock-транспорт, интернет не требуется.

### Frontend

    cd frontend
    npm run typecheck
    npm run build

## 🔌 VkusVill MCP

Живая MCP-интеграция отключена по умолчанию. Для её включения открой `backend-java/src/main/resources/application.yml` и установи:

    app:
      enable-live-mcp: true

После изменения пересобери jar (`mvn clean package -DskipTests`). Приложение начнёт обращаться к `https://mcp.vkusvill.ru/mcp` для поиска товаров и создания share_basket-ссылок.

## 📡 API (основное)

| Метод | Endpoint | Описание |
| :--- | :--- | :--- |
| `GET` | `/health` | Проверка статуса |
| `GET` | `/api/recipes` | Список рецептов (пагинация, фильтр по диете) |
| `GET` | `/api/recipes/{id}` | Детали рецепта |
| `POST` | `/api/meal-plans/generate` | Создание плана питания |
| `GET` | `/api/meal-plans/{id}` | Получить сохранённый план |
| `POST` | `/api/meal-plans/{id}/replace-meal` | Заменить блюдо |
| `GET` | `/api/meal-plans/{id}/grocery-list` | Список покупок |
| `PATCH`| `/api/grocery-items/{id}` | Отметить «куплено» |
| `POST` | `/api/meal-plans/{id}/grocery-items` | Добавить ручной товар |
| `POST` | `/api/meal-plans/{id}/refresh-prices` | Обновить товары и цены через MCP |
| `POST` | `/api/meal-plans/{id}/vkusvill-cart` | Создать share_basket-ссылку |

Единый формат ошибок: `{"error": {"code": "...", "message": "...", "retryable": true|false}}`.

## ⚠️ Известные ограничения

* MCP-сервер экспериментальный, контракт может меняться.
* Часть ингредиентов (pcs) не сопоставляется с товарами в граммах — такие позиции помечаются `requires_review` и не попадают в корзину без подтверждения.
* Авторизация отсутствует (MVP).
* SQLite используется для MVP; PostgreSQL — в roadmap.

## 🐍 Python-версия

В папке `backend/` сохранена оригинальная Python-реализация (FastAPI + SQLAlchemy, 90+ тестов). Она полностью рабочая и оставлена как эталон для сравнения. Java-версия воспроизводит её контракт 1:1.
