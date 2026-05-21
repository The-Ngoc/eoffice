/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';

import { AdminProvider } from './context/adminContext';
import { MainLayout } from './layout/MainLayout';
import { DashboardRouter } from './routes/DashboardRoutes';
import { getAllUsers, getMyProfile } from './service/userService';
import { Role, User } from './models/user';

// Support for Teams SDK
declare global {
  interface Window {
    microsoftTeams?: unknown;
  }
}

const getUserIdFromQuery = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('userId');
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [isInTeams, setIsInTeams] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async (userId: string) => {
      const profile = await getMyProfile(userId);
      setCurrentUser(profile);
      setCurrentRole(profile.role);
      localStorage.setItem('eo_user_id', profile.id);
      localStorage.setItem('eo_user_role', profile.role);
    };

    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        const teamsDetected = typeof window !== 'undefined' && Boolean(window.microsoftTeams);
        setIsInTeams(teamsDetected);

        const queryUserId = getUserIdFromQuery();
        const cachedUserId = localStorage.getItem('eo_user_id');
        const userId = queryUserId || cachedUserId;

        if (userId) {
          try {
            await loadProfile(userId);
            return;
          } catch (profileError) {
            console.warn('Failed to load profile by userId, falling back to first user:', profileError);
          }
        }

        const users = await getAllUsers();
        const firstUser = users?.[0];

        if (!firstUser?.id) {
          setError('Không có user trong DB. Hãy seed users trước.');
          return;
        }

        await loadProfile(firstUser.id);
      } catch (err) {
        console.error(err);
        setError('Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
        <p>{error}</p>
      </div>
    );
  }

  if (currentUser && currentRole) {
    return (
      <AdminProvider>
        <MainLayout currentUser={currentUser} currentRole={currentRole}>
          <DashboardRouter role={currentRole} user={currentUser} />
        </MainLayout>
      </AdminProvider>
    );
  }

  return null;
}
