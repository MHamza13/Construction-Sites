import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../store";

/** API Base */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

/** Interfaces */
interface UserDeviceTokenState {
  loading: boolean;
  success: boolean;
  error: string | null;
}

interface ApiResponse {
  message?: string;
  data?: unknown;
}

// Register Token ke liye Payload
interface RegisterDeviceTokenPayload {
  userId: string | number;
  deviceToken: string;
  platform: string;
  deviceName: string;
}

// Notification bhejne ke liye Payload (Corrected with projectId)
interface SendNotificationPayload {
  userId: number | string;
  title: string;
  body: string;
  senderID: number | string;
  type: string;
  projectId: number | string; // 👈 Add kiya gaya
}

/** Initial State */
const initialState: UserDeviceTokenState = {
  loading: false,
  success: false,
  error: null,
};

/** Auth Header Helper */
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

/** 1. Register User Device Token */
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
    return rejectWithValue("Registration failed");
  }
});

/** 2. Send Notification to User */
export const sendNotificationToUser = createAsyncThunk<
  ApiResponse,
  SendNotificationPayload,
  { rejectValue: string; state: RootState }
>("userDeviceToken/send", async (notificationData, { rejectWithValue, getState }) => {
  const { userId, title, body, senderID, type, projectId } = notificationData;

  const requestBody = {
    type,
    userId,
    title,
    body,
    projectId,
    senderID,
  };

  try {
    const config = getAuthHeader(getState);
    const response = await axios.post(
      `${API_BASE}/UserDeviceToken/send/${userId}`, // Path parameter
      requestBody, // JSON Body
      config
    );
    return response.data as ApiResponse;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ?? err.message ?? "Send notification failed"
      );
    }
    return rejectWithValue("Send failed");
  }
});

/** ✅ Slice Logic */
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
      /** Register Token Cases */
      .addCase(registerUserDeviceToken.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(registerUserDeviceToken.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(registerUserDeviceToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Registration failed";
      })

      /** Send Notification Cases */
      .addCase(sendNotificationToUser.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(sendNotificationToUser.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(sendNotificationToUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Send notification failed";
      });
  },
});

export const { resetUserDeviceTokenState } = userDeviceTokenSlice.actions;
export default userDeviceTokenSlice.reducer;