import { Outlet } from 'react-router-dom';
import Sidebar  from '../components/shared/Sidebar';
import TopBar   from '../components/shared/TopBar';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
