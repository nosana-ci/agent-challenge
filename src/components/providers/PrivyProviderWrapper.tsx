"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function PrivyProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        loginMethods: ["wallet", "email"],
        appearance: {
          theme: "dark",
          accentColor: "#10E80C",
          logo: "https://raw.githubusercontent.com/nosana-ci/brand/main/logo/nosana-logo-white.svg",
          showWalletLoginFirst: true,
          walletList: ["phantom", "solflare", "backpack"],
          landingHeader: "Welcome to Nosight",
          loginMessage:
            "Connect your Solana wallet to access AI-powered crypto analytics",
        },
        embeddedWallets: {
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
