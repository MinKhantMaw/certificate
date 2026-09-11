import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  FileBadge,
  Upload,
  History,
  Users,
  Settings,
  LogOut,
  Menu,
  ClipboardList,
  Palette,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { storage } from "../services/storage";

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = storage.getUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    storage.logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    {
      to: "/document-templates",
      icon: Palette,
      label: "Templates",
    },
    { to: "/documents", icon: FileBadge, label: "Documents" },
    { to: "/import", icon: Upload, label: "Import Excel" },
    { to: "/imports", icon: History, label: "Import History" },
    // { to: "/users", icon: Users, label: "Users" },
    ...(user?.role === "APPROVER"
      ? [
          // {
          //   to: "/approvals/imports",
          //   icon: ShieldCheck,
          //   label: "Import Approvals",
          // },
          // {
          //   to: "/approvals",
          //   icon: ShieldCheck,
          //   label: "Document Approvals",
          // },
        ]
      : []),
    // { to: "/profile", icon: UserRound, label: "My Signature" },
    // { to: "/settings", icon: Settings, label: "Settings" },
  ];

  const pageTitle =
    navItems.find((item) => location.pathname.startsWith(item.to))?.label ||
    "Dashboard";

  return (
    <div className="flex min-h-screen bg-[#f4f7fb] font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-[#d9e3f0] bg-[#002c76] text-white md:flex md:flex-col">
        <div className="h-16 flex items-center px-6 border-b border-white/15">
          <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#e11e26] text-white">
            <FileBadge className="w-5 h-5" />
          </span>
          <span className="font-bold text-lg tracking-tight">Kanva</span>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-white text-[#002c76]"
                      : "text-blue-100 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-[#d9e3f0] flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
                 className="-ml-2 p-2 text-[#0054a6] hover:text-[#003f82] md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 ml-2 md:ml-0">
              {pageTitle}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center text-sm">
              <div className="w-8 h-8 bg-[#e11e26] text-white rounded-full flex items-center justify-center font-bold mr-2">
                {user?.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">{user?.name}</span>
                <span className="text-xs text-gray-500">{user?.email}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-[#0054a6] transition-colors rounded-full hover:bg-[#e9f1fb]"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main scrollable area */}
        {mobileMenuOpen && (
          <div className="border-b border-[#d9e3f0] bg-[#002c76] p-3 md:hidden">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                      isActive
                        ? "bg-white text-[#002c76]"
                        : "text-blue-100 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <item.icon className="mr-3 h-5 w-5 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        <main className="min-w-0 flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
