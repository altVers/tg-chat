import { NextResponse } from "next/server"
import axios from "axios"

export const dynamic = "force-dynamic"

const TDAPI_URL = process.env.TDAPI_URL || "http://localhost:8080"

export async function POST(request: Request) {
	try {
		const { code } = await request.json()

		// Отправляем код подтверждения на TDLib HTTP сервер
		const response = await axios.post(`${TDAPI_URL}/checkAuthenticationCode`, {
			code: code
		})

		// Возвращаем ответ от TDLib сервера
		return NextResponse.json(response.data)
	} catch (error: any) {
		console.error("Error in code auth:", error)
		return NextResponse.json(
			{ error: error.message || "Ошибка при отправке кода подтверждения" },
			{ status: error.response?.status || 500 }
		)
	}
} 