export interface Location {
  id: string;
  name: string;
  type: "mall" | "restaurant" | "scenic" | "hotel" | "transport" | "other";
  address: string;
  longitude: number;
  latitude: number;
  businessHours: string;
  cabinetCount: number;
  totalSlots: number;
  availablePowerBanks: number;
  borrowRate: number;
  dailyIncome: number;
  faultRate: number;
  status: "active" | "inactive" | "maintenance";
  createdAt: string;
}

export interface PowerBankMovement {
  id: string;
  powerBankId: string;
  fromLocationId: string;
  fromLocationName: string;
  fromCabinetId: string;
  fromCabinetNo: string;
  toLocationId: string;
  toLocationName: string;
  toCabinetId: string;
  toCabinetNo: string;
  movedAt: string;
  type: "rental_return" | "manual_transfer";
}

export interface PowerBank {
  id: string;
  slotIndex: number;
  batteryLevel: number;
  status: "available" | "borrowed" | "charging" | "needs_recycle" | "fault";
  lastReportTime: string;
  movementHistory?: PowerBankMovement[];
}

export interface Cabinet {
  id: string;
  cabinetNo: string;
  locationId: string;
  locationName: string;
  totalSlots: number;
  availableCount: number;
  status: "online" | "offline" | "fault";
  powerBanks: PowerBank[];
  lastHeartbeat: string;
}

export interface RentalRecord {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  borrowLocationId: string;
  borrowLocationName: string;
  borrowTime: string;
  returnLocationId?: string;
  returnLocationName?: string;
  returnTime?: string;
  duration?: number;
  fee?: number;
  status: "borrowed" | "returned" | "overdue" | "abnormal";
  paymentStatus: "paid" | "unpaid" | "refunded";
  cabinetId?: string;
  powerBankId?: string;
}

export interface MaintenanceTask {
  id: string;
  type: "restock" | "recycle" | "repair";
  locationId: string;
  locationName: string;
  locationAddress: string;
  cabinetId?: string;
  description: string;
  urgency: "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed";
  assignee?: string;
  createdAt: string;
  completedAt?: string;
}

export interface TicketReply {
  id: string;
  author: string;
  authorRole: "admin" | "operator" | "cs";
  content: string;
  createdAt: string;
  isInternal: boolean;
}

export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  type: "cannot_return" | "billing_error" | "device_fault" | "other";
  title: string;
  description: string;
  relatedRentalId?: string;
  status: "open" | "processing" | "resolved" | "closed";
  priority: "urgent" | "high" | "medium" | "low";
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  replies: TicketReply[];
}

export interface BillingRule {
  id: string;
  freeMinutes: number;
  pricePerHour: number;
  dailyCap: number;
  currency: string;
}

export interface SystemThreshold {
  lowBatteryThreshold: number;
  lowStockThreshold: number;
  overdueReminderHours: number;
}

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: "admin" | "operator" | "cs";
  phone: string;
  status: "active" | "disabled";
  lastLoginAt: string;
  createdAt: string;
}

export const LOCATION_TYPE_LABELS: Record<Location["type"], string> = {
  mall: "商场",
  restaurant: "餐厅",
  scenic: "景区",
  hotel: "酒店",
  transport: "交通枢纽",
  other: "其他",
};

export const CABINET_STATUS_LABELS: Record<Cabinet["status"], string> = {
  online: "在线",
  offline: "离线",
  fault: "故障",
};

export const POWERBANK_STATUS_LABELS: Record<PowerBank["status"], string> = {
  available: "可用",
  borrowed: "借出",
  charging: "充电中",
  needs_recycle: "需回收",
  fault: "故障",
};

export const RENTAL_STATUS_LABELS: Record<RentalRecord["status"], string> = {
  borrowed: "借用中",
  returned: "已归还",
  overdue: "逾期未还",
  abnormal: "异常",
};

export const PAYMENT_STATUS_LABELS: Record<RentalRecord["paymentStatus"], string> = {
  paid: "已支付",
  unpaid: "未支付",
  refunded: "已退款",
};

export const TICKET_TYPE_LABELS: Record<Ticket["type"], string> = {
  cannot_return: "无法归还",
  billing_error: "扣费异常",
  device_fault: "设备故障",
  other: "其他",
};

export const TICKET_STATUS_LABELS: Record<Ticket["status"], string> = {
  open: "待处理",
  processing: "处理中",
  resolved: "已解决",
  closed: "已关闭",
};

export const TICKET_PRIORITY_LABELS: Record<Ticket["priority"], string> = {
  urgent: "紧急",
  high: "高",
  medium: "中",
  low: "低",
};

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceTask["type"], string> = {
  restock: "补货",
  recycle: "回收充电",
  repair: "维修",
};

export const TASK_STATUS_LABELS: Record<MaintenanceTask["status"], string> = {
  pending: "待处理",
  in_progress: "进行中",
  completed: "已完成",
};

export const URGENCY_LABELS: Record<MaintenanceTask["urgency"], string> = {
  high: "紧急",
  medium: "一般",
  low: "低",
};
