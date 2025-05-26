"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Avatar, Badge } from "antd"
import { RootState } from "@/store"
import { setActiveChat, Chat, ChatState, setChats, setChatPhoto } from "@/store/slices/chatSlice"
import { telegramService } from "@/services/telegram"
import { FixedSizeList } from 'react-window'
import Measure, { ContentRect } from 'react-measure'

// Вспомогательная функция для форматирования времени
const formatTime = (timestamp?: number) => {
	if (!timestamp) return ''
	const date = new Date(timestamp * 1000) // Unix timestamp в миллисекунды
	const hours = date.getHours().toString().padStart(2, '0')
	const minutes = date.getMinutes().toString().padStart(2, '0')
	return `${hours}:${minutes}`
}

// Компонент для рендеринга одной строки списка чатов
const Row = ({ index, style, data }: { index: number; style: React.CSSProperties; data: Chat[] }) => {
	const chat = data[index]
	const dispatch = useDispatch()
	const { activeChat } = useSelector((state: RootState) => state.chat as ChatState)
	// Получаем sessionId из Redux Store
	const { sessionId } = useSelector((state: RootState) => state.auth);

	const handleChatClick = (chatId: number) => {
		dispatch(setActiveChat(chatId))
		// Возможно, здесь также нужно сбросить сообщения для предыдущего чата или загрузить новые
	}

	// Эффект для загрузки фото при необходимости
	useEffect(() => {
		// Проверяем, есть ли entityId, не загружено ли фото, не идет ли загрузка, не было ли попытки загрузки и есть ли sessionId
		if (chat.entityId && !chat.photoUrl && !chat.photoLoading && !chat.photoAttempted && sessionId) {
			// Отмечаем, что загрузка началась и попытка предпринята
			dispatch(setChatPhoto({ chatId: chat.id, loading: true, photoAttempted: true })) // Устанавливаем photoAttempted в true здесь

			// Передаем sessionId вторым аргументом
			telegramService.downloadProfilePhoto(sessionId, chat.entityId.toString())
				.then(photoUrl => {
					if (photoUrl) {
						dispatch(setChatPhoto({
							chatId: chat.id,
							photoUrl,
							loading: false,
							photoAttempted: true
						}))
					} else {
						dispatch(setChatPhoto({
							chatId: chat.id,
							loading: false,
							photoAttempted: true
						}))
					}
				})
				.catch(error => {
					console.error("Ошибка при загрузке фото профиля:", error)
					dispatch(setChatPhoto({
						chatId: chat.id,
						loading: false,
						photoAttempted: true
					}))
				})
		}
	}, [chat.entityId, chat.photoUrl, chat.photoLoading, chat.id, dispatch, chat.photoAttempted, sessionId]) // Добавляем sessionId в зависимости

	return (
		<div
			style={{
				...style,
				display: 'flex',
				alignItems: 'center',
				padding: '8px 6px',
				gap: '8px',
				cursor: "pointer",
				backgroundColor:
					activeChat === chat.id ? "rgba(0, 0, 0, 0.04)" : "transparent",
				borderBottom: '1px solid #f0f0f0',
			}}
			onClick={() => handleChatClick(chat.id)}
		>
			{/* Аватар с Badge */}
			<div style={{ marginRight: '12px' }}>
				<Badge count={chat.unreadCount} overflowCount={99}>
					<Avatar size="large" src={chat.photoUrl}>{!chat.photoUrl && chat.title[0]}</Avatar>
				</Badge>
			</div>

			{/* Контент (заголовок, сообщение) */}
			<div style={{ flexGrow: 1, overflow: 'hidden'  }}>
				{/* Заголовок и время */}
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
						{chat.title}
					</div>
					<span style={{ fontSize: '0.8em', color: '#888', flexShrink: 0 }}> {/* flexShrink 0, чтобы время не сжималось */}
						{formatTime(chat.lastMessageTimestamp)}
					</span>
				</div>

				{/* Последнее сообщение */}
				<div style={descriptionStyle}>
					{chat.lastMessage || "Нет сообщений"}
				</div>
			</div>
		</div>
	)
}

const descriptionStyle: React.CSSProperties = {
	display: '-webkit-box',
	WebkitLineClamp: 1,
	WebkitBoxOrient: 'vertical',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	wordBreak: 'break-word',
	fontSize: '0.9em',
	color: '#888',
	maxWidth: '90%',
}

export function ChatList() {
	const dispatch = useDispatch()
	const { chats } = useSelector((state: RootState) => state.chat as ChatState)
	const { sessionId, isAuthenticated } = useSelector((state: RootState) => state.auth)

	const [isLoading, setIsLoading] = useState(false)
	const [dimensions, setDimensions] = useState<ContentRect | null>(null)

	useEffect(() => {
		if (isAuthenticated && sessionId) {
			setIsLoading(true)
			telegramService.getChats(sessionId)
				.then(dialogs => {
					dispatch(setChats(dialogs))
					setIsLoading(false)
				})
				.catch(error => {
					console.error("Ошибка при получении диалогов:", error)
					setIsLoading(false)
				})
		} else if (!isAuthenticated) {
			console.log("Пользователь не авторизован, диалоги не загружаются.")
		}
	}, [isAuthenticated, sessionId, dispatch])

	return (
		<Measure
			bounds
			onResize={(contentRect: ContentRect) => {
				setDimensions(contentRect)
			}}
		>
			{({ measureRef }) => (
				<div ref={measureRef} style={{ height: '100%', width: '100%' }}>
					{dimensions?.bounds && dimensions.bounds.height > -1 && dimensions.bounds.width > -1 && (
						<FixedSizeList
							height={dimensions.bounds.height}
							itemCount={chats.length}
							itemSize={72}
							width={dimensions.bounds.width}
							itemData={chats}
						>
							{Row}
						</FixedSizeList>
					)}
				</div>
			)}
		</Measure>
	)
} 