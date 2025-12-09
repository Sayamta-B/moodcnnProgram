import { NavLink, useLocation } from "react-router-dom";



export default function SidebarLeft(props) {
  const location = useLocation();
  const isCreateRoute = location.pathname.startsWith("/create");

  const mainTabs = [
    { name: "Home", path: "/" },
    { name: "Create", path: "/create" },
  ];

  const extraTabs = [
    { name: "Photo", path: "/create/photo" },
    { name: "Journal", path: "/create/journal" },
  ];

  const baseClass =
    "block w-full rounded-lg px-4 py-2 text-left transition duration-200 no-underline";

  const activeClass = "bg-gray-100 font-semibold";
  const normalClass = "hover:bg-gray-50";

  return (
    <aside className="w-1/5 flex flex-col justify-between p-2 bg-white shadow-[3px_0_6px_rgba(0,0,0,0.1)] h-screen">
      <div>
        <h1 className="text-2xl font-bold mb-8 px-4 p-4">Mood</h1>

        <nav className="space-y-2">
          {/* --- Main Tabs --- */}
          {mainTabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={tab.path}
              className={({ isActive }) =>
                `${baseClass} ${isActive ? activeClass : normalClass}`
              }
            >
              {tab.name}
            </NavLink>
          ))}

          {/* --- Extra Tabs --- */}
          {isCreateRoute && (
            <div className="mt-4 pt-3 space-y-2 ml-4 border-l-2 border-gray-200">
              {extraTabs.map((tab) => (
                <NavLink
                  key={tab.name}
                  to={tab.path}
                  className={({ isActive }) =>
                    `${baseClass} text-sm ${
                      isActive ? activeClass : normalClass
                    }`
                  }
                >
                  {tab.name}
                </NavLink>
              ))}
            </div>
          )}
        </nav>
      </div>

      {/* --- Profile & Logout --- */}
      <div className="pt-4">
        <div className="flex items-center space-x-3 mb-3 px-4">
          <img
            src="https://i.pravatar.cc/100?img=5"
            alt="profile"
            className="w-10 h-10 rounded-full"
          />
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `${baseClass} ${isActive ? activeClass : normalClass} text-base`
            }
          >
            Profile
          </NavLink>
        </div>

        <button
          onClick={props.handleLogout}
          className="w-full text-left px-4 py-2 text-red-500 hover:text-red-700 rounded transition"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
