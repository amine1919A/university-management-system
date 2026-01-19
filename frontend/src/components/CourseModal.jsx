import React, { useState, useEffect } from 'react';
import { X, Save, BookOpen, AlertCircle, Users } from 'lucide-react';
import { teacherService } from '../services/api';

const CourseModal = ({ isOpen, onClose, course, isEditing, onSave }) => {
  const [formData, setFormData] = useState({
    course_code: '',
    title: '',
    description: '',
    credits: 3,
    department: 'Informatique',
    semester: 'fall',
    academic_year: new Date().getFullYear(),
    teacher: '',
    max_students: 30,
    schedule: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  useEffect(() => {
    if (course && isOpen) {
      console.log("Données cours reçues pour édition:", course);
      
      // Important: s'assurer que le champ teacher est correctement initialisé
      // course.teacher peut être un objet ou un ID numérique
      const teacherId = course.teacher ? 
        (typeof course.teacher === 'object' ? course.teacher.id : course.teacher) 
        : '';
      
      setFormData({
        course_code: course.course_code || '',
        title: course.title || '',
        description: course.description || '',
        credits: course.credits || 3,
        department: course.department || 'Informatique',
        semester: course.semester || 'fall',
        academic_year: course.academic_year || new Date().getFullYear(),
        teacher: teacherId, // Utiliser l'ID numérique
        max_students: course.max_students || 30,
        schedule: course.schedule || ''
      });
    } else if (isOpen) {
      setFormData({
        course_code: '',
        title: '',
        description: '',
        credits: 3,
        department: 'Informatique',
        semester: 'fall',
        academic_year: new Date().getFullYear(),
        teacher: '',
        max_students: 30,
        schedule: ''
      });
    }
    setErrors({});
  }, [course, isOpen]);

  // Charger les enseignants
  useEffect(() => {
    const loadTeachers = async () => {
      // ✅ Charger les enseignants pour TOUS les modes
      if (isOpen) {
        try {
          setLoadingTeachers(true);
          console.log("📚 Chargement des enseignants...");
          
          const response = await teacherService.getAll({ page_size: 100 });
          console.log("📚 Réponse API enseignants:", response);
          
          let teachersData = [];
          
          // Gérer différents formats de réponse
          if (response && response.data) {
            if (Array.isArray(response.data)) {
              teachersData = response.data;
              console.log("📚 Format: tableau direct");
            } else if (response.data.results && Array.isArray(response.data.results)) {
              teachersData = response.data.results;
              console.log("📚 Format: pagination (results)");
            } else if (response.data.data && Array.isArray(response.data.data)) {
              teachersData = response.data.data;
              console.log("📚 Format: data field");
            } else if (typeof response.data === 'object') {
              // Essayer d'extraire un tableau des valeurs
              const values = Object.values(response.data);
              if (values.length > 0 && Array.isArray(values[0])) {
                teachersData = values[0];
              }
            }
          }
          
          console.log(`✅ ${teachersData.length} enseignants chargés:`, teachersData);
          
          // Log du premier enseignant pour vérifier la structure
          if (teachersData.length > 0) {
            console.log("📋 Structure du premier enseignant:", teachersData[0]);
            console.log("📋 Keys disponibles:", Object.keys(teachersData[0]));
          }
          
          setTeachers(teachersData);
        } catch (error) {
          console.error("❌ Erreur chargement enseignants:", error);
          console.error("📋 Détails:", error.response?.data);
          setTeachers([]);
        } finally {
          setLoadingTeachers(false);
        }
      }
    };
    
    if (isOpen) {
      loadTeachers();
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.course_code.trim()) {
      newErrors.course_code = "Le code du cours est requis";
    }
    
    if (!formData.title.trim()) {
      newErrors.title = "Le titre du cours est requis";
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "La description est requise";
    }
    
    if (formData.credits < 1 || formData.credits > 10) {
      newErrors.credits = "Les crédits doivent être entre 1 et 10";
    }
    
    if (!formData.department) {
      newErrors.department = "Le département est requis";
    }
    
    if (!formData.semester) {
      newErrors.semester = "Le semestre est requis";
    }
    
    if (formData.max_students < 1) {
      newErrors.max_students = "Le nombre maximum d'étudiants doit être au moins 1";
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
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Fonction pour obtenir le nom complet d'un enseignant
  const getTeacherFullName = (teacher) => {
    // Essayer différentes structures de données possibles
    if (teacher.user_first_name && teacher.user_last_name) {
      return `${teacher.user_first_name} ${teacher.user_last_name}`;
    } else if (teacher.user && teacher.user.first_name && teacher.user.last_name) {
      return `${teacher.user.first_name} ${teacher.user.last_name}`;
    } else if (teacher.first_name && teacher.last_name) {
      return `${teacher.first_name} ${teacher.last_name}`;
    } else if (teacher.full_name) {
      return teacher.full_name;
    } else if (teacher.name) {
      return teacher.name;
    }
    return `Enseignant ${teacher.id}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Données à envoyer au backend:", formData);
      
      const submissionData = {
        course_code: formData.course_code,
        title: formData.title,
        description: formData.description,
        credits: parseInt(formData.credits),
        department: formData.department,
        semester: formData.semester,
        academic_year: parseInt(formData.academic_year),
        max_students: parseInt(formData.max_students),
        schedule: formData.schedule
      };
      
      // ✅ Gérer le champ teacher correctement
      if (formData.teacher && formData.teacher !== '') {
        submissionData.teacher = parseInt(formData.teacher);
      } else {
        // Pour permettre null si aucun enseignant n'est sélectionné
        submissionData.teacher = null;
      }
      
      console.log("✅ Données formatées:", submissionData);
      
      await onSave(submissionData);
    } catch (error) {
      console.error('Erreur de soumission dans CourseModal:', error);
    } finally {
      setLoading(false);
    }
  };

  const departments = [
    'Informatique', 'Mathématiques', 'Physique', 'Chimie', 'Biologie',
    'Littérature', 'Histoire', 'Philosophie', 'Langues', 'Économie', 'Droit'
  ];

  const semesters = [
    { value: 'fall', label: 'Automne' },
    { value: 'spring', label: 'Printemps' },
    { value: 'summer', label: 'Été' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <BookOpen className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-800">
              {isEditing ? (course ? 'Modifier' : 'Ajouter') : 'Détails du'} cours
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

            {/* Informations du cours */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <BookOpen className="mr-2" size={18} />
                Informations du cours
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code du cours *
                  </label>
                  <input
                    type="text"
                    name="course_code"
                    value={formData.course_code}
                    onChange={handleChange}
                    required
                    disabled={!isEditing || loading}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.course_code ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="EX: INF-101"
                  />
                  {errors.course_code && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.course_code}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Crédits *
                  </label>
                  <input
                    type="number"
                    name="credits"
                    value={formData.credits}
                    onChange={handleChange}
                    required
                    min="1"
                    max="10"
                    disabled={!isEditing || loading}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.credits ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.credits && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.credits}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre du cours *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    disabled={!isEditing || loading}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Introduction à la programmation"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.title}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows="4"
                    disabled={!isEditing || loading}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Description détaillée du cours..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.description}
                    </p>
                  )}
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
                    Semestre *
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    required
                    disabled={!isEditing || loading}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.semester ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {semesters.map(sem => (
                      <option key={sem.value} value={sem.value}>{sem.label}</option>
                    ))}
                  </select>
                  {errors.semester && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.semester}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Année académique
                  </label>
                  <input
                    type="number"
                    name="academic_year"
                    value={formData.academic_year}
                    onChange={handleChange}
                    disabled={!isEditing || loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Users className="mr-2" size={16} />
                    Nombre max d'étudiants *
                  </label>
                  <input
                    type="number"
                    name="max_students"
                    value={formData.max_students}
                    onChange={handleChange}
                    required
                    min="1"
                    disabled={!isEditing || loading}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.max_students ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.max_students && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.max_students}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enseignant
                  </label>
                  {loadingTeachers ? (
                    <div className="flex items-center justify-center py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-500">Chargement...</span>
                    </div>
                  ) : (
                    <select
                      name="teacher"
                      value={formData.teacher}
                      onChange={handleChange}
                      disabled={!isEditing || loading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Aucun enseignant assigné</option>
                      {teachers.map(teacher => {
                        const fullName = getTeacherFullName(teacher);
                        const teacherId = teacher.teacher_id ? ` (${teacher.teacher_id})` : '';
                        
                        return (
                          <option key={teacher.id} value={teacher.id}>
                            {fullName}{teacherId}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emploi du temps
                  </label>
                  <textarea
                    name="schedule"
                    value={formData.schedule}
                    onChange={handleChange}
                    rows="3"
                    disabled={!isEditing || loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Lundi 10h-12h, Mercredi 14h-16h, etc."
                  />
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
                <span>{loading ? 'Enregistrement...' : (course ? 'Mettre à jour' : 'Ajouter')}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseModal;