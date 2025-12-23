import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../store";

/** API Base */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

/** Types */
interface UserDeviceTokenState {
  loading: boolean;
  success: boolean;
  error: string | null;
}

// Generic API response type
interface ApiResponse {
  message?: string;
  data?: unknown;
}

// Payload type for registerUserDeviceToken
interface RegisterDeviceTokenPayload {
  userId: string;
  deviceToken: string;
  platform: string;
  deviceName: string;
}

// 🚀 NEW: Payload type for sending a notification
interface SendNotificationPayload {
  userId: number | string;
  title: string;
  body: string;
  senderID: number | string;
  type: string;
}

/** Initial State */
const initialState: UserDeviceTokenState = {
  loading: false,
  success: false,
  error: null,
};

const getAuthHeader = (getState: () => RootState) => {
  const token = getState().auth?.token;
  return {
    headers: {
      accept: "*/*",
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  };
};

export const registerUserDeviceToken = createAsyncThunk<
  ApiResponse,
  RegisterDeviceTokenPayload,
  { rejectValue: string; state: RootState }
>("userDeviceToken/register", async (tokenData, { rejectWithValue, getState }) => {
  try {
    const config = getAuthHeader(getState);
    const response = await axios.post(
      `${API_BASE}/UserDeviceToken/register-token`,
      tokenData,
      config
    );
    return response.data as ApiResponse;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ?? err.message ?? "Registration failed"
      );
    }
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Registration failed");
  }
});

export const sendNotificationToUser = createAsyncThunk<
  ApiResponse,
  SendNotificationPayload,
  { rejectValue: string; state: RootState }
>("userDeviceToken/send", async (notificationData, { rejectWithValue, getState }) => {
  const { userId, title, body, senderID , type } = notificationData;

  // Body mein bhi userId bhejo (agar backend expect karta hai)
  const requestBody = {
    type,
    userId,       
    title,
    body,
    senderID,
  };

  try {
    const config = getAuthHeader(getState);
    const response = await axios.post(
      `${API_BASE}/UserDeviceToken/send/${userId}`, // path param
      requestBody, // body mein bhi userId
      config
    );
    return response.data as ApiResponse;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ?? err.message ?? "Send failed"
      );
    }
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Send failed");
  }
});

/** ✅ Slice */
const userDeviceTokenSlice = createSlice({
  name: "userDeviceToken",
  initialState,
  reducers: {
    resetUserDeviceTokenState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /** 🔹 Register Token */
      .addCase(registerUserDeviceToken.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(registerUserDeviceToken.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(registerUserDeviceToken.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.loading = false;
        state.error = action.payload ?? "Registration failed";
      })

      /** 🔹 Send Notification */
      .addCase(sendNotificationToUser.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(sendNotificationToUser.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(sendNotificationToUser.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.loading = false;
        state.error = action.payload ?? "Send failed";
      });
  },
});

export const { resetUserDeviceTokenState } = userDeviceTokenSlice.actions;
export default userDeviceTokenSlice.reducer;