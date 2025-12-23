import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../store";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE + "/Admins";

// ✅ Helper for auth header
const getAuthHeader = (getState: () => RootState) => {
  const token = getState().auth?.token;
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
      accept: "*/*",
    },
  };
};

// ✅ Types
export interface Admin {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isActive?: boolean;
  profilePictureUrl?: string;
  isSuperAdmin?: boolean;
  password?: string;
}

interface AdminState {
  admins: Admin[];
  admin?: Admin;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: AdminState = {
  admins: [],
  admin: undefined,
  loading: false,
  error: null,
  successMessage: null,
};

// ✅ 1. Add Admin
export const addAdmin = createAsyncThunk<
  string,
  Omit<Admin, "id">,
  { state: RootState; rejectValue: string }
>("admin/addAdmin", async (data, { getState, rejectWithValue }) => {
  try {
    const payload = { ...data, isSuperAdmin: false };
    const res = await axios.post(`${API_BASE}`, payload, getAuthHeader(getState));
    return res.data?.message ?? "Admin added successfully!";
  } catch (err: unknown) {
    const error = err as AxiosError<{ message?: string }>;
    return rejectWithValue(error.response?.data?.message ?? error.message);
  }
});

// ✅ 2. Get All Admins
export const fetchAdmins = createAsyncThunk<Admin[], void, { state: RootState; rejectValue: string }>(
  "admin/fetchAdmins",
  async (_, { getState, rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE}`, getAuthHeader(getState));
      return res.data as Admin[];
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      return rejectWithValue(error.response?.data?.message ?? error.message);
    }
  }
);

// ✅ 3. Update Admin
export const updateAdmin = createAsyncThunk<
  string,
  { id: string; data: Partial<Admin> },
  { state: RootState; rejectValue: string }
>("admin/updateAdmin", async ({ id, data }, { getState, rejectWithValue }) => {
  try {
    const res = await axios.put(`${API_BASE}/${id}`, data, getAuthHeader(getState));
    return res.data?.message ?? "Admin updated successfully!";
  } catch (err: unknown) {
    const error = err as AxiosError<{ message?: string }>;
    return rejectWithValue(error.response?.data?.message ?? error.message);
  }
});

// ✅ 4. Toggle Status
export const toggleAdminStatus = createAsyncThunk<
  string,
  { id: string; isActive: boolean },
  { state: RootState; rejectValue: string }
>("admin/toggleStatus", async ({ id, isActive }, { getState, rejectWithValue }) => {
  try {
    const res = await axios.patch(`${API_BASE}/${id}/status`, {id , isActive }, getAuthHeader(getState));
    return res.data?.message ?? "Admin status updated!";
  } catch (err: unknown) {
    const error = err as AxiosError<{ message?: string }>;
    return rejectWithValue(error.response?.data?.message ?? error.message);
  }
});

// ✅ 5. Send New Password Email
export const sendNewPassword = createAsyncThunk<
  string,
  string,
  { state: RootState; rejectValue: string }
>("admin/sendNewPassword", async (userId, { getState, rejectWithValue }) => {
  try {
    const res = await axios.post(`${API_BASE}/send-new-password/${userId}`, {}, getAuthHeader(getState));
    return res.data?.message ?? "New password sent successfully!";
  } catch (err: unknown) {
    const error = err as AxiosError<{ message?: string }>;
    return rejectWithValue(error.response?.data?.message ?? error.message);
  }
});

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearMessages: (state) => {
      state.successMessage = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) => action.type.startsWith("admin/") && action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
          state.successMessage = null;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("admin/") && action.type.endsWith("/fulfilled"),
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          if (Array.isArray(action.payload)) {
            state.admins = action.payload;
          } else if (typeof action.payload === "string") {
            state.successMessage = action.payload;
          }
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("admin/") && action.type.endsWith("/rejected"),
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.error = action.payload || "An error occurred.";
        }
      );
  },
});

export const { clearMessages } = adminSlice.actions;
export default adminSlice.reducer;

// ✅ Selectors
export const selectAdmins = (state: RootState) => state.admin.admins;
export const selectAdminLoading = (state: RootState) => state.admin.loading;
export const selectAdminError = (state: RootState) => state.admin.error;
export const selectAdminSuccess = (state: RootState) => state.admin.successMessage;