import { create } from 'zustand';
import { DEFAULT_AVATAR_ID } from '../utils/avatars';

/**
 * Store des comptes utilisateurs, persisté dans le localStorage.
 *
 * Le projet n'a pas de helper de persistance dédié : on suit donc la même
 * approche que `Desktop.tsx` (lecture/écriture manuelles encapsulées dans des
 * try/catch tolérants au mode privé / quota dépassé).
 */
const USERS_STORAGE_KEY = 'mid-2000-pc-users-v1';

export interface UserAccount {
  id: string;
  name: string;
  /** Identifiant d'avatar dans le catalogue `common/utils/avatars` */
  avatar: string;
  isAdmin?: boolean;
  /** Mot de passe cosmétique (pas de vraie sécurité) : présence = compte protégé. */
  password?: string;
}

interface PersistedUsers {
  users: UserAccount[];
}

const generateUserId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const createDefaultUsers = (): UserAccount[] => [
  {
    id: generateUserId(),
    name: 'Utilisateur',
    avatar: DEFAULT_AVATAR_ID,
    isAdmin: true,
  },
];

const isUserAccount = (value: unknown): value is UserAccount =>
  !!value &&
  typeof value === 'object' &&
  typeof (value as UserAccount).id === 'string' &&
  typeof (value as UserAccount).name === 'string' &&
  typeof (value as UserAccount).avatar === 'string';

const loadUsers = (): UserAccount[] => {
  if (typeof window === 'undefined') {
    return createDefaultUsers();
  }

  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      return createDefaultUsers();
    }

    const parsed = JSON.parse(raw) as PersistedUsers;
    if (!parsed || !Array.isArray(parsed.users)) {
      return createDefaultUsers();
    }

    const users = parsed.users.filter(isUserAccount);
    return users.length > 0 ? users : createDefaultUsers();
  } catch {
    return createDefaultUsers();
  }
};

const saveUsers = (users: UserAccount[]): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify({ users } satisfies PersistedUsers));
  } catch {
    // Ignore silencieusement les erreurs de stockage (mode privé / quota).
  }
};

export interface UsersState {
  users: UserAccount[];
  /** Compte actuellement connecté (null quand la session est fermée). */
  currentUserId: string | null;

  login: (id: string) => void;
  logout: () => void;

  addUser: (name: string, avatar?: string, isAdmin?: boolean) => void;
  renameUser: (id: string, name: string) => void;
  removeUser: (id: string) => void;
  setAvatar: (id: string, avatar: string) => void;
  setAccountType: (id: string, isAdmin: boolean) => void;
  /** Mot de passe cosmétique : chaîne vide = suppression du mot de passe. */
  setPassword: (id: string, password: string) => void;
}

export const useUsersStore = create<UsersState>((set, get) => {
  const initialUsers = loadUsers();
  saveUsers(initialUsers);

  return {
    users: initialUsers,
    currentUserId: null,

    login: (id) => {
      const exists = get().users.some((user) => user.id === id);
      if (exists) {
        set({ currentUserId: id });
      }
    },

    logout: () => set({ currentUserId: null }),

    addUser: (name, avatar = DEFAULT_AVATAR_ID, isAdmin = false) => {
      const trimmedName = name.trim();
      if (!trimmedName) return;

      const newUser: UserAccount = {
        id: generateUserId(),
        name: trimmedName,
        avatar,
        isAdmin,
      };

      set((state) => {
        const users = [...state.users, newUser];
        saveUsers(users);
        return { users };
      });
    },

    renameUser: (id, name) => {
      const trimmedName = name.trim();
      if (!trimmedName) return;

      set((state) => {
        const users = state.users.map((user) =>
          user.id === id ? { ...user, name: trimmedName } : user
        );
        saveUsers(users);
        return { users };
      });
    },

    removeUser: (id) => {
      set((state) => {
        // On empêche la suppression du dernier compte.
        if (state.users.length <= 1) {
          return state;
        }

        const users = state.users.filter((user) => user.id !== id);
        saveUsers(users);

        return {
          users,
          currentUserId: state.currentUserId === id ? null : state.currentUserId,
        };
      });
    },

    setAvatar: (id, avatar) => {
      set((state) => {
        const users = state.users.map((user) =>
          user.id === id ? { ...user, avatar } : user
        );
        saveUsers(users);
        return { users };
      });
    },

    setAccountType: (id, isAdmin) => {
      set((state) => {
        // On empêche de rétrograder le dernier administrateur en compte limité.
        if (!isAdmin) {
          const admins = state.users.filter((user) => user.isAdmin);
          if (admins.length <= 1 && admins[0]?.id === id) {
            return state;
          }
        }

        const users = state.users.map((user) =>
          user.id === id ? { ...user, isAdmin } : user
        );
        saveUsers(users);
        return { users };
      });
    },

    setPassword: (id, password) => {
      set((state) => {
        const users = state.users.map((user) =>
          user.id === id ? { ...user, password: password || undefined } : user
        );
        saveUsers(users);
        return { users };
      });
    },
  };
});

/** Hook réactif renvoyant le compte connecté (ou null). */
export const useCurrentUser = (): UserAccount | null =>
  useUsersStore((state) => state.users.find((user) => user.id === state.currentUserId) ?? null);
