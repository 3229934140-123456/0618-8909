import { useState, Fragment } from "react";
import { useStore } from "@/store";
import { LOCATION_TYPE_LABELS, CABINET_STATUS_LABELS } from "@/types";
import type { Location, Cabinet } from "@/types";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  MapPin,
  Filter,
  Eye,
  Edit,
  X,
  Building2,
  UtensilsCrossed,
  Landmark,
  Hotel,
  Train,
  MoreHorizontal,
  Trash2,
  Check,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

const TYPE_OPTIONS = [
  { value: "all", label: "全部类型" },
  { value: "mall", label: "商场" },
  { value: "restaurant", label: "餐厅" },
  { value: "scenic", label: "景区" },
  { value: "hotel", label: "酒店" },
  { value: "transport", label: "交通枢纽" },
  { value: "other", label: "其他" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "全部状态" },
  { value: "active", label: "运营中" },
  { value: "inactive", label: "已停用" },
  { value: "maintenance", label: "维护中" },
];

const TYPE_BADGE: Record<Location["type"], string> = {
  mall: "bg-teal-500/15 text-teal-400",
  restaurant: "bg-amber-500/15 text-amber-400",
  scenic: "bg-emerald-500/15 text-emerald-400",
  hotel: "bg-purple-500/15 text-purple-400",
  transport: "bg-blue-500/15 text-blue-400",
  other: "bg-slate-500/15 text-slate-400",
};

const TYPE_ICON: Record<Location["type"], React.ElementType> = {
  mall: Building2,
  restaurant: UtensilsCrossed,
  scenic: Landmark,
  hotel: Hotel,
  transport: Train,
  other: MoreHorizontal,
};

const STATUS_DOT: Record<Location["status"], string> = {
  active: "bg-green-500",
  inactive: "bg-slate-500",
  maintenance: "bg-yellow-500",
};

const STATUS_LABEL: Record<Location["status"], string> = {
  active: "运营中",
  inactive: "已停用",
  maintenance: "维护中",
};

function BorrowRateBar({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100);
  let barColor = "bg-teal-500";
  if (pct >= 90) barColor = "bg-red-500";
  else if (pct >= 75) barColor = "bg-amber-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-400">{pct}%</span>
    </div>
  );
}

interface FormState {
  name: string;
  type: Location["type"];
  address: string;
  businessHours: string;
  longitude: string;
  latitude: string;
  cabinetNo: string;
  slotCount: number;
}

const emptyForm: FormState = {
  name: "",
  type: "mall",
  address: "",
  businessHours: "",
  longitude: "",
  latitude: "",
  cabinetNo: "",
  slotCount: 12,
};

export default function Locations() {
  const { locations, cabinets, addLocationWithCabinets, addCabinetToLocation, updateCabinetWithSlots, deleteCabinet } = useStore();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = locations.filter((loc) => {
    if (search && !loc.name.includes(search) && !loc.address.includes(search))
      return false;
    if (typeFilter !== "all" && loc.type !== typeFilter) return false;
    if (statusFilter !== "all" && loc.status !== statusFilter) return false;
    return true;
  });

  const handleSave = () => {
    if (!form.name.trim() || !form.cabinetNo.trim()) return;
    addLocationWithCabinets(
      {
        id: `loc-${Date.now()}`,
        name: form.name.trim(),
        type: form.type,
        address: form.address.trim(),
        businessHours: form.businessHours.trim(),
        longitude: Number(form.longitude) || 0,
        latitude: Number(form.latitude) || 0,
        cabinetCount: 0,
        totalSlots: 0,
        availablePowerBanks: 0,
        borrowRate: 0,
        dailyIncome: 0,
        faultRate: 0,
        status: "active",
        createdAt: new Date().toISOString().slice(0, 10),
      },
      form.cabinetNo.trim(),
      Number(form.slotCount) || 12
    );
    setForm(emptyForm);
    setDrawerOpen(false);
  };

  const toggleDetail = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const expandedLoc = expandedId
    ? locations.find((l) => l.id === expandedId)
    : null;
  const expandedCabinets = expandedId
    ? cabinets.filter((c) => c.locationId === expandedId)
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-400" />
            点位管理
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            管理所有充电宝租借点位信息
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索点位名称或地址"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="pl-9 pr-8 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white appearance-none focus:outline-none focus:border-teal-500"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white appearance-none focus:outline-none focus:border-teal-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => setDrawerOpen(true)}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增点位
        </button>
      </div>

      <div className="rounded-xl border border-slate-700/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/60 text-slate-400 text-left">
              <th className="px-4 py-3 font-medium">点位名称</th>
              <th className="px-4 py-3 font-medium">类型</th>
              <th className="px-4 py-3 font-medium">地址</th>
              <th className="px-4 py-3 font-medium text-center">柜机数</th>
              <th className="px-4 py-3 font-medium text-center">可用/总槽位</th>
              <th className="px-4 py-3 font-medium">借用率</th>
              <th className="px-4 py-3 font-medium text-right">日收入</th>
              <th className="px-4 py-3 font-medium text-center">故障率</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {filtered.map((loc) => {
              const Icon = TYPE_ICON[loc.type];
              return (
                <Fragment key={loc.id}>
                  <tr
                    className="hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-white font-medium">
                        <Icon className="w-4 h-4 text-slate-500" />
                        {loc.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_BADGE[loc.type]}`}
                      >
                        {LOCATION_TYPE_LABELS[loc.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">
                      {loc.address}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-300">
                      {loc.cabinetCount}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-300">
                      <span className="text-teal-400">
                        {loc.availablePowerBanks}
                      </span>
                      <span className="text-slate-600"> / </span>
                      <span>{loc.totalSlots}</span>
                    </td>
                    <td className="px-4 py-3">
                      <BorrowRateBar rate={loc.borrowRate} />
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      ¥{loc.dailyIncome.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-300">
                      {(loc.faultRate * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${STATUS_DOT[loc.status]}`}
                        />
                        <span className="text-slate-400">
                          {STATUS_LABEL[loc.status]}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => toggleDetail(loc.id)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-teal-400 hover:bg-slate-700/50 transition-colors"
                          title="查看"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-700/50 transition-colors"
                          title="编辑"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === loc.id && (
                    <tr>
                      <td colSpan={10} className="px-0 py-0">
                        <DetailPanel
                          location={loc}
                          cabinets={cabinets.filter(
                            (c) => c.locationId === loc.id
                          )}
                          onClose={() => setExpandedId(null)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  暂无匹配的点位数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-[480px] bg-slate-900 border-l border-slate-700/50 z-50 shadow-2xl transform transition-transform duration-300">
            <div className="flex items-center justify-between px-6 h-16 border-b border-slate-700/50">
              <h2 className="text-lg font-semibold text-white">新增点位</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto" style={{ maxHeight: "calc(100vh - 130px)" }}>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  点位名称
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="请输入点位名称"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  点位类型
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      type: e.target.value as Location["type"],
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-teal-500 appearance-none"
                >
                  {TYPE_OPTIONS.filter((o) => o.value !== "all").map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  地址
                </label>
                <input
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder="请输入详细地址"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  营业时间
                </label>
                <input
                  value={form.businessHours}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, businessHours: e.target.value }))
                  }
                  placeholder="如 10:00-22:00"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    经度
                  </label>
                  <input
                    value={form.longitude}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, longitude: e.target.value }))
                    }
                    placeholder="116.3972"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    纬度
                  </label>
                  <input
                    value={form.latitude}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, latitude: e.target.value }))
                    }
                    placeholder="39.9169"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div className="border-t border-slate-700/50 pt-4">
                <h3 className="text-sm font-medium text-teal-400 mb-3">设备信息</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      柜机编号
                    </label>
                    <input
                      value={form.cabinetNo}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, cabinetNo: e.target.value }))
                      }
                      placeholder="如 BJ-NEW-001"
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      充电宝数量
                    </label>
                    <input
                      type="number"
                      value={form.slotCount}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, slotCount: Number(e.target.value) || 12 }))
                      }
                      min={1}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t border-slate-700/50 flex items-center gap-3 bg-slate-900">
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
              >
                保存
              </button>
              <button
                onClick={() => setDrawerOpen(false)}
                className="px-5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DetailPanel({
  location,
  cabinets,
  onClose,
}: {
  location: Location;
  cabinets: Cabinet[];
  onClose: () => void;
}) {
  const { addCabinetToLocation, updateCabinetWithSlots, deleteCabinet } = useStore();

  const [addingCabinet, setAddingCabinet] = useState(false);
  const [newCabinetNo, setNewCabinetNo] = useState("");
  const [newSlotCount, setNewSlotCount] = useState(12);

  const [editingCabinetId, setEditingCabinetId] = useState<string | null>(null);
  const [editCabinetNo, setEditCabinetNo] = useState("");
  const [editCabinetStatus, setEditCabinetStatus] = useState<Cabinet["status"]>("online");
  const [editTotalSlots, setEditTotalSlots] = useState(0);
  const [editPowerBankCount, setEditPowerBankCount] = useState(0);
  const [saveMessage, setSaveMessage] = useState<{ type: "info" | "warning" | "success"; text: string } | null>(null);

  const Icon = TYPE_ICON[location.type];

  const handleAddCabinet = () => {
    if (!newCabinetNo.trim()) return;
    addCabinetToLocation(location.id, newCabinetNo.trim(), Number(newSlotCount) || 12);
    setNewCabinetNo("");
    setNewSlotCount(12);
    setAddingCabinet(false);
  };

  const startEdit = (cab: Cabinet) => {
    setEditingCabinetId(cab.id);
    setEditCabinetNo(cab.cabinetNo);
    setEditCabinetStatus(cab.status);
    setEditTotalSlots(cab.totalSlots);
    setEditPowerBankCount(cab.powerBanks.length);
  };

  const cancelEdit = () => {
    setEditingCabinetId(null);
    setEditCabinetNo("");
    setEditCabinetStatus("online");
    setEditTotalSlots(0);
    setEditPowerBankCount(0);
  };

  const saveEdit = () => {
    if (!editCabinetNo.trim() || !editingCabinetId) return;
    const result = updateCabinetWithSlots(editingCabinetId, {
      cabinetNo: editCabinetNo.trim(),
      status: editCabinetStatus,
      totalSlots: Number(editTotalSlots),
      powerBankCount: Number(editPowerBankCount),
    });

    if (result.adjusted) {
      const cab = cabinets.find((c) => c.id === editingCabinetId);
      const nonAvailableCount = cab
        ? cab.powerBanks.filter((p) => p.status !== "available").length
        : 0;
      setSaveMessage({
        type: "warning",
        text: `数量已调整：实际充电宝 ${result.actualPowerBankCount} 个（有 ${nonAvailableCount} 个非可用状态设备无法移除），总槽位 ${result.actualTotalSlots} 个`,
      });
    } else {
      setSaveMessage({
        type: "success",
        text: "保存成功",
      });
    }

    setTimeout(() => setSaveMessage(null), 4000);
    cancelEdit();
  };

  const handleDelete = (cab: Cabinet) => {
    if (window.confirm(`确定删除柜机 ${cab.cabinetNo} 吗？`)) {
      deleteCabinet(cab.id);
    }
  };

  return (
    <div className="bg-slate-800/30 px-8 py-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Icon className="w-4 h-4 text-teal-400" />
          {location.name} - 详细信息
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-4 space-y-1">
          <p className="text-xs text-slate-500">点位类型</p>
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_BADGE[location.type]}`}
          >
            {LOCATION_TYPE_LABELS[location.type]}
          </span>
        </div>
        <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-4 space-y-1">
          <p className="text-xs text-slate-500">营业时间</p>
          <p className="text-sm text-white">{location.businessHours || "-"}</p>
        </div>
        <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-4 space-y-1">
          <p className="text-xs text-slate-500">地址</p>
          <p className="text-sm text-white truncate">{location.address}</p>
        </div>
        <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-4 space-y-1">
          <p className="text-xs text-slate-500">坐标</p>
          <p className="text-sm text-white">
            {location.longitude}, {location.latitude}
          </p>
        </div>
        <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-4 space-y-1">
          <p className="text-xs text-slate-500">日收入</p>
          <p className="text-sm text-amber-400 font-medium">
            ¥{location.dailyIncome.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-4 space-y-1">
          <p className="text-xs text-slate-500">状态</p>
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-block w-2 h-2 rounded-full ${STATUS_DOT[location.status]}`}
            />
            <span className="text-sm text-white">
              {STATUS_LABEL[location.status]}
            </span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-slate-300">
            关联柜机（{cabinets.length}）
          </h4>
          {!addingCabinet && (
            <button
              onClick={() => setAddingCabinet(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-teal-600/20 text-teal-400 text-xs font-medium hover:bg-teal-600/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              添加柜机
            </button>
          )}
        </div>

        {saveMessage && (
          <div
            className={cn(
              "mb-3 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2",
              saveMessage.type === "warning"
                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                : saveMessage.type === "success"
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "bg-blue-500/15 text-blue-300 border border-blue-500/30"
            )}
          >
            {saveMessage.type === "warning" && (
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            )}
            {saveMessage.type === "success" && (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{saveMessage.text}</span>
          </div>
        )}

        {addingCabinet && (
          <div className="mb-3 rounded-lg bg-slate-800/60 border border-slate-700/50 p-3 flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1">柜机编号</label>
              <input
                value={newCabinetNo}
                onChange={(e) => setNewCabinetNo(e.target.value)}
                placeholder="如 BJ-NEW-001"
                className="w-full px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs text-slate-400 mb-1">槽位数</label>
              <input
                type="number"
                value={newSlotCount}
                onChange={(e) => setNewSlotCount(Number(e.target.value) || 12)}
                min={1}
                className="w-full px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <button
              onClick={handleAddCabinet}
              disabled={!newCabinetNo.trim()}
              className="px-3 py-1.5 rounded-md bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
            >
              确认
            </button>
            <button
              onClick={() => {
                setAddingCabinet(false);
                setNewCabinetNo("");
                setNewSlotCount(12);
              }}
              className="px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition-colors"
            >
              取消
            </button>
          </div>
        )}

        {cabinets.length > 0 ? (
          <div className="rounded-lg border border-slate-700/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 text-left">
                  <th className="px-4 py-2 font-medium">柜机编号</th>
                  <th className="px-4 py-2 font-medium text-center">
                    总槽位
                  </th>
                  <th className="px-4 py-2 font-medium text-center">
                    充电宝数量
                  </th>
                  <th className="px-4 py-2 font-medium">状态</th>
                  <th className="px-4 py-2 font-medium text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {cabinets.map((cab) =>
                  editingCabinetId === cab.id ? (
                    <tr key={cab.id} className="bg-slate-800/50">
                      <td className="px-4 py-2">
                        <input
                          value={editCabinetNo}
                          onChange={(e) => setEditCabinetNo(e.target.value)}
                          className="w-full px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-teal-500"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="text-slate-300 font-mono">{editTotalSlots}</span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="text-slate-400 font-mono">{editPowerBankCount}</span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="space-y-2">
                          <select
                            value={editCabinetStatus}
                            onChange={(e) =>
                              setEditCabinetStatus(e.target.value as Cabinet["status"])
                            }
                            className="w-full px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-teal-500 appearance-none"
                          >
                            {(["online", "offline", "fault"] as Cabinet["status"][]).map(
                              (s) => (
                                <option key={s} value={s}>
                                  {CABINET_STATUS_LABELS[s]}
                                </option>
                              )
                            )}
                          </select>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-slate-400 mb-0.5">总槽位数</label>
                              <input
                                type="number"
                                value={editTotalSlots}
                                onChange={(e) => setEditTotalSlots(Number(e.target.value) || 0)}
                                min={1}
                                className="w-full px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-teal-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-0.5">充电宝数量</label>
                              <input
                                type="number"
                                value={editPowerBankCount}
                                onChange={(e) => setEditPowerBankCount(Number(e.target.value) || 0)}
                                min={0}
                                className="w-full px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-teal-500"
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={saveEdit}
                            className="p-1 rounded-md text-teal-400 hover:bg-slate-700/50 transition-colors"
                            title="保存"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 rounded-md text-slate-400 hover:bg-slate-700/50 transition-colors"
                            title="取消"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={cab.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-4 py-2 text-white">{cab.cabinetNo}</td>
                      <td className="px-4 py-2 text-center text-slate-300">
                        {cab.totalSlots}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="space-y-0.5">
                          <span className="text-slate-200 font-medium">{cab.powerBanks.length}</span>
                          <div className="text-xs">
                            <span className="text-slate-500">可用: </span>
                            <span
                              className={
                                cab.availableCount <= 3
                                  ? "text-red-400"
                                  : "text-teal-400"
                              }
                            >
                              {cab.availableCount}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            cab.status === "online"
                              ? "bg-green-500/15 text-green-400"
                              : cab.status === "fault"
                                ? "bg-red-500/15 text-red-400"
                                : "bg-slate-500/15 text-slate-400"
                          }`}
                        >
                          {CABINET_STATUS_LABELS[cab.status]}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => startEdit(cab)}
                            className="p-1 rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-700/50 transition-colors"
                            title="编辑"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cab)}
                            className="p-1 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 py-3 text-center">
            该点位暂无关联柜机
          </p>
        )}
      </div>
    </div>
  );
}
