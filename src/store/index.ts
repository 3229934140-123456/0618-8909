import { create } from "zustand";
import type {
  Location,
  Cabinet,
  RentalRecord,
  MaintenanceTask,
  Ticket,
  BillingRule,
  SystemThreshold,
  UserAccount,
} from "@/types";
import {
  mockLocations,
  mockCabinets,
  mockRentalRecords,
  mockMaintenanceTasks,
  mockTickets,
  mockBillingRules,
  mockSystemThreshold,
  mockUserAccounts,
} from "@/mocks/data";

interface AppState {
  locations: Location[];
  cabinets: Cabinet[];
  rentalRecords: RentalRecord[];
  maintenanceTasks: MaintenanceTask[];
  tickets: Ticket[];
  billingRules: BillingRule[];
  systemThreshold: SystemThreshold;
  userAccounts: UserAccount[];

  addLocation: (location: Location) => void;
  updateLocation: (id: string, data: Partial<Location>) => void;
  updateMaintenanceTask: (
    id: string,
    data: Partial<MaintenanceTask>
  ) => void;
  updateTicket: (id: string, data: Partial<Ticket>) => void;
  addTicketReply: (
    ticketId: string,
    reply: Ticket["replies"][number]
  ) => void;
  updateBillingRule: (id: string, data: Partial<BillingRule>) => void;
  updateSystemThreshold: (data: Partial<SystemThreshold>) => void;
  updateUserAccount: (id: string, data: Partial<UserAccount>) => void;
}

export const useStore = create<AppState>((set) => ({
  locations: mockLocations,
  cabinets: mockCabinets,
  rentalRecords: mockRentalRecords,
  maintenanceTasks: mockMaintenanceTasks,
  tickets: mockTickets,
  billingRules: mockBillingRules,
  systemThreshold: mockSystemThreshold,
  userAccounts: mockUserAccounts,

  addLocation: (location) =>
    set((state) => ({ locations: [...state.locations, location] })),

  updateLocation: (id, data) =>
    set((state) => ({
      locations: state.locations.map((l) =>
        l.id === id ? { ...l, ...data } : l
      ),
    })),

  updateMaintenanceTask: (id, data) =>
    set((state) => ({
      maintenanceTasks: state.maintenanceTasks.map((t) =>
        t.id === id ? { ...t, ...data } : t
      ),
    })),

  updateTicket: (id, data) =>
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === id ? { ...t, ...data } : t
      ),
    })),

  addTicketReply: (ticketId, reply) =>
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === ticketId
          ? { ...t, replies: [...t.replies, reply], updatedAt: new Date().toISOString() }
          : t
      ),
    })),

  updateBillingRule: (id, data) =>
    set((state) => ({
      billingRules: state.billingRules.map((r) =>
        r.id === id ? { ...r, ...data } : r
      ),
    })),

  updateSystemThreshold: (data) =>
    set((state) => ({
      systemThreshold: { ...state.systemThreshold, ...data },
    })),

  updateUserAccount: (id, data) =>
    set((state) => ({
      userAccounts: state.userAccounts.map((u) =>
        u.id === id ? { ...u, ...data } : u
      ),
    })),
}));
