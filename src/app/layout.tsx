import "@/styles/globals.css";

import { type Metadata } from "next";
import { Quantico } from "next/font/google";
import { TRPCReactProvider } from "@/trpc/react";
import GoogleAdsense from "./_components/ad-sense";

export const metadata: Metadata = {
  title: "Mionaire",
  description: "Can you become the mionaire by answering our questions??",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const quantico = Quantico({
  subsets: ["latin"],
  weight:["400", "700"],
  variable: "--font-quantico-sans",
});
const adSenseId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${quantico.variable}`}>
      <body>
      <TRPCReactProvider>
          {children}
      </TRPCReactProvider> 
      </body> 
      {adSenseId && <GoogleAdsense pId={adSenseId} />}
    </html>
  );
}
