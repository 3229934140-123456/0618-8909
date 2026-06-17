import { useState, useMemo } from "react";
import { useStore } from "@/store";
import { trendData, monthlyTrendData } from "@/mocks/data";
import { LOCATION_TYPE_LABELS } from "@/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Server,
  Wifi,
  ArrowLeftRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Crown,
  Medal,
  Award,
} from "lucide-react";

export default function Dashboard() {
  const { cabinets, rentalRecords, locations } = useStore();
  const [trendRange, setTrendRange] = useState<"7d" | "30d">("7d");

  const totalSlots = useMemo(
    () => cabinets.reduce((sum, c) => sum + c.totalSlots, 0),
    [cabinets]
  );

  const onlineDevices = useMemo(
    () => cabinets.filter((c) => c.status === "online").length,
    [cabinets]
  );

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const todayBorrows = useMemo(
    () =>
      rentalRecords.filter((r) => r.borrowTime.slice(0, 10) === todayStr)
        .length,
    [rentalRecords, todayStr]
  );

  const todayIncome = useMemo(
    () =>
      rentalRecords
        .filter(
          (r) =>
            r.status === "returned" &&
            r.returnTime &&
            r.returnTime.slice(0, 10) === todayStr
        )
        .reduce((sum, r) => sum + (r.fee ?? 0), 0),
    [rentalRecords, todayStr]
  );

  const rankedLocations = useMemo(
    () => [...locations].sort((a, b) => b.borrowRate - a.borrowRate),
    [locations]
  );

  const faultLocations = useMemo(
    () => locations.filter((l) => l.faultRate > 0.05),
    [locations]
  );

  const chartData = trendRange === "7d" ? trendData : monthlyTrendData;

  const rankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-gray-300" />;
    if (rank === 3) return <Award className="w-4 h-4 text-amber-600" />;
    return <span className="text-slate-400 text-sm">{rank}</span>;
  };

  const stats = [
    {
      label: "设备总数",
      value: totalSlots,
      icon: <Server className="w-5 h-5" />,
      change: 12.5,
    },
    {
      label: "在线设备",
      value: onlineDevices,
      icon: <Wifi className="w-5 h-5" />,
      change: 3.2,
    },
    {
      label: "今日借出",
      value: todayBorrows,
      icon: <ArrowLeftRight className="w-5 h-5" />,
      change: -5.8,
    },
    {
      label: "今日收入",
      value: `¥${todayIncome.toFixed(0)}`,
      icon: <DollarSign className="w-5 h-5" />,
      change: 8.4,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-4 gap-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 flex items-center gap-4"
          >
            <div className="p-3 rounded-lg bg-teal-900/40 text-teal-400">
              {s.icon}
            </div>
            <div className="flex-1">
              <p className="text-slate-400 text-sm">{s.label}</p>
              <p className="text-2xl font-bold text-white font-mono tabular-nums">
                {s.value}
              </p>
            </div>
            <div
              className={`flex items-center gap-1 text-sm ${s.change >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {s.change >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {Math.abs(s.change)}%
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">趋势概览</h2>
          <div className="flex gap-1 bg-slate-900/60 rounded-lg p-1">
            <button
              onClick={() => setTrendRange("7d")}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${trendRange === "7d" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              近7天
            </button>
            <button
              onClick={() => setTrendRange("30d")}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${trendRange === "30d" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              近30天
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gradBorrows" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0f766e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: 8,
                color: "#e2e8f0",
              }}
            />
            <Legend
              wrapperStyle={{ color: "#94a3b8" }}
              formatter={(v) => (v === "borrows" ? "借出次数" : "收入(元)")}
            />
            <Area
              type="monotone"
              dataKey="borrows"
              stroke="#0f766e"
              fill="url(#gradBorrows)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#f59e0b"
              fill="url(#gradIncome)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">场地排名</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700/50">
                <th className="text-left py-2 px-3">排名</th>
                <th className="text-left py-2 px-3">名称</th>
                <th className="text-left py-2 px-3">类型</th>
                <th className="text-right py-2 px-3">借用率</th>
                <th className="text-right py-2 px-3">日收入</th>
                <th className="text-right py-2 px-3">故障率</th>
              </tr>
            </thead>
            <tbody>
              {rankedLocations.map((loc, i) => (
                <tr
                  key={loc.id}
                  className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                >
                  <td className="py-2.5 px-3">{rankBadge(i + 1)}</td>
                  <td className="py-2.5 px-3 text-white">{loc.name}</td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {LOCATION_TYPE_LABELS[loc.type]}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-teal-400">
                    {(loc.borrowRate * 100).toFixed(0)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-white">
                    ¥{loc.dailyIncome}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-mono tabular-nums ${loc.faultRate > 0.05 ? "text-red-400 font-semibold" : "text-slate-400"}`}
                  >
                    {(loc.faultRate * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            故障率预警
          </h2>
          {faultLocations.length === 0 ? (
            <p className="text-slate-500 text-sm">暂无预警</p>
          ) : (
            <div className="space-y-3">
              {faultLocations.map((loc) => (
                <div
                  key={loc.id}
                  className="bg-red-950/30 border border-red-800/40 rounded-lg p-4"
                >
                  <p className="text-white font-medium text-sm">{loc.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-slate-400 text-xs">
                      {LOCATION_TYPE_LABELS[loc.type]}
                    </span>
                    <span className="text-red-400 font-mono tabular-nums font-bold text-sm">
                      故障率 {(loc.faultRate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${Math.min(loc.faultRate * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
