import React, { createContext, useContext, useReducer, ReactNode } from "react";

// Types for our global state
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "admin" | "company" | "service-distributer";
}

export interface Company {
  id: string;
  name: string;
  brandName?: string;
  email: string;
  phoneNumber: string;
  balance: number;
  address?: string;
  location?: string;
  logo?: string;
  isActive: boolean;
  [key: string]: any; // For other company fields
}

export interface Driver {
  id: number;
  driverCode: string;
  driverName: string;
  phone: string;
  address: string;
  fuelType: string;
  financialValue: string;
  carNumber: string;
  carCategory: { text: string; icon: string | null };
  accountStatus: { active: boolean; text: string };
}

export interface Car {
  id: number;
  carNumber: string;
  carName: string;
  brand: string;
  model: string;
  year: string;
  fuelType: string;
  category: { name: string; icon: string } | null;
  drivers: Array<{
    name: string;
    avatar1: string;
    avatar2?: string;
    avatar3?: string;
  }>;
}

export interface Transaction {
  id: string;
  type: string;
  driver: string;
  date: string;
  amount: number;
  cumulative: number;
}

export interface Invoice {
  id: string;
  invoiceCode: string;
  clientName: string;
  clientType: string;
  date: string;
  invoiceNumber: string;
  amount: number;
  rawDate?: any;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
  read: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
  [key: string]: any;
}

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface FilterState {
  searchQuery: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  status: string;
  category: string;
}

// Global State Interface
export interface GlobalState {
  // User & Authentication
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Data
  drivers: Driver[];
  cars: Car[];
  transactions: Transaction[];
  invoices: Invoice[];
  notifications: Notification[];
  cart: CartItem[];

  // UI State
  sidebarCollapsed: boolean;
  theme: "light" | "dark";
  language: "ar" | "en";
  openDropdowns: Set<string>;

  // Pagination
  pagination: {
    drivers: PaginationState;
    cars: PaginationState;
    transactions: PaginationState;
    invoices: PaginationState;
  };

  // Filters
  filters: {
    drivers: FilterState;
    cars: FilterState;
    transactions: FilterState;
    invoices: FilterState;
  };

  // Error handling
  error: string | null;
}

// Action Types
export type GlobalAction =
  // Authentication
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_COMPANY"; payload: Company | null }
  | { type: "SET_AUTHENTICATED"; payload: boolean }
  | { type: "SET_LOADING"; payload: boolean }

  // Data Management
  | { type: "SET_DRIVERS"; payload: Driver[] }
  | { type: "ADD_DRIVER"; payload: Driver }
  | { type: "UPDATE_DRIVER"; payload: { id: number; updates: Partial<Driver> } }
  | { type: "DELETE_DRIVER"; payload: number }
  | { type: "SET_CARS"; payload: Car[] }
  | { type: "ADD_CAR"; payload: Car }
  | { type: "UPDATE_CAR"; payload: { id: number; updates: Partial<Car> } }
  | { type: "DELETE_CAR"; payload: number }
  | { type: "SET_TRANSACTIONS"; payload: Transaction[] }
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "SET_INVOICES"; payload: Invoice[] }
  | { type: "ADD_INVOICE"; payload: Invoice }
  | {
      type: "UPDATE_INVOICE";
      payload: { id: string; updates: Partial<Invoice> };
    }
  | { type: "DELETE_INVOICE"; payload: string }
  | { type: "SET_NOTIFICATIONS"; payload: Notification[] }
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "MARK_NOTIFICATION_READ"; payload: string }
  | { type: "CLEAR_NOTIFICATIONS" }
  | { type: "ADD_TO_CART"; payload: CartItem }
  | { type: "REMOVE_FROM_CART"; payload: string }
  | { type: "UPDATE_CART_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }

  // UI State
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_THEME"; payload: "light" | "dark" }
  | { type: "SET_LANGUAGE"; payload: "ar" | "en" }
  | { type: "TOGGLE_DROPDOWN"; payload: string }
  | { type: "SET_DROPDOWN"; payload: { section: string; isOpen: boolean } }

  // Pagination
  | {
      type: "SET_PAGINATION";
      payload: {
        type: "drivers" | "cars" | "transactions" | "invoices";
        pagination: PaginationState;
      };
    }
  | {
      type: "SET_CURRENT_PAGE";
      payload: {
        type: "drivers" | "cars" | "transactions" | "invoices";
        page: number;
      };
    }

  // Filters
  | {
      type: "SET_FILTER";
      payload: {
        type: "drivers" | "cars" | "transactions" | "invoices";
        filter: Partial<FilterState>;
      };
    }
  | {
      type: "CLEAR_FILTERS";
      payload: "drivers" | "cars" | "transactions" | "invoices";
    }

  // Error handling
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "CLEAR_ERROR" };

// Initial State
const initialState: GlobalState = {
  // User & Authentication
  user: null,
  company: null,
  isAuthenticated: false,
  isLoading: false,

  // Data
  drivers: [],
  cars: [],
  transactions: [],
  invoices: [],
  notifications: [],
  cart: [],

  // UI State
  sidebarCollapsed: false,
  theme: "light",
  language: "ar",
  openDropdowns: new Set<string>(),

  // Pagination
  pagination: {
    drivers: { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0 },
    cars: { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0 },
    transactions: {
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,
      totalPages: 0,
    },
    invoices: {
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,
      totalPages: 0,
    },
  },

  // Filters
  filters: {
    drivers: {
      searchQuery: "",
      dateRange: { start: null, end: null },
      status: "",
      category: "",
    },
    cars: {
      searchQuery: "",
      dateRange: { start: null, end: null },
      status: "",
      category: "",
    },
    transactions: {
      searchQuery: "",
      dateRange: { start: null, end: null },
      status: "",
      category: "",
    },
    invoices: {
      searchQuery: "",
      dateRange: { start: null, end: null },
      status: "",
      category: "",
    },
  },

  // Error handling
  error: null,
};

// Reducer Function
const globalReducer = (
  state: GlobalState,
  action: GlobalAction
): GlobalState => {
  switch (action.type) {
    // Authentication
    case "SET_USER":
      return { ...state, user: action.payload };
    case "SET_COMPANY":
      return { ...state, company: action.payload };
    case "SET_AUTHENTICATED":
      return { ...state, isAuthenticated: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    // Drivers
    case "SET_DRIVERS":
      return {
        ...state,
        drivers: action.payload,
        pagination: {
          ...state.pagination,
          drivers: {
            ...state.pagination.drivers,
            totalItems: action.payload.length,
            totalPages: Math.ceil(
              action.payload.length / state.pagination.drivers.itemsPerPage
            ),
          },
        },
      };
    case "ADD_DRIVER":
      return {
        ...state,
        drivers: [...state.drivers, action.payload],
        pagination: {
          ...state.pagination,
          drivers: {
            ...state.pagination.drivers,
            totalItems: state.drivers.length + 1,
            totalPages: Math.ceil(
              (state.drivers.length + 1) / state.pagination.drivers.itemsPerPage
            ),
          },
        },
      };
    case "UPDATE_DRIVER":
      return {
        ...state,
        drivers: state.drivers.map((driver) =>
          driver.id === action.payload.id
            ? { ...driver, ...action.payload.updates }
            : driver
        ),
      };
    case "DELETE_DRIVER":
      return {
        ...state,
        drivers: state.drivers.filter((driver) => driver.id !== action.payload),
        pagination: {
          ...state.pagination,
          drivers: {
            ...state.pagination.drivers,
            totalItems: state.drivers.length - 1,
            totalPages: Math.ceil(
              (state.drivers.length - 1) / state.pagination.drivers.itemsPerPage
            ),
          },
        },
      };

    // Cars
    case "SET_CARS":
      return {
        ...state,
        cars: action.payload,
        pagination: {
          ...state.pagination,
          cars: {
            ...state.pagination.cars,
            totalItems: action.payload.length,
            totalPages: Math.ceil(
              action.payload.length / state.pagination.cars.itemsPerPage
            ),
          },
        },
      };
    case "ADD_CAR":
      return {
        ...state,
        cars: [...state.cars, action.payload],
        pagination: {
          ...state.pagination,
          cars: {
            ...state.pagination.cars,
            totalItems: state.cars.length + 1,
            totalPages: Math.ceil(
              (state.cars.length + 1) / state.pagination.cars.itemsPerPage
            ),
          },
        },
      };
    case "UPDATE_CAR":
      return {
        ...state,
        cars: state.cars.map((car) =>
          car.id === action.payload.id
            ? { ...car, ...action.payload.updates }
            : car
        ),
      };
    case "DELETE_CAR":
      return {
        ...state,
        cars: state.cars.filter((car) => car.id !== action.payload),
        pagination: {
          ...state.pagination,
          cars: {
            ...state.pagination.cars,
            totalItems: state.cars.length - 1,
            totalPages: Math.ceil(
              (state.cars.length - 1) / state.pagination.cars.itemsPerPage
            ),
          },
        },
      };

    // Transactions
    case "SET_TRANSACTIONS":
      return {
        ...state,
        transactions: action.payload,
        pagination: {
          ...state.pagination,
          transactions: {
            ...state.pagination.transactions,
            totalItems: action.payload.length,
            totalPages: Math.ceil(
              action.payload.length / state.pagination.transactions.itemsPerPage
            ),
          },
        },
      };
    case "ADD_TRANSACTION":
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
        pagination: {
          ...state.pagination,
          transactions: {
            ...state.pagination.transactions,
            totalItems: state.transactions.length + 1,
            totalPages: Math.ceil(
              (state.transactions.length + 1) /
                state.pagination.transactions.itemsPerPage
            ),
          },
        },
      };

    // Invoices
    case "SET_INVOICES":
      return {
        ...state,
        invoices: action.payload,
        pagination: {
          ...state.pagination,
          invoices: {
            ...state.pagination.invoices,
            totalItems: action.payload.length,
            totalPages: Math.ceil(
              action.payload.length / state.pagination.invoices.itemsPerPage
            ),
          },
        },
      };
    case "ADD_INVOICE":
      return {
        ...state,
        invoices: [action.payload, ...state.invoices],
        pagination: {
          ...state.pagination,
          invoices: {
            ...state.pagination.invoices,
            totalItems: state.invoices.length + 1,
            totalPages: Math.ceil(
              (state.invoices.length + 1) /
                state.pagination.invoices.itemsPerPage
            ),
          },
        },
      };
    case "UPDATE_INVOICE":
      return {
        ...state,
        invoices: state.invoices.map((invoice) =>
          invoice.id === action.payload.id
            ? { ...invoice, ...action.payload.updates }
            : invoice
        ),
      };
    case "DELETE_INVOICE":
      return {
        ...state,
        invoices: state.invoices.filter(
          (invoice) => invoice.id !== action.payload
        ),
        pagination: {
          ...state.pagination,
          invoices: {
            ...state.pagination.invoices,
            totalItems: state.invoices.length - 1,
            totalPages: Math.ceil(
              (state.invoices.length - 1) /
                state.pagination.invoices.itemsPerPage
            ),
          },
        },
      };

    // Notifications
    case "SET_NOTIFICATIONS":
      return { ...state, notifications: action.payload };
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };
    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          notification.id === action.payload
            ? { ...notification, read: true }
            : notification
        ),
      };
    case "CLEAR_NOTIFICATIONS":
      return { ...state, notifications: [] };

    // Cart
    case "ADD_TO_CART":
      // Check if item already exists in cart
      const existingItemIndex = state.cart.findIndex(
        (item) => item.productId === action.payload.productId
      );
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        const updatedCart = [...state.cart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity:
            updatedCart[existingItemIndex].quantity + action.payload.quantity,
        };
        return { ...state, cart: updatedCart };
      } else {
        // Add new item to cart
        return { ...state, cart: [...state.cart, action.payload] };
      }
    case "REMOVE_FROM_CART":
      return {
        ...state,
        cart: state.cart.filter((item) => item.id !== action.payload),
      };
    case "UPDATE_CART_QUANTITY":
      return {
        ...state,
        cart: state.cart.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    case "CLEAR_CART":
      return { ...state, cart: [] };

    // UI State
    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case "SET_THEME":
      return { ...state, theme: action.payload };
    case "SET_LANGUAGE":
      return { ...state, language: action.payload };
    case "TOGGLE_DROPDOWN":
      const newDropdowns = new Set(state.openDropdowns);
      if (newDropdowns.has(action.payload)) {
        newDropdowns.delete(action.payload);
      } else {
        newDropdowns.add(action.payload);
      }
      return { ...state, openDropdowns: newDropdowns };
    case "SET_DROPDOWN":
      const updatedDropdowns = new Set(state.openDropdowns);
      if (action.payload.isOpen) {
        updatedDropdowns.add(action.payload.section);
      } else {
        updatedDropdowns.delete(action.payload.section);
      }
      return { ...state, openDropdowns: updatedDropdowns };

    // Pagination
    case "SET_PAGINATION":
      return {
        ...state,
        pagination: {
          ...state.pagination,
          [action.payload.type]: action.payload.pagination,
        },
      };
    case "SET_CURRENT_PAGE":
      return {
        ...state,
        pagination: {
          ...state.pagination,
          [action.payload.type]: {
            ...state.pagination[action.payload.type],
            currentPage: action.payload.page,
          },
        },
      };

    // Filters
    case "SET_FILTER":
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.type]: {
            ...state.filters[action.payload.type],
            ...action.payload.filter,
          },
        },
      };
    case "CLEAR_FILTERS":
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload]: {
            searchQuery: "",
            dateRange: { start: null, end: null },
            status: "",
            category: "",
          },
        },
      };

    // Error handling
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "CLEAR_ERROR":
      return { ...state, error: null };

    default:
      return state;
  }
};

// Context
const GlobalStateContext = createContext<{
  state: GlobalState;
  dispatch: React.Dispatch<GlobalAction>;
} | null>(null);

// Provider Component
export const GlobalStateProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(globalReducer, initialState);

  return (
    <GlobalStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

// Custom Hook to use the context
export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error("useGlobalState must be used within a GlobalStateProvider");
  }
  return context;
};

// Export the context for direct access if needed
export { GlobalStateContext };
