import api from './api';

export const studentService = {
  getAll: async () => {
    return await api.get('/students/');
  },

  getById: async (id) => {
    return await api.get(`/students/${id}/`);
  },

  create: async (studentData) => {
    return await api.post('/students/', studentData);
  },

  update: async (id, studentData) => {
    return await api.put(`/students/${id}/`, studentData);
  },

  delete: async (id) => {
    return await api.delete(`/students/${id}/`);
  },
};

export const teacherService = {
  getAll: async () => {
    return await api.get('/teachers/');
  },

  getById: async (id) => {
    return await api.get(`/teachers/${id}/`);
  },

  create: async (teacherData) => {
    return await api.post('/teachers/', teacherData);
  },

  update: async (id, teacherData) => {
    return await api.put(`/teachers/${id}/`, teacherData);
  },

  delete: async (id) => {
    return await api.delete(`/teachers/${id}/`);
  },
};

export const courseService = {
  getAll: async () => {
    return await api.get('/courses/');
  },

  getById: async (id) => {
    return await api.get(`/courses/${id}/`);
  },

  create: async (courseData) => {
    return await api.post('/courses/', courseData);
  },

  update: async (id, courseData) => {
    return await api.put(`/courses/${id}/`, courseData);
  },

  delete: async (id) => {
    return await api.delete(`/courses/${id}/`);
  },
};

export const enrollmentService = {
  getAll: async () => {
    return await api.get('/enrollments/');
  },

  create: async (enrollmentData) => {
    return await api.post('/enrollments/', enrollmentData);
  },

  delete: async (id) => {
    return await api.delete(`/enrollments/${id}/`);
  },
};

export const examService = {
  getAll: async () => {
    return await api.get('/exams/');
  },

  getById: async (id) => {
    return await api.get(`/exams/${id}/`);
  },

  create: async (examData) => {
    return await api.post('/exams/', examData);
  },

  update: async (id, examData) => {
    return await api.put(`/exams/${id}/`, examData);
  },

  delete: async (id) => {
    return await api.delete(`/exams/${id}/`);
  },
};

export const financeService = {
  getTransactions: async () => {
    return await api.get('/finance/transactions/');
  },

  createTransaction: async (transactionData) => {
    return await api.post('/finance/transactions/', transactionData);
  },

  updateTransaction: async (id, transactionData) => {
    return await api.put(`/finance/transactions/${id}/`, transactionData);
  },

  deleteTransaction: async (id) => {
    return await api.delete(`/finance/transactions/${id}/`);
  },

  getStatistics: async () => {
    return await api.get('/finance/statistics/');
  },
};