import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Clock,
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  BarChart3,
  PlayCircle,
  CheckCircle,
  XCircle,
  GraduationCap,
  X
} from 'lucide-react';
import { courseService } from '../services/api';
import CourseModal from '../components/CourseModal';
import Toast from '../components/Toast';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  
  // États pour modal
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Toast notifications
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchCourses();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await courseService.getAll();
      console.log("📚 Réponse API courses:", response.data);
      setCourses(response.data || []);
    } catch (error) {
      console.error('❌ Erreur chargement cours:', error);
      showToast('Erreur lors du chargement des cours', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = () => {
    setSelectedCourse(null);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleViewCourse = (course) => {
    setSelectedCourse(course);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleDeleteCourse = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
      try {
        await courseService.delete(id);
        showToast('Cours supprimé avec succès', 'success');
        fetchCourses();
      } catch (error) {
        console.error('❌ Erreur suppression cours:', error);
        showToast('Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleSaveCourse = async (courseData) => {
    try {
      console.log("💾 Sauvegarde cours:", courseData);
      
      if (selectedCourse && selectedCourse.id) {
        // Mise à jour
        await courseService.update(selectedCourse.id, courseData);
        showToast('Cours mis à jour avec succès', 'success');
      } else {
        // Création
        await courseService.create(courseData);
        showToast('Cours ajouté avec succès', 'success');
      }
      
      setShowModal(false);
      setSelectedCourse(null);
      fetchCourses();
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde cours:', error);
      
      let errorMessage = 'Erreur lors de la sauvegarde';
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const errors = [];
          Object.keys(errorData).forEach(key => {
            if (Array.isArray(errorData[key])) {
              errors.push(...errorData[key]);
            } else if (typeof errorData[key] === 'string') {
              errors.push(errorData[key]);
            }
          });
          if (errors.length > 0) {
            errorMessage = errors.join(', ');
          }
        }
      }
      
      showToast(errorMessage, 'error');
    }
  };

  const departments = ['all', 'Informatique', 'Mathématiques', 'Physique', 'Chimie', 'Biologie', 
                      'Littérature', 'Histoire', 'Philosophie', 'Langues', 'Économie', 'Droit'];
  
  const semesters = [
    { value: 'all', label: 'Tous les semestres' },
    { value: 'fall', label: 'Automne' },
    { value: 'spring', label: 'Printemps' },
    { value: 'summer', label: 'Été' }
  ];

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    upcoming: 'bg-blue-100 text-blue-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const statusIcons = {
    active: PlayCircle,
    upcoming: Clock,
    completed: CheckCircle,
    cancelled: XCircle
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.course_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = selectedSemester === 'all' || course.semester === selectedSemester;
    const matchesDepartment = selectedDepartment === 'all' || course.department === selectedDepartment;
    return matchesSearch && matchesSemester && matchesDepartment;
  });

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCourses = filteredCourses.slice(startIndex, startIndex + itemsPerPage);

  if (loading && courses.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Toast Notifications */}
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, show: false })} 
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <BookOpen className="mr-3 text-blue-600" />
              Gestion des cours
            </h1>
            <p className="text-gray-600 mt-2">
              {courses.length} cours disponibles
            </p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={handleAddCourse}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Nouveau cours</span>
            </button>
            <button className="border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
              <BarChart3 size={20} />
              <span>Statistiques</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un cours..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtre semestre */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              {semesters.map(sem => (
                <option key={sem.value} value={sem.value}>
                  {sem.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre département */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'Tous départements' : dept}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button className="flex-1 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2">
              <Download size={18} />
              <span>Exporter</span>
            </button>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedDepartment('all');
                setSelectedSemester('all');
                setCurrentPage(1);
              }}
              className="flex-1 border border-red-300 text-red-600 px-4 py-3 rounded-lg hover:bg-red-50 flex items-center justify-center space-x-2"
            >
              <X size={18} />
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total cours</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{courses.length}</p>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <BookOpen size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Crédits totaux</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {courses.reduce((sum, c) => sum + (c.credits || 0), 0)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
              <Award size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Capacité totale</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {courses.reduce((sum, c) => sum + (c.max_students || 0), 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <Users size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Enseignants assignés</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {new Set(courses.map(c => c.teacher)).size}
              </p>
            </div>
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <GraduationCap size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des cours */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Enseignant</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Crédits</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Capacité</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedCourses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Aucun cours trouvé</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCourses.map((course, index) => (
                  <motion.tr
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-bold text-blue-600">{course.course_code}</td>
                    <td className="px-6 py-4">{course.title}</td>
                    <td className="px-6 py-4">{course.teacher_name || 'Non assigné'}</td>
                    <td className="px-6 py-4">{course.credits}</td>
                    <td className="px-6 py-4">{course.max_students}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewCourse(course)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleEditCourse(course)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteCourse(course.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredCourses.length)} 
              sur {filteredCourses.length} cours
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50"
              >
                <ChevronLeft size={20} />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = (currentPage <= 3) ? i + 1 : (currentPage >= totalPages - 2) ? totalPages - 4 + i : currentPage - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg ${
                      currentPage === pageNum ? 'bg-blue-600 text-white' : 'border border-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modal */}
      {showModal && (
        <CourseModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedCourse(null);
          }}
          course={selectedCourse}
          isEditing={isEditing}
          onSave={handleSaveCourse}
        />
      )}
    </div>
  );
};

export default Courses;