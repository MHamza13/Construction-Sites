import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../store";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE + "/ProjectComments";

// --- Types ---
export interface ProjectComment {
  _id: string;
  projectId: string;
  authorId: string;
  text: string;
  attachments?: string[];
  isRead: boolean;
  createdAt: string;
}

interface CommentsState {
  comments: ProjectComment[];
  loading: boolean;
  error: string | null;
}

const initialState: CommentsState = {
  comments: [],
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

// 1️⃣ Create a new comment
export const createProjectComment = createAsyncThunk<
  ProjectComment,
  { projectId: string; text: string; attachments?: string[] },
  { state: RootState; rejectValue: string }
>(
  "projectComments/createProjectComment",
  async ({ projectId, text, attachments }, { getState, rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${API_BASE}`,
        { projectId, text, attachments },
        getAuthHeader(getState)
      );
      return res.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(
          err.response?.data?.message || err.message || "Failed to create comment"
        );
      }
      if (err instanceof Error) {
        return rejectWithValue(err.message);
      }
      return rejectWithValue("Failed to create comment");
    }
  }
);

// 2️⃣ Get all comments for a project
export const fetchProjectComments = createAsyncThunk<
  ProjectComment[],
  string,
  { state: RootState; rejectValue: string }
>("projectComments/fetchProjectComments", async (projectId, { getState, rejectWithValue }) => {
  try {
    const res = await axios.get(`${API_BASE}/${projectId}`, getAuthHeader(getState));
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to fetch comments"
      );
    }
    if (err instanceof Error) {
      return rejectWithValue(err.message);
    }
    return rejectWithValue("Failed to fetch comments");
  }
});

// 3️⃣ Get all comments across all projects
export const fetchAllProjectComments = createAsyncThunk<
  ProjectComment[],
  void,
  { state: RootState; rejectValue: string }
>("projectComments/fetchAllProjectComments", async (_, { getState, rejectWithValue }) => {
  try {
    const res = await axios.get(`${API_BASE}/all`, getAuthHeader(getState));
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to fetch all comments"
      );
    }
    if (err instanceof Error) {
      return rejectWithValue(err.message);
    }
    return rejectWithValue("Failed to fetch all comments");
  }
});

// 4️⃣ Mark a comment as read
export const markCommentAsRead = createAsyncThunk<
  ProjectComment,
  string,
  { state: RootState; rejectValue: string }
>("projectComments/markCommentAsRead", async (commentId, { getState, rejectWithValue }) => {
  try {
    const res = await axios.patch(
      `${API_BASE}/${commentId}/mark-read`,
      {},
      getAuthHeader(getState)
    );
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to mark comment as read"
      );
    }
    if (err instanceof Error) {
      return rejectWithValue(err.message);
    }
    return rejectWithValue("Failed to mark comment as read");
  }
});

// --- Slice ---
const projectCommentsSlice = createSlice({
  name: "projectComments",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Create
      .addCase(createProjectComment.pending, (state) => {
        state.loading = true;
      })
      .addCase(createProjectComment.fulfilled, (state, action) => {
        state.loading = false;
        state.comments.push(action.payload);
      })
      .addCase(createProjectComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error creating comment";
      })

      // Fetch Project Comments
      .addCase(fetchProjectComments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProjectComments.fulfilled, (state, action) => {
        state.loading = false;
        state.comments = action.payload;
      })
      .addCase(fetchProjectComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error fetching comments";
      })

      // Fetch All Comments
      .addCase(fetchAllProjectComments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllProjectComments.fulfilled, (state, action) => {
        state.loading = false;
        state.comments = action.payload;
      })
      .addCase(fetchAllProjectComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error fetching all comments";
      })

      // Mark Read
      .addCase(markCommentAsRead.fulfilled, (state, action) => {
        const updated = state.comments.map((c) =>
          c._id === action.payload._id ? action.payload : c
        );
        state.comments = updated;
      });
  },
});

export default projectCommentsSlice.reducer;