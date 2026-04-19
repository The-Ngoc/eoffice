
import React from 'react';
import { Role, User } from '../models/user';
import { LeaderDashboard } from '../components/dashboards/LeaderDashboard';
import { ClericalDashboard } from '../components/dashboards/ClericalDashboard';
import { ManagerDashboard } from '../components/dashboards/ManagerDashboard';
import { SpecialistDashboard } from '../components/dashboards/SpecialistDashboard';
import { AdminDashboard } from '../components/dashboards/AdminDashboard';

interface DashboardRouterProps {
  role: Role;
  user: User;
}

export const DashboardRouter: React.FC<DashboardRouterProps> = ({ role, user }) => {
  switch (role) {
    case 'CLERICAL': return <ClericalDashboard user={user} />;
    case 'LEADER': return <LeaderDashboard user={user} />;
    case 'MANAGER': return <ManagerDashboard user={user} />;
    case 'SPECIALIST': return <SpecialistDashboard user={user} />;
    case 'ADMIN': return <AdminDashboard user={user} />;
    default: return null;
  }
};
