import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer from "./auth/authSlice";
import specializationReducer from "./specialization/specializationSlice";
import projectReducer from "./projects/projectSlice";
import workersReducer from "./worker/workerSlice";
import taskReducer from "./task/TaskSlice";
import subtaskReducer from "./subTask/SubTaskSlice";
import payrollReducer from "./payRole/payRole";
import shiftsReducer from "./shift/ShiftSlice";
import projectShiftsReducer from "./projectShifts/projectShifts";
import masterInvoiceReducer from "./invoiceMaster/invoiceMasterSlice";
import projectCommentsReducer from "./projectComments/projectCommentSlice"
import userDeviceTokenReducer from "./userDeviceTokken/userDeviceTokkenSlice"
import projectExpenseReducer from "./projectExpense/projectExpenseSlice"
import importantTypeReducer from "./importantTypes/importantTypesSlice"
import locationReducer from "./location/locationSlice"
import adminReducer from "./admin/adminSlice"

import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  admin: adminReducer,
  specializations: specializationReducer,
  projects: projectReducer,
  workers: workersReducer,
  tasks: taskReducer,
  subtasks: subtaskReducer,
  payroll: payrollReducer,
  projectShifts: projectShiftsReducer,
  shifts: shiftsReducer,
  masterInvoice: masterInvoiceReducer,
  projectComments: projectCommentsReducer,
  userDeviceToken: userDeviceTokenReducer,
  projectExpense: projectExpenseReducer,
  importantTypes: importantTypeReducer,
  location:locationReducer
});

// Persist config
const persistConfig = {
  key: "root",
  version: 1,
  storage,
  whitelist: ["auth"],
};

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Persist store
export const persistor = persistStore(store);

// ✅ Yeh dono type exports add karo
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
