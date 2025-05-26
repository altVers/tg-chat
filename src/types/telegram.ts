export interface TelegramMessage {
	id: number
	chatId: number
	text: string
	senderId: number
	date: number
	isOutgoing: boolean
	status: "sending" | "sent" | "delivered" | "read"
}

export interface TelegramChat {
	id: number
	title: string
	type: "private" | "group" | "channel"
	entityId: string
	lastMessage?: string
	unreadCount: number
	lastMessageTimestamp?: number
}

export interface TelegramUpdate {
	type: "message" | "chat" | "user"
	chat?: TelegramChat
	message?: TelegramMessage
} 