/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

import { AdminProvider } from './context/adminContext';
import { MainLayout } from './layout/MainLayout';
import { DashboardRouter } from './routes/DashboardRoutes';
import { getAllUsers, getMyProfile } from './service/userService';
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

      const userIdFromQuery = getUserIdFromQuery();
      const userIdFromStorage = localStorage.getItem('eo_user_id');
      let userId = userIdFromQuery || userIdFromStorage;

      const loadProfile = async (id: string) => {
        const profile = await getMyProfile(id);
        setcurrentUser(profile);
        setCurrentRole(profile.role);
        localStorage.setItem('eo_user_id', profile.id);
        localStorage.setItem('eo_user_role', profile.role);
      };

      try {
        if (userId) {
          await loadProfile(userId);
          return;
        }

        const users = await getAllUsers();
        const firstUser = users?.[0];
        if (!firstUser?.id) {
          setError('Không có user trong DB. Hãy seed users trước.');
          return;
        }

        await loadProfile(firstUser.id);
      } catch (profileError: any) {
        // Fallback: userId không tồn tại/404 -> lấy user đầu tiên
        try {
          const users = await getAllUsers();
          const firstUser = users?.[0];
          if (!firstUser?.id) {
            setError(profileError?.message || 'Failed to load user');
            return;
          }

          await loadProfile(firstUser.id);
        } catch (fallbackError: any) {
          console.error(fallbackError);
          setError(fallbackError?.message || 'Failed to load user');
        }
      }

    } catch (err) {
      console.error(err);
      setError('Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  init();
}, []);

  // Show loading state
  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Show error state
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


