// src/redux/slices/projectExpenseSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../store";

/** API Base */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

/** 🔹 Types */
export interface ProjectExpense {
  id?: string;
  projectId: string;
  title: string;
  amount: number;
  date: string;
  description?: string;
}

interface ProjectExpenseState {
  expenses: ProjectExpense[];
  expense: ProjectExpense | null;
  loading: boolean;
  success: boolean;
  error: string | null;
}

/** Initial State */
const initialState: ProjectExpenseState = {
  expenses: [],
  expense: null,
  loading: false,
  success: false,
  error: null,
};

/** 🔹 Auth Header Helper */
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

/** ✅ 1. Create Expense */
export const createProjectExpense = createAsyncThunk<
  ProjectExpense,
  ProjectExpense,
  { rejectValue: string; state: RootState }
>("projectExpense/create", async (data, { rejectWithValue, getState }) => {
  try {
    const config = getAuthHeader(getState);
    const response = await axios.post(`${API_BASE}/ProjectExpense`, data, {
       ...config,
      headers: {
        ...config.headers,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data as ProjectExpense;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(err.response?.data?.message ?? err.message ?? "Create failed");
    }
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Create failed");
  }
});

/** ✅ 2. Fetch All Expenses */
export const fetchAllProjectExpenses = createAsyncThunk<
  ProjectExpense[],
  void,
  { rejectValue: string; state: RootState }
>("projectExpense/fetchAll", async (_, { rejectWithValue, getState }) => {
  try {
    const config = getAuthHeader(getState);
    const response = await axios.get(`${API_BASE}/ProjectExpense`, config);
    return response.data as ProjectExpense[];
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(err.response?.data?.message ?? err.message ?? "Fetch failed");
    }
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Fetch failed");
  }
});

/** ✅ 3. Fetch Expense by ID */
export const fetchProjectExpenseById = createAsyncThunk<
  ProjectExpense,
  string,
  { rejectValue: string; state: RootState }
>("projectExpense/fetchById", async (id, { rejectWithValue, getState }) => {
  try {
    const config = getAuthHeader(getState);
    const response = await axios.get(`${API_BASE}/ProjectExpense/${id}`, config);
    return response.data as ProjectExpense;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(err.response?.data?.message ?? err.message ?? "Fetch failed");
    }
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Fetch failed");
  }
});

/** ✅ 4. Update Expense */
export const updateProjectExpense = createAsyncThunk<
  ProjectExpense,
  { id: string; data: Partial<ProjectExpense> },
  { rejectValue: string; state: RootState }
>("projectExpense/update", async ({ id, data }, { rejectWithValue, getState }) => {
  try {
    const config = getAuthHeader(getState);
    const response = await axios.put(`${API_BASE}/ProjectExpense/${id}`, data, {
       ...config,
      headers: {
        ...config.headers,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data as ProjectExpense;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(err.response?.data?.message ?? err.message ?? "Update failed");
    }
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Update failed");
  }
});

/** ✅ 5. Delete Expense */
export const deleteProjectExpense = createAsyncThunk<
  string,
  string,
  { rejectValue: string; state: RootState }
>("projectExpense/delete", async (id, { rejectWithValue, getState }) => {
  try {
    const config = getAuthHeader(getState);
    await axios.delete(`${API_BASE}/ProjectExpense/${id}`, config);
    return id;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(err.response?.data?.message ?? err.message ?? "Delete failed");
    }
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Delete failed");
  }
});

/** ✅ 6. Fetch Expenses by Project ID */
export const fetchProjectExpensesByProjectId = createAsyncThunk<
  ProjectExpense[],
  string,
  { rejectValue: string; state: RootState }
>("projectExpense/fetchByProjectId", async (projectId, { rejectWithValue, getState }) => {
  try {
    const config = getAuthHeader(getState);
    const response = await axios.get(`${API_BASE}/ProjectExpense/project/${projectId}`, config);
    return response.data as ProjectExpense[];
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(err.response?.data?.message ?? err.message ?? "Fetch failed");
    }
    if (err instanceof Error) return rejectWithValue(err.message);
    return rejectWithValue("Fetch failed");
  }
});

/** ✅ Slice */
const projectExpenseSlice = createSlice({
  name: "projectExpense",
  initialState,
  reducers: {
    resetProjectExpenseState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.expense = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /** Create */
      .addCase(createProjectExpense.pending, (state) => {
        state.loading = true;
        state.success = false;
      })
      .addCase(createProjectExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.expenses.push(action.payload);
      })
      .addCase(createProjectExpense.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.loading = false;
        state.error = action.payload ?? "Create failed";
      })

      /** Fetch All */
      .addCase(fetchAllProjectExpenses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllProjectExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = action.payload;
      })
      .addCase(fetchAllProjectExpenses.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.loading = false;
        state.error = action.payload ?? "Fetch failed";
      })

      /** Fetch by ID */
      .addCase(fetchProjectExpenseById.fulfilled, (state, action) => {
        state.expense = action.payload;
      })

      /** Update */
      .addCase(updateProjectExpense.fulfilled, (state, action) => {
        const index = state.expenses.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) state.expenses[index] = action.payload;
      })

      /** Delete */
      .addCase(deleteProjectExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter((e) => e.id !== action.payload);
      })

      /** By Project ID */
      .addCase(fetchProjectExpensesByProjectId.fulfilled, (state, action) => {
        state.expenses = action.payload;
      });
  },
});
    
export const { resetProjectExpenseState } = projectExpenseSlice.actions;
export default projectExpenseSlice.reducer;
