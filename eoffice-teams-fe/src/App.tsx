/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

import fakeData from './util/fake-data.json';
import { AdminProvider } from './context/adminContext';
import { MainLayout } from './layout/MainLayout';
import { DashboardRouter } from './routes/DashboardRoutes';
import { getMyProfile } from './service/userService';
import { User, Role } from './models/user';

export default function App() {
  const [currentUser, setcurrentUser] = useState<User>();
  const [currentRole, setCurrentRole] = useState<Role>();
  const [isInTeams, setIsInTeams] = useState(false);

  useEffect(() => {
    const currentUserFake = fakeData[0];
    const fakeId = currentUserFake.id;


    const fetchProfile = async () => {
      try {
        const profile = await getMyProfile(fakeId);
        const userData: User = {
          id: profile.data.id,
          fullName: profile.data.fullName,
          role: profile.data.role,
        };

        setcurrentUser(userData);
        setCurrentRole(userData.role);

      } catch (error) {
        console.error('Error fetching profile, using fake data:', error);
      }

    };
    fetchProfile();
  }, []);



  return (
    <AdminProvider>
      {currentUser && currentRole &&
        <MainLayout currentUser={currentUser} currentRole={currentRole}>
          <DashboardRouter role={currentRole} user={currentUser} />
        </MainLayout>
      }
    </AdminProvider>
  );
}


