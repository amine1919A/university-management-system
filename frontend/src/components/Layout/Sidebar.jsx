import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Users,
  BookOpen,
  Calendar,
  FileText,
  DollarSign,
  Settings,
  BarChart3,
  ClipboardList,
  UserPlus,
  CreditCard,
  Bookmark,
  Download,
  Award  // AJOUTER CETTE IMPORTATION
} from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    {
      title: 'Général',
      items: [
        { path: '/dashboard', label: 'Tableau de bord', icon: <Home size={18} /> },
      ]
    },
    {
      title: 'Académique',
      items: [
        { path: '/students', label: 'Étudiants', icon: <Users size={18} /> },
        { path: '/teachers', label: 'Enseignants', icon: <Users size={18} /> },
        { path: '/courses', label: 'Cours', icon: <BookOpen size={18} /> },
        { path: '/enrollments', label: 'Inscriptions', icon: <UserPlus size={18} /> },
        { path: '/schedule', label: 'Emploi du temps', icon: <Calendar size={18} /> },
      ]
    },
    {
      title: 'Évaluations',
      items: [
        { path: '/exams', label: 'Examens', icon: <FileText size={18} /> },
        { path: '/notes', label: 'Notes', icon: <Award size={18} /> },
        { path: '/transcripts', label: 'Relevés de notes', icon: <Download size={18} /> },
      ]
    },
    {
      title: 'Administratif',
      items: [
        { path: '/finance', label: 'Finance', icon: <DollarSign size={18} /> },
        { path: '/scholarships', label: 'Bourses', icon: <CreditCard size={18} /> },
        { path: '/certificates', label: 'Certificats', icon: <Bookmark size={18} /> },
        { path: '/reports', label: 'Rapports', icon: <BarChart3 size={18} /> },
      ]
    },
    {
      title: 'Système',
      items: [
        { path: '/settings', label: 'Paramètres', icon: <Settings size={18} /> },
      ]
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] overflow-y-auto hidden lg:block">
      <div className="p-4">
        {menuItems.map((section, index) => (
          <div key={index} className="mb-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {section.title}
            </h3>
            <nav className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                    }`
                  }
                >
                  <div className="text-gray-400 group-hover:text-blue-600">
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;