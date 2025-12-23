import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../store"; // ✅ Import your store types

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE + "/ProjectShifts";

// --- Type Definitions ---
interface ProjectShift {
  Id: number;
  WorkerId: number;
  projectId: number;
  checkIn: string;
  checkInLat: number;
  checkInLong: number;
  endShift: string | null;
  endShiftLat: number | null;
  endShiftLong: number | null;
  status: string;
}

interface CheckInPayload {
  workerId: number;
  projectId: number;
  checkIn: string;
  checkInLat: number;
  checkInLong: number;
}

interface EndShiftPayload {
  shiftId: number;
  endShift: string;
  endShiftLat: number;
  endShiftLong: number;
}

// ✅ Helper: Auth Header
const getAuthHeader = (getState: () => RootState) => {
  const token = getState().auth?.token;
  return {
    headers: {
      accept: "*/*",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
};

// --- Async Thunks ---

// ✅ 1. Check-In
export const checkInWorker = createAsyncThunk<
  ProjectShift,
  CheckInPayload,
  { state: RootState; rejectValue: string }
>("projectShifts/checkIn", async (shiftData, { getState, rejectWithValue }) => {
  try {
    const config = getAuthHeader(getState);
    const { data } = await axios.post<ProjectShift>(
      `${API_BASE_URL}/checkin`,
      shiftData,
      config
    );
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    return rejectWithValue(err.response?.data?.message || "Failed to check in worker");
  }
});

// ✅ 2. End Shift
export const endShiftWorker = createAsyncThunk<
  ProjectShift,
  EndShiftPayload,
  { state: RootState; rejectValue: string }
>("projectShifts/endShift", async (shiftData, { getState, rejectWithValue }) => {
  try {
    const config = getAuthHeader(getState);
    const { data } = await axios.post<ProjectShift>(
      `${API_BASE_URL}/endshift`,
      shiftData,
      config
    );
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    return rejectWithValue(err.response?.data?.message || "Failed to end worker shift");
  }
});

// ✅ 3. Fetch All
export const fetchAllProjectShifts = createAsyncThunk<
  ProjectShift[],
  void,
  { state: RootState; rejectValue: string }
>("projectShifts/fetchAll", async (_, { getState, rejectWithValue }) => {
  try {
    const config = getAuthHeader(getState);
    const { data } = await axios.get<ProjectShift[]>(`${API_BASE_URL}/all`, config);
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    return rejectWithValue(err.response?.data?.message || "Failed to fetch all project shifts");
  }
});

// ✅ 4. Fetch By Worker ID
export const fetchShiftsByWorkerId = createAsyncThunk<
  ProjectShift[],
  string,
  { state: RootState; rejectValue: string }
>("projectShifts/fetchByWorkerId", async (workerId, { getState, rejectWithValue }) => {
  try {
    const config = getAuthHeader(getState);
    const { data } = await axios.get<ProjectShift[]>(
      `${API_BASE_URL}/by-worker/${workerId}`,
      config
    );
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    return rejectWithValue(err.response?.data?.message || "Failed to fetch worker shifts");
  }
});

// ✅ 5. Fetch By Project ID
export const fetchShiftsByProjectId = createAsyncThunk<
  ProjectShift[],
  string,
  { state: RootState; rejectValue: string }
>("projectShifts/fetchByProjectId", async (projectId, { getState, rejectWithValue }) => {
  try {
    const config = getAuthHeader(getState);
    const { data } = await axios.get<ProjectShift[]>(
      `${API_BASE_URL}/by-project/${projectId}`,
      config
    );
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    return rejectWithValue(
      err.response?.data?.message || "Failed to fetch project shifts by project ID"
    );
  }
});

// ✅ 6. Fetch By Worker + Date
export const fetchShiftsByWorkerAndDate = createAsyncThunk<
  ProjectShift[],
  { workerId: string; shiftDate: string },
  { state: RootState; rejectValue: string }
>("projectShifts/fetchByWorkerAndDate", async ({ workerId, shiftDate }, { getState, rejectWithValue }) => {
  try {
    const config = getAuthHeader(getState);
    const { data } = await axios.get<ProjectShift[]>(
      `${API_BASE_URL}/worker/${workerId}/date/${shiftDate}`,
      config
    );
    return data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    return rejectWithValue(err.response?.data?.message || "Failed to fetch shifts by date");
  }
});

// ✅ 7. Fetch By Worker + Project
export const fetchShiftsByWorkerAndProject = createAsyncThunk<
  ProjectShift[],
  { workerId: string; projectId: string },
  { state: RootState; rejectValue: string }
>(
  "projectShifts/fetchByWorkerAndProject",
  async ({ workerId, projectId }, { getState, rejectWithValue }) => {
    try {
      const config = getAuthHeader(getState);
      const { data } = await axios.get<ProjectShift[]>(
        `${API_BASE_URL}/worker/${workerId}/project/${projectId}`,
        config
      );
      return data;
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch shifts by worker and project"
      );
    }
  }
);

// --- Slice ---
interface ProjectShiftState {
  shifts: ProjectShift[];
  singleShift: ProjectShift | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProjectShiftState = {
  shifts: [],
  singleShift: null,
  loading: false,
  error: null,
};

const projectShiftSlice = createSlice({
  name: "projectShifts",
  initialState,
  reducers: {
    clearShifts: (state) => {
      state.shifts = [];
      state.error = null;
    },
    clearSingleShift: (state) => {
      state.singleShift = null;
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state: ProjectShiftState) => {
      state.loading = true;
      state.error = null;
    };

    const listFetchThunks = [
      fetchAllProjectShifts,
      fetchShiftsByWorkerId,
      fetchShiftsByProjectId,
      fetchShiftsByWorkerAndDate,
      fetchShiftsByWorkerAndProject, // ✅ added here
    ];

    listFetchThunks.forEach((thunk) => {
      builder
        .addCase(thunk.pending, handlePending)
        .addCase(thunk.fulfilled, (state, action) => {
          state.loading = false;
          state.shifts = Array.isArray(action.payload) ? action.payload : [];
          state.singleShift = null;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
          state.shifts = [];
        });
    });

    [checkInWorker, endShiftWorker].forEach((thunk) => {
      builder
        .addCase(thunk.pending, handlePending)
        .addCase(thunk.fulfilled, (state, action) => {
          state.loading = false;
          state.singleShift = action.payload;

          const index = state.shifts.findIndex((shift) => shift.Id === action.payload.Id);
          if (index === -1) {
            state.shifts.push(action.payload);
          } else {
            state.shifts[index] = action.payload;
          }
        })
        .addCase(thunk.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        });
    });
  },
});

export const { clearShifts, clearSingleShift } = projectShiftSlice.actions;
export default projectShiftSlice.reducer;
