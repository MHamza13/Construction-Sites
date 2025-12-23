"use client";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store";
import LoadingSpinner from "@/ui/LoadingSpinner";

export function ReduxProvider({ children }) {
  return (
    <Provider store={store}>
      <PersistGate
        loading={<LoadingSpinner message="Initializing..." />}
        persistor={persistor}
        onBeforeLift={() => console.log("PersistGate: Rehydration starting...")}
      >
        {children}
      </PersistGate>
    </Provider>
  );
}
