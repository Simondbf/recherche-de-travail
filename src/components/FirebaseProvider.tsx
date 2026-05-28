import React, { createContext, useContext, useState, useEffect } from 'react';
import { JobApplication, UserStats } from '../types';

interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  applications: JobApplication[];
  friendsStats: UserStats[];
  isDemoMode: boolean;
  loginSovereign: (email: string, password: string) => Promise<void>;
  registerSovereign: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccountSovereign: () => Promise<void>;
  addJobApplication: (app: Omit<JobApplication, 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateJobApplication: (id: string, updates: Partial<JobApplication>) => Promise<void>;
  deleteJobApplication: (id: string) => Promise<void>;
  triggerDemoMode: (name: string) => void;
  syncStats: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [friendsStats, setFriendsStats] = useState<UserStats[]>([]);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('protrack_token');
      const storedUser = localStorage.getItem('protrack_user');
      const storedDemo = localStorage.getItem('protrack_demo');

      if (storedDemo === 'true') {
        setIsDemoMode(true);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        setLoading(false);
        return;
      }

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verify token with backend
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${storedToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            localStorage.setItem('protrack_user', JSON.stringify(data.user));
          } else {
            // Token expired, clear auth
            logout();
          }
        } catch (e) {
          console.warn("Backend unaccessible, keeping local session cache:", e);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Sync applications and stats when user/token changes
  useEffect(() => {
    if (isDemoMode) {
      if (!user) {
        setApplications([]);
        return;
      }
      const localApps = localStorage.getItem(`protrack_apps_local_${user.uid}`);
      if (localApps) {
        setApplications(JSON.parse(localApps));
      } else {
        const initialDemo: JobApplication[] = [
          {
            id: 'demo-1',
            userId: user.uid,
            title: 'Développeur Fullstack React',
            company: 'Vercel, Inc.',
            status: 'interviewing',
            location: 'Remote / Paris',
            url: 'https://vercel.com/careers',
            salary: '55k - 65k €',
            contacts: [{ id: 'c1', name: 'Nico Prada', email: 'hr@vercel.com', role: 'RH' }],
            notes: 'Lettre de relance à faire à la fin de la semaine. Entretien technique validé.',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'demo-2',
            userId: user.uid,
            title: 'Chef de Produit IA',
            company: 'Google AI France',
            status: 'to_apply',
            location: 'Paris Office',
            salary: '75k - 85k €',
            notes: 'Fiche de poste intéressante. Préparer une démo de projet utilisant Gemini-3.5.',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        localStorage.setItem(`protrack_apps_local_${user.uid}`, JSON.stringify(initialDemo));
        setApplications(initialDemo);
      }
      return;
    }

    if (!token || !user) {
      setApplications([]);
      setFriendsStats([]);
      return;
    }

    // Fetch lists and stats in real-time
    const loadData = async () => {
      try {
        const appsRes = await fetch('/api/applications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          setApplications(appsData);
        }

        const statsRes = await fetch('/api/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setFriendsStats(statsData);
        }
      } catch (err) {
        console.error("Erreur de synchronisation avec le cloud souverain européen:", err);
      }
    };

    loadData();
    // Refresh stats every 30 seconds for collaborative feel
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [token, user, isDemoMode]);

  // Sync simulated guest list for collaborative demo experience
  useEffect(() => {
    if (isDemoMode && user) {
      const mockPeers: UserStats[] = [
        {
          userId: 'guest-alex',
          displayName: 'Alexandre G.',
          photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=alex',
          totalApplied: 9,
          totalInterviewing: 2,
          totalOffers: 1,
          lastActive: new Date().toISOString()
        },
        {
          userId: 'guest-sarah',
          displayName: 'Sarah Loir',
          photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=sarah',
          totalApplied: 14,
          totalInterviewing: 4,
          totalOffers: 0,
          lastActive: new Date(Date.now() - 3600000).toISOString()
        }
      ];
      
      const userTotalApplied = applications.filter(a => ['applied', 'interviewing', 'offer'].includes(a.status)).length;
      const userTotalInterviewing = applications.filter(a => a.status === 'interviewing').length;
      const userTotalOffers = applications.filter(a => a.status === 'offer').length;

      const userStatBlock: UserStats = {
        userId: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        totalApplied: userTotalApplied,
        totalInterviewing: userTotalInterviewing,
        totalOffers: userTotalOffers,
        lastActive: new Date().toISOString()
      };

      setFriendsStats([userStatBlock, ...mockPeers]);
    }
  }, [isDemoMode, user, applications]);

  const syncStats = async () => {
    if (!token || isDemoMode) return;
    try {
      const statsRes = await fetch('/api/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        setFriendsStats(await statsRes.json());
      }
    } catch (e) {
      console.warn("Erreur de synchronisation des stats: ", e);
    }
  };

  const loginSovereign = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Identifiants de connexion invalides.");
    }
    
    setToken(data.token);
    setUser(data.user);
    setIsDemoMode(false);
    localStorage.setItem('protrack_token', data.token);
    localStorage.setItem('protrack_user', JSON.stringify(data.user));
    localStorage.removeItem('protrack_demo');
  };

  const registerSovereign = async (email: string, password: string, displayName: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Erreur lors de la création du compte.");
    }

    setToken(data.token);
    setUser(data.user);
    setIsDemoMode(false);
    localStorage.setItem('protrack_token', data.token);
    localStorage.setItem('protrack_user', JSON.stringify(data.user));
    localStorage.removeItem('protrack_demo');
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setIsDemoMode(false);
    localStorage.removeItem('protrack_token');
    localStorage.removeItem('protrack_user');
    localStorage.removeItem('protrack_demo');
  };

  const deleteAccountSovereign = async () => {
    if (!token) return;
    try {
      await fetch('/api/auth/me', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } finally {
      logout();
    }
  };

  const triggerDemoMode = (name: string) => {
    const uid = 'guest-' + Math.random().toString(36).substring(2, 9);
    const demoUser = {
      uid,
      displayName: name,
      email: `${uid}@demo.local`,
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${uid}`
    };

    setIsDemoMode(true);
    setUser(demoUser);
    localStorage.setItem('protrack_demo', 'true');
    localStorage.setItem('protrack_user', JSON.stringify(demoUser));
    localStorage.removeItem('protrack_token');
  };

  // Sovereign operations writing back directly to the European hosted database
  const addJobApplication = async (app: Omit<JobApplication, 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      throw new Error("Action impossible sans authentification");
    }

    if (isDemoMode) {
      const id = 'job-' + Math.random().toString(36).substring(2, 9);
      const now = new Date().toISOString();
      const newApp: JobApplication = {
        ...app,
        id,
        userId: user.uid,
        createdAt: now,
        updatedAt: now
      };
      const list = [newApp, ...applications];
      localStorage.setItem(`protrack_apps_local_${user.uid}`, JSON.stringify(list));
      setApplications(list);
      return;
    }

    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(app)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur de création côté serveur.");
    setApplications(prev => [data, ...prev]);
    await syncStats();
  };

  const updateJobApplication = async (id: string, updates: Partial<JobApplication>) => {
    if (!user) throw new Error("Accès refusé");

    if (isDemoMode) {
      const list = applications.map(app => {
        if (app.id === id) {
          return { ...app, ...updates, updatedAt: new Date().toISOString() };
        }
        return app;
      });
      localStorage.setItem(`protrack_apps_local_${user.uid}`, JSON.stringify(list));
      setApplications(list);
      return;
    }

    const res = await fetch(`/api/applications/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Modification impossible.");
    
    setApplications(prev => prev.map(app => app.id === id ? data : app));
    await syncStats();
  };

  const deleteJobApplication = async (id: string) => {
    if (!user) throw new Error("Accès refusé");

    if (isDemoMode) {
      const list = applications.filter(app => app.id !== id);
      localStorage.setItem(`protrack_apps_local_${user.uid}`, JSON.stringify(list));
      setApplications(list);
      return;
    }

    const res = await fetch(`/api/applications/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Suppression impossible.");
    }

    setApplications(prev => prev.filter(app => app.id !== id));
    await syncStats();
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      applications,
      friendsStats,
      isDemoMode,
      loginSovereign,
      registerSovereign,
      logout,
      deleteAccountSovereign,
      addJobApplication,
      updateJobApplication,
      deleteJobApplication,
      triggerDemoMode,
      syncStats
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a SovereignAuthProvider');
  }
  return context;
}
