import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const playfair = localFont({
  src: [
    { path: "../public/fonts/PlayfairDisplay-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/PlayfairDisplay-Italic.ttf", weight: "400", style: "italic" },
  ],
  variable: "--f-title",
  display: "swap",
});
const montserrat = localFont({
  src: [
    { path: "../public/fonts/Montserrat-Light.ttf", weight: "300", style: "normal" },
    { path: "../public/fonts/Montserrat-Medium.ttf", weight: "500", style: "normal" },
  ],
  variable: "--f-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Inviti per feste ed eventi · Plumacreativa", template: "%s · Plumacreativa eventi" },
  description: "Crea inviti, menu e segnaposti per nascite, battesimi, compleanni, lauree e anniversari. Invito digitale da mandare su WhatsApp o stampa su carta pregiata.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${playfair.variable} ${montserrat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
