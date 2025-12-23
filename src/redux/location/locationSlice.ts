import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../store";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

// ------------------ TYPES ------------------
interface Location {
  id?: number;
  workerId: number;
  lat: number;
  long: number;
  createdOn?: string;
}

interface LocationState {
  locations: Location[];
  filteredLocations: Location[];
  liveLocations: Location[];
  loading: boolean;
  error: string | null;
}

interface FilterParams {
  workerId: number;
  startDate: string;
  endDate: string;
}


// ------------------ INITIAL STATE ------------------
const initialState: LocationState = {
  locations: [],
  filteredLocations: [],
  liveLocations: [],
  loading: false,
  error: null,
};

// ------------------ HELPERS ------------------
const getAuthHeader = (getState: any) => {
  const token = (getState() as RootState).auth?.token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

// ------------------ THUNKS ------------------

// ✅ 1. Save location
export const saveLocation = createAsyncThunk<
  Location,
  { workerId: number; lat: number; long: number },
  { state: RootState; rejectValue: string }
>("location/saveLocation", async ({ workerId, lat, long }, { getState, rejectWithValue }) => {
  try {
    const headers = getAuthHeader(getState);
    const response = await axios.post(`${API_BASE}/Location`, { workerId, lat, long }, { headers });
    return response.data.value || response.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to save location");
  }
});

// ✅ 2. Get all locations for a single worker
export const getWorkerLocations = createAsyncThunk<
  Location[],
  number,
  { state: RootState; rejectValue: string }
>("location/getWorkerLocations", async (workerId, { getState, rejectWithValue }) => {
  try {
    const headers = getAuthHeader(getState);
    const response = await axios.get(`${API_BASE}/Location/user/${workerId}`, { headers });
    return response.data.value || response.data || [];
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch worker locations");
  }
});

// ✅ 3. Get all workers' latest locations
export const getAllWorkersLocations = createAsyncThunk<
  Location[],
  void,
  { state: RootState; rejectValue: string }
>("location/getAllWorkersLocations", async (_, { getState, rejectWithValue }) => {
  try {
    const headers = getAuthHeader(getState);
    const response = await axios.get(`${API_BASE}/Location`, { headers });
    return response.data.value || response.data || [];
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch all workers' locations");
  }
});

// ✅ 4. Filter locations by date range
export const filterWorkerLocations = createAsyncThunk<
  Location[],
  FilterParams,
  { state: RootState; rejectValue: string }
>("location/filterWorkerLocations", async ({ workerId, startDate, endDate }, { getState, rejectWithValue }) => {
  try {
    const headers = getAuthHeader(getState);
    const response = await axios.get(`${API_BASE}/Location/filter`, {
      headers,
      params: { workerId, startDate, endDate },
    });
    return response.data.value || response.data || [];
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to filter locations");
  }
});

// ✅ 5. NEW — Get live locations by ShiftId & WorkerId
export const getLiveLocationsByShift = createAsyncThunk<
  any[],
  { shiftId: number; workerId: number },
  { state: RootState; rejectValue: string }
>("location/getLiveLocationsByShift", async ({ shiftId, workerId }, { getState, rejectWithValue }) => {
  try {
    const headers = getAuthHeader(getState);
    const res = await axios.get(`${API_BASE}/Location/by-shift`, {
      headers,
      params: { shiftId, workerId },
    });

    // ✅ Parse stringified JSON array if necessary
    let val = res.data.value;
    if (typeof val === "string") {
      try {
        val = JSON.parse(val);
      } catch (e) {
        console.error("Failed to parse value string:", e);
        val = [];
      }
    }

    return val || [];
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch live locations");
  }
});

// ------------------ SLICE ------------------
const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearLocations: (state) => {
      state.locations = [];
      state.filteredLocations = [];
      state.liveLocations = [];
    },
  },
  extraReducers: (builder) => {
    // Save location
    builder
      .addCase(saveLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveLocation.fulfilled, (state, action: PayloadAction<Location>) => {
        state.loading = false;
        state.locations.push(action.payload);
      })
      .addCase(saveLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to save location";
      });

    // Get worker locations
    builder
      .addCase(getWorkerLocations.pending, (state) => {
        state.loading = true;
      })
      .addCase(getWorkerLocations.fulfilled, (state, action: PayloadAction<Location[]>) => {
        state.loading = false;
        state.locations = action.payload;
      })
      .addCase(getWorkerLocations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch worker locations";
      });

    // Get all workers' locations
    builder
      .addCase(getAllWorkersLocations.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllWorkersLocations.fulfilled, (state, action: PayloadAction<Location[]>) => {
        state.loading = false;
        state.locations = action.payload;
      })
      .addCase(getAllWorkersLocations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch all workers' locations";
      });

    // Filter locations
    builder
      .addCase(filterWorkerLocations.pending, (state) => {
        state.loading = true;
      })
      .addCase(filterWorkerLocations.fulfilled, (state, action: PayloadAction<Location[]>) => {
        state.loading = false;
        state.filteredLocations = action.payload;
      })
      .addCase(filterWorkerLocations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to filter locations";
      });

    // ✅ Live locations by shift
    builder
      .addCase(getLiveLocationsByShift.pending, (state) => {
  state.loading = true;
})
.addCase(getLiveLocationsByShift.fulfilled, (state, action) => {
  state.loading = false;
  state.liveLocations = action.payload || [];
})
.addCase(getLiveLocationsByShift.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload ?? "Failed to fetch live locations";
});

  },
});

export const { clearError, clearLocations } = locationSlice.actions;
export default locationSlice.reducer;
