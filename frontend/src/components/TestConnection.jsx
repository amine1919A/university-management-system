import React, { useState, useEffect } from 'react';
import { authService, studentService, teacherService } from '../services/api';

const TestConnection = () => {
  const [status, setStatus] = useState({
    auth: 'Vérification...',
    students: 'Vérification...',
    teachers: 'Vérification...',
  });
  const [loading, setLoading] = useState(true);

  const testConnection = async () => {
    try {
      // Test d'authentification
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          await authService.getProfile();
          setStatus(prev => ({ ...prev, auth: '✅ Connecté' }));
        } catch (error) {
          setStatus(prev => ({ ...prev, auth: '❌ Token invalide' }));
        }
      } else {
        setStatus(prev => ({ ...prev, auth: '❌ Non connecté' }));
      }

      // Test des étudiants
      try {
        const studentsRes = await studentService.getAll();
        setStatus(prev => ({ ...prev, students: `✅ ${studentsRes.data.length} étudiants` }));
      } catch (error) {
        setStatus(prev => ({ ...prev, students: `❌ Erreur: ${error.message}` }));
      }

      // Test des enseignants
      try {
        const teachersRes = await teacherService.getAll();
        setStatus(prev => ({ ...prev, teachers: `✅ ${teachersRes.data.length} enseignants` }));
      } catch (error) {
        setStatus(prev => ({ ...prev, teachers: `❌ Erreur: ${error.message}` }));
      }

    } catch (error) {
      console.error('Test error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test de connexion API</h1>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Test en cours...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="font-bold mb-2">État des connexions:</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="font-medium w-32">Authentification:</span>
                <span>{status.auth}</span>
              </li>
              <li className="flex items-center">
                <span className="font-medium w-32">Étudiants:</span>
                <span>{status.students}</span>
              </li>
              <li className="flex items-center">
                <span className="font-medium w-32">Enseignants:</span>
                <span>{status.teachers}</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold mb-2">Comptes de test:</h3>
            <ul className="space-y-1">
              <li><strong>admin / admin123</strong> - Superutilisateur</li>
              <li><strong>test / test123</strong> - Administrateur</li>
              <li><strong>etudiant1 / student123</strong> - Étudiant</li>
              <li><strong>enseignant1 / teacher123</strong> - Enseignant</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestConnection;