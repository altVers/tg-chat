import { configureStore } from "@reduxjs/toolkit"
import { authSlice } from "./slices/authSlice"
import { chatSlice } from "./slices/chatSlice"

export const store = configureStore({
	reducer: {
		auth: authSlice.reducer,
		chat: chatSlice.reducer
	}
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 