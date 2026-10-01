import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthUser } from "@/core/interfaces/auth";

export type AuthStatus = "unknown" | "authed" | "guest";

export interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
}

export const LOCAL_USER: AuthUser = {
  userId: 1,
  username: "Local User",
  email: "user@tomo.local",
  role: "ADMIN",
};

export function decodeUser(_token: string): AuthUser | null {
  return LOCAL_USER;
}

const initialState: AuthState = {
  user: LOCAL_USER,
  status: "authed",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload ?? LOCAL_USER;
      state.status = "authed";
    },
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
