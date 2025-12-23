"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pathname = usePathname();

  console.log("isTransitioning:", isTransitioning);

  useEffect(() => {
    // Only show transition for a very brief moment
    setIsTransitioning(true);
    
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 50); // Very short delay for instant page opening

    return () => clearTimeout(timer);
  }, [pathname]);

  // Always render children immediately - no loading state for page transitions
  return <>{children}</>;
}
