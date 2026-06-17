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
  ) => { actualPowerBankCount: number; actualTotalSlots: number; adjusted: boolean };
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

      updateCabinetWithSlots: (id, data) => {
        let result = {
          actualPowerBankCount: 0,
          actualTotalSlots: 0,
          adjusted: false,
        };
        set((state) => {
          const cabinets = state.cabinets.map((cab) => {
            if (cab.id !== id) return cab;

            const newTotalSlots = Math.max(
              1,
              data.totalSlots ?? cab.totalSlots
            );
            const requestedCount = data.powerBankCount ?? cab.powerBanks.length;
            const targetCount = Math.min(requestedCount, newTotalSlots);

            let pbs = [...cab.powerBanks];

            if (targetCount > pbs.length) {
              const toAdd = targetCount - pbs.length;
              const maxSlot =
                pbs.length > 0
                  ? Math.max(...pbs.map((p) => p.slotIndex))
                  : 0;
              for (let i = 0; i < toAdd; i++) {
                pbs.push({
                  id: `pb-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
                  slotIndex: maxSlot + 1 + i,
                  batteryLevel: Math.floor(Math.random() * 40) + 60,
                  status: "available",
                  lastReportTime: new Date().toISOString(),
                  movementHistory: [],
                });
              }
            } else if (targetCount < pbs.length) {
              const available = pbs.filter((p) => p.status === "available");
              const others = pbs.filter((p) => p.status !== "available");
              const keepAvailable = Math.max(
                targetCount - others.length,
                0
              );
              pbs = [...others, ...available.slice(0, keepAvailable)];
            }

            const finalAvailable = pbs.filter(
              (p) => p.status === "available"
            ).length;

            if (
              data.powerBankCount !== undefined &&
              data.powerBankCount !== pbs.length
            ) {
              result.adjusted = true;
            }
            if (
              data.totalSlots !== undefined &&
              data.totalSlots !== newTotalSlots
            ) {
              result.adjusted = true;
            }
            result.actualPowerBankCount = pbs.length;
            result.actualTotalSlots = newTotalSlots;

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
        });
        return result;
      },

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
        const pbNewStatus: PowerBank["status"] =
          pbBattery < threshold ? "needs_recycle" : "charging";

        let newMovements: PowerBankMovement[] = [];
        let updatedCabinets: Cabinet[];

        if (borrowCabinet && borrowCabinet.id === targetCabinet.id) {
          updatedCabinets = state.cabinets.map((cab) => {
            if (cab.id !== targetCabinet!.id) return cab;
            const updatedPBs = cab.powerBanks.map((p) =>
              p.id === rental.powerBankId
                ? {
                    ...p,
                    status: pbNewStatus,
                    batteryLevel: pbBattery,
                    lastReportTime: now.toISOString(),
                  }
                : p
            );
            const availableCount = updatedPBs.filter(
              (p) => p.status === "available"
            ).length;
            return {
              ...cab,
              powerBanks: updatedPBs,
              availableCount,
              lastHeartbeat: now.toISOString(),
            };
          });
        } else {
          let originalPBFromBorrow: PowerBank | null = null;

          updatedCabinets = state.cabinets.map((cab) => {
            if (cab.id === rental.cabinetId) {
              originalPBFromBorrow =
                cab.powerBanks.find((p) => p.id === rental.powerBankId) ||
                null;
              const filtered = cab.powerBanks.filter(
                (p) => p.id !== rental.powerBankId
              );
              const availableCount = filtered.filter(
                (p) => p.status === "available"
              ).length;
              return {
                ...cab,
                powerBanks: filtered,
                availableCount,
                lastHeartbeat: now.toISOString(),
              };
            }
            if (cab.id === targetCabinet!.id) {
              const maxSlot =
                cab.powerBanks.length > 0
                  ? Math.max(...cab.powerBanks.map((p) => p.slotIndex))
                  : 0;
              const prevHistory =
                originalPBFromBorrow?.movementHistory || [];

              const movement: PowerBankMovement = {
                id: `move-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                powerBankId: rental.powerBankId!,
                fromLocationId: borrowCabinet?.locationId || "",
                fromLocationName: borrowLoc?.name || "",
                fromCabinetId: borrowCabinet?.id || "",
                fromCabinetNo: borrowCabinet?.cabinetNo || "",
                toLocationId: targetCabinet!.locationId,
                toLocationName: returnLoc.name,
                toCabinetId: targetCabinet!.id,
                toCabinetNo: targetCabinet!.cabinetNo,
                movedAt: now.toISOString(),
                type: "rental_return",
              };
              newMovements.push(movement);

              const newPB: PowerBank = {
                id: rental.powerBankId!,
                slotIndex: maxSlot + 1,
                batteryLevel: pbBattery,
                status: pbNewStatus,
                lastReportTime: now.toISOString(),
                movementHistory: [...prevHistory, movement],
              };

              const newPBs = [...cab.powerBanks, newPB];
              const availableCount = newPBs.filter(
                (p) => p.status === "available"
              ).length;
              return {
                ...cab,
                powerBanks: newPBs,
                availableCount,
                lastHeartbeat: now.toISOString(),
              };
            }
            return cab;
          });
        }

        set((state) => ({
          cabinets: updatedCabinets,
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
          powerBankMovements: [...newMovements, ...state.powerBankMovements],
          locations: recalcLocationStats(state.locations, updatedCabinets),
        }));
        return true;
      },

      simulateDeviceReport: () => {
        const state = get();
        const threshold = state.systemThreshold.lowBatteryThreshold;
        const lowStockThreshold = state.systemThreshold.lowStockThreshold;
        let newTasks: MaintenanceTask[] = [];
        let newMovements: PowerBankMovement[] = [];

        let updatedCabinets = state.cabinets.map((cab) => {
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

        const activeLocations = state.locations.filter(
          (l) => l.status === "active"
        );
        if (
          Math.random() < 0.4 &&
          activeLocations.length >= 2
        ) {
          const onlineCabs = updatedCabinets.filter(
            (c) => c.status === "online" && c.powerBanks.length > 0
          );
          const fromCabs = onlineCabs.filter(
            (c) => c.powerBanks.some((p) => p.status === "available")
          );
          const toCabs = onlineCabs.filter(
            (c) => c.powerBanks.length < c.totalSlots
          );

          if (fromCabs.length > 0 && toCabs.length > 0) {
            const fromCab = fromCabs[Math.floor(Math.random() * fromCabs.length)];
            let toCab = toCabs[Math.floor(Math.random() * toCabs.length)];
            
            let attempts = 0;
            while (toCab.locationId === fromCab.locationId && attempts < 10) {
              toCab = toCabs[Math.floor(Math.random() * toCabs.length)];
              attempts++;
            }

            if (toCab.locationId !== fromCab.locationId) {
              const availablePBs = fromCab.powerBanks.filter(
                (p) => p.status === "available"
              );
              if (availablePBs.length > 0) {
                const movedPB =
                  availablePBs[
                    Math.floor(Math.random() * availablePBs.length)
                  ];

                const fromLoc = state.locations.find(
                  (l) => l.id === fromCab.locationId
                );
                const toLoc = state.locations.find(
                  (l) => l.id === toCab.locationId
                );

                const movement: PowerBankMovement = {
                  id: `move-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  powerBankId: movedPB.id,
                  fromLocationId: fromCab.locationId,
                  fromLocationName: fromLoc?.name || "",
                  fromCabinetId: fromCab.id,
                  fromCabinetNo: fromCab.cabinetNo,
                  toLocationId: toCab.locationId,
                  toLocationName: toLoc?.name || "",
                  toCabinetId: toCab.id,
                  toCabinetNo: toCab.cabinetNo,
                  movedAt: new Date().toISOString(),
                  type: "manual_transfer",
                };
                newMovements.push(movement);

                updatedCabinets = updatedCabinets.map((cab) => {
                  if (cab.id === fromCab.id) {
                    const newPBs = cab.powerBanks.filter(
                      (p) => p.id !== movedPB.id
                    );
                    return {
                      ...cab,
                      powerBanks: newPBs,
                      availableCount:
                        cab.availableCount - 1,
                      lastHeartbeat: new Date().toISOString(),
                    };
                  }
                  if (cab.id === toCab.id) {
                    const maxSlot =
                      cab.powerBanks.length > 0
                        ? Math.max(
                            ...cab.powerBanks.map((p) => p.slotIndex)
                          )
                        : 0;
                    const newPB: PowerBank = {
                      ...movedPB,
                      slotIndex: maxSlot + 1,
                      lastReportTime: new Date().toISOString(),
                      movementHistory: [
                        ...(movedPB.movementHistory || []),
                        movement,
                      ],
                    };
                    return {
                      ...cab,
                      powerBanks: [...cab.powerBanks, newPB],
                      availableCount:
                        cab.availableCount + 1,
                      lastHeartbeat: new Date().toISOString(),
                    };
                  }
                  return cab;
                });
              }
            }
          }
        }

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
          powerBankMovements: [...newMovements, ...state.powerBankMovements],
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
