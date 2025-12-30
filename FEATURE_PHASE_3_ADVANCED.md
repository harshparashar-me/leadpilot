# 📊 PHASE 3: ADVANCED FEATURES - Pipeline, Analytics, Team Communication

**Duration**: Month 3 (4 weeks)  
**Complexity**: Very High  
**Dependencies**: Phase 1 + 2  
**Priority**: High - Visibility & collaboration

---

## Overview

```
Phase 3 adds visibility & collaboration:
├─ Pipeline/Kanban View (drag-drop boards)
├─ Advanced Analytics (funnels, forecasting)
└─ Team Communication (internal chat)
```

---

## 3.1 Database Schema

**File**: `supabase/migrations/20260213_pipeline_analytics.sql`

```sql
-- Pipelines (deal stages)
CREATE TABLE IF NOT EXISTS pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  entity_type varchar(50) DEFAULT 'deal', -- 'deal', 'lead'
  description text,
  stages jsonb NOT NULL, -- Array of stage objects
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Deal stages
CREATE TABLE IF NOT EXISTS deal_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  order_index int NOT NULL,
  color varchar(50),
  probability int DEFAULT 0, -- Win probability percentage
  created_at timestamp with time zone DEFAULT now()
);

-- Board view state
CREATE TABLE IF NOT EXISTS board_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  pipeline_id uuid REFERENCES pipelines(id),
  name varchar(255),
  groupby varchar(50) DEFAULT 'stage', -- 'stage', 'owner', 'priority'
  filters jsonb,
  card_fields text[], -- Which fields to display on cards
  collapsed_stages text[], -- Which stages are collapsed
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Analytics snapshots (for trend analysis)
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  entity_type varchar(50) NOT NULL, -- 'deal', 'lead', 'contact'
  metric_name varchar(255) NOT NULL,
  metric_value numeric NOT NULL,
  dimension1 varchar(255), -- e.g., pipeline_id, owner_id, status
  dimension2 varchar(255),
  created_at timestamp with time zone DEFAULT now()
);

-- Sales funnel metrics
CREATE TABLE IF NOT EXISTS funnel_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid REFERENCES pipelines(id),
  stage_id uuid REFERENCES deal_stages(id),
  total_count int DEFAULT 0,
  value_sum numeric DEFAULT 0,
  avg_duration_days int DEFAULT 0,
  conversion_rate numeric DEFAULT 0,
  period_start date,
  period_end date,
  created_at timestamp with time zone DEFAULT now()
);

-- Team communications (Slack-like)
CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL UNIQUE,
  description text,
  channel_type varchar(50) DEFAULT 'public', -- 'public', 'private', 'direct'
  created_by uuid REFERENCES auth.users(id),
  members uuid[] DEFAULT ARRAY[]::uuid[],
  archived boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Channel messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  body text NOT NULL,
  attachments jsonb, -- URLs, files
  edited_at timestamp with time zone,
  deleted_at timestamp with time zone,
  reactions jsonb, -- {"👍": ["user_id1"], "❤️": ["user_id2"]}
  thread_parent_id uuid REFERENCES messages(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Message mentions
CREATE TABLE IF NOT EXISTS message_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  mentioned_user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pipelines_entity ON pipelines(entity_type);
CREATE INDEX idx_deal_stages_pipeline ON deal_stages(pipeline_id);
CREATE INDEX idx_board_views_user ON board_views(user_id);
CREATE INDEX idx_analytics_snapshots_date ON analytics_snapshots(date);
CREATE INDEX idx_analytics_snapshots_metric ON analytics_snapshots(entity_type, metric_name);
CREATE INDEX idx_funnel_metrics_pipeline ON funnel_metrics(pipeline_id);
CREATE INDEX idx_channels_type ON channels(channel_type);
CREATE INDEX idx_messages_channel ON messages(channel_id);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_message_mentions_user ON message_mentions(mentioned_user_id);
```

---

## 3.2 Pipeline Management Service

**File**: `src/lib/pipelines.ts`

```typescript
import { supabase } from './supabase';

export interface PipelineStage {
  name: string;
  color?: string;
  probability?: number;
}

/**
 * Create pipeline
 */
export const createPipeline = async (
  name: string,
  stages: PipelineStage[],
  entityType = 'deal'
) => {
  const user = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('pipelines')
    .insert([
      {
        name,
        entity_type: entityType,
        stages: stages.map((s, i) => ({ ...s, order_index: i })),
        created_by: user.data.user?.id,
      },
    ])
    .select();

  if (error) throw error;

  // Create stage records
  if (data && data[0]) {
    for (const stage of stages) {
      const idx = stages.indexOf(stage);
      await supabase.from('deal_stages').insert([
        {
          pipeline_id: data[0].id,
          name: stage.name,
          order_index: idx,
          color: stage.color,
          probability: stage.probability,
        },
      ]);
    }
  }

  return data;
};

/**
 * Get pipelines
 */
export const getPipelines = async (entityType = 'deal') => {
  const { data, error } = await supabase
    .from('pipelines')
    .select('*')
    .eq('entity_type', entityType)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Get deals grouped by stage
 */
export const getDealsByStage = async (pipelineId: string) => {
  const { data, error } = await supabase
    .from('deals')
    .select('*, deal_stages!inner(*)')
    .eq('pipeline_id', pipelineId)
    .order('order_index', { foreignTable: 'deal_stages', ascending: true });

  if (error) throw error;

  // Group by stage
  const grouped: { [key: string]: any[] } = {};
  data?.forEach((deal) => {
    const stageName = deal.deal_stages?.name || 'Unknown';
    if (!grouped[stageName]) grouped[stageName] = [];
    grouped[stageName].push(deal);
  });

  return grouped;
};

/**
 * Move deal to stage
 */
export const moveDealToStage = async (dealId: string, stageId: string) => {
  const { data, error } = await supabase
    .from('deals')
    .update({ stage_id: stageId })
    .eq('id', dealId)
    .select();

  if (error) throw error;

  // Log activity
  const { data: stage } = await supabase
    .from('deal_stages')
    .select('name')
    .eq('id', stageId)
    .single();

  console.log(`Deal moved to ${stage?.name}`);

  return data;
};

/**
 * Save board view preferences
 */
export const saveBoardView = async (
  pipelineId: string,
  name: string,
  groupby = 'stage',
  filters?: any,
  cardFields?: string[]
) => {
  const user = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('board_views')
    .insert([
      {
        user_id: user.data.user?.id,
        pipeline_id: pipelineId,
        name,
        groupby,
        filters,
        card_fields: cardFields,
      },
    ])
    .select();

  if (error) throw error;
  return data;
};

/**
 * Get board view
 */
export const getBoardView = async (viewId: string) => {
  const { data, error } = await supabase
    .from('board_views')
    .select('*')
    .eq('id', viewId)
    .single();

  if (error) throw error;
  return data;
};
```

---

## 3.3 Analytics Service

**File**: `src/lib/analytics.ts`

```typescript
import { supabase } from './supabase';

/**
 * Record analytics metric
 */
export const recordMetric = async (
  entityType: string,
  metricName: string,
  value: number,
  dimension1?: string,
  dimension2?: string
) => {
  const { error } = await supabase.from('analytics_snapshots').insert([
    {
      date: new Date().toISOString().split('T')[0],
      entity_type: entityType,
      metric_name: metricName,
      metric_value: value,
      dimension1,
      dimension2,
    },
  ]);

  if (error) throw error;
};

/**
 * Get funnel data
 */
export const getFunnelData = async (
  pipelineId: string,
  periodStart?: string,
  periodEnd?: string
) => {
  let query = supabase
    .from('funnel_metrics')
    .select('*, deal_stages!inner(*)')
    .eq('pipeline_id', pipelineId);

  if (periodStart) {
    query = query.gte('period_start', periodStart);
  }

  if (periodEnd) {
    query = query.lte('period_end', periodEnd);
  }

  const { data, error } = await query.order('stage_id', { ascending: true });

  if (error) throw error;
  return data;
};

/**
 * Calculate conversion rate
 */
export const calculateConversionRate = async (
  fromStageId: string,
  toStageId: string,
  periodStart: string,
  periodEnd: string
) => {
  const { data: fromStage } = await supabase
    .from('funnel_metrics')
    .select('total_count')
    .eq('stage_id', fromStageId)
    .gte('period_start', periodStart)
    .lte('period_end', periodEnd);

  const { data: toStage } = await supabase
    .from('funnel_metrics')
    .select('total_count')
    .eq('stage_id', toStageId)
    .gte('period_start', periodStart)
    .lte('period_end', periodEnd);

  const fromCount = fromStage?.[0]?.total_count || 0;
  const toCount = toStage?.[0]?.total_count || 0;

  return fromCount > 0 ? (toCount / fromCount) * 100 : 0;
};

/**
 * Get revenue metrics
 */
export const getRevenueMetrics = async (
  entityType: string,
  periodStart: string,
  periodEnd: string
) => {
  const { data, error } = await supabase
    .from('analytics_snapshots')
    .select('*')
    .eq('entity_type', entityType)
    .in('metric_name', ['revenue', 'expected_revenue'])
    .gte('date', periodStart)
    .lte('date', periodEnd)
    .order('date', { ascending: true });

  if (error) throw error;
  return data;
};

/**
 * Get team performance
 */
export const getTeamPerformance = async (periodStart: string, periodEnd: string) => {
  const { data, error } = await supabase
    .from('analytics_snapshots')
    .select('*')
    .in('metric_name', ['deals_closed', 'revenue_generated'])
    .gte('date', periodStart)
    .lte('date', periodEnd)
    .order('dimension1', { ascending: true });

  if (error) throw error;

  // Group by user/team
  const grouped: { [key: string]: any[] } = {};
  data?.forEach((metric) => {
    const dimension = metric.dimension1 || 'unassigned';
    if (!grouped[dimension]) grouped[dimension] = [];
    grouped[dimension].push(metric);
  });

  return grouped;
};
```

---

## 3.4 Kanban Board Component

**File**: `src/components/KanbanBoard.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { getDealsByStage, moveDealToStage } from '../lib/pipelines';
import { GripHorizontal } from 'lucide-react';

interface Deal {
  id: string;
  title: string;
  amount: number;
  owner: string;
  stage_id: string;
}

interface Stage {
  id: string;
  name: string;
  color?: string;
}

export const KanbanBoard: React.FC<{ pipelineId: string }> = ({ pipelineId }) => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [dealsByStage, setDealsByStage] = useState<{ [key: string]: Deal[] }>({});
  const [dragging, setDragging] = useState<{ dealId: string; stageId: string } | null>(null);

  useEffect(() => {
    loadDeals();
  }, [pipelineId]);

  const loadDeals = async () => {
    try {
      const data = await getDealsByStage(pipelineId);
      setDealsByStage(data);
    } catch (err) {
      console.error('Error loading deals:', err);
    }
  };

  const handleDragStart = (dealId: string, stageId: string) => {
    setDragging({ dealId, stageId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetStageId: string) => {
    if (!dragging) return;

    try {
      await moveDealToStage(dragging.dealId, targetStageId);
      await loadDeals();
    } catch (err) {
      console.error('Error moving deal:', err);
    }

    setDragging(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto p-4">
      {stages.map((stage) => (
        <div
          key={stage.id}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(stage.id)}
          className="flex-shrink-0 w-80 bg-gray-100 rounded-lg p-4"
        >
          {/* Stage Header */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: stage.color || '#94a3b8' }}
            />
            <h2 className="font-semibold">{stage.name}</h2>
            <span className="text-sm text-gray-500">
              {dealsByStage[stage.id]?.length || 0}
            </span>
          </div>

          {/* Cards */}
          <div className="space-y-3">
            {(dealsByStage[stage.id] || []).map((deal) => (
              <div
                key={deal.id}
                draggable
                onDragStart={() => handleDragStart(deal.id, stage.id)}
                className="bg-white p-4 rounded-lg shadow cursor-move hover:shadow-lg"
              >
                <div className="flex items-start gap-2">
                  <GripHorizontal className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{deal.title}</h3>
                    <p className="text-sm text-gray-600">${deal.amount}</p>
                    <p className="text-xs text-gray-500">{deal.owner}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {(dealsByStage[stage.id]?.length || 0) === 0 && (
            <div className="text-center py-8 text-gray-400">
              Drop deals here
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
```

---

## 3.5 Messaging Service

**File**: `src/lib/messaging.ts`

```typescript
import { supabase } from './supabase';

/**
 * Create channel
 */
export const createChannel = async (
  name: string,
  channelType = 'public',
  members?: string[]
) => {
  const user = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('channels')
    .insert([
      {
        name,
        channel_type: channelType,
        created_by: user.data.user?.id,
        members: members || [],
      },
    ])
    .select();

  if (error) throw error;
  return data;
};

/**
 * Send message
 */
export const sendMessage = async (
  channelId: string,
  body: string,
  threadParentId?: string,
  mentions?: string[]
) => {
  const user = await supabase.auth.getUser();

  const { data: message, error } = await supabase
    .from('messages')
    .insert([
      {
        channel_id: channelId,
        user_id: user.data.user?.id,
        body,
        thread_parent_id: threadParentId,
      },
    ])
    .select();

  if (error) throw error;

  // Add mentions
  if (mentions && message) {
    for (const userId of mentions) {
      await supabase.from('message_mentions').insert([
        {
          message_id: message[0].id,
          mentioned_user_id: userId,
        },
      ]);
    }
  }

  return message;
};

/**
 * Get channel messages
 */
export const getChannelMessages = async (
  channelId: string,
  limit = 50,
  threadParentId?: string
) => {
  let query = supabase
    .from('messages')
    .select('*, users!inner(id, email, full_name)')
    .eq('channel_id', channelId);

  if (threadParentId) {
    query = query.eq('thread_parent_id', threadParentId);
  } else {
    query = query.is('thread_parent_id', null);
  }

  const { data, error } = await query
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
};

/**
 * Add reaction to message
 */
export const addReaction = async (messageId: string, emoji: string) => {
  const { data: message } = await supabase
    .from('messages')
    .select('reactions')
    .eq('id', messageId)
    .single();

  if (!message) return;

  const reactions = message.reactions || {};
  const user = await supabase.auth.getUser();
  const userId = user.data.user?.id;

  if (!reactions[emoji]) {
    reactions[emoji] = [];
  }

  if (!reactions[emoji].includes(userId)) {
    reactions[emoji].push(userId);
  }

  const { error } = await supabase
    .from('messages')
    .update({ reactions })
    .eq('id', messageId);

  if (error) throw error;
};

/**
 * Get user mentions
 */
export const getUserMentions = async (userId: string, limit = 20) => {
  const { data, error } = await supabase
    .from('message_mentions')
    .select('*, messages!inner(*, channels!inner(name))')
    .eq('mentioned_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};
```

---

## 3.6 Chat Component

**File**: `src/components/ChannelChat.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { getChannelMessages, sendMessage, addReaction } from '../lib/messaging';
import { Send, Smile } from 'lucide-react';

export const ChannelChat: React.FC<{ channelId: string }> = ({ channelId }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [channelId]);

  const loadMessages = async () => {
    try {
      const data = await getChannelMessages(channelId);
      setMessages(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await sendMessage(channelId, newMessage);
      setNewMessage('');
      await loadMessages();
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await addReaction(messageId, emoji);
      await loadMessages();
    } catch (err) {
      console.error('Error adding reaction:', err);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="group hover:bg-gray-50 p-2 rounded">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm">{msg.users?.full_name}</span>
                  <span className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm mt-1">{msg.body}</p>
                {msg.reactions && (
                  <div className="flex gap-1 mt-2">
                    {Object.entries(msg.reactions).map(([emoji, users]: any) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(msg.id, emoji)}
                        className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                      >
                        {emoji} {users.length}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t p-4 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border rounded-lg"
        />
        <button
          type="button"
          className="p-2 hover:bg-gray-100 rounded"
        >
          <Smile className="h-5 w-5" />
        </button>
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};

export default ChannelChat;
```

---

## 3.7 Analytics Dashboard

**File**: `src/pages/AnalyticsDashboard.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { getFunnelData, getTeamPerformance, getRevenueMetrics } from '../lib/analytics';
import { TrendingUp } from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [teamPerf, setTeamPerf] = useState<any>({});
  const [revenueData, setRevenueData] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - 30);

      const [funnel, team, revenue] = await Promise.all([
        getFunnelData('default-pipeline', periodStart.toISOString()),
        getTeamPerformance(periodStart.toISOString(), new Date().toISOString()),
        getRevenueMetrics('deal', periodStart.toISOString(), new Date().toISOString()),
      ]);

      setFunnelData(funnel || []);
      setTeamPerf(team);
      setRevenueData(revenue || []);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Revenue KPI */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-sm text-gray-600">Total Revenue</h3>
          <p className="text-3xl font-bold mt-2">
            ${revenueData.reduce((sum, d) => sum + (d.metric_value || 0), 0).toLocaleString()}
          </p>
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> +12% vs last month
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-sm text-gray-600">Deals Closed</h3>
          <p className="text-3xl font-bold mt-2">24</p>
          <p className="text-xs text-gray-600 mt-1">This month</p>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-sm text-gray-600">Win Rate</h3>
          <p className="text-3xl font-bold mt-2">35%</p>
          <p className="text-xs text-gray-600 mt-1">Last 90 days</p>
        </div>
      </div>

      {/* Funnel */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="font-semibold mb-4">Sales Funnel</h2>
        <div className="space-y-3">
          {funnelData.map((stage, idx) => (
            <div key={stage.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{stage.deal_stages?.name}</span>
                <span className="text-sm text-gray-600">{stage.total_count}</span>
              </div>
              <div className="w-full bg-gray-200 rounded h-8">
                <div
                  className="bg-blue-600 h-full rounded flex items-center justify-center text-white text-xs font-semibold"
                  style={{
                    width: `${100 - idx * 20}%`,
                  }}
                >
                  {100 - idx * 20}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="font-semibold mb-4">Team Performance</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Team Member</th>
              <th className="text-right py-2">Deals Closed</th>
              <th className="text-right py-2">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(teamPerf).map(([member, metrics]: any) => (
              <tr key={member} className="border-b">
                <td className="py-2">{member}</td>
                <td className="text-right">{metrics.length}</td>
                <td className="text-right">${metrics.reduce((sum: number, m: any) => sum + m.metric_value, 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
```

---

## 3.8 Implementation Checklist

- [ ] Create migration: `20260213_pipeline_analytics.sql`
- [ ] Create: `src/lib/pipelines.ts`
- [ ] Create: `src/lib/analytics.ts`
- [ ] Create: `src/lib/messaging.ts`
- [ ] Create: `src/components/KanbanBoard.tsx`
- [ ] Create: `src/components/ChannelChat.tsx`
- [ ] Create: `src/pages/AnalyticsDashboard.tsx`
- [ ] Setup: Real-time message subscriptions (Supabase)
- [ ] Setup: Analytics cron job (daily snapshots)
- [ ] Test: Board drag-and-drop
- [ ] Test: Messaging (threads, reactions, mentions)
- [ ] Monitor: Analytics data accuracy

---

**Status**: Ready for Implementation  
**Effort**: 4 weeks (2 developers)  
**Complexity**: Very High
