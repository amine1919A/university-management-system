import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  Users,
  BookOpen,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Timer,
  Loader
} from 'lucide-react';
import { examService } from '../services/api';
import ExamsModal from '../components/ExamsModal';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    avgStudents: 0
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState([]);

  const examTypes = [
    { value: 'all', label: 'Tous types' },
    { value: 'final', label: 'Examen Final' },
    { value: 'midterm', label: 'Partiel' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'oral', label: 'Oral' },
    { value: 'practical', label: 'Pratique' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Tous statuts' },
    { value: 'upcoming', label: 'À venir' },
    { value: 'ongoing', label: 'En cours' },
    { value: 'completed', label: 'Terminé' },
    { value: 'cancelled', label: 'Annulé' }
  ];

  const statusConfig = {
    upcoming: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'À venir' },
    ongoing: { color: 'bg-yellow-100 text-yellow-800', icon: Timer, label: 'En cours' },
    completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Terminé' },
    cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Annulé' }
  };

  const typeConfig = {
    final: { color: 'bg-purple-100 text-purple-800', label: 'Final' },
    midterm: { color: 'bg-indigo-100 text-indigo-800', label: 'Partiel' },
    quiz: { color: 'bg-pink-100 text-pink-800', label: 'Quiz' },
    oral: { color: 'bg-teal-100 text-teal-800', label: 'Oral' },
    practical: { color: 'bg-orange-100 text-orange-800', label: 'Pratique' }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Charger les examens
      const examsResponse = await examService.getAll();
      if (examsResponse.data) {
        const examsData = examsResponse.data.results || examsResponse.data.data || examsResponse.data;
        setExams(Array.isArray(examsData) ? examsData : []);
      }

      // Charger les statistiques
      const statsResponse = await examService.getStatistics();
      if (statsResponse.data?.data) {
        setStats({
          total: statsResponse.data.data.total_exams || 0,
          upcoming: statsResponse.data.data.upcoming_exams || 0,
          completed: statsResponse.data.data.completed_exams || 0,
          avgStudents: statsResponse.data.data.avg_students_per_exam || 0
        });
      }

      // Charger les prochains examens
      const upcomingResponse = await examService.getUpcoming(3);
      if (upcomingResponse.data?.data) {
        setUpcomingExams(upcomingResponse.data.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = () => {
    setSelectedExam(null);
    setIsModalOpen(true);
  };

  const handleEditExam = (exam) => {
    setSelectedExam(exam);
    setIsModalOpen(true);
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet examen ?')) {
      return;
    }

    try {
      await examService.delete(examId);
      loadData(); // Recharger les données
    } catch (error) {
      console.error('Error deleting exam:', error);
      alert('Erreur lors de la suppression de l\'examen');
    }
  };

  const handleModalSuccess = () => {
    console.log("✅ Examen créé/modifié avec succès, rechargement...");
    loadData(); // Recharger les données après création/modification
    // Afficher un message de succès
    alert(selectedExam ? 'Examen mis à jour avec succès!' : 'Examen créé avec succès!');
    // Réinitialiser l'examen sélectionné
    setSelectedExam(null);
  };

  const filteredExams = exams.filter(exam => {
    const matchesSearch = 
      (exam.exam_code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (exam.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (exam.course_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || exam.exam_type === selectedType;
    const matchesStatus = selectedStatus === 'all' || exam.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredExams.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExams = filteredExams.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des examens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <FileText className="mr-3 text-primary-600" />
              Gestion des examens
            </h1>
            <p className="text-gray-600 mt-2">
              Planification et gestion des examens universitaires
            </p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={handleCreateExam}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Planifier examen</span>
            </button>
            <button className="border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
              <BarChart3 size={20} />
              <span>Statistiques</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="text-red-500 mr-2" size={20} />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Examens totaux</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <FileText size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">À venir</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.upcoming}</p>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Clock size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Terminés</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.completed}</p>
            </div>
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Moyenne étudiants</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.avgStudents}</p>
            </div>
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <Users size={24} />
            </div>
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un examen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              {examTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3">
            <button className="flex-1 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2">
              <Download size={18} />
              <span>Exporter</span>
            </button>
            <button className="flex-1 border border-blue-600 text-blue-600 px-4 py-3 rounded-lg hover:bg-blue-50 flex items-center justify-center space-x-2">
              <Printer size={18} />
              <span>Imprimer</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tableau des examens */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden mb-6"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Examen
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Heure
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participants
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
              {paginatedExams.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Aucun examen trouvé</p>
                      <p className="mt-2">Planifiez des examens pour commencer</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedExams.map((exam, index) => {
                  const StatusIcon = statusConfig[exam.status]?.icon || Clock;
                  return (
                    <motion.tr
                      key={exam.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-blue-600">
                          {exam.exam_code}
                        </div>
                        <div className="text-xs text-gray-500">
                          {exam.course_code}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{exam.title}</div>
                        <div className="text-sm text-gray-500">
                          <div className="flex items-center mt-1">
                            <BookOpen size={12} className="mr-1" />
                            {exam.course_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="mr-2 text-gray-400" size={16} />
                          <div>
                            <div className="font-medium text-gray-900">
                              {new Date(exam.date).toLocaleDateString('fr-FR')}
                            </div>
                            <div className="text-sm text-gray-500">
                              <Clock size={12} className="inline mr-1" />
                              {exam.time} - {exam.duration}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          📍 {exam.location}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${typeConfig[exam.exam_type]?.color || 'bg-gray-100 text-gray-800'}`}>
                          {typeConfig[exam.exam_type]?.label || exam.exam_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="mr-2 text-blue-500" size={16} />
                          <div>
                            <span className="font-medium text-gray-800">
                              {exam.enrolled_students || 0}
                            </span>
                            <span className="text-sm text-gray-500 ml-1">
                              / {exam.max_students}
                            </span>
                          </div>
                        </div>
                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ 
                              width: `${Math.min(100, ((exam.enrolled_students || 0) / exam.max_students) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <StatusIcon size={16} className="mr-2" />
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusConfig[exam.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                            {statusConfig[exam.status]?.label || exam.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => handleEditExam(exam)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteExam(exam.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredExams.length)} 
              sur {filteredExams.length} examens
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
                    className={`w-10 h-10 rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
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
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Calendrier des examens */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Prochains examens */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Calendrier des examens</h3>
          <div className="space-y-4">
            {upcomingExams.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucun examen à venir</p>
            ) : (
              upcomingExams.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{exam.title}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center">
                          <Calendar size={12} className="mr-1" />
                          {new Date(exam.date).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="flex items-center">
                          <Clock size={12} className="mr-1" />
                          {exam.time}
                        </span>
                        <span className="flex items-center">
                          <Users size={12} className="mr-1" />
                          {exam.enrolled_students || 0} étudiants
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Détails
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Actions examens</h3>
          <div className="space-y-3">
            <button 
              onClick={handleCreateExam}
              className="w-full flex items-center justify-between p-3 bg-white/10 rounded-lg hover:bg-white/20 transition"
            >
              <span>Planifier nouvel examen</span>
              <Plus size={18} />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-white/10 rounded-lg hover:bg-white/20 transition">
              <span>Générer convocations</span>
              <Printer size={18} />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-white/10 rounded-lg hover:bg-white/20 transition">
              <span>Affecter surveillants</span>
              <Users size={18} />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-white/10 rounded-lg hover:bg-white/20 transition">
              <span>Exporter résultats</span>
              <Download size={18} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Modal */}
      <ExamsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        exam={selectedExam}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default Exams;