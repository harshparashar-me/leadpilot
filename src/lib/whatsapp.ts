// WhatsApp Integration Service
// Uses WhatsApp Business API (Unofficial - would need actual integration)

export interface WhatsAppMessage {
    id: string;
    from: string;
    to: string;
    message: string;
    timestamp: string;
    direction: 'incoming' | 'outgoing';
    status: 'sent' | 'delivered' | 'read' | 'failed';
}

class WhatsAppService {
    private apiUrl = process.env.VITE_WHATSAPP_API_URL || 'https://api.whatsapp.com/send';
    private apiKey = process.env.VITE_WHATSAPP_API_KEY || '';

    async sendMessage(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            // In production, this would call actual WhatsApp Business API
            // For now, return mock response
            const messageId = `wa_${Date.now()}`;

            console.log(`[WhatsApp] Sending to ${to}: ${message}`);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));

            return {
                success: true,
                messageId
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send'
            };
        }
    }

    async getMessages(phoneNumber: string): Promise<WhatsAppMessage[]> {
        // Mock historical messages
        return [
            {
                id: 'msg1',
                from: phoneNumber,
                to: 'business',
                message: 'Hi, I want to know more about your property',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                direction: 'incoming',
                status: 'read'
            },
            {
                id: 'msg2',
                from: 'business',
                to: phoneNumber,
                message: 'Hello! Thank you for your interest. When would you like to schedule a visit?',
                timestamp: new Date(Date.now() - 1800000).toISOString(),
                direction: 'outgoing',
                status: 'delivered'
            }
        ];
    }

    openWhatsAppWeb(phoneNumber: string, message?: string) {
        const formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
        const text = message ? `&text=${encodeURIComponent(message)}` : '';
        window.open(`https://wa.me/${formattedNumber}?${text}`, '_blank');
    }
}

export const whatsappService = new WhatsAppService();
