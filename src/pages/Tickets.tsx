import { useState } from "react";
import { useStore } from "@/store";
import {
  TICKET_TYPE_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
} from "@/types";
import type { Ticket } from "@/types";
import {
  Search,
  Filter,
  Ticket as TicketIcon,
  MessageCircle,
  Send,
  User,
  Clock,
  AlertTriangle,
  DollarSign,
  ArrowLeftRight,
  HelpCircle,
  CheckCircle2,
  Eye,
  Lock,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TypeFilter = "all" | "cannot_return" | "billing_error" | "device_fault" | "other";
type StatusFilter = "all" | "open" | "processing" | "resolved" | "closed";
type PriorityFilter = "all" | "urgent" | "high" | "medium" | "low";

const PRIORITY_BADGE: Record<
  Ticket["priority"],
  { bg: string; text: string }
> = {
  urgent: { bg: "bg-red-500/20", text: "text-red-400" },
  high: { bg: "bg-amber-500/20", text: "text-amber-400" },
  medium: { bg: "bg-blue-500/20", text: "text-blue-400" },
  low: { bg: "bg-slate-500/20", text: "text-slate-400" },
};

const TYPE_ICON: Record<Ticket["type"], typeof ArrowLeftRight> = {
  cannot_return: ArrowLeftRight,
  billing_error: DollarSign,
  device_fault: AlertTriangle,
  other: HelpCircle,
};

const TYPE_BADGE_COLOR: Record<
  Ticket["type"],
  { bg: string; text: string }
> = {
  cannot_return: { bg: "bg-purple-500/15", text: "text-purple-400" },
  billing_error: { bg: "bg-amber-500/15", text: "text-amber-400" },
  device_fault: { bg: "bg-red-500/15", text: "text-red-400" },
  other: { bg: "bg-slate-500/15", text: "text-slate-400" },
};

const STATUS_DOT: Record<
  Ticket["status"],
  { dot: string; bg: string; text: string }
> = {
  open: { dot: "bg-amber-400", bg: "bg-amber-500/15", text: "text-amber-400" },
  processing: { dot: "bg-blue-400", bg: "bg-blue-500/15", text: "text-blue-400" },
  resolved: { dot: "bg-emerald-400", bg: "bg-emerald-500/15", text: "text-emerald-400" },
  closed: { dot: "bg-slate-400", bg: "bg-slate-500/15", text: "text-slate-400" },
};

const ROLE_BADGE: Record<
  Ticket["replies"][number]["authorRole"],
  { bg: string; text: string; label: string }
> = {
  admin: { bg: "bg-red-500/15", text: "text-red-400", label: "管理员" },
  operator: { bg: "bg-blue-500/15", text: "text-blue-400", label: "运维" },
  cs: { bg: "bg-teal-500/15", text: "text-teal-400", label: "客服" },
};

const QUICK_TEMPLATES = [
  "已核实，将为您处理",
  "退款已发起",
  "已安排运维前往",
  "已为您远程解锁",
];

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

function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function TicketCard({
  ticket,
  isSelected,
  onClick,
}: {
  ticket: Ticket;
  isSelected: boolean;
  onClick: () => void;
}) {
  const TypeComp = TYPE_ICON[ticket.type];
  const statusCfg = STATUS_DOT[ticket.status];
  const priorityCfg = PRIORITY_BADGE[ticket.priority];
  const typeColor = TYPE_BADGE_COLOR[ticket.type];

  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-lg border p-3 transition-all hover:bg-slate-800/80",
        isSelected
          ? "border-l-2 border-l-teal-500 bg-slate-800/80 border-slate-600/50"
          : "border-transparent hover:border-slate-700/50"
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold",
            priorityCfg.bg,
            priorityCfg.text
          )}
        >
          {TICKET_PRIORITY_LABELS[ticket.priority]}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
            typeColor.bg,
            typeColor.text
          )}
        >
          <TypeComp className="w-3 h-3" />
          {TICKET_TYPE_LABELS[ticket.type]}
        </span>
      </div>
      <p className="text-sm font-semibold text-white truncate mb-1">
        {ticket.title}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <User className="w-3 h-3" />
          <span>{ticket.userName}</span>
          <span className="text-slate-600">·</span>
          <Clock className="w-3 h-3" />
          <span>{formatRelativeTime(ticket.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />
          <span className={cn("text-[10px] font-medium", statusCfg.text)}>
            {TICKET_STATUS_LABELS[ticket.status]}
          </span>
        </div>
      </div>
    </div>
  );
}

function TicketDetail({
  ticket,
  onReply,
}: {
  ticket: Ticket;
  onReply: (content: string, isInternal: boolean) => void;
}) {
  const [replyContent, setReplyContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const statusCfg = STATUS_DOT[ticket.status];
  const priorityCfg = PRIORITY_BADGE[ticket.priority];
  const TypeComp = TYPE_ICON[ticket.type];
  const typeColor = TYPE_BADGE_COLOR[ticket.type];

  function handleSend() {
    const trimmed = replyContent.trim();
    if (!trimmed) return;
    onReply(trimmed, isInternal);
    setReplyContent("");
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-700/50 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-white leading-snug">
            {ticket.title}
          </h2>
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0",
              statusCfg.bg,
              statusCfg.text
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />
            {TICKET_STATUS_LABELS[ticket.status]}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
              typeColor.bg,
              typeColor.text
            )}
          >
            <TypeComp className="w-3.5 h-3.5" />
            {TICKET_TYPE_LABELS[ticket.type]}
          </span>
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold",
              priorityCfg.bg,
              priorityCfg.text
            )}
          >
            {TICKET_PRIORITY_LABELS[ticket.priority]}
          </span>
          {ticket.assignee && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-700/50 text-slate-300">
              <Eye className="w-3 h-3" />
              {ticket.assignee}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <User className="w-3.5 h-3.5" />
            <span className="font-medium text-slate-200">{ticket.userName}</span>
            <span className="text-slate-600">|</span>
            <span>{ticket.userPhone}</span>
            <span className="text-slate-600">|</span>
            <span className="font-mono">{ticket.userId}</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {ticket.description}
          </p>
          {ticket.relatedRentalId && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500">关联订单：</span>
              <span className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 cursor-pointer font-mono">
                {ticket.relatedRentalId}
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          )}
        </div>

        {ticket.replies.length > 0 && (
          <div className="space-y-0">
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-teal-400" />
              回复记录
              <span className="text-slate-500 text-xs">({ticket.replies.length})</span>
            </h3>
            <div className="relative pl-5">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-700/50" />
              <div className="space-y-3">
                {ticket.replies.map((reply) => {
                  const roleCfg = ROLE_BADGE[reply.authorRole];
                  return (
                    <div key={reply.id} className="relative">
                      <div
                        className={cn(
                          "absolute left-[-17px] top-2 w-2.5 h-2.5 rounded-full border-2 border-slate-900",
                          reply.isInternal ? "bg-amber-400" : "bg-teal-400"
                        )}
                      />
                      <div
                        className={cn(
                          "rounded-lg p-3",
                          reply.isInternal
                            ? "bg-amber-500/10 border border-amber-500/20"
                            : "bg-slate-800/50 border border-slate-700/30"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-medium text-slate-200">
                            {reply.author}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium",
                              roleCfg.bg,
                              roleCfg.text
                            )}
                          >
                            {roleCfg.label}
                          </span>
                          {reply.isInternal && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400">
                              <Lock className="w-2.5 h-2.5" />
                              内部备注
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 ml-auto">
                            {formatDateTime(reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-700/50 px-6 py-4 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {QUICK_TEMPLATES.map((tpl) => (
            <button
              key={tpl}
              onClick={() => setReplyContent(tpl)}
              className="px-2.5 py-1 rounded-full text-xs font-medium border border-slate-700/50 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
            >
              {tpl}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="输入回复内容..."
            rows={2}
            className="flex-1 resize-none rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-600/50 focus:ring-1 focus:ring-teal-600/30"
          />
          <div className="flex flex-col justify-between">
            <button
              onClick={handleSend}
              disabled={!replyContent.trim()}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                replyContent.trim()
                  ? "bg-teal-600 text-white hover:bg-teal-700"
                  : "bg-slate-700/50 text-slate-500 cursor-not-allowed"
              )}
            >
              <Send className="w-3.5 h-3.5" />
              发送
            </button>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-teal-600 focus:ring-teal-600/30 focus:ring-offset-0"
              />
              <span className="text-xs text-slate-400 flex items-center gap-0.5">
                <Lock className="w-3 h-3" />
                标记为内部备注
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Tickets() {
  const { tickets, addTicketReply, updateTicket } = useStore();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = tickets.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      if (!t.userName.toLowerCase().includes(q) && !t.title.toLowerCase().includes(q))
        return false;
    }
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  });

  const selectedTicket = tickets.find((t) => t.id === selectedId) ?? null;

  function handleReply(ticketId: string, content: string, isInternal: boolean) {
    addTicketReply(ticketId, {
      id: `reply-${Date.now()}`,
      author: "系统管理员",
      authorRole: "admin",
      content,
      createdAt: new Date().toISOString(),
      isInternal,
    });
    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket && ticket.status === "open") {
      updateTicket(ticketId, { status: "processing" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <TicketIcon className="w-6 h-6 text-teal-400" />
        <h1 className="text-xl font-semibold text-white">工单管理</h1>
        <span className="text-sm text-slate-500">({filtered.length} 条)</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="搜索用户名/标题..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-700/50 bg-slate-800/50 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-600/50 focus:ring-1 focus:ring-teal-600/30"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="px-3 py-2 rounded-lg border border-slate-700/50 bg-slate-800/50 text-sm text-slate-200 focus:outline-none focus:border-teal-600/50"
          >
            <option value="all">全部类型</option>
            <option value="cannot_return">无法归还</option>
            <option value="billing_error">扣费异常</option>
            <option value="device_fault">设备故障</option>
            <option value="other">其他</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 rounded-lg border border-slate-700/50 bg-slate-800/50 text-sm text-slate-200 focus:outline-none focus:border-teal-600/50"
          >
            <option value="all">全部状态</option>
            <option value="open">待处理</option>
            <option value="processing">处理中</option>
            <option value="resolved">已解决</option>
            <option value="closed">已关闭</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
            className="px-3 py-2 rounded-lg border border-slate-700/50 bg-slate-800/50 text-sm text-slate-200 focus:outline-none focus:border-teal-600/50"
          >
            <option value="all">全部优先级</option>
            <option value="urgent">紧急</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>
      </div>

      <div className="flex rounded-xl border border-slate-700/50 bg-slate-900/50 overflow-hidden" style={{ height: "calc(100vh - 260px)" }}>
        <div className="w-[350px] shrink-0 border-r border-slate-700/50 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <TicketIcon className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">暂无工单</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {filtered.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  isSelected={ticket.id === selectedId}
                  onClick={() => setSelectedId(ticket.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {selectedTicket ? (
            <TicketDetail
              ticket={selectedTicket}
              onReply={(content, isInternal) =>
                handleReply(selectedTicket.id, content, isInternal)
              }
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <CheckCircle2 className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">选择左侧工单查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
