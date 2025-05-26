import { useSelector } from "react-redux"
import { RootState } from "@/store"
import PhoneNumberForm from "./PhoneNumberForm"
import VerificationCodeForm from "./VerificationCodeForm"
import Chat from "./Chat"

export default function AuthForm() {
	const { phoneNumber, isAuthenticated } = useSelector((state: RootState) => state.auth)

	// Если пользователь уже авторизован, показываем чат
	if (isAuthenticated) {
		return <Chat />
	}

	// Если номер телефона введен, показываем форму ввода кода
	if (phoneNumber) {
		return <VerificationCodeForm />
	}

	// Иначе показываем форму ввода номера телефона
	return <PhoneNumberForm />
} 