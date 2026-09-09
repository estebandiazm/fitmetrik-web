'use client'
import ClientProvider from "../context/ClientContext";
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className="font-manrope">
      <head>
        <title>FitMetrik</title>
        <meta name="description" content="Plataforma de gestión para nutricionistas y clientes" />
        {/* Global icon font for the whole app, loaded once from the root layout — the
            rule's "loads for a single page only" concern does not apply here. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <ClientProvider>
          {children}
        </ClientProvider>
      </body>
    </html>
  );
}