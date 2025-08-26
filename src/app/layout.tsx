import { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { Banner, Footer, Header } from "@/components";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Typing Panda",
  description: "A typing practice application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/panda.ico" />
        <meta
          name="google-site-verification"
          content="7e79veV3Sq-Pfu_lW94F2-SpEz0v1E8JtP-qH3Vwazk"
        />
        <meta
          name="description"
          content="Typing Panda is a fun typing practice app to boost your typing speed and accuracy."
        />
        <meta
          name="keywords"
          content="typing panda, typing practice, typing test, typing speed, typing app"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://typing-panda.vercel.app/" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        <Banner />
        <div className="mt-20 min-h-[85vh]">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
