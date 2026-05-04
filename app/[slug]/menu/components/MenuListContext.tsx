"use client";

import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from "react";

export type SelectedModifier = {
  modifierId:   string;
  modifierName: string;
  optionIds:    string[];
  optionNames:  string[];
};

export type ListItem = {
  key:        string;
  itemId:     string;
  name:       string;
  emoji:      string | null;
  basePrice:  number;
  totalPrice: number;
  quantity:   number;
  modifiers:  SelectedModifier[];
  note:       string;
};

type State = { items: ListItem[] };

type Action =
  | { type: "ADD_ITEM";        payload: Omit<ListItem, "key"> }
  | { type: "REMOVE_ITEM";     payload: { key: string } }
  | { type: "UPDATE_NOTE";     payload: { key: string; note: string } }
  | { type: "UPDATE_QUANTITY"; payload: { key: string; quantity: number } }
  | { type: "CLEAR_LIST" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_ITEM":
      return {
        items: [...state.items, { ...action.payload, key: `${action.payload.itemId}-${Date.now()}` }],
      };
    case "REMOVE_ITEM":
      return { items: state.items.filter((i) => i.key !== action.payload.key) };
    case "UPDATE_NOTE":
      return {
        items: state.items.map((i) =>
          i.key === action.payload.key ? { ...i, note: action.payload.note } : i
        ),
      };
    case "UPDATE_QUANTITY": {
      const qty = Math.max(1, action.payload.quantity);
      return {
        items: state.items.map((i) =>
          i.key === action.payload.key ? { ...i, quantity: qty } : i
        ),
      };
    }
    case "CLEAR_LIST":
      return { items: [] };
  }
}

type ContextValue = {
  items:      ListItem[];
  dispatch:   Dispatch<Action>;
  totalItems: number;
  subtotal:   number;
};

const MenuListContext = createContext<ContextValue | null>(null);

export function MenuListProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });

  return (
    <MenuListContext.Provider
      value={{
        items:      state.items,
        dispatch,
        totalItems: state.items.reduce((sum, i) => sum + i.quantity, 0),
        subtotal:   state.items.reduce((sum, i) => sum + i.totalPrice * i.quantity, 0),
      }}
    >
      {children}
    </MenuListContext.Provider>
  );
}

export function useMenuList(): ContextValue {
  const ctx = useContext(MenuListContext);
  if (!ctx) throw new Error("useMenuList must be used within MenuListProvider");
  return ctx;
}
