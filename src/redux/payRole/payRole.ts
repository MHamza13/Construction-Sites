import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";

interface ShiftDetailApi {
  ShiftId: number;
  CheckIn: string;
  CheckOut: string;
  TotalHours: number;
  DailyWagesHours: number;
  ExtraHours: number;
}

interface JsonWorker {
  WorkerID: number | string;
  Worker: string;
  Email: string;
  TotalHours: number;
  Overtime: number;
  TotalPay: number | null;
  Status: string;
  Shifts: number;
  PayPeriod: string;
  HourlyRate: number | null;
  DailyWagesRate: number | null;
  Actions: string;
  ShiftDetails: ShiftDetailApi[] | null;
}

interface PayrollState {
  data: JsonWorker[];
  loading: boolean;
  error: string | null;
}

interface FetchPayrollArgs {
  startDate: Date;
  endDate: Date;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE + "/Payroll";

export const fetchPayroll = createAsyncThunk<
  JsonWorker[],
  FetchPayrollArgs,
  { rejectValue: string }
>(
  "payroll/fetchPayroll",
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await axios.get<JsonWorker[]>(BASE_URL, {
        params: {
          startDate: startDate.toISOString().slice(0, -1).replace('T', ' '),
          endDate: endDate.toISOString().slice(0, -1).replace('T', ' '),
        },
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        // Assuming the error response data might have a 'message' or is the error itself
        const errorMessage = (axiosError.response.data as { message?: string })
          ?.message || String(axiosError.response.data) || "Failed to fetch payroll data";
        return rejectWithValue(errorMessage);
      }
      return rejectWithValue("Network error or request failed");
    }
  }
);

const initialState: PayrollState = {
  data: [],
  loading: false,
  error: null,
};

const payrollSlice = createSlice({
  name: "payroll",
  initialState,
  reducers: {
    clearPayrollCache: (state) => {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayroll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayroll.fulfilled, (state, action: PayloadAction<JsonWorker[]>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchPayroll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export action
export const { clearPayrollCache } = payrollSlice.actions;
export default payrollSlice.reducer;
