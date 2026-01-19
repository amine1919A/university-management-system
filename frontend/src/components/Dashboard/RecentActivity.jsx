import React from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  BookOpen, 
  CreditCard, 
  FileText, 
  Award,
  Calendar,
  Clock
} from 'lucide-react';

const RecentActivity = ({ activities }) => {
  const activityIcons = {
    student: UserPlus,
    course: BookOpen,
    payment: CreditCard,
    exam: FileText,
    grade: Award,
    schedule: Calendar
  };

  const activityColors = {
    student: 'bg-blue-100 text-blue-600',
    course: 'bg-green-100 text-green-600',
    payment: 'bg-yellow-100 text-yellow-600',
    exam: 'bg-purple-100 text-purple-600',
    grade: 'bg-pink-100 text-pink-600',
    schedule: 'bg-indigo-100 text-indigo-600'
  };

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const ActivityIcon = activityIcons[activity.type] || Clock;
        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition"
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${activityColors[activity.type] || 'bg-gray-100'}`}>
                <ActivityIcon size={20} />
              </div>
              <div>
                <p className="font-medium text-gray-800">{activity.action}</p>
                <p className="text-sm text-gray-500">par {activity.user}</p>
              </div>
            </div>
            <span className="text-sm text-gray-500">{activity.time}</span>
          </motion.div>
        );
      })}
    </div>
  );
};

export default RecentActivity;