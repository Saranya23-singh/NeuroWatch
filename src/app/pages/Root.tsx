import { NavLink, Outlet } from "react-router";
import { 
  LayoutDashboard, 
  Footprints, 
  Mic, 
  Watch, 
  History, 
  User, 
  Calendar, 
  LifeBuoy, 
  Lightbulb,
  Activity
} from "lucide-react";

const navItems = [
  { to: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "gait", icon: Footprints, label: "Gait Analysis" },
  { to: "voice", icon: Mic, label: "Voice Analysis" },
  { to: "smartwatch", icon: Watch, label: "Smartwatch" },
  { to: "lifestyle", icon: Activity, label: "Lifestyle" },
  { to: "history", icon: History, label: "History" },
  { to: "profile", icon: User, label: "Profile" },
  { to: "appointments", icon: Calendar, label: "Appointments" },
  { to: "support", icon: LifeBuoy, label: "Support" },
  { to: "suggestions", icon: Lightbulb, label: "Suggestions" },
];

export function Root() {
  return (
    <div className="app-layout">
      {/* Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Activity size={22} color="white" />
          </div>
          <h3>NeuroWatch</h3>
        </div>

        <div className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Page Content */}
      <main className="main-content">
        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

