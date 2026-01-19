import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-primary-600 p-2 rounded-lg">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold">UniversityManager</span>
            </div>
            <p className="text-gray-400 mb-6">
              Système de gestion universitaire complet pour gérer les étudiants, 
              les enseignants, les cours et les ressources académiques.
            </p>
            <div className="flex space-x-4">
              <button className="text-gray-400 hover:text-white transition">
                <Facebook size={20} />
              </button>
              <button className="text-gray-400 hover:text-white transition">
                <Twitter size={20} />
              </button>
              <button className="text-gray-400 hover:text-white transition">
                <Linkedin size={20} />
              </button>
            </div>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Liens rapides</h3>
            <ul className="space-y-2">
              <li><Link to="/dashboard" className="text-gray-400 hover:text-white transition">Tableau de bord</Link></li>
              <li><Link to="/students" className="text-gray-400 hover:text-white transition">Étudiants</Link></li>
              <li><Link to="/teachers" className="text-gray-400 hover:text-white transition">Enseignants</Link></li>
              <li><Link to="/courses" className="text-gray-400 hover:text-white transition">Cours</Link></li>
              <li><Link to="/exams" className="text-gray-400 hover:text-white transition">Examens</Link></li>
            </ul>
          </div>

          {/* Liens administratifs */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Administration</h3>
            <ul className="space-y-2">
              <li><Link to="/finance" className="text-gray-400 hover:text-white transition">Gestion financière</Link></li>
              <li><Link to="/reports" className="text-gray-400 hover:text-white transition">Rapports</Link></li>
              <li><Link to="/settings" className="text-gray-400 hover:text-white transition">Paramètres</Link></li>
              <li><a href="http://localhost:8000/admin" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">Admin Django</a></li>
              <li><Link to="/api-docs" className="text-gray-400 hover:text-white transition">API Documentation</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3 text-gray-400">
                <MapPin size={18} />
                <span>123 Rue de l'Université, Ville</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <Phone size={18} />
                <span>+33 1 23 45 67 89</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <Mail size={18} />
                <span>contact@university-manager.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {currentYear} University Management System. Tous droits réservés.</p>
          <p className="mt-2 text-sm">Développé avec Django & React</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;