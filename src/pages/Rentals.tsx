import { useState } from "react";
import { useStore } from "@/store";
import { RENTAL_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/types";
import type { RentalRecord } from "@/types";
import {
  Search,
  Filter,
  Clock,
  DollarSign,
  User,
  MapPin,
  ArrowRight,
  X,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | RentalRecord["status"];
type PaymentFilter = "all" | RentalRecord["paymentStatus"];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDuration(minutes?: number): string {
  if (minutes == null) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

const STATUS_COLORS: Record<RentalRecord["status"], string> = {
  borrowed: "bg-teal-500/20 text-teal-400",
  returned: "bg-emerald-500/20 text-emerald-400",
  overdue: "bg-red-500/20 text-red-400",
  abnormal: "bg-orange-500/20 text-orange-400",
};

const PAYMENT_COLORS: Record<RentalRecord["paymentStatus"], string> = {
  paid: "bg-emerald-500/20 text-emerald-400",
  unpaid: "bg-red-500/20 text-red-400",
  refunded: "bg-blue-500/20 text-blue-400",
};

export default function Rentals() {
  const rentalRecords = useStore((s) => s.rentalRecords);
  const billingRules = useStore((s) => s.billingRules);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<RentalRecord | null>(null);

  const freeMinutes = billingRules[0]?.freeMinutes ?? 5;
  const pricePerHour = billingRules[0]?.pricePerHour ?? 3;

  const filtered = rentalRecords.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.userName.toLowerCase().includes(q) &&
        !r.userPhone.includes(q)
      )
        return false;
    }
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (paymentFilter !== "all" && r.paymentStatus !== paymentFilter)
      return false;
    if (dateFrom) {
      const from = new Date(dateFrom);
      if (new Date(r.borrowTime) < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (new Date(r.borrowTime) > to) return false;
    }
    return true;
  });

  const chargedMinutes =
    selected?.duration != null
      ? Math.max(0, selected.duration - freeMinutes)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">借还记录</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-900 p-4 border border-slate-700/50">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索用户名 / 手机号"
            className="w-full rounded-lg bg-slate-800 border border-slate-700/50 pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg bg-slate-800 border border-slate-700/50 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-600"
          >
            <option value="all">全部状态</option>
            {Object.entries(RENTAL_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-slate-500" />
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
            className="rounded-lg bg-slate-800 border border-slate-700/50 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-600"
          >
            <option value="all">全部支付</option>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-700/50 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-600"
          />
          <span className="text-slate-500 text-sm">至</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-700/50 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-600"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-700/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900 text-slate-400">
              <th className="text-left px-4 py-3 font-medium">ID</th>
              <th className="text-left px-4 py-3 font-medium">用户</th>
              <th className="text-left px-4 py-3 font-medium">手机号</th>
              <th className="text-left px-4 py-3 font-medium">借出点位</th>
              <th className="text-left px-4 py-3 font-medium">借出时间</th>
              <th className="text-left px-4 py-3 font-medium">归还点位</th>
              <th className="text-left px-4 py-3 font-medium">归还时间</th>
              <th className="text-left px-4 py-3 font-medium">时长</th>
              <th className="text-left px-4 py-3 font-medium">费用</th>
              <th className="text-left px-4 py-3 font-medium">状态</th>
              <th className="text-left px-4 py-3 font-medium">支付状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {filtered.map((r) => (
              <tr
                key={r.id}
                onClick={() => setSelected(r)}
                className="cursor-pointer hover:bg-slate-800/50 transition-colors"
              >
                <td className="px-4 py-3 text-slate-400 font-mono">
                  {r.id.length > 10 ? r.id.slice(0, 10) + "…" : r.id}
                </td>
                <td className="px-4 py-3 text-slate-200">{r.userName}</td>
                <td className="px-4 py-3 text-slate-400 font-mono">
                  {r.userPhone}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {r.borrowLocationName}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {formatDate(r.borrowTime)}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {r.returnLocationName ?? "-"}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {r.returnTime ? formatDate(r.returnTime) : "-"}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {formatDuration(r.duration)}
                </td>
                <td className="px-4 py-3 font-mono text-amber-400">
                  {r.fee != null ? `¥${r.fee.toFixed(2)}` : "-"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                      STATUS_COLORS[r.status]
                    )}
                  >
                    {RENTAL_STATUS_LABELS[r.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                      PAYMENT_COLORS[r.paymentStatus]
                    )}
                  >
                    {PAYMENT_STATUS_LABELS[r.paymentStatus]}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  暂无匹配记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/50 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">借还详情</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="rounded-lg bg-slate-800/50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-teal-400 text-sm font-medium">
                  <User className="w-4 h-4" />
                  用户信息
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">姓名</span>
                    <p className="text-slate-200 mt-0.5">
                      {selected.userName}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">手机号</span>
                    <p className="text-slate-200 font-mono mt-0.5">
                      {selected.userPhone}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">用户ID</span>
                    <p className="text-slate-400 font-mono mt-0.5">
                      {selected.userId}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-slate-800/50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-teal-400 text-sm font-medium">
                  <MapPin className="w-4 h-4" />
                  借出信息
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">借出点位</span>
                    <p className="text-slate-200 mt-0.5">
                      {selected.borrowLocationName}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">借出时间</span>
                    <p className="text-slate-200 mt-0.5">
                      {formatDate(selected.borrowTime)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-slate-800/50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-teal-400 text-sm font-medium">
                  <MapPin className="w-4 h-4" />
                  归还信息
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">归还点位</span>
                    <p className="text-slate-200 mt-0.5">
                      {selected.returnLocationName ?? "未归还"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">归还时间</span>
                    <p className="text-slate-200 mt-0.5">
                      {selected.returnTime
                        ? formatDate(selected.returnTime)
                        : "未归还"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-slate-800/50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                  <DollarSign className="w-4 h-4" />
                  费用明细
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">免费时长</span>
                    <p className="text-slate-200 mt-0.5">{freeMinutes} 分钟</p>
                  </div>
                  <div>
                    <span className="text-slate-500">计费时长</span>
                    <p className="text-slate-200 mt-0.5">
                      {formatDuration(chargedMinutes)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">单价</span>
                    <p className="text-slate-200 mt-0.5">
                      ¥{pricePerHour}/小时
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">总费用</span>
                    <p className="font-mono text-amber-400 text-base mt-0.5">
                      {selected.fee != null
                        ? `¥${selected.fee.toFixed(2)}`
                        : "-"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">支付状态</span>
                    <p className="mt-0.5">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                          PAYMENT_COLORS[selected.paymentStatus]
                        )}
                      >
                        {PAYMENT_STATUS_LABELS[selected.paymentStatus]}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-slate-800/50 p-4">
                <div className="flex items-center gap-2 text-teal-400 text-sm font-medium mb-4">
                  <Clock className="w-4 h-4" />
                  状态时间线
                </div>
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-[9px] top-2 bottom-2 w-px bg-slate-700" />

                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-[18px] h-[18px] rounded-full bg-teal-500/20 border-2 border-teal-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-200">借出充电宝</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {selected.borrowLocationName} ·{" "}
                        {formatDate(selected.borrowTime)}
                      </p>
                    </div>
                  </div>

                  {selected.status === "overdue" && (
                    <div className="relative">
                      <div className="absolute -left-6 top-0.5 w-[18px] h-[18px] rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
                        <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                      </div>
                      <div className="text-sm">
                        <p className="text-red-400">逾期未还</p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          超过规定时间未归还
                        </p>
                      </div>
                    </div>
                  )}

                  {selected.status === "abnormal" && (
                    <div className="relative">
                      <div className="absolute -left-6 top-0.5 w-[18px] h-[18px] rounded-full bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center">
                        <AlertTriangle className="w-2.5 h-2.5 text-orange-400" />
                      </div>
                      <div className="text-sm">
                        <p className="text-orange-400">异常记录</p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          借还过程存在异常
                        </p>
                      </div>
                    </div>
                  )}

                  {selected.returnTime && (
                    <div className="relative">
                      <div className="absolute -left-6 top-0.5 w-[18px] h-[18px] rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                      </div>
                      <div className="text-sm">
                        <p className="text-slate-200">归还充电宝</p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {selected.returnLocationName} ·{" "}
                          {formatDate(selected.returnTime)}
                        </p>
                      </div>
                    </div>
                  )}

                  {!selected.returnTime &&
                    selected.status === "borrowed" && (
                      <div className="relative">
                        <div className="absolute -left-6 top-0.5 w-[18px] h-[18px] rounded-full bg-slate-600/30 border-2 border-slate-600 flex items-center justify-center">
                          <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                        </div>
                        <div className="text-sm">
                          <p className="text-slate-500">等待归还</p>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
