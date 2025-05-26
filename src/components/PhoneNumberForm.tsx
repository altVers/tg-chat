import { useState } from "react"
import { Input, Button, Form, message } from "antd"
import { useDispatch, useSelector } from "react-redux"
import { setPhoneNumber, /* setVerificationCode, */ setError, resetAuth, setSessionId } from "@/store/slices/authSlice"
import { RootState } from "@/store"
// import axios from "axios" // Удаляем axios
import { telegramService } from "@/services/telegram" // Импортируем telegramService
// Импортируем useRouter для навигации
import { useRouter } from "next/navigation"

export default function PhoneNumberForm() {
	const [isLoading, setIsLoading] = useState(false)
	const dispatch = useDispatch()
	// Пока не используем authState, но оставим для примера
	// const authState = useSelector((state: RootState) => state.auth)
	const router = useRouter()

	const handleSubmit = async (values: { phoneNumber: string }) => {
		setIsLoading(true)
		dispatch(setPhoneNumber(values.phoneNumber))
		dispatch(setError(""))

		try {
			// Используем telegramService вместо axios
			const response = await telegramService.sendPhoneNumber(values.phoneNumber)

			console.log("Ответ от сервера (sendPhoneNumber):", response)

			// Сервер теперь возвращает sessionId
			if (response.sessionId) {
				dispatch(setSessionId(response.sessionId))
				message.success("Номер телефона отправлен. Ожидание кода.")
				// Переходим на страницу ввода кода
				router.push("/auth/verify")
			} else {
				// Если sessionId не пришел, это ошибка сервера или API
				// Ошибка будет поймана в блоке catch ниже, но оставим эту проверку на всякий случай
				throw new Error("Сервер не вернул sessionId")
			}
		} catch (err) {
			console.error("Ошибка при отправке номера телефона:", err)
			dispatch(setError("Ошибка при отправке номера телефона. Пожалуйста, проверьте номер и попробуйте снова."))
			message.error("Ошибка при отправке номера телефона")
			dispatch(resetAuth())
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="flex justify-center items-center h-screen">
			<div className="w-full max-w-md">
				<h2 className="text-2xl font-bold mb-6 text-center">Введите ваш номер телефона</h2>
				<Form
					name="phoneNumber"
					onFinish={handleSubmit}
					autoComplete="off"
					layout="vertical"
				>
					<Form.Item
						label="Номер телефона"
						name="phoneNumber"
						rules={[
							{ required: true, message: "Пожалуйста, введите ваш номер телефона!" },
							{ pattern: /^\+[1-9]\d{1,14}$/, message: "Введите корректный номер телефона в международном формате (+79123456789)" },
						]}
					>
						<Input size="large" placeholder="+79123456789" />
					</Form.Item>

					{/* authState.error && <div className="text-red-500 mb-4">{authState.error}</div> */}

					<Form.Item>
						<Button type="primary" htmlType="submit" loading={isLoading} block size="large">
							Получить код
						</Button>
						{/* Кнопка для сброса (опционально) */}
						{/* <Button onClick={() => dispatch(resetAuth())}>Сброс</Button> */}
					</Form.Item>
				</Form>
			</div>
		</div>
	)
} 