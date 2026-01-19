import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, BookOpen, AlertCircle } from 'lucide-react';
import { examService } from '../services/api';
import { courseService } from '../services/api';

const ExamsModal = ({ isOpen, onClose, exam, onSuccess }) => {
  const [formData, setFormData] = useState({
    course: '',
    exam_type: 'midterm',
    title: '',
    description: '',
    date: '',
    time: '',
    duration: '',
    location: '',
    max_students: 30,
    status: 'upcoming'
  });
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadCourses();
      if (exam) {
        // Mode édition - extraire correctement les données
        console.log("📝 Exam data received:", exam);
        setFormData({
          course: exam.course?.id || exam.course || '', // Gérer si course est un objet ou un ID
          exam_type: exam.exam_type || 'midterm',
          title: exam.title || '',
          description: exam.description || '',
          date: exam.date || '',
          time: exam.time || '',
          duration: exam.duration || '',
          location: exam.location || '',
          max_students: exam.max_students || 30,
          status: exam.status || 'upcoming'
        });
      } else {
        // Mode création - réinitialiser
        resetForm();
      }
    }
  }, [isOpen, exam]);

  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      const response = await courseService.getAll();
      if (response.data) {
        // Extraire les données correctement
        let coursesData = [];
        if (Array.isArray(response.data)) {
          coursesData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          coursesData = response.data.results;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          coursesData = response.data.data;
        }
        console.log(`📚 ${coursesData.length} cours chargés`);
        setCourses(coursesData);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setError('Erreur lors du chargement des cours');
    } finally {
      setLoadingCourses(false);
    }
  };

  const resetForm = () => {
    setFormData({
      course: '',
      exam_type: 'midterm',
      title: '',
      description: '',
      date: '',
      time: '',
      duration: '',
      location: '',
      max_students: 30,
      status: 'upcoming'
    });
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.course) {
      setError('Veuillez sélectionner un cours');
      return false;
    }
    if (!formData.title.trim()) {
      setError('Le titre est requis');
      return false;
    }
    if (!formData.date) {
      setError('La date est requise');
      return false;
    }
    if (!formData.time) {
      setError('L\'heure est requise');
      return false;
    }
    if (!formData.duration) {
      setError('La durée est requise');
      return false;
    }
    if (!formData.location.trim()) {
      setError('Le lieu est requis');
      return false;
    }
    if (formData.max_students < 1) {
      setError('Le nombre maximum d\'étudiants doit être au moins 1');
      return false;
    }
    return true;
  };

  const formatFormDataForAPI = () => {
    // Formater les données pour correspondre au serializer Django
    const apiData = {
      course: parseInt(formData.course),
      exam_type: formData.exam_type,
      title: formData.title,
      description: formData.description || '',
      date: formData.date,
      time: formData.time,
      duration: formData.duration,
      location: formData.location,
      max_students: parseInt(formData.max_students),
      status: formData.status
    };
    
    console.log("📤 Données formatées pour l'API:", apiData);
    return apiData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("🔄 Début de la soumission du formulaire");
    
    if (!validateForm()) {
      console.log("❌ Validation du formulaire échouée");
      return;
    }
  
    setLoading(true);
    setError('');
  
    try {
      // 1. Formatter les données
      const formattedData = formatFormDataForAPI();
      console.log("📤 Données formatées pour l'API:", JSON.stringify(formattedData, null, 2));
      
      let response;
      
      if (exam && exam.id) {
        // Mode édition
        console.log(`✏️ Mode ÉDITION - Mise à jour de l'examen ID: ${exam.id}`);
        console.log(`📤 URL: PUT /exams/exams/${exam.id}/`);
        response = await examService.update(exam.id, formattedData);
      } else {
        // Mode création
        console.log("➕ Mode CRÉATION - Nouvel examen");
        console.log("📤 URL: POST /exams/exams/");
        response = await examService.create(formattedData);
      }
  
      console.log("✅ Réponse API reçue:", {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      // 2. Vérifier la réponse
      if (response.data) {
        // Vérifier la structure de la réponse
        if (response.data.success === false) {
          console.log("⚠️ API a retourné success: false");
          throw new Error(response.data.error || response.data.message || 'Erreur de l\'API');
        }
        
        console.log("🎉 Succès! Fermeture de la modal et rechargement des données...");
        
        // 3. Notifier le succès
        if (onSuccess) {
          await onSuccess();
        }
        
        // 4. Fermer et réinitialiser
        onClose();
        resetForm();
        
      } else {
        console.error("❌ Réponse API sans données:", response);
        setError('La réponse du serveur est vide');
      }
      
    } catch (error) {
      console.error('❌ ERREUR lors de la sauvegarde:', error);
      
      // Log détaillé de l'erreur
      console.error("📋 Détails complets de l'erreur:", {
        nom: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data
        } : null
      });
      
      // 5. Afficher l'erreur à l'utilisateur
      let errorMessage = 'Erreur lors de l\'enregistrement';
      
      if (error.response) {
        // Erreur HTTP avec réponse
        console.error(`📊 Statut HTTP: ${error.response.status} - ${error.response.statusText}`);
        
        if (error.response.data) {
          console.error("📋 Données d'erreur du serveur:", error.response.data);
          
          // Gestion des différentes structures d'erreur Django
          if (typeof error.response.data === 'object') {
            const errors = [];
            
            // Parcourir toutes les clés d'erreur
            Object.keys(error.response.data).forEach(key => {
              const value = error.response.data[key];
              
              if (Array.isArray(value)) {
                // Erreurs Django standard (liste)
                value.forEach(err => {
                  errors.push(`${key}: ${err}`);
                });
              } else if (typeof value === 'string') {
                // Message d'erreur simple
                errors.push(`${key}: ${value}`);
              } else if (value && typeof value === 'object') {
                // Erreurs imbriquées
                Object.keys(value).forEach(subKey => {
                  errors.push(`${key}.${subKey}: ${value[subKey]}`);
                });
              }
            });
            
            if (errors.length > 0) {
              errorMessage = errors.join('\n');
            } else if (error.response.data.error) {
              errorMessage = error.response.data.error;
            } else if (error.response.data.detail) {
              errorMessage = error.response.data.detail;
            }
          } else if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          }
        } else {
          errorMessage = `Erreur serveur: ${error.response.status} ${error.response.statusText}`;
        }
        
      } else if (error.request) {
        // Erreur réseau (pas de réponse)
        console.error("🌐 Erreur réseau - Pas de réponse du serveur");
        if (error.code === 'ERR_NETWORK') {
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
        } else {
          errorMessage = `Erreur réseau: ${error.message}`;
        }
        
      } else if (error.message) {
        // Erreur JS locale
        console.error("⚡ Erreur JavaScript:", error.message);
        errorMessage = error.message;
      }
      
      // 6. Afficher l'erreur dans l'UI
      setError(errorMessage);
      
      // 7. Proposer des solutions si c'est une erreur 400 (Bad Request)
      if (error.response?.status === 400) {
        console.log("💡 Suggestions pour erreur 400:");
        console.log("- Vérifiez que tous les champs requis sont remplis");
        console.log("- Vérifiez les formats des dates et heures");
        console.log("- Assurez-vous que l'ID du cours existe");
      }
      
    } finally {
      console.log("🏁 Fin du processus de soumission");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            {exam ? 'Modifier l\'examen' : 'Planifier un nouvel examen'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="text-red-500 mr-2 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-red-700 whitespace-pre-line">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cours */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BookOpen className="inline mr-2" size={16} />
                Cours *
              </label>
              <select
                name="course"
                value={formData.course}
                onChange={handleChange}
                disabled={loadingCourses}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                required
              >
                <option value="">
                  {loadingCourses ? 'Chargement des cours...' : 'Sélectionner un cours'}
                </option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.course_code} - {course.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Type d'examen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d'examen *
              </label>
              <select
                name="exam_type"
                value={formData.exam_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="final">Examen Final</option>
                <option value="midterm">Partiel</option>
                <option value="quiz">Quiz</option>
                <option value="oral">Oral</option>
                <option value="practical">Pratique</option>
              </select>
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="upcoming">À venir</option>
                <option value="ongoing">En cours</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>

            {/* Titre */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre de l'examen *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ex: Examen Final - Mathématiques"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline mr-2" size={16} />
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]} // Pas de dates passées
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Heure */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline mr-2" size={16} />
                Heure *
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Durée */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée *
              </label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="Ex: 2 heures"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Format: "2 heures", "90 minutes", etc.</p>
            </div>

            {/* Lieu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline mr-2" size={16} />
                Lieu *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ex: Salle A-101, Bâtiment Principal"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Nombre max d'étudiants */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="inline mr-2" size={16} />
                Nombre maximum d'étudiants *
              </label>
              <input
                type="number"
                name="max_students"
                value={formData.max_students}
                onChange={handleChange}
                min="1"
                max="500"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Capacité maximale de la salle</p>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Instructions, matériel autorisé, informations complémentaires..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </>
              ) : exam ? 'Mettre à jour' : 'Créer l\'examen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExamsModal;