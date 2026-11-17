import { logout } from "@/features/auth/authSlice";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface Toast {
  id: number;
  message: string;
}

interface NoticesState {
  sessionExpired: boolean;
  toasts: Toast[];
}

const initialState: NoticesState = {
  sessionExpired: false,
  toasts: [],
};

let nextToast = 1;

const noticesSlice = createSlice({
  name: "notices",
  initialState,
  reducers: {
    sessionExpired(state) {
      state.sessionExpired = true;
    },
    dismissSessionExpired(state) {
      state.sessionExpired = false;
    },
    showToast: {
      reducer(state, action: PayloadAction<Toast>) {
        state.toasts = [...state.toasts, action.payload].slice(-3);
      },
      prepare(message: string) {
        return { payload: { id: nextToast++, message } };
      },
    },
    hideToast(state, action: PayloadAction<number>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout.fulfilled, () => initialState);
  },
});

export const { sessionExpired, dismissSessionExpired, showToast, hideToast } =
  noticesSlice.actions;
export default noticesSlice.reducer;
