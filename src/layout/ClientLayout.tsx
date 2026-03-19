"use client";

import LoadingSpinner from "@/ui/LoadingSpinner";
import ApiLoadingBar from "@/ui/ApiLoadingBar";
import { useState, useEffect, useCallback, ReactNode, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { store, RootState } from "@/redux/store";
import { PURGE } from "redux-persist";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SidebarProvider } from "@/context/SidebarContext";
import { getFCMToken } from "@/firebase/Firebase";
import { registerUserDeviceToken } from "@/redux/userDeviceTokken/userDeviceTokkenSlice";
import { Capacitor } from "@capacitor/core";

interface PersistState {
  _persist?: { version: number; rehydrated: boolean; };
}
type ExtendedRootState = RootState & PersistState;

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  const { token, isAuthenticated, loading, user } = useSelector((state: RootState) => state.auth);
  const [isRehydrated, setIsRehydrated] = useState(false);
  const [isDeviceTokenRegistered, setIsDeviceTokenRegistered] = useState(false);

  const publicRoutes = useMemo(() => 
    ["/terms", "/privacy", "/signin", "/signup", "/reset-password", "/verify-otp", "/reset-new-password"], 
  []);

  const handleLogout = useCallback(() => {
    store.dispatch({ type: "auth/logout" });
    store.dispatch({ type: PURGE, key: "root", result: () => null });
    localStorage.removeItem("user");
    router.push("/signin");
  }, [router]);

  // 1. Rehydration Check
  useEffect(() => {
    const checkRehydration = () => {
      const state = store.getState() as ExtendedRootState;
      if (state._persist?.rehydrated) setIsRehydrated(true);
    };
    checkRehydration();
    const timeout = setTimeout(() => setIsRehydrated(true), 2000);
    return () => clearTimeout(timeout);
  }, []);

  // 2. Route & Token Guard
  useEffect(() => {
    if (isRehydrated && !loading) {
      if (token) {
        try {
          const decoded = jwtDecode<JwtPayload>(token);
          if (decoded.exp && decoded.exp < Date.now() / 1000) handleLogout();
        } catch { handleLogout(); }
      }
      if (!publicRoutes.includes(pathname) && !isAuthenticated) router.replace("/signin");
    }
  }, [isAuthenticated, pathname, isRehydrated, loading, token, handleLogout, router, publicRoutes]);

  // 3. Service Worker (ONLY FOR WEB)
  useEffect(() => {
    if (!Capacitor.isNativePlatform() && "serviceWorker" in navigator) {
      // Unregister hata diya hai taake token stable rahe
      navigator.serviceWorker.register("/firebase-messaging-sw.js")
        .then((reg) => console.log("✅ SW Registered:", reg.scope))
        .catch((err) => console.error("❌ SW Error:", err));
    }
  }, []);

  // 4. Token Registration Logic
  useEffect(() => {
    const syncToken = async () => {
      if (!isAuthenticated || !user?.userId || isDeviceTokenRegistered) return;

      try {
        const fcmToken = await getFCMToken();
        if (!fcmToken || fcmToken === "permission-denied") {
          console.warn("⚠️ FCM Token not available");
          return;
        }

        const payload = {
          userId: user.userId,
          deviceToken: fcmToken,
          platform: Capacitor.isNativePlatform() ? Capacitor.getPlatform() : "web",
          deviceName: Capacitor.isNativePlatform() ? "Native Mobile" : "Web Browser",
        };

        console.log("📲 Syncing Token to Backend...");
        await dispatch(registerUserDeviceToken(payload)).unwrap();
        setIsDeviceTokenRegistered(true);
      } catch (err) {
        console.error("❌ Token sync failed:", err);
      }
    };

    // 2 second ka delay taake auth state fully load ho jaye
    const timer = setTimeout(syncToken, 2000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user?.userId, isDeviceTokenRegistered, dispatch]);

  if (!isRehydrated || loading) return <LoadingSpinner message="Loading..." />;

  return (
    <SidebarProvider>
      <ApiLoadingBar />
      <div className={publicRoutes.includes(pathname) ? "flex flex-col min-h-screen" : ""}>
        {children}
      </div>
      <ToastContainer position="top-right" autoClose={3000} theme="light" />
    </SidebarProvider>
  );
}