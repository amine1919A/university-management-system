import React, { useState, useEffect } from 'react';
import { X, Save, GraduationCap, Mail, Phone, Calendar, Building, Book, Award, MapPin, Clock, AlertCircle } from 'lucide-react';

const TeacherModal = ({ isOpen, onClose, teacher, isEditing, onSave }) => {
  const [formData, setFormData] = useState({
    teacher_id: '',
    hire_date: '',
    department: 'Informatique',
    specialization: '',
    rank: 'assistant',
    office_number: '',
    office_hours: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Dans TeacherModal.jsx, vérifiez le useEffect:
useEffect(() => {
    if (teacher && isOpen) {
      console.log("📋 Données enseignant reçues pour édition:", teacher);
      console.log("📋 Structure complète:", JSON.stringify(teacher, null, 2));
      
      // EXTRAIRE LES DONNÉES CORRECTEMENT
      // Votre backend retourne les données dans différents formats
      const teacherData = {
        teacher_id: teacher.teacher_id || '',
        hire_date: teacher.hire_date ? teacher.hire_date.split('T')[0] : '',
        department: teacher.department || 'Informatique',
        specialization: teacher.specialization || '',
        rank: teacher.rank || 'assistant',
        office_number: teacher.office_number || '',
        office_hours: teacher.office_hours || '',
        // LES DONNÉES UTILISATEUR PEUVENT ÊTRE À DIFFÉRENTS NIVEAUX
        first_name: teacher.first_name || teacher.user_first_name || teacher.user?.first_name || '',
        last_name: teacher.last_name || teacher.user_last_name || teacher.user?.last_name || '',
        email: teacher.email || teacher.user_email || teacher.user?.email || '',
        phone: teacher.phone || teacher.user_phone || teacher.user?.phone || '',
        date_of_birth: teacher.date_of_birth || teacher.user_date_of_birth || 
                      (teacher.user?.date_of_birth ? teacher.user.date_of_birth.split('T')[0] : '')
      };
      
      console.log("📋 Données formatées pour formulaire:", teacherData);
      setFormData(teacherData);
    } else if (isOpen) {
      // Réinitialiser pour la création
      setFormData({
        teacher_id: '',
        hire_date: '',
        department: 'Informatique',
        specialization: '',
        rank: 'assistant',
        office_number: '',
        office_hours: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: ''
      });
    }
    setErrors({});
  }, [teacher, isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    // Validation des champs obligatoires
    if (!formData.teacher_id.trim()) {
      newErrors.teacher_id = "L'ID enseignant est requis";
    }
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = "Le prénom est requis";
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Le nom est requis";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }
    
    if (!formData.hire_date) {
      newErrors.hire_date = "La date d'embauche est requise";
    }
    
    if (!formData.department) {
      newErrors.department = "Le département est requis";
    }
    
    if (!formData.specialization.trim()) {
      newErrors.specialization = "La spécialisation est requise";
    }
    
    if (!formData.rank) {
      newErrors.rank = "Le grade est requis";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur quand l'utilisateur tape
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleTextAreaChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Données à envoyer au backend:", formData);
      
      // Préparer les données pour l'API
      const submissionData = {
        teacher_id: formData.teacher_id,
        hire_date: formData.hire_date,
        department: formData.department,
        specialization: formData.specialization,
        rank: formData.rank,
        office_number: formData.office_number || '',
        office_hours: formData.office_hours || '',
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || '',
        date_of_birth: formData.date_of_birth || null
      };
      
      await onSave(submissionData);
    } catch (error) {
      console.error('Erreur de soumission dans TeacherModal:', error);
    } finally {
      setLoading(false);
    }
  };

  const departments = [
    'Informatique', 'Mathématiques', 'Physique', 'Chimie', 'Biologie',
    'Littérature', 'Histoire', 'Philosophie', 'Langues', 'Économie',
    'Droit', 'Médecine', 'Ingénierie', 'Arts', 'Musique'
  ];

  const ranks = [
    { value: 'professor', label: 'Professeur' },
    { value: 'associate', label: 'Professeur Associé' },
    { value: 'assistant', label: 'Assistant' },
    { value: 'lecturer', label: 'Maître de Conférences' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <GraduationCap className="text-green-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-800">
              {isEditing ? (teacher ? 'Modifier' : 'Ajouter') : 'Détails de'} l'enseignant
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {loading && (
              <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                <span className="ml-3 text-green-600">Traitement en cours...</span>
              </div>
            )}

            {/* Informations personnelles */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <GraduationCap className="mr-2" size={18} />
                Informations personnelles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Enseignant *
                  </label>
                  <input
                    type="text"
                    name="teacher_id"
                    value={formData.teacher_id}
                    onChange={handleChange}
                    required
                    disabled={!isEditing || loading}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.teacher_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="EX: ENS2024001"
                  />
                  {errors.teacher_id && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.teacher_id}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade *
                  </label>
                  <select
                    name="rank"
                    value={formData.rank}
                    onChange={handleChange}
                    required
                    disabled={!isEditing || loading}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.rank ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Sélectionner un grade</option>
                    {ranks.map(rank => (
                      <option key={rank.value} value={rank.value}>
                        {rank.label}
                      </option>
                    ))}
                  </select>
                  {errors.rank && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.rank}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    disabled={!isEditing || loading}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.first_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Marie"
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.first_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    disabled={!isEditing || loading}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.last_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Curie"
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.last_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Mail className="inline mr-1" size={14} />
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={!isEditing || loading}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="marie.curie@university.edu"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="inline mr-1" size={14} />
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing || loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="06 12 34 56 78"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline mr-1" size={14} />
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    disabled={!isEditing || loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline mr-1" size={14} />
                    Date d'embauche *
                  </label>
                  <input
                    type="date"
                    name="hire_date"
                    value={formData.hire_date}
                    onChange={handleChange}
                    required
                    disabled={!isEditing || loading}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.hire_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.hire_date && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.hire_date}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Informations académiques */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <Building className="mr-2" size={18} />
                Informations académiques
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Département *
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    disabled={!isEditing || loading}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.department ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Sélectionner un département</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {errors.department && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.department}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Book className="inline mr-1" size={14} />
                    Spécialisation *
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    required
                    disabled={!isEditing || loading}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.specialization ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ex: Intelligence Artificielle"
                  />
                  {errors.specialization && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.specialization}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="inline mr-1" size={14} />
                    Numéro de bureau
                  </label>
                  <input
                    type="text"
                    name="office_number"
                    value={formData.office_number}
                    onChange={handleChange}
                    disabled={!isEditing || loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ex: B-205"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="inline mr-1" size={14} />
                    Heures de bureau
                  </label>
                  <input
                    type="text"
                    name="office_hours"
                    value={formData.office_hours}
                    onChange={handleChange}
                    disabled={!isEditing || loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ex: Lundi 14h-16h, Mercredi 10h-12h"
                  />
                </div>
              </div>

              {/* Description supplémentaire */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Informations complémentaires
                </label>
                <textarea
                  name="additional_info"
                  rows="3"
                  disabled={!isEditing || loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Autres informations pertinentes..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              disabled={loading}
            >
              Annuler
            </button>
            {isEditing && (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                <span>{loading ? 'Enregistrement...' : (teacher ? 'Mettre à jour' : 'Ajouter')}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherModal;