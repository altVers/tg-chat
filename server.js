const express = require("express")
const { TelegramClient } = require("telegram")
const { StringSession } = require("telegram/sessions")
const { Api } = require("telegram/tl")
const cors = require("cors")
const dotenv = require("dotenv")

dotenv.config({ path: ".env.local" })

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Используем Map для хранения клиентов по ID сессии (в продакшене нужно более надежное хранилище)
const clients = new Map()

// Вспомогательная функция для получения или создания клиента
async function getOrCreateClient(sessionId) {
	console.log(`[getOrCreateClient] Вызвана с sessionId: ${sessionId}`)
	let client = clients.get(sessionId)
	if (!client) {
		console.log("[getOrCreateClient] Клиент не найден, создаю новый.")
		const session = sessionId ? new StringSession(sessionId) : new StringSession("")
		client = new TelegramClient(
			session,
			parseInt(process.env.API_ID),
			process.env.API_HASH,
			{
				connectionRetries: 5,
				// logCallbacks: true, // Опционально для дебага
			}
		)
		console.log("[getOrCreateClient] TelegramClient создан.")

		try {
			console.log("[getOrCreateClient] Попытка подключения клиента...")
			await client.connect();
			console.log("[getOrCreateClient] Клиент подключен.")

			console.log(`[getOrCreateClient] client.updates перед проверкой: ${client.updates}`)
			// Добавляем небольшой таймаут для инициализации updates
			await new Promise(resolve => setTimeout(resolve, 100)); // Таймаут 100 мс
			console.log(`[getOrCreateClient] client.updates после таймаута: ${client.updates}`)

			// Добавляем обработчики событий после успешного подключения и таймаута
			if (client.updates) { // Проверяем, существует ли client.updates
				console.log("[getOrCreateClient] client.updates доступен, подписываюсь на события.")
				client.updates.on("new_message", (message) => {
					// TODO: Обработка новых сообщений
					console.log("Получено новое сообщение:", message);
				});

				client.on("phoneCodeNeeded", async (phoneCode) => {
					console.log("Требуется код подтверждения для", phoneCode.phoneNumber);
					client._phoneCodePromise = new Promise(resolve => global.phoneCodeResolve = resolve);
					return await client._phoneCodePromise;
				});

				client.on("passwordNeeded", async (password) => {
					console.log("Требуется пароль");
					client._passwordPromise = new Promise(resolve => global.passwordResolve = resolve);
					return await client._passwordPromise;
				});

				client.on("connected", () => {
					console.log("Клиент подключен");
				});

				client.on("disconnected", () => {
					console.log("Клиент отключен");
					clients.delete(sessionId); // Удаляем клиента при отключении
				});

				client.on("error", (err) => {
					console.error("Ошибка клиента:", err);
					// TODO: Обработка ошибок
				});

				client.on("sessionUpdated", (session) => {
					console.log("Сессия обновлена:", session.save());
					// TODO: Сохранить session.save() для пользователя
				});

			} else {
				console.warn("client.updates не инициализирован после подключения. События обновлений не будут обрабатываться.");
			}

			if (!sessionId) {
				// Если это новая сессия, начинаем авторизацию по номеру телефона
				// Клиентская часть должна вызвать /api/sendPhoneNumber
				console.log("[getOrCreateClient] Новая сессия, жду отправки номера телефона.")
			}
		} catch (err) {
			console.error("[getOrCreateClient] Ошибка подключения клиента:", err);
			clients.delete(sessionId);
			throw err;
		}

		clients.set(client.session.save(), client); // Сохраняем клиента по его новой сессии
		console.log(`[getOrCreateClient] Клиент сохранен с сессией: ${client.session.save()}`)
		return client;

	} else if (!client.connected) {
		console.log(`[getOrCreateClient] Клиент найден (sessionId: ${sessionId}), но не подключен. Попытка переподключения...`)
		// Если клиент существует, но не подключен, пытаемся переподключиться
		try {
			await client.connect();
			console.log("[getOrCreateClient] Клиент переподключен.")
		} catch (err) {
			console.error("[getOrCreateClient] Ошибка переподключения клиента:", err);
			clients.delete(sessionId);
			throw err;
		}
	}

	console.log(`[getOrCreateClient] Возвращаю существующий/переподключенный клиент с сессией: ${client.session.save()}`)
	return client;
}

// API для начала авторизации (отправка номера телефона)
app.post("/api/sendPhoneNumber", async (req, res) => {
	console.log("[POST /api/sendPhoneNumber] Получен запрос.")
	try {
		const { phoneNumber, sessionId } = req.body
		console.log(`[POST /api/sendPhoneNumber] phoneNumber: ${phoneNumber}, sessionId: ${sessionId}`)
		if (!phoneNumber) {
			console.warn("[POST /api/sendPhoneNumber] Номер телефона не указан.")
			return res.status(400).json({ error: "Номер телефона не указан" })
		}

		let currentSessionId = sessionId;
		let client;

		// Если sessionId не предоставлен, создаем нового клиента
		if (!currentSessionId) {
			console.log("[POST /api/sendPhoneNumber] sessionId не предоставлен, вызываю getOrCreateClient с null.")
			client = await getOrCreateClient(null);
			currentSessionId = client.session.save();
			console.log("[POST /api/sendPhoneNumber] getOrCreateClient завершен, новая сессия создана:", currentSessionId);
		} else {
			console.log(`[POST /api/sendPhoneNumber] sessionId предоставлен (${currentSessionId}), вызываю getOrCreateClient.`)
			client = await getOrCreateClient(currentSessionId);
			console.log("[POST /api/sendPhoneNumber] getOrCreateClient завершен.")
		}

		console.log("[POST /api/sendPhoneNumber] Вызываю client.sendCode()...")
		// Используем sendCode() для инициирования отправки кода
		// Этот метод сам взаимодействует с Telegram для отправки кода
		await client.sendCode(
			{
				apiId: parseInt(process.env.API_ID),
				apiHash: process.env.API_HASH,
			},
			phoneNumber
		);

		console.log("[POST /api/sendPhoneNumber] client.sendCode() вызван успешно, код должен быть отправлен на телефон.")
		res.json({ sessionId: currentSessionId })
	} catch (error) {
		console.error("[POST /api/sendPhoneNumber] Ошибка при обработке запроса:", error)
		res.status(500).json({ error: error.message })
	}
})

// API для проверки кода подтверждения
app.post("/api/checkCode", async (req, res) => {
	try {
		const { code, sessionId, phoneNumber } = req.body // Добавляем phoneNumber
		console.log(`[POST /api/checkCode] Получен код: ${code}, sessionId: ${sessionId}, phoneNumber: ${phoneNumber}`)
		if (!code || !sessionId || !phoneNumber) {
			return res.status(400).json({ error: "Не все параметры указаны (код, ID сессии или номер телефона)" })
		}

		const client = clients.get(sessionId);
		if (!client) {
			console.error("[POST /api/checkCode] Клиент не найден для sessionId:", sessionId)
			return res.status(404).json({ error: "Сессия не найдена или истекла" });
		}

		console.log("[POST /api/checkCode] Вызываю client.start() с кодом...")
		// Используем client.start() для завершения авторизации с кодом
		await client.start({
			phoneNumber: phoneNumber,
			// Передаем код через функцию-колбэк
			phoneCode: async () => {
				console.log("[POST /api/checkCode] Колбэк phoneCode вызван. Возвращаю полученный код.")
				return code; // Возвращаем код, полученный в запросе
			},
			password: async () => {
				console.log("[POST /api/checkCode] Запрошен пароль (в client.start)")
				// Если потребуется пароль 2FA
				return new Promise((resolve) => {
					client._passwordPromise = new Promise(resolve => {
						console.log("[POST /api/checkCode] Создан промис для пароля")
						global.passwordResolve = resolve;
					});
					return client._passwordPromise;
				});
			},
			onError: (err) => {
				console.error("[POST /api/checkCode] Ошибка при авторизации (в start):", err);
				// TODO: Обработать ошибку
				throw err; // Пробрасываем ошибку, чтобы она попала в блок catch
			}
		});

		console.log("[POST /api/checkCode] client.start() завершен.")

		// Проверяем, авторизован ли клиент после client.start()
		const isAuthorized = await client.isUserAuthorized();
		console.log("[POST /api/checkCode] Статус авторизации:", isAuthorized)

		if (!isAuthorized) {
			// Если после start() клиент не авторизован, возможно, нужен пароль 2FA или другая причина
			// Мы можем вернуть специфическую ошибку или статус
			console.warn("[POST /api/checkCode] Клиент не авторизован после client.start().")
			return res.status(401).json({ error: "Авторизация не удалась или требует дополнительных шагов (например, пароль 2FA)" });
		}

		// Получаем информацию о текущем пользователе
		console.log("[POST /api/checkCode] Получаю информацию о текущем пользователе...")
		const me = await client.getMe();
		console.log("[POST /api/checkCode] Получена информация о пользователе:", me);
		const currentUserId = me.id ? me.id.toString() : null; // Получаем ID пользователя и преобразуем в строку
		console.log("[POST /api/checkCode] ID текущего пользователя перед отправкой ответа:", currentUserId, "Тип:", typeof currentUserId);

		res.json({ success: true, sessionId: client.session.save(), currentUserId: currentUserId })
	} catch (error) {
		console.error("[POST /api/checkCode] Ошибка при проверке кода:", error)
		res.status(500).json({ error: error.message })
	}
})

// API для проверки пароля 2FA (если требуется)
app.post("/api/checkPassword", async (req, res) => {
	try {
		const { password, sessionId } = req.body
		console.log(`[POST /api/checkPassword] Получен пароль: ${password ? '****' : 'Пусто'}, sessionId: ${sessionId}`)
		if (!password || !sessionId) {
			return res.status(400).json({ error: "Пароль или ID сессии не указаны" })
		}

		const client = clients.get(sessionId);
		if (!client) {
			console.error("[POST /api/checkPassword] Клиент не найден для sessionId:", sessionId)
			return res.status(404).json({ error: "Сессия не найдена или истекла" });
		}

		// Разрешаем промис, который ждет пароль в passwordNeeded колбэке
		if (global.passwordResolve) {
			console.log("[POST /api/checkPassword] Отправляю пароль в промис")
			global.passwordResolve(password);
			delete global.passwordResolve;
		} else {
			console.warn("[POST /api/checkPassword] passwordResolve не найден. Пароль может быть проигнорирован.");
			return res.status(409).json({ error: "Ожидание пароля не активно" });
		}

		// Ждем немного, чтобы убедиться, что пароль был обработан
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Проверяем, авторизован ли клиент
		const isAuthorized = await client.isUserAuthorized();
		console.log("[POST /api/checkPassword] Статус авторизации:", isAuthorized)

		if (!isAuthorized) {
			// Если после ввода пароля клиент все еще не авторизован, возможно, пароль неверный или другая причина
			console.warn("[POST /api/checkPassword] Клиент не авторизован после проверки пароля.")
			return res.status(401).json({ error: "Пароль неверный или авторизация не удалась" });
		}

		res.json({ success: true, sessionId: client.session.save() })
	} catch (error) {
		console.error("[POST /api/checkPassword] Ошибка при проверке пароля:", error)
		res.status(500).json({ error: error.message })
	}
})

// API для получения диалогов
app.get("/api/dialogs", async (req, res) => {
	try {
		const { sessionId } = req.query
		console.log(`[GET /api/dialogs] Получен запрос с sessionId: ${sessionId}`);
		if (!sessionId) {
			console.warn("[GET /api/dialogs] ID сессии не указан.");
			return res.status(400).json({ error: "ID сессии не указан" })
		}

		console.log("[GET /api/dialogs] Попытка получить клиента...");
		let client = clients.get(sessionId);

		if (!client || !client.connected || !client.session.save()) {
			console.warn("[GET /api/dialogs] Клиент не найден, не подключен или не имеет сессии. Попытка восстановления...");
			// Если клиент не найден или не авторизован/подключен,
			// пытаемся восстановить сессию и получить клиента
			try {
				client = await getOrCreateClient(sessionId);
				// Проверяем еще раз после попытки восстановления
				if (!client || !client.session.save()) {
					console.error("[GET /api/dialogs] Не удалось восстановить сессию после getOrCreateClient.");
					return res.status(401).json({ error: "Сессия недействительна или требуется повторная авторизация" });
				}
				console.log("[GET /api/dialogs] Сессия успешно восстановлена.");
			} catch (err) {
				console.error("[GET /api/dialogs] Ошибка при восстановлении сессии:", err);
				return res.status(500).json({ error: "Не удалось восстановить сессию" });
			}
		}

		console.log("[GET /api/dialogs] Клиент доступен. Попытка получить диалоги...");
		// Проверяем, авторизован ли клиент (наличие сессии недостаточно, нужно пройти авторизацию)
		// В gramjs клиент считается авторизованным после успешного signIn/checkCode/etc.
		
		let dialogs;
		try {
			dialogs = await client.getDialogs({
				limit: 100,
			});
			console.log("[GET /api/dialogs] Диалоги получены успешно.", dialogs[0]);
		} catch (dialogError) {
			console.error("[GET /api/dialogs] Ошибка при вызове client.getDialogs():", dialogError);
			throw dialogError; // Перебрасываем ошибку для обработки в основном блоке catch
		}

		console.log("[GET /api/dialogs] Форматирование диалогов...");
		const formattedDialogs = dialogs.map( (dialog) => {

			return {
				id: dialog.id.toString(),
				title: dialog.title,
				lastMessage: dialog.message?.message || "",
				unreadCount: dialog.unreadCount,
				lastMessageTimestamp: dialog.date,
				// Добавьте тип сущности для удобства на клиенте (пользователь, группа, канал)
				type: dialog.isUser ? 'user' : dialog.isGroup ? 'group' : dialog.isChannel ? 'channel' : 'unknown',
				// Добавляем ID сущности, чтобы клиент мог запросить фото при необходимости
				entityId: dialog.entity?.id ? dialog.entity.id.toString() : undefined
			}
		})

		console.log("[GET /api/dialogs] Форматированные диалоги готовы к отправке.", formattedDialogs);
		res.json({ dialogs: formattedDialogs, sessionId: client.session.save() })
	} catch (error) {
		console.error("[GET /api/dialogs] Ошибка при обработке запроса получения диалогов:", error)
		res.status(500).json({ error: error.message })
	}
})

// API для получения сообщений
app.get("/api/messages", async (req, res) => {
	try {
		const { sessionId, chatId } = req.query
		if (!sessionId || !chatId) {
			return res.status(400).json({ error: "ID сессии или чата не указаны" })
		}

		const client = clients.get(sessionId);
		if (!client || !client.connected || !client.session.save()) {
			// Пытаемся восстановить сессию и получить клиента
			try {
				client = await getOrCreateClient(sessionId);
				if (!client || !client.session.save()) {
					return res.status(401).json({ error: "Сессия недействительна или требуется повторная авторизация" });
				}
			} catch (err) {
				console.error("Ошибка восстановления сессии:", err);
				return res.status(500).json({ error: "Не удалось восстановить сессию" });
			}
		}

		// gramjs требует сущность чата для получения сообщений
		// Сначала находим сущность по ID чата
		const chatEntity = await client.getEntity(parseInt(chatId));

		const messages = await client.getMessages(chatEntity, {
			limit: 100,
		})

		console.log("Сырые сообщения от gramjs перед форматированием:", messages);

		const formattedMessages = messages.map((message) => {
			let messageText = "";
			// Определяем текст сообщения в зависимости от типа контента
			if (message.message) {
				// Основной текст сообщения (для текстовых сообщений)
				messageText = message.message;
			} else if (message.media?.caption) {
				// Подпись к медиафайлу
				messageText = message.media.caption;
			} else if (message.content?._ === 'messageService') {
                // Сервисные сообщения (например, о входе/выходе из чата)
                // Можно попробовать извлечь текст из action.reason, action.message, или action.description
                messageText = message.action?.reason?.message || message.action?.message || message.action?.description || 'Сервисное сообщение';
            } else if (message.content) {
                // Для других типов сообщений с контентом (фото, видео и т.д.), где нет подписи
                messageText = `[${message.content._.replace('messageMedia', '').replace('messageAction', '')}]`; // Показываем тип медиа или действия
            }

			// Извлекаем senderId более надежно
			let senderId = undefined;
			if (message.senderId?.userId) {
				senderId = message.senderId.userId.toString();
			} else if (message.fromId?.userId) { // В старых версиях или для некоторых типов может быть fromId
                senderId = message.fromId.userId.toString();
            } else if (message.peerId?.channelId) { // Для сообщений в каналах от имени канала
                senderId = message.peerId.channelId.toString();
            } else if (message.chatId) { // Иногда chatId может использоваться как senderId в определенных контекстах (например, saved messages) - осторожно использовать
                 // senderId = message.chatId.toString();
            }

			return {
				id: message.id,
				text: messageText,
				date: message.date,
				senderId: senderId,
				// TODO: Получить информацию об отправителе (имя, фото)
			}
		});

		res.json({ messages: formattedMessages, sessionId: client.session.save() })
	} catch (error) {
		console.error("Ошибка при получении сообщений:", error)
		res.status(500).json({ error: error.message })
	}
})

// API для отправки сообщения
app.post("/api/sendMessage", async (req, res) => {
	try {
		const { sessionId, chatId, text } = req.body
		if (!sessionId || !chatId || !text) {
			return res.status(400).json({ error: "Не все параметры указаны" })
		}

		const client = clients.get(sessionId);
		if (!client || !client.connected || !client.session.save()) {
			// Пытаемся восстановить сессию и получить клиента
			try {
				client = await getOrCreateClient(sessionId);
				if (!client || !client.session.save()) {
					return res.status(401).json({ error: "Сессия недействительна или требуется повторная авторизация" });
				}
			} catch (err) {
				console.error("Ошибка восстановления сессии:", err);
				return res.status(500).json({ error: "Не удалось восстановить сессию" });
			}
		}

		// gramjs требует сущность чата для отправки сообщений
		const chatEntity = await client.getEntity(parseInt(chatId));

		await client.sendMessage(chatEntity, { message: text })

		res.json({ success: true, sessionId: client.session.save() })
	} catch (error) {
		console.error("Ошибка при отправке сообщения:", error)
		res.status(500).json({ error: error.message })
	}
})

// API для загрузки фотографии профиля
app.get("/api/profilePhoto", async (req, res) => {
	console.log("[GET /api/profilePhoto] Received request")
	try {
		const { sessionId, userId } = req.query
		console.log(`[GET /api/profilePhoto] Получены параметры: userId=${userId}, sessionId=${sessionId}`)
		
		if (!sessionId || !userId) {
			console.log("[GET /api/profilePhoto] Отсутствуют sessionId или userId")
			return res.status(400).json({ error: "Не указан sessionId или userId" })
		}

		console.log("[GET /api/profilePhoto] Пытаюсь получить клиента...")
		const client = await getOrCreateClient(sessionId)
		if (!client) {
			console.log("[GET /api/profilePhoto] Клиент не найден или сессия истекла")
			return res.status(404).json({ error: "Сессия не найдена или истекла" })
		}

		console.log(`[GET /api/profilePhoto] Клиент найден. Загружаю фото профиля для userId: ${userId}`)
		// Загружаем фото профиля
		const buffer = await client.downloadProfilePhoto(userId)
		
		if (!buffer) {
			console.log(`[GET /api/profilePhoto] Фото профиля не найдено для userId: ${userId}`)
			return res.status(404).json({ error: "Фото профиля не найдено" })
		}

		console.log(`[GET /api/profilePhoto] Фото профиля успешно загружено. Размер буфера: ${buffer.length}`)
		// Устанавливаем заголовки для отправки изображения
		res.setHeader('Content-Type', 'image/jpeg')
		res.setHeader('Content-Length', buffer.length)
		
		// Отправляем буфер напрямую
		res.send(buffer)
		console.log("[GET /api/profilePhoto] Фото профиля отправлено")
	} catch (error) {
		console.error("[GET /api/profilePhoto] Ошибка при загрузке фото профиля:", error)
		res.status(500).json({ error: error.message })
	}
})

// API для получения участников группового чата
app.get("/api/participants", async (req, res) => {
	try {
		const { sessionId, chatId } = req.query
		if (!sessionId || !chatId) {
			return res.status(400).json({ error: "ID сессии или чата не указаны" })
		}

		const client = clients.get(sessionId)
		if (!client || !client.connected) {
			return res.status(401).json({ error: "Сессия недействительна" })
		}

		const chatEntity = await client.getEntity(parseInt(chatId))
		if (!chatEntity) {
			return res.status(404).json({ error: "Чат не найден" })
		}

		// Получаем участников чата
		const participants = await client.getParticipants(chatEntity)
		
		// Форматируем данные участников
		const formattedParticipants = await Promise.all(participants.map(async (participant) => {
			let photoUrl
			try {
				if (participant.photo) {
					const photo = await client.downloadProfilePhoto(participant)
					photoUrl = photo ? `data:image/jpeg;base64,${photo.toString('base64')}` : undefined
				}
			} catch (error) {
				console.error("Ошибка при получении фото участника:", error)
			}

			return {
				id: participant.id.toString(),
				photoUrl
			}
		}))

		res.json({ participants: formattedParticipants })
	} catch (error) {
		console.error("Ошибка при получении участников чата:", error)
		res.status(500).json({ error: error.message })
	}
})

// Проверка работоспособности сервера
app.get("/api/health", (req, res) => {
	res.json({ status: "ok" })
})

app.listen(port, () => {
	console.log(`Сервер запущен на порту ${port}`)
}) 