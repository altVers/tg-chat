import { useState } from "react"
import { Layout } from "antd"
import DialogsList from "./DialogsList"
import ChatMessages from "./ChatMessages"
import MessageInput from "./MessageInput"

const { Sider, Content } = Layout

export default function Chat() {
	const [selectedChatId, setSelectedChatId] = useState<string | null>(null)

	return (
		<Layout className="h-screen">
			<Sider width={300} className="bg-white border-r">
				<DialogsList onSelectDialog={setSelectedChatId} />
			</Sider>
			<Content className="flex flex-col">
				{selectedChatId ? (
					<>
						<ChatMessages chatId={selectedChatId} />
						<MessageInput
							chatId={selectedChatId}
							onMessageSent={() => {
								// Здесь можно добавить обновление сообщений
							}}
						/>
					</>
				) : (
					<div className="h-full flex items-center justify-center text-gray-500">
						Выберите чат для начала общения
					</div>
				)}
			</Content>
		</Layout>
	)
} 