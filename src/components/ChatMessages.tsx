import { useEffect, useState, useRef } from "react"
import { List, Avatar, Typography, Spin, message } from "antd"
import { UserOutlined } from "@ant-design/icons"

interface Message {
	id: number
	text: string
	date: number
	senderId: string
}

export default function ChatMessages({ chatId }: { chatId: string }) {
	const [messages, setMessages] = useState<Message[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const messagesEndRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		fetchMessages()
	}, [chatId])

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}

	const fetchMessages = async () => {
		try {
			const sessionId = localStorage.getItem("sessionId")
			if (!sessionId) {
				throw new Error("Сессия не найдена")
			}

			const response = await fetch(
				`http://localhost:3001/api/messages?sessionId=${sessionId}&chatId=${chatId}`
			)
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || "Ошибка при получении сообщений")
			}

			setMessages(data.messages)
		} catch (err) {
			message.error(err instanceof Error ? err.message : "Произошла ошибка")
		} finally {
			setIsLoading(false)
		}
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<Spin size="large" />
			</div>
		)
	}

	return (
		<div className="h-full flex flex-col">
			<div className="flex-1 overflow-y-auto p-4">
				<List
					itemLayout="horizontal"
					dataSource={messages}
					renderItem={(message) => (
						<List.Item className="!px-0">
							<List.Item.Meta
								avatar={<Avatar icon={<UserOutlined />} />}
								title={
									<Typography.Text type="secondary" className="text-xs">
										{new Date(message.date * 1000).toLocaleString()}
									</Typography.Text>
								}
								description={
									<Typography.Text className="text-base">
										{message.text}
									</Typography.Text>
								}
							/>
						</List.Item>
					)}
				/>
				<div ref={messagesEndRef} />
			</div>
		</div>
	)
} 