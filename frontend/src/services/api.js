import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const handleApiError = (error) => {
    console.error('📋 [handleApiError] API Error:', {
      code: error.code,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      request: error.request
    });
    
    // Si c'est déjà un objet d'erreur formaté, le retourner tel quel
    if (error.success === false) {
      return error;
    }
    
    if (error.code === 'ERR_NETWORK') {
      console.error('❌ Le serveur Django n\'est pas en cours d\'exécution !');
      return {
        success: false,
        error: 'Impossible de se connecter au serveur',
        detail: error.message,
        isNetworkError: true
      };
    }
    
    if (error.response) {
      // Le serveur a répondu avec un code d'erreur
      const errorData = error.response.data;
      return {
        success: false,
        error: errorData?.error || 'Erreur serveur',
        detail: errorData?.detail || errorData?.errors || error.message,
        status: error.response.status,
        errors: errorData?.errors
      };
    }
    
    if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      return {
        success: false,
        error: 'Pas de réponse du serveur',
        detail: 'Le serveur n\'a pas répondu à la requête'
      };
    }
    
    // Erreur de validation côté client
    if (error.message && error.message.includes('Validation')) {
      return {
        success: false,
        error: 'Validation échouée',
        detail: error.message,
        validationError: true
      };
    }
    
    // Erreur inconnue
    return {
      success: false,
      error: 'Erreur inconnue',
      detail: error.message || 'Une erreur inattendue est survenue'
    };
  };

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour rafraîchir le token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_URL}/token/refresh/`, {
          refresh: refreshToken
        });
        
        localStorage.setItem('access_token', response.data.access);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Services d'authentification
export const authService = {
  login: async (username, password) => {
    try {
      const response = await api.post('/accounts/token/', { username, password });
      if (response.data.access) {
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
      }
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
  
  register: async (userData) => {
    try {
      return await api.post('/accounts/register/', userData);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getProfile: async () => {
    try {
      return await api.get('/accounts/profile/');
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  updateProfile: async (userData) => {
    try {
      return await api.put('/accounts/profile/', userData);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// Services des étudiants - CORRIGÉ
export const studentService = {
    getAll: async (params = {}) => {
      console.log("📚 Fetching students with params:", params);
      try {
        const response = await api.get('/students/', { params });
        console.log("📚 Students response:", response.data);
        return response;
      } catch (error) {
        console.error("❌ Error fetching students:");
        return handleApiError(error);
      }
    },
    
    getById: async (id) => {
      console.log("📚 Fetching student with id:", id);
      try {
        const response = await api.get(`/students/${id}/`);
        console.log("📚 Student response:", response.data);
        return response;
      } catch (error) {
        console.error(`❌ Error fetching student ${id}:`);
        return handleApiError(error);
      }
    },
    
    create: async (studentData) => {
      console.log("➕ Creating student with data:", studentData);
      try {
        // Formater les données pour l'API
        const formattedData = {
          student_id: studentData.student_id,
          enrollment_date: studentData.enrollment_date,
          graduation_date: studentData.graduation_date || null,
          faculty: studentData.faculty || '',
          department: studentData.department,
          current_year: parseInt(studentData.current_year) || 1,
          gpa: parseFloat(studentData.gpa) || 0.00,
          status: studentData.status || 'active',
          // Données utilisateur
          first_name: studentData.first_name,
          last_name: studentData.last_name,
          email: studentData.email,
          phone: studentData.phone || '',
          date_of_birth: studentData.date_of_birth || null
        };
        
        console.log("📤 Sending formatted student data:", formattedData);
        const response = await api.post('/students/', formattedData);
        console.log("✅ Student created:", response.data);
        return response;
      } catch (error) {
        console.error("❌ Error creating student:");
        console.error("📋 Details:", error.response?.data);
        return handleApiError(error);
      }
    },
    
    update: async (id, studentData) => {
      console.log(`✏️ Updating student ${id} with data:`, studentData);
      try {
        // Formater les données pour l'API
        const formattedData = {};
        
        // Champs étudiants
        if (studentData.student_id !== undefined) formattedData.student_id = studentData.student_id;
        if (studentData.enrollment_date !== undefined) formattedData.enrollment_date = studentData.enrollment_date;
        if (studentData.graduation_date !== undefined) formattedData.graduation_date = studentData.graduation_date || null;
        if (studentData.faculty !== undefined) formattedData.faculty = studentData.faculty || '';
        if (studentData.department !== undefined) formattedData.department = studentData.department;
        if (studentData.current_year !== undefined) formattedData.current_year = parseInt(studentData.current_year) || 1;
        if (studentData.gpa !== undefined) formattedData.gpa = parseFloat(studentData.gpa) || 0.00;
        if (studentData.status !== undefined) formattedData.status = studentData.status || 'active';
        
        // Champs utilisateur
        if (studentData.first_name !== undefined) formattedData.first_name = studentData.first_name;
        if (studentData.last_name !== undefined) formattedData.last_name = studentData.last_name;
        if (studentData.email !== undefined) formattedData.email = studentData.email;
        if (studentData.phone !== undefined) formattedData.phone = studentData.phone || '';
        if (studentData.date_of_birth !== undefined) formattedData.date_of_birth = studentData.date_of_birth || null;
        
        console.log("📤 Sending formatted update data:", formattedData);
        const response = await api.put(`/students/${id}/`, formattedData);
        console.log("✅ Student updated:", response.data);
        return response;
      } catch (error) {
        console.error(`❌ Error updating student ${id}:`);
        console.error("📋 Details:", error.response?.data);
        return handleApiError(error);
      }
    },
    
    delete: async (id) => {
      console.log(`🗑️ Deleting student ${id}`);
      try {
        const response = await api.delete(`/students/${id}/`);
        console.log("✅ Student deleted");
        return response;
      } catch (error) {
        console.error(`❌ Error deleting student ${id}:`);
        return handleApiError(error);
      }
    },
    
    getStatistics: async () => {
      console.log("📈 Fetching student statistics");
      try {
        const response = await api.get('/students/statistics/');
        console.log("📈 Statistics response:", response.data);
        return response;
      } catch (error) {
        console.error("❌ Error fetching statistics:");
        return handleApiError(error);
      }
    },
    
    exportData: async (format = 'csv') => {
      console.log(`📥 Exporting students as ${format}`);
      try {
        const response = await api.get(`/students/export/?format=${format}`, {
          responseType: 'blob'
        });
        console.log("✅ Students exported");
        return response;
      } catch (error) {
        console.error("❌ Error exporting students:");
        return handleApiError(error);
      }
    }
  };

// Services des enseignants
export const teacherService = {
  getAll: async (params = {}) => {
    console.log("Fetching teachers with params:", params);
    try {
      const response = await api.get('/teachers/', { params });
      console.log("Teachers response:", response.data);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getById: async (id) => {
    console.log("Fetching teacher with id:", id);
    try {
      const response = await api.get(`/teachers/${id}/`);
      console.log("Teacher response:", response.data);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  create: async (teacherData) => {
    console.log("Creating teacher with data:", teacherData);
    try {
      const response = await api.post('/teachers/', teacherData);
      console.log("Create teacher response:", response.data);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  update: async (id, teacherData) => {
    console.log(`Updating teacher ${id} with data:`, teacherData);
    try {
      const response = await api.put(`/teachers/${id}/`, teacherData);
      console.log("Update teacher response:", response.data);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  delete: async (id) => {
    console.log("Deleting teacher with id:", id);
    try {
      return await api.delete(`/teachers/${id}/`);
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getStatistics: async () => {
    console.log("Fetching teacher statistics");
    try {
      const response = await api.get('/teachers/statistics/');
      console.log("Teacher statistics response:", response.data);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  exportData: async (format = 'csv') => {
    try {
      return await api.get(`/teachers/export/?format=${format}`, {
        responseType: 'blob'
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// Services des cours - CORRIGÉ (SANS CHAMP STATUS)
export const courseService = {
    getAll: async (params = {}) => {
      console.log("📚 Fetching courses with params:", params);
      try {
        const response = await api.get('/courses/', { params });
        console.log("📚 Courses response:", response.data);
        return response;
      } catch (error) {
        console.error("❌ Error fetching courses:");
        return handleApiError(error);
      }
    },
    
    getById: async (id) => {
      console.log("📚 Fetching course with id:", id);
      try {
        const response = await api.get(`/courses/${id}/`);
        console.log("📚 Course response:", response.data);
        return response;
      } catch (error) {
        console.error(`❌ Error fetching course ${id}:`);
        return handleApiError(error);
      }
    },
    
    create: async (courseData) => {
      console.log("➕ Creating course with data:", courseData);
      try {
        // IMPORTANT: Ne pas envoyer 'status' car il n'existe pas dans le modèle Course
        const formattedData = {
          course_code: courseData.course_code,
          title: courseData.title,
          description: courseData.description,
          credits: parseInt(courseData.credits) || 3,
          department: courseData.department,
          semester: courseData.semester,
          academic_year: parseInt(courseData.academic_year) || new Date().getFullYear(),
          teacher: courseData.teacher ? parseInt(courseData.teacher) : null,
          max_students: parseInt(courseData.max_students) || 30,
          schedule: courseData.schedule || ''
        };
        
        console.log("📤 Sending formatted course data:", formattedData);
        const response = await api.post('/courses/', formattedData);
        console.log("✅ Course created:", response.data);
        return response;
      } catch (error) {
        console.error("❌ Error creating course:");
        console.error("📋 Details:", error.response?.data);
        return handleApiError(error);
      }
    },
    
    update: async (id, courseData) => {
      console.log(`✏️ Updating course ${id} with data:`, courseData);
      try {
        const formattedData = {};
        
        // IMPORTANT: Ne pas envoyer 'status'
        if (courseData.course_code !== undefined) formattedData.course_code = courseData.course_code;
        if (courseData.title !== undefined) formattedData.title = courseData.title;
        if (courseData.description !== undefined) formattedData.description = courseData.description;
        if (courseData.credits !== undefined) formattedData.credits = parseInt(courseData.credits) || 3;
        if (courseData.department !== undefined) formattedData.department = courseData.department;
        if (courseData.semester !== undefined) formattedData.semester = courseData.semester;
        if (courseData.academic_year !== undefined) formattedData.academic_year = parseInt(courseData.academic_year) || new Date().getFullYear();
        if (courseData.teacher !== undefined) formattedData.teacher = courseData.teacher ? parseInt(courseData.teacher) : null;
        if (courseData.max_students !== undefined) formattedData.max_students = parseInt(courseData.max_students) || 30;
        if (courseData.schedule !== undefined) formattedData.schedule = courseData.schedule || '';
        
        console.log("📤 Sending formatted update data:", formattedData);
        const response = await api.put(`/courses/${id}/`, formattedData);
        console.log("✅ Course updated:", response.data);
        return response;
      } catch (error) {
        console.error(`❌ Error updating course ${id}:`);
        console.error("📋 Details:", error.response?.data);
        return handleApiError(error);
      }
    },
    
    delete: async (id) => {
      console.log(`🗑️ Deleting course ${id}`);
      try {
        const response = await api.delete(`/courses/${id}/`);
        console.log("✅ Course deleted");
        return response;
      } catch (error) {
        console.error(`❌ Error deleting course ${id}:`);
        return handleApiError(error);
      }
    }
  };
  
  // Services des inscriptions
  export const enrollmentService = {
    getAll: async (params = {}) => {
      console.log("👥 Fetching enrollments with params:", params);
      try {
        const response = await api.get('/courses/enrollments/', { params });
        console.log("👥 Enrollments response:", response.data);
        return response;
      } catch (error) {
        console.error("❌ Error fetching enrollments:");
        return handleApiError(error);
      }
    },
    
    create: async (enrollmentData) => {
      console.log("➕ Creating enrollment with data:", enrollmentData);
      try {
        const formattedData = {
          student: parseInt(enrollmentData.student),
          course: parseInt(enrollmentData.course),
          grade: enrollmentData.grade || '',
          status: enrollmentData.status || 'enrolled'
        };
        
        console.log("📤 Sending enrollment data:", formattedData);
        const response = await api.post('/courses/enrollments/', formattedData);
        console.log("✅ Enrollment created:", response.data);
        return response;
      } catch (error) {
        console.error("❌ Error creating enrollment:");
        console.error("📋 Details:", error.response?.data);
        return handleApiError(error);
      }
    },
    
    delete: async (id) => {
      console.log(`🗑️ Deleting enrollment ${id}`);
      try {
        const response = await api.delete(`/courses/enrollments/${id}/`);
        console.log("✅ Enrollment deleted");
        return response;
      } catch (error) {
        console.error(`❌ Error deleting enrollment ${id}:`);
        return handleApiError(error);
      }
    }
  };

// Services des examens - VERSION COMPLÈTE ET CORRIGÉE
export const examService = {
    // ============ EXAMENS ============
    getAll: async (params = {}) => {
      console.log("📝 Fetching exams with params:", params);
      try {
        const response = await api.get('/exams/exams/', { params });
        console.log("📝 Exams response:", response.data);
        return response;
      } catch (error) {
        console.error("❌ Error fetching exams:");
        return handleApiError(error);
      }
    },
    
    getById: async (id) => {
      console.log(`📝 Fetching exam ${id}`);
      try {
        const response = await api.get(`/exams/exams/${id}/`);
        console.log("📝 Exam details:", response.data);
        return response;
      } catch (error) {
        console.error(`❌ Error fetching exam ${id}:`);
        return handleApiError(error);
      }
    },
    
    create: async (examData) => {
      console.log("➕ Creating exam:", examData);
      try {
        const formattedData = {
          course: parseInt(examData.course),
          exam_type: examData.exam_type,
          title: examData.title,
          description: examData.description || '',
          date: examData.date,
          time: examData.time,
          duration: examData.duration,
          location: examData.location,
          max_students: parseInt(examData.max_students) || 30,
          status: examData.status || 'upcoming'
        };
        
        console.log("📤 Sending exam data:", formattedData);
        const response = await api.post('/exams/exams/', formattedData);
        console.log("✅ Exam created:", response.data);
        return response;
      } catch (error) {
        console.error("❌ Error creating exam:");
        console.error("📋 Details:", error.response?.data);
        return handleApiError(error);
      }
    },
    
    update: async (id, examData) => {
      console.log(`✏️ Updating exam ${id}:`, examData);
      try {
        const formattedData = {};
        
        if (examData.course !== undefined) {
          formattedData.course = parseInt(examData.course);
        }
        if (examData.exam_type !== undefined) {
          formattedData.exam_type = examData.exam_type;
        }
        if (examData.title !== undefined) {
          formattedData.title = examData.title;
        }
        if (examData.description !== undefined) {
          formattedData.description = examData.description || '';
        }
        if (examData.date !== undefined) {
          formattedData.date = examData.date;
        }
        if (examData.time !== undefined) {
          formattedData.time = examData.time;
        }
        if (examData.duration !== undefined) {
          formattedData.duration = examData.duration;
        }
        if (examData.location !== undefined) {
          formattedData.location = examData.location;
        }
        if (examData.max_students !== undefined) {
          formattedData.max_students = parseInt(examData.max_students);
        }
        if (examData.status !== undefined) {
          formattedData.status = examData.status;
        }
        
        console.log("📤 Sending update data:", formattedData);
        const response = await api.put(`/exams/exams/${id}/`, formattedData);
        console.log("✅ Exam updated:", response.data);
        return response;
      } catch (error) {
        console.error(`❌ Error updating exam ${id}:`);
        console.error("📋 Details:", error.response?.data);
        return handleApiError(error);
      }
    },
    
    delete: async (id) => {
      console.log(`🗑️ Deleting exam ${id}`);
      try {
        const response = await api.delete(`/exams/exams/${id}/`);
        console.log("✅ Exam deleted");
        return response;
      } catch (error) {
        console.error(`❌ Error deleting exam ${id}:`);
        return handleApiError(error);
      }
    },
    
    // ============ STATISTIQUES ============
    getStatistics: async () => {
      console.log("📊 Fetching exam statistics");
      try {
        const response = await api.get('/exams/statistics/');
        console.log("📊 Statistics:", response.data);
        return response;
      } catch (error) {
        console.error("❌ Error fetching statistics:");
        return handleApiError(error);
      }
    },
    
    getUpcoming: async (limit = 5) => {
      console.log(`📅 Fetching upcoming exams (limit: ${limit})`);
      try {
        const response = await api.get('/exams/upcoming/', {
          params: { limit }
        });
        console.log("📅 Upcoming exams:", response.data);
        return response;
      } catch (error) {
        console.error("❌ Error fetching upcoming exams:");
        return handleApiError(error);
      }
    },
    
    // ============ NOTES ============
    getGrades: async (params = {}) => {
      console.log("📊 Fetching grades with params:", params);
      try {
        const response = await api.get('/exams/grades/', { params });
        console.log("📊 Grades response:", response.data);
        return response;
      } catch (error) {
        console.error("❌ Error fetching grades:");
        return handleApiError(error);
      }
    },
    
    getGradeById: async (id) => {
      console.log(`📊 Fetching grade ${id}`);
      try {
        const response = await api.get(`/exams/grades/${id}/`);
        console.log("📊 Grade details:", response.data);
        return response;
      } catch (error) {
        console.error(`❌ Error fetching grade ${id}:`);
        return handleApiError(error);
      }
    },
    
    createGrade: async (gradeData) => {
      console.log("➕ Creating grade:", gradeData);
      try {
        const formattedData = {
          student: parseInt(gradeData.student),
          exam: parseInt(gradeData.exam),
          score: parseFloat(gradeData.score),
          comments: gradeData.comments || ''
        };
        
        console.log("📤 Sending grade data:", formattedData);
        const response = await api.post('/exams/grades/', formattedData);
        console.log("✅ Grade created:", response.data);
        return response;
      } catch (error) {
        console.error("❌ Error creating grade:");
        console.error("📋 Details:", error.response?.data);
        return handleApiError(error);
      }
    },
    
    updateGrade: async (id, gradeData) => {
      console.log(`✏️ Updating grade ${id}:`, gradeData);
      try {
        const formattedData = {};
        
        if (gradeData.score !== undefined) {
          formattedData.score = parseFloat(gradeData.score);
        }
        if (gradeData.comments !== undefined) {
          formattedData.comments = gradeData.comments || '';
        }
        
        console.log("📤 Sending grade update:", formattedData);
        const response = await api.put(`/exams/grades/${id}/`, formattedData);
        console.log("✅ Grade updated:", response.data);
        return response;
      } catch (error) {
        console.error(`❌ Error updating grade ${id}:`);
        return handleApiError(error);
      }
    },
    
    deleteGrade: async (id) => {
      console.log(`🗑️ Deleting grade ${id}`);
      try {
        const response = await api.delete(`/exams/grades/${id}/`);
        console.log("✅ Grade deleted");
        return response;
      } catch (error) {
        console.error(`❌ Error deleting grade ${id}:`);
        return handleApiError(error);
      }
    },
    
    bulkCreateGrades: async (examId, grades) => {
      console.log(`➕ Bulk creating grades for exam ${examId}:`, grades);
      try {
        const response = await api.post('/exams/grades/bulk/', {
          exam_id: examId,
          grades: grades
        });
        console.log("✅ Grades created in bulk:", response.data);
        return response;
      } catch (error) {
        console.error("❌ Error bulk creating grades:");
        return handleApiError(error);
      }
    },
    
    getGradesByStudent: async (studentId) => {
      console.log(`📊 Fetching grades for student ${studentId}`);
      try {
        const response = await api.get('/exams/grades/', {
          params: { student: studentId }
        });
        console.log("📊 Student grades:", response.data);
        return response;
      } catch (error) {
        console.error(`❌ Error fetching grades for student ${studentId}:`);
        return handleApiError(error);
      }
    },
    
    getGradesByExam: async (examId) => {
      console.log(`📊 Fetching grades for exam ${examId}`);
      try {
        const response = await api.get('/exams/grades/', {
          params: { exam: examId }
        });
        console.log("📊 Exam grades:", response.data);
        return response;
      } catch (error) {
        console.error(`❌ Error fetching grades for exam ${examId}:`);
        return handleApiError(error);
      }
    }
  };

// Services des notes - VERSION CORRIGÉE
export const gradeService = {
    // ============ NOTES ============
    getAll: async (params = {}) => {
      console.log("📊 Fetching grades...");
      try {
        const response = await api.get('/grades/', { params });
        console.log("✅ Grades fetched:", response.data);
        
        // Votre backend retourne { success: true, count: X, results: [...] }
        // mais vous essayez d'accéder à response.data.data?.results
        if (response.data?.success === true) {
          return response.data; // Retourne { success: true, count, results }
        } else if (response.data?.results) {
          // Si la structure est différente
          return response.data;
        } else {
          // Structure alternative
          return {
            success: true,
            count: response.data?.length || 0,
            results: response.data || []
          };
        }
      } catch (error) {
        console.error("❌ Error fetching grades:", error);
        // Retourne une structure cohérente même en cas d'erreur
        return {
          success: false,
          error: 'Erreur lors du chargement des notes',
          count: 0,
          results: []
        };
      }
    },
    
    getById: async (id) => {
      console.log(`📊 Fetching grade ${id}`);
      try {
        const response = await api.get(`/grades/${id}/`);
        console.log("✅ Grade details:", response.data);
        return response.data;
      } catch (error) {
        console.error(`❌ Error fetching grade ${id}:`, error);
        throw error;
      }
    },
    
    create: async (gradeData) => {
      console.log("➕ Creating grade:", gradeData);
      try {
        // Validation simple côté client
        if (!gradeData.student || isNaN(parseInt(gradeData.student))) {
          throw new Error("L'étudiant est requis");
        }
        
        if (!gradeData.course || isNaN(parseInt(gradeData.course))) {
          throw new Error("Le cours est requis");
        }
        
        if (!gradeData.score || isNaN(parseFloat(gradeData.score))) {
          throw new Error("La note est requise");
        }
        
        const score = parseFloat(gradeData.score);
        if (score < 0 || score > 20) {
          throw new Error("La note doit être entre 0 et 20");
        }
        
        // Préparer les données
        const formattedData = {
          student: parseInt(gradeData.student),
          course: parseInt(gradeData.course),
          score: parseFloat(gradeData.score),
          semester: gradeData.semester || 'fall',
          academic_year: parseInt(gradeData.academic_year) || new Date().getFullYear(),
          comment: gradeData.comment || ''
        };
        
        console.log("📤 Sending grade data:", formattedData);
        
        const response = await api.post('/grades/', formattedData);
        console.log("✅ Grade created:", response.data);
        
        // Vérifier le format de réponse
        if (response.data?.success === false) {
          const error = new Error(response.data.error || 'Erreur lors de la création');
          error.response = { data: response.data };
          throw error;
        }
        
        return response.data;
        
      } catch (error) {
        console.error("❌ Error creating grade:");
        
        // Si c'est une erreur de validation côté client
        if (error.message && (
            error.message.includes("L'étudiant") || 
            error.message.includes("Le cours") || 
            error.message.includes("La note") ||
            error.message.includes("La note doit être entre"))) {
          throw {
            response: {
              data: {
                success: false,
                error: 'Validation échouée',
                detail: error.message
              }
            }
          };
        }
        
        // Sinon, propager l'erreur telle quelle
        throw error;
      }
    },
    
    update: async (id, gradeData) => {
        console.log(`✏️ Updating grade ${id}:`, gradeData);
        try {
          const formattedData = {};
          
          // IMPORTANT: En mode édition, ne PAS envoyer student et course
          // Ces champs doivent rester inchangés
          // On envoie seulement les champs qui peuvent être modifiés
          
          if (gradeData.score !== undefined) {
            const score = parseFloat(gradeData.score);
            if (score < 0 || score > 20) {
              throw new Error("La note doit être entre 0 et 20");
            }
            formattedData.score = score;
          }
          
          if (gradeData.semester !== undefined) {
            formattedData.semester = gradeData.semester;
          }
          
          if (gradeData.academic_year !== undefined) {
            formattedData.academic_year = parseInt(gradeData.academic_year);
          }
          
          if (gradeData.comment !== undefined) {
            formattedData.comment = gradeData.comment;
          }
          
          // NE PAS INCLURE student et course en mode édition
          // Ces champs doivent rester inchangés
          
          console.log("📤 Sending update data (student/course excluded):", formattedData);
          const response = await api.put(`/grades/${id}/`, formattedData);
          console.log("✅ Grade updated:", response.data);
          
          if (response.data?.success === false) {
            const error = new Error(response.data.error || 'Erreur lors de la mise à jour');
            error.response = { data: response.data };
            throw error;
          }
          
          return response.data;
          
        } catch (error) {
          console.error(`❌ Error updating grade ${id}:`, error);
          throw error;
        }
      },
    
    delete: async (id) => {
      console.log(`🗑️ Deleting grade ${id}`);
      try {
        const response = await api.delete(`/grades/${id}/`);
        console.log("✅ Grade deleted");
        
        if (response.data?.success === false) {
          const error = new Error(response.data.error || 'Erreur lors de la suppression');
          error.response = { data: response.data };
          throw error;
        }
        
        return response.data;
      } catch (error) {
        console.error(`❌ Error deleting grade ${id}:`, error);
        throw error;
      }
    },
    
    // ============ NOTES PAR ÉTUDIANT ============
    getByStudent: async (studentId) => {
      console.log(`📊 Fetching grades for student ${studentId}`);
      try {
        const response = await api.get(`/grades/student/${studentId}/`);
        console.log("✅ Student grades fetched:", response.data);
        return response.data;
      } catch (error) {
        console.error(`❌ Error fetching grades for student ${studentId}:`, error);
        throw error;
      }
    },
    
    // ============ NOTES PAR COURS ============
    getByCourse: async (courseId) => {
      console.log(`📊 Fetching grades for course ${courseId}`);
      try {
        const response = await api.get(`/grades/course/${courseId}/`);
        console.log("✅ Course grades fetched:", response.data);
        return response.data;
      } catch (error) {
        console.error(`❌ Error fetching grades for course ${courseId}:`, error);
        throw error;
      }
    },
    
    // ============ STATISTIQUES ============
    getStatistics: async () => {
      console.log("📈 Fetching grade statistics");
      try {
        const response = await api.get('/grades/statistics/');
        console.log("✅ Statistics fetched:", response.data);
        
        // Votre backend retourne { success: true, data: {...} }
        if (response.data?.success === true) {
          return response.data;
        } else {
          return {
            success: true,
            data: response.data || {}
          };
        }
      } catch (error) {
        console.error("❌ Error fetching statistics:", error);
        return {
          success: false,
          error: 'Erreur lors du chargement des statistiques',
          data: {}
        };
      }
    },
    
    getSummary: async () => {
      console.log("📋 Fetching grade summary");
      try {
        const response = await api.get('/grades/summary/');
        console.log("✅ Summary fetched:", response.data);
        return response.data;
      } catch (error) {
        console.error("❌ Error fetching summary:", error);
        throw error;
      }
    },
    
    // ============ CRÉATION EN MASSE ============
    bulkCreate: async (grades) => {
      console.log("➕ Bulk creating grades:", grades.length);
      try {
        const formattedGrades = grades.map(grade => ({
          student: parseInt(grade.student),
          course: parseInt(grade.course),
          score: parseFloat(grade.score),
          semester: grade.semester || 'fall',
          academic_year: parseInt(grade.academic_year) || new Date().getFullYear(),
          comment: grade.comment || ''
        }));
        
        const response = await api.post('/grades/bulk/', { grades: formattedGrades });
        console.log("✅ Bulk creation successful:", response.data);
        
        if (response.data?.success === false) {
          const error = new Error(response.data.error || 'Erreur lors de la création en masse');
          error.response = { data: response.data };
          throw error;
        }
        
        return response.data;
      } catch (error) {
        console.error("❌ Error bulk creating grades:", error);
        throw error;
      }
    },
    
    // ============ UTILITAIRES ============
    validateGradeData: (gradeData) => {
      const errors = [];
      
      if (!gradeData.student || isNaN(parseInt(gradeData.student))) {
        errors.push("L'étudiant est requis");
      }
      
      if (!gradeData.course || isNaN(parseInt(gradeData.course))) {
        errors.push("Le cours est requis");
      }
      
      if (!gradeData.score || isNaN(parseFloat(gradeData.score))) {
        errors.push("La note est requise");
      } else {
        const score = parseFloat(gradeData.score);
        if (score < 0 || score > 20) {
          errors.push("La note doit être entre 0 et 20");
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    }
  };

// Services financiers - VERSION COMPLÈTEMENT CORRIGÉE
export const financeService = {
    // ============ TRANSACTIONS ============
    getTransactions: async (params = {}) => {
      console.log("💰 Fetching transactions with params:", params);
      try {
        const response = await api.get('/finance/transactions/', { params });
        console.log("💰 Transactions API Response:", {
          status: response.status,
          data: response.data,
          success: response.data?.success,
          hasResults: Array.isArray(response.data?.results),
          hasData: Array.isArray(response.data?.data),
          count: response.data?.count
        });
        
        if (response.data && response.data.success === false) {
          throw { response: { data: response.data } };
        }
        
        return response;
      } catch (error) {
        console.error("❌ Error fetching transactions:");
        return handleApiError(error);
      }
    },
    
    getTransactionById: async (id) => {
      console.log(`💰 Fetching transaction ${id}`);
      try {
        const response = await api.get(`/finance/transactions/${id}/`);
        console.log("💰 Transaction response:", response.data);
        return response;
      } catch (error) {
        console.error(`❌ Error fetching transaction ${id}:`);
        return handleApiError(error);
      }
    },
    
    createTransaction: async (transactionData) => {
      console.log("💳 Creating transaction:", transactionData);
      try {
        const formattedData = {
          ...transactionData,
          amount: parseFloat(transactionData.amount) || 0,
          student: transactionData.student ? parseInt(transactionData.student) : null,
          teacher: transactionData.teacher ? parseInt(transactionData.teacher) : null,
          due_date: transactionData.due_date || new Date().toISOString().split('T')[0],
          paid_amount: transactionData.paid_amount ? parseFloat(transactionData.paid_amount) : 0
        };
        
        if (transactionData.transaction_type === 'scholarship' || 
            transactionData.transaction_type === 'refund') {
          formattedData.amount = -Math.abs(formattedData.amount);
        }
        
        console.log("📤 Sending formatted transaction data:", formattedData);
        const response = await api.post('/finance/transactions/', formattedData);
        console.log("✅ Transaction created:", response.data);
        return response;
      } catch (error) {
        console.error("❌ Error creating transaction:");
        console.error("📋 Details:", error.response?.data);
        return handleApiError(error);
      }
    },
    
    // Dans api.js, dans financeService, corriger updateTransaction:

updateTransaction: async (id, transactionData) => {
    console.log(`✏️ Updating transaction ${id}:`, transactionData);
    try {
      const formattedData = {};
      
      // Ajouter seulement les champs fournis
      if (transactionData.amount !== undefined) {
        formattedData.amount = Math.abs(parseFloat(transactionData.amount));
        if (transactionData.transaction_type === 'scholarship' || 
            transactionData.transaction_type === 'refund') {
          formattedData.amount = -Math.abs(formattedData.amount);
        }
      }
      if (transactionData.student !== undefined) {
        formattedData.student = transactionData.student ? parseInt(transactionData.student) : null;
      }
      if (transactionData.teacher !== undefined) {
        formattedData.teacher = transactionData.teacher ? parseInt(transactionData.teacher) : null;
      }
      if (transactionData.transaction_type !== undefined) {
        formattedData.transaction_type = transactionData.transaction_type;
      }
      if (transactionData.status !== undefined) {
        formattedData.status = transactionData.status;
      }
      if (transactionData.method !== undefined) {
        formattedData.method = transactionData.method;
      }
      if (transactionData.paid_amount !== undefined) {
        formattedData.paid_amount = parseFloat(transactionData.paid_amount);
      }
      if (transactionData.description !== undefined) {
        formattedData.description = transactionData.description;
      }
      if (transactionData.date !== undefined) {
        formattedData.date = transactionData.date;
      }
      if (transactionData.due_date !== undefined) {
        formattedData.due_date = transactionData.due_date;
      }
      
      console.log("📤 Sending PUT data for transaction:", formattedData);
      
      // Essayer PUT d'abord, puis PATCH en fallback
      try {
        const response = await api.put(`/finance/transactions/${id}/`, formattedData);
        console.log("✅ Transaction updated with PUT:", response.data);
        return response;
      } catch (putError) {
        console.log("⚠️ PUT failed, trying PATCH...");
        // Si PUT échoue, essayer PATCH avec les mêmes données
        const response = await api.patch(`/finance/transactions/${id}/`, formattedData);
        console.log("✅ Transaction updated with PATCH:", response.data);
        return response;
      }
    } catch (error) {
      console.error(`❌ Error updating transaction ${id}:`);
      console.error("📋 Details:", error.response?.data);
      return handleApiError(error);
    }
  },
    
    deleteTransaction: async (id) => {
      console.log(`🗑️ Deleting transaction ${id}`);
      try {
        const response = await api.delete(`/finance/transactions/${id}/`);
        console.log("✅ Transaction deleted");
        return response;
      } catch (error) {
        console.error(`❌ Error deleting transaction ${id}:`);
        return handleApiError(error);
      }
    },
  
    // ============ BUDGETS - VERSION CORRIGÉE ============
    getBudgets: async (params = {}) => {
      console.log("📊 Fetching budgets with params:", params);
      try {
        const response = await api.get('/finance/budgets/', { params });
        console.log("📊 Budgets GET Response - Status:", response.status);
        console.log("📊 Response structure:", {
          hasResults: Array.isArray(response.data?.results),
          hasData: Array.isArray(response.data?.data),
          isArray: Array.isArray(response.data),
          keys: Object.keys(response.data || {})
        });
        
        return response;
      } catch (error) {
        console.error("❌ Error fetching budgets:");
        return handleApiError(error);
      }
    },
    
    getBudgetById: async (id) => {
      console.log(`📊 Fetching budget ${id}`);
      try {
        const response = await api.get(`/finance/budgets/${id}/`);
        console.log(`📊 Budget ${id} details:`, response.data);
        return response;
      } catch (error) {
        console.error(`❌ Error fetching budget ${id}:`);
        return handleApiError(error);
      }
    },
    
    createBudget: async (budgetData) => {
      console.log("📈 Creating budget:", budgetData);
      try {
        const formattedData = {
          department: budgetData.department || 'engineering',
          budget_type: budgetData.budget_type || 'operational',
          year: parseInt(budgetData.year) || new Date().getFullYear(),
          allocated_amount: parseFloat(budgetData.allocated_amount) || 0,
          spent_amount: parseFloat(budgetData.spent_amount || 0),
          committed_amount: parseFloat(budgetData.committed_amount || 0),
          description: budgetData.description || '',
          is_active: budgetData.is_active !== undefined ? Boolean(budgetData.is_active) : true
        };
        
        console.log("📤 Sending budget creation data:", formattedData);
        const response = await api.post('/finance/budgets/', formattedData);
        console.log("✅ Budget created:", response.data);
        return response;
      } catch (error) {
        console.error("❌ Error creating budget:");
        console.error("📋 Error details:", error.response?.data);
        console.error("📋 Error status:", error.response?.status);
        
        if (error.response?.data) {
          console.error("📋 Django validation errors:");
          if (typeof error.response.data === 'object') {
            Object.keys(error.response.data).forEach(key => {
              console.error(`  ${key}:`, error.response.data[key]);
            });
          }
        }
        
        return handleApiError(error);
      }
    },
    
    updateBudget: async (id, budgetData) => {
      console.log(`✏️ Updating budget ${id}:`, budgetData);
      try {
        // Essayer d'abord de récupérer le budget existant pour PUT
        console.log(`📥 Fetching current budget ${id}...`);
        const currentResponse = await api.get(`/finance/budgets/${id}/`);
        const currentBudget = currentResponse.data;
        
        // Fusionner les données
        const updatedData = {
          ...currentBudget,
          ...budgetData
        };
        
        // Convertir les types
        if (updatedData.allocated_amount !== undefined) {
          updatedData.allocated_amount = parseFloat(updatedData.allocated_amount);
        }
        if (updatedData.spent_amount !== undefined) {
          updatedData.spent_amount = parseFloat(updatedData.spent_amount);
        }
        if (updatedData.committed_amount !== undefined) {
          updatedData.committed_amount = parseFloat(updatedData.committed_amount);
        }
        if (updatedData.year !== undefined) {
          updatedData.year = parseInt(updatedData.year);
        }
        
        // S'assurer des champs requis
        if (!updatedData.department) updatedData.department = 'engineering';
        if (!updatedData.budget_type) updatedData.budget_type = 'operational';
        if (!updatedData.year) updatedData.year = new Date().getFullYear();
        if (updatedData.allocated_amount === undefined) updatedData.allocated_amount = 0;
        
        console.log("📤 Sending PUT data:", updatedData);
        
        // Essayer PUT d'abord (mise à jour complète)
        const response = await api.put(`/finance/budgets/${id}/`, updatedData);
        console.log("✅ Budget updated with PUT:", response.data);
        return response;
        
      } catch (putError) {
        console.error(`❌ PUT failed for budget ${id}:`, putError);
        console.error("📋 PUT error details:", putError.response?.data);
        
        // Fallback: Essayer PATCH pour mise à jour partielle
        try {
          console.log("🔄 Trying PATCH as fallback...");
          return await financeService.patchBudget(id, budgetData);
        } catch (patchError) {
          console.error(`❌ Both PUT and PATCH failed for budget ${id}`);
          return handleApiError(putError);
        }
      }
    },
    
    patchBudget: async (id, budgetData) => {
      console.log(`🔧 Patching budget ${id}:`, budgetData);
      try {
        const formattedData = {};
        
        // Ajouter seulement les champs fournis avec conversion de type
        if (budgetData.allocated_amount !== undefined) {
          formattedData.allocated_amount = parseFloat(budgetData.allocated_amount);
        }
        if (budgetData.spent_amount !== undefined) {
          formattedData.spent_amount = parseFloat(budgetData.spent_amount);
        }
        if (budgetData.committed_amount !== undefined) {
          formattedData.committed_amount = parseFloat(budgetData.committed_amount);
        }
        if (budgetData.year !== undefined) {
          formattedData.year = parseInt(budgetData.year);
        }
        if (budgetData.department !== undefined) {
          formattedData.department = budgetData.department;
        }
        if (budgetData.budget_type !== undefined) {
          formattedData.budget_type = budgetData.budget_type;
        }
        if (budgetData.description !== undefined) {
          formattedData.description = String(budgetData.description);
        }
        if (budgetData.is_active !== undefined) {
          formattedData.is_active = Boolean(budgetData.is_active);
        }
        
        console.log("📤 Sending PATCH data:", formattedData);
        console.log(`📤 URL: /finance/budgets/${id}/`);
        
        const response = await api.patch(`/finance/budgets/${id}/`, formattedData);
        console.log("✅ Budget patched:", response.data);
        return response;
      } catch (error) {
        console.error(`❌ Error patching budget ${id}:`);
        console.error("📋 Full error:", error);
        
        if (error.response) {
          console.error("📋 Response status:", error.response.status);
          console.error("📋 Response headers:", error.response.headers);
          console.error("📋 Response data:", error.response.data);
          
          if (error.response.data && typeof error.response.data === 'object') {
            console.error("📋 Django error details:");
            Object.keys(error.response.data).forEach(key => {
              const value = error.response.data[key];
              if (Array.isArray(value)) {
                console.error(`  ${key}:`, value.join(', '));
              } else {
                console.error(`  ${key}:`, value);
              }
            });
          }
        }
        
        return handleApiError(error);
      }
    },
    
    deleteBudget: async (id) => {
      console.log(`🗑️ Deleting budget ${id}`);
      try {
        const response = await api.delete(`/finance/budgets/${id}/`);
        console.log("✅ Budget deleted");
        return response;
      } catch (error) {
        console.error(`❌ Error deleting budget ${id}:`);
        console.error("📋 Error details:", error.response?.data);
        return handleApiError(error);
      }
    },
    
    // ============ STATISTIQUES ============
    getStatistics: async () => {
      console.log("📈 Fetching finance statistics");
      try {
        const response = await api.get('/finance/statistics/');
        console.log("📈 Statistics response:", {
          success: response.data?.success,
          data: response.data?.data ? 'present' : 'missing',
          keys: Object.keys(response.data || {})
        });
        return response;
      } catch (error) {
        console.error("❌ Error fetching statistics:");
        return handleApiError(error);
      }
    },
    
    // ============ UTILITAIRES ============
    validateBudgetData: (budgetData) => {
      const errors = [];
      
      if (budgetData.department && !budgetData.department.trim()) {
        errors.push("Le département est requis");
      }
      
      if (budgetData.allocated_amount !== undefined) {
        const amount = parseFloat(budgetData.allocated_amount);
        if (isNaN(amount) || amount < 0) {
          errors.push("Le montant alloué doit être un nombre positif");
        }
      }
      
      if (budgetData.spent_amount !== undefined) {
        const amount = parseFloat(budgetData.spent_amount);
        if (isNaN(amount) || amount < 0) {
          errors.push("Le montant dépensé doit être un nombre positif");
        }
      }
      
      if (budgetData.committed_amount !== undefined) {
        const amount = parseFloat(budgetData.committed_amount);
        if (isNaN(amount) || amount < 0) {
          errors.push("Le montant engagé doit être un nombre positif");
        }
      }
      
      if (budgetData.year !== undefined) {
        const year = parseInt(budgetData.year);
        if (isNaN(year) || year < 2000 || year > 2100) {
          errors.push("L'année doit être entre 2000 et 2100");
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    },
    
    formatBudgetForAPI: (budgetData) => {
      const formatted = {};
      
      if (budgetData.department !== undefined) {
        formatted.department = budgetData.department;
      }
      if (budgetData.budget_type !== undefined) {
        formatted.budget_type = budgetData.budget_type;
      }
      if (budgetData.year !== undefined) {
        formatted.year = parseInt(budgetData.year);
      }
      if (budgetData.allocated_amount !== undefined) {
        formatted.allocated_amount = parseFloat(budgetData.allocated_amount);
      }
      if (budgetData.spent_amount !== undefined) {
        formatted.spent_amount = parseFloat(budgetData.spent_amount);
      }
      if (budgetData.committed_amount !== undefined) {
        formatted.committed_amount = parseFloat(budgetData.committed_amount);
      }
      if (budgetData.description !== undefined) {
        formatted.description = String(budgetData.description);
      }
      if (budgetData.is_active !== undefined) {
        formatted.is_active = Boolean(budgetData.is_active);
      }
      
      return formatted;
    },
    
    // ============ TEST API ============
    testAPI: async () => {
      console.log("🧪 Testing finance API endpoints...");
      
      const results = {
        transactions: { success: false, message: '' },
        budgets: { success: false, message: '' },
        statistics: { success: false, message: '' }
      };
      
      try {
        // Test transactions
        try {
          const transRes = await api.get('/finance/transactions/?page_size=1');
          results.transactions = {
            success: true,
            message: `OK - ${transRes.data?.count || transRes.data?.length || 0} transactions`
          };
          console.log("✅ Transactions: OK");
        } catch (error) {
          results.transactions = {
            success: false,
            message: `Error: ${error.message}`
          };
          console.error("❌ Transactions:", error.message);
        }
        
        // Test budgets
        try {
          const budgetsRes = await api.get('/finance/budgets/?page_size=1');
          results.budgets = {
            success: true,
            message: `OK - ${budgetsRes.data?.count || budgetsRes.data?.length || 0} budgets`
          };
          console.log("✅ Budgets GET: OK");
          
          // Tester PATCH si on a un budget
          if (budgetsRes.data) {
            const budget = budgetsRes.data.results?.[0] || budgetsRes.data[0];
            if (budget) {
              try {
                const patchData = { description: `Test update ${Date.now()}` };
                const patchRes = await api.patch(`/finance/budgets/${budget.id}/`, patchData);
                console.log("✅ Budget PATCH: OK");
                
                // Restaurer la description originale
                await api.patch(`/finance/budgets/${budget.id}/`, { 
                  description: budget.description || '' 
                });
              } catch (patchError) {
                console.warn("⚠️ Budget PATCH failed (might be expected):", patchError.message);
              }
            }
          }
        } catch (error) {
          results.budgets = {
            success: false,
            message: `Error: ${error.message}`
          };
          console.error("❌ Budgets:", error.message);
        }
        
        // Test statistics
        try {
          await api.get('/finance/statistics/');
          results.statistics = {
            success: true,
            message: 'OK'
          };
          console.log("✅ Statistics: OK");
        } catch (error) {
          results.statistics = {
            success: false,
            message: `Error: ${error.message}`
          };
          console.error("❌ Statistics:", error.message);
        }
        
      } catch (error) {
        console.error("❌ Error in testAPI:", error);
      }
      
      console.log("📊 Test results:", results);
      return results;
    },
    
    // ============ EXPORT ============
    exportTransactions: async (format = 'csv') => {
      console.log(`📥 Exporting transactions as ${format}`);
      try {
        const response = await api.get(`/finance/export/transactions/?format=${format}`, {
          responseType: 'blob'
        });
        console.log("✅ Transactions exported");
        return response;
      } catch (error) {
        console.error("❌ Error exporting transactions:");
        return handleApiError(error);
      }
    },
    
    // ============ FONCTIONS SPÉCIALES ============
    updateBudgetAmounts: async (id, amounts) => {
      console.log(`💰 Updating budget ${id} amounts:`, amounts);
      try {
        const patchData = {};
        
        if (amounts.allocated !== undefined) {
          patchData.allocated_amount = parseFloat(amounts.allocated);
        }
        if (amounts.spent !== undefined) {
          patchData.spent_amount = parseFloat(amounts.spent);
        }
        if (amounts.committed !== undefined) {
          patchData.committed_amount = parseFloat(amounts.committed);
        }
        
        return await financeService.patchBudget(id, patchData);
      } catch (error) {
        console.error(`❌ Error updating budget amounts for ${id}:`);
        return handleApiError(error);
      }
    },
    
    toggleBudgetActive: async (id, isActive) => {
      console.log(`🔘 Toggling budget ${id} active to:`, isActive);
      try {
        return await financeService.patchBudget(id, { is_active: isActive });
      } catch (error) {
        console.error(`❌ Error toggling budget ${id} active status:`);
        return handleApiError(error);
      }
    }
  };
  
export default api;