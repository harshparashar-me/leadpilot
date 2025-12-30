import React, { useState, useEffect, useCallback } from "react";
import { MessageCircle, Send } from "lucide-react";
import { whatsappService, WhatsAppMessage } from "../lib/whatsapp";

interface WhatsAppPanelProps {
    leadId: string;
    phone: string;
    name: string;
}

export const WhatsAppPanel: React.FC<WhatsAppPanelProps> = ({ phone, name }) => {
    const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const loadMessages = useCallback(async () => {
        const msgs = await whatsappService.getMessages(phone);
        setMessages(msgs);
    }, [phone]);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        setLoading(true);
        const result = await whatsappService.sendMessage(phone, newMessage);

        if (result.success) {
            setMessages([
                ...messages,
                {
                    id: result.messageId!,
                    from: 'business',
                    to: phone,
                    message: newMessage,
                    timestamp: new Date().toISOString(),
                    direction: 'outgoing',
                    status: 'sent'
                }
            ]);
            setNewMessage("");
        } else {
            alert(`Failed: ${result.error}`);
        }
        setLoading(false);
    };

    const handleOpenWhatsAppWeb = () => {
        whatsappService.openWhatsAppWeb(phone, `Hi ${name}, `);
    };

    return (
        <div className="border rounded-lg bg-white h-full flex flex-col">
            {/* Header */}
            <div className="p-3 border-b flex items-center justify-between bg-green-50">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <div>
                        <div className="font-semibold text-sm">{name}</div>
                        <div className="text-xs text-gray-500">{phone}</div>
                    </div>
                </div>
                <button
                    onClick={handleOpenWhatsAppWeb}
                    className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    Open in WhatsApp
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-8">
                        No messages yet. Start a conversation!
                    </div>
                )}
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[70%] p-2 rounded-lg text-sm ${msg.direction === 'outgoing'
                                ? 'bg-green-500 text-white'
                                : 'bg-white border'
                                }`}
                        >
                            <div>{msg.message}</div>
                            <div className={`text-[10px] mt-1 ${msg.direction === 'outgoing' ? 'text-green-100' : 'text-gray-400'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t bg-white flex gap-2">
                <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                />
                <button
                    onClick={handleSend}
                    disabled={loading || !newMessage.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 flex items-center gap-1"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
