import type { Metadata } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import { CopilotKit } from "@copilotkit/react-core";
import "./globals.css";
import "@copilotkit/react-ui/styles.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nosight Dashboard | Nosana Builders Challenge",
  description:
    "Professional crypto analytics dashboard powered by Mastra AI - Real-time market intelligence for NOS token and crypto markets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sora.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <CopilotKit
          publicApiKey="ck_pub_aaf36e66c73bb2a04f2e0300e8c89a49"
          runtimeUrl="/api/copilotkit"
          agent="nosightAgent"
        >
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
