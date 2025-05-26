import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface AuthState {
	isAuthenticated: boolean
	phoneNumber: string | null
	sessionId: string | null
	error: string | null
	authLoading: boolean
	currentUserId: string | null
	currentUserPhotoUrl: string | null
}

const initialState: AuthState = {
	isAuthenticated: false,
	phoneNumber: null,
	sessionId: null,
	error: null,
	authLoading: true,
	currentUserId: null,
	currentUserPhotoUrl: null
}

export const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		setPhoneNumber: (state, action: PayloadAction<string>) => {
			state.phoneNumber = action.payload
			state.error = null
		},
		setSessionId: (state, action: PayloadAction<string | null>) => {
			state.sessionId = action.payload
			state.error = null
		},
		setAuthenticated: (state, action: PayloadAction<boolean>) => {
			state.isAuthenticated = action.payload
		},
		setError: (state, action: PayloadAction<string>) => {
			state.error = action.payload
		},
		setAuthLoading: (state, action: PayloadAction<boolean>) => {
			state.authLoading = action.payload
		},
		setCurrentUserId: (state, action: PayloadAction<string | null>) => {
			state.currentUserId = action.payload
		},
		setCurrentUserPhotoUrl: (state, action: PayloadAction<string | null>) => {
			state.currentUserPhotoUrl = action.payload
		},
		resetAuth: (state) => {
			state.isAuthenticated = false
			state.phoneNumber = null
			state.sessionId = null
			state.error = null
			state.authLoading = true
			state.currentUserId = null
			state.currentUserPhotoUrl = null
		}
	}
})

export const {
	setPhoneNumber,
	setSessionId,
	setAuthenticated,
	setError,
	setAuthLoading,
	setCurrentUserId,
	setCurrentUserPhotoUrl,
	resetAuth
} = authSlice.actions 