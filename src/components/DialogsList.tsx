import { useEffect, useState } from "react"
import { List, Avatar, Typography, Spin, message } from "antd"
import { UserOutlined } from "@ant-design/icons"

interface Dialog {
	id: string
	title: string
	unreadCount: number
	lastMessage: string
	date: number
}

export default function DialogsList({ onSelectDialog }: { onSelectDialog: (dialogId: string) => void }) {
	const [dialogs, setDialogs] = useState<Dialog[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		fetchDialogs()
	}, [])

	const fetchDialogs = async () => {
		try {
			const sessionId = localStorage.getItem("sessionId")
			if (!sessionId) {
				throw new Error("Сессия не найдена")
			}

			const response = await fetch(`http://localhost:3001/api/dialogs?sessionId=${sessionId}`)
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || "Ошибка при получении диалогов")
			}

			setDialogs(data.dialogs)
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
		<List
			className="h-full overflow-y-auto"
			itemLayout="horizontal"
			dataSource={dialogs}
			renderItem={(dialog) => (
				<List.Item
					className="cursor-pointer hover:bg-gray-50"
					onClick={() => onSelectDialog(dialog.id)}
				>
					<List.Item.Meta
						avatar={<Avatar icon={<UserOutlined />} />}
						title={dialog.title}
						description={
							<div className="flex justify-between items-center">
								<Typography.Text ellipsis className="max-w-[200px]">
									{dialog.lastMessage}
									{dialog.date}
								</Typography.Text>
								{dialog.unreadCount > 0 && (
									<span className="bg-blue-500 text-white rounded-full px-2 py-1 text-xs">
										{dialog.unreadCount}
									</span>
								)}
							</div>
						}
					/>
				</List.Item>
			)}
		/>
	)
}