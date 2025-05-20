"use client";

import { Layout, Typography } from "antd";
import ChatForm from "@/components/chat-form";
import { useTelegramSDK } from "@/hooks/use-telegram-sdk";

const { Header, Content } = Layout;
const { Title } = Typography;

export default function Home() {
	useTelegramSDK();

	return (
		<Layout className="min-h-screen">
			<Header style={{ background: "#fff", padding: "24px", height: "100%" }}>
				<Title level={3} style={{ margin: 0, color: "#000" }}>
					Telegram Chat
				</Title>
			</Header>
			<Content className="p-6">
				<ChatForm />
			</Content>
		</Layout>
	);
}
