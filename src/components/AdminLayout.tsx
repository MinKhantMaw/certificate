import { useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
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

  const handleLogout = () => {
    storage.logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    {
      to: "/training-programs",
      icon: ClipboardList,
      label: "Training Programs",
    },
    {
      to: "/certificate-templates",
      icon: Palette,
      label: "Certificate Templates",
    },
    { to: "/certificates", icon: FileBadge, label: "Certificates" },
    { to: "/import", icon: Upload, label: "Import Excel" },
    { to: "/imports", icon: History, label: "Import History" },
    { to: "/users", icon: Users, label: "Users" },
    ...(user?.role === "APPROVER"
      ? [
          {
            to: "/approvals/imports",
            icon: ShieldCheck,
            label: "Import Approvals",
          },
          {
            to: "/approvals",
            icon: ShieldCheck,
            label: "Certificate Approvals",
          },
        ]
      : []),
    { to: "/profile", icon: UserRound, label: "My Signature" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  // Initialize demo data
  useEffect(() => {
    storage.initDemoData();
  }, []);

  const pageTitle =
    navItems.find((item) => location.pathname.startsWith(item.to))?.label ||
    "Dashboard";

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <FileBadge className="w-6 h-6 text-blue-600 mr-2" />
          <span className="font-bold text-lg tracking-tight">Certifly</span>
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
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button className="md:hidden p-2 -ml-2 text-gray-400 hover:text-gray-500">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 ml-2 md:ml-0">
              {pageTitle}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center text-sm">
              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold mr-2">
                {user?.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">{user?.name}</span>
                <span className="text-xs text-gray-500">{user?.email}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
