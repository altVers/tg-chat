"use client"

import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import Cookies from "js-cookie"
import { setAuthenticated, setSessionId, resetAuth, setAuthLoading, setCurrentUserId, setCurrentUserPhotoUrl } from "@/store/slices/authSlice"
import { RootState } from "@/store"
import { telegramService } from "@/services/telegram"

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const dispatch = useDispatch()
	const { isAuthenticated, sessionId: currentSessionId, currentUserId: currentLoggedInUserId } = useSelector((state: RootState) => state.auth);

	useEffect(() => {
		// Проверяем наличие sessionId и currentUserId в куках при загрузке приложения
		const savedSessionId = Cookies.get('sessionId');
		const savedUserId = Cookies.get('currentUserId');

		const initializeAuth = async () => {
			if (savedSessionId && savedUserId) {
				// Если sessionId и currentUserId найдены в куках
				dispatch(setSessionId(savedSessionId));
				// Сохраняем currentUserId как строку
				dispatch(setCurrentUserId(savedUserId));
				dispatch(setAuthenticated(true));

				// --- Загружаем фото текущего пользователя и сохраняем в сторе ---
				const userPhotoUrl = await telegramService.downloadProfilePhoto(savedSessionId, savedUserId);
				if (userPhotoUrl) {
					dispatch(setCurrentUserPhotoUrl(userPhotoUrl));
				} else {
					console.warn("Failed to load current user photo.");
				}
				// --- Конец загрузки фото ---

			} else if (!savedSessionId && isAuthenticated) {
				// Если в куках нет sessionId, но в Store пользователь авторизован (например, после ручного сброса),
				// сбрасываем состояние авторизации
				console.log("AuthProvider useEffect: No sessionId in cookies, but isAuthenticated is true in Store. Resetting auth.");
				dispatch(resetAuth());
			} else if (savedSessionId && !isAuthenticated && !savedUserId) {
				// Если есть sessionId, но нет userId и не авторизован, возможно, сессия не завершена?
				// Это может потребовать дополнительной логики или запроса на сервер.
				// Пока что просто сбрасываем, чтобы избежать неавторизованного состояния с кукой сессии без пользователя.
				console.warn("AuthProvider useEffect: Found sessionId but no userId and not authenticated. Resetting auth.");
				dispatch(resetAuth());
			} else {
				console.log("AuthProvider useEffect: No sessionId or userId in cookies.");
			}

			// После проверки сессии устанавливаем authLoading в false
			dispatch(setAuthLoading(false));
		};

		initializeAuth();

	}, [dispatch, isAuthenticated, currentSessionId, currentLoggedInUserId]);

	return <>{children}</>;
} 