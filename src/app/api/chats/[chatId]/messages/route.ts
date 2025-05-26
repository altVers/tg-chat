import { NextResponse } from "next/server"

export async function GET(
	request: Request,
	{ params }: { params: { chatId: string } }
) {
	try {
		const { searchParams } = new URL(request.url)
		const limit = Number(searchParams.get("limit")) || 20
		const offset = Number(searchParams.get("offset")) || 0
		const chatId = Number(params.chatId)

		// Здесь будет логика получения сообщений из TDLib
		// Пока возвращаем тестовые данные
		return NextResponse.json([
			{
				id: 1,
				chatId,
				content: "Test message",
				senderId: 1,
				date: Date.now()
			}
		])
	} catch (error) {
		console.error("Error getting messages:", error)
		return NextResponse.json(
			{ error: "Ошибка при получении сообщений" },
			{ status: 500 }
		)
	}
}

export async function POST(
	request: Request,
	{ params }: { params: { chatId: string } }
) {
	try {
		const { content } = await request.json()
		const chatId = Number(params.chatId)

		// Здесь будет логика отправки сообщения в TDLib
		// Пока возвращаем тестовые данные
		return NextResponse.json({
			id: Date.now(),
			chatId,
			content,
			senderId: 1,
			date: Date.now()
		})
	} catch (error) {
		console.error("Error sending message:", error)
		return NextResponse.json(
			{ error: "Ошибка при отправке сообщения" },
			{ status: 500 }
		)
	}
} 