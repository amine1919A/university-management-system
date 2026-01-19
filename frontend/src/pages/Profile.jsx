import React from 'react';
import { User, Mail, Phone, Calendar, Edit } from 'lucide-react';

const Profile = ({ user }) => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Mon profil</h1>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                <User size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {user?.first_name} {user?.last_name}
                </h2>
                <p className="text-gray-600 capitalize">{user?.user_type}</p>
              </div>
            </div>
            <button className="btn-primary flex items-center space-x-2">
              <Edit size={18} />
              <span>Modifier</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-medium">{user?.phone || 'Non spécifié'}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Date d'inscription</p>
                  <p className="font-medium">
                    {user?.date_joined ? new Date(user.date_joined).toLocaleDateString('fr-FR') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;