import { useState } from "react";
import { useStore } from "@/store";
import {
  Settings,
  DollarSign,
  BatteryLow,
  Clock,
  Users,
  Shield,
  Wrench,
  Headphones,
  Save,
  ToggleLeft,
  ToggleRight,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabKey = "billing" | "thresholds" | "accounts";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "billing", label: "计费规则", icon: <DollarSign className="w-4 h-4" /> },
  { key: "thresholds", label: "阈值设置", icon: <Settings className="w-4 h-4" /> },
  { key: "accounts", label: "账户管理", icon: <Users className="w-4 h-4" /> },
];

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  admin: { label: "管理员", color: "bg-teal-500/20 text-teal-400", icon: <Shield className="w-3 h-3" /> },
  operator: { label: "运维人员", color: "bg-blue-500/20 text-blue-400", icon: <Wrench className="w-3 h-3" /> },
  cs: { label: "客服人员", color: "bg-purple-500/20 text-purple-400", icon: <Headphones className="w-3 h-3" /> },
};

function ThresholdGauge({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden mt-2">
      <div
        className={cn("h-full rounded-full transition-all", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function BillingTab() {
  const billingRules = useStore((s) => s.billingRules);
  const updateBillingRule = useStore((s) => s.updateBillingRule);
  const rule = billingRules[0];

  const [freeMinutes, setFreeMinutes] = useState(rule?.freeMinutes ?? 5);
  const [pricePerHour, setPricePerHour] = useState(rule?.pricePerHour ?? 3);
  const [dailyCap, setDailyCap] = useState(rule?.dailyCap ?? 30);

  const hours = 2;
  const chargedMinutes = Math.max(0, hours * 60 - freeMinutes);
  const rawCost = (chargedMinutes / 60) * pricePerHour;
  const previewCost = Math.min(rawCost, dailyCap).toFixed(2);

  const handleSave = () => {
    if (!rule) return;
    updateBillingRule(rule.id, { freeMinutes, pricePerHour, dailyCap });
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-slate-200 font-medium">
          <DollarSign className="w-5 h-5 text-teal-400" />
          当前计费规则
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm text-slate-400">免费时长(分钟)</label>
            <input
              type="number"
              min={0}
              value={freeMinutes}
              onChange={(e) => setFreeMinutes(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-600"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-slate-400">每小时费用(元)</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={pricePerHour}
              onChange={(e) => setPricePerHour(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-600"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-slate-400">日封顶金额(元)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={dailyCap}
              onChange={(e) => setDailyCap(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-600"
            />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 flex items-center gap-3">
          <Calculator className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-sm">
            <span className="text-slate-400">用户借用{hours}小时费用预估: </span>
            <span className="text-amber-400 font-semibold text-base">¥{previewCost}</span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            保存规则
          </button>
        </div>
      </div>
    </div>
  );
}

function ThresholdsTab() {
  const systemThreshold = useStore((s) => s.systemThreshold);
  const updateSystemThreshold = useStore((s) => s.updateSystemThreshold);

  const [lowBattery, setLowBattery] = useState(systemThreshold.lowBatteryThreshold);
  const [lowStock, setLowStock] = useState(systemThreshold.lowStockThreshold);
  const [overdueHours, setOverdueHours] = useState(systemThreshold.overdueReminderHours);

  const handleSave = () => {
    updateSystemThreshold({
      lowBatteryThreshold: lowBattery,
      lowStockThreshold: lowStock,
      overdueReminderHours: overdueHours,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-slate-200 font-medium">
          <Settings className="w-5 h-5 text-teal-400" />
          系统阈值配置
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-400 flex items-center gap-2">
                <BatteryLow className="w-4 h-4 text-red-400" />
                充电宝低电量阈值(%)
              </label>
              <span className="text-sm text-teal-400 font-medium">{lowBattery}%</span>
            </div>
            <input
              type="number"
              min={0}
              max={100}
              value={lowBattery}
              onChange={(e) => setLowBattery(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-600"
            />
            <p className="text-xs text-slate-500">低于此电量的充电宝将标记为需回收充电</p>
            <ThresholdGauge value={lowBattery} max={100} color="bg-red-500" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                库存不足阈值(个)
              </label>
              <span className="text-sm text-teal-400 font-medium">{lowStock}个</span>
            </div>
            <input
              type="number"
              min={0}
              value={lowStock}
              onChange={(e) => setLowStock(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-600"
            />
            <p className="text-xs text-slate-500">点位可用充电宝低于此数量将生成补货任务</p>
            <ThresholdGauge value={lowStock} max={20} color="bg-amber-500" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                逾期提醒(小时)
              </label>
              <span className="text-sm text-teal-400 font-medium">{overdueHours}小时</span>
            </div>
            <input
              type="number"
              min={0}
              value={overdueHours}
              onChange={(e) => setOverdueHours(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-600"
            />
            <p className="text-xs text-slate-500">借用超过此时长未归还将发送提醒</p>
            <ThresholdGauge value={overdueHours} max={24} color="bg-blue-500" />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            保存阈值
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountsTab() {
  const userAccounts = useStore((s) => s.userAccounts);
  const updateUserAccount = useStore((s) => s.updateUserAccount);

  const handleToggle = (id: string, currentStatus: "active" | "disabled") => {
    const next = currentStatus === "active" ? "disabled" : "active";
    updateUserAccount(id, { status: next });
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50 text-slate-400 text-left">
            <th className="px-5 py-3 font-medium">用户名</th>
            <th className="px-5 py-3 font-medium">姓名</th>
            <th className="px-5 py-3 font-medium">角色</th>
            <th className="px-5 py-3 font-medium">手机号</th>
            <th className="px-5 py-3 font-medium">状态</th>
            <th className="px-5 py-3 font-medium">最近登录</th>
            <th className="px-5 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {userAccounts.map((acc) => {
            const role = ROLE_CONFIG[acc.role];
            const isActive = acc.status === "active";
            return (
              <tr
                key={acc.id}
                className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
              >
                <td className="px-5 py-3 text-slate-200 font-mono">{acc.username}</td>
                <td className="px-5 py-3 text-slate-200">{acc.name}</td>
                <td className="px-5 py-3">
                  <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", role.color)}>
                    {role.icon}
                    {role.label}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-300">{acc.phone}</td>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className={cn("w-2 h-2 rounded-full", isActive ? "bg-green-500" : "bg-red-500")} />
                    <span className={isActive ? "text-green-400" : "text-red-400"}>
                      {isActive ? "启用" : "禁用"}
                    </span>
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-400">
                  {new Date(acc.lastLoginAt).toLocaleString("zh-CN", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => handleToggle(acc.id, acc.status)}
                    className={cn(
                      "flex items-center gap-1 text-xs font-medium transition-colors",
                      isActive ? "text-red-400 hover:text-red-300" : "text-teal-400 hover:text-teal-300"
                    )}
                  >
                    {isActive ? (
                      <>
                        <ToggleRight className="w-4 h-4" />
                        禁用
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        启用
                      </>
                    )}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("billing");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">系统设置</h1>
        <p className="text-sm text-slate-400 mt-1">管理计费规则、系统阈值和用户账户</p>
      </div>

      <div className="border-b border-slate-700/50">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.key
                  ? "border-teal-500 text-teal-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "billing" && <BillingTab />}
      {activeTab === "thresholds" && <ThresholdsTab />}
      {activeTab === "accounts" && <AccountsTab />}
    </div>
  );
}
