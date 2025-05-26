import { NextResponse } from "next/server"
import { telegramService } from "@/services/telegram"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const limit = Number(searchParams.get("limit")) || 20
		const offset = Number(searchParams.get("offset")) || 0
		const sessionId = searchParams.get("sessionId")

		if (!sessionId) {
			return NextResponse.json(
				{ error: "Не указан sessionId" },
				{ status: 400 }
			)
		}

		const chats = await telegramService.getChats(sessionId, limit, offset)
		return NextResponse.json(chats)
	} catch (error) {
		console.error("Error getting chats:", error)
		return NextResponse.json(
			{ error: "Ошибка при получении списка чатов" },
			{ status: 500 }
		)
	}
} 