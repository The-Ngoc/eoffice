/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

import { AdminProvider } from './context/adminContext';
import { MainLayout } from './layout/MainLayout';
import { DashboardRouter } from './routes/DashboardRoutes';
import { getMyProfile } from './service/userService';
import { User, Role } from './models/user';

// Support for Teams SDK
declare global {
  interface Window {
    microsoftTeams?: any;
  }
}

export default function App() {
  const [currentUser, setcurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [isInTeams, setIsInTeams] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect(() => {
  //   const initializeApp = async () => {
  //     try {
  //       setLoading(true);
        
  //       // Check if running inside Teams
  //       const teamsDetected = !!window.microsoftTeams;
  //       setIsInTeams(teamsDetected);

  //       // Get user ID from Teams context or localStorage
  //       let userId = localStorage.getItem('eo_user_id');
        
  //       if (teamsDetected && window.microsoftTeams?.getContext) {
  //         try {
  //           const context = await new Promise((resolve) => {
  //             window.microsoftTeams.getContext((context: any) => {
  //               resolve(context);
  //             });
  //           });
  //           const teamsContext = context as any;
  //           // Teams provides user ID in context
  //           userId = teamsContext?.userPrincipalName || teamsContext?.userId || userId;
  //         } catch (teamError) {
  //           console.warn('Failed to get Teams context:', teamError);
  //         }
  //       }

  //       // If no user ID found, show error
  //       if (!userId) {
  //         setError('Unable to identify user. Please ensure you are logged in.');
  //         setLoading(false);
  //         return;
  //       }

  //       // Fetch user profile from backend
  //       const profile = await getMyProfile(userId);
  //       setcurrentUser(profile);
  //       setCurrentRole(profile.role);
  //       localStorage.setItem('eo_user_id', profile.id);
  //       localStorage.setItem('eo_user_role', profile.role);
        
  //     } catch (error) {
  //       console.error('Error initializing app:', error);
  //       setError('Failed to load user profile. Please try again.');
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   initializeApp();
  // }, []);

  // // Show loading state
  // if (loading) {
  //   return (
  //     <div style={{ padding: '20px', textAlign: 'center' }}>
  //       <p>Loading...</p>
  //     </div>
  //   );
  // }

  // // Show error state
  // if (error) {
  //   return (
  //     <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
  //       <p>{error}</p>
  //     </div>
  //   );
  // }

  // // Show main app if user loaded
  // if (currentUser && currentRole) {
  //   return (
  //     <AdminProvider>
  //       <MainLayout currentUser={currentUser} currentRole={currentRole}>
  //         <DashboardRouter role={currentRole} user={currentUser} />
  //       </MainLayout>
  //     </AdminProvider>
  //   );
  // }

  const getUserIdFromQuery = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('userId');
};

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        const userId = getUserIdFromQuery();

        if (!userId) {
          setError('Missing userId in URL');
          return;
        }

        const profile = await getMyProfile(userId);

        setcurrentUser(profile);
        setCurrentRole(profile.role);
        localStorage.setItem('eo_user_id', profile.id);
        localStorage.setItem('eo_user_role', profile.role);
      } catch (err) {
        console.error(err);
        setError('Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

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
