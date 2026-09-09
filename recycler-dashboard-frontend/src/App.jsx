import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Package, CheckSquare, User, LayoutDashboard } from 'lucide-react';

import IncomingLots from './pages/IncomingLots';
import ConfirmHandover from './pages/ConfirmHandover';
import RecyclerProfile from './pages/RecyclerProfile';

function Sidebar() {
  const location = useLocation();

  const navItems = [
    { name: 'Incoming Lots', path: '/', icon: <Package className="w-5 h-5 mr-3" /> },
    { name: 'Confirm Handover', path: '/confirm', icon: <CheckSquare className="w-5 h-5 mr-3" /> },
    { name: 'Recycler Profile', path: '/profile', icon: <User className="w-5 h-5 mr-3" /> },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-6 flex items-center border-b border-gray-800">
        <LayoutDashboard className="w-6 h-6 mr-3 text-green-400" />
        <h1 className="text-xl font-bold">Kabadiwala Connect</h1>
      </div>
      <nav className="flex-1 py-6">
        <ul>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.name} className="px-4 py-2">
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-800">
        <div className="text-sm text-gray-400">Formal E-Waste Co.</div>
        <div className="text-xs text-gray-500">Authorized Recycler</div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="flex bg-gray-50 min-h-screen font-sans">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-8">
          <Routes>
            <Route path="/" element={<IncomingLots />} />
            <Route path="/confirm" element={<ConfirmHandover />} />
            <Route path="/profile" element={<RecyclerProfile />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
