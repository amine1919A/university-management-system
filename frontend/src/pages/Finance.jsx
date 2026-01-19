    import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import {
    DollarSign, CreditCard, TrendingUp, TrendingDown, Filter, Search, Plus,
    Eye, Edit, Trash2, Calendar, Users, BookOpen, Award, CheckCircle, Clock, XCircle,
    ChevronLeft, ChevronRight, BarChart3, PieChart, X, RefreshCw, FileText,
    Building, Database, AlertCircle, GraduationCap, Wallet, Banknote, Coins
    } from 'lucide-react';
    import { financeService } from '../services/api';
    import Toast from '../components/Toast';
    import FinanceModal from '../components/FinanceModal';

    const Finance = () => {
    // États principaux
    const [transactions, setTransactions] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [selectedType, setSelectedType] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    
    // États pour les modals
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [selectedBudget, setSelectedBudget] = useState(null);
    const [modalMode, setModalMode] = useState('view');
    
    // États pour les statistiques
    const [statistics, setStatistics] = useState({
        total_income: 0,
        total_expenses: 0,
        total_salaries: 0,
        total_scholarships: 0,
        pending_amount: 0,
        overdue_amount: 0,
        transaction_distribution: [],
        budget_utilization: []
    });
    
    // États pour les notifications
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        fetchData();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ ...toast, show: false }), 3000);
    };

    const fetchData = async () => {
        try {
        setLoading(true);
        console.log("🔄 Chargement des données financières...");
        await Promise.all([
            fetchTransactions(),
            fetchBudgets(),
            fetchStatistics()
        ]);
        console.log("✅ Données chargées avec succès");
        } catch (error) {
        console.error('❌ Erreur chargement données financières:', error);
        showToast('Erreur lors du chargement des données', 'error');
        } finally {
        setLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
          console.log("🔄 Chargement des transactions...");
          const response = await financeService.getTransactions({ page_size: 100 });
          console.log("📋 Réponse API Transactions:", response.data);
          
          let transactionsData = [];
          
          // Si la réponse contient un champ "results" (pagination DRF)
          if (response.data && Array.isArray(response.data.results)) {
            transactionsData = response.data.results;
            console.log(`✅ Format paginé: ${transactionsData.length} transactions depuis results`);
          }
          // Format direct
          else if (Array.isArray(response.data)) {
            transactionsData = response.data;
            console.log(`✅ Format direct: ${transactionsData.length} transactions`);
          }
          // Format avec wrapper
          else if (response.data && Array.isArray(response.data.data)) {
            transactionsData = response.data.data;
            console.log(`✅ Format wrapper: ${transactionsData.length} transactions depuis data.data`);
          }
          
          if (transactionsData.length > 0) {
            console.log("📊 Exemple de transaction:", transactionsData[0]);
            setTransactions(transactionsData);
            showToast(`${transactionsData.length} transactions chargées`, 'success');
          } else {
            console.warn("⚠️ Aucune transaction trouvée");
            setTransactions([]);
            showToast('Aucune transaction trouvée', 'info');
          }
        } catch (error) {
          console.error('❌ Erreur chargement transactions:', error);
          
          // Vérifier si c'est une erreur réseau
          if (error.error && error.error.includes('Impossible de se connecter au serveur')) {
            showToast('Serveur Django non démarré. Démarrez-le avec: python manage.py runserver', 'error');
          } else {
            showToast(error.error || 'Erreur lors du chargement des transactions', 'error');
          }
          
          setTransactions([]);
        }
      };

    const fetchBudgets = async () => {
        try {
        console.log("🔄 Chargement des budgets...");
        const response = await financeService.getBudgets();
        console.log("📋 Réponse API Budgets:", response.data);
        
        let budgetsData = [];
        
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
            budgetsData = response.data.data;
        } else if (Array.isArray(response.data)) {
            budgetsData = response.data;
        } else if (response.data && Array.isArray(response.data.results)) {
            budgetsData = response.data.results;
        }
        
        setBudgets(budgetsData);
        console.log(`✅ ${budgetsData.length} budgets chargés`);
        } catch (error) {
        console.error('❌ Erreur chargement budgets:', error);
        setBudgets([]);
        }
    };

    const fetchStatistics = async () => {
        try {
        console.log("🔄 Chargement des statistiques...");
        const response = await financeService.getStatistics();
        console.log("📋 Réponse API Statistiques:", response.data);
        
        if (response.data && response.data.success) {
            setStatistics(response.data.data || response.data);
        } else if (response.data) {
            setStatistics(response.data);
        }
        } catch (error) {
        console.error('❌ Erreur chargement statistiques:', error);
        }
    };

    // Gestion des transactions
    const handleAddTransaction = () => {
        setSelectedTransaction(null);
        setModalMode('create');
        setShowTransactionModal(true);
    };

    const handleViewTransaction = async (transaction) => {
        console.log("👁️ Viewing transaction:", transaction);
        console.log("📋 Transaction ID:", transaction.id);
        
        try {
          // Pour debug, charger la transaction depuis l'API
          const response = await financeService.getTransactionById(transaction.id);
          console.log("📊 Transaction details from API:", response.data);
          
          setSelectedTransaction(response.data);
          setModalMode('view');
          setShowTransactionModal(true);
        } catch (error) {
          console.error("❌ Error fetching transaction details:", error);
          // Fallback: utiliser les données locales
          setSelectedTransaction(transaction);
          setModalMode('view');
          setShowTransactionModal(true);
        }
      };

      const handleEditTransaction = async (transaction) => {
        console.log("✏️ Editing transaction:", transaction);
        console.log("📋 Transaction ID:", transaction.id);
        
        try {
          // Charger la transaction depuis l'API pour avoir les données complètes
          const response = await financeService.getTransactionById(transaction.id);
          console.log("📊 Transaction details from API for edit:", response.data);
          
          setSelectedTransaction(response.data);
          setModalMode('edit');
          setShowTransactionModal(true);
        } catch (error) {
          console.error("❌ Error fetching transaction details for edit:", error);
          // Fallback: utiliser les données locales
          setSelectedTransaction(transaction);
          setModalMode('edit');
          setShowTransactionModal(true);
        }
      };

    const handleDeleteTransaction = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
          try {
            console.log(`🗑️ Attempting to delete transaction ${id}...`);
            const response = await financeService.deleteTransaction(id);
            console.log("✅ Delete response:", response.data);
            showToast('Transaction supprimée avec succès', 'success');
            fetchData();
          } catch (error) {
            console.error('❌ Erreur suppression transaction:', error);
            console.error('📋 Error details:', error.response?.data);
            showToast(`Erreur lors de la suppression: ${error.error || 'Erreur serveur'}`, 'error');
          }
        }
      };

    const handleSaveTransaction = async (transactionData) => {
        try {
        console.log("💾 Sauvegarde transaction:", transactionData);
        let response;
        
        if (selectedTransaction && selectedTransaction.id) {
            response = await financeService.updateTransaction(selectedTransaction.id, transactionData);
            showToast('Transaction mise à jour avec succès', 'success');
        } else {
            response = await financeService.createTransaction(transactionData);
            showToast('Transaction ajoutée avec succès', 'success');
        }
        
        setShowTransactionModal(false);
        setSelectedTransaction(null);
        fetchData();
        
        } catch (error) {
        console.error('❌ Erreur sauvegarde transaction:', error);
        console.error('Détails erreur:', error.response?.data);
        
        let errorMessage = 'Erreur lors de la sauvegarde';
        if (error.response?.data?.errors) {
            errorMessage = Object.values(error.response.data.errors).flat().join(', ');
        } else if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
        } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.response?.data?.detail) {
            errorMessage = error.response.data.detail;
        }
        
        showToast(errorMessage, 'error');
        }
    };

    // Gestion des budgets
    const handleAddBudget = () => {
        setSelectedBudget(null);
        setModalMode('create');
        setShowBudgetModal(true);
    };

    const handleEditBudget = (budget) => {
        setSelectedBudget(budget);
        setModalMode('edit');
        setShowBudgetModal(true);
    };

    const handleDeleteBudget = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce budget ?')) {
        try {
            await financeService.deleteBudget(id);
            showToast('Budget supprimé avec succès', 'success');
            fetchData();
        } catch (error) {
            console.error('❌ Erreur suppression budget:', error);
            showToast('Erreur lors de la suppression', 'error');
        }
        }
    };

    const handleSaveBudget = async (budgetData) => {
        try {
            console.log("💾 Sauvegarde budget:", budgetData);
            
            // Valider les données
            const validation = financeService.validateBudgetData(budgetData);
            if (!validation.isValid) {
                showToast(validation.errors.join(', '), 'error');
                return;
            }
            
            // Formater pour l'API
            const formattedData = financeService.formatBudgetForAPI(budgetData);
            console.log("📤 Données formatées:", formattedData);
            
            let response;
            
            if (selectedBudget && selectedBudget.id) {
                // Utiliser PATCH pour la mise à jour
                response = await financeService.patchBudget(selectedBudget.id, formattedData);
                showToast('Budget mis à jour avec succès', 'success');
            } else {
                response = await financeService.createBudget(formattedData);
                showToast('Budget ajouté avec succès', 'success');
            }
            
            setShowBudgetModal(false);
            setSelectedBudget(null);
            fetchData();
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde budget:', error);
            
            let errorMessage = 'Erreur lors de la sauvegarde';
            if (error.response?.data) {
                // Django REST Framework renvoie souvent les erreurs dans un format spécifique
                if (typeof error.response.data === 'object') {
                    const errors = [];
                    for (const key in error.response.data) {
                        if (Array.isArray(error.response.data[key])) {
                            errors.push(...error.response.data[key]);
                        } else {
                            errors.push(error.response.data[key]);
                        }
                    }
                    errorMessage = errors.join(', ');
                } else {
                    errorMessage = error.response.data.toString();
                }
            } else if (error.detail) {
                errorMessage = error.detail;
            } else if (error.error) {
                errorMessage = error.error;
            }
            
            showToast(errorMessage, 'error');
        }
    };

    // Test API
    const testAPI = async () => {
        console.log("🧪 Test de l'API finance...");
        try {
        await financeService.testAPI();
        showToast('Tests API terminés - Voir console', 'info');
        } catch (error) {
        console.error('❌ Erreur test API:', error);
        showToast('Erreur lors du test API', 'error');
        }
    };

    // Configuration des types de transactions
    const transactionTypes = [
        { value: 'all', label: 'Tous les types' },
        { value: 'tuition', label: 'Frais de scolarité' },
        { value: 'exam_fee', label: 'Frais d\'examen' },
        { value: 'library_fee', label: 'Frais de bibliothèque' },
        { value: 'lab_fee', label: 'Frais de laboratoire' },
        { value: 'scholarship', label: 'Bourse d\'études' },
        { value: 'refund', label: 'Remboursement' },
        { value: 'salary', label: 'Salaire enseignant' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'equipment', label: 'Équipement' },
        { value: 'other', label: 'Autre' }
    ];

    // Configuration des catégories
    const categoryTypes = [
        { value: 'all', label: 'Toutes catégories' },
        { value: 'income', label: 'Revenus' },
        { value: 'expense', label: 'Dépenses' },
        { value: 'salary', label: 'Salaires' },
        { value: 'scholarship', label: 'Bourses' }
    ];

    const statusOptions = [
        { value: 'all', label: 'Tous les statuts' },
        { value: 'paid', label: 'Payé' },
        { value: 'pending', label: 'En attente' },
        { value: 'overdue', label: 'En retard' },
        { value: 'partial', label: 'Partiel' },
        { value: 'cancelled', label: 'Annulé' }
    ];

    const statusConfig = {
        paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Payé' },
        pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'En attente' },
        overdue: { color: 'bg-red-100 text-red-800', icon: Clock, label: 'En retard' },
        partial: { color: 'bg-orange-100 text-orange-800', icon: Clock, label: 'Partiel' },
        cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Annulé' }
    };

    // Filtrage et pagination
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const filteredTransactions = safeTransactions.filter(transaction => {
        if (!transaction) return false;
        
        const matchesSearch = 
        (transaction.transaction_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.student_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.teacher_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.teacher_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = selectedType === 'all' || transaction.transaction_type === selectedType;
        const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus;
        
        return matchesSearch && matchesType && matchesStatus;
    });

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

    // Formatage des montants
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '0.000 TND';
        return new Intl.NumberFormat('fr-TN', {
        style: 'currency',
        currency: 'TND',
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
        }).format(amount);
    };

    const formatSimpleCurrency = (amount) => {
        if (!amount && amount !== 0) return '0 TND';
        return new Intl.NumberFormat('fr-TN', {
        style: 'currency',
        currency: 'TND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
        }).format(amount);
    };

    // Calcul des totaux depuis les statistiques
    const calculatedStats = {
        totalIncome: statistics.total_income || 0,
        totalExpenses: statistics.total_expenses || 0,
        totalSalaries: statistics.total_salaries || 0,
        totalScholarships: statistics.total_scholarships || 0,
        pendingAmount: statistics.pending_amount || 0,
        overdueAmount: statistics.overdue_amount || 0,
        netBalance: (statistics.total_income || 0) - (statistics.total_expenses || 0) - (statistics.total_salaries || 0) - (statistics.total_scholarships || 0)
    };

    // Calculer les statistiques locales si les statistiques API ne sont pas disponibles
    const localStats = {
        totalRevenue: safeTransactions
        .filter(t => t.category === 'income' && t.status === 'paid')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0),
        
        pendingAmountLocal: safeTransactions
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0),
        
        overdueAmountLocal: safeTransactions
        .filter(t => t.status === 'overdue')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0),
        
        scholarshipAmountLocal: Math.abs(safeTransactions
        .filter(t => t.transaction_type === 'scholarship' && t.status === 'paid')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0))
    };

    // Utiliser les statistiques API ou locales
    const displayStats = {
        totalRevenue: calculatedStats.totalIncome || localStats.totalRevenue,
        pendingAmount: calculatedStats.pendingAmount || localStats.pendingAmountLocal,
        overdueAmount: calculatedStats.overdueAmount || localStats.overdueAmountLocal,
        scholarshipAmount: calculatedStats.totalScholarships || localStats.scholarshipAmountLocal,
        netBalance: calculatedStats.netBalance
    };

    if (loading && safeTransactions.length === 0) {
        return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
            <div className="text-center">
            <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-gray-700 text-lg font-medium">Chargement des données financières...</p>
            <p className="text-gray-500 mt-2">ITeam University - Système de gestion financière</p>
            </div>
        </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4 md:p-6">
        {/* Toast Notifications */}
        {toast.show && (
            <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast({ ...toast, show: false })} 
            />
        )}

        {/* Header */}
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
        >
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <DollarSign className="text-white" size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">ITeam University - Système Financier</h1>
                    <p className="text-blue-100 mt-2">Gestion complète des transactions, budgets et salaires</p>
                </div>
                </div>
                <div className="flex flex-wrap gap-3">
                <button 
                    onClick={handleAddTransaction}
                    className="flex items-center space-x-2 px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition shadow-lg"
                >
                    <Plus size={20} />
                    <span className="font-semibold">Nouvelle transaction</span>
                </button>
                <button 
                    onClick={testAPI}
                    className="flex items-center space-x-2 px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition shadow"
                    title="Tester l'API"
                >
                    <Database size={20} />
                    <span>Test API</span>
                </button>
                <button 
                    onClick={fetchData}
                    className="p-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition"
                    title="Rafraîchir les données"
                >
                    <RefreshCw size={20} />
                </button>
                </div>
            </div>
            
            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white/10 rounded-lg">
                <p className="text-sm text-blue-200">Total transactions</p>
                <p className="text-xl font-bold">{safeTransactions.length}</p>
                </div>
                <div className="text-center p-3 bg-white/10 rounded-lg">
                <p className="text-sm text-blue-200">Budgets actifs</p>
                <p className="text-xl font-bold">{budgets.filter(b => b.is_active).length}</p>
                </div>
                <div className="text-center p-3 bg-white/10 rounded-lg">
                <p className="text-sm text-blue-200">Solde net</p>
                <p className="text-xl font-bold">{formatSimpleCurrency(displayStats.netBalance)}</p>
                </div>
                <div className="text-center p-3 bg-white/10 rounded-lg">
                <p className="text-sm text-blue-200">Taux de recouvrement</p>
                <p className="text-xl font-bold">
                    {displayStats.totalRevenue + displayStats.pendingAmount + displayStats.overdueAmount > 0
                    ? Math.round((displayStats.totalRevenue / (displayStats.totalRevenue + displayStats.pendingAmount + displayStats.overdueAmount)) * 100)
                    : 0}%
                </p>
                </div>
            </div>
            </div>
        </motion.div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-r-4 border-green-500"
            >
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm text-gray-600">Revenus totaux</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                    {formatSimpleCurrency(displayStats.totalRevenue)}
                </p>
                <div className="flex items-center mt-2 text-green-600 text-sm">
                    <TrendingUp size={16} className="ml-1" />
                    <span>Transactions payées</span>
                </div>
                </div>
                <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                <DollarSign size={24} />
                </div>
            </div>
            </motion.div>
            
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-r-4 border-yellow-500"
            >
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm text-gray-600">En attente de paiement</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                    {formatSimpleCurrency(displayStats.pendingAmount)}
                </p>
                <div className="flex items-center mt-2 text-yellow-600 text-sm">
                    <Clock size={16} className="ml-1" />
                    <span>{safeTransactions.filter(t => t.status === 'pending').length} transactions</span>
                </div>
                </div>
                <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl">
                <Clock size={24} />
                </div>
            </div>
            </motion.div>
            
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-r-4 border-red-500"
            >
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm text-gray-600">Retards</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                    {formatSimpleCurrency(displayStats.overdueAmount)}
                </p>
                <div className="flex items-center mt-2 text-red-600 text-sm">
                    <TrendingDown size={16} className="ml-1" />
                    <span>{safeTransactions.filter(t => t.status === 'overdue').length} retards</span>
                </div>
                </div>
                <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                <Clock size={24} />
                </div>
            </div>
            </motion.div>
            
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-r-4 border-blue-500"
            >
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm text-gray-600">Bourses d'études</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                    {formatSimpleCurrency(displayStats.scholarshipAmount)}
                </p>
                <div className="flex items-center mt-2 text-blue-600 text-sm">
                    <Award size={16} className="ml-1" />
                    <span>
                    {safeTransactions.filter(t => t.transaction_type === 'scholarship' && t.status === 'paid').length} bénéficiaires
                    </span>
                </div>
                </div>
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <Award size={24} />
                </div>
            </div>
            </motion.div>
        </div>

        {/* Filtres et recherche */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Recherche */}
            <div className="md:col-span-2 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                type="text"
                placeholder="Rechercher numéro, étudiant, enseignant, description..."
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                }}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                dir="rtl"
                />
            </div>

            {/* Filtre type */}
            <div className="relative">
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                value={selectedType}
                onChange={(e) => {
                    setSelectedType(e.target.value);
                    setCurrentPage(1);
                }}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-right"
                dir="rtl"
                >
                {transactionTypes.map(type => (
                    <option key={type.value} value={type.value}>
                    {type.label}
                    </option>
                ))}
                </select>
            </div>

            {/* Filtre statut */}
            <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                value={selectedStatus}
                onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                }}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-right"
                dir="rtl"
                >
                {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                    {status.label}
                    </option>
                ))}
                </select>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 space-x-reverse">
                <button 
                onClick={() => {
                    setSearchTerm('');
                    setSelectedType('all');
                    setSelectedStatus('all');
                    setCurrentPage(1);
                }}
                className="flex-1 border border-red-300 text-red-600 px-4 py-3 rounded-lg hover:bg-red-50 flex items-center justify-center space-x-2 space-x-reverse transition"
                >
                <X size={18} />
                <span>Réinitialiser</span>
                </button>
            </div>
            </div>
        </motion.div>

        {/* Tableau des transactions */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6"
        >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Transactions financières</h3>
            <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-sm text-gray-600">
                {filteredTransactions.length} transactions
                </span>
                <button 
                onClick={handleAddTransaction}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                >
                <Plus size={16} className="ml-1" />
                Ajouter
                </button>
            </div>
            </div>
            
            <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead className="bg-gray-50">
                <tr className="text-right">
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numéro
                    </th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bénéficiaire
                    </th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                    </th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                    </th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                    </th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                    </th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                    </th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                {paginatedTransactions.length === 0 ? (
                    <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="text-gray-400">
                        <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Aucune transaction</p>
                        <p className="mt-2">Cliquez sur "Nouvelle transaction" pour commencer</p>
                        <button 
                            onClick={handleAddTransaction}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Ajouter une transaction
                        </button>
                        </div>
                    </td>
                    </tr>
                ) : (
                    paginatedTransactions.map((transaction, index) => {
                    const StatusIcon = statusConfig[transaction.status]?.icon || Clock;
                    const typeLabel = transactionTypes.find(t => t.value === transaction.transaction_type)?.label || transaction.transaction_type;
                    const isPositive = transaction.category === 'income' && transaction.transaction_type !== 'scholarship' && transaction.transaction_type !== 'refund';
                    
                    // Déterminer le bénéficiaire
                    let beneficiary = 'Système';
                    let beneficiaryId = '';
                    let beneficiaryType = '';
                    
                    if (transaction.student_name) {
                        beneficiary = transaction.student_name;
                        beneficiaryId = transaction.student_id;
                        beneficiaryType = 'student';
                    } else if (transaction.teacher_name) {
                        beneficiary = transaction.teacher_name;
                        beneficiaryId = transaction.teacher_id;
                        beneficiaryType = 'teacher';
                    }
                    
                    return (
                        <motion.tr
                        key={transaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 text-right"
                        >
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-mono font-bold text-blue-600">
                            {transaction.transaction_number || `#${transaction.id?.toString().padStart(3, '0')}`}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-end">
                            <div>
                                <div className="font-medium text-gray-900">{beneficiary}</div>
                                <div className="text-xs text-gray-500">
                                {beneficiaryId && (
                                    <>
                                    {beneficiaryType === 'student' ? 'Étudiant' : 'Enseignant'}: {beneficiaryId}
                                    </>
                                )}
                                </div>
                            </div>
                            <div className="mr-3 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                {beneficiaryType === 'student' ? <GraduationCap size={14} /> : 
                                beneficiaryType === 'teacher' ? <Users size={14} /> : 
                                <Building size={14} />}
                            </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            {typeLabel}
                            </span>
                            {transaction.category && (
                            <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                                transaction.category === 'income' ? 'bg-green-100 text-green-800' :
                                transaction.category === 'expense' ? 'bg-red-100 text-red-800' :
                                transaction.category === 'salary' ? 'bg-blue-100 text-blue-800' :
                                transaction.category === 'scholarship' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                                {transaction.category === 'income' ? 'Revenu' :
                                transaction.category === 'expense' ? 'Dépense' :
                                transaction.category === 'salary' ? 'Salaire' :
                                transaction.category === 'scholarship' ? 'Bourse' : 'Autre'}
                            </span>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{formatCurrency(transaction.amount)}
                            {transaction.paid_amount > 0 && transaction.paid_amount < transaction.amount && (
                                <div className="text-xs text-gray-500">
                                Payé: {formatCurrency(transaction.paid_amount)}
                                </div>
                            )}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                            {transaction.date ? new Date(transaction.date).toLocaleDateString('fr-FR') : '---'}
                            {transaction.due_date && (
                                <div className="text-xs text-gray-500">
                                Échéance: {new Date(transaction.due_date).toLocaleDateString('fr-FR')}
                                </div>
                            )}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-end">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusConfig[transaction.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                                {statusConfig[transaction.status]?.label || transaction.status}
                            </span>
                            <StatusIcon size={16} className="mr-2" />
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2 space-x-reverse justify-end">
                            <button 
                                onClick={() => handleViewTransaction(transaction)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Voir détails"
                            >
                                <Eye size={18} />
                            </button>
                            <button 
                                onClick={() => handleEditTransaction(transaction)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                title="Modifier"
                            >
                                <Edit size={18} />
                            </button>
                            <button 
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
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
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                Affichage {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredTransactions.length)} 
                sur {filteredTransactions.length} transactions
                </div>
                <div className="flex space-x-2 space-x-reverse">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                    <ChevronRight size={20} />
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
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                    <ChevronLeft size={20} />
                </button>
                </div>
            </div>
            )}
        </motion.div>

        {/* Analyse financière */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
            {/* Répartition des revenus */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Répartition des transactions</h3>
                <button 
                onClick={fetchData}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                >
                <RefreshCw size={16} className="ml-1" />
                Actualiser
                </button>
            </div>
            
            {(statistics.transaction_distribution && statistics.transaction_distribution.length > 0) || 
            safeTransactions.length > 0 ? (
                <div className="space-y-4">
                {/* Utiliser les statistiques API ou calculer localement */}
                {(statistics.transaction_distribution || []).length > 0 ? (
                    statistics.transaction_distribution.map((item, index) => {
                    const percentage = statistics.total_income > 0 
                        ? Math.round((Math.abs(item.total) / statistics.total_income) * 100) 
                        : 0;
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500'];
                    const frenchTypes = {
                        'tuition': 'Frais de scolarité',
                        'exam_fee': 'Frais d\'examen',
                        'library_fee': 'Frais de bibliothèque',
                        'lab_fee': 'Frais de laboratoire',
                        'scholarship': 'Bourses d\'études',
                        'refund': 'Remboursements',
                        'salary': 'Salaires',
                        'maintenance': 'Maintenance',
                        'equipment': 'Équipement',
                        'other': 'Autre'
                    };
                    
                    const isNegative = (item.total || 0) < 0;
                    
                    return (
                        <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700">
                            {frenchTypes[item.transaction_type] || item.transaction_type}
                            </span>
                            <span className={`font-bold ${isNegative ? 'text-red-600' : 'text-gray-800'}`}>
                            {formatCurrency(item.total)}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                            className={`h-3 rounded-full ${colors[index % colors.length]}`}
                            style={{ width: `${Math.min(100, percentage)}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>{percentage}% du total</span>
                            <span>{item.count || 0} transactions</span>
                        </div>
                        </div>
                    );
                    })
                ) : (
                    // Calcul local si pas de statistiques API
                    (() => {
                    const types = {};
                    safeTransactions.forEach(t => {
                        if (!types[t.transaction_type]) {
                        types[t.transaction_type] = { total: 0, count: 0 };
                        }
                        types[t.transaction_type].total += parseFloat(t.amount) || 0;
                        types[t.transaction_type].count++;
                    });
                    
                    const totalAmount = Object.values(types).reduce((sum, t) => sum + Math.abs(t.total), 0);
                    
                    return Object.entries(types).map(([type, data], index) => {
                        const percentage = totalAmount > 0 ? Math.round((Math.abs(data.total) / totalAmount) * 100) : 0;
                        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500'];
                        const frenchTypes = {
                        'tuition': 'Frais de scolarité',
                        'exam_fee': 'Frais d\'examen',
                        'library_fee': 'Frais de bibliothèque',
                        'lab_fee': 'Frais de laboratoire',
                        'scholarship': 'Bourses d\'études',
                        'refund': 'Remboursements',
                        'salary': 'Salaires',
                        'maintenance': 'Maintenance',
                        'equipment': 'Équipement',
                        'other': 'Autre'
                        };
                        
                        const isNegative = (data.total || 0) < 0;
                        
                        return (
                        <div key={type} className="space-y-2">
                            <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700">
                                {frenchTypes[type] || type}
                            </span>
                            <span className={`font-bold ${isNegative ? 'text-red-600' : 'text-gray-800'}`}>
                                {formatCurrency(data.total)}
                            </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                                className={`h-3 rounded-full ${colors[index % colors.length]}`}
                                style={{ width: `${Math.min(100, percentage)}%` }}
                            ></div>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                            <span>{percentage}% du total</span>
                            <span>{data.count} transactions</span>
                            </div>
                        </div>
                        );
                    });
                    })()
                )}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Aucune donnée disponible</p>
                <p className="mt-2">Les transactions seront affichées ici</p>
                </div>
            )}
            </div>

            {/* Liste des budgets */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Budgets</h3>
                <div className="flex space-x-2">
                <button 
                    onClick={handleAddBudget}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                >
                    <Plus size={16} className="ml-1" />
                    Ajouter
                </button>
                <button 
                    onClick={() => {
                    const activeOnly = budgets.filter(b => b.is_active);
                    showToast(`${activeOnly.length} budgets actifs`, 'info');
                    }}
                    className="text-sm text-gray-600 hover:text-gray-700"
                >
                    Voir tous
                </button>
                </div>
            </div>
            
            <div className="space-y-4">
                {Array.isArray(budgets) && budgets.length > 0 ? (
                budgets.slice(0, 5).map((budget) => {
                    const remaining = budget.remaining_amount || (budget.allocated_amount - budget.spent_amount);
                    const percentageSpent = budget.allocated_amount > 0 
                    ? Math.round((budget.spent_amount / budget.allocated_amount) * 100) 
                    : 0;
                    const isOverBudget = percentageSpent > 100;
                    const isWarning = percentageSpent > 80;
                    
                    return (
                    <motion.div
                        key={budget.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                    >
                        <div className="flex justify-between items-start mb-3">
                        <div>
                            <div className="flex items-center">
                            <Building size={16} className="text-gray-500 ml-2" />
                            <h4 className="font-semibold text-gray-800">{budget.department_display || budget.department}</h4>
                            {!budget.is_active && (
                                <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                Inactif
                                </span>
                            )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                            {budget.budget_type_display || budget.budget_type} - {budget.year}
                            </p>
                        </div>
                        <div className="flex space-x-1 space-x-reverse">
                            <button 
                            onClick={() => handleEditBudget(budget)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Modifier"
                            >
                            <Edit size={14} />
                            </button>
                            <button 
                            onClick={() => handleDeleteBudget(budget.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Supprimer"
                            >
                            <Trash2 size={14} />
                            </button>
                        </div>
                        </div>
                        <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 p-2 rounded-lg">
                            <p className="text-xs text-gray-500">Alloué</p>
                            <p className="font-bold text-gray-800">{formatSimpleCurrency(budget.allocated_amount)}</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg">
                            <p className="text-xs text-gray-500">Dépensé</p>
                            <p className={`font-bold ${isOverBudget ? 'text-red-600' : 'text-gray-800'}`}>
                                {formatSimpleCurrency(budget.spent_amount)}
                            </p>
                            </div>
                        </div>
                        <div className="bg-blue-50 p-2 rounded-lg">
                            <div className="flex justify-between mb-1">
                            <p className="text-xs text-blue-600">Restant</p>
                            <p className={`text-xs font-medium ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatSimpleCurrency(remaining)}
                            </p>
                            </div>
                            <div className="w-full bg-gray-300 rounded-full h-2">
                            <div 
                                className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(100, percentageSpent)}%` }}
                            ></div>
                            </div>
                            <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-500">0%</span>
                            <span className="text-xs font-medium text-gray-700">{percentageSpent}%</span>
                            <span className="text-xs text-gray-500">100%</span>
                            </div>
                        </div>
                        </div>
                    </motion.div>
                    );
                })
                ) : (
                <div className="text-center py-8 text-gray-500">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building size={24} />
                    </div>
                    <p className="text-lg font-medium">Aucun budget</p>
                    <p className="mt-2 mb-4">Ajoutez des budgets pour gérer les dépenses</p>
                    <button 
                    onClick={handleAddBudget}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                    Créer premier budget
                    </button>
                </div>
                )}
            </div>
            </div>
        </motion.div>

        {/* Modals */}
        {showTransactionModal && (
            <FinanceModal
            type="transaction"
            isOpen={showTransactionModal}
            onClose={() => {
                setShowTransactionModal(false);
                setSelectedTransaction(null);
            }}
            data={selectedTransaction}
            mode={modalMode}
            onSave={handleSaveTransaction}
            />
        )}

        {showBudgetModal && (
            <FinanceModal
            type="budget"
            isOpen={showBudgetModal}
            onClose={() => {
                setShowBudgetModal(false);
                setSelectedBudget(null);
            }}
            data={selectedBudget}
            mode={modalMode}
            onSave={handleSaveBudget}
            />
        )}
        </div>
    );
    };

    export default Finance;