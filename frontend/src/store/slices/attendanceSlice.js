import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

// Employee actions
export const checkIn = createAsyncThunk(
  'attendance/checkIn',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/attendance/checkin`, {}, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Check-in failed');
    }
  }
);

export const checkOut = createAsyncThunk(
  'attendance/checkOut',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/attendance/checkout`, {}, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Check-out failed');
    }
  }
);

export const getMyHistory = createAsyncThunk(
  'attendance/getMyHistory',
  async ({ month, year }, { rejectWithValue }) => {
    try {
      const params = {};
      if (month) params.month = month;
      if (year) params.year = year;
      const response = await axios.get(`${API_URL}/attendance/my-history`, {
        ...getAuthHeaders(),
        params,
      });
      return response.data.attendance;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch history');
    }
  }
);

export const getMySummary = createAsyncThunk(
  'attendance/getMySummary',
  async ({ month, year }, { rejectWithValue }) => {
    try {
      const params = {};
      if (month) params.month = month;
      if (year) params.year = year;
      const response = await axios.get(`${API_URL}/attendance/my-summary`, {
        ...getAuthHeaders(),
        params,
      });
      return response.data.summary;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch summary');
    }
  }
);

export const getTodayStatus = createAsyncThunk(
  'attendance/getTodayStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/attendance/today`, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch today status');
    }
  }
);

// Manager actions
export const getAllAttendance = createAsyncThunk(
  'attendance/getAllAttendance',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/attendance/all`, {
        ...getAuthHeaders(),
        params: filters,
      });
      return response.data.attendance;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch attendance');
    }
  }
);

export const getEmployeeAttendance = createAsyncThunk(
  'attendance/getEmployeeAttendance',
  async ({ id, startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/attendance/employee/${id}`, {
        ...getAuthHeaders(),
        params: { startDate, endDate },
      });
      return response.data.attendance;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch employee attendance');
    }
  }
);

export const getTeamSummary = createAsyncThunk(
  'attendance/getTeamSummary',
  async ({ month, year }, { rejectWithValue }) => {
    try {
      const params = {};
      if (month) params.month = month;
      if (year) params.year = year;
      const response = await axios.get(`${API_URL}/attendance/summary`, {
        ...getAuthHeaders(),
        params,
      });
      return response.data.summary;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch team summary');
    }
  }
);

export const getTodayStatusManager = createAsyncThunk(
  'attendance/getTodayStatusManager',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/attendance/today-status`, getAuthHeaders());
      return response.data.employees;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch today status');
    }
  }
);

// Dashboard actions
export const getEmployeeDashboard = createAsyncThunk(
  'attendance/getEmployeeDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/employee`, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch dashboard');
    }
  }
);

export const getManagerDashboard = createAsyncThunk(
  'attendance/getManagerDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/manager`, getAuthHeaders());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch dashboard');
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    todayStatus: null,
    history: [],
    summary: null,
    dashboard: null,
    allAttendance: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check In
      .addCase(checkIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkIn.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(checkIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Check Out
      .addCase(checkOut.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkOut.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(checkOut.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get My History
      .addCase(getMyHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMyHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(getMyHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get My Summary
      .addCase(getMySummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      })
      // Get Today Status
      .addCase(getTodayStatus.fulfilled, (state, action) => {
        state.todayStatus = action.payload;
      })
      // Get All Attendance
      .addCase(getAllAttendance.fulfilled, (state, action) => {
        state.allAttendance = action.payload;
      })
      // Get Employee Dashboard
      .addCase(getEmployeeDashboard.fulfilled, (state, action) => {
        state.dashboard = action.payload;
        state.todayStatus = action.payload.today;
      })
      // Get Manager Dashboard
      .addCase(getManagerDashboard.fulfilled, (state, action) => {
        state.dashboard = action.payload;
      });
  },
});

export const { clearError } = attendanceSlice.actions;
export default attendanceSlice.reducer;

