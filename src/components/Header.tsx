import { useLocation } from "react-router-dom";

const routeLabels: Record<string, string> = {
  dashboard: "数据看板",
  locations: "点位管理",
  devices: "设备管理",
  rentals: "借还记录",
  maintenance: "运维调度",
  tickets: "工单系统",
  settings: "系统设置",
};

export default function Header() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const currentLabel = routeLabels[segments[0]] || "数据看板";

  return (
    <header className="sticky top-0 z-10 h-14 flex items-center justify-between px-6 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-500">首页</span>
        <span className="text-slate-600">/</span>
        <span className="text-slate-200 font-medium">{currentLabel}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-xs text-white font-medium">
            管
          </div>
          <span className="text-sm text-slate-300">管理员</span>
        </div>
      </div>
    </header>
  );
}
