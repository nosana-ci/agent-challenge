"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { Loader2, Wallet } from "lucide-react";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, login } = usePrivy();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (ready) {
      setIsLoading(false);
    }
  }, [ready]);

  // Show loading screen while Privy initializes
  if (isLoading || !ready) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[#10E80C] animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-semibold">Initializing...</p>
          <p className="text-slate-400 text-sm mt-2">
            Loading Nosight Dashboard
          </p>
        </div>
      </div>
    );
  }

  // Show auth screen if not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
        {/* Background grid effect */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#10E80C0A_1px,transparent_1px),linear-gradient(to_bottom,#10E80C0A_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]" />

        {/* Content */}
        <div className="relative z-10 max-w-md w-full mx-4">
          <div className="glass-dark rounded-2xl p-8 text-center border-2 border-[#10E80C]/30 shadow-2xl">
            {/* Logo */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold gradient-text neon-glow mb-2">
                NOSIGHT
              </h1>
              <p className="text-slate-400 text-sm">AI Market Intelligence</p>
            </div>

            {/* Welcome Message */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-3">
                Welcome to Nosight
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Connect your Solana wallet to access AI-powered crypto
                analytics, real-time market intelligence, and advanced trading
                insights.
              </p>
            </div>

            {/* Features List */}
            <div className="mb-8 text-left space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#10E80C]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#10E80C] text-sm">✓</span>
                </div>
                <p className="text-slate-300 text-sm">
                  Real-time market data and price tracking
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#10E80C]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#10E80C] text-sm">✓</span>
                </div>
                <p className="text-slate-300 text-sm">
                  AI-powered technical analysis and insights
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#10E80C]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#10E80C] text-sm">✓</span>
                </div>
                <p className="text-slate-300 text-sm">
                  Portfolio tracking and risk assessment
                </p>
              </div>
            </div>

            {/* Connect Wallet Button */}
            <button
              onClick={login}
              className="w-full bg-gradient-to-r from-[#10E80C] to-[#0CAF09] hover:from-[#0CAF09] hover:to-[#0A8A07] 
                       text-black font-bold px-8 py-4 rounded-xl transition-all 
                       shadow-lg hover:shadow-[#10E80C]/40 hover:scale-105 neon-border
                       flex items-center justify-center gap-3"
            >
              <Wallet className="h-5 w-5" />
              Connect Wallet
            </button>

            {/* Security Notice */}
            <p className="text-slate-500 text-xs mt-6 leading-relaxed">
              Secured by Privy. We support Phantom, Solflare, Backpack, and
              other Solana wallets.
            </p>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-slate-500 text-sm">
              Built for the{" "}
              <span className="text-[#10E80C] font-semibold">
                Nosana Builders Challenge
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated, show the app
  return <>{children}</>;
}
