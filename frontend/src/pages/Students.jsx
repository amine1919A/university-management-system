import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  TrendingUp,
  X,
  Save,
  Award
} from 'lucide-react';
import { studentService } from '../services/api';
import StudentModal from '../components/StudentModal';
import Toast from '../components/Toast';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // États pour les modals et actions
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [statistics, setStatistics] = useState({
    total_students: 0,
    active_students: 0,
    new_this_month: 0,
    retention_rate: 0
  });
  
  // États pour les notifications
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchStudents();
    fetchStatistics();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedDepartment !== 'all') params.department = selectedDepartment;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      
      const response = await studentService.getAll(params);
      setStudents(response.data || []);
    } catch (error) {
      console.error('Erreur chargement étudiants:', error);
      showToast('Erreur lors du chargement des étudiants', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await studentService.getStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleDeleteStudent = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet étudiant ?')) {
      try {
        await studentService.delete(id);
        showToast('Étudiant supprimé avec succès', 'success');
        fetchStudents();
        fetchStatistics();
      } catch (error) {
        console.error('Erreur suppression étudiant:', error);
        showToast('Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleSaveStudent = async (studentData) => {
    try {
      let response;
      
      // CORRECTION ICI : utiliser selectedStudent au lieu de student
      if (selectedStudent && selectedStudent.id) {
        // Mise à jour
        response = await studentService.update(selectedStudent.id, studentData);
        showToast('Étudiant mis à jour avec succès', 'success');
      } else {
        // Création
        response = await studentService.create(studentData);
        showToast('Étudiant ajouté avec succès', 'success');
      }
      
      setShowModal(false);
      setSelectedStudent(null);
      fetchStudents();
      fetchStatistics();
      
    } catch (error) {
      console.error('Erreur sauvegarde étudiant:', error);
      
      // Afficher les erreurs de l'API
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        let errorMessage = 'Erreur lors de la sauvegarde';
        
        if (typeof errorData === 'object') {
          // Traiter les erreurs de validation
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
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
        
        showToast(errorMessage, 'error');
      } else {
        showToast('Erreur lors de la sauvegarde', 'error');
      }
    }
  };

  const handleExport = async () => {
    try {
      const response = await studentService.exportData('csv');
      
      // Créer un lien pour télécharger le fichier
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `etudiants_${new Date().toISOString().split('T')[0]}.csv`);
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
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      (student.student_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.first_name || student.user?.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.last_name || student.user?.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email || student.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'all' || 
      (student.department === selectedDepartment);
    
    const matchesStatus = selectedStatus === 'all' || 
      (student.status === selectedStatus);
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  // Options pour les filtres
  const departments = ['all', 'Informatique', 'Sciences', 'Lettres', 'Commerce', 'Ingénierie', 'Médecine'];
  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
    { value: 'graduated', label: 'Diplômé' },
    { value: 'suspended', label: 'Suspendu' }
  ];

  if (loading && students.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des étudiants...</p>
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
              <Users className="mr-3 text-primary-600" />
              Gestion des étudiants
            </h1>
            <p className="text-gray-600 mt-2">
              {students.length} étudiant(s) inscrit(s) dans le système
            </p>
          </div>
          <button 
            onClick={handleAddStudent}
            className="btn-primary flex items-center space-x-2 px-6 py-3 hover:bg-primary-700 transition"
          >
            <UserPlus size={20} />
            <span>Ajouter un étudiant</span>
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
              placeholder="Rechercher un étudiant..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
            >
              <option value="all">Tous les départements</option>
              {departments.filter(d => d !== 'all').map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre statut */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
                setSelectedStatus('all');
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

      {/* Tableau des étudiants */}
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
                  ID Étudiant
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom & Prénom
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Département
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date d'inscription
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Aucun étudiant trouvé</p>
                      <p className="mt-2">Ajustez vos filtres ou ajoutez des étudiants</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student, index) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-primary-600">
                        {student.student_id || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3">
                          <Users size={18} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {student.first_name || student.user?.first_name} {student.last_name || student.user?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.email || student.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail size={14} className="mr-2" />
                          {student.email || student.user?.email || 'N/A'}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone size={14} className="mr-2" />
                          {student.phone || student.user?.phone || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {student.department || 'Non spécifié'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar size={14} className="mr-2" />
                        {student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString('fr-FR') : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        student.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : student.status === 'inactive'
                          ? 'bg-yellow-100 text-yellow-800'
                          : student.status === 'graduated'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {student.status === 'active' ? 'Actif' : 
                         student.status === 'inactive' ? 'Inactif' :
                         student.status === 'graduated' ? 'Diplômé' :
                         student.status === 'suspended' ? 'Suspendu' : 'Non spécifié'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewStudent(student)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Voir détails"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleEditStudent(student)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Modifier"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(student.id)}
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
              Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredStudents.length)} 
              sur {filteredStudents.length} étudiants
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
                        ? 'bg-primary-600 text-white'
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

      {/* Statistiques rapides - Données dynamiques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total étudiants</p>
              <p className="text-3xl font-bold mt-2">{statistics.total_students || 0}</p>
            </div>
            <Users className="w-12 h-12 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Étudiants actifs</p>
              <p className="text-3xl font-bold mt-2">
                {statistics.active_students || 0}
              </p>
            </div>
            <BookOpen className="w-12 h-12 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Nouveaux ce mois</p>
              <p className="text-3xl font-bold mt-2">
                {statistics.new_this_month || 0}
              </p>
            </div>
            <UserPlus className="w-12 h-12 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Taux de rétention</p>
              <p className="text-3xl font-bold mt-2">
                {statistics.retention_rate || 0}%
              </p>
            </div>
            <TrendingUp className="w-12 h-12 opacity-80" />
          </div>
        </div>
      </motion.div>

      {/* Modal pour ajouter/modifier/voir un étudiant */}
      {showModal && (
        <StudentModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedStudent(null);
          }}
          student={selectedStudent}
          isEditing={isEditing}
          onSave={handleSaveStudent}
        />
      )}
    </div>
  );
};

export default Students;