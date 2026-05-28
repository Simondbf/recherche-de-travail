import React, { useState, useEffect } from 'react';
import { useFirebase } from './FirebaseProvider';
import { JobApplication, ApplicationStatus, JobContact } from '../types';
import { X, Briefcase, Building, Landmark, Link2, User, Mail, Plus, Check, Trash2 } from 'lucide-react';

interface ApplicationFormProps {
  application?: JobApplication | null;
  onClose: () => void;
}

export default function ApplicationForm({ application, onClose }: ApplicationFormProps) {
  const { addJobApplication, updateJobApplication } = useFirebase();
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('to_apply');
  const [location, setLocation] = useState('');
  const [url, setUrl] = useState('');
  const [salary, setSalary] = useState('');
  const [contacts, setContacts] = useState<JobContact[]>([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Pre-populate if editing
  useEffect(() => {
    if (application) {
      setTitle(application.title ?? '');
      setCompany(application.company ?? '');
      setStatus(application.status ?? 'to_apply');
      setLocation(application.location ?? '');
      setUrl(application.url ?? '');
      setSalary(application.salary ?? '');
      setContacts(application.contacts ?? []);
      setNotes(application.notes ?? '');
    }
  }, [application]);

  const addContact = () => {
    setContacts([...contacts, { id: 'c-' + Math.random().toString(36).substr(2, 6), name: '', email: '', role: '' }]);
  };

  const removeContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  const updateContact = (id: string, field: keyof JobContact, value: string) => {
    setContacts(contacts.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim()) {
      setError("Le titre du poste et l'entreprise sont obligatoires.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        title: title.trim(),
        company: company.trim(),
        status,
        location: location.trim() || undefined,
        url: url.trim() || undefined,
        salary: salary.trim() || undefined,
        contacts: contacts.filter(c => c.name.trim() !== ''),
        notes: notes.trim() || undefined,
      };

      if (application) {
        await updateJobApplication(application.id, payload);
      } else {
        await addJobApplication({
          ...payload,
        });
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Erreur d'enregistrement. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold font-sans text-gray-900 tracking-tight">
            {application ? "Modifier la Candidature" : "Enregistrer un Job"}
          </h2>
          <p className="text-sm text-gray-500 font-sans mt-1">
            {application ? `Modification de votre suivi chez ${application.company}` : "Ajoutez tous les détails de votre future opportunité."}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Area */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
        {error && (
          <div className="p-3 text-sm bg-red-50 text-red-600 rounded-lg border border-red-100 font-sans">
            {error}
          </div>
        )}

        {/* Title & Company */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 tracking-wider uppercase mb-2">Titre du Poste *</label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input 
                type="text"
                placeholder="Ex: Développeur React"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-100 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 tracking-wider uppercase mb-2">Entreprise *</label>
            <div className="relative">
              <Building className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input 
                type="text"
                placeholder="Ex: Google, Stripe..."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-100 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
                required
              />
            </div>
          </div>
        </div>

        {/* Current Pipeline Status */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 tracking-wider uppercase mb-2">Étape actuelle du Recrutement</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'to_apply', label: 'À postuler', color: 'border-yellow-200 text-yellow-700 bg-yellow-50/20' },
              { id: 'applied', label: 'Postulé', color: 'border-blue-200 text-blue-700 bg-blue-50/20' },
              { id: 'interviewing', label: 'Entretiens', color: 'border-purple-200 text-purple-700 bg-purple-50/20' },
              { id: 'offer', label: 'Offre reçue', color: 'border-emerald-200 text-emerald-700 bg-emerald-50/20' },
              { id: 'rejected', label: 'Classé / Refusé', color: 'border-gray-200 text-gray-600 bg-gray-50' }
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setStatus(option.id as ApplicationStatus)}
                className={`flex flex-col items-center justify-center p-2.5 border rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 ${
                  status === option.id 
                    ? `${option.color} ring-2 ring-offset-1 ring-gray-200 shadow-sm border-transparent` 
                    : 'border-gray-100 text-gray-500 hover:bg-gray-50/50'
                }`}
              >
                {status === option.id && <Check className="w-3.5 h-3.5 mb-1 stroke-[3]" />}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Location & Income */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 tracking-wider uppercase mb-2">Localisation / Bureau</label>
            <input 
              type="text"
              placeholder="Ex: Paris (Hybride), Remote..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-100 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 tracking-wider uppercase mb-2">Fourchette de Salaire</label>
            <div className="relative">
              <Landmark className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input 
                type="text"
                placeholder="Ex: 50k - 60k €/an"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-100 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Link URL */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 tracking-wider uppercase mb-2">Lien de l'offre d'emploi</label>
          <div className="relative">
            <Link2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input 
              type="url"
              placeholder="https://linkedin.com/jobs/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-100 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Recruiter / Contact info */}
        <div className="p-4 bg-gray-50/50 rounded-xl space-y-4 border border-gray-50/30">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Informations des Recruteurs</h3>
            <button 
              type="button" 
              onClick={addContact}
              className="text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors flex items-center"
            >
              <Plus className="w-3 h-3 mr-1" /> Ajouter un Contact
            </button>
          </div>
          
          {contacts.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Aucun contact ajouté.</p>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact, index) => (
                <div key={contact.id} className="relative grid grid-cols-1 md:grid-cols-3 gap-2 bg-white p-3 rounded-lg border border-gray-100 items-start">
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                    <input 
                      type="text"
                      placeholder="Nom du contact"
                      value={contact.name}
                      onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                      className="w-full bg-slate-50 border border-gray-100 rounded-md py-1.5 pl-8 pr-2 text-xs focus:outline-none focus:border-gray-300 transition-colors"
                    />
                  </div>
                  <div className="relative">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                    <input 
                      type="text"
                      placeholder="Rôle (ex: RH)"
                      value={contact.role || ''}
                      onChange={(e) => updateContact(contact.id, 'role', e.target.value)}
                      className="w-full bg-slate-50 border border-gray-100 rounded-md py-1.5 pl-8 pr-2 text-xs focus:outline-none focus:border-gray-300 transition-colors"
                    />
                  </div>
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                      <input 
                        type="email"
                        placeholder="Email"
                        value={contact.email || ''}
                        onChange={(e) => updateContact(contact.id, 'email', e.target.value)}
                        className="w-full bg-slate-50 border border-gray-100 rounded-md py-1.5 pl-8 pr-2 text-xs focus:outline-none focus:border-gray-300 transition-colors"
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeContact(contact.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Notes & Job description */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 tracking-wider uppercase mb-2">Notes et Descriptif / Exigences</label>
          <textarea 
            rows={5}
            placeholder="Copiez-collez ici la description du poste, la liste des exigences de l'entreprise ou vos impressions. L'IA utilisera ce texte pour générer vos conseils d'entretien et lettres de motivation."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-gray-50/50 border border-gray-100 rounded-lg py-3 px-4 text-sm focus:outline-none focus:border-gray-300 focus:bg-white focus:ring-0 transition-colors resize-y font-sans"
          />
        </div>
      </form>

      {/* Footer Actions */}
      <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
        >
          Annuler
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-5 py-2 text-sm font-medium bg-black text-white hover:bg-gray-800 rounded-lg select-none flex items-center shadow-sm disabled:opacity-50 cursor-pointer transition-colors"
        >
          {loading ? "Sauvegarde..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
