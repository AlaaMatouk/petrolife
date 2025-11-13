import { useEffect, useRef } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './routes';
import { GlobalStateProvider, useGlobalState } from './context/GlobalStateContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { ToastContainer } from './components/shared/Toast';
import { AuthListener } from './components/AuthListener';
import './App.css'

const THEME_STORAGE_KEY = 'petrolife-theme';

const ThemeManager = () => {
  const { state, dispatch } = useGlobalState();
  const { theme } = state;
  const didHydrateRef = useRef(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'dark' || storedTheme === 'light') {
      dispatch({ type: 'SET_THEME', payload: storedTheme });
    }
  }, [dispatch]);

  useEffect(() => {
    if (!didHydrateRef.current) {
      didHydrateRef.current = true;
      return;
    }
    const root = document.documentElement;
    const body = document.body;
    root.dataset.theme = theme;
    root.dataset.colorModeMode = theme;
    body.dataset.theme = theme;
    body.dataset.colorModeMode = theme;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return null;
};

function AppContent() {
  const { toasts, removeToast } = useToast();

  return (
    <>
      <ThemeManager />
      <AppRouter />
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <GlobalStateProvider>
        <AuthListener>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AuthListener>
      </GlobalStateProvider>
    </BrowserRouter>
  );
}

export default App
