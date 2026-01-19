import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Phone, Calendar, Building, AlertCircle } from 'lucide-react';

const StudentModal = ({ isOpen, onClose, student, isEditing, onSave }) => {
  const [formData, setFormData] = useState({
    student_id: '',
    enrollment_date: '',
    graduation_date: '',
    faculty: '',
    department: 'Informatique',
    current_year: 1,
    gpa: 0.0,
    status: 'active',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student && isOpen) {
      console.log("Données étudiant reçues pour édition:", student);
      
      // Préparer les données pour le formulaire
      const studentData = {
        student_id: student.student_id || '',
        enrollment_date: student.enrollment_date ? student.enrollment_date.split('T')[0] : '',
        graduation_date: student.graduation_date ? student.graduation_date.split('T')[0] : '',
        faculty: student.faculty || '',
        department: student.department || 'Informatique',
        current_year: student.current_year || 1,
        gpa: student.gpa || 0.0,
        status: student.status || 'active',
        first_name: student.first_name || student.user?.first_name || '',
        last_name: student.last_name || student.user?.last_name || '',
        email: student.email || student.user?.email || '',
        phone: student.phone || student.user?.phone || '',
        date_of_birth: student.user?.date_of_birth ? student.user.date_of_birth.split('T')[0] : ''
      };
      
      console.log("Données formatées pour formulaire:", studentData);
      setFormData(studentData);
    } else if (isOpen) {
      // Réinitialiser pour la création
      setFormData({
        student_id: '',
        enrollment_date: '',
        graduation_date: '',
        faculty: '',
        department: 'Informatique',
        current_year: 1,
        gpa: 0.0,
        status: 'active',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: ''
      });
    }
    setErrors({});
  }, [student, isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    // Validation des champs obligatoires
    if (!formData.student_id.trim()) {
      newErrors.student_id = "L'ID étudiant est requis";
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
    
    if (!formData.enrollment_date) {
      newErrors.enrollment_date = "La date d'inscription est requise";
    }
    
    if (!formData.department) {
      newErrors.department = "Le département est requis";
    }
    
    if (formData.gpa < 0 || formData.gpa > 4) {
      newErrors.gpa = "Le GPA doit être entre 0 et 4";
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
        student_id: formData.student_id,
        enrollment_date: formData.enrollment_date,
        graduation_date: formData.graduation_date || null,
        faculty: formData.faculty,
        department: formData.department,
        current_year: parseInt(formData.current_year),
        gpa: parseFloat(formData.gpa) || 0.0,
        status: formData.status,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || '',
        date_of_birth: formData.date_of_birth || null
      };
      
      await onSave(submissionData);
    } catch (error) {
      console.error('Erreur de soumission dans StudentModal:', error);
    } finally {
      setLoading(false);
    }
  };

  const departments = [
    'Informatique', 'Sciences', 'Lettres', 'Commerce', 
    'Ingénierie', 'Médecine', 'Droit', 'Économie', 'Arts'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <User className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-800">
              {isEditing ? (student ? 'Modifier' : 'Ajouter') : 'Détails de'} l'étudiant
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
              <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-blue-600">Traitement en cours...</span>
              </div>
            )}

            {/* Informations personnelles */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <User className="mr-2" size={18} />
                Informations personnelles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Étudiant *
                  </label>
                  <input
                    type="text"
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleChange}
                    required
                    disabled={!isEditing || loading}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.student_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="EX: ETU2024001"
                  />
                  {errors.student_id && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.student_id}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={!isEditing || loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="graduated">Diplômé</option>
                    <option value="suspended">Suspendu</option>
                  </select>
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
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.first_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Jean"
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
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.last_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Dupont"
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
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="jean.dupont@example.com"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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
                    <Calendar className="inline mr-1" size={14} />
                    Date d'inscription *
                  </label>
                  <input
                    type="date"
                    name="enrollment_date"
                    value={formData.enrollment_date}
                    onChange={handleChange}
                    required
                    disabled={!isEditing || loading}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.enrollment_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.enrollment_date && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.enrollment_date}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline mr-1" size={14} />
                    Date de graduation
                  </label>
                  <input
                    type="date"
                    name="graduation_date"
                    value={formData.graduation_date}
                    onChange={handleChange}
                    disabled={!isEditing || loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Faculté
                  </label>
                  <input
                    type="text"
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleChange}
                    disabled={!isEditing || loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Sciences et Technologies"
                  />
                </div>

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
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                    Année en cours
                  </label>
                  <select
                    name="current_year"
                    value={formData.current_year}
                    onChange={handleChange}
                    disabled={!isEditing || loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5].map(year => (
                      <option key={year} value={year}>{year}ère année</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Moyenne (GPA)
                  </label>
                  <input
                    type="number"
                    name="gpa"
                    value={formData.gpa}
                    onChange={handleChange}
                    min="0"
                    max="4"
                    step="0.01"
                    disabled={!isEditing || loading}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.gpa ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.gpa && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.gpa}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Note entre 0.00 et 4.00</p>
                </div>
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
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                <span>{loading ? 'Enregistrement...' : (student ? 'Mettre à jour' : 'Ajouter')}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentModal;