import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Calendar, CreditCard, Award, BookOpen, FileText, Users, AlertCircle, Building, Loader, GraduationCap, Briefcase } from 'lucide-react';
import { studentService, teacherService } from '../services/api';

const FinanceModal = ({ type, isOpen, onClose, data, mode, onSave }) => {
  const [formData, setFormData] = useState(getInitialFormData(type));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [beneficiaryType, setBeneficiaryType] = useState('student');

  function getInitialFormData(formType) {
    if (formType === 'transaction') {
      return {
        student: '',
        teacher: '',
        transaction_type: 'tuition',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
        method: 'bank_transfer',
        description: '',
        is_recurring: false,
        recurrence_period: ''
      };
    } else {
      return {
        department: 'engineering',
        budget_type: 'operational',
        year: new Date().getFullYear(),
        allocated_amount: '',
        spent_amount: '0',
        committed_amount: '0',
        description: '',
        is_active: true
      };
    }
  }

  // Dans FinanceModal.jsx, remplacez la partie où vous pré-remplissez les données du budget:

  useEffect(() => {
    if (data && isOpen) {
      console.log(`📋 Données ${type} reçues:`, data);
      console.log(`📋 Mode: ${mode}`);
      console.log(`📋 Données complètes:`, JSON.stringify(data, null, 2));
      
      if (type === 'transaction') {
        // DÉTERMINER LE TYPE DE BÉNÉFICIAIRE
        let beneficiary = 'student';
        if (data.teacher || (data.teacher && data.teacher.id)) {
          beneficiary = 'teacher';
          setBeneficiaryType('teacher');
        } else {
          setBeneficiaryType('student');
        }
        
        console.log(`📋 Bénéficiaire détecté: ${beneficiary}`);
        console.log(`📋 student_id dans data:`, data.student);
        console.log(`📋 teacher_id dans data:`, data.teacher);
        console.log(`📋 student object:`, data.student);
        console.log(`📋 teacher object:`, data.teacher);
        
        // PRÉPARER LES DONNÉES DU FORMULAIRE
        const transactionData = {
          student: data.student?.id || data.student || '',
          teacher: data.teacher?.id || data.teacher || '',
          transaction_type: data.transaction_type || 'tuition',
          amount: data.amount ? Math.abs(parseFloat(data.amount)).toString() : '',
          date: data.date ? data.date.split('T')[0] : new Date().toISOString().split('T')[0],
          due_date: data.due_date ? data.due_date.split('T')[0] : 
                    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: data.status || 'pending',
          method: data.method || 'bank_transfer',
          description: data.description || '',
          is_recurring: data.is_recurring || false,
          recurrence_period: data.recurrence_period || ''
        };
        
        console.log(`📋 Données formulaires préparées:`, transactionData);
        setFormData(transactionData);
        
      } else {
        // FIX POUR LES BUDGETS - Convertir le libellé en clé si nécessaire
        let departmentValue = data.department || 'engineering';
        
        // Si le département contient un libellé français, le convertir en clé
        if (departmentValue && typeof departmentValue === 'string') {
          const departmentMap = {
            'Faculté d\'Ingénierie': 'engineering',
            'Faculté de Médecine': 'medicine',
            'Faculté des Sciences': 'sciences',
            'Faculté des Arts': 'arts',
            'Faculté d\'Économie': 'economics',
            'Faculté de Droit': 'law',
            'Administration Générale': 'administration',
            'Centre Informatique': 'it',
            'Bibliothèque Centrale': 'library',
            'Affaires Étudiantes': 'student_affairs',
            'Maintenance': 'maintenance',
            'Salaires': 'salaries'
          };
          
          // Vérifier si c'est un libellé et le convertir
          if (departmentMap[departmentValue]) {
            departmentValue = departmentMap[departmentValue];
          }
        }
        
        setFormData({
          department: departmentValue,
          budget_type: data.budget_type || 'operational',
          year: data.year || new Date().getFullYear(),
          allocated_amount: data.allocated_amount || '',
          spent_amount: data.spent_amount || '0',
          committed_amount: data.committed_amount || '0',
          description: data.description || '',
          is_active: data.is_active !== undefined ? data.is_active : true
        });
      }
    } else if (isOpen) {
      // Réinitialiser le formulaire pour la création
      console.log(`📋 Création nouvelle ${type}`);
      setFormData(getInitialFormData(type));
      setBeneficiaryType('student');
    }
    setErrors({});
  }, [data, isOpen, type]);

  // Charger les étudiants et enseignants
  useEffect(() => {
    const loadData = async () => {
      if (type === 'transaction' && isOpen && mode !== 'view') {
        try {
          setLoadingStudents(true);
          setLoadingTeachers(true);
          
          // Charger les étudiants
          const studentsResponse = await studentService.getAll({ page_size: 100 });
          let studentsData = [];
          if (studentsResponse.data && studentsResponse.data.success && Array.isArray(studentsResponse.data.data)) {
            studentsData = studentsResponse.data.data;
          } else if (Array.isArray(studentsResponse.data)) {
            studentsData = studentsResponse.data;
          }
          setStudents(studentsData);
          
          // Charger les enseignants
          const teachersResponse = await teacherService.getAll({ page_size: 100 });
          let teachersData = [];
          if (teachersResponse.data && teachersResponse.data.success && Array.isArray(teachersResponse.data.data)) {
            teachersData = teachersResponse.data.data;
          } else if (Array.isArray(teachersResponse.data)) {
            teachersData = teachersResponse.data;
          }
          setTeachers(teachersData);
          
          console.log(`✅ ${studentsData.length} étudiants et ${teachersData.length} enseignants chargés`);
        } catch (error) {
          console.error("❌ Erreur chargement des données:", error);
          setStudents([]);
          setTeachers([]);
        } finally {
          setLoadingStudents(false);
          setLoadingTeachers(false);
        }
      }
    };
    
    if (isOpen) {
      loadData();
    }
  }, [isOpen, type, mode]);

  const validateForm = () => {
    const newErrors = {};
    
    if (type === 'transaction') {
      // Vérifier le bénéficiaire
      if (beneficiaryType === 'student' && !formData.student) {
        newErrors.student = "L'étudiant est requis";
      } else if (beneficiaryType === 'teacher' && !formData.teacher) {
        newErrors.teacher = "L'enseignant est requis";
      }
      
      // Vérifier le montant
      if (!formData.amount || isNaN(parseFloat(formData.amount))) {
        newErrors.amount = "Le montant doit être un nombre valide";
      } else if (formData.transaction_type !== 'scholarship' && 
                 formData.transaction_type !== 'refund' && 
                 parseFloat(formData.amount) <= 0) {
        newErrors.amount = "Le montant doit être positif";
      }
      
      // Vérifier la date d'échéance
      if (!formData.due_date) {
        newErrors.due_date = "La date d'échéance est requise";
      }
      
      // Vérifier le type de transaction
      if (!formData.transaction_type) {
        newErrors.transaction_type = "Le type de transaction est requis";
      }
    } else {
      if (!formData.department) newErrors.department = "Le département est requis";
      if (!formData.budget_type) newErrors.budget_type = "Le type de budget est requis";
      if (!formData.year || formData.year < 2000 || formData.year > 2100) {
        newErrors.year = "L'année doit être valide (2000-2100)";
      }
      if (!formData.allocated_amount || isNaN(parseFloat(formData.allocated_amount)) || parseFloat(formData.allocated_amount) <= 0) {
        newErrors.allocated_amount = "Le montant alloué doit être un nombre positif";
      }
      if (formData.spent_amount && (isNaN(parseFloat(formData.spent_amount)) || parseFloat(formData.spent_amount) < 0)) {
        newErrors.spent_amount = "Le montant dépensé doit être un nombre positif ou zéro";
      }
      if (formData.committed_amount && (isNaN(parseFloat(formData.committed_amount)) || parseFloat(formData.committed_amount) < 0)) {
        newErrors.committed_amount = "Le montant engagé doit être un nombre positif ou zéro";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBeneficiaryTypeChange = (type) => {
    setBeneficiaryType(type);
    // Réinitialiser l'autre champ
    if (type === 'student') {
      setFormData(prev => ({ ...prev, teacher: '' }));
    } else {
      setFormData(prev => ({ ...prev, student: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Préparer les données pour l'API
      const submissionData = { ...formData };
      
      // Convertir les montants en nombres
      if (type === 'transaction') {
        submissionData.amount = parseFloat(submissionData.amount);
        
        // Pour les bourses et remboursements, s'assurer que le montant est négatif
        if (submissionData.transaction_type === 'scholarship' || submissionData.transaction_type === 'refund') {
          submissionData.amount = -Math.abs(submissionData.amount);
        }
        
        // Ne garder que le bénéficiaire sélectionné
        if (beneficiaryType === 'student') {
          submissionData.student = parseInt(submissionData.student);
          delete submissionData.teacher;
        } else {
          submissionData.teacher = parseInt(submissionData.teacher);
          delete submissionData.student;
        }
        
        // Gérer les dates
        if (!submissionData.date) {
          submissionData.date = new Date().toISOString().split('T')[0];
        }
      } else {
        submissionData.allocated_amount = parseFloat(submissionData.allocated_amount);
        submissionData.spent_amount = parseFloat(submissionData.spent_amount || 0);
        submissionData.committed_amount = parseFloat(submissionData.committed_amount || 0);
        submissionData.year = parseInt(submissionData.year);
      }
      
      console.log(`💾 Données à sauvegarder (${type}):`, submissionData);
      await onSave(submissionData);
    } catch (error) {
      console.error(`❌ Erreur de soumission ${type}:`, error);
      if (!error.response) {
        showToast('Erreur de connexion au serveur', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const transactionTypes = [
    { value: 'tuition', label: 'Frais de scolarité', icon: BookOpen, category: 'income' },
    { value: 'exam_fee', label: 'Frais d\'examen', icon: FileText, category: 'income' },
    { value: 'library_fee', label: 'Frais de bibliothèque', icon: BookOpen, category: 'income' },
    { value: 'lab_fee', label: 'Frais de laboratoire', icon: BookOpen, category: 'income' },
    { value: 'scholarship', label: 'Bourse d\'études', icon: Award, category: 'scholarship' },
    { value: 'refund', label: 'Remboursement', icon: DollarSign, category: 'scholarship' },
    { value: 'salary', label: 'Salaire enseignant', icon: Users, category: 'salary' },
    { value: 'maintenance', label: 'Maintenance', icon: Building, category: 'expense' },
    { value: 'equipment', label: 'Équipement', icon: Building, category: 'expense' },
    { value: 'other', label: 'Autre', icon: DollarSign, category: 'expense' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'En attente' },
    { value: 'paid', label: 'Payé' },
    { value: 'overdue', label: 'En retard' },
    { value: 'partial', label: 'Partiel' },
    { value: 'cancelled', label: 'Annulé' }
  ];

  const methodOptions = [
    { value: 'bank_transfer', label: 'Virement bancaire' },
    { value: 'credit_card', label: 'Carte de crédit' },
    { value: 'cash', label: 'Espèces' },
    { value: 'check', label: 'Chèque' },
    { value: 'mobile_payment', label: 'Paiement mobile' }
  ];

  const departmentOptions = [
    { value: 'engineering', label: 'Faculté d\'Ingénierie' },
    { value: 'medicine', label: 'Faculté de Médecine' },
    { value: 'sciences', label: 'Faculté des Sciences' },
    { value: 'arts', label: 'Faculté des Arts' },
    { value: 'economics', label: 'Faculté d\'Économie' },
    { value: 'law', label: 'Faculté de Droit' },
    { value: 'administration', label: 'Administration Générale' },
    { value: 'it', label: 'Centre Informatique' },
    { value: 'library', label: 'Bibliothèque Centrale' },
    { value: 'student_affairs', label: 'Affaires Étudiantes' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'salaries', label: 'Salaires' }
  ];

  const budgetTypeOptions = [
    { value: 'operational', label: 'Opérationnel' },
    { value: 'capital', label: 'Capital' },
    { value: 'salary', label: 'Salaires' },
    { value: 'scholarship', label: 'Bourses' },
    { value: 'development', label: 'Développement' }
  ];

  const recurrenceOptions = [
    { value: '', label: 'Aucune' },
    { value: 'monthly', label: 'Mensuel' },
    { value: 'quarterly', label: 'Trimestriel' },
    { value: 'yearly', label: 'Annuel' }
  ];

  // Fonction pour afficher des notifications (à implémenter)
  const showToast = (message, type) => {
    console.log(`${type}: ${message}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            disabled={loading}
          >
            <X size={24} />
          </button>
          <div className="flex items-center space-x-3 space-x-reverse">
            {type === 'transaction' ? (
              <DollarSign className="text-blue-600" size={24} />
            ) : (
              <Building className="text-green-600" size={24} />
            )}
            <h2 className="text-2xl font-bold text-gray-800">
              {mode === 'create' ? 'Ajouter' : mode === 'edit' ? 'Modifier' : 'Détails'} 
              {' '}{type === 'transaction' ? 'une transaction' : 'un budget'}
            </h2>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {loading && (
              <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="mr-3 text-blue-600">Traitement en cours...</span>
              </div>
            )}

            {type === 'transaction' ? (
              <>
                {/* Informations transaction */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 flex items-center justify-end">
                    <span className="mr-2">Informations de la transaction</span>
                    <DollarSign size={18} />
                  </h3>
                  
                  {/* Sélection du bénéficiaire */}
                  <div className="text-right">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bénéficiaire *
                    </label>
                    <div className="flex space-x-4 space-x-reverse mb-4">
                      <button
                        type="button"
                        onClick={() => handleBeneficiaryTypeChange('student')}
                        className={`flex-1 py-2 px-4 rounded-lg border transition ${
                          beneficiaryType === 'student'
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          <GraduationCap size={18} className="ml-2" />
                          <span>Étudiant</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBeneficiaryTypeChange('teacher')}
                        className={`flex-1 py-2 px-4 rounded-lg border transition ${
                          beneficiaryType === 'teacher'
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          <Briefcase size={18} className="ml-2" />
                          <span>Enseignant</span>
                        </div>
                      </button>
                    </div>
                    
                    {beneficiaryType === 'student' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Users className="inline ml-1" size={14} />
                          Étudiant *
                        </label>
                        {loadingStudents ? (
                          <div className="flex items-center justify-end py-2">
                            <Loader size={16} className="animate-spin ml-2" />
                            <span className="text-sm text-gray-500">Chargement des étudiants...</span>
                          </div>
                        ) : (
                          <>
                            <select
                              name="student"
                              value={formData.student}
                              onChange={handleChange}
                              required
                              disabled={mode === 'view' || loading}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right ${
                                errors.student ? 'border-red-500' : 'border-gray-300'
                              }`}
                              dir="rtl"
                            >
                              <option value="">Sélectionner un étudiant</option>
                              {students.map(student => (
                                <option key={student.id} value={student.id}>
                                  {student.student_id} - {student.user?.first_name} {student.user?.last_name}
                                </option>
                              ))}
                            </select>
                            {errors.student && (
                              <p className="mt-1 text-sm text-red-600 flex items-center justify-end">
                                <AlertCircle size={14} className="ml-1" />
                                {errors.student}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Briefcase className="inline ml-1" size={14} />
                          Enseignant *
                        </label>
                        {loadingTeachers ? (
                          <div className="flex items-center justify-end py-2">
                            <Loader size={16} className="animate-spin ml-2" />
                            <span className="text-sm text-gray-500">Chargement des enseignants...</span>
                          </div>
                        ) : (
                          <>
                            <select
                              name="teacher"
                              value={formData.teacher}
                              onChange={handleChange}
                              required
                              disabled={mode === 'view' || loading}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right ${
                                errors.teacher ? 'border-red-500' : 'border-gray-300'
                              }`}
                              dir="rtl"
                            >
                              <option value="">Sélectionner un enseignant</option>
                              {teachers.map(teacher => (
                                <option key={teacher.id} value={teacher.id}>
                                  {teacher.teacher_id} - {teacher.user?.first_name} {teacher.user?.last_name}
                                </option>
                              ))}
                            </select>
                            {errors.teacher && (
                              <p className="mt-1 text-sm text-red-600 flex items-center justify-end">
                                <AlertCircle size={14} className="ml-1" />
                                {errors.teacher}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Type de transaction */}
                    <div className="text-right">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type de transaction *
                      </label>
                      <select
                        name="transaction_type"
                        value={formData.transaction_type}
                        onChange={handleChange}
                        required
                        disabled={mode === 'view' || loading}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right ${
                          errors.transaction_type ? 'border-red-500' : 'border-gray-300'
                        }`}
                        dir="rtl"
                      >
                        {transactionTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {errors.transaction_type && (
                        <p className="mt-1 text-sm text-red-600 flex items-center justify-end">
                          <AlertCircle size={14} className="ml-1" />
                          {errors.transaction_type}
                        </p>
                      )}
                    </div>

                    {/* Montant */}
                    <div className="text-right">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <DollarSign className="inline ml-1" size={14} />
                        Montant (TND) *
                      </label>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        required
                        step="0.001"
                        min={formData.transaction_type === 'scholarship' || formData.transaction_type === 'refund' ? undefined : "0.001"}
                        disabled={mode === 'view' || loading}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right ${
                          errors.amount ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.000"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.transaction_type === 'scholarship' || formData.transaction_type === 'refund' 
                          ? 'Montant négatif (débit)' 
                          : 'Montant positif (crédit)'}
                      </p>
                      {errors.amount && (
                        <p className="mt-1 text-sm text-red-600 flex items-center justify-end">
                          <AlertCircle size={14} className="ml-1" />
                          {errors.amount}
                        </p>
                      )}
                    </div>

                    {/* Statut */}
                    <div className="text-right">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Statut
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        disabled={mode === 'view' || loading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                        dir="rtl"
                      >
                        {statusOptions.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date de transaction */}
                    <div className="text-right">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="inline ml-1" size={14} />
                        Date
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        disabled={mode === 'view' || loading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                      />
                    </div>

                    {/* Date d'échéance */}
                    <div className="text-right">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="inline ml-1" size={14} />
                        Date d'échéance *
                      </label>
                      <input
                        type="date"
                        name="due_date"
                        value={formData.due_date}
                        onChange={handleChange}
                        required
                        disabled={mode === 'view' || loading}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right ${
                          errors.due_date ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.due_date && (
                        <p className="mt-1 text-sm text-red-600 flex items-center justify-end">
                          <AlertCircle size={14} className="ml-1" />
                          {errors.due_date}
                        </p>
                      )}
                    </div>

                    {/* Mode de paiement */}
                    <div className="text-right">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <CreditCard className="inline ml-1" size={14} />
                        Mode de paiement
                      </label>
                      <select
                        name="method"
                        value={formData.method}
                        onChange={handleChange}
                        disabled={mode === 'view' || loading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                        dir="rtl"
                      >
                        {methodOptions.map(method => (
                          <option key={method.value} value={method.value}>
                            {method.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Transaction récurrente */}
                    <div className="text-right">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transaction récurrente
                      </label>
                      <div className="flex items-center justify-end">
                        <input
                          type="checkbox"
                          name="is_recurring"
                          checked={formData.is_recurring}
                          onChange={handleChange}
                          disabled={mode === 'view' || loading}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="mr-2 text-sm text-gray-700">Récurrente</span>
                      </div>
                    </div>

                    {/* Période de récurrence */}
                    {formData.is_recurring && (
                      <div className="text-right">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Période de récurrence
                        </label>
                        <select
                          name="recurrence_period"
                          value={formData.recurrence_period}
                          onChange={handleChange}
                          disabled={mode === 'view' || loading}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                          dir="rtl"
                        >
                          {recurrenceOptions.map(period => (
                            <option key={period.value} value={period.value}>
                              {period.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="text-right">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      disabled={mode === 'view' || loading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                      placeholder="Description de la transaction..."
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Informations budget */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 flex items-center justify-end">
                    <span className="mr-2">Informations du budget</span>
                    <Building size={18} />
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Département */}
                    <div className="text-right">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Département *
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        required
                        disabled={mode === 'view' || loading}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right ${
                          errors.department ? 'border-red-500' : 'border-gray-300'
                        }`}
                        dir="rtl"
                      >
                        {departmentOptions.map(dept => (
                          <option key={dept.value} value={dept.value}>
                            {dept.label}
                          </option>
                        ))}
                      </select>
                      {errors.department && (
                        <p className="mt-1 text-sm text-red-600 flex items-center justify-end">
                          <AlertCircle size={14} className="ml-1" />
                          {errors.department}
                        </p>
                      )}
                    </div>

                    {/* Type de budget */}
                    <div className="text-right">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type de budget *
                      </label>
                      <select
                        name="budget_type"
                        value={formData.budget_type}
                        onChange={handleChange}
                        required
                        disabled={mode === 'view' || loading}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right ${
                          errors.budget_type ? 'border-red-500' : 'border-gray-300'
                        }`}
                        dir="rtl"
                      >
                        {budgetTypeOptions.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {errors.budget_type && (
                        <p className="mt-1 text-sm text-red-600 flex items-center justify-end">
                          <AlertCircle size={14} className="ml-1" />
                          {errors.budget_type}
                        </p>
                      )}
                    </div>

                    {/* Année */}
                    <div className="text-right">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Année *
                      </label>
                      <input
                        type="number"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        required
                        min="2000"
                        max="2100"
                        disabled={mode === 'view' || loading}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right ${
                          errors.year ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="2024"
                      />
                      {errors.year && (
                        <p className="mt-1 text-sm text-red-600 flex items-center justify-end">
                          <AlertCircle size={14} className="ml-1" />
                          {errors.year}
                        </p>
                      )}
                    </div>

                    {/* Statut actif */}
                    <div className="text-right">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Statut
                      </label>
                      <div className="flex items-center justify-end">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleChange}
                          disabled={mode === 'view' || loading}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="mr-2 text-sm text-gray-700">Actif</span>
                      </div>
                    </div>

                    {/* Montant alloué */}
                    <div className="text-right">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <DollarSign className="inline ml-1" size={14} />
                        Montant alloué (TND) *
                      </label>
                      <input
                        type="number"
                        name="allocated_amount"
                        value={formData.allocated_amount}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.001"
                        disabled={mode === 'view' || loading}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right ${
                          errors.allocated_amount ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.000"
                      />
                      {errors.allocated_amount && (
                        <p className="mt-1 text-sm text-red-600 flex items-center justify-end">
                          <AlertCircle size={14} className="ml-1" />
                          {errors.allocated_amount}
                        </p>
                      )}
                    </div>

                    {/* Montant dépensé */}
                    <div className="text-right">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <DollarSign className="inline ml-1" size={14} />
                        Montant dépensé (TND)
                      </label>
                      <input
                        type="number"
                        name="spent_amount"
                        value={formData.spent_amount}
                        onChange={handleChange}
                        min="0"
                        step="0.001"
                        disabled={mode === 'view' || loading}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right ${
                          errors.spent_amount ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.000"
                      />
                      {errors.spent_amount && (
                        <p className="mt-1 text-sm text-red-600 flex items-center justify-end">
                          <AlertCircle size={14} className="ml-1" />
                          {errors.spent_amount}
                        </p>
                      )}
                    </div>

                    {/* Montant engagé */}
                    <div className="text-right">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <DollarSign className="inline ml-1" size={14} />
                        Montant engagé (TND)
                      </label>
                      <input
                        type="number"
                        name="committed_amount"
                        value={formData.committed_amount}
                        onChange={handleChange}
                        min="0"
                        step="0.001"
                        disabled={mode === 'view' || loading}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right ${
                          errors.committed_amount ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.000"
                      />
                      {errors.committed_amount && (
                        <p className="mt-1 text-sm text-red-600 flex items-center justify-end">
                          <AlertCircle size={14} className="ml-1" />
                          {errors.committed_amount}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="text-right">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      disabled={mode === 'view' || loading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                      placeholder="Description du budget..."
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t flex justify-start space-x-4 space-x-reverse">
            {(mode === 'create' || mode === 'edit') && (
              <button
                type="submit"
                disabled={loading || (type === 'transaction' && (loadingStudents || loadingTeachers))}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2 space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                <span>{loading ? 'Enregistrement...' : (mode === 'edit' ? 'Mettre à jour' : 'Ajouter')}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              disabled={loading}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FinanceModal;