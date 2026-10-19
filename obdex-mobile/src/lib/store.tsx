import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';

export type Plan = 'bronze' | 'silver' | 'gold';
export type ThemePref = 'dark' | 'light' | 'system';

export type User = { name: string; email?: string; gender?: string };
export type Car = { reg: string; make: string; model: string; colour?: string; year?: number; addedAt: string };
export type ChecklistItem = { id: string; text: string; link?: string; done: boolean };
export type Checklist = { id: string; name: string; items: ChecklistItem[] };

export type State = {
  hydrated: boolean;
  onboarded: boolean;
  user: User | null;
  plan: Plan;
  theme: ThemePref;
  garage: Car[];
  checklists: Checklist[];
  lastService: Record<string, string>;
  recent: string[];
};

const STORAGE_KEY = 'obdex.state.v1';

export const DEFAULT_CHECKLIST: Checklist = {
  id: 'default',
  name: 'Car Project 1',
  items: [
    { id: 'i1', text: 'Check oil level', link: 'https://www.youtube.com/results?search_query=how+to+check+car+oil+level', done: false },
    { id: 'i2', text: 'Check for any leaks', link: 'https://www.youtube.com/results?search_query=how+to+check+used+car+for+leaks', done: false },
    { id: 'i3', text: 'Check tyre tread depth (1.6mm minimum)', done: false },
    { id: 'i4', text: 'Match the VIN on the car to the V5C logbook', done: false },
    { id: 'i5', text: 'Check the service history stamps and receipts', done: false },
    { id: 'i6', text: 'Test drive: brakes, clutch and gearbox', done: false },
  ],
};

const initial: State = {
  hydrated: false,
  onboarded: false,
  user: null,
  plan: 'bronze',
  theme: 'dark',
  garage: [],
  checklists: [DEFAULT_CHECKLIST],
  lastService: {},
  recent: [],
};

type Action =
  | { type: 'hydrate'; state: Partial<State> }
  | { type: 'onboarded' }
  | { type: 'signIn'; user: User }
  | { type: 'signOut' }
  | { type: 'plan'; plan: Plan }
  | { type: 'theme'; theme: ThemePref }
  | { type: 'addCar'; car: Car }
  | { type: 'removeCar'; reg: string }
  | { type: 'lastService'; reg: string; value: string }
  | { type: 'recent'; reg: string }
  | { type: 'addChecklist'; list: Checklist }
  | { type: 'deleteChecklist'; id: string }
  | { type: 'addItem'; listId: string; item: ChecklistItem }
  | { type: 'toggleItem'; listId: string; itemId: string }
  | { type: 'removeItem'; listId: string; itemId: string };

function mapList(s: State, id: string, fn: (l: Checklist) => Checklist): State {
  return { ...s, checklists: s.checklists.map((l) => (l.id === id ? fn(l) : l)) };
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'hydrate': return { ...s, ...a.state, hydrated: true };
    case 'onboarded': return { ...s, onboarded: true };
    case 'signIn': return { ...s, user: a.user };
    case 'signOut': return { ...s, user: null };
    case 'plan': return { ...s, plan: a.plan };
    case 'theme': return { ...s, theme: a.theme };
    case 'addCar': return { ...s, garage: [a.car, ...s.garage.filter((c) => c.reg !== a.car.reg)] };
    case 'removeCar': return { ...s, garage: s.garage.filter((c) => c.reg !== a.reg) };
    case 'lastService': return { ...s, lastService: { ...s.lastService, [a.reg]: a.value } };
    case 'recent': return { ...s, recent: [a.reg, ...s.recent.filter((r) => r !== a.reg)].slice(0, 8) };
    case 'addChecklist': return { ...s, checklists: [...s.checklists, a.list] };
    case 'deleteChecklist': {
      const rest = s.checklists.filter((l) => l.id !== a.id);
      return { ...s, checklists: rest.length ? rest : [{ ...DEFAULT_CHECKLIST, items: [] }] };
    }
    case 'addItem': return mapList(s, a.listId, (l) => ({ ...l, items: [...l.items, a.item] }));
    case 'toggleItem': return mapList(s, a.listId, (l) => ({ ...l, items: l.items.map((i) => (i.id === a.itemId ? { ...i, done: !i.done } : i)) }));
    case 'removeItem': return mapList(s, a.listId, (l) => ({ ...l, items: l.items.filter((i) => i.id !== a.itemId) }));
  }
}

const StoreContext = createContext<{ state: State; dispatch: (a: Action) => void }>({ state: initial, dispatch: () => {} });

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => dispatch({ type: 'hydrate', state: raw ? JSON.parse(raw) : {} }))
      .catch(() => dispatch({ type: 'hydrate', state: {} }));
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    const { hydrated, ...persisted } = state;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted)).catch(() => {});
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}

export const uid = () => Math.random().toString(36).slice(2, 10);
