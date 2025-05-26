"use client"

import { useEffect, useRef, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Input, Button, List, Avatar, message, Spin } from "antd"
import { SendOutlined } from "@ant-design/icons"
import { RootState } from "@/store"
import { telegramService } from "@/services/telegram"
import { ChatState, setMessages } from "@/store/slices/chatSlice"
import { Message, Chat } from "@/store/slices/chatSlice"
import { createSelector } from '@reduxjs/toolkit'
import { useParticipantsPhotos } from "@/hooks/useParticipantsPhotos"

interface ProfilePhoto {
	userId: string
	photoUrl: string
}

// Вспомогательная функция для форматирования времени
const formatTime = (timestamp?: number) => {
	if (!timestamp) return ''
	const date = new Date(timestamp * 1000) // Unix timestamp в миллисекунды
	const hours = date.getHours().toString().padStart(2, '0')
	const minutes = date.getMinutes().toString().padStart(2, '0')
	return `${hours}:${minutes}`
}

// Создаем мемоизированные селекторы
const selectChatState = (state: RootState) => state.chat as ChatState;

const selectActiveChat = createSelector(
	selectChatState,
	chatState => chatState.activeChat
);

const selectMessages = createSelector(
	selectChatState,
	chatState => chatState.messages
);

const selectChats = createSelector(
	selectChatState,
	chatState => chatState.chats
);

// Селектор для получения текущего чата по activeChat ID
const selectCurrentChatObject = createSelector(
    selectChats,
    selectActiveChat,
    (chats, activeChatId) => chats.find(chat => chat.id === activeChatId)
);

const selectAuthState = (state: RootState) => state.auth;

const selectSessionId = createSelector(
	selectAuthState,
	authState => authState.sessionId
);

const selectIsAuthenticated = createSelector(
	selectAuthState,
	authState => authState.isAuthenticated
);

const selectCurrentUserId = createSelector(
	selectAuthState,
	authState => authState.currentUserId
);

const selectCurrentUserPhotoUrl = createSelector(
	selectAuthState,
	authState => authState.currentUserPhotoUrl
);

export function ChatWindow() {
	const dispatch = useDispatch()
	// Используем мемоизированные селекторы
	const activeChat = useSelector(selectActiveChat);
	const messages = useSelector(selectMessages);
	const chats = useSelector(selectChats); // chats все еще нужен для getMessageSenderPhoto
	const sessionId = useSelector(selectSessionId);
	const isAuthenticated = useSelector(selectIsAuthenticated);
	const currentUserId = useSelector(selectCurrentUserId);
	const currentUserPhotoUrl = useSelector(selectCurrentUserPhotoUrl);

	const messagesEndRef = useRef<HTMLDivElement>(null)
	const [isLoadingMessages, setIsLoadingMessages] = useState(false)

	const isGroupChat = activeChat ? chats.find(chat => chat.id === activeChat)?.type === "group" : false
	const { photos: participantsPhotos, isLoading: isLoadingPhotos } = useParticipantsPhotos(
		sessionId,
		activeChat,
		isGroupChat
	)

	useEffect(() => {
		if (isAuthenticated && sessionId && activeChat) {
			setIsLoadingMessages(true)

			telegramService.getChatHistory(sessionId, activeChat)
				.then(async fetchedMessages => {
					const formattedMessages = fetchedMessages.map(msg => ({
						id: msg.id,
						text: msg.text,
						senderId: msg.senderId?.toString() || undefined,
						receiverId: msg.chatId,
						timestamp: msg.date
					}))

					const sortedMessages = formattedMessages.sort((a, b) => a.timestamp - b.timestamp)
					dispatch(setMessages({ chatId: activeChat, messages: sortedMessages }))
					setIsLoadingMessages(false)

				})
				.catch(error => {
					console.error("Ошибка при загрузке сообщений:", error)
					setIsLoadingMessages(false)
				})
		} else if (!isAuthenticated) {
			console.log("Пользователь не авторизован, сообщения не загружаются.")
		} else if (isAuthenticated && !activeChat) {
			console.log("Чат не выбран, сообщения не загружаются.")
		}
	}, [isAuthenticated, sessionId, activeChat, dispatch, currentUserId, currentUserPhotoUrl, chats])

	useEffect(() => {
		// Прокрутка к последнему сообщению при загрузке или обновлении сообщений для активного чата
		// Используем setTimeout с задержкой 0 для выполнения после обновления DOM
		if (activeChat && messages[activeChat]?.length > 0) {
			const timer = setTimeout(() => {
				messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
			}, 0);
			return () => clearTimeout(timer);
		}
	}, [messages, activeChat])

	const handleSendMessage = async (text: string) => {
		if (isAuthenticated && sessionId && activeChat && text.trim()) {
			try {
				await telegramService.sendMessage(sessionId, activeChat, text.trim())
				console.log("Сообщение отправлено:", text)
			} catch (error) {
				console.error("Ошибка при отправке сообщения:", error)
				message.error("Не удалось отправить сообщение.")
			}
		}
	}

	// Проверяем, что activeChat не null перед доступом к messages[activeChat]
	const chatMessages = activeChat ? messages[activeChat] || [] : [];

	// Проверяем, что currentUserId не null перед использованием
	const isMyMessage = (message: Message): boolean => {
		return currentUserId !== null && message.senderId !== undefined && message.senderId.toString() === currentUserId.toString();
	};

	// Обновляем функцию получения фото отправителя
	const getMessageSenderPhoto = (message: Message) => {
		// Если это мое сообщение, используем фото текущего пользователя
		if (currentUserId && message.senderId === currentUserId.toString()) {
			return currentUserPhotoUrl
		}

		// Если это групповой чат, используем фото из кэша участников
		if (isGroupChat && message.senderId) {
			return participantsPhotos[message.senderId]
		}

		// Для личных чатов используем фото чата
		const chat = chats.find(c => c.id === activeChat)
		return chat?.photoUrl
	}

	if (!activeChat) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100%"
				}}
			>
				Выберите чат для начала общения
			</div>
		)
	}

	return (
		<div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
			<div style={{ flex: 1, overflowY: "auto", padding: "16px", boxSizing: "border-box" }}>
				{isLoadingMessages ? (
					<div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
						<Spin size="large" />
					</div>
				) : (
					<List
						itemLayout="horizontal"
						dataSource={chatMessages}
						renderItem={(message) => {
							const myMessage = isMyMessage(message)
							const photoUrl = getMessageSenderPhoto(message)

							return (
								<List.Item
									style={{
										justifyContent: myMessage ? "flex-end" : "flex-start",
										padding: "8px 16px",
										borderBottom: 'none',
									}}
								>
									<div
										style={{
											display: "flex",
											alignItems: "flex-start",
											gap: "8px",
											maxWidth: "70%",
											flexDirection: myMessage ? "row-reverse" : "row",
										}}
									>
										<Avatar 
											style={{ minWidth: '40px', minHeight: '40px' }}
											src={photoUrl}
										>
											{!photoUrl && (message.senderId ? String(message.senderId)[0] : 'U')}
										</Avatar>
										<div
											style={{
												backgroundColor: myMessage ? "#007bff" : "#e9e9eb",
												color: myMessage ? "white" : "black",
												padding: "8px 6px",
												borderRadius: myMessage ? '8px 8px 4px 8px' : '8px 8px 8px 4px',
												wordWrap: 'break-word',
												overflowWrap: 'break-word',
												wordBreak: 'break-all',
											}}
										>
											{message.text === "" ? "[Медиа-файл]" : message.text}
											<span style={{ fontSize: '0.7em', color: myMessage ? 'rgba(255, 255, 255, 0.7)' : '#555', marginLeft: '8px' }}>
												{formatTime(message.timestamp)}
											</span>
										</div>
									</div>
								</List.Item>
							)
						}}
					/>
				)}
				<div ref={messagesEndRef} />
			</div>
			{activeChat && (
				<div style={{ padding: "16px", borderTop: "1px solid #f0f0f0" }}>
					<Input.Search
						placeholder="Введите сообщение..."
						enterButton={
							<Button type="primary" icon={<SendOutlined />}>
								Отправить
							</Button>
						}
						onSearch={handleSendMessage}
					/>
				</div>
			)}
		</div>
	)
} 