import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../store";

// ==========================
// 📌 Interfaces
// ==========================
export interface MasterInvoiceDetail {
  detailId: number;
  masterInvoiceId: number;
  invoiceId: number;
  invoiceNumber: string;
  workerName: string;
  totalPay: number;
  payPeriod: string;
  projectName: string;
  createdAt: string;
}

export interface MasterInvoice {
  masterInvoiceId: number;
  projectId: number;
  projectName: string;
  totalInvoices: number;
  totalAmount: number;
  status: string;
  payPeriod: string;
  createdBy: string;
  approval: string;
  payment: string;
  internalNotes: string;
  masterInvoiceDetails: MasterInvoiceDetail[];
}

// ==========================
// 📌 Slice State
// ==========================
interface MasterInvoiceState {
  data: MasterInvoice[];
  selected: MasterInvoice | null;
  loading: boolean;
  error: string | null;
}

const initialState: MasterInvoiceState = {
  data: [],
  selected: null,
  loading: false,
  error: null,
};

// ==========================
// 📌 Base API URL
// ==========================
const API_URL = process.env.NEXT_PUBLIC_API_BASE
  ? `${process.env.NEXT_PUBLIC_API_BASE}/MasterInvoices`
  : "http://localhost:3000/api/MasterInvoices";

// ==========================
// 📌 Helper: Auth Header
// ==========================
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

// ==========================
// 📌 Async Thunks
// ==========================

// 👉 Create Master Invoice
export const createMasterInvoice = createAsyncThunk<
  MasterInvoice,
  Partial<MasterInvoice>,
  { state: RootState; rejectValue: string }
>("masterInvoice/create", async (invoiceData, { rejectWithValue, getState }) => {
  try {
    const res = await axios.post<MasterInvoice>(API_URL, invoiceData, getAuthHeader(getState));
    return res.data;
  } catch (err) {
    const error = err as AxiosError;
    return rejectWithValue(
      (error.response?.data as string) || error.message || "Create failed"
    );
  }
});

// 👉 Get All
export const fetchMasterInvoices = createAsyncThunk<
  MasterInvoice[],
  void,
  { state: RootState; rejectValue: string }
>("masterInvoice/fetchAll", async (_, { rejectWithValue, getState }) => {
  try {
    const res = await axios.get<MasterInvoice[]>(API_URL, getAuthHeader(getState));
    return res.data;
  } catch (err) {
    const error = err as AxiosError;
    return rejectWithValue(
      (error.response?.data as string) || error.message || "Fetch failed"
    );
  }
});

// 👉 Get By Worker ID
export const fetchMasterInvoicesByWorkerId = createAsyncThunk<
  MasterInvoice[],
  string,
  { state: RootState; rejectValue: string }
>("masterInvoice/fetchByWorkerId", async (workerId, { rejectWithValue, getState }) => {
  try {
    const res = await axios.get<MasterInvoice[]>(
      `${API_URL}/by-worker/${workerId}`,
      getAuthHeader(getState)
    );
    console.log("res" , res)
    return res.data;
  } catch (err) {
    const error = err as AxiosError;
    return rejectWithValue(
      (error.response?.data as string) || error.message || "Fetch by worker ID failed"
    );
  }
});

// 👉 Get By ID
export const fetchMasterInvoiceById = createAsyncThunk<
  MasterInvoice,
  number,
  { state: RootState; rejectValue: string }
>("masterInvoice/fetchById", async (id, { rejectWithValue, getState }) => {
  try {
    const res = await axios.get<MasterInvoice>(
      `${API_URL}/${id}`,
      getAuthHeader(getState)
    );
    return res.data;
  } catch (err) {
    const error = err as AxiosError;
    return rejectWithValue(
      (error.response?.data as string) || error.message || "Fetch by ID failed"
    );
  }
});

// 👉 Update
export const updateMasterInvoice = createAsyncThunk<
  MasterInvoice,
  { id: number; updates: Partial<MasterInvoice> },
  { state: RootState; rejectValue: string }
>("masterInvoice/update", async ({ id, updates }, { rejectWithValue, getState }) => {
  try {
    const res = await axios.patch<MasterInvoice>(
      `${API_URL}/${id}`,
      updates,
      getAuthHeader(getState)
    );
    return res.data;
  } catch (err) {
    const error = err as AxiosError;
    return rejectWithValue(
      (error.response?.data as string) || error.message || "Update failed"
    );
  }
});

// 👉 Delete (Soft Delete)
export const deleteMasterInvoice = createAsyncThunk<
  number,
  number,
  { state: RootState; rejectValue: string }
>("masterInvoice/delete", async (id, { rejectWithValue, getState }) => {
  try {
    await axios.delete(`${API_URL}/${id}`, getAuthHeader(getState));
    return id;
  } catch (err) {
    const error = err as AxiosError;
    return rejectWithValue(
      (error.response?.data as string) || error.message || "Delete failed"
    );
  }
});

// 👉 Update Status
export const updateMasterInvoiceStatus = createAsyncThunk<
  MasterInvoice,
  { id: number; status: string },
  { state: RootState; rejectValue: string }
>("masterInvoice/updateStatus", async ({ id, status }, { rejectWithValue, getState }) => {
  try {
    const res = await axios.patch<MasterInvoice>(
      `${API_URL}/${id}/status`,
      { status },
      getAuthHeader(getState)
    );
    return res.data;
  } catch (err) {
    const error = err as AxiosError;
    return rejectWithValue(
      (error.response?.data as string) || error.message || "Status update failed"
    );
  }
});

// 👉 Mark Paid
export const markMasterInvoicePaid = createAsyncThunk<
  MasterInvoice,
  FormData,
  { state: RootState; rejectValue: string }
>("masterInvoice/markPaid", async (formData, { rejectWithValue, getState }) => {
  try {
    const res = await axios.patch<MasterInvoice>(
      `${API_URL}/pay`,
      formData,
      {
        ...getAuthHeader(getState),
        headers: {
          ...getAuthHeader(getState).headers,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return res.data;
  } catch (err) {
    const error = err as AxiosError;
    return rejectWithValue(
      (error.response?.data as { message?: string })?.message ||
        error.message ||
        "Mark paid failed"
    );
  }
});

// ==========================
// 📌 Slice
// ==========================
const masterInvoiceSlice = createSlice({
  name: "masterInvoice",
  initialState,
  reducers: {
    clearMasterInvoiceState: (state) => {
      state.selected = null;
      state.error = null;
    },
    clearMasterInvoiceCache: (state) => {
      state.data = [];
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchMasterInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMasterInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchMasterInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch master invoices";
      })

      // Fetch By Worker ID
      .addCase(fetchMasterInvoicesByWorkerId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMasterInvoicesByWorkerId.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchMasterInvoicesByWorkerId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch invoices by worker ID";
      })

      // Fetch By ID
      .addCase(fetchMasterInvoiceById.fulfilled, (state, action) => {
        state.selected = action.payload;
      })

      // Create
      .addCase(createMasterInvoice.fulfilled, (state, action) => {
        state.data.push(action.payload);
      })

      // Update
      .addCase(updateMasterInvoice.fulfilled, (state, action) => {
        state.data = state.data.map((inv) =>
          inv.masterInvoiceId === action.payload.masterInvoiceId ? action.payload : inv
        );
      })

      // Delete
      .addCase(deleteMasterInvoice.fulfilled, (state, action) => {
        state.data = state.data.filter((inv) => inv.masterInvoiceId !== action.payload);
      })

      // Update Status
      .addCase(updateMasterInvoiceStatus.fulfilled, (state, action) => {
        state.data = state.data.map((inv) =>
          inv.masterInvoiceId === action.payload.masterInvoiceId ? action.payload : inv
        );
      })

      // Mark Paid
      .addCase(markMasterInvoicePaid.fulfilled, (state, action) => {
        state.data = state.data.map((inv) =>
          inv.masterInvoiceId === action.payload.masterInvoiceId ? action.payload : inv
        );
      });
  },
});

export const { clearMasterInvoiceState } = masterInvoiceSlice.actions;
export const { clearMasterInvoiceCache } = masterInvoiceSlice.actions;
export default masterInvoiceSlice.reducer;