"use client"

import { useEffect } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/store"
import { useRouter } from "next/navigation"

export default function Home() {
	const { isAuthenticated, sessionId, authLoading } = useSelector((state: RootState) => state.auth)
	const router = useRouter()

	useEffect(() => {
		if (!authLoading) {
			if (isAuthenticated && sessionId) {
				console.log("Home Page useEffect: Authenticated, redirecting to /chat");
				router.push("/chat")
			} else {
				console.log("Home Page useEffect: Not authenticated, redirecting to /auth");
				router.push("/auth")
			}
		}
	}, [isAuthenticated, sessionId, authLoading, router])

	return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            Загрузка...
        </div>
    );
} 