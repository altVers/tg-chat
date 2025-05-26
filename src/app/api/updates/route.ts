import { NextResponse } from "next/server"
import { telegramService } from "@/services/telegram"
import { TelegramUpdate } from "@/types/telegram"

export const dynamic = "force-dynamic"

export async function GET() {
	const encoder = new TextEncoder()
	const stream = new ReadableStream({
		start(controller) {
			// Подписываемся на обновления
			telegramService.subscribeToUpdates((update: TelegramUpdate) => {
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(update)}\n\n`))
			})

			// Очистка при закрытии соединения
			return () => {
				// Отписка от обновлений будет выполнена автоматически
				// при закрытии соединения
			}
		}
	})

	return new NextResponse(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			"Connection": "keep-alive"
		}
	})
} 