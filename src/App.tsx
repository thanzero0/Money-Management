import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Landing } from './components/landing/Landing';
import { MonthView } from './components/month/MonthView';
import { DayView } from './components/daily/DayView';
import { ChartsView } from './components/charts/ChartsView';
import { SettingsView } from './components/settings/SettingsView';
import { ToastProvider } from './components/common/Toast';
import { useSettingsStore } from './stores/settingsStore';

export default function App() {
  const { loadSettings, isLoaded } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, []);

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker registration failed - that's ok for dev
      });
    }
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)] dark:bg-[var(--color-dark-bg)]">
        <div className="text-center animate-pulse-soft">
          <div className="w-12 h-12 bg-[var(--color-primary)] rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>L</span>
          </div>
          <p className="text-sm text-[var(--color-muted)]">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[var(--color-cream)] dark:bg-[var(--color-dark-bg)] transition-colors duration-300">
        <Navbar />
        <ToastProvider />

        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/month/:yearMonth" element={<MonthView />} />
          <Route path="/day/:date" element={<DayView />} />
          <Route path="/charts" element={<ChartsView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Routes>

        {/* Floating Quick Entry Button (mobile) */}
        <FloatingQuickButton />
      </div>
    </Router>
  );
}

function FloatingQuickButton() {
  // This is handled by the Navbar's QuickEntryModal via Ctrl+N
  // On mobile, we show a visible floating button
  return null; // The + button in navbar handles this
}
