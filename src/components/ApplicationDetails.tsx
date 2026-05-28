import { useState } from 'react';
import { JobApplication, ApplicationStatus } from '../types';
import { useFirebase } from './FirebaseProvider';
import { 
  Building, MapPin, Landmark, Link, User, Users, Mail, Sparkles, ChevronLeft, 
  Trash2, FileText, Calendar, Edit, Copy, Check, MessageSquareCode, Award
} from 'lucide-react';

interface ApplicationDetailsProps {
  application: JobApplication;
  onClose: () => void;
  onEdit: () => void;
}

export default function ApplicationDetails({ application, onClose, onEdit }: ApplicationDetailsProps) {
  const { deleteJobApplication, updateJobApplication } = useFirebase();
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'ai'>('overview');
  
  // Custom states for Gemini
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLetter, setAiLetter] = useState('');
  const [aiPrep, setAiPrep] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [customBullets, setCustomBullets] = useState(() => {
    return localStorage.getItem('protrack_user_bullets') || "Diplômé en informatique, passionné par le développement d'interfaces modernes et véloces, curieux et autonome.";
  });

  const [localNotes, setLocalNotes] = useState(application.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);

  const handleDelete = async () => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la candidature chez ${application.company} ?`)) {
      await deleteJobApplication(application.id);
      onClose();
    }
  };

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    await updateJobApplication(application.id, { status: newStatus });
  };

  const saveNotesHander = async () => {
    setSavingNotes(true);
    await updateJobApplication(application.id, { notes: localNotes });
    setSavingNotes(false);
  };

  // Call Gemini endpoints
  const generateLetter = async () => {
    setAiLoading(true);
    // save bullets for next time
    localStorage.setItem('protrack_user_bullets', customBullets);
    try {
      const response = await fetch('/api/gemini/letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: application.title,
          company: application.company,
          description: application.notes || "Pas de description spécifiée",
          bulletPoints: customBullets
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAiLetter(data.text || "Erreur de format de l'IA.");
    } catch (e: any) {
      alert("Une erreur est survenue lors de la communication avec l'assistant IA: " + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const generateInterviewPrep = async () => {
    setAiLoading(true);
    try {
      const response = await fetch('/api/gemini/prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: application.title,
          company: application.company,
          description: application.notes || "Pas de description spécifiée"
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAiPrep(data.text || "Erreur de format de l'IA.");
    } catch (e: any) {
      alert("Erreur de génération: " + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full animate-fade-in">
      {/* Detail Header / Action buttons */}
      <div className="p-6 border-b border-gray-100 bg-gray-50/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button 
              onClick={onClose} 
              className="p-2 -ml-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors lg:hidden cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {application.status === 'to_apply' ? 'À postuler' :
                 application.status === 'applied' ? 'Candidature envoyée' :
                 application.status === 'interviewing' ? 'Entretiens en cours' :
                 application.status === 'offer' ? 'Offre Reçue ! 🥳' : 'Classé / Refusé'}
              </span>
              <h1 className="text-2xl font-bold font-sans text-gray-950 mt-1 tracking-tight">{application.title}</h1>
              <p className="text-gray-500 font-medium text-sm flex items-center mt-1">
                <Building className="w-4 h-4 mr-1.5 text-gray-400" />
                {application.company}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={onEdit}
              className="flex items-center text-xs font-semibold px-3.5 py-2 bg-white border border-gray-100 hover:border-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Modifier
            </button>
            <button 
              onClick={handleDelete}
              className="flex items-center text-xs font-semibold px-3.5 py-2 bg-white text-red-600 border border-red-50 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Supprimer
            </button>
          </div>
        </div>

        {/* Status quick switcher */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2">Changer l'État :</span>
          {[
            { id: 'to_apply', label: 'À Postuler' },
            { id: 'applied', label: 'Postulé' },
            { id: 'interviewing', label: 'Entretiens' },
            { id: 'offer', label: 'Offre' },
            { id: 'rejected', label: 'Classé' }
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => handleStatusChange(s.id as ApplicationStatus)}
              className={`text-xs font-medium px-2.5 py-1.5 rounded-md cursor-pointer transition-colors ${
                application.status === s.id 
                  ? 'bg-black text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs list */}
      <div className="border-b border-gray-100 flex px-6 space-x-6">
        {[
          { id: 'overview', label: 'Détails & Contacts' },
          { id: 'notes', label: 'Fiche de Poste & Notes' },
          { id: 'ai', label: 'L\'Assistant Recrutement IA 🧠' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-4 text-sm font-medium transition-colors border-b-2 relative -mb-[2px] cursor-pointer ${
              activeTab === tab.id 
                ? 'border-black text-black' 
                : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            {tab.label}
            {tab.id === 'ai' && (
              <span className="absolute -top-1 -right-4 px-1.5 py-0.5 bg-indigo-50 text-[9px] font-bold text-indigo-600 rounded-full animate-pulse border border-indigo-100">
                AI
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Scrollable body content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50/55 rounded-xl border border-gray-50/20">
                <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Localisation</span>
                <span className="mt-1 font-medium text-sm text-gray-900 flex items-center">
                  <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                  {application.location ? (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(application.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 hover:underline transition-colors"
                    >
                      {application.location}
                    </a>
                  ) : "Non spécifiée"}
                </span>
              </div>

              <div className="p-4 bg-gray-50/55 rounded-xl border border-gray-50/20">
                <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Salaire Visé</span>
                <span className="mt-1 font-medium text-sm text-gray-900 flex items-center">
                  <Landmark className="w-4 h-4 mr-1.5 text-gray-400" />
                  {application.salary || "Non spécifié"}
                </span>
              </div>

              <div className="p-4 bg-gray-50/55 rounded-xl border border-gray-50/20">
                <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Lien de l'offre</span>
                <span className="mt-1 font-medium text-sm text-gray-900">
                  {application.url ? (
                    <a 
                      href={application.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-black underline flex items-center hover:text-gray-600 transition-colors"
                    >
                      <Link className="w-4 h-4 mr-1.5 text-black" />
                      Voir l'annonce originale
                    </a>
                  ) : "Aucun lien"}
                </span>
              </div>
            </div>

            {/* Recruiter space */}
            <div className="p-5 bg-white border border-gray-100 rounded-xl space-y-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center">
                <Users className="w-4 h-4 mr-2 text-gray-400" />
                Contacts de recrutement
              </h2>
              {application.contacts && application.contacts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {application.contacts.map((contact) => (
                    <div key={contact.id} className="p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                      <span className="block text-xs text-gray-400 font-sans uppercase font-bold">
                        {contact.role || 'Contact'}
                      </span>
                      <span className="text-gray-900 text-sm font-semibold block mt-1 flex items-center">
                        <User className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        {contact.name}
                      </span>
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline text-xs font-medium mt-1.5 flex items-center">
                          <Mail className="w-3.5 h-3.5 mr-1" />
                          {contact.email}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 font-sans italic">Aucun contact n'a encore été associé à cette candidature.</p>
              )}
            </div>

            {/* Quick tips */}
            <div className="p-4 bg-indigo-50/20 border border-indigo-50 rounded-xl flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-widest">Conseil ProTrack</h4>
                <p className="text-xs text-indigo-900 mt-1 leading-relaxed">
                  Remplissez bien la section « Fiche de Poste & Notes » avec les compétences clés écrites dans l'annonce. Ensuite, demandez à l'IA d'analyser vos chances ou de rédiger une relance percutante !
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NOTES */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Descriptif du poste et notes</span>
                <p className="text-xs text-gray-400 mt-0.5">Ces informations servent au générateur intelligent d'aide au recrutement.</p>
              </div>
              <button
                onClick={saveNotesHander}
                disabled={savingNotes}
                className="text-xs font-semibold px-3.5 py-1.5 bg-black text-white hover:bg-gray-800 rounded-lg select-none disabled:opacity-50 transition-colors cursor-pointer"
              >
                {savingNotes ? "Sauvegarde..." : "Enregistrer"}
              </button>
            </div>
            <textarea
              rows={12}
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              placeholder="Conseil: collez la transcription de l'entretien, l'offre d'emploi ou vos notes ici..."
              className="w-full bg-gray-50/50 border border-gray-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-gray-200 focus:bg-white transition-colors font-sans resize-y leading-relaxed"
            />
          </div>
        )}

        {/* TAB 3: AI ASSISTANT */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-2xl">
              <h2 className="text-sm font-bold text-indigo-950 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-indigo-600 animate-pulse" />
                Assistant d'Intégration et Candidature IA
              </h2>
              <p className="text-xs text-indigo-900 mt-1 leading-relaxed">
                Adaptez votre profil pour décrocher le poste ! Renseignez vos points forts ci-dessous pour que l'IA rédige une lettre ou des questions adaptées.
              </p>

              {/* Candidates Highlights */}
              <div className="mt-4">
                <label className="block text-[10px] font-bold text-indigo-900 uppercase tracking-wider mb-2">Vos Atouts / Expérience (A modifier si besoin)</label>
                <textarea
                  rows={2}
                  value={customBullets}
                  onChange={(e) => setCustomBullets(e.target.value)}
                  placeholder="Ex: 2 ans d'expérience en React, de l'enthousiasme, rigoureux..."
                  className="w-full bg-white/80 border border-indigo-100 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-200 transition-colors font-sans"
                />
              </div>

              {/* Control Buttons */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={generateLetter}
                  disabled={aiLoading}
                  className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 select-none shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Générer une Lettre de Motivation
                </button>
                <button
                  onClick={generateInterviewPrep}
                  disabled={aiLoading}
                  className="px-3.5 py-2 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 select-none"
                >
                  <MessageSquareCode className="w-3.5 h-3.5" />
                  Générer Questions d'Entretien (IA)
                </button>
              </div>
            </div>

            {aiLoading && (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 font-sans">
                <div className="w-8 h-8 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                <span className="text-xs text-gray-500 font-medium">Réflexion de l'IA de recrutement...</span>
              </div>
            )}

            {/* AI Letter display space */}
            {aiLetter && !aiLoading && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-xs font-bold text-gray-700 flex items-center">
                    <FileText className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    Votre Lettre Personnalisée générée
                  </span>
                  <button
                    onClick={() => handleCopyClipboard(aiLetter)}
                    className="text-xs font-medium text-gray-500 hover:text-black hover:bg-gray-50 p-1.5 rounded-lg border border-gray-100 transition-colors flex items-center cursor-pointer select-none"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copied ? "Copié !" : "Copier"}
                  </button>
                </div>
                <div className="p-4 bg-gray-50/50 rounded-xl text-xs text-gray-800 whitespace-pre-line leading-relaxed font-sans border border-gray-100 max-h-96 overflow-y-auto">
                  {aiLetter}
                </div>
              </div>
            )}

            {/* AI Interview advice display space */}
            {aiPrep && !aiLoading && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-xs font-bold text-gray-700 flex items-center">
                    <Award className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                    Préparations d'Entretiens Stratégiques
                  </span>
                  <button
                    onClick={() => handleCopyClipboard(aiPrep)}
                    className="text-xs font-medium text-gray-500 hover:text-black hover:bg-gray-50 p-1.5 rounded-lg border border-gray-100 transition-colors flex items-center cursor-pointer select-none"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copied ? "Copié !" : "Copier"}
                  </button>
                </div>
                <div className="p-4 bg-gray-50/55 rounded-xl text-xs text-gray-800 whitespace-pre-line leading-relaxed font-sans border border-gray-100 max-h-96 overflow-y-auto">
                  {aiPrep}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Date metadata */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/30 text-[10px] text-gray-400 font-sans flex items-center justify-between">
        <span className="flex items-center">
          <Calendar className="w-3 h-3 mr-1" />
          Enregistré le {new Date(application.createdAt).toLocaleDateString('fr-FR')}
        </span>
        <span>Auteur: {application.userDisplayName || 'Moi'}</span>
      </div>
    </div>
  );
}
