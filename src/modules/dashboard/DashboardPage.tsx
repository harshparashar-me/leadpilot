import React, { useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout'
import { motion, Reorder } from 'framer-motion'
import {
  Users,
  TrendingUp,
  DollarSign,
  Phone,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Target,
  BarChart3,
  Calendar
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import { getTeamActivityFeed } from '../../lib/activityAudit'
import { useNavigate } from 'react-router-dom'
import { DashboardCustomizer, type WidgetId } from './DashboardCustomizer'
import { Settings } from 'lucide-react'

type Trend = 'up' | 'down'

const StatCard: React.FC<{
  title: string
  value: string
  change: string
  trend: Trend
  icon: React.ComponentType<{ className?: string }>
  accent: string
  progress?: number
}> = ({ title, value, change, trend, icon: Icon, accent, progress = 0 }) => {
  return (
    <motion.div
      className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition-all"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
        </div>
        <div className={cn('p-2 rounded-lg', accent)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'flex items-center text-xs font-semibold',
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            )}
          >
            {trend === 'up' ? (
              <ArrowUpRight className="h-3 w-3 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 mr-1" />
            )}
            {change}
          </span>
          <span className="text-xs text-gray-400">vs last month</span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(Math.max(progress, 0), 100)}%`,
              background:
                trend === 'up'
                  ? 'linear-gradient(90deg, #22c55e, #10b981)'
                  : 'linear-gradient(90deg, #ef4444, #f97316)',
            }}
          />
        </div>
      </div>
    </motion.div>
  )
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()

  const [leadCount, setLeadCount] = useState<number>(0)
  const [activeDealsCount, setActiveDealsCount] = useState<number>(0)
  const [closedRevenue, setClosedRevenue] = useState<number>(0)
  const [callsTodayCount, setCallsTodayCount] = useState<number>(0)
  const [dealStatuses, setDealStatuses] = useState<Record<string, number>>({})
  const [activities, setActivities] = useState<
    Array<{
      id: string | number
      action: string
      user?: { id?: string; email?: string; name?: string }
      created_at?: string
      notes?: string
      changes?: Record<string, { old: unknown; new: unknown }>
    }>
  >([])
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true)
  const [loadingActivity, setLoadingActivity] = useState<boolean>(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d'>('today')
  const [goals, setGoals] = useState<{ leadsNew: number; followUps: number; dealsClosed: number }>({
    leadsNew: 0,
    followUps: 0,
    dealsClosed: 0,
  })

  const formatCurrencyShort = (value: number) => {
    if (value >= 1_00_00_000) return `₹ ${(value / 1_00_00_000).toFixed(1)}Cr`
    if (value >= 1_00_000) return `₹ ${(value / 1_00_000).toFixed(1)}L`
    return `₹ ${value.toLocaleString()}`
  }

  const stats = useMemo(
    () => [
      {
        title: 'Total Leads',
        value: leadCount.toLocaleString(),
        change: '—',
        trend: 'up' as Trend,
        icon: Users,
        accent: 'bg-blue-100 text-blue-600',
        progress: Math.min(100, Math.round((leadCount % 100) || 0)),
      },
      {
        title: 'Active Deals',
        value: activeDealsCount.toLocaleString(),
        change: '—',
        trend: 'up' as Trend,
        icon: TrendingUp,
        accent: 'bg-green-100 text-green-600',
        progress: Math.min(100, Math.round((activeDealsCount % 100) || 0)),
      },
      {
        title: 'Revenue',
        value: formatCurrencyShort(closedRevenue),
        change: '—',
        trend: closedRevenue >= 0 ? ('up' as Trend) : ('down' as Trend),
        icon: DollarSign,
        accent: 'bg-purple-100 text-purple-600',
        progress: Math.min(100, Math.round(((closedRevenue % 100000) / 1000) || 0)),
      },
      {
        title: 'Calls Today',
        value: callsTodayCount.toLocaleString(),
        change: '—',
        trend: 'up' as Trend,
        icon: Phone,
        accent: 'bg-orange-100 text-orange-600',
        progress: Math.min(100, Math.round((callsTodayCount % 100) || 0)),
      },
    ],
    [leadCount, activeDealsCount, closedRevenue, callsTodayCount]
  )

  const pipelineStages = useMemo(
    () => [
      { label: 'New', value: dealStatuses['New'] || 0, color: 'bg-blue-500' },
      { label: 'Qualified', value: dealStatuses['Qualified'] || 0, color: 'bg-violet-500' },
      { label: 'Proposal Sent', value: dealStatuses['Proposal Sent'] || 0, color: 'bg-indigo-500' },
      { label: 'Negotiation', value: dealStatuses['Negotiation'] || 0, color: 'bg-fuchsia-500' },
      { label: 'Closed Won', value: dealStatuses['Closed Won'] || 0, color: 'bg-emerald-500' },
    ],
    [dealStatuses]
  )

  const totalPipeline = pipelineStages.reduce((a, b) => a + b.value, 0)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoadingMetrics(true)
        const { count: leadsCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
        setLeadCount(leadsCount || 0)

        const { data: deals } = await supabase
          .from('deals')
          .select('status, amount')

        const statusCounts: Record<string, number> = {}
        let active = 0
        let revenue = 0
        const dealRows = (deals ?? []) as Array<{ status?: string; amount?: number | null }>
        dealRows.forEach((d) => {
          const s = d.status ?? ''
          const amt = typeof d.amount === 'number' ? d.amount : 0
          statusCounts[s] = (statusCounts[s] || 0) + 1
          if (s !== 'Closed Won' && s !== 'Closed Lost') active += 1
          if (s === 'Closed Won') revenue += amt
        })
        setDealStatuses(statusCounts)
        setActiveDealsCount(active)
        setClosedRevenue(revenue)

        const end = new Date()
        const start = new Date()
        if (timeframe === 'today') {
          start.setHours(0, 0, 0, 0)
          end.setHours(23, 59, 59, 999)
        } else if (timeframe === '7d') {
          start.setDate(end.getDate() - 7)
        } else {
          start.setDate(end.getDate() - 30)
        }
        const { count: callsCount } = await supabase
          .from('call_logs')
          .select('*', { count: 'exact', head: true })
          .gte('call_time', start.toISOString())
          .lt('call_time', end.toISOString())
        setCallsTodayCount(callsCount || 0)

        const { count: newLeads } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', start.toISOString())
          .lt('created_at', end.toISOString())
          ;

        const { count: followUpsDone } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .gte('closed_time', start.toISOString())
          .lt('closed_time', end.toISOString())

        const { count: dealsClosedCount } = await supabase
          .from('deals')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Closed Won')
          .gte('created_at', start.toISOString())
          .lt('created_at', end.toISOString())

        setGoals({
          leadsNew: newLeads || 0,
          followUps: followUpsDone || 0,
          dealsClosed: dealsClosedCount || 0,
        })
      } catch {
        setErrorMsg('Failed to load metrics')
      }
      finally {
        setLoadingMetrics(false)
      }
    }

    const fetchActivity = async () => {
      try {
        setLoadingActivity(true)
        setErrorMsg('') // Clear any previous errors
        const itemCount = Number(((widgetSettings['recent_activity'] as Record<string, unknown> || {}).itemCount as number) || 5)
        const data = await getTeamActivityFeed(itemCount)
        const raw = (data ?? []) as Array<Record<string, unknown>>
        
        // Filter by timeframe
        const filtered = raw.filter((a) => {
          const created = typeof a.created_at === 'string' ? new Date(a.created_at) : null
          if (!created) return true
          const now = new Date()
          const start = new Date()
          if (timeframe === 'today') {
            start.setHours(0, 0, 0, 0)
            return created >= start && created <= now
          }
          if (timeframe === '7d') {
            start.setDate(now.getDate() - 7)
            return created >= start
          }
          start.setDate(now.getDate() - 30)
          return created >= start
        })
        
        setActivities(filtered.map((a) => ({
          id: (typeof a.id === 'string' || typeof a.id === 'number') ? a.id : String(Date.now()),
          action: typeof a.action === 'string' ? a.action : 'updated',
          user: a.user as { id?: string; email?: string; name?: string } | undefined,
          created_at: typeof a.created_at === 'string' ? a.created_at : undefined,
          notes: typeof a.notes === 'string' ? a.notes : undefined,
          changes: a.changes as Record<string, { old: unknown; new: unknown }> | undefined,
        })))
      } catch (err: any) {
        console.error('Error fetching activity:', err)
        // Only show error if it's a real error, not just empty data
        if (err?.message && !err.message.includes('No rows')) {
          setErrorMsg('Failed to load activity')
        } else {
          setErrorMsg('') // Clear error if it's just empty data
          setActivities([])
        }
      }
      finally {
        setLoadingActivity(false)
      }
    }

    fetchMetrics()
    fetchActivity()
  }, [timeframe])

  // WIDGET VISIBILITY STATE
  const [visibleWidgets, setVisibleWidgets] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('dashboard_widgets');
    return saved ? JSON.parse(saved) : {
      stats_overview: true,
      pipeline_chart: true,
      goal_tracker: true,
      recent_activity: true,
      quick_actions: true,
      deal_filters: true,
      top_agents: true,
      kpi_custom: false
    };
  });

  type WidgetSize = 'sm' | 'md' | 'lg'
  const sizeDefaults: Record<string, WidgetSize> = {
    stats_overview: 'md',
    pipeline_chart: 'md',
    goal_tracker: 'md',
    recent_activity: 'md',
    quick_actions: 'md',
    deal_filters: 'md',
    top_agents: 'md',
  }
  const [widgetSizes, setWidgetSizes] = useState<Record<string, WidgetSize>>(() => {
    const saved = localStorage.getItem('dashboard_widget_sizes')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Record<string, WidgetSize>
        return { ...sizeDefaults, ...parsed }
      } catch {
        return sizeDefaults
      }
    }
    return sizeDefaults
  })
  const [widgetSettings, setWidgetSettings] = useState<Record<string, unknown>>(() => {
    const saved = localStorage.getItem('dashboard_widget_settings')
    if (saved) {
      try {
        return JSON.parse(saved) as Record<string, unknown>
      } catch {
        return {}
      }
    }
    return {}
  })
  const [sharedWithTeam, setSharedWithTeam] = useState<boolean>(() => {
    const saved = localStorage.getItem('dashboard_shared_team')
    return saved ? saved === 'true' : false
  })
  type LayoutSource = 'personal' | 'team'
  const [layoutSource, setLayoutSource] = useState<LayoutSource>('personal')
  const sizeClass = (id: string) => {
    const sz = widgetSizes[id] || 'md'
    if (sz === 'sm') return 'p-4'
    if (sz === 'lg') return 'p-8'
    return 'p-6'
  }
  const setSize = (id: string, sz: WidgetSize) => {
    setWidgetSizes(prev => {
      const next = { ...prev, [id]: sz }
      localStorage.setItem('dashboard_widget_sizes', JSON.stringify(next))
      return next
    })
    saveDashboardConfigDebounced()
  }
  const setSetting = (id: string, key: string, value: unknown) => {
    setWidgetSettings(prev => {
      const next = { ...prev, [id]: { ...(prev[id] as Record<string, unknown> || {}), [key]: value } }
      localStorage.setItem('dashboard_widget_settings', JSON.stringify(next))
      return next
    })
    saveDashboardConfigDebounced()
  }

  const defaultRightOrder = ['quick_actions', 'deal_filters', 'top_agents', 'kpi_custom']
  const [rightOrder, setRightOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('dashboard_order_right')
    const base = defaultRightOrder.filter((w) => (visibleWidgets as Record<string, boolean>)[w])
    if (!saved) return base
    try {
      const parsed = JSON.parse(saved) as string[]
      return parsed.filter((w) => (visibleWidgets as Record<string, boolean>)[w])
    } catch {
      return base
    }
  })

  const defaultStatOrder = ['lead', 'active', 'revenue', 'calls']
  const [statOrder, setStatOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('dashboard_order_stats')
    if (!saved) return defaultStatOrder
    try {
      const parsed = JSON.parse(saved) as string[]
      return parsed
    } catch {
      return defaultStatOrder
    }
  })

  const toggleWidget = (id: WidgetId) => {
    setVisibleWidgets(prev => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem('dashboard_widgets', JSON.stringify(next));
      const updatedRight = rightOrder.filter((w) => (next as Record<string, boolean>)[w])
      const mergedRight = defaultRightOrder.filter((w) => next[w]).reduce<string[]>((acc, w) => {
        if (!updatedRight.includes(w)) acc.push(w)
        return acc
      }, [...updatedRight])
      setRightOrder(mergedRight)
      localStorage.setItem('dashboard_order_right', JSON.stringify(mergedRight))
      return next;
    });
    saveDashboardConfigDebounced()
  };

  const resetLayout = () => {
    localStorage.removeItem('dashboard_order_right')
    localStorage.removeItem('dashboard_order_stats')
    setRightOrder(defaultRightOrder.filter((w) => (visibleWidgets as Record<string, boolean>)[w]))
    setStatOrder(defaultStatOrder)
    setWidgetSizes(sizeDefaults)
    localStorage.setItem('dashboard_widget_sizes', JSON.stringify(sizeDefaults))
    saveDashboardConfigDebounced()
  }

  const buildConfig = () => ({
    visibleWidgets,
    rightOrder,
    statOrder,
    widgetSizes,
    widgetSettings,
    sharedWithTeam
  })

  const saveDashboardConfig = async () => {
    try {
      const user = await supabase.auth.getUser()
      const userId = user.data.user?.id
      if (!userId) return
      const payload = { user_id: userId, config: buildConfig() }
      const { data: existing } = await supabase
        .from('dashboard_layouts')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
      if (existing && existing.length > 0) {
        await supabase.from('dashboard_layouts').update({ config: buildConfig() }).eq('user_id', userId)
      } else {
        await supabase.from('dashboard_layouts').insert(payload)
      }
    } catch {
    }
  }
  let saveTimeout: number | undefined
  const saveDashboardConfigDebounced = () => {
    if (saveTimeout) window.clearTimeout(saveTimeout)
    saveTimeout = window.setTimeout(() => {
      saveDashboardConfig()
    }, 500)
  }
  useEffect(() => {
    const load = async () => {
      try {
        const user = await supabase.auth.getUser()
        const userId = user.data.user?.id
        if (!userId) return
        let data
        if (layoutSource === 'personal') {
          const res = await supabase.from('dashboard_layouts').select('*').eq('user_id', userId).limit(1)
          data = res.data
        } else {
          const res = await supabase.from('dashboard_layouts').select('*').contains('config', { sharedWithTeam: true }).limit(1)
          data = res.data
        }
        const row = data && data[0] as { config?: unknown } | undefined
        const cfg = (row?.config || null) as {
          visibleWidgets?: Record<string, boolean>
          rightOrder?: string[]
          statOrder?: string[]
          widgetSizes?: Record<string, WidgetSize>
          widgetSettings?: Record<string, unknown>
          sharedWithTeam?: boolean
        } | null
        if (cfg) {
          if (cfg.visibleWidgets) setVisibleWidgets(cfg.visibleWidgets)
          if (cfg.rightOrder) setRightOrder(cfg.rightOrder)
          if (cfg.statOrder) setStatOrder(cfg.statOrder)
          if (cfg.widgetSizes) setWidgetSizes({ ...sizeDefaults, ...cfg.widgetSizes })
          if (cfg.widgetSettings) setWidgetSettings(cfg.widgetSettings)
          if (typeof cfg.sharedWithTeam === 'boolean') {
            setSharedWithTeam(cfg.sharedWithTeam)
            localStorage.setItem('dashboard_shared_team', String(cfg.sharedWithTeam))
          }
        }
      } catch {
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutSource])
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm">Daily overview and pipeline insights</p>
          </div>
          <div className="flex items-center gap-2">
            <DashboardCustomizer visibleWidgets={visibleWidgets as Record<WidgetId, boolean>} onToggleWidget={toggleWidget} />
            <button
              onClick={resetLayout}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
            >
              Reset
            </button>
            <button
              onClick={() => {
                const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
                  visibleWidgets,
                  rightOrder,
                  statOrder,
                  widgetSizes,
                  widgetSettings
                }))
                const a = document.createElement('a')
                a.setAttribute('href', dataStr)
                a.setAttribute('download', 'dashboard_layout.json')
                document.body.appendChild(a)
                a.click()
                a.remove()
              }}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
            >
              Export
            </button>
            <select
              value={layoutSource}
              onChange={(e) => {
                const v = e.target.value as LayoutSource
                setLayoutSource(v)
              }}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
              aria-label="Layout scope"
            >
              <option value="personal">Personal</option>
              <option value="team">Team</option>
            </select>
            <label className="relative overflow-hidden">
              <input
                type="file"
                accept="application/json"
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    try {
                      const cfg = JSON.parse(String(reader.result)) as {
                        visibleWidgets?: Record<string, boolean>
                        rightOrder?: string[]
                        statOrder?: string[]
                        widgetSizes?: Record<string, WidgetSize>
                        widgetSettings?: Record<string, unknown>
                      }
                      if (cfg.visibleWidgets) setVisibleWidgets(cfg.visibleWidgets)
                      if (cfg.rightOrder) setRightOrder(cfg.rightOrder || [])
                      if (cfg.statOrder) setStatOrder(cfg.statOrder || [])
                      if (cfg.widgetSizes) setWidgetSizes({ ...sizeDefaults, ...cfg.widgetSizes })
                      if (cfg.widgetSettings) setWidgetSettings(cfg.widgetSettings || {})
                      saveDashboardConfigDebounced()
                    } catch {
                    }
                  }
                  reader.readAsText(file)
                }}
              />
              <span className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm">
                Import
              </span>
            </label>
            <button
              onClick={() => {
                setSharedWithTeam(prev => {
                  const next = !prev
                  localStorage.setItem('dashboard_shared_team', String(next))
                  saveDashboardConfigDebounced()
                  return next
                })
              }}
              className={cn("flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors shadow-sm", sharedWithTeam ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900")}
              aria-pressed={sharedWithTeam}
            >
              {sharedWithTeam ? "Team Shared" : "Share to Team"}
            </button>
            <button
              onClick={() => {
                const text = JSON.stringify({
                  visibleWidgets,
                  rightOrder,
                  statOrder,
                  widgetSizes,
                  widgetSettings
                })
                navigator.clipboard.writeText(text)
                saveDashboardConfigDebounced()
              }}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
            >
              Share
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full border">
              <Calendar className="h-3.5 w-3.5" />
              {new Date().toLocaleDateString()}
            </div>
            {/* 
            <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full border">
              Last: {new Date().toLocaleTimeString()}
            </span>
            */}
          </div>
        </div>

        {/* 1. STATS OVERVIEW */}
        {visibleWidgets.stats_overview && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {loadingMetrics ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`bg-white ${sizeClass('stats_overview')} rounded-xl shadow-sm border animate-pulse`}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="h-3 w-24 bg-gray-200 rounded" />
                        <div className="h-6 w-32 bg-gray-200 rounded" />
                      </div>
                      <div className="h-8 w-8 bg-gray-200 rounded-lg" />
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-3 w-28 bg-gray-200 rounded" />
                      <div className="h-2 w-full bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Reorder.Group
                axis="x"
                values={statOrder}
                onReorder={(newOrder) => {
                  setStatOrder(newOrder as string[])
                  localStorage.setItem('dashboard_order_stats', JSON.stringify(newOrder))
                  saveDashboardConfigDebounced()
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {statOrder.map((key) => {
                  const map: Record<string, number> = { lead: 0, active: 1, revenue: 2, calls: 3 }
                  const s = stats[map[key]]
                  return (
                    <Reorder.Item key={key} value={key} className="contents">
                      <div className={`bg-white ${sizeClass('stats_overview')} rounded-xl shadow-sm border`}>
                        <div className="flex items-center justify-end gap-2 mb-2">
                          <select
                            value={widgetSizes['stats_overview']}
                            onChange={(e) => setSize('stats_overview', e.target.value as WidgetSize)}
                            className="text-xs border rounded px-2 py-1 bg-white"
                          >
                            <option value="sm">S</option>
                            <option value="md">M</option>
                            <option value="lg">L</option>
                          </select>
                        </div>
                        <StatCard
                          title={s.title}
                          value={s.value}
                          change={s.change}
                          trend={s.trend}
                          icon={s.icon}
                          accent={s.accent}
                          progress={s.progress}
                        />
                      </div>
                    </Reorder.Item>
                  )
                })}
              </Reorder.Group>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 2. PIPELINE CHART */}
          {visibleWidgets.pipeline_chart && (
            <div className={`lg:col-span-2 bg-white rounded-xl shadow-sm border ${sizeClass('pipeline_chart')} animate-in fade-in slide-in-from-bottom-5 duration-500`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-gray-500" />
                  Pipeline Overview
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-gray-500">Total</span>
                  <span className="text-xs font-semibold text-gray-900">{totalPipeline}</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={widgetSizes['pipeline_chart']}
                    onChange={(e) => setSize('pipeline_chart', e.target.value as WidgetSize)}
                    className="text-xs border rounded px-2 py-1 bg-white"
                  >
                    <option value="sm">S</option>
                    <option value="md">M</option>
                    <option value="lg">L</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="flex h-full">
                    {pipelineStages.map((stg, idx) => (
                      <div
                        key={idx}
                        className={cn('h-full', stg.color)}
                        style={{ width: `${(stg.value / totalPipeline) * 100}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {pipelineStages.map((stg, idx) => (
                    <div key={idx} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <span className={cn('h-2 w-2 rounded-full', stg.color)} />
                        <span className="text-xs text-gray-600">{stg.label}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-900">{stg.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. GOAL TRACKER */}
          {visibleWidgets.goal_tracker && (
            <div className={`bg-white rounded-xl shadow-sm border ${sizeClass('goal_tracker')} animate-in fade-in slide-in-from-bottom-6 duration-500`}>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-500" /> Goals
              </h3>
              <div className="flex items-center justify-end gap-2 mb-2">
                <select
                  value={widgetSizes['goal_tracker']}
                  onChange={(e) => setSize('goal_tracker', e.target.value as WidgetSize)}
                  className="text-xs border rounded px-2 py-1 bg-white"
                >
                  <option value="sm">S</option>
                  <option value="md">M</option>
                  <option value="lg">L</option>
                </select>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'New leads', value: goals.leadsNew, total: timeframe === 'today' ? 50 : timeframe === '7d' ? 250 : 1200, color: 'bg-blue-500' },
                  { label: 'Follow-ups', value: goals.followUps, total: timeframe === 'today' ? 30 : timeframe === '7d' ? 150 : 600, color: 'bg-orange-500' },
                  { label: 'Deals closed', value: goals.dealsClosed, total: timeframe === 'today' ? 10 : timeframe === '7d' ? 30 : 120, color: 'bg-emerald-500' },
                ].map((g, i) => {
                  const pct = Math.min(100, Math.round((g.value / g.total) * 100))
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{g.label}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {g.value}/{g.total}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full', g.color)} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 4. RECENT ACTIVITY */}
          {visibleWidgets.recent_activity && (
            <div className={`lg:col-span-2 bg-white rounded-xl shadow-sm border ${sizeClass('recent_activity')} animate-in fade-in slide-in-from-bottom-7 duration-500`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" /> Recent Activity
                </h3>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as 'today' | '7d' | '30d')}
                  className="text-xs border rounded px-2 py-1 bg-white"
                  aria-label="Activity timeframe"
                >
                  <option value="today">Today</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
                <div className="flex items-center gap-2">
                  <select
                    value={widgetSizes['recent_activity']}
                    onChange={(e) => setSize('recent_activity', e.target.value as WidgetSize)}
                    className="text-xs border rounded px-2 py-1 bg-white"
                  >
                    <option value="sm">S</option>
                    <option value="md">M</option>
                    <option value="lg">L</option>
                  </select>
                  <div className="flex items-center gap-1">
                    <Settings className="h-4 w-4 text-gray-500" />
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={Number(((widgetSettings['recent_activity'] as Record<string, unknown> || {}).itemCount as number) || 5)}
                      onChange={(e) => setSetting('recent_activity', 'itemCount', Number(e.target.value))}
                      className="w-16 text-xs border rounded px-2 py-1 bg-white"
                      aria-label="Activity count"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                {loadingActivity ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-gray-200 ring-4 ring-gray-100" />
                        <div className="w-px h-full bg-gray-100 mt-2" />
                      </div>
                      <div className="pb-4 flex-1">
                        <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
                        <div className="h-3 w-32 bg-gray-200 rounded" />
                      </div>
                    </div>
                  ))
                ) : activities.length === 0 ? (
                  <div className="text-sm text-gray-500">No recent activity</div>
                ) : (
                  activities.map((a) => (
                    <div key={a.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-50" />
                        <div className="w-px h-full bg-gray-100 mt-2" />
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium text-gray-800">
                          {a.user?.name || a.user?.email || 'User'} {a.action}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <Reorder.Group
              axis="y"
              values={rightOrder}
              onReorder={(newOrder) => {
                const filtered = (newOrder as string[]).filter((w) => (visibleWidgets as Record<string, boolean>)[w])
                setRightOrder(filtered)
                localStorage.setItem('dashboard_order_right', JSON.stringify(filtered))
              }}
              className="space-y-6"
            >
              {rightOrder.map((w) => {
                if (!(visibleWidgets as Record<string, boolean>)[w]) return null
                if (w === 'quick_actions') {
                  return (
                    <Reorder.Item key={w} value={w} className="contents">
                      <div className={`bg-white rounded-xl shadow-sm border ${sizeClass('quick_actions')} animate-in fade-in slide-in-from-bottom-8 duration-500`}>
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-gray-500" /> Quick Actions
                        </h3>
                        <div className="flex items-center justify-end gap-2 mb-2">
                          <select
                            value={widgetSizes['quick_actions']}
                            onChange={(e) => setSize('quick_actions', e.target.value as WidgetSize)}
                            className="text-xs border rounded px-2 py-1 bg-white"
                          >
                            <option value="sm">S</option>
                            <option value="md">M</option>
                            <option value="lg">L</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => navigate('/leads')}
                            className="p-3 border rounded-lg text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition text-center"
                          >
                            + Add Lead
                          </button>
                          <button
                            onClick={() => navigate('/tasks')}
                            className="p-3 border rounded-lg text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition text-center"
                          >
                            + Task
                          </button>
                          <button
                            onClick={() => navigate('/call-logs')}
                            className="p-3 border rounded-lg text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition text-center"
                          >
                            Log Call
                          </button>
                          <button
                            onClick={() => navigate('/analytics')}
                            className="p-3 border rounded-lg text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition text-center"
                          >
                            Reports
                          </button>
                        </div>
                      </div>
                    </Reorder.Item>
                  )
                }
                if (w === 'deal_filters') {
                  return (
                    <Reorder.Item key={w} value={w} className="contents">
                      <div className={`bg-white rounded-xl shadow-sm border ${sizeClass('deal_filters')} animate-in fade-in slide-in-from-bottom-9 duration-500`}>
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-gray-500" /> Deal Status
                        </h3>
                        <div className="flex items-center justify-end gap-2 mb-2">
                          <select
                            value={widgetSizes['deal_filters']}
                            onChange={(e) => setSize('deal_filters', e.target.value as WidgetSize)}
                            className="text-xs border rounded px-2 py-1 bg-white"
                          >
                            <option value="sm">S</option>
                            <option value="md">M</option>
                            <option value="lg">L</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {['New', 'Qualified', 'Proposal Sent', 'Negotiation', 'Closed Won'].map((s) => (
                            <button
                              key={s}
                              onClick={() => navigate(`/deals?status=${encodeURIComponent(s)}`)}
                              className="px-3 py-2 text-xs border rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition text-left truncate"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </Reorder.Item>
                  )
                }
                if (w === 'top_agents') {
                  return (
                    <Reorder.Item key={w} value={w} className="contents">
                      <div className={`bg-white rounded-xl shadow-sm border ${sizeClass('top_agents')} animate-in fade-in slide-in-from-bottom-10 duration-500`}>
                        <h3 className="font-semibold text-gray-900 mb-4">Top Agents</h3>
                        <MiniLeaderboard timeframe={timeframe} />
                      </div>
                    </Reorder.Item>
                  )
                }
                if (w === 'kpi_custom') {
                  const cfg = (widgetSettings['kpi_custom'] as Record<string, unknown>) || {}
                  const label = String(cfg['label'] || 'Custom KPI')
                  const value = Number(cfg['value'] || 0)
                  return (
                    <Reorder.Item key={w} value={w} className="contents">
                      <div className={`bg-white rounded-xl shadow-sm border ${sizeClass('kpi_custom')} animate-in fade-in slide-in-from-bottom-10 duration-500`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{label}</h3>
                          <select
                            value={widgetSizes['kpi_custom']}
                            onChange={(e) => setSize('kpi_custom', e.target.value as WidgetSize)}
                            className="text-xs border rounded px-2 py-1 bg-white"
                          >
                            <option value="sm">S</option>
                            <option value="md">M</option>
                            <option value="lg">L</option>
                          </select>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{value}</div>
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Label"
                            value={label}
                            onChange={(e) => setSetting('kpi_custom', 'label', e.target.value)}
                            className="flex-1 text-xs border rounded px-2 py-1 bg-white"
                          />
                          <input
                            type="number"
                            placeholder="Value"
                            value={value}
                            onChange={(e) => setSetting('kpi_custom', 'value', Number(e.target.value))}
                            className="w-24 text-xs border rounded px-2 py-1 bg-white"
                          />
                        </div>
                      </div>
                    </Reorder.Item>
                  )
                }
                return null
              })}
            </Reorder.Group>
          </div>
        </div>

        

        {errorMsg && (
          <div className="fixed bottom-4 right-4 bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-2 shadow-sm">
            {errorMsg}
          </div>
        )}
      </div>
    </Layout>
  )
}


const MiniLeaderboard: React.FC<{ timeframe: 'today' | '7d' | '30d' }> = ({ timeframe }) => {
  const [leaders, setLeaders] = useState<Array<{ name: string; wins: number; calls: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaders = async () => {
      setLoading(true)
      try {
        const end = new Date()
        const start = new Date()
        if (timeframe === 'today') {
          start.setHours(0, 0, 0, 0)
          end.setHours(23, 59, 59, 999)
        } else if (timeframe === '7d') {
          start.setDate(end.getDate() - 7)
        } else {
          start.setDate(end.getDate() - 30)
        }

        const { data: deals } = await supabase
          .from('deals')
          .select('assigned_to, status, created_at')
          .eq('status', 'Closed Won')
          .gte('created_at', start.toISOString())
          .lt('created_at', end.toISOString())

        const { data: calls } = await supabase
          .from('call_logs')
          .select('assigned_to, call_time')
          .gte('call_time', start.toISOString())
          .lt('call_time', end.toISOString())
          ;

        const winsByAgent: Record<string, number> = {} as Record<string, number>
        (deals ?? []).forEach((d) => {
          const owner = (d as { assigned_to?: string }).assigned_to || 'Unassigned'
          winsByAgent[owner] = (winsByAgent[owner] || 0) + 1
        })

        const callsByAgent: Record<string, number> = {} as Record<string, number>
        (calls ?? []).forEach((c) => {
          const owner = (c as { assigned_to?: string }).assigned_to || 'Unassigned'
          callsByAgent[owner] = (callsByAgent[owner] || 0) + 1
        })

        const merged = Object.keys({ ...winsByAgent, ...callsByAgent }).map((name) => ({
          name,
          wins: winsByAgent[name] || 0,
          calls: callsByAgent[name] || 0,
        }))

        merged.sort((a, b) => b.wins - a.wins || b.calls - a.calls)
        setLeaders(merged.slice(0, 5))
      } finally {
        setLoading(false)
      }
    }
    fetchLeaders()
  }, [timeframe])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-3">
            <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (leaders.length === 0) {
    return <div className="text-sm text-gray-500">No leaderboard data</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {leaders.map((l) => (
        <div key={l.name} className="border rounded-lg p-3">
          <div className="text-sm font-semibold text-gray-900">{l.name}</div>
          <div className="text-xs text-gray-600 mt-1">Wins: {l.wins} • Calls: {l.calls}</div>
        </div>
      ))}
    </div>
  )
}
