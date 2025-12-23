"use client";

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { RootState } from "../store";

// 🔹 Interfaces
export interface Specialization {
  id: number;
  name: string;
}

export interface SpecializationState {
  items: Specialization[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

interface ApiSpecialization {
  id?: number;
  name?: string;
  value?: {
    id: number;
    name: string;
  };
  isSuccess?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_BASE + "/Specializations";

// 🔑 Helper: Get token from Redux state
const getAuthHeader = (getState: () => RootState): AxiosRequestConfig => {
  const token = getState().auth?.token;
  return token
    ? {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
      }
    : { headers: { accept: "*/*" } };
};

// ✅ GET All Specializations
export const fetchSpecializations = createAsyncThunk<
  Specialization[],
  void,
  { state: RootState; rejectValue: string }
>("specializations/fetchAll", async (_, { rejectWithValue, getState }) => {
  try {
    const res = await axios.get<unknown>(`${API_URL}/GetAll`, getAuthHeader(getState));
    const data = res.data as ApiSpecialization | ApiSpecialization[] | { isSuccess?: boolean; value?: ApiSpecialization[] | ApiSpecialization };

    let items: Specialization[] = [];

    if (Array.isArray(data)) {
      items = data.map((item) => ({
        id: item.id ?? item.value?.id ?? 0,
        name: item.name ?? item.value?.name ?? "Unknown",
      }));
    } else if (data?.isSuccess && Array.isArray(data.value)) {
      items = data.value.map((item) => ({
        id: item.id ?? 0,
        name: item.name ?? "Unknown",
      }));
    } else if (data?.isSuccess && data.value && !Array.isArray(data.value)) {
      items = [
        {
          id: data.value.id ?? 0,
          name: data.value.name ?? "Unknown",
        },
      ];
    }

    return items;
  } catch (error) {
    const err = error as AxiosError<{ message?: string } | string>;
    const message =
      typeof err.response?.data === "string"
        ? err.response.data
        : err.response?.data?.message || err.message || "Error fetching specializations";
    console.error("Fetch Specializations Error:", message);
    return rejectWithValue(message);
  }
});

// ✅ POST Create Specialization
export const addSpecialization = createAsyncThunk<
  Specialization,
  { name: string },
  { state: RootState; rejectValue: string }
>("specializations/add", async (newSpec, { dispatch, rejectWithValue, getState }) => {
  try {
    const res = await axios.post<Specialization>(
      `${API_URL}/Create`,
      { name: newSpec.name },
      getAuthHeader(getState)
    );
    console.log("Add Specialization Response:", res.data);

    // Force refresh
    dispatch(clearSpecializationCache());
    dispatch(fetchSpecializations());

    return res.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string } | string>;
    const message =
      typeof err.response?.data === "string"
        ? err.response.data
        : err.response?.data?.message || err.message || "Error adding specialization";
    console.error("Add Specialization Error:", message);
    return rejectWithValue(message);
  }
});

// ✅ PUT Update Specialization
export const updateSpecialization = createAsyncThunk<
  Specialization,
  { id: number; name: string },
  { state: RootState; rejectValue: string }
>("specializations/update", async ({ id, name }, { dispatch, rejectWithValue, getState }) => {
  try {
    const res = await axios.put<Specialization>(
      `${API_URL}/Update`,
      { id, name },
      getAuthHeader(getState)
    );
    console.log("Update Specialization Response:", res.data);

    // Force refresh
    dispatch(clearSpecializationCache());
    dispatch(fetchSpecializations());

    return res.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string } | string>;
    const message =
      typeof err.response?.data === "string"
        ? err.response.data
        : err.response?.data?.message || err.message || "Error updating specialization";
    console.error("Update Specialization Error:", message);
    return rejectWithValue(message);
  }
});

// ✅ DELETE Specialization
export const deleteSpecialization = createAsyncThunk<
  number, // return type (id)
  number, // argument type (id)
  { state: RootState; rejectValue: string }
>(
  "specializations/delete",
  async (id, { dispatch, rejectWithValue, getState }) => {
    try {
      const res = await axios.delete(`${API_URL}/${id}`, {
        ...getAuthHeader(getState),
        data: { id }, // 👈 send body with id
      });

      // Refresh specialization list
      dispatch(clearSpecializationCache());
      dispatch(fetchSpecializations());

      return id;
    } catch (error) {
      const err = error as AxiosError<{ message?: string } | string>;
      const message =
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message || err.message || "Error deleting specialization";

      console.error("Delete Specialization Error:", message);
      return rejectWithValue(message);
    }
  }
);

// ✅ Slice
const specializationSlice = createSlice({
  name: "specializations",
  initialState: {
    items: [],
    loading: false,
    error: null,
    lastUpdated: null,
  } as SpecializationState,
  reducers: {
    // Force clear cache
    clearSpecializationCache: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 🔹 GET
      .addCase(fetchSpecializations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSpecializations.fulfilled, (state, action: PayloadAction<Specialization[]>) => {
        state.loading = false;
        state.items = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchSpecializations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch specializations";
      })

      // 🔹 POST
      .addCase(addSpecialization.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSpecialization.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addSpecialization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to add specialization";
      })

      // 🔹 PUT
      .addCase(updateSpecialization.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSpecialization.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateSpecialization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update specialization";
      })

      // 🔹 DELETE
      .addCase(deleteSpecialization.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSpecialization.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteSpecialization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete specialization";
      });
  },
});

// Export Actions
export const { clearSpecializationCache } = specializationSlice.actions;

export default specializationSlice.reducer;