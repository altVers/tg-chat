import axios from "axios"
import { TelegramMessage, TelegramChat, TelegramUpdate } from "@/types/telegram"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

interface TelegramParticipant {
	id: string
	photoUrl?: string
}

class TelegramService {
	private api = axios.create({
		baseURL: API_URL,
		headers: {
			"Content-Type": "application/json"
		}
	})

	// Авторизация
	async sendPhoneNumber(phoneNumber: string): Promise<{ sessionId: string }> {
		const { data } = await this.api.post("/sendPhoneNumber", { phoneNumber })
		return data
	}

	async sendVerificationCode(code: string, sessionId: string, phoneNumber: string): Promise<{ success: boolean; sessionId?: string; currentUserId?: number }> {
		const response = await this.api.post("/checkCode", { code, sessionId, phoneNumber })
		return response.data
	}

	// Работа с чатами
	async getChats(sessionId: string, limit: number = 20, offset: number = 0): Promise<TelegramChat[]> {
		const { data } = await this.api.get("/dialogs", {
			params: { sessionId: sessionId, limit: limit, offset: offset }
		})
		return data.dialogs
	}

	async getChatHistory(sessionId: string, chatId: number, limit: number = 20, offset: number = 0): Promise<TelegramMessage[]> {
		const { data } = await this.api.get("/messages", {
			params: { sessionId: sessionId, chatId: chatId, limit: limit, offset: offset }
		})
		return data.messages
	}

	// Отправка сообщений
	async sendMessage(sessionId: string, chatId: number, text: string): Promise<any> {
		const { data } = await this.api.post("/sendMessage", {
			sessionId: sessionId,
			chatId: chatId,
			text: text
		})
		return data
	}

	// Загрузка фото профиля
	async downloadProfilePhoto(sessionId: string, userId: string): Promise<string | null> {
		try {
			const { data } = await this.api.get("/profilePhoto", {
				params: { sessionId, userId },
				responseType: 'arraybuffer'
			})
			
			// Конвертируем буфер в base64
			const base64 = Buffer.from(data).toString('base64')
			return `data:image/jpeg;base64,${base64}`
		} catch (error) {
			console.error("Ошибка при загрузке фото профиля:", error)
			return null
		}
	}

	// Подписка на обновления
	async subscribeToUpdates(callback: (update: TelegramUpdate) => void): Promise<void> {
		const eventSource = new EventSource(`${API_URL}/updates`)
		
		eventSource.onmessage = (event) => {
			const update = JSON.parse(event.data) as TelegramUpdate
			callback(update)
		}

		eventSource.onerror = () => {
			eventSource.close()
			// Переподключение через 5 секунд
			setTimeout(() => this.subscribeToUpdates(callback), 5000)
		}
	}

	async getParticipants(sessionId: string, chatId: number): Promise<TelegramParticipant[]> {
		const { data } = await this.api.get("/participants", {
			params: { sessionId, chatId }
		})
		return data.participants
	}
}

export const telegramService = new TelegramService() 