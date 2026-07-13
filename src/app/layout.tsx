import "@/styles/globals.css";

import { type Metadata } from "next";
import { AuthProvider } from "./_components/auth-provider";
import GoogleAdsense from "./_components/ad-sense";

export const metadata: Metadata = {
  title: {
    default: "Mionaire — The Ultimate Quiz Show",
    template: "%s | Mionaire",
  },
  description:
    "Take the hot seat, climb the money ladder, and see if you have what it takes to become a Mionaire.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const adSenseId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
      {adSenseId && <GoogleAdsense pId={adSenseId} />}
    </html>
  );
}
