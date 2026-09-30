// "use client";

// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { AuthProvider } from "@/contexts/AuthContext";
// import MainLayout from "@/app/layouts/MainLayout";

// const queryClient = new QueryClient();

// export default function ClientWrapper({ children }: { children: React.ReactNode }) {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <AuthProvider>
//         <MainLayout>
//           {children}
//         </MainLayout>
//       </AuthProvider>
//     </QueryClientProvider>
//   );
// }
// "use client";

// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { AuthProvider } from "@/contexts/AuthContext";
// import MainLayout from "@/app/layouts/MainLayout";

// const queryClient = new QueryClient();

// export default function ClientWrapper({ children }: { children: React.ReactNode }) {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <AuthProvider>
//         <MainLayout>
//           {children}
//         </MainLayout>
//       </AuthProvider>
//     </QueryClientProvider>
//   );
// }

"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  // إنشاء نسخة الـ QueryClient لضمان عدم مشاركة البيانات بين المستخدمين على السيرفر
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // وقت بقاء البيانات طازجة (اختياري)
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

