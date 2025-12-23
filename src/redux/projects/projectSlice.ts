  import { createSlice, createAsyncThunk, PayloadAction, SerializedError } from "@reduxjs/toolkit";
  import axios, { AxiosError } from "axios";
  import { RootState } from "../store";

  // ✅ Types
  export type ProjectStatus = "Planning" | "Active" | "AtRisk" | "OnHold";

  export interface Project {
    id: string;
    name: string;
    description: string;
    budget: number;
    deadlineDate: string;
    clientName: string;
    startDate: string;
    status: ProjectStatus | "";
    managerId: string | null;
    location?: string;
    metadata?: string | Record<string, unknown>;
    assignedWorkerIds: string[];
    priority: "High" | "Medium" | "Low" | string;
  }

  export interface ProjectState {
    items: Project[];
    currentProject: Project | null;
    loading: boolean;
    error: string | null;
  }

  const API_URL = `${process.env.NEXT_PUBLIC_API_BASE}/Projects`;
  console.log("✅ API_URL:", API_URL);

  // 🔑 Helper: Auth header
  const getAuthHeader = (getState: () => RootState) => {
    const token = getState().auth?.token;
    return {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  };

  // ✅ Fetch all projects
  export const fetchProjects = createAsyncThunk<
    Project[],
    void,
    { state: RootState; rejectValue: string }
  >("projects/fetchProjects", async (_, { rejectWithValue, getState }) => {
    try {
      const res = await axios.get<Project[]>(API_URL, getAuthHeader(getState));
      return res.data;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.message || "Failed to fetch projects");
    }
  });

  // ✅ Fetch project by ID
  export const fetchProjectById = createAsyncThunk<
    Project,
    string,
    { state: RootState; rejectValue: string }
  >("projects/fetchProjectById", async (id, { rejectWithValue, getState }) => {
    try {
      const res = await axios.get<Project>(`${API_URL}/${id}`, getAuthHeader(getState));
      return res.data;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.message || "Failed to fetch project");
    }
  });

  // ✅ Create project
  export const createProject = createAsyncThunk<
    Project,
    Partial<Omit<Project, "status">> & { status: ProjectStatus },
    { state: RootState; rejectValue: string }
  >("projects/createProject", async (projectData, { rejectWithValue, getState }) => {
    try {
      const res = await axios.post<Project>(API_URL, projectData, getAuthHeader(getState));
      return res.data;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.message || "Failed to create project");
    }
  });

  // ✅ Update project
  export const updateProject = createAsyncThunk<
    Project,
    { id: string; updatedData: Partial<Omit<Project, "status">> & { status?: ProjectStatus } },
    { state: RootState; rejectValue: string }
  >("projects/updateProject", async ({ id, updatedData }, { rejectWithValue, getState }) => {
    try {
      const res = await axios.put<Project>(`${API_URL}/${id}`, updatedData, getAuthHeader(getState));
      return res.data;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.message || "Failed to update project");
    }
  });

  // ✅ Delete project
  export const deleteProject = createAsyncThunk<
    string,
    string,
    { state: RootState; rejectValue: string }
  >("projects/deleteProject", async (id, { rejectWithValue, getState }) => {
    try {
      await axios.delete(`${API_URL}/${id}`, getAuthHeader(getState));
      return id;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.message || "Failed to delete project");
    }
  });

  // ✅ Assign worker(s)
  export const assignWorkerToProject = createAsyncThunk<
    Project,
    { projectId: string; workerIds: string[] },
    { state: RootState; rejectValue: string }
  >("projects/assignWorkerToProject", async ({ projectId, workerIds }, { rejectWithValue, getState }) => {
    try {
      const res = await axios.patch<Project>(
        `${API_URL}/${projectId}/assign-multiple-workers`,
        { workerIds },
        getAuthHeader(getState)
      );
      return res.data;
    } catch (err) {
      const error = err as AxiosError;
      return rejectWithValue(error.message || "Failed to assign workers");
    }
  });

  // ✅ Initial state
  const initialState: ProjectState = {
    items: [],
    currentProject: null,
    loading: false,
    error: null,
  };

  // ✅ Slice
  const projectSlice = createSlice({
    name: "projects",
    initialState,
    reducers: {
      clearCurrentProject: (state) => {
        state.currentProject = null;
      },
    },
    extraReducers: (builder) => {
      const handlePending = (state: ProjectState) => {
        state.loading = true;
        state.error = null;
      };

      // ✅ Properly typed handleRejected (no any)
      const handleRejected = (
        state: ProjectState,
        action: PayloadAction<string | undefined> | { error: SerializedError }
      ) => {
        state.loading = false;
        state.error =
          (action as PayloadAction<string | undefined>).payload ||
          (action as { error: SerializedError }).error.message ||
          "An error occurred";
      };

      builder
        // 🔁 Fetch all
        .addCase(fetchProjects.pending, handlePending)
        .addCase(fetchProjects.fulfilled, (state, action: PayloadAction<Project[]>) => {
          state.loading = false;
          state.items = action.payload;
        })
        .addCase(fetchProjects.rejected, handleRejected)

        // 🔁 Fetch one
        .addCase(fetchProjectById.pending, handlePending)
        .addCase(fetchProjectById.fulfilled, (state, action: PayloadAction<Project>) => {
          state.loading = false;
          state.currentProject = action.payload;
        })
        .addCase(fetchProjectById.rejected, handleRejected)

        // 🔁 Create
        .addCase(createProject.pending, handlePending)
        .addCase(createProject.fulfilled, (state, action: PayloadAction<Project>) => {
          state.loading = false;
          state.items.push(action.payload);
        })
        .addCase(createProject.rejected, handleRejected)

        // 🔁 Update
        .addCase(updateProject.pending, handlePending)
        .addCase(updateProject.fulfilled, (state, action: PayloadAction<Project>) => {
          state.loading = false;
          state.items = state.items.map((p) => (p.id === action.payload.id ? action.payload : p));
        })
        .addCase(updateProject.rejected, handleRejected)

        // 🔁 Delete
        .addCase(deleteProject.pending, handlePending)
        .addCase(deleteProject.fulfilled, (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.items = state.items.filter((p) => p.id !== action.payload);
        })
        .addCase(deleteProject.rejected, handleRejected)

        // 🔁 Assign Workers
        .addCase(assignWorkerToProject.pending, handlePending)
        .addCase(assignWorkerToProject.fulfilled, (state, action: PayloadAction<Project>) => {
          state.loading = false;
          state.items = state.items.map((p) => (p.id === action.payload.id ? action.payload : p));
          if (state.currentProject?.id === action.payload.id) {
            state.currentProject = action.payload;
          }
        })
        .addCase(assignWorkerToProject.rejected, handleRejected);
    },
  });

  export const { clearCurrentProject } = projectSlice.actions;
  export default projectSlice.reducer;
