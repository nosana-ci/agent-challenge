"use client";

interface HeaderProps {
  userName?: string;
}

export default function DashboardHeader({ userName = "User" }: HeaderProps) {
  return (
    <header className="glass-dark border-b border-[#10E80C]/20 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold gradient-text neon-glow-sm">
                NOSIGHT
              </h1>
              <p className="text-xs text-slate-400">AI Market Intelligence</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-white font-medium hover:text-[#10E80C] hover:neon-glow-sm transition-all"
            >
              Dashboard
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("analysis-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="text-slate-400 hover:text-[#10E80C] hover:neon-glow-sm transition-all"
            >
              Analysis
            </button>
            <button
              onClick={() =>
                alert(
                  "🔔 Alerts feature coming soon! Set price alerts and get notified about market movements."
                )
              }
              className="text-slate-400 hover:text-[#10E80C] hover:neon-glow-sm transition-all"
            >
              Alerts
            </button>
          </nav>

          {/* User Avatar */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <div className="text-sm text-white font-medium">{userName}</div>
              <div className="text-xs text-[#10E80C]">Premium ✨</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-[#10E80C] to-[#0CAF09] rounded-full flex items-center justify-center text-black text-sm font-bold shadow-lg cursor-pointer hover:scale-110 transition-transform neon-border">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
