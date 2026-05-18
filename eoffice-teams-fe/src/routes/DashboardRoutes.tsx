
import React from 'react';
import { Role, User } from '../models/user';
import { LeaderDashboard } from '../components/dashboards/LeaderDashboard';
import { ClericalDashboard } from '../components/dashboards/ClericalDashboard';
import { ManagerDashboard } from '../components/dashboards/ManagerDashboard';
import { AdminDashboard } from '../components/dashboards/AdminDashboard';

interface DashboardRouterProps {
  role: Role;
  user: User;
}

const SpecialistPlaceholder: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-text-main mb-2">Specialist Dashboard</h2>
      <p className="text-text-secondary">Coming soon - API integration in progress</p>
    </div>
  </div>
);

export const DashboardRouter: React.FC<DashboardRouterProps> = ({ role, user }) => {
  switch (role) {
    case 'CLERICAL': return <ClericalDashboard user={user} />;
    case 'LEADER': return <LeaderDashboard user={user} />;
    case 'MANAGER': return <ManagerDashboard user={user} />;
    case 'SPECIALIST': return <SpecialistPlaceholder />;
    case 'ADMIN': return <AdminDashboard user={user} />;
    default: return null;
  }
};
