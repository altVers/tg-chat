# Telegram Chat Web Interface

Веб-интерфейс для отправки сообщений через Telegram бота.

## Установка

1. Клонируйте репозиторий:
```bash
git clone [url-репозитория]
cd tg-chat
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env.local` в корневой директории проекта и добавьте токен вашего Telegram бота:
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

## Запуск

Для запуска в режиме разработки:
```bash
npm run dev
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000)

## Сборка для продакшена

```bash
npm run build
npm start
```

## Использование

1. Откройте веб-интерфейс в браузере
2. Введите ID получателя (можно получить через @userinfobot в Telegram)
3. Введите сообщение
4. Нажмите кнопку "Отправить" 