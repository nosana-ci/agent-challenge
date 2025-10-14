"use client";

interface HeaderProps {
  userName?: string;
}

export default function DashboardHeader({ userName = "User" }: HeaderProps) {
  return (
    <header className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            {/* <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white text-xl font-bold">🔮</span>
            </div> */}
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent">
                NOSIGHT
              </h1>
              <p className="text-xs text-slate-400">AI Market Intelligence</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-white font-medium hover:text-teal-400 transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("analysis-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="text-slate-400 hover:text-white transition-colors"
            >
              Analysis
            </button>
            <button
              onClick={() =>
                alert(
                  "🔔 Alerts feature coming soon! Set price alerts and get notified about market movements."
                )
              }
              className="text-slate-400 hover:text-white transition-colors"
            >
              Alerts
            </button>
          </nav>

          {/* User Avatar */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <div className="text-sm text-white font-medium">{userName}</div>
              <div className="text-xs text-slate-400">Premium</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg cursor-pointer hover:scale-105 transition-transform">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
