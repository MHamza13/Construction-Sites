"use client";

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { verifyForgotOtp, resendOtp } from "@/redux/auth/authSlice";
import { useSearchParams, useRouter } from "next/navigation";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Swal from "sweetalert2";

export default function VerifyOtpPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  const [otpCode, setOtp] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const email = searchParams.get("email");

  if (!email) {
    return (
      <div className="text-center text-red-500 mt-10">
        Missing email. Please go back and try again.
      </div>
    );
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await dispatch(verifyForgotOtp({ email, otpCode }));

    if (verifyForgotOtp.fulfilled.match(result)) {
      const resetToken = result.payload?.resetToken; // ✅ extract from API response
      setSuccess("OTP verified successfully!");

      await Swal.fire({
        icon: "success",
        title: "OTP Verified!",
        text: "Your OTP has been verified successfully.",
        confirmButtonColor: "#10B981", // Tailwind green-500
      });

      // ✅ Redirect to Reset Password with both email and resetToken
      router.push(
        `/reset-new-password?email=${encodeURIComponent(email)}&resetToken=${encodeURIComponent(
          resetToken
        )}`
      );
    } else {
      setSuccess(null);
      Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: error || "Invalid or expired OTP. Please try again.",
        confirmButtonColor: "#EF4444", // Tailwind red-500
      });
    }
  };

  const handleResend = async () => {
    const result = await dispatch(resendOtp(email));
    if (resendOtp.fulfilled.match(result)) {
      setSuccess("OTP resent successfully!");
      Swal.fire({
        icon: "success",
        title: "OTP Resent!",
        text: "A new OTP has been sent to your email.",
        confirmButtonColor: "#10B981",
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col justify-center h-full">
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
          Verify OTP
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enter the OTP sent to <strong>{email}</strong>
        </p>
      </div>

      {success && (
        <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-md">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleVerify}>
        <div className="space-y-6">
          <div>
            <Label>
              OTP <span className="text-error-500">*</span>
            </Label>
            <Input
              placeholder="Enter OTP"
              type="text"
              value={otpCode}
              onChange={(e) => setOtp(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>

          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="text-sm text-brand-500 hover:text-brand-600 mt-3 w-full text-center"
          >
            Resend OTP
          </button>
        </div>
      </form>
    </div>
  );
}
