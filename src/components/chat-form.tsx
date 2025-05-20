"use client"

import { Form, Input, Button, Card } from "antd"
import { SendOutlined } from "@ant-design/icons"

interface ChatFormValues {
	recipient: string
	message: string
}

export default function ChatForm() {
	const [form] = Form.useForm()

	const handleSubmit = async (values: ChatFormValues) => {
		try {
			const response = await fetch("/api/send-message", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(values),
			})

			if (!response.ok) {
				throw new Error("Failed to send message")
			}

			form.resetFields()
		} catch (error) {
			console.error("Error sending message:", error)
		}
	}

	return (
		<Card className="max-w-2xl mx-auto">
			<Form
				form={form}
				onFinish={handleSubmit}
				layout="vertical"
			>
				<Form.Item
					label="Получатель"
					name="recipient"
					rules={[{ required: true, message: "Введите ID получателя" }]}
				>
					<Input placeholder="Введите ID получателя" />
				</Form.Item>

				<Form.Item
					label="Сообщение"
					name="message"
					rules={[{ required: true, message: "Введите сообщение" }]}
				>
					<Input.TextArea
						rows={4}
						placeholder="Введите ваше сообщение"
					/>
				</Form.Item>

				<Form.Item>
					<Button
						type="primary"
						htmlType="submit"
						icon={<SendOutlined />}
					>
						Отправить
					</Button>
				</Form.Item>
			</Form>
		</Card>
	)
} 