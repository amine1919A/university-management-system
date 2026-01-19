import React, { useState, useEffect } from 'react';
import { X, Save, Award, AlertCircle, User, BookOpen, Calendar, Lock } from 'lucide-react';
import { gradeService } from '../services/api';

const NoteModal = ({ isOpen, onClose, grade, onSuccess, students, courses, showToast }) => {
  const [formData, setFormData] = useState({
    student: '',
    course: '',
    score: '',
    semester: 'fall',
    academic_year: new Date().getFullYear(),
    comment: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Fonction utilitaire pour extraire l'ID étudiant de différentes structures
  const extractStudentId = (grade) => {
    if (!grade) return '';
    
    console.log("🔍 Extraction ID étudiant de:", grade);
    
    // Si grade.student est un objet avec propriété id
    if (grade.student && typeof grade.student === 'object') {
      if (grade.student.id) {
        console.log("✅ ID extrait de grade.student.id:", grade.student.id);
        return grade.student.id.toString();
      }
      if (grade.student.student_id) {
        // Si c'est le numéro d'étudiant, chercher l'ID correspondant
        const student = students.find(s => s.student_id === grade.student.student_id);
        console.log("✅ ID trouvé via student_id:", student?.id);
        return student?.id?.toString() || '';
      }
    }
    
    // Si grade.student est un nombre (ID)
    if (grade.student && !isNaN(parseInt(grade.student))) {
      console.log("✅ ID direct de grade.student:", grade.student);
      return grade.student.toString();
    }
    
    // Si grade a un student_id (numéro d'étudiant)
    if (grade.student_id) {
      const student = students.find(s => s.student_id === grade.student_id);
      console.log("✅ ID trouvé via grade.student_id:", student?.id);
      return student?.id?.toString() || '';
    }
    
    // Si grade a un student_name, chercher par nom (dernier recours)
    if (grade.student_name) {
      const nameParts = grade.student_name.split(' ');
      if (nameParts.length >= 2) {
        const student = students.find(s => 
          s.user_first_name === nameParts[0] && 
          s.user_last_name === nameParts.slice(1).join(' ')
        );
        console.log("✅ ID trouvé via student_name:", student?.id);
        return student?.id?.toString() || '';
      }
    }
    
    console.log("❌ Aucun ID étudiant trouvé");
    return '';
  };

  // Fonction similaire pour l'ID cours
  const extractCourseId = (grade) => {
    if (!grade) return '';
    
    console.log("🔍 Extraction ID cours de:", grade);
    
    if (grade.course && typeof grade.course === 'object') {
      if (grade.course.id) {
        console.log("✅ ID extrait de grade.course.id:", grade.course.id);
        return grade.course.id.toString();
      }
      if (grade.course.course_code) {
        const course = courses.find(c => c.course_code === grade.course.course_code);
        console.log("✅ ID trouvé via course_code:", course?.id);
        return course?.id?.toString() || '';
      }
    }
    
    if (grade.course && !isNaN(parseInt(grade.course))) {
      console.log("✅ ID direct de grade.course:", grade.course);
      return grade.course.toString();
    }
    
    if (grade.course_id) {
      const course = courses.find(c => c.id === parseInt(grade.course_id));
      console.log("✅ ID trouvé via grade.course_id:", course?.id);
      return course?.id?.toString() || '';
    }
    
    // Si grade a un course_code, chercher par code
    if (grade.course_code) {
      const course = courses.find(c => c.course_code === grade.course_code);
      console.log("✅ ID trouvé via grade.course_code:", course?.id);
      return course?.id?.toString() || '';
    }
    
    console.log("❌ Aucun ID cours trouvé");
    return '';
  };

  // Réinitialiser les états quand la modal s'ouvre/ferme
  useEffect(() => {
    if (isOpen) {
      const editMode = !!grade;
      setIsEditMode(editMode);
      
      if (grade) {
        console.log("📝 Mode édition - Données note complètes:", grade);
        console.log("📝 Structure grade.student:", grade.student);
        console.log("📝 Structure grade.course:", grade.course);
        console.log("📝 grade.student_id:", grade.student_id);
        console.log("📝 grade.course_code:", grade.course_code);
        
        // Extraire les IDs en utilisant les fonctions utilitaires
        const studentId = extractStudentId(grade);
        const courseId = extractCourseId(grade);
        
        console.log("📝 IDs extraits - Étudiant:", studentId, "Cours:", courseId);
        console.log("📝 Liste étudiants disponibles:", students.map(s => ({ 
          id: s.id, 
          student_id: s.student_id, 
          name: `${s.user_first_name} ${s.user_last_name}` 
        })));
        console.log("📝 Liste cours disponibles:", courses.map(c => ({ 
          id: c.id, 
          course_code: c.course_code, 
          title: c.title 
        })));
        
        setFormData({
          student: studentId,
          course: courseId,
          score: grade.score?.toString() || '',
          semester: grade.semester || 'fall',
          academic_year: grade.academic_year || new Date().getFullYear(),
          comment: grade.comment || ''
        });
      } else {
        // Réinitialiser pour nouvelle note
        setFormData({
          student: '',
          course: '',
          score: '',
          semester: 'fall',
          academic_year: new Date().getFullYear(),
          comment: ''
        });
      }
      setErrors({});
      setSuccessMessage('');
    }
  }, [grade, isOpen, students, courses]);

  // Récupérer le nom de l'étudiant et du cours
  const getStudentName = (studentId) => {
    if (!studentId || studentId === '') return 'Non spécifié';
    try {
      const student = students.find(s => s.id === parseInt(studentId));
      return student ? `${student.user_first_name} ${student.user_last_name}` : 'Étudiant inconnu';
    } catch (error) {
      console.error("❌ Erreur getStudentName:", error);
      return 'Erreur';
    }
  };

  const getCourseName = (courseId) => {
    if (!courseId || courseId === '') return 'Non spécifié';
    try {
      const course = courses.find(c => c.id === parseInt(courseId));
      return course ? `${course.course_code} - ${course.title}` : 'Cours inconnu';
    } catch (error) {
      console.error("❌ Erreur getCourseName:", error);
      return 'Erreur';
    }
  };

  // Fonction handleChange
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

  // Fonction getScoreCategory
  const getScoreCategory = (score) => {
    try {
      const numericScore = parseFloat(score);
      if (isNaN(numericScore)) return 'non défini';
      if (numericScore >= 15) return 'Excellent';
      if (numericScore >= 10) return 'Bien';
      if (numericScore >= 5) return 'Moyen';
      return 'Échec';
    } catch (error) {
      return 'erreur';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validation pour mode création
    if (!isEditMode) {
      if (!formData.student) {
        newErrors.student = "L'étudiant est requis";
      } else if (isNaN(parseInt(formData.student))) {
        newErrors.student = "L'ID étudiant doit être un nombre valide";
      }
      
      if (!formData.course) {
        newErrors.course = "Le cours est requis";
      } else if (isNaN(parseInt(formData.course))) {
        newErrors.course = "L'ID cours doit être un nombre valide";
      }
    }
    
    // Validation commune
    if (!formData.score) {
      newErrors.score = "La note est requise";
    } else {
      const score = parseFloat(formData.score);
      if (isNaN(score)) {
        newErrors.score = "La note doit être un nombre";
      } else if (score < 0 || score > 20) {
        newErrors.score = "La note doit être entre 0 et 20";
      }
    }
    
    if (!formData.semester) {
      newErrors.semester = "Le semestre est requis";
    }
    
    if (!formData.academic_year) {
      newErrors.academic_year = "L'année académique est requise";
    } else if (isNaN(parseInt(formData.academic_year))) {
      newErrors.academic_year = "L'année doit être un nombre";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("📝 Données du formulaire avant soumission:", formData);
    console.log("📝 Mode édition:", isEditMode);
    
    if (!validateForm()) {
      const errorMessage = Object.values(errors).filter(Boolean).join(', ');
      console.log("❌ Erreurs de validation:", errors);
      if (showToast && errorMessage) {
        showToast(`Erreurs: ${errorMessage}`, 'error');
      }
      return;
    }
    
    setLoading(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      // Préparer les données pour l'API
      const submissionData = {};
      
      if (isEditMode && grade && grade.id) {
        // MODE ÉDITION - Ne pas envoyer student et course
        // On ne modifie que la note, semestre, année et commentaire
        
        // Vérifier si la note a changé
        if (formData.score !== grade.score?.toString()) {
          submissionData.score = parseFloat(formData.score);
        }
        
        // Vérifier si le semestre a changé
        if (formData.semester !== grade.semester) {
          submissionData.semester = formData.semester;
        }
        
        // Vérifier si l'année a changé
        if (parseInt(formData.academic_year) !== grade.academic_year) {
          submissionData.academic_year = parseInt(formData.academic_year);
        }
        
        // Vérifier si le commentaire a changé
        if (formData.comment !== grade.comment) {
          submissionData.comment = formData.comment || '';
        }
        
        // IMPORTANT: NE PAS INCLURE student et course en mode édition
        console.log("📤 Données mise à jour envoyées (mode édition - student/course exclus):", submissionData);
        
        // Vérifier si on a des données à mettre à jour
        if (Object.keys(submissionData).length === 0) {
          setSuccessMessage('Aucune modification détectée');
          if (showToast) {
            showToast('Aucune modification détectée', 'info');
          }
          setTimeout(() => {
            onClose();
          }, 1500);
          return;
        }
        
        const response = await gradeService.update(grade.id, submissionData);
        console.log("✅ Réponse mise à jour:", response);
        setSuccessMessage('Note mise à jour avec succès!');
        if (showToast) {
          showToast('Note mise à jour avec succès!', 'success');
        }
        
      } else {
        // MODE CRÉATION - Envoyer toutes les données
        submissionData.student = parseInt(formData.student);
        submissionData.course = parseInt(formData.course);
        submissionData.score = parseFloat(formData.score);
        submissionData.semester = formData.semester;
        submissionData.academic_year = parseInt(formData.academic_year);
        submissionData.comment = formData.comment || '';
        
        console.log("📤 Données création envoyées:", submissionData);
        
        const response = await gradeService.create(submissionData);
        console.log("✅ Réponse création:", response);
        setSuccessMessage('Note ajoutée avec succès!');
        if (showToast) {
          showToast('Note ajoutée avec succès!', 'success');
        }
      }
      
      // Attendre un peu pour que l'utilisateur voie le message de succès
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement:', error);
      
      let errorMessage = 'Erreur lors de la sauvegarde';
      let validationErrors = {};
      
      // Gestion des erreurs API
      if (error.response) {
        const errorData = error.response.data;
        console.error('📋 Détails erreur API:', errorData);
        
        if (errorData.error) {
          errorMessage = errorData.error;
        }
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (typeof errorData.detail === 'object') {
            // Formater les erreurs de validation
            const errorsArray = [];
            Object.keys(errorData.detail).forEach(key => {
              if (Array.isArray(errorData.detail[key])) {
                errorsArray.push(`${key}: ${errorData.detail[key].join(', ')}`);
                validationErrors[key] = errorData.detail[key].join(', ');
              } else {
                errorsArray.push(`${key}: ${errorData.detail[key]}`);
                validationErrors[key] = errorData.detail[key];
              }
            });
            errorMessage = errorsArray.join('; ');
          }
        }
        
        // Mettre à jour les erreurs de formulaire
        if (errorData.errors) {
          setErrors(errorData.errors);
          validationErrors = errorData.errors;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('📋 Message d\'erreur complet:', errorMessage);
      
      // Afficher l'erreur dans la modal
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
      } else {
        setErrors({ general: errorMessage });
      }
      
      // Afficher aussi le toast si la fonction existe
      if (typeof showToast === 'function') {
        showToast(errorMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const semesters = [
    { value: 'fall', label: 'Automne' },
    { value: 'spring', label: 'Printemps' },
    { value: 'summer', label: 'Été' }
  ];

  const years = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year, label: year.toString() };
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <Award className="text-blue-600" size={24} />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {isEditMode ? 'Modifier la note' : 'Ajouter une note'}
              </h2>
              {isEditMode && grade && (
                <p className="text-sm text-gray-600 mt-1">
                  Note ID: {grade.id} • {grade.created_at ? `Créée le ${new Date(grade.created_at).toLocaleDateString('fr-FR')}` : ''}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Mode édition - Affichage des informations fixes */}
            {isEditMode && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                  <Lock size={16} className="mr-2" />
                  Informations verrouillées (mode édition)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-blue-600">Étudiant</p>
                    <p className="font-medium text-blue-800">
                      {getStudentName(formData.student)}
                    </p>
                    <p className="text-xs text-blue-500">
                      ID: {formData.student || 'Non spécifié'}
                    </p>
                    {grade?.student_id && (
                      <p className="text-xs text-blue-400">
                        Matricule: {grade.student_id}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Cours</p>
                    <p className="font-medium text-blue-800">
                      {getCourseName(formData.course)}
                    </p>
                    <p className="text-xs text-blue-500">
                      ID: {formData.course || 'Non spécifié'}
                    </p>
                    {grade?.course_code && (
                      <p className="text-xs text-blue-400">
                        Code: {grade.course_code}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Message de succès */}
            {successMessage && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
                <Award className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={20} />
                <span className="text-green-700 font-medium">{successMessage}</span>
              </div>
            )}

            {/* Message de chargement */}
            {loading && (
              <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-blue-600">Traitement en cours...</span>
              </div>
            )}

            {/* Message d'erreur général */}
            {errors.general && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="text-red-500 mr-2 flex-shrink-0 mt-0.5" size={20} />
                <span className="text-red-700">{errors.general}</span>
              </div>
            )}

            {/* Champs du formulaire */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <Award className="mr-2" size={18} />
                {isEditMode ? 'Modifier la note' : 'Informations de la note'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Étudiant - seulement en mode création */}
                {!isEditMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <User className="inline mr-2" size={16} />
                      Étudiant *
                    </label>
                    <select
                      name="student"
                      value={formData.student}
                      onChange={handleChange}
                      required={!isEditMode}
                      disabled={loading || isEditMode}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.student ? 'border-red-500' : 'border-gray-300'
                      } ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                      <option value="">Sélectionner un étudiant</option>
                      {students.map(student => (
                        <option key={student.id} value={student.id}>
                          {student.user_first_name} {student.user_last_name} ({student.student_id})
                        </option>
                      ))}
                    </select>
                    {errors.student && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        {errors.student}
                      </p>
                    )}
                  </div>
                )}

                {/* Cours - seulement en mode création */}
                {!isEditMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <BookOpen className="inline mr-2" size={16} />
                      Cours *
                    </label>
                    <select
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      required={!isEditMode}
                      disabled={loading || isEditMode}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.course ? 'border-red-500' : 'border-gray-300'
                      } ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                      <option value="">Sélectionner un cours</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.course_code} - {course.title}
                        </option>
                      ))}
                    </select>
                    {errors.course && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        {errors.course}
                      </p>
                    )}
                  </div>
                )}

                {/* Note (toujours modifiable) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note /20 *
                  </label>
                  <input
                    type="number"
                    name="score"
                    value={formData.score}
                    onChange={handleChange}
                    required
                    step="0.01"
                    min="0"
                    max="20"
                    disabled={loading}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.score ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0-20"
                  />
                  {errors.score && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.score}
                    </p>
                  )}
                  {formData.score && !errors.score && (
                    <div className="mt-2">
                      <span className="text-sm font-medium">
                        Catégorie: {getScoreCategory(formData.score)}
                      </span>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${
                            parseFloat(formData.score) >= 15 ? 'bg-green-500' :
                            parseFloat(formData.score) >= 10 ? 'bg-blue-500' :
                            parseFloat(formData.score) >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(parseFloat(formData.score) / 20) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Semestre (modifiable en édition) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semestre *
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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

                {/* Année académique (modifiable en édition) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline mr-2" size={16} />
                    Année académique *
                  </label>
                  <select
                    name="academic_year"
                    value={formData.academic_year}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.academic_year ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {years.map(year => (
                      <option key={year.value} value={year.value}>{year.label}</option>
                    ))}
                  </select>
                  {errors.academic_year && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.academic_year}
                    </p>
                  )}
                </div>

                {/* Commentaire */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commentaire
                  </label>
                  <textarea
                    name="comment"
                    value={formData.comment}
                    onChange={handleChange}
                    rows="3"
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Observations sur la note..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optionnel: Appréciation, remarques, etc.
                  </p>
                </div>
              </div>
            </div>

            {/* Résumé */}
            {!loading && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Résumé</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Étudiant {isEditMode ? '(verrouillé)' : ''}</p>
                    <p className="font-medium">
                      {getStudentName(formData.student)}
                    </p>
                    {formData.student && (
                      <p className="text-xs text-gray-500">
                        ID: {formData.student}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cours {isEditMode ? '(verrouillé)' : ''}</p>
                    <p className="font-medium">
                      {getCourseName(formData.course)}
                    </p>
                    {formData.course && (
                      <p className="text-xs text-gray-500">
                        ID: {formData.course}
                      </p>
                    )}
                  </div>
                  {isEditMode && grade?.score && (
                    <div>
                      <p className="text-xs text-gray-500">Note actuelle</p>
                      <p className="text-lg font-bold text-gray-800">
                        {grade.score}/20
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">{isEditMode ? 'Nouvelle note' : 'Note'}</p>
                    <p className={`text-2xl font-bold ${
                      parseFloat(formData.score || 0) >= 10 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formData.score || 'N/A'}/20
                    </p>
                  </div>
                  {isEditMode && grade?.score && formData.score && parseFloat(formData.score) !== parseFloat(grade.score) && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Différence</p>
                      <p className={`font-bold ${
                        parseFloat(formData.score) > parseFloat(grade.score) ? 'text-green-600' :
                        parseFloat(formData.score) < parseFloat(grade.score) ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {parseFloat(formData.score) > parseFloat(grade.score) ? '↑' :
                         parseFloat(formData.score) < parseFloat(grade.score) ? '↓' : '='}
                        {Math.abs(parseFloat(formData.score) - parseFloat(grade.score)).toFixed(2)} points
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              <span>{loading ? 'Enregistrement...' : (isEditMode ? 'Mettre à jour la note' : 'Ajouter la note')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteModal;