"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Wallet,
  History,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userName?: string;
}

export default function Sidebar({ userName = "Builder" }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  const navigation = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      href: "#dashboard",
      badge: null,
    },
    {
      name: "Analysis",
      icon: TrendingUp,
      href: "#analysis",
      badge: null,
    },
    {
      name: "Portfolio",
      icon: Wallet,
      href: "#portfolio",
      badge: "New",
    },
    {
      name: "Charts",
      icon: BarChart3,
      href: "#charts",
      badge: null,
    },
    {
      name: "Alerts",
      icon: Bell,
      href: "#alerts",
      badge: "3",
    },
    {
      name: "History",
      icon: History,
      href: "#history",
      badge: null,
    },
  ];

  const bottomNavigation = [
    {
      name: "Settings",
      icon: Settings,
      href: "#settings",
    },
    {
      name: "Help",
      icon: HelpCircle,
      href: "#help",
    },
    {
      name: "Logout",
      icon: LogOut,
      href: "#logout",
    },
  ];

  const handleNavClick = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-screen glass-dark border-r border-[#10E80C]/20 transition-all duration-300 z-50 flex flex-col",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-[#10E80C]/20">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-2xl font-bold gradient-text neon-glow-sm">
                NOSIGHT
              </h1>
              <p className="text-xs text-slate-400">AI Intelligence</p>
            </div>
          )}
          {isCollapsed && (
            <div className="mx-auto">
              <div className="w-10 h-10 bg-gradient-to-br from-[#10E80C] to-[#0CAF09] rounded-lg flex items-center justify-center shadow-lg neon-border">
                <span className="text-black text-xl font-bold">N</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <button
            key={item.name}
            onClick={() => handleNavClick(item.href)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all group relative",
              "text-slate-400 hover:text-white hover:bg-[#10E80C]/10 hover:border-[#10E80C]/30",
              "border border-transparent"
            )}
          >
            <item.icon className="h-5 w-5 group-hover:text-[#10E80C] transition-colors flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="text-sm font-medium flex-1 text-left">
                  {item.name}
                </span>
                {item.badge && (
                  <span className="px-2 py-0.5 bg-[#10E80C] text-black text-xs font-bold rounded-full">
                    {item.badge}
                  </span>
                )}
              </>
            )}
            {isCollapsed && item.badge && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#10E80C] text-black text-xs font-bold rounded-full flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-4 border-t border-[#10E80C]/20 space-y-1">
        {bottomNavigation.slice(0, -1).map((item) => (
          <button
            key={item.name}
            onClick={() => handleNavClick(item.href)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
              "text-slate-400 hover:text-white hover:bg-[#10E80C]/10"
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-sm font-medium">{item.name}</span>
            )}
          </button>
        ))}

        {/* Logout Button - with Privy integration */}
        {authenticated && (
          <button
            onClick={logout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
              "text-red-400 hover:text-white hover:bg-red-500/10"
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-sm font-medium">Logout</span>
            )}
          </button>
        )}
      </div>

      {/* User Profile / Connect Wallet */}
      <div className="p-4 border-t border-[#10E80C]/20">
        {!authenticated || !ready ? (
          <button
            onClick={login}
            disabled={!ready}
            className="w-full bg-gradient-to-r from-[#10E80C] to-[#0CAF09] hover:from-[#0CAF09] hover:to-[#0A8A07] text-black font-bold px-4 py-3 rounded-lg transition-all neon-border"
          >
            {!isCollapsed ? "Connect Wallet" : "Connect"}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#10E80C] to-[#0CAF09] rounded-full flex items-center justify-center text-black text-sm font-bold shadow-lg neon-border flex-shrink-0">
              {user?.wallet?.address
                ? user.wallet.address.slice(0, 2).toUpperCase()
                : userName.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium truncate font-mono">
                  {wallets[0]?.address
                    ? `${wallets[0].address.slice(0, 4)}...${wallets[0].address.slice(-4)}`
                    : user?.email?.address || userName}
                </div>
                <div className="text-xs text-[#10E80C] flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#10E80C] rounded-full pulse-green" />
                  {wallets[0]?.walletClientType?.includes("solana")
                    ? "Solana"
                    : "Connected"}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-[#10E80C]/30 rounded-full flex items-center justify-center hover:bg-[#10E80C] hover:text-black transition-all group"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-[#10E80C] group-hover:text-black" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-[#10E80C] group-hover:text-black" />
        )}
      </button>
    </div>
  );
}
