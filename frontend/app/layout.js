import "./globals.css";
import ClientWrapper from "./ClientWrapper";


export const metadata = {
  title: "ZenSoul Wellness – Online Addiction Counselling India",
  description:
    "Confidential, licensed online therapy for alcohol, drug & behavioural addictions. Book secure video sessions, take free self-tests & start your recovery today.",
  openGraph: {
    title: "ZenSoul Wellness – Online Addiction Counselling India",
    description:
      "Premium, confidential online counselling for addiction recovery with licensed therapists across India.",
    url: "https://www.zensoulwellness.com",
    siteName: "ZenSoul Wellness",
    images: [
      {
        url: "/brand/Zen_soul_logo.png", // put an OG image in public/brand/
        width: 1200,
        height: 630,
        alt: "ZenSoul Wellness – Online Addiction Counselling",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZenSoul Wellness – Online Addiction Counselling",
    description:
      "Confidential, premium therapy for alcohol, drug & behavioural addictions. Start your recovery today.",
    images: ["/brand/Zen_soul_logo.png"],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={false}>
    <body>
    <ClientWrapper> {children} </ClientWrapper>
    </body>
    </html>
  );
}
