import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  TrendingUp,
  Calendar,
  FileText,
  Clock,
  ArrowUpRight,
  Eye,
  Download,
  PlusCircle
} from 'lucide-react';
import { authService, studentService, teacherService } from '../services/api';
import StatsCard from '../components/Dashboard/StatsCard';
import RecentActivity from '../components/Dashboard/RecentActivity';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalRevenue: 0,
    enrollmentRate: 0,
    graduationRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([
    { id: 1, type: 'student', action: 'Nouvel étudiant inscrit', user: 'Jean Dupont', time: 'Il y a 10 min' },
    { id: 2, type: 'course', action: 'Cours ajouté', user: 'Prof. Martin', time: 'Il y a 30 min' },
    { id: 3, type: 'payment', action: 'Paiement reçu', user: 'Marie Curie', time: 'Il y a 1 heure' },
    { id: 4, type: 'exam', action: 'Examen programmé', user: 'Dr. Smith', time: 'Il y a 2 heures' },
    { id: 5, type: 'grade', action: 'Notes publiées', user: 'Prof. Johnson', time: 'Il y a 3 heures' },
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Récupérer le profil utilisateur
      const profileResponse = await authService.getProfile();
      setUser(profileResponse.data);

      // Récupérer les statistiques
      const studentsResponse = await studentService.getAll();
      const teachersResponse = await teacherService.getAll();

      setStats({
        totalStudents: studentsResponse.data.length,
        totalTeachers: teachersResponse.data.length,
        totalCourses: 24,
        totalRevenue: 1250000,
        enrollmentRate: 12,
        graduationRate: 85
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Étudiants',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      description: 'Depuis le mois dernier'
    },
    {
      title: 'Enseignants',
      value: stats.totalTeachers,
      icon: GraduationCap,
      color: 'bg-green-500',
      change: '+5%',
      description: '3 nouveaux cette année'
    },
    {
      title: 'Cours actifs',
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'bg-purple-500',
      change: '+8%',
      description: 'Cours dispensés'
    },
    {
      title: 'Revenu mensuel',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '+15%',
      description: 'Frais de scolarité'
    },
    {
      title: "Taux d'inscription",
      value: `${stats.enrollmentRate}%`,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      change: '+3.2%',
      description: 'Nouveaux étudiants'
    },
    {
      title: 'Taux de réussite',
      value: `${stats.graduationRate}%`,
      icon: TrendingUp,
      color: 'bg-pink-500',
      change: '+2.1%',
      description: 'Diplômés cette année'
    },
  ];

  const quickActions = [
    { icon: PlusCircle, label: 'Ajouter étudiant', color: 'bg-blue-500', path: '/students/new' },
    { icon: BookOpen, label: 'Créer un cours', color: 'bg-green-500', path: '/courses/new' },
    { icon: Calendar, label: 'Planifier examen', color: 'bg-purple-500', path: '/exams/new' },
    { icon: FileText, label: 'Générer rapport', color: 'bg-yellow-500', path: '/reports' },
    { icon: Eye, label: 'Voir emploi du temps', color: 'bg-indigo-500', path: '/schedule' },
    { icon: Download, label: 'Exporter données', color: 'bg-pink-500', path: '/export' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-800">
            Bonjour, <span className="text-primary-600">{user?.first_name} {user?.last_name}</span> !
          </h1>
          <p className="text-gray-600 mt-2">
            Bienvenue dans votre tableau de bord de gestion universitaire
          </p>
          <div className="flex items-center space-x-2 mt-4 text-sm text-gray-500">
            <Clock size={16} />
            <span>{new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activités récentes */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-xl shadow-lg p-6 h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Activités récentes</h2>
              <button className="text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-2">
                <span>Voir tout</span>
                <ArrowUpRight size={16} />
              </button>
            </div>
            <RecentActivity activities={recentActivities} />
          </div>
        </motion.div>

        {/* Actions rapides */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="bg-white rounded-xl shadow-lg p-6 h-full">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Actions rapides</h2>
            <div className="space-y-4">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center space-x-4 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition group"
                >
                  <div className={`${action.color} p-3 rounded-lg`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-700 group-hover:text-primary-600">
                    {action.label}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 ml-auto" />
                </motion.button>
              ))}
            </div>

            {/* Statistiques rapides */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistiques rapides</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Étudiants par département</span>
                  <span className="font-medium">1245</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Cours ce semestre</span>
                  <span className="font-medium">56</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Examens à venir</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Paiements en attente</span>
                  <span className="font-medium">8</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Section inférieure */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-6"
      >
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h3 className="text-xl font-bold mb-2">Besoin d'aide ?</h3>
              <p className="text-primary-100">
                Consultez notre documentation ou contactez notre support technique
              </p>
            </div>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <button className="bg-white text-primary-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition">
                Documentation
              </button>
              <button className="bg-transparent border-2 border-white px-6 py-2 rounded-lg font-medium hover:bg-white hover:text-primary-600 transition">
                Contact support
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;