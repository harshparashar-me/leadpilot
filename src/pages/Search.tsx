import React, { useEffect, useMemo, useState } from "react"
import  Layout  from "../components/Layout"
import {
  Search as SearchIcon,
  Users,
  Building2,
  Contact,
  Home,
  CheckSquare,
  ArrowRight,
  Mic,
  BarChart2,
} from "lucide-react"
import { cn } from "../lib/utils"
import { useNavigate } from "react-router-dom"

// ------------ Mock CRM Data ------------
const DATA = {
  leads: [
    { id: 1, name: "Rohit Sharma", phone: "9876543210", source: "Facebook Ads", city: "Noida" },
    { id: 2, name: "Priya Verma", phone: "9876512345", source: "Google Ads", city: "Gaur City" },
  ],
  contacts: [
    { id: 3, name: "Amit Singh", email: "amit@example.com" },
    { id: 4, name: "Karan Patel", email: "karan@example.com" },
  ],
  accounts: [
    { id: 5, name: "Shivansh Builders", industry: "Real Estate" },
    { id: 6, name: "Sunrise Developers", industry: "Construction" },
  ],
  properties: [
    { id: 7, name: "Elite Homes Tower 5", location: "Noida Ext" },
    { id: 8, name: "Green Valley Block A", location: "Gaur City" },
  ],
  tasks: [
    { id: 9, subject: "Call Vipin", due: "2025-01-12" },
    { id: 10, subject: "Send quotation to Rohit", due: "2025-01-13" },
  ],
}

type CategoryKey = keyof typeof DATA

const categories = [
  { key: "leads" as CategoryKey, label: "Leads", icon: Users, field: "name" },
  { key: "contacts" as CategoryKey, label: "Contacts", icon: Contact, field: "name" },
  { key: "accounts" as CategoryKey, label: "Accounts", icon: Building2, field: "name" },
  { key: "properties" as CategoryKey, label: "Properties", icon: Home, field: "name" },
  { key: "tasks" as CategoryKey, label: "Tasks", icon: CheckSquare, field: "subject" },
]

// ------------ Helpers: Fuzzy Search + Analytics + Suggestions ------------

const normalize = (s: string) => s.toLowerCase().trim()

// Simple Levenshtein edit distance
function editDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  )
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1]
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

// Fuzzy match score: higher is better
function fuzzyScore(target: string, query: string): number {
  const t = normalize(target)
  const q = normalize(query)
  if (!q) return 0
  if (t.includes(q)) return q.length * 2 // strong direct match
  const dist = editDistance(t, q)
  const maxLen = Math.max(t.length, q.length) || 1
  const sim = 1 - dist / maxLen
  return sim * q.length
}

// Analytics in localStorage
const ANALYTICS_KEY = "leadpilot_search_analytics_v1"

interface AnalyticsData {
  history: string[]
  counts: Record<string, number>
}

function loadAnalytics(): AnalyticsData {
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY)
    if (!raw) return { history: [], counts: {} }
    return JSON.parse(raw)
  } catch {
    return { history: [], counts: {} }
  }
}

function saveAnalytics(data: AnalyticsData) {
  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data))
  } catch {}
}

function logSearch(query: string) {
  const q = query.trim()
  if (!q) return
  const data = loadAnalytics()
  // history: recent first, unique
  const newHistory = [q, ...data.history.filter((h) => h !== q)].slice(0, 10)
  const counts = { ...data.counts }
  counts[q] = (counts[q] || 0) + 1
  const updated = { history: newHistory, counts }
  saveAnalytics(updated)
  return updated
}

// AI-style suggestions based on partial query and usage
function getAiSuggestions(query: string, analytics: AnalyticsData): string[] {
  const base = [
    "Leads from Noida",
    "Tasks due today",
    "Accounts in Real Estate",
    "Contacts named Rohit",
    "Properties in Gaur City",
  ]

  const q = normalize(query)

  if (!q) {
    // mix of static + top searched
    const top = Object.entries(analytics.counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k)
    return [...top, ...base].slice(0, 5)
  }

  // context aware pseudo-AI
  const suggestions: string[] = []
  if (q.includes("noida")) suggestions.push("Leads from Noida with status Hot")
  if (q.includes("task") || q.includes("due"))
    suggestions.push("Tasks due this week")
  if (q.includes("lead"))
    suggestions.push("Leads from MagicBricks in last 7 days")
  if (q.includes("property"))
    suggestions.push("Properties in budget 50L–80L in Gaur City")

  return [...suggestions, ...base].slice(0, 5)
}

// ------------ Component ------------

export const Search: React.FC = () => {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [previewItem, setPreviewItem] = useState<any | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData>(() => loadAnalytics())
  const [listening, setListening] = useState(false)

  const navigate = useNavigate()

  // Global hotkeys: Ctrl/⌘+K, L, T, A, P
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()

      if ((e.metaKey || e.ctrlKey) && key === "k") {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => {
          const input = document.getElementById("search-command-input")
          ;(input as HTMLInputElement | null)?.focus()
        }, 10)
      }

      if ((e.metaKey || e.ctrlKey) && key === "l") {
        e.preventDefault()
        navigate("/leads")
      }
      if ((e.metaKey || e.ctrlKey) && key === "t") {
        e.preventDefault()
        navigate("/tasks")
      }
      if ((e.metaKey || e.ctrlKey) && key === "a") {
        e.preventDefault()
        navigate("/accounts")
      }
      if ((e.metaKey || e.ctrlKey) && key === "p") {
        e.preventDefault()
        navigate("/properties")
      }

      if (e.key === "Escape") {
        setOpen(false)
        setPreviewItem(null)
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [navigate])

  // Build grouped & flat results with fuzzy search
  const groupedResults = useMemo(() => {
    if (!query.trim()) return []

    const q = query.trim()
    const groups: any[] = []

    categories.forEach((cat) => {
      const arr = DATA[cat.key] as any[]
      const scored = arr
        .map((item) => ({
          item,
          score: fuzzyScore(JSON.stringify(item), q),
        }))
        .filter((x) => x.score > 0.5) // threshold
        .sort((a, b) => b.score - a.score)

      if (scored.length) {
        groups.push({
          type: cat.label,
          icon: cat.icon,
          key: cat.key,
          items: scored.map((s) => s.item),
        })
      }
    })

    return groups
  }, [query])

  const flatResults = useMemo(
    () =>
      groupedResults.flatMap((g) =>
        g.items.map((item: any) => ({
          ...item,
          _type: g.type,
          _icon: g.icon,
        }))
      ),
    [groupedResults]
  )

  const totalItems = flatResults.length

  // Keyboard navigation INSIDE palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open || !totalItems) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, totalItems - 1))
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      }
      if (e.key === "Enter") {
        e.preventDefault()
        const selected = flatResults[activeIndex]
        if (selected) {
          setPreviewItem(selected)
          const updated = logSearch(query)
          if (updated) setAnalytics(updated)
        }
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, flatResults, activeIndex, totalItems, query])

  // AI-style suggestions
  const aiSuggestions = useMemo(
    () => getAiSuggestions(query, analytics),
    [query, analytics]
  )

  // Voice search
  const handleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert("Voice search not supported in this browser.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "en-IN"
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setQuery(transcript)
      setOpen(true)
      const updated = logSearch(transcript)
      if (updated) setAnalytics(updated)
    }

    recognition.start()
  }

  const hasQuery = query.trim().length > 0

  // Top searched analytics list
  const topSearches = useMemo(
    () =>
      Object.entries(analytics.counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    [analytics]
  )

  return (
    <Layout>
      {/* Top Trigger Bar */}
      <div className="max-w-3xl mx-auto mt-10 space-y-4">
        <button
          onClick={() => setOpen(true)}
          className="w-full bg-white border px-4 py-3 rounded-xl shadow-sm text-left flex items-center gap-2 text-gray-600 hover:bg-gray-50"
        >
          <SearchIcon className="w-5 h-5" />
          <span>Search Leads, Contacts, Accounts, Properties, Tasks…</span>
          <span className="ml-auto text-xs text-gray-400">Ctrl / ⌘ + K</span>
        </button>

        {/* Analytics summary */}
        {analytics.history.length > 0 && (
          <div className="bg-white border rounded-xl shadow-sm p-3 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-800">Search Analytics</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              {topSearches.map(([q, count]) => (
                <span
                  key={q}
                  className="px-2 py-1 rounded-full bg-gray-100 cursor-pointer hover:bg-gray-200"
                  onClick={() => {
                    setQuery(q)
                    setOpen(true)
                  }}
                >
                  {q} • {count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* COMMAND PALETTE OVERLAY */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-20">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border flex overflow-hidden">
            {/* LEFT: Search + List */}
            <div className="w-[55%] border-r p-4 flex flex-col">
              {/* Input + Voice */}
              <div className="relative mb-3 flex items-center">
                <SearchIcon className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  id="search-command-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border bg-gray-50 text-sm focus:bg-white focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search anything… (e.g., Rohit, Shivansh, Noida leads)"
                />
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  className={cn(
                    "absolute right-2 rounded-full p-1.5 border text-gray-500 hover:bg-gray-100",
                    listening && "bg-blue-50 border-blue-400 text-blue-600"
                  )}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              {/* AI Suggestions */}
              <div className="mb-3">
                <p className="text-[11px] text-gray-400 mb-1">AI suggestions</p>
                <div className="flex flex-wrap gap-2">
                  {aiSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setQuery(s)}
                      className="px-2.5 py-1 rounded-full bg-gray-100 text-[11px] text-gray-700 hover:bg-gray-200"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results */}
              <div className="flex-1 min-h-0 overflow-y-auto mt-1">
                {!hasQuery && (
                  <div className="text-xs text-gray-500">
                    Type to search across **Leads, Contacts, Accounts, Properties &
                    Tasks**.  
                    <br />
                    Tip: Try &quot;Leads from Noida&quot; or &quot;Tasks due&quot;.
                  </div>
                )}

                {hasQuery && flatResults.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-10">
                    No results found. Try a different keyword.
                  </div>
                )}

                {hasQuery &&
                  groupedResults.map((group, groupIndex) => {
                    const Icon = group.icon
                    return (
                      <div key={group.key} className="mb-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-1 px-1">
                          <Icon className="w-4 h-4" />
                          {group.type}
                        </div>
                        <div className="space-y-1">
                          {group.items.map((item: any, i: number) => {
                            const flatIndex =
                              groupedResults
                                .slice(0, groupIndex)
                                .reduce(
                                  (acc: number, g: any) => acc + g.items.length,
                                  0
                                ) + i
                            const isActive = flatIndex === activeIndex
                            const title = item.name || item.subject
                            const desc =
                              item.phone ||
                              item.email ||
                              item.industry ||
                              item.location ||
                              item.due ||
                              ""

                            return (
                              <div
                                key={item.id}
                                onClick={() => {
                                  setPreviewItem({
                                    ...item,
                                    _type: group.type,
                                    _icon: group.icon,
                                  })
                                  const updated = logSearch(query)
                                  if (updated) setAnalytics(updated)
                                }}
                                className={cn(
                                  "flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-sm",
                                  isActive
                                    ? "bg-blue-50 text-blue-800"
                                    : "hover:bg-gray-50"
                                )}
                              >
                                <div>
                                  <p className="font-medium truncate">{title}</p>
                                  {desc && (
                                    <p className="text-[11px] text-gray-500 truncate">
                                      {desc}
                                    </p>
                                  )}
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* RIGHT: Preview */}
            <div className="w-[45%] p-5">
              {!previewItem && (
                <div className="h-full flex flex-col items-center justify-center text-sm text-gray-400">
                  Select any result to view details here.
                </div>
              )}

              {previewItem && (
                <div className="space-y-4 h-full overflow-y-auto">
                  <div>
                    <p className="text-xs uppercase text-gray-400">
                      {previewItem._type}
                    </p>
                    <h2 className="text-xl font-semibold">
                      {previewItem.name || previewItem.subject}
                    </h2>
                  </div>

                  <div className="space-y-2 text-sm text-gray-700">
                    {Object.entries(previewItem).map(([key, value]) => {
                      if (key.startsWith("_") || key === "id") return null
                      return (
                        <div key={key} className="flex gap-2">
                          <span className="w-24 text-xs font-semibold text-gray-500 capitalize">
                            {key}
                          </span>
                          <span className="text-sm">{String(value)}</span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="pt-2 border-t mt-4 text-xs text-gray-400">
                    Smart search preview • Future: Open full record page on click
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
