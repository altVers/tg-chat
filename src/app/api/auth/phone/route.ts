import { NextResponse } from "next/server"
import axios from "axios"

export const dynamic = "force-dynamic"

const TDAPI_URL = process.env.TDAPI_URL || "http://localhost:8080"

export async function POST(request: Request) {
	try {
		const { phoneNumber } = await request.json()
		
		if (!phoneNumber) {
			console.error("Phone number is missing in request")
			return NextResponse.json(
				{ error: "Номер телефона не указан" },
				{ status: 400 }
			)
		}

		console.log(`Attempting to send phone number to ${TDAPI_URL}/sendPhoneNumber`)
		
		// Отправляем номер телефона на TDLib HTTP сервер
		const response = await axios.post(`${TDAPI_URL}/sendPhoneNumber`, {
			phone_number: phoneNumber
		})

		console.log("Successfully sent phone number to TDLib server")
		
		// Возвращаем ответ от TDLib сервера
		return NextResponse.json(response.data)
	} catch (error: any) {
		console.error("Error in phone auth:", {
			message: error.message,
			response: error.response?.data,
			status: error.response?.status,
			config: error.config
		})
		
		return NextResponse.json(
			{ 
				error: error.response?.data?.error || error.message || "Ошибка при отправке номера телефона",
				details: error.response?.data
			},
			{ status: error.response?.status || 500 }
		)
	}
} 