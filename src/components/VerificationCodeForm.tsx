import { useState } from "react"
import { Input, Button, Form, message } from "antd"
import { useDispatch, useSelector } from "react-redux"
import { setAuthenticated, setError, resetAuth, setSessionId, setCurrentUserId, setCurrentUserPhotoUrl } from "@/store/slices/authSlice"
import { RootState } from "@/store"
import { telegramService } from "@/services/telegram"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

export default function VerificationCodeForm() {
	const [isLoading, setIsLoading] = useState(false)
	const dispatch = useDispatch()
	const router = useRouter()
	const { phoneNumber, sessionId, error } = useSelector((state: RootState) => state.auth)

	// Проверяем наличие номера телефона и sessionId
	// Если их нет, перенаправляем на форму ввода номера
	if (!phoneNumber || !sessionId) {
		if (typeof window !== 'undefined') {
			router.push("/auth")
		}
		return null // Пока идет перенаправление, не рендерим ничего
	}

	const handleSubmit = async (values: { code: string }) => {
		setIsLoading(true)
		dispatch(setError(""))

		try {
			const response = await telegramService.sendVerificationCode(values.code, sessionId, phoneNumber)

			console.log("Ответ от сервера (checkCode):", response)

			// Сервер теперь возвращает success: true, обновленный sessionId (опционально) и currentUserId
			if (response.success) {
				dispatch(setAuthenticated(true))

				// Сохраняем обновленный sessionId и currentUserId, если они пришли
				if (response.sessionId) {
					dispatch(setSessionId(response.sessionId))
					Cookies.set('sessionId', response.sessionId, { expires: 7 }); // Сохраняем на 7 дней
				}
				// Сохраняем currentUserId в Store и куках
				console.log("VerificationCodeForm: Checking response.currentUserId before setting cookie:", response.currentUserId);
				if (response.currentUserId) {
					dispatch(setCurrentUserId(response.currentUserId.toString())); // Сохраняем как строку
					Cookies.set('currentUserId', response.currentUserId.toString(), { expires: 7 }); // Сохраняем в куках как строку
					console.log("VerificationCodeForm: currentUserId cookie should be set.");

					// --- Загружаем фото текущего пользователя и сохраняем в сторе ---
					const userPhotoUrl = await telegramService.downloadProfilePhoto(sessionId, response.currentUserId.toString());
					if (userPhotoUrl) {
						dispatch(setCurrentUserPhotoUrl(userPhotoUrl));
						console.log("Current user photo loaded and saved.", userPhotoUrl);
					} else {
						console.warn("Failed to load current user photo.");
					}
					// --- Конец загрузки фото ---

				} else {
					console.warn("VerificationCodeForm: response.currentUserId was falsy, currentUserId cookie not set.");
				}

				message.success("Авторизация успешна!")
				// Переходим на страницу чата
				router.push("/chat")
			} else {
				// Если success: false, возможно, пароль 2FA требуется
				// TODO: Обработка 2FA
				console.warn("Авторизация не успешна, возможно требуется 2FA.", response);
				dispatch(setError("Авторизация не удалась. Возможно, требуется 2FA."));
				message.error("Авторизация не удалась.");
			}
		} catch (err) {
			console.error("Ошибка при проверке кода:", err)
			dispatch(setError("Ошибка при проверке кода. Пожалуйста, проверьте код и попробуйте снова."))
			message.error("Ошибка при проверке кода")
			// При ошибке, возможно, стоит сбросить аутентификацию или предложить повторную отправку кода
			// dispatch(resetAuth()); // Опционально
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="flex justify-center items-center h-screen">
			<div className="w-full max-w-md">
				<h2 className="text-2xl font-bold mb-6 text-center">Введите код подтверждения</h2>
				<p className="mb-4 text-center">Код отправлен на номер {phoneNumber}</p>
				<Form
					name="verificationCode"
					onFinish={handleSubmit}
					autoComplete="off"
					layout="vertical"
				>
					<Form.Item
						label="Код подтверждения"
						name="code"
						rules={[
							{ required: true, message: "Пожалуйста, введите код подтверждения!" },
							{ pattern: /^\d+$/, message: "Код должен содержать только цифры" },
						]}
					>
						<Input size="large" />
					</Form.Item>

					{error && <div className="text-red-500 mb-4">{error}</div>}

					<Form.Item>
						<Button type="primary" htmlType="submit" loading={isLoading} block size="large">
							Проверить код
						</Button>
					</Form.Item>
				</Form>
			</div>
		</div>
	)
} 