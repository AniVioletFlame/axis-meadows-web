// Chibidex save data, ported from ChibidexStore.swift. Persists to localStorage.

import { BASEMENT_GUARDIANS, ROSTER } from './data';

export interface Entry {
  chibiID: string;
  befriended: boolean;
  befriendedDate: string | null; // ISO timestamp
  encounterCount: number;
  isBuddy: boolean;
  friendshipCount: number;
}

export interface Storage {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

const SAVE_KEY = 'axis-meadows.chibidex.v1';

const blank = (id: string): Entry => ({
  chibiID: id, befriended: false, befriendedDate: null, encounterCount: 0, isBuddy: false, friendshipCount: 0,
});

export class Chibidex {
  entries: Record<string, Entry> = {};
  private listeners = new Set<() => void>();

  constructor(private storage: Storage | null = safeLocalStorage()) {
    this.load();
    for (const c of ROSTER) if (!this.entries[c.id]) this.entries[c.id] = blank(c.id);
    this.save();
  }

  onChange(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  entry(id: string): Entry {
    return this.entries[id] ?? blank(id);
  }

  markBefriended(id: string) {
    const e = this.entries[id] ?? blank(id);
    e.befriended = true;
    e.friendshipCount = Math.max(1, e.friendshipCount + 1);
    if (!e.befriendedDate) e.befriendedDate = new Date().toISOString();
    this.entries[id] = e;
    this.commit();
  }

  incrementEncounter(id: string) {
    const e = this.entries[id] ?? blank(id);
    e.encounterCount += 1;
    this.entries[id] = e;
    this.commit();
  }

  friendshipCount(id: string): number {
    return this.entry(id).friendshipCount;
  }

  unlockedStillCount(id: string): number {
    return Math.min(6, Math.floor(this.friendshipCount(id) / 100));
  }

  progressToNextStill(id: string): { current: number; target: number; percent: number } {
    const count = this.friendshipCount(id);
    const unlocked = this.unlockedStillCount(id);
    if (unlocked >= 6) return { current: 600, target: 600, percent: 1 };
    const current = count % 100;
    return { current, target: 100, percent: current / 100 };
  }

  giftBond(id: string, amount = 100) {
    const e = this.entries[id] ?? blank(id);
    e.befriended = true;
    e.friendshipCount = Math.min(600, Math.max(1, e.friendshipCount + amount));
    if (!e.befriendedDate) e.befriendedDate = new Date().toISOString();
    this.entries[id] = e;
    this.commit();
  }

  get totalFriendships(): number {
    return ROSTER.reduce((sum, c) => sum + this.friendshipCount(c.id), 0);
  }

  totalUnlockedStills(previewAll = false): number {
    if (previewAll) return ROSTER.length * 6;
    return ROSTER.reduce((sum, c) => sum + this.unlockedStillCount(c.id), 0);
  }

  setBuddy(id: string) {
    for (const e of Object.values(this.entries)) e.isBuddy = e.chibiID === id;
    this.commit();
  }

  get buddy(): Entry | undefined {
    return Object.values(this.entries).find((e) => e.isBuddy);
  }
  get befriendedCount() {
    return Object.values(this.entries).filter((e) => e.befriended).length;
  }
  get totalCount() {
    return Object.keys(this.entries).length;
  }
  get completion() {
    return this.totalCount ? this.befriendedCount / this.totalCount : 0;
  }
  get crestCount() {
    return BASEMENT_GUARDIANS.filter((id) => this.entry(id).befriended).length;
  }
  get starfallUnlocked() {
    return this.crestCount >= 4;
  }

  private commit() {
    this.save();
    for (const fn of this.listeners) fn();
  }

  private save() {
    try {
      this.storage?.setItem(SAVE_KEY, JSON.stringify(this.entries));
    } catch {
      /* storage may be full or blocked; the game still runs */
    }
  }

  private load() {
    try {
      const raw = this.storage?.getItem(SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as Record<string, Partial<Entry>>;
      for (const [id, e] of Object.entries(data)) {
        const entry = { ...blank(id), ...e, chibiID: id };
        if (entry.befriended && entry.friendshipCount <= 0) entry.friendshipCount = 1;
        this.entries[id] = entry;
      }
    } catch {
      this.entries = {};
    }
  }
}

export function safeLocalStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}
