"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  MessageSquare,
  Search,
  Bell,
  Menu,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-indigo-700 text-white transition-all duration-300 flex flex-col fixed md:relative z-20 h-full`}
      >
        <div className="h-16 flex items-center justify-center border-b border-indigo-600">
          <h1 className={`font-serif text-2xl font-bold ${!isSidebarOpen && "hidden"}`}>
            DashStack
          </h1>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-4">
          <NavItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            isOpen={isSidebarOpen}
            isActive
          />
          <NavItem
            icon={<ShoppingBag size={20} />}
            label="Products"
            isOpen={isSidebarOpen}
          />
          <NavItem
            icon={<Heart size={20} />}
            label="Favorites"
            isOpen={isSidebarOpen}
          />
          <NavItem
            icon={<MessageSquare size={20} />}
            label="Messenger"
            isOpen={isSidebarOpen}
          />
        </nav>

        <div className="p-4 border-t border-indigo-600 text-center text-xs text-indigo-300">
          {isSidebarOpen && <p>&copy; 2025 DashStack</p>}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-500 hover:text-indigo-600 transition"
            >
              <Menu size={24} />
            </button>
            <div className="relative hidden md:block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-gray-500 hover:text-indigo-600">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full block"></span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                English
              </span>
            </div>
            <div className="pl-4 border-l border-gray-200">
              <UserButton />
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

// Helper Component for Nav Items
const NavItem = ({
  icon,
  label,
  isOpen,
  isActive = false,
}: {
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  isActive?: boolean;
}) => (
  <button
    className={`flex items-center ${
      isOpen ? "justify-start px-4" : "justify-center px-0"
    } w-full py-3 rounded-lg transition-colors ${
      isActive
        ? "bg-white/10 text-white"
        : "text-indigo-100 hover:bg-white/5 hover:text-white"
    }`}
  >
    {icon}
    {isOpen && <span className="ml-3 font-medium text-sm">{label}</span>}
  </button>
);
