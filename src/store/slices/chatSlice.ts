import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { TelegramMessage, TelegramChat } from "@/types/telegram"

export interface Message {
	id: number
	text: string
	senderId?: string
	receiverId: number
	timestamp: number
}

export interface Chat extends TelegramChat {
	photoUrl?: string
	photoLoading?: boolean
	photoAttempted?: boolean
}

export interface ChatState {
	chats: Chat[]
	activeChat: number | null
	messages: Record<number, Message[]>
	loading: boolean
	error: string | null
}

const initialState: ChatState = {
	chats: [],
	activeChat: null,
	messages: {},
	loading: false,
	error: null
}

export const chatSlice = createSlice({
	name: "chat",
	initialState,
	reducers: {
		setChats: (state, action: PayloadAction<TelegramChat[]>) => {
			state.chats = action.payload.map(chat => ({
				...chat,
				photoLoading: false,
				photoUrl: undefined,
				photoAttempted: false,
			}))
		},
		setActiveChat: (state, action: PayloadAction<number>) => {
			state.activeChat = action.payload
		},
		addMessage: (state, action: PayloadAction<Message>) => {
			const chatId = action.payload.receiverId
			if (!state.messages[chatId]) {
				state.messages[chatId] = []
			}
			state.messages[chatId].push(action.payload)
		},
		setMessages: (state, action: PayloadAction<{ chatId: number; messages: Message[] }>) => {
			state.messages[action.payload.chatId] = action.payload.messages
		},
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.loading = action.payload
		},
		setError: (state, action: PayloadAction<string>) => {
			state.error = action.payload
		},
		setChatPhoto: (state, action: PayloadAction<{ chatId: number; photoUrl?: string; loading: boolean; photoAttempted?: boolean }>) => {
			const chat = state.chats.find(chat => chat.id === action.payload.chatId)!
			if (chat) {
				chat.photoUrl = action.payload.photoUrl
				chat.photoLoading = action.payload.loading
				if (action.payload.photoAttempted !== undefined) {
					chat.photoAttempted = action.payload.photoAttempted
				}
			}
		}
	}
})

export const {
	setChats,
	setActiveChat,
	addMessage,
	setMessages,
	setLoading,
	setError,
	setChatPhoto
} = chatSlice.actions 