  "use client";

  import Checkbox from "@/components/form/input/Checkbox";
  import Input from "@/components/form/input/InputField";
  import Label from "@/components/form/Label";
  import Button from "@/components/ui/button/Button";
  import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
  import Link from "next/link";
  import { useRouter } from "next/navigation";
  import React, { useState, useEffect } from "react";
  import { loginUser } from "@/redux/auth/authSlice";
  import { useDispatch, useSelector } from "react-redux";

  export default function SignInForm() {
    const router = useRouter();
    const dispatch = useDispatch();

    const { loading, error, user, isAuthenticated } = useSelector(
      (state) => state.auth
    );

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isChecked, setIsChecked] = useState(false);

    useEffect(() => {
      if (isAuthenticated || user) {
        router.push("/");
      }
    }, [isAuthenticated, user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!email || !password) {
        console.log("Email and Password are required.");
        return;
      }

      try {
        // ✅ Using unwrap to catch rejected value directly
        await dispatch(loginUser({ email, password })).unwrap();
        console.log("Login successful!");
        router.push("/");
      } catch (err) {
        console.error("Login failed:", err);
      }
    };

    if (isAuthenticated || user) return null;

    return (
      <div className="w-full max-w-md mx-auto flex flex-col justify-center h-full">
        <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeftIcon />
            Back to home
          </Link>
        </div>

        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div>
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Sign In
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter your email and password to sign in!
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Email */}
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    placeholder="info@gmail.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Password */}
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                  <Link
                    href="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Error */}
                {error && (
                  <div className="text-sm text-error-500 p-2 border border-error-100 rounded-lg bg-error-50 dark:bg-error-900/20">
                    {error.toString()}
                  </div>
                )}

                {/* Button */}
                <div>
                  <Button className="w-full" size="sm" type="submit" disabled={loading}>
                    {loading ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
