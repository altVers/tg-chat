import { useEffect } from "react"
import { init, miniApp } from "@telegram-apps/sdk"

export const useTelegramSDK = () => {
	useEffect(() => {
		const initializeSDK = async () => {
			try {
				await init()

				if (miniApp.ready.isAvailable()) {
					await miniApp.ready()
					console.log("Mini App готово")
				}
			} catch (error) {
				console.error("Ошибка инициализации:", error)
			}
		}

		initializeSDK()
	}, [])
} 