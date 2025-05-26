import { Inter } from "next/font/google";
import { Providers } from "@/providers";
import { ConfigProvider } from "antd";
import ruRU from "antd/locale/ru_RU";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata = {
  title: "Telegram Web Client",
  description: "Веб-клиент для Telegram",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <style>
          {`
            html, body {
              margin: 0;
              padding: 0;
              height: 100%;
              overflow: hidden;
            }
            #__next {
              height: 100%;
            }
          `}
        </style>
        <Providers>
          <ConfigProvider locale={ruRU}>{children}</ConfigProvider>
        </Providers>
      </body>
    </html>
  );
}
