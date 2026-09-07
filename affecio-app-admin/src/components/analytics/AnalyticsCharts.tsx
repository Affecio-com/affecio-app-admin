"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AffecioCard } from "@/components/affecio/AffecioCard";
import type { AnalyticsDashboard } from "@/services/metrics";

const CHART_COLORS = ["#ffffff", "#a3a3a3", "#737373", "#525252", "#404040"];
const PIE_COLORS = ["#ffffff", "#d4d4d4", "#a3a3a3", "#737373", "#525252"];

function formatShortDate(date: string) {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-affecio-border bg-affecio-surface px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 text-affecio-muted">{label ? formatShortDate(String(label)) : ""}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="font-medium text-affecio-text">
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

interface AnalyticsChartsProps {
  data: AnalyticsDashboard;
}

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  const signupData = data.timeSeries.userSignups.map((d) => ({
    ...d,
    label: formatShortDate(d.date),
  }));

  const engagementData = data.timeSeries.userSignups.map((d, i) => ({
    date: d.date,
    label: formatShortDate(d.date),
    signups: d.count,
    matches: data.timeSeries.matches[i]?.count ?? 0,
    swipes: data.timeSeries.swipes[i]?.count ?? 0,
    calls: data.timeSeries.calls[i]?.count ?? 0,
  }));

  const genderData = data.genderBreakdown.map((g) => ({
    name: g.gender,
    value: g.count,
  }));

  const swipeData = data.swipeActions.map((s) => ({
    action: s.action.replace(/_/g, " "),
    count: s.count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <AffecioCard>
          <h2 className="font-mondwest text-lg font-semibold text-affecio-text">User signups (30 days)</h2>
          <p className="mt-1 text-sm text-affecio-muted">Daily new user registrations</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={signupData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#333" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#a3a3a3", fontSize: 11 }}
                  interval="preserveStartEnd"
                  tickLine={false}
                  axisLine={{ stroke: "#333" }}
                />
                <YAxis
                  tick={{ fill: "#a3a3a3", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Signups" fill="#ffffff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AffecioCard>

        <AffecioCard>
          <h2 className="font-mondwest text-lg font-semibold text-affecio-text">Engagement trends</h2>
          <p className="mt-1 text-sm text-affecio-muted">Matches, swipes, and calls over 30 days</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={engagementData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#333" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#a3a3a3", fontSize: 11 }}
                  interval="preserveStartEnd"
                  tickLine={false}
                  axisLine={{ stroke: "#333" }}
                />
                <YAxis
                  tick={{ fill: "#a3a3a3", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#a3a3a3" }} />
                <Line type="monotone" dataKey="matches" name="Matches" stroke="#ffffff" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="swipes" name="Swipes" stroke="#a3a3a3" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="calls" name="Calls" stroke="#737373" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AffecioCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AffecioCard>
          <h2 className="font-mondwest text-lg font-semibold text-affecio-text">Gender breakdown</h2>
          <p className="mt-1 text-sm text-affecio-muted">Distribution of registered users</p>
          <div className="mt-6 h-72">
            {genderData.length === 0 ? (
              <p className="text-sm text-affecio-muted">No user data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={2}
                  >
                    {genderData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#171717",
                      border: "1px solid #333",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: "#a3a3a3" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </AffecioCard>

        <AffecioCard>
          <h2 className="font-mondwest text-lg font-semibold text-affecio-text">Swipe actions</h2>
          <p className="mt-1 text-sm text-affecio-muted">Like, pass, and super like volume</p>
          <div className="mt-6 h-72">
            {swipeData.length === 0 ? (
              <p className="text-sm text-affecio-muted">No swipe data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={swipeData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid stroke="#333" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#a3a3a3", fontSize: 11 }} axisLine={{ stroke: "#333" }} />
                  <YAxis
                    type="category"
                    dataKey="action"
                    tick={{ fill: "#a3a3a3", fontSize: 11 }}
                    width={90}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                    {swipeData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </AffecioCard>
      </div>
    </div>
  );
}
