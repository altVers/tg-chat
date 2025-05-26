import { useState, useEffect } from "react"
import { telegramService } from "@/services/telegram"

interface ParticipantsPhotos {
	[userId: string]: string
}

export function useParticipantsPhotos(sessionId: string | null, chatId: number | null, isGroupChat: boolean) {
	const [photos, setPhotos] = useState<ParticipantsPhotos>({})
	const [isLoading, setIsLoading] = useState(false)

	useEffect(() => {
		async function fetchParticipantsPhotos() {
			if (!sessionId || !chatId || !isGroupChat) return

			setIsLoading(true)
			try {
				const participants = await telegramService.getParticipants(sessionId, chatId)
				const photosMap: ParticipantsPhotos = {}

				for (const participant of participants) {
					if (participant.photoUrl) {
						photosMap[participant.id] = participant.photoUrl
					}
				}

				setPhotos(photosMap)
			} catch (error) {
				console.error("Ошибка при получении фотографий участников:", error)
			} finally {
				setIsLoading(false)
			}
		}

		fetchParticipantsPhotos()
	}, [sessionId, chatId, isGroupChat])

	return { photos, isLoading }
} 