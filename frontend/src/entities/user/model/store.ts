import { create } from "zustand";
import { api, tokenStore, AUTH_EXPIRED_EVENT } from "@/shared/api";
import type { AuthResponse, User } from "@/shared/api";

interface UserState {
  user: User | null;
  /** false, пока не проверили сохранённый токен */
  ready: boolean;

  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  setSession: (res: AuthResponse) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  ready: false,

  init: async () => {
    if (!tokenStore.get()) {
      set({ ready: true });
      return;
    }
    try {
      set({ user: await api.me(), ready: true });
    } catch {
      tokenStore.set(null);
      set({ user: null, ready: true });
    }
  },

  login: async (email, password) => get().setSession(await api.login({ email, password })),

  register: async (name, email, password) =>
    get().setSession(await api.register({ name, email, password })),

  setSession: (res) => {
    tokenStore.set(res.token);
    set({ user: res.user, ready: true });
  },

  logout: () => {
    tokenStore.set(null);
    set({ user: null });
  },
}));

if (typeof window !== "undefined") {
  window.addEventListener(AUTH_EXPIRED_EVENT, () => useUserStore.setState({ user: null }));
}
