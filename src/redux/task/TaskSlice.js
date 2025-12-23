import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_BASE + "/Tasks";

// 🔹 Helper: Get authentication header
const getAuthHeader = (getState) => {
  const token = getState().auth?.token;
  return {
    headers: {
      accept: "*/*",
      Authorization: `Bearer ${token}`,
    },
  };
};

/* ===========================================================
   TASKS THUNKS
=========================================================== */

// ✅ Assign multiple users to task (POST)
export const assignUsersToTask = createAsyncThunk(
  "tasks/assignUsersToTask",
  async ({ taskId, userIds }, { rejectWithValue, getState }) => {
    try {
      const payload = { userIds };
      const res = await axios.post(
        `${API_URL}/${taskId}/assign-users`,
        payload,
        getAuthHeader(getState)
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ✅ Assign multiple users to task (PATCH)
export const workerAssignUsersToTask = createAsyncThunk(
  "tasks/patchAssignUsersToTask",
  async ({ id, taskId, userIds }, { rejectWithValue, getState }) => {
    try {
      const payload = { id, taskId, userIds };
      const res = await axios.patch(
        `${API_URL}/${taskId}/assign-users`,
        payload,
        getAuthHeader(getState)
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ✅ Fetch all tasks with caching
export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const { lastFetched, cacheExpiry, items } = state.tasks;

      // Check if we have cached data that's still valid
      if (
        items.length > 0 &&
        lastFetched &&
        Date.now() - lastFetched < cacheExpiry
      ) {
        console.log("Using cached tasks data");
        return { data: items, fromCache: true };
      }

      const res = await axios.get(`${API_URL}/all`, getAuthHeader(getState));
      return { data: res.data, fromCache: false };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ✅ Fetch task by ID
export const fetchTaskById = createAsyncThunk(
  "tasks/fetchTaskById",
  async (id, { rejectWithValue, getState }) => {
    try {
      const res = await axios.get(`${API_URL}/${id}`, getAuthHeader(getState));
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ✅ Fetch tasks by workerId
export const fetchTasksByWorkerId = createAsyncThunk(
  "tasks/fetchTasksByWorkerId",
  async (workerId, { rejectWithValue, getState }) => {
    try {
      const res = await axios.get(
        `${API_URL}/worker/${workerId}`,
        getAuthHeader(getState)
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ✅ Create task
export const createTask = createAsyncThunk(
  "tasks/createTask",
  async (taskPayload, { rejectWithValue, getState }) => {
    try {
      const res = await axios.post(
        API_URL,
        taskPayload,
        getAuthHeader(getState)
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ✅ Update task
export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async ({ id, updatedData }, { rejectWithValue, getState }) => {
    try {
      const payload = {
        ...updatedData,
      };
      const res = await axios.put(
        `${API_URL}/${id}`,
        payload,
        getAuthHeader(getState)
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ✅ Delete task
export const deleteTask = createAsyncThunk(
  "tasks/deleteTask",
  async (id, { rejectWithValue, getState }) => {
    try {
      await axios.delete(`${API_URL}/${id}`, getAuthHeader(getState));
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* ===========================================================
   TASK SLICE
=========================================================== */
const taskSlice = createSlice({
  name: "tasks",
  initialState: {
    items: [],
    currentTask: null,
    loading: false,
    error: null,
    lastFetched: null,
    cacheExpiry: 5 * 60 * 1000, // 5 minutes cache
  },
  reducers: {
    clearCurrentTask: (state) => {
      state.currentTask = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* TASKS REDUCERS */
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        if (!action.payload.fromCache) {
          state.lastFetched = Date.now();
        }
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchTaskById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTask = action.payload;
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchTasksByWorkerId.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTasksByWorkerId.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload; // replace with worker tasks
      })
      .addCase(fetchTasksByWorkerId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((task) =>
          task.id === action.payload.id ? action.payload : task
        );
        state.currentTask = action.payload;
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((task) => task.id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(assignUsersToTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(assignUsersToTask.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((task) =>
          task.id === action.payload.id ? action.payload : task
        );
        state.currentTask = action.payload;
      })
      .addCase(assignUsersToTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(workerAssignUsersToTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(workerAssignUsersToTask.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((task) =>
          task.id === action.payload.id ? action.payload : task
        );
        state.currentTask = action.payload;
      })
      .addCase(workerAssignUsersToTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentTask } = taskSlice.actions;
export default taskSlice.reducer;
