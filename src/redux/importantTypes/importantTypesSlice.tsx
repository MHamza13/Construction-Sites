import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../store";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE + "/ImportantTypes";

// --- Types ---
export interface ImportantType {
  _id: string;
  typeName: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ImportantTypeState {
  importantTypes: ImportantType[];
  loading: boolean;
  error: string | null;
}

const initialState: ImportantTypeState = {
  importantTypes: [],
  loading: false,
  error: null,
};

// --- Helper: Auth Header ---
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

// --- Thunks ---

// 1️⃣ Fetch all Important Types
export const fetchImportantTypes = createAsyncThunk<
  ImportantType[],
  void,
  { state: RootState; rejectValue: string }
>("importantTypes/fetchImportantTypes", async (_, { getState, rejectWithValue }) => {
  try {
    const res = await axios.get(`${API_BASE}`, getAuthHeader(getState));
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch types");
    }
    if (err instanceof Error) {
      return rejectWithValue(err.message);
    }
    return rejectWithValue("Failed to fetch types");
  }
});

// 2️⃣ Fetch single Important Type by ID
export const fetchImportantTypeById = createAsyncThunk<
  ImportantType,
  string,
  { state: RootState; rejectValue: string }
>("importantTypes/fetchImportantTypeById", async (id, { getState, rejectWithValue }) => {
  try {
    const res = await axios.get(`${API_BASE}/${id}`, getAuthHeader(getState));
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to fetch type by ID"
      );
    }
    if (err instanceof Error) {
      return rejectWithValue(err.message);
    }
    return rejectWithValue("Failed to fetch type by ID");
  }
});

// 3️⃣ Create Important Type
export const createImportantType = createAsyncThunk<
  ImportantType,
  { typeName: string },
  { state: RootState; rejectValue: string }
>("importantTypes/createImportantType", async (data, { getState, rejectWithValue }) => {
  try {
    const res = await axios.post(`${API_BASE}`, data, getAuthHeader(getState));
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to create type");
    }
    if (err instanceof Error) {
      return rejectWithValue(err.message);
    }
    return rejectWithValue("Failed to create type");
  }
});

// 4️⃣ Update Important Type
export const updateImportantType = createAsyncThunk<
  ImportantType,
  { id: string; data: Partial<ImportantType> },
  { state: RootState; rejectValue: string }
>("importantTypes/updateImportantType", async ({ id, data }, { getState, rejectWithValue }) => {
  try {
    const res = await axios.put(`${API_BASE}/${id}`, data, getAuthHeader(getState));
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to update type");
    }
    if (err instanceof Error) {
      return rejectWithValue(err.message);
    }
    return rejectWithValue("Failed to update type");
  }
});

// 5️⃣ Delete Important Type
export const deleteImportantType = createAsyncThunk<
  string,
  string,
  { state: RootState; rejectValue: string }
>("importantTypes/deleteImportantType", async (id, { getState, rejectWithValue }) => {
  try {
    await axios.delete(`${API_BASE}/${id}`, getAuthHeader(getState));
    return id;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to delete type");
    }
    if (err instanceof Error) {
      return rejectWithValue(err.message);
    }
    return rejectWithValue("Failed to delete type");
  }
});

// --- Slice ---
const importantTypeSlice = createSlice({
  name: "importantTypes",
  initialState,
  reducers: {
     clearImportantTypesCache: (state) => {
      state.importantTypes = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 🔹 Fetch All
      .addCase(fetchImportantTypes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchImportantTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.importantTypes = action.payload;
      })
      .addCase(fetchImportantTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error fetching important types";
      })

      // 🔹 Fetch by ID
      .addCase(fetchImportantTypeById.fulfilled, (state, action) => {
        const existingIndex = state.importantTypes.findIndex((t) => t._id === action.payload._id);
        if (existingIndex !== -1) state.importantTypes[existingIndex] = action.payload;
        else state.importantTypes.push(action.payload);
      })

      // 🔹 Create
      .addCase(createImportantType.pending, (state) => {
        state.loading = true;
      })
      .addCase(createImportantType.fulfilled, (state, action) => {
        state.loading = false;
        state.importantTypes.push(action.payload);
      })
      .addCase(createImportantType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error creating important type";
      })

      // 🔹 Update
      .addCase(updateImportantType.fulfilled, (state, action) => {
        const index = state.importantTypes.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) state.importantTypes[index] = action.payload;
      })

      // 🔹 Delete
      .addCase(deleteImportantType.fulfilled, (state, action) => {
        state.importantTypes = state.importantTypes.filter((t) => t._id !== action.payload);
      });
  },
});


export const { clearImportantTypesCache } = importantTypeSlice.actions;
export default importantTypeSlice.reducer;