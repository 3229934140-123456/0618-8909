import { useState } from "react";
import {
  Wrench,
  Package,
  Recycle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Play,
  MapPin,
  User,
  LayoutGrid,
  List,
} from "lucide-react";
import { useStore } from "@/store";
import {
  MAINTENANCE_TYPE_LABELS,
  TASK_STATUS_LABELS,
  URGENCY_LABELS,
} from "@/types";
import type { MaintenanceTask } from "@/types";
import { cn } from "@/lib/utils";

type TabKey = "restock" | "recycle" | "repair" | "all";

const tabs: { key: TabKey; label: string }[] = [
  { key: "restock", label: "补货任务" },
  { key: "recycle", label: "回收充电" },
  { key: "repair", label: "维修任务" },
  { key: "all", label: "全部" },
];

const urgencyColors: Record<MaintenanceTask["urgency"], string> = {
  high: "bg-red-500/20 text-red-400",
  medium: "bg-amber-500/20 text-amber-400",
  low: "bg-slate-500/20 text-slate-400",
};

const typeColors: Record<MaintenanceTask["type"], string> = {
  restock: "bg-teal-500/20 text-teal-400",
  recycle: "bg-blue-500/20 text-blue-400",
  repair: "bg-orange-500/20 text-orange-400",
};

const typeIcons: Record<MaintenanceTask["type"], typeof Wrench> = {
  restock: Package,
  recycle: Recycle,
  repair: Wrench,
};

const columnConfig: {
  status: MaintenanceTask["status"];
  label: string;
  borderColor: string;
  icon: typeof Clock;
}[] = [
  { status: "pending", label: "待处理", borderColor: "border-l-amber-500", icon: Clock },
  { status: "in_progress", label: "进行中", borderColor: "border-l-blue-500", icon: AlertTriangle },
  { status: "completed", label: "已完成", borderColor: "border-l-emerald-500", icon: CheckCircle2 },
];

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

export default function Maintenance() {
  const { maintenanceTasks, updateMaintenanceTask } = useStore();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const filteredTasks = maintenanceTasks.filter((t) =>
    activeTab === "all" ? true : t.type === activeTab
  );

  const pendingCount = maintenanceTasks.filter(
    (t) => t.status === "pending"
  ).length;
  const inProgressCount = maintenanceTasks.filter(
    (t) => t.status === "in_progress"
  ).length;
  const completedTodayCount = maintenanceTasks.filter((t) => {
    if (t.status !== "completed" || !t.completedAt) return false;
    const completed = new Date(t.completedAt);
    const now = new Date();
    return (
      completed.getFullYear() === now.getFullYear() &&
      completed.getMonth() === now.getMonth() &&
      completed.getDate() === now.getDate()
    );
  }).length;

  function handleStartTask(id: string) {
    updateMaintenanceTask(id, { status: "in_progress" });
  }

  function handleCompleteTask(id: string) {
    updateMaintenanceTask(id, {
      status: "completed",
      completedAt: new Date().toISOString(),
    });
  }

  function TaskCard({ task }: { task: MaintenanceTask }) {
    const TypeIcon = typeIcons[task.type];
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
              urgencyColors[task.urgency]
            )}
          >
            {URGENCY_LABELS[task.urgency]}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
              typeColors[task.type]
            )}
          >
            <TypeIcon className="w-3 h-3" />
            {MAINTENANCE_TYPE_LABELS[task.type]}
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-white">{task.locationName}</p>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {task.locationAddress}
          </p>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {task.description}
        </p>
        <div className="flex items-center justify-between text-xs text-slate-500">
          {task.assignee ? (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {task.assignee}
            </span>
          ) : (
            <span>未分配</span>
          )}
          <span>{relativeTime(task.createdAt)}</span>
        </div>
        {task.status === "pending" && (
          <button
            onClick={() => handleStartTask(task.id)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
          >
            <Play className="w-3 h-3" />
            开始处理
          </button>
        )}
        {task.status === "in_progress" && (
          <button
            onClick={() => handleCompleteTask(task.id)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors"
          >
            <CheckCircle2 className="w-3 h-3" />
            完成
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">运维调度</h1>
        <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <button
            onClick={() => setViewMode("kanban")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              viewMode === "kanban"
                ? "bg-teal-600/20 text-teal-400"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            看板
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              viewMode === "list"
                ? "bg-teal-600/20 text-teal-400"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <List className="w-3.5 h-3.5" />
            列表
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/20">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{pendingCount}</p>
            <p className="text-xs text-slate-400">待处理任务</p>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/20">
            <AlertTriangle className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{inProgressCount}</p>
            <p className="text-xs text-slate-400">进行中任务</p>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{completedTodayCount}</p>
            <p className="text-xs text-slate-400">今日已完成</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-teal-600 text-white"
                : "bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-slate-700/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {viewMode === "kanban" ? (
        <div className="grid grid-cols-3 gap-4">
          {columnConfig.map((col) => {
            const colTasks = filteredTasks.filter(
              (t) => t.status === col.status
            );
            const ColIcon = col.icon;
            return (
              <div
                key={col.status}
                className={cn(
                  "border-l-4 rounded-lg bg-slate-900/50 p-4 space-y-4",
                  col.borderColor
                )}
              >
                <div className="flex items-center gap-2">
                  <ColIcon className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-medium text-slate-200">
                    {col.label}
                  </h3>
                  <span className="ml-auto text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {colTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {colTasks.length === 0 && (
                    <p className="text-xs text-slate-600 text-center py-4">
                      暂无任务
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">类型</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">紧急程度</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">地点</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">描述</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">状态</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">负责人</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">创建时间</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => {
                const TypeIcon = typeIcons[task.type];
                return (
                  <tr
                    key={task.id}
                    className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                          typeColors[task.type]
                        )}
                      >
                        <TypeIcon className="w-3 h-3" />
                        {MAINTENANCE_TYPE_LABELS[task.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                          urgencyColors[task.urgency]
                        )}
                      >
                        {URGENCY_LABELS[task.urgency]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-200">{task.locationName}</p>
                      <p className="text-xs text-slate-500">{task.locationAddress}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-slate-300">
                      {task.description}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          task.status === "pending"
                            ? "bg-amber-500/20 text-amber-400"
                            : task.status === "in_progress"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-emerald-500/20 text-emerald-400"
                        )}
                      >
                        {TASK_STATUS_LABELS[task.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {task.assignee || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {relativeTime(task.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {task.status === "pending" && (
                        <button
                          onClick={() => handleStartTask(task.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          开始处理
                        </button>
                      )}
                      {task.status === "in_progress" && (
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          完成
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-600">
                    暂无任务
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
