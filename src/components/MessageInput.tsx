import { useState } from "react"
import { Input, Button, message as antMessage } from "antd"
import { SendOutlined } from "@ant-design/icons"

interface MessageInputProps {
	chatId: string
	onMessageSent: () => void
}

export default function MessageInput({ chatId, onMessageSent }: MessageInputProps) {
	const [message, setMessage] = useState("")
	const [isLoading, setIsLoading] = useState(false)

	const handleSubmit = async () => {
		if (!message.trim()) return

		setIsLoading(true)

		try {
			const sessionId = localStorage.getItem("sessionId")
			if (!sessionId) {
				throw new Error("Сессия не найдена")
			}

			const response = await fetch("http://localhost:3001/api/sendMessage", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					sessionId,
					chatId,
					text: message.trim(),
				}),
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || "Ошибка при отправке сообщения")
			}

			setMessage("")
			onMessageSent()
		} catch (err) {
			antMessage.error(err instanceof Error ? err.message : "Произошла ошибка")
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="border-t p-4">
			<div className="flex gap-2">
				<Input
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					onPressEnter={handleSubmit}
					placeholder="Введите сообщение..."
					disabled={isLoading}
				/>
				<Button
					type="primary"
					icon={<SendOutlined />}
					onClick={handleSubmit}
					loading={isLoading}
				>
					Отправить
				</Button>
			</div>
		</div>
	)
} 