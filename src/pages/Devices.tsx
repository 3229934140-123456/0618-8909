import { useState } from "react";
import { useStore } from "@/store";
import { CABINET_STATUS_LABELS, POWERBANK_STATUS_LABELS } from "@/types";
import type { Cabinet, PowerBank } from "@/types";
import {
  Search,
  Server,
  Wifi,
  WifiOff,
  AlertCircle,
  Grid3X3,
  List,
  X,
  Battery,
  BatteryLow,
  BatteryCharging,
  BatteryWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "online" | "offline" | "fault";
type ViewMode = "grid" | "list";

const STATUS_BADGE: Record<
  Cabinet["status"],
  { bg: string; text: string; icon: typeof Wifi }
> = {
  online: { bg: "bg-teal-500/15", text: "text-teal-400", icon: Wifi },
  offline: { bg: "bg-slate-500/15", text: "text-slate-400", icon: WifiOff },
  fault: { bg: "bg-red-500/15", text: "text-red-400", icon: AlertCircle },
};

const SLOT_COLORS: Record<PowerBank["status"] | "empty", string> = {
  available: "bg-teal-500/30 border-teal-500/50",
  borrowed: "bg-amber-500/30 border-amber-500/50",
  charging: "bg-blue-500/30 border-blue-500/50",
  needs_recycle: "bg-red-500/30 border-red-500/50",
  fault: "bg-slate-500/30 border-slate-500/50",
  empty: "bg-slate-700/50 border-slate-600/50",
};

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "刚刚";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

function batteryColor(level: number): string {
  if (level > 60) return "text-emerald-400";
  if (level >= 30) return "text-amber-400";
  return "text-red-400";
}

function BatteryIcon({ level }: { level: number }) {
  if (level > 60) return <Battery className={cn("w-4 h-4", batteryColor(level))} />;
  if (level >= 30) return <BatteryWarning className={cn("w-4 h-4", batteryColor(level))} />;
  if (level > 0) return <BatteryLow className={cn("w-4 h-4", batteryColor(level))} />;
  return <BatteryCharging className="w-4 h-4 text-slate-500" />;
}

function StatusBadge({ status }: { status: Cabinet["status"] }) {
  const cfg = STATUS_BADGE[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        cfg.bg,
        cfg.text
      )}
    >
      <Icon className="w-3 h-3" />
      {CABINET_STATUS_LABELS[status]}
    </span>
  );
}

function SlotGrid({ powerBanks, totalSlots }: { powerBanks: PowerBank[]; totalSlots: number }) {
  const slots: (PowerBank | null)[] = [];
  for (let i = 0; i < totalSlots; i++) {
    const pb = powerBanks.find((p) => p.slotIndex === i + 1);
    slots.push(pb ?? null);
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {slots.map((pb, i) => {
        const status = pb ? pb.status : "empty";
        return (
          <div
            key={i}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-lg border p-2 transition-colors",
              SLOT_COLORS[status]
            )}
            title={
              pb
                ? `槽位 ${pb.slotIndex} | ${POWERBANK_STATUS_LABELS[pb.status]} | 电量 ${pb.batteryLevel}%`
                : `槽位 ${i + 1} | 空`
            }
          >
            <span className="text-[10px] text-slate-400 mb-0.5">
              {i + 1}
            </span>
            {pb ? (
              <>
                <BatteryIcon level={pb.batteryLevel} />
                <span
                  className={cn("text-[10px] font-medium mt-0.5", batteryColor(pb.batteryLevel))}
                >
                  {pb.batteryLevel}%
                </span>
              </>
            ) : (
              <span className="text-[10px] text-slate-500">空</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DetailModal({
  cabinet,
  onClose,
}: {
  cabinet: Cabinet;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700/50 bg-slate-900 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-900">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-teal-400" />
            <span className="text-lg font-semibold text-white">
              {cabinet.cabinetNo}
            </span>
            <StatusBadge status={cabinet.status} />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="text-slate-500">点位：</span>
              <span className="text-slate-200">{cabinet.locationName}</span>
            </div>
            <div>
              <span className="text-slate-500">总槽位数：</span>
              <span className="text-slate-200">{cabinet.totalSlots}</span>
            </div>
            <div>
              <span className="text-slate-500">可用数量：</span>
              <span className="text-teal-400 font-medium">{cabinet.availableCount}</span>
            </div>
            <div>
              <span className="text-slate-500">最后心跳：</span>
              <span className="text-slate-200">{formatRelativeTime(cabinet.lastHeartbeat)}</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3">槽位状态</h3>
            <SlotGrid powerBanks={cabinet.powerBanks} totalSlots={cabinet.totalSlots} />
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3">充电宝列表</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-700/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50 bg-slate-800/50">
                    <th className="px-4 py-2.5 text-left font-medium text-slate-400">槽位</th>
                    <th className="px-4 py-2.5 text-left font-medium text-slate-400">ID</th>
                    <th className="px-4 py-2.5 text-left font-medium text-slate-400">状态</th>
                    <th className="px-4 py-2.5 text-left font-medium text-slate-400">电量</th>
                    <th className="px-4 py-2.5 text-left font-medium text-slate-400">最后上报</th>
                  </tr>
                </thead>
                <tbody>
                  {cabinet.powerBanks.map((pb) => (
                    <tr
                      key={pb.id}
                      className="border-b border-slate-700/30 hover:bg-slate-800/30"
                    >
                      <td className="px-4 py-2.5 text-slate-300">#{pb.slotIndex}</td>
                      <td className="px-4 py-2.5 text-slate-300 font-mono text-xs">{pb.id}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                            pb.status === "available" && "bg-teal-500/15 text-teal-400",
                            pb.status === "borrowed" && "bg-amber-500/15 text-amber-400",
                            pb.status === "charging" && "bg-blue-500/15 text-blue-400",
                            pb.status === "needs_recycle" && "bg-red-500/15 text-red-400",
                            pb.status === "fault" && "bg-slate-500/15 text-slate-400"
                          )}
                        >
                          {POWERBANK_STATUS_LABELS[pb.status]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <BatteryIcon level={pb.batteryLevel} />
                          <span className={cn("font-medium", batteryColor(pb.batteryLevel))}>
                            {pb.batteryLevel}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-400">
                        {formatRelativeTime(pb.lastReportTime)}
                      </td>
                    </tr>
                  ))}
                  {cabinet.powerBanks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                        暂无充电宝
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeviceCard({ cabinet, onClick }: { cabinet: Cabinet; onClick: () => void }) {
  const cfg = STATUS_BADGE[cabinet.status];
  const Icon = cfg.icon;
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-slate-700/50 bg-slate-800/50 p-5 transition-all hover:border-slate-600/50 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-slate-900/50"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-teal-400" />
          <h3 className="text-base font-semibold text-white">
            {cabinet.cabinetNo}
          </h3>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
            cfg.bg,
            cfg.text
          )}
        >
          <Icon className="w-3 h-3" />
          {CABINET_STATUS_LABELS[cabinet.status]}
        </span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">点位</span>
          <span className="text-slate-200">{cabinet.locationName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">可用/总数</span>
          <span>
            <span className="text-teal-400 font-medium">{cabinet.availableCount}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-300">{cabinet.totalSlots}</span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">最后心跳</span>
          <span className="text-slate-400">{formatRelativeTime(cabinet.lastHeartbeat)}</span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-700/30">
        <div className="flex gap-1">
          {cabinet.powerBanks.slice(0, 12).map((pb) => (
            <div
              key={pb.id}
              className={cn(
                "w-5 h-5 rounded-sm border",
                SLOT_COLORS[pb.status]
              )}
              title={`${POWERBANK_STATUS_LABELS[pb.status]} ${pb.batteryLevel}%`}
            />
          ))}
          {Array.from({ length: Math.max(0, cabinet.totalSlots - cabinet.powerBanks.length) }).map(
            (_, i) => (
              <div
                key={`empty-${i}`}
                className={cn("w-5 h-5 rounded-sm border", SLOT_COLORS.empty)}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function Devices() {
  const { cabinets, locations } = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedCabinet, setSelectedCabinet] = useState<Cabinet | null>(null);

  const filtered = cabinets.filter((c) => {
    if (search && !c.cabinetNo.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (locationFilter !== "all" && c.locationId !== locationFilter) return false;
    return true;
  });

  const uniqueLocations = locations.filter((l) =>
    cabinets.some((c) => c.locationId === l.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Server className="w-6 h-6 text-teal-400" />
          <h1 className="text-xl font-semibold text-white">设备管理</h1>
          <span className="text-sm text-slate-500">({filtered.length} 台)</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="搜索柜机编号..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-700/50 bg-slate-800/50 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-600/50 focus:ring-1 focus:ring-teal-600/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 rounded-lg border border-slate-700/50 bg-slate-800/50 text-sm text-slate-200 focus:outline-none focus:border-teal-600/50"
          >
            <option value="all">全部状态</option>
            <option value="online">在线</option>
            <option value="offline">离线</option>
            <option value="fault">故障</option>
          </select>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-700/50 bg-slate-800/50 text-sm text-slate-200 focus:outline-none focus:border-teal-600/50"
          >
            <option value="all">全部点位</option>
            {uniqueLocations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          <div className="flex rounded-lg border border-slate-700/50 overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "grid"
                  ? "bg-teal-600/20 text-teal-400"
                  : "bg-slate-800/50 text-slate-400 hover:text-slate-200"
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "list"
                  ? "bg-teal-600/20 text-teal-400"
                  : "bg-slate-800/50 text-slate-400 hover:text-slate-200"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((cabinet) => (
            <DeviceCard
              key={cabinet.id}
              cabinet={cabinet}
              onClick={() => setSelectedCabinet(cabinet)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-500">
              未找到匹配的设备
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/50">
                <th className="px-4 py-3 text-left font-medium text-slate-400">柜机编号</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">点位</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">状态</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">总槽位</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">可用</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">最后心跳</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cabinet) => (
                <tr
                  key={cabinet.id}
                  className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-teal-400" />
                      <span className="font-medium text-white">{cabinet.cabinetNo}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{cabinet.locationName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={cabinet.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-300">{cabinet.totalSlots}</td>
                  <td className="px-4 py-3 text-teal-400 font-medium">{cabinet.availableCount}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {formatRelativeTime(cabinet.lastHeartbeat)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedCabinet(cabinet)}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-teal-600/15 text-teal-400 hover:bg-teal-600/25 transition-colors"
                    >
                      详情
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                    未找到匹配的设备
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedCabinet && (
        <DetailModal
          cabinet={selectedCabinet}
          onClose={() => setSelectedCabinet(null)}
        />
      )}
    </div>
  );
}
