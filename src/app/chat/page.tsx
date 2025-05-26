"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/store";
import { Layout } from "antd"; // Возможно, понадобится Layout из antd
import { ChatList } from "@/components/chat/ChatList";
import { ChatWindow } from "@/components/chat/ChatWindow";

const { Sider, Content } = Layout;

export default function ChatPage() {
  const { isAuthenticated, sessionId, authLoading } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  useEffect(() => {
    // Если загрузка аутентификации завершена (authLoading === false) и пользователь не авторизован, перенаправляем
    if (!authLoading && !isAuthenticated && !sessionId) {
      console.log("ChatPage: Загрузка завершена, пользователь не авторизован. Перенаправление на /auth");
      router.push("/auth");
    } else if (!authLoading && isAuthenticated && sessionId) {
      console.log("ChatPage: Загрузка завершена, пользователь авторизован. Остаемся на странице чата.");
    }
  }, [isAuthenticated, sessionId, authLoading, router]);

  // Показываем индикатор загрузки, пока authLoading истинно
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Загрузка...
      </div>
    );
  }

  // Если загрузка завершена и пользователь авторизован, рендерим интерфейс чата
  if (!authLoading && isAuthenticated) {
    return (
        <Layout hasSider style={{ height: "100vh" }}>
          <Sider width={400} style={{ background: "#fff", overflowY: "auto" }}>
            <ChatList />
          </Sider>
          <Content style={{ background: "#fff", display: "flex", flexDirection: "column", height: "100%" }}>
            <ChatWindow />
          </Content>
        </Layout>
    );
  }

  // В остальных случаях (загрузка завершена, но !isAuthenticated), не рендерим ничего
  return null;
} 