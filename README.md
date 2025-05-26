# Telegram Web Client

Веб-клиент для Telegram, построенный с использованием Next.js, React, TypeScript и официального Telegram API.

## Требования

- Node.js 18 или выше
- npm или yarn
- API ID и API Hash от Telegram

## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/yourusername/tg-chat.git
cd tg-chat
```

2. Установите зависимости:
```bash
npm install
```

3. Получите API ID и API Hash:
   - Перейдите на https://my.telegram.org
   - Войдите в свой аккаунт
   - Перейдите в "API development tools"
   - Создайте новое приложение
   - Скопируйте API ID и API Hash

4. Создайте файл `.env.local` в корневой директории:
```env
API_ID=your_api_id
API_HASH=your_api_hash
```

## Запуск

1. Запустите сервер:
```bash
npm run server
```

2. В отдельном терминале запустите клиент:
```bash
npm run dev
```

Приложение будет доступно по адресу http://localhost:3000

## Функциональность

- Авторизация через номер телефона
- Просмотр списка чатов
- Отправка и получение сообщений
- Отображение статуса сообщений

## Технологии

- Next.js 14.1.0
- React 18
- TypeScript
- Redux Toolkit
- Ant Design 5.14.1
- Express.js
- Tailwind CSS
- Telegram API

## Структура проекта

```
src/
  ├── app/              # Next.js App Router
  ├── components/       # React компоненты
  │   ├── auth/        # Компоненты авторизации
  │   └── chat/        # Компоненты чата
  ├── store/           # Redux store и слайсы
  ├── services/        # Сервисы (Telegram API)
  └── types/           # TypeScript типы
```

## Разработка

### Скрипты

- `npm run dev` - запуск клиента в режиме разработки
- `npm run server` - запуск сервера
- `npm run build` - сборка проекта
- `npm run start` - запуск собранного проекта
- `npm run lint` - проверка кода линтером

### Стилизация

Проект использует:
- Tailwind CSS для утилитарных стилей
- Ant Design для компонентов
- CSS модули для изолированных стилей