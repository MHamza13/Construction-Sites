import { createSlice, createAsyncThunk, PayloadAction, createAction } from "@reduxjs/toolkit";
import axios from "axios";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { PURGE, REHYDRATE } from "redux-persist";
import { PersistPartial } from "redux-persist/es/persistReducer";
import { RootState } from "../store";

/** 🔹 API Base URL */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

/* ==========================
   🔹 Types
========================== */
interface User {
  userId: number | string;
  name: string;
  surname: string;
  email: string;
  phoneNumber?: string | null;
  isActive?: boolean;
  isSuperAdmin?: boolean;
  profilePictureUrl?: string | null;
  role?: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  token: string;
  message?: string;
  role?: string;
  isSuperAdmin?: boolean;
  isGoToLogin?: boolean;
  expiresAt?: string;
  chatId?: string;
}

interface ResetPasswordPayload {
  email: string;
  newPassword: string;
  confirmPassword: string;
  resetToken: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  expiresAt: string | null;
  chatId: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

type RehydratePayload = {
  auth?: AuthState;
} & PersistPartial;

/* ==========================
   🔹 Utility Functions
========================== */
const generateChatId = (userId: string | number): string =>
  `chat_${String(userId).trim()}`;

const getAuthHeader = (getState: () => RootState) => {
  const token = getState().auth?.token;
  return {
    headers: {
      accept: "*/*",
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};

/* ==========================
   🔹 Thunks
========================== */

/** ✅ Login User */
export const loginUser = createAsyncThunk<
  LoginResponse,
  LoginCredentials,
  { rejectValue: string }
>("auth/loginUser", async ({ email, password }, { rejectWithValue }) => {
  try {
    const res = await axios.post(
      `${API_BASE}/Auth/login`,
      { email, password },
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
      }
    );

    const data = res.data;

    // Decode token
    const decoded = jwtDecode<JwtPayload & { role?: string }>(data.token);
    const role = decoded.role ?? data.role ?? null;
    const expiresAt = decoded.exp
      ? new Date(decoded.exp * 1000).toISOString()
      : new Date(Date.now() + 3600000).toISOString();

    const userId = data.userId ?? data.user?.id ?? "";
    const chatId = generateChatId(userId);

    const user: User = {
      userId,
      name: data.user?.name ?? "",
      surname: data.user?.surname ?? "",
      email: data.user?.email ?? "",
      phoneNumber: data.user?.phoneNumber ?? null,
      isActive: data.user?.isActive ?? false,
      isSuperAdmin: data.isSuperAdmin ?? false,
      profilePictureUrl: data.user?.profilePictureUrl ?? null,
      role,
    };

    // 🔥 ADMIN ROLE CHECK - Yahan check kar rahe hain
    const isAdmin = role === "Admin" || data.isSuperAdmin === true;
    
    if (!isAdmin) {
      return rejectWithValue(
        "❌ Access Denied! Only Admin/SuperAdmin users can log in."
      );
    }

    console.log("✅ Admin verified:", { role, isSuperAdmin: data.isSuperAdmin });

    return {
      user,
      token: data.token,
      message: data.message,
      role,
      isSuperAdmin: data.isSuperAdmin ?? false,
      isGoToLogin: data.isGoToLogin ?? false,
      expiresAt,
      chatId,
    };
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ??
          err.message ??
          "Login failed. Please try again."
      );
    }
    return rejectWithValue("Login failed. Please try again.");
  }
});

/** ✅ Approve User */
export const approveUser = createAsyncThunk<
  void,
  string,
  { rejectValue: string; state: RootState }
>("auth/approveUser", async (userId, { rejectWithValue, getState }) => {
  try {
    await axios.patch(`${API_BASE}/Auth/approve/${userId}`, null, getAuthHeader(getState));
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ?? err.message ?? "User approval failed."
      );
    }
    return rejectWithValue("User approval failed.");
  }
});

/** ✅ Forget Password (Send OTP) */
export const forgetPassword = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("auth/forgetPassword", async (email, { rejectWithValue }) => {
  try {
    const res = await axios.post(`${API_BASE}/Auth/forget-password`, { email });
    return res.data?.message ?? "OTP sent successfully.";
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ?? err.message ?? "Failed to send OTP."
      );
    }
    return rejectWithValue("Failed to send OTP.");
  }
});

/** ✅ Verify Forgot Password OTP */
export const verifyForgotOtp = createAsyncThunk<
  { message: string; resetToken: string },
  { email: string; otpCode: string },
  { rejectValue: string }
>("auth/verifyForgotOtp", async ({ email, otpCode }, { rejectWithValue }) => {
  try {
    const res = await axios.post(`${API_BASE}/Auth/verify-forgot-otp`, {
      email,
      otpCode,
    });
    return {
      message: res.data?.message ?? "OTP verified successfully.",
      resetToken: res.data?.resetToken ?? "",
    };
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ?? err.message ?? "OTP verification failed."
      );
    }
    return rejectWithValue("OTP verification failed.");
  }
});

/** ✅ Reset Forgotten Password */
export const resetForgotPassword = createAsyncThunk<
  string,
  ResetPasswordPayload,
  { rejectValue: string }
>("auth/resetForgotPassword", async (payload, { rejectWithValue }) => {
  try {
    const res = await axios.post(`${API_BASE}/Auth/reset-password`, payload);
    return res.data?.message ?? "Password reset successfully.";
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ?? err.message ?? "Failed to reset password."
      );
    }
    return rejectWithValue("Failed to reset password.");
  }
});

/** ✅ Resend OTP */
export const resendOtp = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("auth/resendOtp", async (email, { rejectWithValue }) => {
  try {
    const res = await axios.post(`${API_BASE}/Auth/resend-otp`, { email });
    return res.data?.message ?? "OTP resent successfully.";
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ?? err.message ?? "Failed to resend OTP."
      );
    }
    return rejectWithValue("Failed to resend OTP.");
  }
});

/* ==========================
   🔹 Slice
========================== */
const initialState: AuthState = {
  user: null,
  token: null,
  expiresAt: null,
  chatId: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

const purgeAction = createAction(PURGE);
const rehydrateAction = createAction<RehydratePayload | undefined>(REHYDRATE);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      Object.assign(state, initialState);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /** 🔹 Login */
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.chatId = action.payload.chatId ?? null;
        state.expiresAt = action.payload.expiresAt ?? null;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Login failed";
        state.isAuthenticated = false;
      })

      /** 🔹 Forget Password */
      .addCase(forgetPassword.pending, (state) => {
        state.loading = true;
      })
      .addCase(forgetPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(forgetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to send OTP";
      })

      /** 🔹 Verify OTP */
      .addCase(verifyForgotOtp.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyForgotOtp.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(verifyForgotOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "OTP verification failed";
      })

      /** 🔹 Reset Password */
      .addCase(resetForgotPassword.pending, (state) => {
        state.loading = true;
      })
      .addCase(resetForgotPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resetForgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to reset password";
      })

      /** 🔹 Resend OTP */
      .addCase(resendOtp.pending, (state) => {
        state.loading = true;
      })
      .addCase(resendOtp.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to resend OTP";
      })

      /** 🔹 Rehydrate & Purge */
      .addCase(purgeAction, () => initialState)
      .addCase(rehydrateAction, (state, action) => {
        const payload = action.payload ?? {};
        const persistedAuth = payload.auth ?? payload;
        if (persistedAuth && persistedAuth.token) {
          Object.assign(state, { ...persistedAuth, isAuthenticated: true });
        }
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
