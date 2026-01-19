import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Download,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Loader,
  AlertCircle,
  Star,
  Target,
  CheckCircle,
  XCircle,
  ArrowLeft
} from 'lucide-react';
import { gradeService, studentService, courseService } from '../services/api';
import NoteModal from '../components/NoteModal';
import Toast from '../components/Toast';

const Notes = () => {
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [viewMode, setViewMode] = useState('all'); // 'all', 'student'
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
  const [stats, setStats] = useState({
    totalGrades: 0,
    averageScore: 0,
    passingRate: 0,
    excellentGrades: 0,
    failingGrades: 0,
    studentStats: null
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const semesters = [
    { value: 'all', label: 'Tous semestres' },
    { value: 'fall', label: 'Automne' },
    { value: 'spring', label: 'Printemps' },
    { value: 'summer', label: 'Été' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });
  years.unshift({ value: 'all', label: 'Toutes années' });

  const scoreCategories = {
    excellent: { label: 'Excellent (15-20)', color: 'bg-green-100 text-green-800', icon: Star },
    good: { label: 'Bien (10-14)', color: 'bg-blue-100 text-blue-800', icon: Target },
    average: { label: 'Moyen (5-9)', color: 'bg-yellow-100 text-yellow-800', icon: TrendingUp },
    fail: { label: 'Échec (0-4)', color: 'bg-red-100 text-red-800', icon: TrendingDown }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Debug: Vérifier la structure des données
    if (grades.length > 0) {
      console.log("🔍 DEBUG - Structure des notes:");
      grades.forEach((grade, index) => {
        console.log(`Note ${index + 1}:`, {
          id: grade.id,
          student: grade.student,
          student_type: typeof grade.student,
          student_id: grade.student_id,
          student_name: grade.student_name,
          has_student_object: !!grade.student && typeof grade.student === 'object',
          student_object_keys: grade.student && typeof grade.student === 'object' ? Object.keys(grade.student) : 'N/A'
        });
      });
    }
    
    if (students.length > 0) {
      console.log("🔍 DEBUG - Structure des étudiants:");
      students.forEach((student, index) => {
        console.log(`Étudiant ${index + 1}:`, {
          id: student.id,
          student_id: student.student_id,
          name: `${student.user_first_name} ${student.user_last_name}`
        });
      });
    }
  }, [grades, students]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les notes
      const gradesResponse = await gradeService.getAll();
      console.log("📊 Grades response complète:", gradesResponse);
      
      let gradesData = [];
      if (gradesResponse?.success === true && gradesResponse.results) {
        gradesData = gradesResponse.results;
      } else if (gradesResponse && Array.isArray(gradesResponse)) {
        gradesData = gradesResponse;
      } else if (gradesResponse?.data) {
        gradesData = Array.isArray(gradesResponse.data) ? gradesResponse.data : 
                    gradesResponse.data.results || gradesResponse.data.data || [];
      }
      
      // Normaliser la structure des notes
      const normalizedGrades = gradesData.map(grade => {
        // Si grade.student est un objet, extraire l'ID
        let studentId = grade.student;
        if (grade.student && typeof grade.student === 'object') {
          studentId = grade.student.id || grade.student;
        }
        
        return {
          ...grade,
          student: studentId, // Toujours un ID ou null
          // S'assurer que course est un ID numérique
          course: typeof grade.course === 'object' ? (grade.course?.id || grade.course) : grade.course,
        };
      });
      
      console.log("📊 Notes normalisées:", normalizedGrades);
      setGrades(normalizedGrades);
      
      // Calculer les statistiques basiques
      if (normalizedGrades.length > 0) {
        const excellentCount = normalizedGrades.filter(g => parseFloat(g.score) >= 15).length;
        const failingCount = normalizedGrades.filter(g => parseFloat(g.score) < 10).length;
        
        setStats(prev => ({
          ...prev,
          totalGrades: normalizedGrades.length,
          excellentGrades: excellentCount,
          failingGrades: failingCount
        }));
      } else {
        setStats(prev => ({
          ...prev,
          totalGrades: 0,
          excellentGrades: 0,
          failingGrades: 0
        }));
      }

      // Charger les étudiants
      const studentsResponse = await studentService.getAll();
      console.log("👥 Students response:", studentsResponse);
      
      let studentsData = [];
      if (studentsResponse?.data) {
        studentsData = Array.isArray(studentsResponse.data) ? studentsResponse.data : 
                      studentsResponse.data.results || studentsResponse.data.data || [];
      } else if (studentsResponse?.results) {
        studentsData = studentsResponse.results;
      } else if (Array.isArray(studentsResponse)) {
        studentsData = studentsResponse;
      }
      
      console.log("👥 Étudiants chargés:", studentsData.length);
      setStudents(studentsData);

      // Charger les cours
      const coursesResponse = await courseService.getAll();
      console.log("📚 Courses response:", coursesResponse);
      
      let coursesData = [];
      if (coursesResponse?.data) {
        coursesData = Array.isArray(coursesResponse.data) ? coursesResponse.data : 
                     coursesResponse.data.results || coursesResponse.data.data || [];
      } else if (coursesResponse?.results) {
        coursesData = coursesResponse.results;
      } else if (Array.isArray(coursesResponse)) {
        coursesData = coursesResponse;
      }
      
      setCourses(coursesData);

      // Charger les statistiques globales
      await loadGlobalStatistics();

    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalStatistics = async () => {
    try {
      const statsResponse = await gradeService.getStatistics();
      console.log("📈 Statistics response:", statsResponse);
      
      if (statsResponse?.success === true && statsResponse.data) {
        const statsData = statsResponse.data;
        setStats(prev => ({
          ...prev,
          averageScore: statsData.average_score || statsData.averageScore || 0,
          passingRate: statsData.passing_rate || statsData.passingRate || 0
        }));
      }
    } catch (error) {
      console.error('❌ Erreur chargement statistiques globales:', error);
    }
  };

  const loadStudentStatistics = async (studentId) => {
    try {
      const response = await gradeService.getByStudent(studentId);
      console.log('📊 Statistiques étudiant:', response);
      
      if (response?.success === true && response.stats) {
        setStats(prev => ({
          ...prev,
          studentStats: {
            totalGrades: response.stats.total_grades || response.stats.totalGrades || 0,
            averageScore: response.stats.average_score || response.stats.averageScore || 0,
            passingCourses: response.stats.passing_courses || response.stats.passingCourses || 0,
            failingCourses: response.stats.failing_courses || response.stats.failingCourses || 0,
            successRate: response.stats.success_rate || response.stats.successRate || 0
          }
        }));
      } else if (response?.stats) {
        setStats(prev => ({
          ...prev,
          studentStats: {
            totalGrades: response.stats.total_grades || 0,
            averageScore: response.stats.average_score || 0,
            passingCourses: response.stats.passing_courses || 0,
            failingCourses: response.stats.failing_courses || 0,
            successRate: response.stats.success_rate || 0
          }
        }));
      }
    } catch (error) {
      console.error('❌ Erreur chargement statistiques étudiant:', error);
    }
  };

  const handleAddNote = () => {
    setSelectedGrade(null);
    setIsModalOpen(true);
  };

  const handleEditNote = (grade) => {
    console.log("✏️ Note à modifier:", grade);
    setSelectedGrade(grade);
    setIsModalOpen(true);
  };

  // Fonction pour trouver un étudiant par student_id
  const findStudentByStudentId = (studentId) => {
    return students.find(s => s.student_id === studentId);
  };

  // Fonction pour trouver un étudiant par ID
  const findStudentById = (id) => {
    return students.find(s => s.id === parseInt(id));
  };

  const handleViewStudentGrades = (input) => {
    console.log('👁️ Voir notes étudiant - Input reçu:', input);
    
    // Si l'input est undefined ou null
    if (!input) {
      console.error('❌ Données manquantes pour voir les notes étudiant');
      showToast('Données étudiant manquantes', 'error');
      return;
    }
    
    let student = null;
    
    // Cas 1: Input est un objet étudiant complet
    if (typeof input === 'object' && input.user_first_name) {
      student = input;
    }
    // Cas 2: Input est un objet grade
    else if (typeof input === 'object' && (input.student_id || input.student_name)) {
      // Essayer de trouver l'étudiant par student_id
      if (input.student_id) {
        student = findStudentByStudentId(input.student_id);
      }
      
      // Si pas trouvé par student_id, essayer de trouver par nom
      if (!student && input.student_name) {
        const nameParts = input.student_name.split(' ');
        if (nameParts.length >= 2) {
          const matchingStudents = students.filter(s => 
            s.user_first_name === nameParts[0] && 
            s.user_last_name === nameParts.slice(1).join(' ')
          );
          if (matchingStudents.length > 0) {
            student = matchingStudents[0];
          }
        }
      }
    }
    // Cas 3: Input est un student_id (string comme "IT2024012")
    else if (typeof input === 'string' && input.startsWith('IT')) {
      student = findStudentByStudentId(input);
    }
    // Cas 4: Input est un ID numérique
    else if (!isNaN(parseInt(input))) {
      student = findStudentById(input);
    }
    
    console.log('👁️ Étudiant trouvé:', student);
    
    if (!student) {
      console.error('❌ Impossible de trouver l\'étudiant');
      console.error('❌ Input:', input);
      console.error('❌ Liste des étudiants:', students);
      showToast('Étudiant non trouvé', 'error');
      return;
    }
    
    // Mettre à jour les détails de l'étudiant
    setSelectedStudentDetails({
      id: student.id,
      name: `${student.user_first_name} ${student.user_last_name}`,
      studentId: student.student_id,
      department: student.department,
      currentYear: student.current_year
    });
    
    // Passer en mode vue étudiant
    setSelectedStudent(student.id.toString());
    setViewMode('student');
    setCurrentPage(1);
    
    // Charger les statistiques de l'étudiant
    loadStudentStatistics(student.id);
    
    showToast(
      `Affichage des notes de ${student.user_first_name} ${student.user_last_name}`, 
      'info'
    );
  };

  const handleViewAll = () => {
    setSelectedStudent('all');
    setSelectedStudentDetails(null);
    setViewMode('all');
    setCurrentPage(1);
    
    loadGlobalStatistics();
    
    showToast('Affichage de toutes les notes', 'info');
  };

  const handleDeleteNote = async (gradeId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
      return;
    }

    try {
      await gradeService.delete(gradeId);
      showToast('Note supprimée avec succès', 'success');
      loadData();
    } catch (error) {
      console.error('Error deleting grade:', error);
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleModalSuccess = () => {
    showToast(
      selectedGrade ? 'Note mise à jour avec succès!' : 'Note ajoutée avec succès!',
      'success'
    );
    loadData();
  };

  const getScoreCategory = (score) => {
    const numericScore = parseFloat(score);
    if (isNaN(numericScore)) return 'unknown';
    if (numericScore >= 15) return 'excellent';
    if (numericScore >= 10) return 'good';
    if (numericScore >= 5) return 'average';
    return 'fail';
  };

  // Fonction pour trouver l'ID étudiant à partir d'une note
  const findStudentIdForGrade = (grade) => {
    if (!grade) return null;
    
    // Essayer de trouver par student_id d'abord
    if (grade.student_id) {
      const student = findStudentByStudentId(grade.student_id);
      if (student) return student.id;
    }
    
    // Essayer par nom
    if (grade.student_name) {
      const nameParts = grade.student_name.split(' ');
      if (nameParts.length >= 2) {
        const matchingStudents = students.filter(s => 
          s.user_first_name === nameParts[0] && 
          s.user_last_name === nameParts.slice(1).join(' ')
        );
        if (matchingStudents.length > 0) {
          return matchingStudents[0].id;
        }
      }
    }
    
    // Dernier recours: utiliser grade.student s'il existe
    if (grade.student) {
      if (typeof grade.student === 'object') {
        return grade.student.id || grade.student;
      }
      return grade.student;
    }
    
    return null;
  };

  // Fonction pour regrouper les notes par étudiant
  const groupGradesByStudent = (gradesList) => {
    const grouped = {};
    
    gradesList.forEach(grade => {
      const studentId = findStudentIdForGrade(grade);
      
      if (!studentId) {
        console.warn("⚠️ Grade sans ID étudiant trouvable:", {
          id: grade.id,
          student_id: grade.student_id,
          student_name: grade.student_name,
          student: grade.student
        });
        return;
      }
      
      const student = findStudentById(studentId);
      
      if (!grouped[studentId]) {
        grouped[studentId] = {
          student: student ? `${student.user_first_name} ${student.user_last_name}` : grade.student_name,
          studentId: grade.student_id || (student ? student.student_id : ''),
          studentObject: student,
          grades: [],
          average: 0,
          totalCourses: 0,
          passingCourses: 0,
          failingCourses: 0
        };
      }
      grouped[studentId].grades.push(grade);
    });
    
    // Calculer les moyennes et statistiques
    Object.keys(grouped).forEach(studentId => {
      const studentData = grouped[studentId];
      const studentGrades = studentData.grades;
      const total = studentGrades.reduce((sum, g) => sum + parseFloat(g.score || 0), 0);
      studentData.average = studentGrades.length > 0 ? total / studentGrades.length : 0;
      studentData.totalCourses = studentGrades.length;
      studentData.passingCourses = studentGrades.filter(g => parseFloat(g.score || 0) >= 10).length;
      studentData.failingCourses = studentGrades.filter(g => parseFloat(g.score || 0) < 10).length;
    });
    
    console.log("📊 Groupes créés:", Object.keys(grouped).length);
    return grouped;
  };

  const filteredGrades = grades.filter(grade => {
    // Trouver l'ID étudiant pour cette note
    const studentId = findStudentIdForGrade(grade);
    
    const matchesSearch = 
      (grade.student_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (grade.course_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (grade.student_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (grade.course_code?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStudent = selectedStudent === 'all' || 
                         (studentId && studentId.toString() === selectedStudent) ||
                         grade.student_id?.toString() === selectedStudent;
    
    const matchesCourse = selectedCourse === 'all' || grade.course?.toString() === selectedCourse;
    const matchesSemester = selectedSemester === 'all' || grade.semester === selectedSemester;
    const matchesYear = selectedYear === 'all' || grade.academic_year?.toString() === selectedYear;
    
    return matchesSearch && matchesStudent && matchesCourse && matchesSemester && matchesYear;
  });

  const totalPages = Math.ceil(filteredGrades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGrades = filteredGrades.slice(startIndex, startIndex + itemsPerPage);
  const groupedGrades = groupGradesByStudent(paginatedGrades);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des notes...</p>
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
              <Award className="mr-3 text-blue-600" />
              {viewMode === 'student' && selectedStudentDetails 
                ? `Notes de ${selectedStudentDetails.name}`
                : 'Gestion des notes'
              }
            </h1>
            <p className="text-gray-600 mt-2">
              {viewMode === 'student' && selectedStudentDetails 
                ? `Matricule: ${selectedStudentDetails.studentId} • ${selectedStudentDetails.department}`
                : `${stats.totalGrades} notes enregistrées • Score moyen: ${stats.averageScore.toFixed(2)}/20`
              }
            </p>
          </div>
          <div className="flex space-x-3">
            {viewMode === 'student' && selectedStudentDetails && (
              <>
                <button 
                  onClick={handleViewAll}
                  className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 flex items-center space-x-2"
                >
                  <ArrowLeft size={20} />
                  <span>Retour</span>
                </button>
                <button 
                  onClick={() => handleAddNote()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus size={20} />
                  <span>Ajouter note</span>
                </button>
              </>
            )}
            {viewMode === 'all' && (
              <>
                <button 
                  onClick={handleAddNote}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus size={20} />
                  <span>Ajouter note</span>
                </button>
                <button 
                  onClick={() => gradeService.getSummary().then(console.log)}
                  className="border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                >
                  <BarChart3 size={20} />
                  <span>Statistiques</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {viewMode === 'student' && stats.studentStats ? (
          <>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Notes totales</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {stats.studentStats.totalGrades}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                  <Award size={24} />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Moyenne étudiante</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {stats.studentStats.averageScore.toFixed(2)}/20
                  </p>
                </div>
                <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cours réussis</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {stats.studentStats.passingCourses}
                  </p>
                </div>
                <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                  <CheckCircle size={24} />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cours échoués</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {stats.studentStats.failingCourses}
                  </p>
                </div>
                <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                  <XCircle size={24} />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Notes totales</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalGrades}</p>
                </div>
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                  <Award size={24} />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Score moyen</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stats.averageScore.toFixed(2)}/20</p>
                </div>
                <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taux de réussite</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stats.passingRate}%</p>
                </div>
                <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                  <CheckCircle size={24} />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Échecs</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stats.failingGrades}</p>
                </div>
                <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                  <XCircle size={24} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filtres et recherche */}
      {viewMode === 'all' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Recherche */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher étudiant, cours..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtre étudiant */}
            <div>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={selectedStudent}
                  onChange={(e) => {
                    setSelectedStudent(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="all">Tous étudiants</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.user_first_name} {student.user_last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filtre cours */}
            <div>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={selectedCourse}
                  onChange={(e) => {
                    setSelectedCourse(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="all">Tous cours</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.course_code} - {course.title}
                    </option>
                  ))}
                </select>
              </div>
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
                  setSelectedStudent('all');
                  setSelectedCourse('all');
                  setSelectedSemester('all');
                  setSelectedYear('all');
                  setCurrentPage(1);
                }}
                className="flex-1 border border-red-300 text-red-600 px-4 py-3 rounded-lg hover:bg-red-50 flex items-center justify-center space-x-2"
              >
                <Filter size={18} />
                <span>Réinitialiser</span>
              </button>
            </div>
          </div>

          {/* Filtres secondaires */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Filtre semestre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Semestre</label>
              <div className="flex space-x-2">
                {semesters.map(sem => (
                  <button
                    key={sem.value}
                    onClick={() => {
                      setSelectedSemester(sem.value);
                      setCurrentPage(1);
                    }}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg ${selectedSemester === sem.value 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {sem.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtre année */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Année académique</label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {years.map(year => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Catégories de score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(scoreCategories).map(([key, category]) => {
                  const Icon = category.icon;
                  const count = filteredGrades.filter(g => getScoreCategory(g.score) === key).length;
                  return (
                    <div
                      key={key}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full ${category.color} flex items-center space-x-1`}
                    >
                      <Icon size={12} />
                      <span>{category.label.split(' ')[0]}: {count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tableau des notes */}
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
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Étudiant</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Cours</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Semestre</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Année</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedGrades.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">
                        {viewMode === 'student' && selectedStudentDetails 
                          ? `Aucune note trouvée pour ${selectedStudentDetails.name}`
                          : 'Aucune note trouvée'
                        }
                      </p>
                      <p className="mt-2">
                        {viewMode === 'student' 
                          ? 'Ajoutez une note pour cet étudiant'
                          : 'Ajoutez des notes pour commencer'
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Afficher les notes directement sans regroupement
                paginatedGrades.map((grade, index) => {
                  const category = getScoreCategory(grade.score);
                  const CategoryIcon = scoreCategories[category]?.icon || Award;
                  
                  return (
                    <motion.tr
                      key={`${grade.id}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{grade.student_name}</div>
                        <div className="text-sm text-gray-500">{grade.student_id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{grade.course_code}</div>
                        <div className="text-sm text-gray-500">{grade.course_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className={`text-2xl font-bold ${
                            parseFloat(grade.score) >= 10 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {grade.score}/20
                          </div>
                          <div className={`px-2 py-1 text-xs rounded-full ${
                            parseFloat(grade.score) >= 10 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {grade.letter_grade}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {grade.is_passing ? '✅ Réussite' : '❌ Échec'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <CategoryIcon size={16} />
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${scoreCategories[category].color}`}>
                            {scoreCategories[category].label.split(' ')[0]}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          {grade.semester === 'fall' ? 'Automne' : 
                           grade.semester === 'spring' ? 'Printemps' : 'Été'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium">{grade.academic_year}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {viewMode === 'all' && (
                            <button 
                              onClick={() => handleViewStudentGrades(grade)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Voir toutes les notes"
                            >
                              <Eye size={18} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleEditNote(grade)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Modifier"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteNote(grade.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Supprimer"
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
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredGrades.length)} 
              sur {filteredGrades.length} notes
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
                let pageNum = (currentPage <= 3) ? i + 1 : 
                             (currentPage >= totalPages - 2) ? totalPages - 4 + i : 
                             currentPage - 2 + i;
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
      {isModalOpen && (
        <NoteModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedGrade(null);
          }}
          grade={selectedGrade}
          onSuccess={handleModalSuccess}
          students={students}
          courses={courses}
          showToast={showToast} 
        />
      )}
    </div>
  );
};

export default Notes;