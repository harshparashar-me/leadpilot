# 💬 PHASE 4: WHATSAPP BUSINESS API INTEGRATION

**Duration**: 7-10 days  
**Complexity**: High  
**Dependencies**: Phase 1 (Webhooks)  
**Prerequisites**: WhatsApp Business Account + API Setup

---

## Overview

```
WhatsApp Message Incoming
    ↓
Webhook → LeadPilot
    ↓
Create/Link Contact + Log Message
    ↓
Show in Chat UI + Send Response
    ↓
Outbound Messages to Contacts
```

---

## 4.1 WhatsApp Database Schema

**File**: `supabase/migrations/20251231_whatsapp_integration.sql`

```sql
-- WhatsApp configuration
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_id varchar(255) NOT NULL UNIQUE,
  business_account_id varchar(255) NOT NULL,
  access_token varchar(500) NOT NULL ENCRYPTED,
  webhook_verify_token varchar(255),
  status varchar(50) DEFAULT 'active',
  default_greeting_message text,
  auto_response_enabled boolean DEFAULT true,
  auto_response_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- WhatsApp conversations (chat threads)
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  whatsapp_phone varchar(20) NOT NULL UNIQUE,
  last_message_at timestamp with time zone,
  last_message_text text,
  last_message_direction varchar(10), -- 'inbound' or 'outbound'
  unread_count int DEFAULT 0,
  status varchar(50) DEFAULT 'active', -- 'active', 'archived', 'closed'
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- WhatsApp messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  whatsapp_message_id varchar(255) NOT NULL UNIQUE,
  direction varchar(10) NOT NULL, -- 'inbound' or 'outbound'
  message_type varchar(50) DEFAULT 'text', -- 'text', 'image', 'document', 'audio', 'video'
  sender_phone varchar(20),
  receiver_phone varchar(20),
  content text,
  media_url text,
  media_type varchar(50),
  status varchar(50) DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
  raw_payload jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- WhatsApp templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name varchar(255) NOT NULL,
  template_language varchar(10) DEFAULT 'en',
  template_id varchar(255),
  template_content text NOT NULL,
  category varchar(50) DEFAULT 'MARKETING', -- 'MARKETING', 'OTP', 'UTILITY', 'AUTHENTICATION'
  header_example text,
  body_variables text[], -- Variable names like {{1}}, {{2}}
  footer_example text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- WhatsApp broadcast campaigns
CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name varchar(255) NOT NULL,
  template_id uuid REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
  recipient_count int DEFAULT 0,
  sent_count int DEFAULT 0,
  failed_count int DEFAULT 0,
  status varchar(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'in_progress', 'completed'
  scheduled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- WhatsApp conversation logs
CREATE TABLE IF NOT EXISTS whatsapp_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  activity_type varchar(50), -- 'message_received', 'message_sent', 'auto_reply', 'template_sent'
  activity_data jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX idx_whatsapp_conv_contact ON whatsapp_conversations(contact_id);
CREATE INDEX idx_whatsapp_conv_phone ON whatsapp_conversations(whatsapp_phone);
CREATE INDEX idx_whatsapp_msg_conv ON whatsapp_messages(conversation_id);
CREATE INDEX idx_whatsapp_msg_direction ON whatsapp_messages(direction);
CREATE INDEX idx_whatsapp_msg_created ON whatsapp_messages(created_at);
CREATE INDEX idx_whatsapp_activity_conv ON whatsapp_activity(conversation_id);
```

---

## 4.2 WhatsApp Service

**File**: `src/lib/whatsapp.ts`

```typescript
import { supabase } from './supabase';

export interface WhatsAppMessage {
  entry: Array<{
    changes: Array<{
      value: {
        messaging_product: string;
        messages: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          image?: { id: string; mime_type: string };
          video?: { id: string; mime_type: string };
          audio?: { id: string; mime_type: string };
          document?: { id: string; mime_type: string };
        }>;
        contacts: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
      };
    }>;
  }>;
}

export interface WhatsAppConfig {
  phone_number_id: string;
  business_account_id: string;
  access_token: string;
  webhook_verify_token: string;
}

/**
 * Verify webhook token
 */
export const verifyWhatsAppWebhook = (
  token: string,
  configToken: string
): boolean => {
  return token === configToken;
};

/**
 * Handle incoming WhatsApp message
 */
export const handleIncomingMessage = async (payload: WhatsAppMessage) => {
  try {
    const changes = payload.entry?.[0]?.changes?.[0];
    if (!changes) throw new Error('Invalid payload structure');

    const messages = changes.value.messages || [];
    const contacts = changes.value.contacts || [];

    if (!messages.length) return null;

    for (const message of messages) {
      const contact = contacts.find((c) => c.wa_id === message.from);
      const contactName = contact?.profile?.name || 'Unknown';
      const phoneNumber = message.from;

      // Find or create contact
      let contactId: string;
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('phone', phoneNumber)
        .single();

      if (existingContact) {
        contactId = existingContact.id;
      } else {
        const { data: newContact, error } = await supabase
          .from('contacts')
          .insert([
            {
              name: contactName,
              phone: phoneNumber,
              source: 'whatsapp',
              status: 'new',
            },
          ])
          .select()
          .single();

        if (error) throw error;
        contactId = newContact.id;
      }

      // Find or create conversation
      let conversationId: string;
      const { data: existingConv } = await supabase
        .from('whatsapp_conversations')
        .select('id')
        .eq('whatsapp_phone', phoneNumber)
        .single();

      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        const { data: newConv, error } = await supabase
          .from('whatsapp_conversations')
          .insert([
            {
              contact_id: contactId,
              whatsapp_phone: phoneNumber,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        conversationId = newConv.id;
      }

      // Parse message content
      let messageContent = '';
      let messageType = message.type;

      if (message.text) {
        messageContent = message.text.body;
      } else if (message.image?.id) {
        messageContent = '[Image received]';
        messageType = 'image';
      } else if (message.document?.id) {
        messageContent = '[Document received]';
        messageType = 'document';
      } else if (message.video?.id) {
        messageContent = '[Video received]';
        messageType = 'video';
      } else if (message.audio?.id) {
        messageContent = '[Audio received]';
        messageType = 'audio';
      }

      // Store message
      const { data: storedMessage, error: msgError } = await supabase
        .from('whatsapp_messages')
        .insert([
          {
            conversation_id: conversationId,
            whatsapp_message_id: message.id,
            direction: 'inbound',
            message_type: messageType,
            sender_phone: phoneNumber,
            content: messageContent,
            media_url: null,
            raw_payload: message,
          },
        ])
        .select()
        .single();

      if (msgError) throw msgError;

      // Update conversation
      await supabase
        .from('whatsapp_conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_text: messageContent,
          last_message_direction: 'inbound',
          unread_count: 1,
        })
        .eq('id', conversationId);

      // Log activity
      await supabase.from('whatsapp_activity').insert([
        {
          conversation_id: conversationId,
          activity_type: 'message_received',
          activity_data: {
            message_id: message.id,
            message_type: messageType,
          },
        },
      ]);

      // Send auto-response
      const { data: config } = await supabase
        .from('whatsapp_config')
        .select('*')
        .limit(1)
        .single();

      if (config?.auto_response_enabled && config?.auto_response_message) {
        await sendWhatsAppMessage(
          phoneNumber,
          config.auto_response_message,
          config.phone_number_id,
          config.access_token
        );
      }
    }

    return { status: 'success', message: 'Messages processed' };
  } catch (error: any) {
    console.error('Error handling WhatsApp message:', error);
    return { status: 'error', message: error.message };
  }
};

/**
 * Send WhatsApp message
 */
export const sendWhatsAppMessage = async (
  recipientPhone: string,
  messageText: string,
  phoneNumberId: string,
  accessToken: string
): Promise<any> => {
  const response = await fetch(
    `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipientPhone,
        type: 'text',
        text: { body: messageText },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to send WhatsApp message: ${response.statusText}`);
  }

  const data = await response.json();
  const messageId = data.messages?.[0]?.id;

  // Store message in database
  const { data: conversation } = await supabase
    .from('whatsapp_conversations')
    .select('id')
    .eq('whatsapp_phone', recipientPhone)
    .single();

  if (conversation) {
    await supabase.from('whatsapp_messages').insert([
      {
        conversation_id: conversation.id,
        whatsapp_message_id: messageId,
        direction: 'outbound',
        message_type: 'text',
        receiver_phone: recipientPhone,
        content: messageText,
        status: 'sent',
      },
    ]);

    await supabase
      .from('whatsapp_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_text: messageText,
        last_message_direction: 'outbound',
      })
      .eq('id', conversation.id);
  }

  return data;
};

/**
 * Get conversations
 */
export const getConversations = async () => {
  const { data, error } = await supabase
    .from('whatsapp_conversations')
    .select(
      `
      *,
      contact:contacts(*),
      messages:whatsapp_messages(count)
    `
    )
    .order('last_message_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Get conversation messages
 */
export const getConversationMessages = async (conversationId: string) => {
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

/**
 * Send template message
 */
export const sendTemplateMessage = async (
  recipientPhone: string,
  templateName: string,
  templateVariables: string[],
  phoneNumberId: string,
  accessToken: string
): Promise<any> => {
  const response = await fetch(
    `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipientPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en_US' },
          components: [
            {
              type: 'body',
              parameters: templateVariables.map((value) => ({
                type: 'text',
                text: value,
              })),
            },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to send template: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Mark messages as read
 */
export const markAsRead = async (
  messageId: string,
  phoneNumberId: string,
  accessToken: string
): Promise<any> => {
  const response = await fetch(
    `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to mark as read: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Get WhatsApp configuration
 */
export const getWhatsAppConfig = async (): Promise<WhatsAppConfig> => {
  const { data, error } = await supabase
    .from('whatsapp_config')
    .select('*')
    .limit(1)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Save WhatsApp configuration
 */
export const saveWhatsAppConfig = async (config: Partial<WhatsAppConfig>) => {
  const { data, error } = await supabase
    .from('whatsapp_config')
    .upsert([config])
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

---

## 4.3 WhatsApp Chat Component

**File**: `src/modules/chat/WhatsAppChat.tsx`

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, MoreVertical, Paperclip } from 'lucide-react';
import { getConversationMessages, sendWhatsAppMessage, getWhatsAppConfig } from '../../lib/whatsapp';

interface WhatsAppChatProps {
  conversationId: string;
  contactName: string;
  phoneNumber: string;
}

export const WhatsAppChat: React.FC<WhatsAppChatProps> = ({
  conversationId,
  contactName,
  phoneNumber,
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [msgs, cfg] = await Promise.all([
          getConversationMessages(conversationId),
          getWhatsAppConfig(),
        ]);
        setMessages(msgs);
        setConfig(cfg);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();

    // Refresh messages every 3 seconds
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    try {
      await sendWhatsAppMessage(
        phoneNumber,
        inputText,
        config.phone_number_id,
        config.access_token
      );
      setInputText('');
      
      // Refresh messages
      const msgs = await getConversationMessages(conversationId);
      setMessages(msgs);
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h3 className="font-semibold text-gray-900">{contactName}</h3>
          <p className="text-xs text-gray-500">{phoneNumber}</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Phone className="h-4 w-4 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <MoreVertical className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.direction === 'outbound'
                  ? 'bg-green-600 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-900 rounded-bl-none'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4 flex gap-2">
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <Paperclip className="h-5 w-5 text-gray-600" />
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
        />
        <button
          onClick={handleSend}
          disabled={loading || !inputText.trim()}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default WhatsAppChat;
```

---

## 4.4 WhatsApp Conversations List

**File**: `src/modules/chat/WhatsAppConversations.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { MessageCircle, Search } from 'lucide-react';
import { getConversations } from '../../lib/whatsapp';

interface WhatsAppConversationsProps {
  onSelectConversation: (id: string, name: string, phone: string) => void;
}

export const WhatsAppConversations: React.FC<WhatsAppConversationsProps> = ({
  onSelectConversation,
}) => {
  const [conversations, setConversations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations();
        setConversations(data || []);
      } catch (err) {
        console.error('Error fetching conversations:', err);
      }
    };

    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = conversations.filter((c: any) =>
    c.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border overflow-hidden">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto divide-y">
        {filtered.map((conv: any) => (
          <button
            key={conv.id}
            onClick={() =>
              onSelectConversation(
                conv.id,
                conv.contact?.name,
                conv.whatsapp_phone
              )
            }
            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{conv.contact?.name}</p>
                <p className="text-sm text-gray-600 truncate">
                  {conv.last_message_text}
                </p>
              </div>
              {conv.unread_count > 0 && (
                <div className="flex-shrink-0 w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center">
                  {conv.unread_count}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WhatsAppConversations;
```

---

## 4.5 WhatsApp Integration Page

**File**: `src/modules/integrations/WhatsAppPage.tsx`

```typescript
import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { MessageCircle, Settings } from 'lucide-react';
import WhatsAppSetup from './WhatsAppSetup';
import WhatsAppChat from '../chat/WhatsAppChat';
import WhatsAppConversations from '../chat/WhatsAppConversations';

type Tab = 'setup' | 'chat';

export const WhatsAppPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    name: string;
    phone: string;
  } | null>(null);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp Integration</h1>
            <p className="text-sm text-gray-600 mt-1">
              Send and receive messages with your leads
            </p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-green-600" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'chat'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600'
            }`}
          >
            <MessageCircle className="h-4 w-4 inline mr-2" />
            Messages
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'setup'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Setup
          </button>
        </div>

        {/* Content */}
        {activeTab === 'setup' ? (
          <div className="bg-white rounded-lg border p-6">
            <WhatsAppSetup />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6 h-[600px]">
            <div>
              <WhatsAppConversations
                onSelectConversation={(id, name, phone) =>
                  setSelectedConversation({ id, name, phone })
                }
              />
            </div>
            <div className="col-span-2">
              {selectedConversation ? (
                <WhatsAppChat
                  conversationId={selectedConversation.id}
                  contactName={selectedConversation.name}
                  phoneNumber={selectedConversation.phone}
                />
              ) : (
                <div className="bg-white rounded-lg border flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Select a conversation to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default WhatsAppPage;
```

---

## 4.6 WhatsApp Setup Component

**File**: `src/modules/integrations/WhatsAppSetup.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { AlertCircle, Copy, Check, Settings } from 'lucide-react';
import { saveWhatsAppConfig, getWhatsAppConfig } from '../../lib/whatsapp';

export const WhatsAppSetup: React.FC = () => {
  const [step, setStep] = useState<'instructions' | 'credentials' | 'webhook' | 'complete'>(
    'instructions'
  );
  const [formData, setFormData] = useState({
    phone_number_id: '',
    business_account_id: '',
    access_token: '',
    webhook_verify_token: '',
    auto_response_message: 'Thanks for reaching out! We will get back to you soon.',
  });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const webhookURL = `${window.location.origin}/api/webhooks/whatsapp`;

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await getWhatsAppConfig();
        if (config) {
          setFormData({
            ...config,
            access_token: config.access_token ? '***hidden***' : '',
          });
          setStep('complete');
        }
      } catch (err) {
        console.error('Error fetching config:', err);
      }
    };

    fetchConfig();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveWhatsAppConfig(formData);
      setStep('webhook');
    } catch (err) {
      alert('Error saving configuration');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookURL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (step === 'instructions') {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Setup Instructions</h3>
            <ol className="text-sm text-blue-800 mt-2 space-y-1">
              <li>1. Create a WhatsApp Business Account (if not already done)</li>
              <li>2. Create a Meta App and add WhatsApp product</li>
              <li>3. Get your Access Token from Meta Developer Dashboard</li>
              <li>4. Get Phone Number ID from WhatsApp settings</li>
              <li>5. Configure webhook URL in Meta App settings</li>
              <li>6. Test webhook connection</li>
            </ol>
          </div>
        </div>

        <button
          onClick={() => setStep('credentials')}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Settings className="h-4 w-4 inline mr-2" />
          Configure WhatsApp
        </button>
      </div>
    );
  }

  if (step === 'credentials') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Phone Number ID</label>
          <input
            type="text"
            value={formData.phone_number_id}
            onChange={(e) =>
              setFormData({ ...formData, phone_number_id: e.target.value })
            }
            placeholder="Your phone number ID"
            className="w-full px-3 py-2 border rounded-lg font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Business Account ID</label>
          <input
            type="text"
            value={formData.business_account_id}
            onChange={(e) =>
              setFormData({ ...formData, business_account_id: e.target.value })
            }
            placeholder="Your business account ID"
            className="w-full px-3 py-2 border rounded-lg font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Access Token</label>
          <input
            type="password"
            value={formData.access_token}
            onChange={(e) =>
              setFormData({ ...formData, access_token: e.target.value })
            }
            placeholder="Your access token"
            className="w-full px-3 py-2 border rounded-lg font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Webhook Verify Token</label>
          <input
            type="text"
            value={formData.webhook_verify_token}
            onChange={(e) =>
              setFormData({ ...formData, webhook_verify_token: e.target.value })
            }
            placeholder="Create a random token for verification"
            className="w-full px-3 py-2 border rounded-lg font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Auto-Response Message</label>
          <textarea
            value={formData.auto_response_message}
            onChange={(e) =>
              setFormData({ ...formData, auto_response_message: e.target.value })
            }
            rows={3}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Next: Configure Webhook'}
        </button>
      </div>
    );
  }

  if (step === 'webhook') {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            Configure your webhook in the Meta Developer Dashboard
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Webhook URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={webhookURL}
              readOnly
              className="flex-1 px-3 py-2 border rounded-lg font-mono bg-gray-50"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Verify Token</label>
          <p className="text-xs text-gray-600">
            Enter the webhook verify token you created above
          </p>
        </div>

        <button
          onClick={() => setStep('complete')}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Complete Setup
        </button>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
      <Check className="h-12 w-12 text-green-600 mx-auto mb-3" />
      <h3 className="font-semibold text-green-900 mb-1">Setup Complete!</h3>
      <p className="text-sm text-green-800">
        Your WhatsApp integration is now active. You can send and receive messages with your leads.
      </p>
    </div>
  );
};

export default WhatsAppSetup;
```

---

## 4.7 Webhook Handler Update

**Update**: `supabase/functions/webhook-receiver/index.ts`

```typescript
const handleWhatsAppWebhook = async (payload: any, token: string) => {
  try {
    const { handleIncomingMessage, verifyWhatsAppWebhook, getWhatsAppConfig } =
      await import('../../../src/lib/whatsapp.ts');

    const config = await getWhatsAppConfig();

    // Verify webhook token
    if (!verifyWhatsAppWebhook(token, config.webhook_verify_token)) {
      return { error: 'Invalid webhook token' };
    }

    // Handle message
    const result = await handleIncomingMessage(payload);
    return result;
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return { error: 'Failed to process WhatsApp message' };
  }
};
```

---

## 4.8 Implementation Checklist

- [ ] Create migration: `20251231_whatsapp_integration.sql`
- [ ] Run: `supabase db push`
- [ ] Create `src/lib/whatsapp.ts` service
- [ ] Create `src/modules/chat/WhatsAppChat.tsx`
- [ ] Create `src/modules/chat/WhatsAppConversations.tsx`
- [ ] Create `src/modules/integrations/WhatsAppSetup.tsx`
- [ ] Create `src/modules/integrations/WhatsAppPage.tsx`
- [ ] Update webhook receiver for WhatsApp
- [ ] Add route: `/integrations/whatsapp`
- [ ] Create Meta Developer App
- [ ] Configure webhook in Meta Developer Dashboard
- [ ] Test webhook with sample messages

---

## 4.9 Environment Variables

Add to `.env`:

```
VITE_WHATSAPP_BUSINESS_PHONE_ID=your_phone_id
VITE_WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token
```

---

## 4.10 Testing

```bash
# Test webhook locally (inbound message)
curl -X POST http://localhost:3000/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature: sha256=..." \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "messages": [{
            "from": "919876543210",
            "id": "wamid.123456",
            "timestamp": "1234567890",
            "type": "text",
            "text": { "body": "Hello from WhatsApp!" }
          }],
          "contacts": [{
            "profile": { "name": "John Doe" },
            "wa_id": "919876543210"
          }]
        }
      }]
    }]
  }'
```

---

## 4.11 Advanced Features

### Message Templates
```typescript
// Pre-defined message templates
const templates = [
  {
    name: 'greeting',
    body: 'Hi {{1}}, thanks for contacting {{2}}. How can we help?',
  },
  {
    name: 'quotation',
    body: 'Your quotation for {{1}} is ready. Check details: {{2}}',
  },
];
```

### Broadcast Campaigns
```typescript
// Send messages to multiple contacts
const sendBroadcast = async (contactIds: string[], templateName: string) => {
  // Filter out previously messaged
  // Send template messages
  // Track delivery status
};
```

### Rich Media Support
```typescript
// Send images, documents, videos, audio
const sendMedia = async (phone: string, mediaUrl: string, type: string) => {
  // Download and upload to WhatsApp servers
  // Send media message
};
```

---

## ✅ PHASE 4 COMPLETE!

After Phase 4, you'll have:
- ✅ WhatsApp Business API integration
- ✅ Inbound/outbound messaging
- ✅ Conversation history
- ✅ Auto-response capability
- ✅ Real-time chat UI
- ✅ Contact linking
- ✅ Message templates

---

## 🎉 ALL PHASES COMPLETE!

**Your Complete Lead Generation + Communication System**:
- ✅ Phase 1: Webhook Foundation
- ✅ Phase 2: Meta Ads Lead Capture
- ✅ Phase 3: Google Ads Lead Capture
- ✅ Phase 4: WhatsApp Communication

**Status**: Ready for production deployment  
**Total Implementation Time**: 25-35 days  
**Team Size**: 1-2 developers
