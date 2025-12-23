import ResetPassword from '@/components/auth/ResetPassword'
import React from 'react'
import { Metadata } from "next";

export const metadat: Metadata = {
  title: "Next.js Forget Page | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Forget Page TailAdmin Dashboard Template",
};
    
const ForgetPage = () => {
  return (
    <div>
        <ResetPassword/>
    </div>
  )
}

export default ForgetPage