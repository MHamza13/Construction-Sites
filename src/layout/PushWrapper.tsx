"use client";

import dynamic from 'next/dynamic';

// 🛑 Ab 'ssr: false' yahan Client Component mein kaam karega
const PushNotificationInit = dynamic(() => import('@/layout/PushNotificationInit'), { 
  ssr: false 
});

export default function PushWrapper() {
  return <PushNotificationInit />;
}