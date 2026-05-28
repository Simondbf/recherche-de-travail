import { useFirebase } from './FirebaseProvider';
import { Users, Award, TrendingUp, HelpCircle, Laptop } from 'lucide-react';

export default function FriendsStatsView() {
  const { friendsStats, isDemoMode } = useFirebase();

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" />
            L'Émulation Entre Amis (Partage)
          </h2>
          <p className="text-xs text-gray-400 font-sans mt-0.5">
            Suivi collectif temps-réel. Partagez le lien avec vos amis pour comparer vos progressions !
          </p>
        </div>
        {isDemoMode && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-100">
            Simulé (Démo)
          </span>
        )}
      </div>

      {/* Stats list grid */}
      <div className="space-y-4">
        {friendsStats.length === 0 ? (
          <p className="text-xs text-gray-400 font-sans italic py-4">Aucune statistique enregistrée.</p>
        ) : (
          friendsStats.map((peer) => (
            <div 
              key={peer.userId} 
              className="p-4 rounded-xl bg-gray-50/50 border border-gray-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-gray-50"
            >
              {/* Profile Block */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img 
                    src={peer.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${peer.userId}`}
                    alt={peer.displayName} 
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full border border-gray-200 object-cover bg-white"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 font-sans">{peer.displayName}</h4>
                  <p className="text-[10px] text-gray-400 flex items-center font-mono mt-0.5">
                    Actif à {new Date(peer.lastActive).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Counts dashboard */}
              <div className="flex items-center space-x-6 sm:space-x-8">
                {/* 1. Applied */}
                <div className="text-center">
                  <span className="block text-[10px] uppercase font-bold text-gray-400 font-sans">Postulés</span>
                  <span className="font-mono text-sm font-semibold text-gray-900 mt-1 block">{peer.totalApplied}</span>
                </div>
                {/* 2. Interviewing */}
                <div className="text-center">
                  <span className="block text-[10px] uppercase font-bold text-gray-400 font-sans">Entretiens</span>
                  <span className="font-mono text-sm font-semibold text-purple-700 mt-1 block">{peer.totalInterviewing}</span>
                </div>
                {/* 3. Offers */}
                <div className="text-center">
                  <span className="block text-[10px] uppercase font-bold text-gray-400 font-sans">Offres</span>
                  <span className="font-mono text-sm font-bold text-emerald-700 mt-1 block">{peer.totalOffers}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom informational space */}
      <div className="p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
        <h4 className="text-xs font-bold text-gray-800 flex items-center">
          <Laptop className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
          Synchronisation Multi-Appareil
        </h4>
        <p className="text-[11px] text-gray-500 font-sans leading-relaxed">
          Toutes vos candidatures sont sauvegardées dans le Cloud. Si vous vous connectez à partir de votre téléphone ou de votre tablette avec le même compte Google, vos données se mettront instantanément à jour où que vous soyez.
        </p>
      </div>
    </div>
  );
}
