import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, Dumbbell, History, BarChart2, User } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  // Hide nav on active workout session to prevent accidental exit
  const isSession = location.pathname === '/session';

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link to={to} className={`flex flex-col items-center justify-center space-y-1 w-full h-full ${isActive ? 'text-lime-400' : 'text-neutral-500'}`}>
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        {/* <span className="text-[10px] font-medium">{label}</span> */}
      </Link>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-white max-w-md mx-auto relative overflow-hidden shadow-2xl">
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24 relative">
        {children}
      </main>

      {!isSession && (
        <nav className="absolute bottom-0 left-0 right-0 h-20 bg-neutral-950/90 backdrop-blur-md border-t border-neutral-800 flex items-center justify-around pb-2 z-50">
            <NavItem to="/" icon={Home} label="Home" />
            <NavItem to="/history" icon={History} label="History" />
            <NavItem to="/exercises" icon={Dumbbell} label="Exercises" />
            <NavItem to="/progress" icon={BarChart2} label="Progress" />
            <NavItem to="/profile" icon={User} label="Profile" />
        </nav>
      )}
    </div>
  );
};

export default Layout;
