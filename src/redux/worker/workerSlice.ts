import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError, AxiosResponse } from "axios";
import { RootState } from "../store";

// Worker Interface (same as yours)
export interface Worker {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  profilePictureUrl?: string;
  experience: number;
  dailyWages: number;
  perHourSalary: number;
  specializationId: number;
  specializationName?: string;
  stats?: any[];
  payments?: any[];
  pendingInvoices?: any[];
  tasks?: any[];
  invoices?: any[];
  skills?: string[] | string;
  employeeId?: string;
  isApprovedByAdmins?: boolean;
}

interface WorkersState {
  items: Worker[];
  current: Worker | null;
  loading: boolean;
  error: string | null;
}

const initialState: WorkersState = {
  items: [],
  current: null,
  loading: false,
  error: null,
};

const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE}/Workers`;

const getAuthHeader = (getState: () => RootState) => {
  const token = getState().auth?.token;
  return {
    headers: {
      accept: "*/*",
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};

const extractErrorMessage = (error: unknown): string => {
  const err = error as AxiosError<{ message?: string } | string>;
  if (typeof err.response?.data === "string") return err.response.data;
  if (typeof err.response?.data === "object" && err.response?.data?.message)
    return err.response.data.message;
  return err.message || "An unexpected error occurred";
};

// ==========================
// Async Thunks (NO CACHE)
// ==========================

export const fetchWorkers = createAsyncThunk<
  Worker[],
  void,
  { state: RootState; rejectValue: string }
>("workers/fetchWorkers", async (_, { rejectWithValue, getState }) => {
  try {
    const res: AxiosResponse<Worker[]> = await axios.get(BASE_URL, getAuthHeader(getState));
    return res.data; // Always fresh data
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error));
  }
});

export const createWorker = createAsyncThunk<
  Worker,
  Worker,
  { state: RootState; rejectValue: string }
>("workers/createWorker", async (workerData, { rejectWithValue, getState }) => {
  try {
    const res: AxiosResponse<Worker> = await axios.post(BASE_URL, workerData, getAuthHeader(getState));
    return res.data;
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error));
  }
});

export const fetchWorkerById = createAsyncThunk<
  Worker,
  number,
  { state: RootState; rejectValue: string }
>("workers/fetchWorkerById", async (id, { rejectWithValue, getState }) => {
  try {
    const res: AxiosResponse<Worker> = await axios.get(`${BASE_URL}/${id}`, getAuthHeader(getState));
    return res.data;
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error));
  }
});

export const updateWorker = createAsyncThunk<
  Worker,
  { id: number; data: Partial<Worker> },
  { state: RootState; rejectValue: string }
>("workers/updateWorker", async ({ id, data }, { rejectWithValue, getState }) => {
  try {
    const res: AxiosResponse<Worker> = await axios.put(`${BASE_URL}/${id}`, data, getAuthHeader(getState));
    return res.data;
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error));
  }
});

export const deleteWorker = createAsyncThunk<
  number,
  number,
  { state: RootState; rejectValue: string }
>("workers/deleteWorker", async (id, { rejectWithValue, getState }) => {
  try {
    await axios.delete(`${BASE_URL}/${id}`, getAuthHeader(getState));
    return id;
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error));
  }
});

export const updateWorkerStatus = createAsyncThunk<
  Worker,
  { id: number; status: boolean },
  { state: RootState; rejectValue: string }
>("workers/updateWorkerStatus", async ({ id, status }, { rejectWithValue, getState }) => {
  try {
    const res: AxiosResponse<Worker> = await axios.put(
      `${BASE_URL}/${id}/status`,
      { status },
      getAuthHeader(getState)
    );
    return res.data;
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error));
  }
});

// ==========================
// Slice (No Cache, Always Fresh)
// ==========================
const workersSlice = createSlice({
  name: "workers",
  initialState,
  reducers: {
    clearWorkersCache: (state) => {
      state.items = [];
      state.current = null; // optional clear
    },
    clearCurrentWorker: (state) => {
      state.current = null; // useful if leaving the page
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Workers
      .addCase(fetchWorkers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkers.fulfilled, (state, action: PayloadAction<Worker[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchWorkers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch workers";
      })

      // Fetch Worker By ID
      .addCase(fetchWorkerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkerById.fulfilled, (state, action: PayloadAction<Worker>) => {
        state.loading = false;
        state.current = action.payload; // ✅ this is the fix
      })
      .addCase(fetchWorkerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch worker";
        state.current = null;
      })

      // Create Worker
      .addCase(createWorker.fulfilled, (state, action: PayloadAction<Worker>) => {
        state.items.push(action.payload);
      })

      // Update Worker
      .addCase(updateWorker.fulfilled, (state, action: PayloadAction<Worker>) => {
        state.items = state.items.map((w) => (w.id === action.payload.id ? action.payload : w));
        if (state.current?.id === action.payload.id) state.current = action.payload; // update current
      })

      // Delete Worker
      .addCase(deleteWorker.fulfilled, (state, action: PayloadAction<number>) => {
        state.items = state.items.filter((w) => w.id !== action.payload);
        if (state.current?.id === action.payload) state.current = null;
      })

      // Update Status
      .addCase(updateWorkerStatus.fulfilled, (state, action: PayloadAction<Worker>) => {
        state.items = state.items.map((w) => (w.id === action.payload.id ? action.payload : w));
        if (state.current?.id === action.payload.id) state.current = action.payload;
      });
  },
});

export const { clearWorkersCache } = workersSlice.actions;
export default workersSlice.reducer;