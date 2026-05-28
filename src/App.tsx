import React, { useState, useEffect } from 'react';
import { FirebaseProvider, useFirebase } from './components/FirebaseProvider';
import ApplicationForm from './components/ApplicationForm';
import ApplicationDetails from './components/ApplicationDetails';
import FriendsStatsView from './components/FriendsStatsView';
import { JobApplication, ApplicationStatus } from './types';
import { 
  Plus, Search, SlidersHorizontal, LogOut, Sparkles, Briefcase, 
  MapPin, Landmark, Calendar, Grid, Activity, ArrowRight, Github,
  Sun, Moon, Trash2, Settings
} from 'lucide-react';

function DashboardContent() {
  const { 
    user, 
    loginSovereign, 
    registerSovereign,
    logout, 
    deleteAccountSovereign,
    loading, 
    applications, 
    isDemoMode,
    triggerDemoMode 
  } = useFirebase();

  // Navigation and focus states
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formEditApp, setFormEditApp] = useState<JobApplication | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Theme support
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | ApplicationStatus>('all');
  
  // Auth Form State
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Demo config
  const [customNameInput, setCustomNameInput] = useState('');
  const [isSettingUpDemo, setIsSettingUpDemo] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-black animate-spin" />
        <span className="text-xs text-gray-500 font-medium font-sans">Chargement de votre espace...</span>
      </div>
    );
  }

  // Not Logged In screen
  if (!user) {
    const handleAuthSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError('');
      if (!authEmail.trim() || !authPassword) {
        setAuthError("Veuillez renseigner tous les champs obligatoires.");
        return;
      }
      setAuthLoading(true);
      try {
        if (isRegisterMode) {
          if (!authName.trim()) {
            setAuthError("Veuillez entrer votre prénom.");
            setAuthLoading(false);
            return;
          }
          await registerSovereign(authEmail.trim(), authPassword, authName.trim());
        } else {
          await loginSovereign(authEmail.trim(), authPassword);
        }
      } catch (err: any) {
        setAuthError(err.message || "Une erreur est survenue lors de l'authentification.");
      } finally {
        setAuthLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Abstract background blur assets */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-50/40 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-50/30 rounded-full blur-3xl -z-10" />

        <div className="max-w-md w-full space-y-8 animate-fade-in relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center shadow-sm">
              <Briefcase className="w-10 h-10 text-black stroke-[1.5]" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-950 font-sans tracking-tight mt-6">
              Suivi de Recherche d’Emploi
            </h1>
            <p className="text-xs text-gray-500 mt-2 font-sans max-w-sm leading-relaxed">
              Une plateforme ultra-sécurisée et <strong>hébergée de façon souveraine en Europe</strong> pour piloter vos recrutements et collaborer avec vos amis en toute confidentialité.
            </p>
          </div>

          {!isSettingUpDemo ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex border-b border-gray-100 pb-3 mb-2">
                <button
                  onClick={() => { setIsRegisterMode(false); setAuthError(''); }}
                  className={`flex-1 text-center py-1.5 text-xs font-bold transition-all ${!isRegisterMode ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Se Connecter
                </button>
                <button
                  onClick={() => { setIsRegisterMode(true); setAuthError(''); }}
                  className={`flex-1 text-center py-1.5 text-xs font-bold transition-all ${isRegisterMode ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Créer un compte
                </button>
              </div>

              {authError && (
                <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-100 font-sans">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
                {isRegisterMode && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5">Votre Prénom / Nom</label>
                    <input
                      type="text"
                      placeholder="Ex: Simon, Justine..."
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-100 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-gray-300 focus:bg-white transition-all font-sans"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5">Adresse Email</label>
                  <input
                    type="email"
                    placeholder="nom@exemple.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-100 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-gray-300 focus:bg-white transition-all font-sans"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5">Mot de Passe</label>
                  <input
                    type="password"
                    placeholder="Votre mot de passe secret"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-100 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-gray-300 focus:bg-white transition-all font-sans"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-black hover:bg-gray-800 text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer select-none disabled:opacity-50 mt-2"
                >
                  {authLoading ? "Synchronisation..." : isRegisterMode ? "Créer mon espace européen sécurisé" : "Accéder à mes candidatures"}
                </button>
              </form>

              <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-sans">100% hébergé en Europe</span>
                <button
                  onClick={() => setIsSettingUpDemo(true)}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer transition-colors"
                >
                  Tester sans s'inscrire (Démo) →
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 text-left space-y-4 animate-slide-in">
              <h3 className="text-sm font-bold text-gray-900 font-sans">Entrez votre prénom</h3>
              <p className="text-xs text-gray-500 font-sans leading-relaxed">
                Le mode Démo stocke vos données de manière sécurisée sur votre navigateur actuel (localStorage) sans synchronisation cloud.
              </p>
              
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Simon, Alex, Justine..."
                  value={customNameInput}
                  onChange={(e) => setCustomNameInput(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-gray-400 font-sans"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingUpDemo(false)}
                  className="text-xs font-semibold px-3 py-2 text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (customNameInput.trim()) {
                      triggerDemoMode(customNameInput.trim());
                    } else {
                      triggerDemoMode("Simon Deboeuf");
                    }
                  }}
                  className="text-xs font-semibold px-4 py-2 bg-black text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                >
                  Commencer
                </button>
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 pt-6 flex justify-between items-center text-[10px] text-gray-400 font-sans">
            <span className="flex items-center gap-1">
              🛡️ Isolation absolue des données
            </span>
            <span>Optimisé mobile & tablette</span>
          </div>
        </div>
      </div>
    );
  }

  // Filter application list
  const filteredApps = applications.filter((app) => {
    const matchesSearch = 
      app.title.toLowerCase().includes(search.toLowerCase()) || 
      app.company.toLowerCase().includes(search.toLowerCase()) ||
      (app.location && app.location.toLowerCase().includes(search.toLowerCase()));
    
    if (activeFilter === 'all') return matchesSearch;
    return app.status === activeFilter && matchesSearch;
  });

  // Highlight KPI calculations
  const totalApplied = applications.length;
  const totalInterviewing = applications.filter(a => a.status === 'interviewing').length;
  const totalOffers = applications.filter(a => a.status === 'offer').length;

  return (
    <div className="min-h-screen bg-slate-50 border-transparent dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* 1. Header Banner */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => {
              setSelectedApp(null);
              setIsFormOpen(false);
            }}
          >
            <div className="p-2 bg-black dark:bg-white rounded-xl text-white dark:text-black group-hover:scale-105 transition-transform">
              <Briefcase className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold tracking-widest text-gray-400 dark:text-gray-500 block h-3">PRO-TRACK</span>
              <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight font-sans">Suivi de Recherche d’Emploi</span>
            </div>
          </div>

          <div className="flex items-center space-x-4 relative">
            <div className="flex items-center space-x-2 text-right">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 hidden sm:block">{user.displayName}</span>
              <img 
                src={user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`}
                alt={user.displayName || 'Profil'} 
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
            </div>
            
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              title="Paramètres"
              className="p-2 text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all cursor-pointer select-none"
            >
              <Settings className="w-4 h-4" />
            </button>

            {isSettingsOpen && (
              <div className="absolute top-12 right-0 w-56 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg p-2 z-50 animate-fade-in">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                  <span className="block text-xs font-bold text-gray-900 dark:text-gray-100">{user.email}</span>
                  <span className="block text-[10px] text-gray-500 dark:text-gray-400">{isDemoMode ? "Mode Démo" : "Compte Hébergé"}</span>
                </div>
                
                <button
                  onClick={() => { setIsDarkMode(!isDarkMode); setIsSettingsOpen(false); }}
                  className="w-full flex items-center px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
                >
                  {isDarkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                  {isDarkMode ? "Passer en Mode Clair" : "Passer en Mode Sombre"}
                </button>

                <button
                  onClick={() => { logout(); setIsSettingsOpen(false); }}
                  className="w-full flex items-center px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </button>

                <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1">
                  <button
                    onClick={() => {
                      if(window.confirm("Êtes-vous sûr de vouloir supprimer votre compte et toutes vos données ? Cette action est irréversible.")) {
                        deleteAccountSovereign();
                      }
                      setIsSettingsOpen(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-left"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer mon compte
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Demonstration banner warning if working on temporary localStorage */}
      {isDemoMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/10 text-amber-900 px-4 py-2.5 text-xs text-center font-sans tracking-wide">
          💡 Vous exécutez l'application en <strong>Mode Démo Local</strong>. Pour collaborer en direct avec vos amis et activer la sauvegarde synchronisée multi-appareils, créez simplement un compte souverain sécurisé en un clic !
        </div>
      )}

      {/* 3. Primary Dashboard grid layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* LEFT COMPACT SECTION: Listings & quick filters */}
        <section className={`w-full lg:w-5/12 space-y-6 ${selectedApp ? 'hidden lg:block' : 'block'}`}>
          
          {/* Dashboard aggregate cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 text-center shadow-xs transition-colors duration-300">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Total</span>
              <span className="font-mono text-xl font-bold text-gray-900 dark:text-white mt-1 block">{totalApplied}</span>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-slate-200/50 dark:border-gray-800 rounded-2xl p-4 text-center shadow-xs ring-1 ring-slate-100/50 dark:ring-transparent transition-colors duration-300">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block">Entretiens</span>
              <span className="font-mono text-xl font-bold text-indigo-600 mt-1 block">{totalInterviewing}</span>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-4 text-center shadow-xs transition-colors duration-300">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block">Offres</span>
              <span className="font-mono text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 block">{totalOffers}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-950 tracking-tight font-sans">Vos Opportunités</h2>
            <button 
              onClick={() => {
                setFormEditApp(null);
                setIsFormOpen(true);
              }}
              className="flex items-center text-xs font-semibold bg-black hover:bg-gray-800 text-white px-3.5 py-2 rounded-xl border border-transparent select-none shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Nouveau Job
            </button>
          </div>

          {/* Search bar and filters panel */}
          <div className="space-y-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-xs transition-colors duration-300">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher un poste, entreprise..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl py-2 pl-9 pr-4 text-xs dark:text-gray-100 focus:outline-none focus:border-gray-300 dark:focus:border-gray-500 focus:bg-white dark:focus:bg-gray-950 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-gray-50 dark:border-gray-800">
              {[
                { id: 'all', label: 'Tout' },
                { id: 'to_apply', label: 'À postuler' },
                { id: 'applied', label: 'Postulé' },
                { id: 'interviewing', label: 'Entretiens' },
                { id: 'offer', label: 'Offre' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id as any)}
                  className={`text-[10.5px] font-medium px-2.5 py-1.5 rounded-lg select-none cursor-pointer transition-colors ${
                    activeFilter === filter.id 
                      ? 'bg-black dark:bg-white text-white dark:text-black' 
                      : 'bg-slate-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Listings loop */}
          <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-1">
            {filteredApps.length === 0 ? (
              <div className="text-center py-12 p-6 bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl space-y-3 transition-colors duration-300">
                <Grid className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto" />
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">Aucune candidature correspondante</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">Cliquez sur « Nouveau Job » pour démarrer votre suivi individuel.</p>
                </div>
              </div>
            ) : (
              filteredApps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`p-4 bg-white dark:bg-gray-900 border rounded-2xl cursor-pointer text-left transition-all ${
                    selectedApp?.id === app.id
                      ? 'border-black dark:border-white ring-1 ring-black dark:ring-white shadow-sm'
                      : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:translate-x-1 shadow-xs'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-gray-950 dark:text-white font-sans tracking-tight">{app.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">{app.company}</p>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      app.status === 'to_apply' ? 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60' :
                      app.status === 'applied' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60' :
                      app.status === 'interviewing' ? 'bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/60' :
                      app.status === 'offer' ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 font-semibold' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-transparent'
                    }`}>
                      {app.status === 'to_apply' ? 'À postuler' :
                       app.status === 'applied' ? 'Postulé' :
                       app.status === 'interviewing' ? 'Entretiens' :
                       app.status === 'offer' ? 'Offre ! 🥳' : 'Classé'}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-50 text-[10px] text-gray-400 font-mono">
                    <span className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                      {app.location || "N/A"}
                    </span>
                    <span className="flex items-center">
                      <Landmark className="w-3 h-3 mr-1" />
                      {app.salary || "N/A"}
                    </span>
                    <span>{new Date(app.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* RIGHT DYNAMIC PORTION: Inspection view or Friends Aggregation */}
        <section className={`flex-1 ${!selectedApp ? 'block' : 'block'}`}>
          {selectedApp ? (
            <div className="h-full">
              <div className="mb-4 lg:hidden">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="flex items-center py-2 px-3 text-xs font-semibold text-gray-600 bg-white border border-gray-100 rounded-lg shadow-2xs cursor-pointer select-none"
                >
                  ◀ Retour à la liste globale
                </button>
              </div>
              <ApplicationDetails
                application={selectedApp}
                onClose={() => setSelectedApp(null)}
                onEdit={() => {
                  setFormEditApp(selectedApp);
                  setIsFormOpen(true);
                }}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-8 bg-black text-white rounded-3xl relative overflow-hidden flex flex-col items-center justify-center text-center shadow-lg min-h-[160px]">
                <div className="absolute top-0 right-0 p-4 shrink-0 pointer-events-none opacity-25">
                  <Sparkles className="w-24 h-24 stroke-[1]" />
                </div>
                <div className="z-10 max-w-lg space-y-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-black font-semibold uppercase tracking-wider">
                    Assistant Intelligent d'Embauche
                  </span>
                  <h3 className="text-xl font-bold font-sans tracking-tight">Maximisez vos candidatures</h3>
                  <p className="text-xs text-gray-300 leading-relaxed max-w-sm">
                    Sélectionnez un dossier à gauche pour rédiger un email pro avec l'IA ou simuler vos entretiens techniques personnalisés.
                  </p>
                </div>
              </div>

              {/* Aggregation peer panel */}
              <FriendsStatsView />
            </div>
          )}
        </section>

      </main>

      {/* 4. Sliding form panel input */}
      {isFormOpen && (
        <ApplicationForm
          application={formEditApp}
          onClose={() => {
            setIsFormOpen(false);
            setFormEditApp(null);
            // Refresh detail state if modifying focusing card
            if (formEditApp && selectedApp && formEditApp.id === selectedApp.id) {
              const fresh = applications.find(a => a.id === selectedApp.id);
              if (fresh) setSelectedApp(fresh);
            }
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <DashboardContent />
    </FirebaseProvider>
  );
}
