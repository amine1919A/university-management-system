import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar,
  Book,
  Award,
  Users,
  Download,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Save,
  Building 
} from 'lucide-react';
import { teacherService } from '../services/api';
import TeacherModal from '../components/TeacherModal';
import Toast from '../components/Toast';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedRank, setSelectedRank] = useState('all');
  
  // États pour les modals et actions
  const [showModal, setShowModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [statistics, setStatistics] = useState({
    total_teachers: 0,
    new_this_month: 0,
    with_office: 0,
    departments_count: 0,
    ranks_count: 0
  });
  
  // États pour les notifications
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchTeachers();
    fetchStatistics();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedDepartment !== 'all') params.department = selectedDepartment;
      if (selectedRank !== 'all') params.rank = selectedRank;
      
      console.log("🔄 Chargement des enseignants avec params:", params);
      
      const response = await teacherService.getAll(params);
      
      // Debug: afficher la structure complète
      console.log("📦 Structure complète de la réponse:", {
        responseData: response.data,
        type: typeof response.data,
        isArray: Array.isArray(response.data),
        keys: response.data ? Object.keys(response.data) : 'null'
      });
      
      let teachersArray = [];
      
      if (response.data) {
        if (response.data.success !== undefined && response.data.data !== undefined) {
          // Format: {success: true, data: [...], count: ...}
          console.log("📊 Format détecté: success/data");
          teachersArray = response.data.data || [];
        } else if (Array.isArray(response.data)) {
          // Format: [...]
          console.log("📊 Format détecté: array direct");
          teachersArray = response.data;
        } else if (response.data.results !== undefined) {
          // Format paginé: {results: [...], count: ...}
          console.log("📊 Format détecté: paginated results");
          teachersArray = response.data.results || [];
        } else {
          // Autre format, essayons d'extraire ce qui ressemble à un tableau
          console.log("📊 Format inconnu, tentative d'extraction...");
          
          // Chercher la première propriété qui est un tableau
          for (const key in response.data) {
            if (Array.isArray(response.data[key])) {
              teachersArray = response.data[key];
              console.log(`📊 Tableau trouvé dans la propriété: ${key}`);
              break;
            }
          }
          
          // Si rien trouvé, utiliser un tableau vide
          if (teachersArray.length === 0) {
            console.warn("⚠️ Aucun tableau trouvé dans la réponse, utilisation d'un tableau vide");
            teachersArray = [];
          }
        }
      }
      
      console.log(`✅ ${teachersArray.length} enseignants chargés`);
      setTeachers(teachersArray);
      
    } catch (error) {
      console.error('❌ Erreur chargement enseignants:', error);
      console.error('📋 Détails erreur:', error.response?.data || error.message);
      showToast('Erreur lors du chargement des enseignants', 'error');
      setTeachers([]); // Toujours définir un tableau
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await teacherService.getStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  const handleAddTeacher = () => {
    setSelectedTeacher(null);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleEditTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleViewTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleDeleteTeacher = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet enseignant ?')) {
      try {
        await teacherService.delete(id);
        showToast('Enseignant supprimé avec succès', 'success');
        fetchTeachers();
        fetchStatistics();
      } catch (error) {
        console.error('Erreur suppression enseignant:', error);
        showToast('Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleSaveTeacher = async (teacherData) => {
    try {
      console.log("💾 Sauvegarde enseignant:", teacherData);
      console.log("📌 Enseignant sélectionné:", selectedTeacher);
      
      let response;
      
      if (selectedTeacher && selectedTeacher.id) {
        // Mise à jour
        console.log(`🔄 Mise à jour enseignant ID: ${selectedTeacher.id}`);
        response = await teacherService.update(selectedTeacher.id, teacherData);
        console.log("✅ Réponse mise à jour:", response.data);
        showToast('Enseignant mis à jour avec succès', 'success');
      } else {
        // Création
        console.log("➕ Création nouvel enseignant");
        response = await teacherService.create(teacherData);
        console.log("✅ Réponse création:", response.data);
        showToast('Enseignant ajouté avec succès', 'success');
      }
      
      // Fermer le modal immédiatement
      setShowModal(false);
      setSelectedTeacher(null);
      
      // Rafraîchir les données avec un court délai
      setTimeout(() => {
        fetchTeachers();
        fetchStatistics();
      }, 500);
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde enseignant:', error);
      console.error('📋 Détails erreur:', error.response?.data);
      
      let errorMessage = 'Erreur lors de la sauvegarde';
      
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        
        // Afficher le message d'erreur spécifique
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.formatted_errors) {
          errorMessage = errorData.formatted_errors.join(', ');
        } else if (errorData.errors) {
          // Extraire toutes les erreurs
          const errors = [];
          Object.keys(errorData.errors).forEach(key => {
            if (Array.isArray(errorData.errors[key])) {
              errors.push(...errorData.errors[key].map(err => `${key}: ${err}`));
            } else if (typeof errorData.errors[key] === 'string') {
              errors.push(`${key}: ${errorData.errors[key]}`);
            }
          });
          if (errors.length > 0) {
            errorMessage = errors.join(', ');
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }
      
      showToast(errorMessage, 'error');
    }
  };
  // Fonction utilitaire pour extraire les données d'un enseignant
const extractTeacherData = (teacher) => {
    if (!teacher) return null;
    
    return {
      id: teacher.id,
      teacher_id: teacher.teacher_id,
      
      // Données enseignant directes
      hire_date: teacher.hire_date,
      department: teacher.department,
      specialization: teacher.specialization,
      rank: teacher.rank,
      office_number: teacher.office_number,
      office_hours: teacher.office_hours,
      
      // Données utilisateur (peuvent être à différents niveaux)
      first_name: teacher.first_name || teacher.user_first_name || teacher.user?.first_name,
      last_name: teacher.last_name || teacher.user_last_name || teacher.user?.last_name,
      email: teacher.email || teacher.user_email || teacher.user?.email,
      phone: teacher.phone || teacher.user_phone || teacher.user?.phone,
      date_of_birth: teacher.date_of_birth || teacher.user_date_of_birth || teacher.user?.date_of_birth,
      
      // Référence à l'objet complet pour debug
      _raw: teacher
    };
  };

  const handleExport = async () => {
    try {
      const response = await teacherService.exportData('csv');
      
      // Créer un lien pour télécharger le fichier
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `enseignants_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showToast('Export réalisé avec succès', 'success');
    } catch (error) {
      console.error('Erreur export:', error);
      showToast('Erreur lors de l\'export', 'error');
    }
  };

  // Filtrage local pour la pagination
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      (teacher.teacher_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.first_name || teacher.user?.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.last_name || teacher.user?.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.specialization || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.email || teacher.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'all' || 
      (teacher.department === selectedDepartment);
    
    const matchesRank = selectedRank === 'all' || 
      (teacher.rank === selectedRank);
    
    return matchesSearch && matchesDepartment && matchesRank;
  });

  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTeachers = filteredTeachers.slice(startIndex, startIndex + itemsPerPage);

  // Options pour les filtres
  const departments = ['all', 'Informatique', 'Mathématiques', 'Physique', 'Chimie', 'Biologie', 
                      'Littérature', 'Histoire', 'Philosophie', 'Langues', 'Économie'];
  
  const ranks = [
    { value: 'all', label: 'Tous les grades' },
    { value: 'professor', label: 'Professeur' },
    { value: 'associate', label: 'Professeur Associé' },
    { value: 'assistant', label: 'Assistant' },
    { value: 'lecturer', label: 'Maître de Conférences' }
  ];

  const rankLabels = {
    'professor': 'Professeur',
    'associate': 'Professeur Associé',
    'assistant': 'Assistant',
    'lecturer': 'Maître de Conférences'
  };

  if (loading && teachers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des enseignants...</p>
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
              <GraduationCap className="mr-3 text-green-600" />
              Gestion des enseignants
            </h1>
            <p className="text-gray-600 mt-2">
              {teachers.length} enseignant(s) dans le système
            </p>
          </div>
          <button 
            onClick={handleAddTeacher}
            className="btn-primary flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
          >
            <Plus size={20} />
            <span>Ajouter un enseignant</span>
          </button>
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
              placeholder="Rechercher un enseignant..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
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
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
            >
              <option value="all">Tous les départements</option>
              {departments.filter(d => d !== 'all').map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre grade */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedRank}
              onChange={(e) => {
                setSelectedRank(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
            >
              {ranks.map(rank => (
                <option key={rank.value} value={rank.value}>
                  {rank.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button 
              onClick={handleExport}
              className="flex-1 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2 transition"
            >
              <Download size={18} />
              <span>Exporter</span>
            </button>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedDepartment('all');
                setSelectedRank('all');
                setCurrentPage(1);
              }}
              className="flex-1 border border-red-300 text-red-600 px-4 py-3 rounded-lg hover:bg-red-50 flex items-center justify-center space-x-2 transition"
            >
              <X size={18} />
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tableau des enseignants */}
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
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Enseignant
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom & Prénom
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spécialisation
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Département
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date d'embauche
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedTeachers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Aucun enseignant trouvé</p>
                      <p className="mt-2">Ajustez vos filtres ou ajoutez des enseignants</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTeachers.map((teacher, index) => (
                  <motion.tr
                    key={teacher.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-green-600">
                        {teacher.teacher_id || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3">
                          <GraduationCap size={18} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {teacher.first_name || teacher.user?.first_name} {teacher.last_name || teacher.user?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {teacher.email || teacher.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{teacher.specialization}</div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Book size={12} className="mr-1" />
                        Spécialiste
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {teacher.department || 'Non spécifié'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Award className="mr-2 text-yellow-500" size={16} />
                        <span className="text-sm font-medium text-gray-700">
                          {rankLabels[teacher.rank] || teacher.rank}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar size={14} className="mr-2" />
                        {teacher.hire_date ? new Date(teacher.hire_date).toLocaleDateString('fr-FR') : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewTeacher(teacher)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Voir détails"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleEditTeacher(teacher)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Modifier"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTeacher(teacher.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Supprimer"
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
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredTeachers.length)} 
              sur {filteredTeachers.length} enseignants
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                <ChevronLeft size={20} />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg transition ${
                      currentPage === pageNum
                        ? 'bg-green-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Statistiques enseignants */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total enseignants</p>
              <p className="text-3xl font-bold mt-2">{statistics.total_teachers || 0}</p>
            </div>
            <GraduationCap className="w-12 h-12 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Nouveaux ce mois</p>
              <p className="text-3xl font-bold mt-2">
                {statistics.new_this_month || 0}
              </p>
            </div>
            <Users className="w-12 h-12 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Avec bureau</p>
              <p className="text-3xl font-bold mt-2">
                {statistics.with_office || 0}
              </p>
            </div>
            <Award className="w-12 h-12 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Départements</p>
              <p className="text-3xl font-bold mt-2">
                {statistics.departments_count || 0}
              </p>
            </div>
            <Building className="w-12 h-12 opacity-80" />
          </div>
        </div>
      </motion.div>

      {/* Autres statistiques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Répartition par grade */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Répartition par grade
          </h3>
          <div className="space-y-3">
            {ranks.filter(r => r.value !== 'all').map((rank, index) => {
              const count = statistics.ranks?.find(r => r.rank === rank.value)?.count || 
                          Math.floor(Math.random() * 5) + 1;
              const percentage = statistics.total_teachers > 0 ? 
                Math.round((count / statistics.total_teachers) * 100) : 0;
              
              return (
                <div key={rank.value} className="flex items-center justify-between">
                  <span className="text-gray-600">{rank.label}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top départements */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Top départements
          </h3>
          <div className="space-y-3">
            {statistics.departments?.slice(0, 5).map((dept, index) => (
              <div key={dept.department} className="flex items-center justify-between">
                <span className="text-gray-600">{dept.department}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ 
                        width: `${Math.min(100, (dept.count / (statistics.total_teachers || 1)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {dept.count}
                  </span>
                </div>
              </div>
            )) || (
              <div className="text-center text-gray-500 py-8">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune donnée disponible</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Modal pour ajouter/modifier/voir un enseignant */}
      {showModal && (
        <TeacherModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedTeacher(null);
          }}
          teacher={selectedTeacher}
          isEditing={isEditing}
          onSave={handleSaveTeacher}
        />
      )}
    </div>
  );
};

export default Teachers;