import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Location,
  Cabinet,
  PowerBank,
  PowerBankMovement,
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
  powerBankMovements: PowerBankMovement[];
  tickets: Ticket[];
  billingRules: BillingRule[];
  systemThreshold: SystemThreshold;
  userAccounts: UserAccount[];

  addLocation: (location: Location) => void;
  updateLocation: (id: string, data: Partial<Location>) => void;
  addLocationWithCabinets: (
    location: Location,
    cabinetNo: string,
    slotCount: number
  ) => void;
  updateCabinet: (id: string, data: Partial<Cabinet>) => void;
  updateCabinetWithSlots: (
    id: string,
    data: {
      cabinetNo?: string;
      status?: Cabinet["status"];
      totalSlots?: number;
      powerBankCount?: number;
    }
  ) => void;
  deleteCabinet: (id: string) => void;
  addCabinetToLocation: (
    locationId: string,
    cabinetNo: string,
    slotCount: number
  ) => void;
  borrowPowerBank: (
    locationId: string,
    userName: string,
    userPhone: string
  ) => string | null;
  returnPowerBank: (rentalId: string, returnLocationId: string) => boolean;
  simulateDeviceReport: () => void;
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

function recalcLocationStats(
  locations: Location[],
  cabinets: Cabinet[]
): Location[] {
  return locations.map((loc) => {
    const locCabs = cabinets.filter((c) => c.locationId === loc.id);
    const totalSlots = locCabs.reduce((s, c) => s + c.totalSlots, 0);
    const available = locCabs.reduce((s, c) => s + c.availableCount, 0);
    const allPBs = locCabs.flatMap((c) => c.powerBanks);
    const faultPBs = allPBs.filter(
      (p) => p.status === "fault" || p.status === "needs_recycle"
    ).length;
    const totalPBs = allPBs.length;
    return {
      ...loc,
      cabinetCount: locCabs.length,
      totalSlots,
      availablePowerBanks: available,
      faultRate: totalPBs > 0 ? faultPBs / totalPBs : 0,
    };
  });
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      locations: mockLocations,
      cabinets: mockCabinets,
      rentalRecords: mockRentalRecords,
      maintenanceTasks: mockMaintenanceTasks,
      powerBankMovements: [],
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

      addLocationWithCabinets: (location, cabinetNo, slotCount) => {
        const cabinetId = `cab-${Date.now()}`;
        const pbs: PowerBank[] = [];
        for (let i = 0; i < slotCount; i++) {
          pbs.push({
            id: `pb-${Date.now()}-${i}`,
            slotIndex: i + 1,
            batteryLevel: Math.floor(Math.random() * 40) + 60,
            status: "available",
            lastReportTime: new Date().toISOString(),
            movementHistory: [],
          });
        }
        const cabinet: Cabinet = {
          id: cabinetId,
          cabinetNo,
          locationId: location.id,
          locationName: location.name,
          totalSlots: slotCount,
          availableCount: slotCount,
          status: "online",
          powerBanks: pbs,
          lastHeartbeat: new Date().toISOString(),
        };
        const newLoc: Location = {
          ...location,
          cabinetCount: 1,
          totalSlots: slotCount,
          availablePowerBanks: slotCount,
        };
        set((state) => {
          const locations = [...state.locations, newLoc];
          const cabinets = [...state.cabinets, cabinet];
          return {
            locations: recalcLocationStats(locations, cabinets),
            cabinets,
          };
        });
      },

      updateCabinet: (id, data) =>
        set((state) => {
          const cabinets = state.cabinets.map((c) =>
            c.id === id ? { ...c, ...data } : c
          );
          return {
            cabinets,
            locations: recalcLocationStats(state.locations, cabinets),
          };
        }),

      updateCabinetWithSlots: (id, data) =>
        set((state) => {
          let cabinets = state.cabinets.map((cab) => {
            if (cab.id !== id) return cab;
            const newTotalSlots = data.totalSlots ?? cab.totalSlots;
            const newPowerBankCount =
              data.powerBankCount ?? cab.powerBanks.length;

            let pbs = [...cab.powerBanks];
            const availableCount = pbs.filter(
              (p) => p.status === "available"
            ).length;

            if (newPowerBankCount > pbs.length) {
              const toAdd = newPowerBankCount - pbs.length;
              const maxSlot =
                pbs.length > 0
                  ? Math.max(...pbs.map((p) => p.slotIndex))
                  : 0;
              for (let i = 0; i < toAdd; i++) {
                pbs.push({
                  id: `pb-${Date.now()}-${i}`,
                  slotIndex: maxSlot + 1 + i,
                  batteryLevel: Math.floor(Math.random() * 40) + 60,
                  status: "available",
                  lastReportTime: new Date().toISOString(),
                  movementHistory: [],
                });
              }
            } else if (newPowerBankCount < pbs.length) {
              const available = pbs.filter((p) => p.status === "available");
              const others = pbs.filter((p) => p.status !== "available");
              const toKeep = Math.max(newPowerBankCount - others.length, 0);
              pbs = [...others, ...available.slice(0, toKeep)];
              if (data.totalSlots !== undefined) {
                pbs = pbs.slice(0, data.totalSlots);
              }
            }

            const finalAvailable = pbs.filter(
              (p) => p.status === "available"
            ).length;

            return {
              ...cab,
              cabinetNo: data.cabinetNo ?? cab.cabinetNo,
              status: data.status ?? cab.status,
              totalSlots: newTotalSlots,
              availableCount: finalAvailable,
              powerBanks: pbs,
              lastHeartbeat: new Date().toISOString(),
            };
          });
          return {
            cabinets,
            locations: recalcLocationStats(state.locations, cabinets),
          };
        }),

      deleteCabinet: (id) =>
        set((state) => {
          const cabinets = state.cabinets.filter((c) => c.id !== id);
          return {
            cabinets,
            locations: recalcLocationStats(state.locations, cabinets),
          };
        }),

      addCabinetToLocation: (locationId, cabinetNo, slotCount) => {
        const state = get();
        const loc = state.locations.find((l) => l.id === locationId);
        if (!loc) return;
        const cabinetId = `cab-${Date.now()}`;
        const pbs: PowerBank[] = [];
        for (let i = 0; i < slotCount; i++) {
          pbs.push({
            id: `pb-${Date.now()}-${i}`,
            slotIndex: i + 1,
            batteryLevel: Math.floor(Math.random() * 40) + 60,
            status: "available",
            lastReportTime: new Date().toISOString(),
            movementHistory: [],
          });
        }
        const cabinet: Cabinet = {
          id: cabinetId,
          cabinetNo,
          locationId,
          locationName: loc.name,
          totalSlots: slotCount,
          availableCount: slotCount,
          status: "online",
          powerBanks: pbs,
          lastHeartbeat: new Date().toISOString(),
        };
        set((state) => {
          const cabinets = [...state.cabinets, cabinet];
          return {
            cabinets,
            locations: recalcLocationStats(state.locations, cabinets),
          };
        });
      },

      borrowPowerBank: (locationId, userName, userPhone) => {
        const state = get();
        const locCabinets = state.cabinets.filter(
          (c) => c.locationId === locationId && c.status === "online"
        );
        let targetCabinet: Cabinet | null = null;
        let targetPB: PowerBank | null = null;
        for (const cab of locCabinets) {
          const pb = cab.powerBanks.find((p) => p.status === "available");
          if (pb) {
            targetCabinet = cab;
            targetPB = pb;
            break;
          }
        }
        if (!targetCabinet || !targetPB) return null;

        const loc = state.locations.find((l) => l.id === locationId);
        if (!loc) return null;

        const rentalId = `rental-${Date.now()}`;
        const userId = `user-${Date.now()}`;

        const updatedPB: PowerBank = {
          ...targetPB,
          status: "borrowed",
          batteryLevel: Math.max(
            5,
            targetPB.batteryLevel - Math.floor(Math.random() * 20)
          ),
          lastReportTime: new Date().toISOString(),
        };

        const updatedCabinet: Cabinet = {
          ...targetCabinet,
          powerBanks: targetCabinet.powerBanks.map((p) =>
            p.id === targetPB.id ? updatedPB : p
          ),
          availableCount: targetCabinet.availableCount - 1,
        };

        const newRental: RentalRecord = {
          id: rentalId,
          userId,
          userName,
          userPhone,
          borrowLocationId: locationId,
          borrowLocationName: loc.name,
          borrowTime: new Date().toISOString(),
          status: "borrowed",
          paymentStatus: "unpaid",
          cabinetId: targetCabinet.id,
          powerBankId: targetPB.id,
        };

        set((state) => {
          const cabinets = state.cabinets.map((c) =>
            c.id === targetCabinet!.id ? updatedCabinet : c
          );
          return {
            cabinets,
            rentalRecords: [newRental, ...state.rentalRecords],
            locations: recalcLocationStats(state.locations, cabinets),
          };
        });
        return rentalId;
      },

      returnPowerBank: (rentalId, returnLocationId) => {
        const state = get();
        const rental = state.rentalRecords.find((r) => r.id === rentalId);
        if (!rental || rental.status !== "borrowed") return false;
        if (!rental.powerBankId || !rental.cabinetId) return false;

        const returnLoc = state.locations.find(
          (l) => l.id === returnLocationId
        );
        if (!returnLoc) return false;

        const borrowCabinet = state.cabinets.find(
          (c) => c.id === rental.cabinetId
        );
        const borrowLoc = borrowCabinet
          ? state.locations.find((l) => l.id === borrowCabinet.locationId)
          : null;

        const returnCabinets = state.cabinets.filter(
          (c) => c.locationId === returnLocationId && c.status === "online"
        );
        let targetCabinet: Cabinet | null = null;
        for (const cab of returnCabinets) {
          if (cab.powerBanks.length < cab.totalSlots) {
            targetCabinet = cab;
            break;
          }
        }
        if (!targetCabinet) {
          for (const cab of returnCabinets) {
            if (
              cab.powerBanks.length < cab.totalSlots ||
              cab.powerBanks.some((p) => p.status === "borrowed")
            ) {
              targetCabinet = cab;
              break;
            }
          }
        }
        if (!targetCabinet) return false;

        const now = new Date();
        const borrowTime = new Date(rental.borrowTime);
        const durationMinutes = Math.max(
          1,
          Math.round((now.getTime() - borrowTime.getTime()) / 60000)
        );

        const rule = state.billingRules[0];
        const freeMinutes = rule?.freeMinutes ?? 5;
        const pricePerHour = rule?.pricePerHour ?? 3;
        const dailyCap = rule?.dailyCap ?? 30;
        const chargedMinutes = Math.max(0, durationMinutes - freeMinutes);
        const rawFee = (chargedMinutes / 60) * pricePerHour;
        const fee = Math.round(Math.min(rawFee, dailyCap) * 100) / 100;

        const pbBattery = Math.floor(Math.random() * 30) + 20;
        const threshold = state.systemThreshold.lowBatteryThreshold;

        let originalPB: PowerBank | null = null;
        let cabinets = state.cabinets;

        if (borrowCabinet && borrowCabinet.id === targetCabinet.id) {
          const existingPB = targetCabinet.powerBanks.find(
            (p) => p.id === rental.powerBankId
          );
          if (existingPB) {
            const updatedPB: PowerBank = {
              ...existingPB,
              status:
                pbBattery < threshold ? "needs_recycle" : "charging",
              batteryLevel: pbBattery,
              lastReportTime: now.toISOString(),
            };
            const updatedTargetCabinet: Cabinet = {
              ...targetCabinet,
              powerBanks: targetCabinet.powerBanks.map((p) =>
                p.id === existingPB.id ? updatedPB : p
              ),
              availableCount:
                targetCabinet.availableCount +
                (updatedPB.status === "available" ? 1 : 0),
              lastHeartbeat: now.toISOString(),
            };
            cabinets = state.cabinets.map((c) =>
              c.id === targetCabinet!.id ? updatedTargetCabinet : c
            );
          }
        } else {
          let originalPBFromBorrow: PowerBank | null = null;
          cabinets = state.cabinets
            .map((cab) => {
              if (cab.id === rental.cabinetId) {
                originalPBFromBorrow =
                  cab.powerBanks.find(
                    (p) => p.id === rental.powerBankId
                  ) || null;
                const filtered = cab.powerBanks.filter(
                  (p) => p.id !== rental.powerBankId
                );
                const availableInOrig = filtered.filter(
                  (p) => p.status === "available"
                ).length;
                return {
                  ...cab,
                  powerBanks: filtered,
                  availableCount: availableInOrig,
                  lastHeartbeat: now.toISOString(),
                };
              }
              return cab;
            })
            .map((cab) => {
              if (cab.id === targetCabinet!.id) {
                const maxSlot =
                  cab.powerBanks.length > 0
                    ? Math.max(...cab.powerBanks.map((p) => p.slotIndex))
                    : 0;
                const newPB: PowerBank = {
                  id: rental.powerBankId!,
                  slotIndex: maxSlot + 1,
                  batteryLevel: pbBattery,
                  status:
                    pbBattery < threshold ? "needs_recycle" : "charging",
                  lastReportTime: now.toISOString(),
                  movementHistory: [
                    ...(originalPBFromBorrow?.movementHistory || []),
                  ],
                };

                if (borrowCabinet && borrowLoc && targetCabinet) {
                  const movement: PowerBankMovement = {
                    id: `move-${Date.now()}`,
                    powerBankId: rental.powerBankId!,
                    fromLocationId: borrowCabinet.locationId,
                    fromLocationName: borrowLoc.name,
                    fromCabinetId: borrowCabinet.id,
                    fromCabinetNo: borrowCabinet.cabinetNo,
                    toLocationId: targetCabinet.locationId,
                    toLocationName: returnLoc.name,
                    toCabinetId: targetCabinet.id,
                    toCabinetNo: targetCabinet.cabinetNo,
                    movedAt: now.toISOString(),
                    type: "rental_return",
                  };
                  newPB.movementHistory?.push(movement);

                  set((state) => ({
                    powerBankMovements: [movement, ...state.powerBankMovements],
                  }));
                }

                const newPBs = [...cab.powerBanks, newPB];
                return {
                  ...cab,
                  powerBanks: newPBs,
                  availableCount:
                    cab.availableCount +
                    (newPB.status === "available" ? 1 : 0),
                  lastHeartbeat: now.toISOString(),
                };
              }
              return cab;
            });
        }

        set((state) => {
          const finalCabinets = cabinets;
          return {
            cabinets: finalCabinets,
            rentalRecords: state.rentalRecords.map((r) =>
              r.id === rentalId
                ? {
                    ...r,
                    returnLocationId,
                    returnLocationName: returnLoc.name,
                    returnTime: now.toISOString(),
                    duration: durationMinutes,
                    fee,
                    status: "returned" as const,
                    paymentStatus: "paid" as const,
                  }
                : r
            ),
            locations: recalcLocationStats(state.locations, finalCabinets),
          };
        });
        return true;
      },

      simulateDeviceReport: () => {
        const state = get();
        const threshold = state.systemThreshold.lowBatteryThreshold;
        const lowStockThreshold = state.systemThreshold.lowStockThreshold;
        let newTasks: MaintenanceTask[] = [];

        const updatedCabinets = state.cabinets.map((cab) => {
          const updatedPBs = cab.powerBanks.map((pb) => {
            if (pb.status === "borrowed" || pb.status === "fault") return pb;

            let newLevel = pb.batteryLevel;
            let newStatus = pb.status;

            if (pb.status === "charging") {
              newLevel = Math.min(
                100,
                pb.batteryLevel + Math.floor(Math.random() * 15) + 5
              );
              if (newLevel >= 95) newStatus = "available";
            } else if (pb.status === "available") {
              const drain = Math.floor(Math.random() * 5);
              newLevel = Math.max(0, pb.batteryLevel - drain);
            } else if (pb.status === "needs_recycle") {
              newLevel = Math.max(
                0,
                pb.batteryLevel - Math.floor(Math.random() * 3)
              );
            }

            if (newLevel < threshold && newStatus !== "needs_recycle") {
              newStatus = "needs_recycle";
            }

            return {
              ...pb,
              batteryLevel: newLevel,
              status: newStatus,
              lastReportTime: new Date().toISOString(),
            };
          });

          const availableCount = updatedPBs.filter(
            (p) => p.status === "available"
          ).length;

          return {
            ...cab,
            powerBanks: updatedPBs,
            availableCount,
            lastHeartbeat: new Date().toISOString(),
          };
        });

        const allCabinets = updatedCabinets;
        const locationsNeedRestock: {
          locId: string;
          locName: string;
          locAddr: string;
          avail: number;
        }[] = [];
        const locationsNeedRecycle: {
          locId: string;
          locName: string;
          locAddr: string;
          count: number;
        }[] = [];

        for (const loc of state.locations) {
          const locCabs = allCabinets.filter((c) => c.locationId === loc.id);
          const totalAvail = locCabs.reduce(
            (s, c) => s + c.availableCount,
            0
          );
          const recycleCount = locCabs
            .flatMap((c) => c.powerBanks)
            .filter((p) => p.status === "needs_recycle").length;

          if (totalAvail < lowStockThreshold && loc.status === "active") {
            locationsNeedRestock.push({
              locId: loc.id,
              locName: loc.name,
              locAddr: loc.address,
              avail: totalAvail,
            });
          }
          if (recycleCount > 0 && loc.status === "active") {
            locationsNeedRecycle.push({
              locId: loc.id,
              locName: loc.name,
              locAddr: loc.address,
              count: recycleCount,
            });
          }
        }

        const existingRestockLocIds = new Set(
          state.maintenanceTasks
            .filter(
              (t) => t.type === "restock" && t.status !== "completed"
            )
            .map((t) => t.locationId)
        );
        const existingRecycleLocIds = new Set(
          state.maintenanceTasks
            .filter(
              (t) => t.type === "recycle" && t.status !== "completed"
            )
            .map((t) => t.locationId)
        );

        for (const item of locationsNeedRestock) {
          if (!existingRestockLocIds.has(item.locId)) {
            newTasks.push({
              id: `mt-${Date.now()}-r${Math.random().toString(36).slice(2, 6)}`,
              type: "restock",
              locationId: item.locId,
              locationName: item.locName,
              locationAddress: item.locAddr,
              description: `可用充电宝仅${item.avail}个，低于阈值${lowStockThreshold}，需补货`,
              urgency: item.avail === 0 ? "high" : "medium",
              status: "pending",
              createdAt: new Date().toISOString(),
            });
          }
        }

        for (const item of locationsNeedRecycle) {
          if (!existingRecycleLocIds.has(item.locId)) {
            newTasks.push({
              id: `mt-${Date.now()}-c${Math.random().toString(36).slice(2, 6)}`,
              type: "recycle",
              locationId: item.locId,
              locationName: item.locName,
              locationAddress: item.locAddr,
              description: `${item.count}个充电宝电量低于${threshold}%，需回收充电`,
              urgency: item.count >= 3 ? "high" : "medium",
              status: "pending",
              createdAt: new Date().toISOString(),
            });
          }
        }

        set((state) => ({
          cabinets: allCabinets,
          maintenanceTasks: [...newTasks, ...state.maintenanceTasks],
          locations: recalcLocationStats(state.locations, allCabinets),
        }));
      },

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
              ? {
                  ...t,
                  replies: [...t.replies, reply],
                  updatedAt: new Date().toISOString(),
                }
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
    }),
    {
      name: "powerbank-storage",
    }
  )
);
