import { useEffect, useRef } from "react";
import { HashRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { StatusBar } from "./components/StatusBar";
import { ToastHost } from "./components/Toast";
import { HomePage } from "./pages/HomePage";
import { OverviewPage } from "./pages/OverviewPage";
import { DimensionPage } from "./pages/DimensionPage";
import { CrossCheckPage } from "./pages/CrossCheckPage";
import { RawDataPage } from "./pages/RawDataPage";
import { RulesPage } from "./pages/RulesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { useStore, useTranslation } from "./stores/useStore";
import { useHotkeys } from "./hooks/useHotkeys";

function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleSidebar, report, theme, resolvedTheme, announcement } = useStore();
  const t = useTranslation();
  const mainRef = useRef<HTMLElement>(null);

  // Apply theme on mount and when resolved theme changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [resolvedTheme, theme]);

  useHotkeys();

  // Reset scroll + move focus to content area on navigation
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
      mainRef.current.focus({ preventScroll: true });
    }
  }, [location.pathname]);

  const PAGE_TITLES: Record<string, string> = {
    "/": t.pageTitles.home,
    "/overview": t.pageTitles.overview,
    "/alignment": t.pageTitles.alignment,
    "/model": t.pageTitles.model,
    "/likelihood": t.pageTitles.likelihood,
    "/topology": t.pageTitles.topology,
    "/support": t.pageTitles.support,
    "/bootstrap": t.pageTitles.bootstrap,
    "/consensus": t.pageTitles.consensus,
    "/runtime": t.pageTitles.runtime,
    "/cross-check": t.pageTitles.crossCheck,
    "/raw-data": t.pageTitles.rawData,
    "/rules": t.pageTitles.rules,
    "/settings": t.pageTitles.settings,
  };

  const showSidebar = location.pathname !== "/" || report !== null;
  const pageTitle = PAGE_TITLES[location.pathname] || "TreeDoctor";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 屏幕阅读器播报区（aria-live，路由切换/分析完成） */}
      <div aria-live="polite" role="status" className="sr-only">
        {announcement ?? pageTitle}
      </div>

      {showSidebar && (
        <Sidebar currentPath={location.pathname} onNavigate={navigate} />
      )}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title={pageTitle} onToggleSidebar={toggleSidebar} />
        <main
          ref={mainRef}
          className="flex-1 overflow-auto"
          tabIndex={-1}
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/alignment" element={<DimensionPage dimensionId="D1" />} />
            <Route path="/model" element={<DimensionPage dimensionId="D2" />} />
            <Route path="/likelihood" element={<DimensionPage dimensionId="D3" />} />
            <Route path="/topology" element={<DimensionPage dimensionId="D4" />} />
            <Route path="/support" element={<DimensionPage dimensionId="D5" />} />
            <Route path="/bootstrap" element={<DimensionPage dimensionId="D6" />} />
            <Route path="/consensus" element={<DimensionPage dimensionId="D7" />} />
            <Route path="/runtime" element={<DimensionPage dimensionId="D8" />} />
            <Route path="/cross-check" element={<CrossCheckPage />} />
            <Route path="/raw-data" element={<RawDataPage />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>
        <StatusBar />
      </div>
      <ToastHost />
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}

export default App;
