// import { useState } from "react";
// import { Outlet } from "react-router-dom";
// import { Sidebar } from "@/components/Sidebar";
// import { Header } from "@/components/Header";

// export function MainLayout() {
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   return (
//     <div
//       dir="rtl"
//       style={{ fontFamily: "'Tajawal', sans-serif" }}
//       className="flex h-screen overflow-hidden bg-background"
//     >
//       {/* Mobile overlay */}
//       {sidebarOpen && (
//         <div
//           className="fixed inset-0 bg-black/60 z-40 lg:hidden"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}

//       {/* Sidebar — fixed drawer on mobile, static on desktop */}
//       <div
//         className={`fixed lg:relative inset-y-0 right-0 z-50 transition-transform duration-300 lg:translate-x-0 lg:flex flex-shrink-0 ${
//           sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
//         }`}
//       >
//         <Sidebar onClose={() => setSidebarOpen(false)} />
//       </div>

//       {/* Main area */}
//       <div className="flex-1 flex flex-col overflow-hidden min-w-0">
//         <Header onMenuOpen={() => setSidebarOpen(true)} />
//         <main className="flex-1 overflow-y-auto p-4 lg:p-6">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }

"use client"; // ضروري جداً لأنك تستخدم useState وتفاعلات العميل

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

// في Next.js نستخدم children كخاصية بديلة للـ Outlet
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      dir="rtl"
      style={{ fontFamily: "'Tajawal', sans-serif" }}
      className="flex h-screen overflow-hidden bg-background"
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed drawer on mobile, static on desktop */}
      <div
        className={`fixed lg:relative inset-y-0 right-0 z-50 transition-transform duration-300 lg:translate-x-0 lg:flex flex-shrink-0 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onMenuOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* هنا يتم عرض صفحات المشروع تلقائياً بدلاً من Outlet */}
          {children} 
        </main>
      </div>
    </div>
  );
}
