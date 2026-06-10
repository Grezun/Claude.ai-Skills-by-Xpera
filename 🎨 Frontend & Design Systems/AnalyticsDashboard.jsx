import { useState } from "react";

// ─── Inline sparkline SVG (no external chart lib needed) ─────────────────────
function Sparkline({ data, color = "#6366f1", filled = false }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 40;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * h,
  }));
  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `M${pts[0].x},${h} ` + pts.map((p) => `L${p.x},${p.y}`).join(" ") + ` L${pts[pts.length - 1].x},${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
      {filled && (
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {filled && (
        <path d={area} fill={`url(#grad-${color.replace("#", "")})`} />
      )}
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Bar chart (weekly revenue) ──────────────────────────────────────────────
function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value));
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="flex items-end gap-2 h-40 w-full">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const isToday = i === data.length - 1;
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 group">
            <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
              ${(d.value / 1000).toFixed(1)}k
            </span>
            <div className="w-full relative rounded-t-md overflow-hidden" style={{ height: "120px" }}>
              <div
                className={`absolute bottom-0 w-full rounded-t-md transition-all duration-500 ${
                  isToday
                    ? "bg-gradient-to-t from-indigo-600 to-indigo-400"
                    : "bg-slate-700 group-hover:bg-slate-600"
                }`}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${isToday ? "text-indigo-400" : "text-slate-500"}`}>
              {days[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Metric card ─────────────────────────────────────────────────────────────
function MetricCard({ label, value, change, changeLabel, sparkData, color, icon }) {
  const isPositive = change >= 0;
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 flex flex-col gap-3 hover:border-slate-600/60 transition-colors backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full mb-0.5 ${
            isPositive
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-red-500/15 text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}{change}% {changeLabel}
        </span>
      </div>
      <Sparkline data={sparkData} color={color} filled />
    </div>
  );
}

// ─── Activity item ────────────────────────────────────────────────────────────
function ActivityItem({ avatar, name, action, target, time, type }) {
  const typeStyles = {
    sale: "bg-emerald-500/15 text-emerald-400",
    signup: "bg-indigo-500/15 text-indigo-400",
    refund: "bg-red-500/15 text-red-400",
    upgrade: "bg-amber-500/15 text-amber-400",
  };
  const typeLabels = {
    sale: "Sale",
    signup: "New user",
    refund: "Refund",
    upgrade: "Upgrade",
  };
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-700/40 last:border-0 group">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ring-1 ring-slate-600">
        {avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate">
          <span className="font-semibold text-white">{name}</span>{" "}
          <span className="text-slate-400">{action}</span>{" "}
          <span className="text-slate-300 font-medium">{target}</span>
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{time}</p>
      </div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${typeStyles[type]}`}>
        {typeLabels[type]}
      </span>
    </div>
  );
}

// ─── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ segments }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let offset = 0;
  const R = 42;
  const circ = 2 * Math.PI * R;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#1e293b" strokeWidth="14" />
        {segments.map((seg, i) => {
          const dash = (seg.value / total) * circ;
          const gap = circ - dash;
          const el = (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              className="transition-all duration-700"
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="flex flex-col gap-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-slate-400">{seg.label}</span>
            <span className="text-xs font-semibold text-white ml-auto pl-3">
              {Math.round((seg.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Static demo data ─────────────────────────────────────────────────────────
const METRICS = [
  {
    label: "Total Revenue",
    value: "$84,291",
    change: 12.4,
    changeLabel: "vs last mo.",
    sparkData: [22, 28, 24, 35, 30, 42, 38, 51, 46, 58, 54, 67],
    color: "#6366f1",
    icon: "💰",
  },
  {
    label: "Active Users",
    value: "12,847",
    change: 8.1,
    changeLabel: "vs last mo.",
    sparkData: [40, 44, 38, 47, 52, 48, 60, 57, 63, 59, 68, 72],
    color: "#10b981",
    icon: "👥",
  },
  {
    label: "Conversion Rate",
    value: "3.68%",
    change: -1.2,
    changeLabel: "vs last mo.",
    sparkData: [4.1, 3.9, 4.2, 3.8, 3.6, 3.9, 3.7, 4.0, 3.5, 3.7, 3.6, 3.68],
    color: "#f59e0b",
    icon: "📈",
  },
  {
    label: "Avg. Order Value",
    value: "$127.40",
    change: 5.3,
    changeLabel: "vs last mo.",
    sparkData: [105, 112, 108, 118, 114, 122, 119, 125, 121, 128, 124, 127],
    color: "#ec4899",
    icon: "🛒",
  },
];

const WEEKLY_REVENUE = [
  { value: 9800 },
  { value: 11200 },
  { value: 10500 },
  { value: 13400 },
  { value: 12100 },
  { value: 8900 },
  { value: 14700 },
];

const ACTIVITY = [
  { avatar: "JK", name: "Jordan Kim", action: "purchased", target: "Pro Plan — Annual", time: "2 min ago", type: "sale" },
  { avatar: "MS", name: "Maya Singh", action: "signed up via", target: "Google Ads", time: "11 min ago", type: "signup" },
  { avatar: "AL", name: "Alex Lee", action: "upgraded to", target: "Enterprise", time: "34 min ago", type: "upgrade" },
  { avatar: "RC", name: "Ryan Chen", action: "requested refund for", target: "Starter Plan", time: "1 hr ago", type: "refund" },
  { avatar: "EP", name: "Elena Park", action: "purchased", target: "Starter Plan — Monthly", time: "2 hr ago", type: "sale" },
  { avatar: "TW", name: "Tom Walsh", action: "signed up via", target: "Organic Search", time: "3 hr ago", type: "signup" },
];

const TRAFFIC_SOURCES = [
  { label: "Organic Search", value: 42, color: "#6366f1" },
  { label: "Paid Ads", value: 28, color: "#10b981" },
  { label: "Direct", value: 18, color: "#f59e0b" },
  { label: "Referral", value: 12, color: "#ec4899" },
];

// ─── Date range tabs ──────────────────────────────────────────────────────────
const RANGES = ["7D", "30D", "90D", "1Y"];

// ─── Main dashboard component ─────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const [activeRange, setActiveRange] = useState("7D");

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-sm text-slate-400 mt-0.5">Monday, 10 June 2026 — real-time overview</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date range selector */}
          <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1 gap-1">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setActiveRange(r)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  activeRange === r
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors shadow-sm">
            Export
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {METRICS.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* Middle row: Bar chart + Traffic sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Weekly Revenue bar chart */}
        <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-white">Weekly Revenue</h2>
              <p className="text-xs text-slate-400 mt-0.5">Total this week: <span className="text-emerald-400 font-semibold">$80,600</span></p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
              +18.2% vs last week
            </span>
          </div>
          <BarChart data={WEEKLY_REVENUE} />
        </div>

        {/* Traffic sources donut */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-white">Traffic Sources</h2>
            <p className="text-xs text-slate-400 mt-0.5">Breakdown for selected period</p>
          </div>
          <DonutChart segments={TRAFFIC_SOURCES} />
          <div className="mt-5 pt-4 border-t border-slate-700/40 flex justify-between text-center">
            <div>
              <p className="text-lg font-bold text-white">24.3k</p>
              <p className="text-xs text-slate-400">Sessions</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">1m 42s</p>
              <p className="text-xs text-slate-400">Avg. Duration</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">61.4%</p>
              <p className="text-xs text-slate-400">Bounce Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Activity feed + Top pages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent activity */}
        <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Recent Activity</h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest customer events</p>
            </div>
            <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              View all →
            </button>
          </div>
          <div>
            {ACTIVITY.map((a, i) => (
              <ActivityItem key={i} {...a} />
            ))}
          </div>
        </div>

        {/* Top pages */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">Top Pages</h2>
            <p className="text-xs text-slate-400 mt-0.5">By unique visitors</p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { path: "/pricing", visitors: 4821, pct: 100 },
              { path: "/features", visitors: 3654, pct: 76 },
              { path: "/", visitors: 3102, pct: 64 },
              { path: "/blog/guide", visitors: 2190, pct: 45 },
              { path: "/docs", visitors: 1847, pct: 38 },
              { path: "/changelog", visitors: 1203, pct: 25 },
            ].map((page, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-mono truncate">{page.path}</span>
                  <span className="text-slate-400 flex-shrink-0 ml-2">{page.visitors.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-700"
                    style={{ width: `${page.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-700/40">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Total page views</span>
              <span className="text-white font-semibold">38,204</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
