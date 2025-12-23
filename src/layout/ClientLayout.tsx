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

// Define the type for the _persist property added by redux-persist
interface PersistState {
  _persist?: {
    version: number;
    rehydrated: boolean;
  };
}

// Extend RootState to include the _persist property
type ExtendedRootState = RootState & PersistState;

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  const { token, isAuthenticated, loading, user } = useSelector(
    (state: RootState) => state.auth
  );

  const [isRehydrated, setIsRehydrated] = useState(false);
  const [isDeviceTokenRegistered, setIsDeviceTokenRegistered] = useState(false);

  const publicRoutes = useMemo(
    () => ["/terms", "/privacy", "/signin", "/signup", "/reset-password" , "/verify-otp" , "/reset-new-password"],
    []
  );

  const handleLogout = useCallback(() => {
    console.log("Logging out...");
    store.dispatch({ type: "auth/logout" });
    store.dispatch({ type: PURGE, key: "root", result: () => null });
    localStorage.removeItem("user"); 
    router.push("/signin");
  }, [router]);

  // Handle persist rehydration
  useEffect(() => {
    const checkRehydration = () => {
      const state = store.getState() as ExtendedRootState;
      const rehydrated = state._persist?.rehydrated;
      if (rehydrated) {
        console.log("✅ Rehydrated user data:", store.getState().auth.user);
        setIsRehydrated(true);
      }
    };

    checkRehydration();

    const timeout = setTimeout(() => {
      if (!isRehydrated) {
        console.warn("Rehydration timeout, forcing load...");
        setIsRehydrated(true);
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [isRehydrated]);

  // Token Expiration Handling
  useEffect(() => {
    if (token && isRehydrated) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        const currentTime = Date.now() / 1000;
        if (decoded.exp && decoded.exp < currentTime) {
          console.log("Token expired, logging out...");
          handleLogout();
        }
      } catch (err) {
        console.error("Invalid token:", err);
        handleLogout();
      }
    }
  }, [token, handleLogout, isRehydrated]);

  // Route Guards
  useEffect(() => {
    if (isRehydrated && !loading) {
      if (!publicRoutes.includes(pathname) && !isAuthenticated) {
        console.log("Not authenticated, redirecting to signin.");
        router.replace("/signin");
        return;
      }

      if (pathname === "/" && !isAuthenticated) {
        router.replace("/signin");
        return;
      }

      if (pathname === "/signin" && isAuthenticated) {
        router.replace("/");
        return;
      }
    }
  }, [isAuthenticated, pathname, router, isRehydrated, publicRoutes, loading]);

  // Service Worker Registration
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => {
          for (const reg of regs) {
            reg.unregister();
            console.log("🧹 Unregistered old ServiceWorker:", reg);
          }

          navigator.serviceWorker
            .register("/firebase-messaging-sw.js")
            .then((registration) => {
              console.log("✅ Firebase Service Worker registered:", registration);
            })
            .catch((error) => {
              console.error("❌ Service Worker registration failed:", error);
            });
        });
    } else {
      console.warn("Service workers are not supported in this browser.");
    }
  }, []);

  // Generate and Register Device Token (after login)
  useEffect(() => {
    const registerDeviceToken = async () => {
      // Wait until user is authenticated and we have user ID
      if (!isAuthenticated || !user?.userId) {
        console.log("⏳ Waiting for authentication or user data...");
        return;
      }

      if (isDeviceTokenRegistered) {
        console.log("✅ Device token already registered, skipping...");
        return;
      }

      try {
        const platform = navigator.platform || "Unknown";
        const userAgent = navigator.userAgent || "Unknown";

        let deviceName = "Unknown Device";
        if (/Mobile/i.test(userAgent)) deviceName = "Mobile Browser";
        else if (/Windows/i.test(userAgent)) deviceName = "Windows PC";
        else if (/Mac/i.test(userAgent)) deviceName = "Mac Device";
        else if (/Linux/i.test(userAgent)) deviceName = "Linux Device";

        const deviceToken = await getFCMToken();
        if (!deviceToken) {
          console.warn("⚠️ No valid FCM token, skipping device registration.");
          return;
        }

        const payload = {
          userId: user.userId,
          deviceToken,
          platform,
          deviceName,
        };

        console.log("📲 Registering Device Token:", payload);

        await dispatch(registerUserDeviceToken(payload)).unwrap();

        console.log("✅ Device Token successfully registered!");
        setIsDeviceTokenRegistered(true);
      } catch (err) {
        console.error("❌ Device Token registration failed:", err);
      }
    };

    // Delay slightly to ensure Redux state and ServiceWorker are ready
    const timeout = setTimeout(() => {
      registerDeviceToken();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [isAuthenticated, user?.userId, dispatch, isDeviceTokenRegistered]);

  // Toast Notification Container
  const AppToastContainer = () => (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
  );

  // Protected Layout Wrapper
  const ProtectedLayout = () => (
    <>
      <ApiLoadingBar />
      <SidebarProvider>{children}</SidebarProvider>
    </>
  );

  // Loading / Auth states
  if (!isRehydrated || loading) {
    return (
      <>
        <LoadingSpinner
          message={loading ? "Checking authentication..." : "Loading..."}
        />
        <AppToastContainer />
      </>
    );
  }

  // Public Routes Layout
  if (publicRoutes.includes(pathname)) {
    return (
      <>
        <ApiLoadingBar />
        <div className="flex flex-col min-h-screen">{children}</div>
        <AppToastContainer />
      </>
    );
  }

  // Authenticated Layout
  if (isAuthenticated) {
    return (
      <SidebarProvider>
        <ProtectedLayout />
        <AppToastContainer />
      </SidebarProvider>
    );
  }

  // Fallback Redirect
  return (
    <>
      <LoadingSpinner message="Redirecting..." />
      <AppToastContainer />
    </>
  );
}