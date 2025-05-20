import { NextResponse } from "next/server"
import { Telegraf } from "telegraf"

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || "")

export async function POST(request: Request) {
	try {
		const { recipient, message } = await request.json()

		if (!recipient || !message) {
			return NextResponse.json(
				{ error: "Recipient and message are required" },
				{ status: 400 }
			)
		}

		await bot.telegram.sendMessage(recipient, message)

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("Error sending message:", error)
		return NextResponse.json(
			{ error: "Failed to send message" },
			{ status: 500 }
		)
	}
} 