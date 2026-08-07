// Prefer explicit env, otherwise build a base URL using current hostname
const getApiBaseUrl = () => {
  try {
    const envUrl = import.meta.env?.VITE_API_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
      return envUrl.trim();
    }
    return `${window.location.protocol}//${window.location.hostname}:3001/api`;
  } catch {
    return `${window.location.protocol}//${window.location.hostname}:3001/api`;
  }
};

const getSocketBaseUrl = () => {
  try {
    const envUrl = import.meta.env?.VITE_API_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
      return envUrl.trim().replace('/api', '');
    }
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  } catch {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }
};

export const API_BASE_URL = getApiBaseUrl();
export const SOCKET_BASE_URL = getSocketBaseUrl();

// Helper function to get full image URL
export const getImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  if (imageUrl.startsWith('/')) {
    const backendUrl = API_BASE_URL.replace('/api', '');
    return `${backendUrl}${imageUrl}`;
  }
  return imageUrl;
};

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
  const response = await fetch(url, defaultOptions);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  return response.json();
}

// ============= AUTH API =============
export const authApi = {
  login: async (email: string, name?: string) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
  },
};

// ============= QUIZ API =============
export const quizApi = {
  create: async (title: string, questions: unknown[], adminId: string) => {
    return apiCall('/quizzes/create', {
      method: 'POST',
      body: JSON.stringify({ title, questions, adminId }),
    });
  },
  getByCode: async (code: string) => apiCall(`/quizzes/code/${code}`),
  getById: async (id: string) => apiCall(`/quizzes/id/${id}`),
  getAll: async () => apiCall('/quizzes'),
};

// ============= PARTICIPANT API =============
export const participantApi = {
  join: async (
    quizCode: string,
    name: string,
    email: string,
    phoneNumber: string,
    college: string,
    branch: string,
    year: string
  ) => {
    return apiCall('/participants/join', {
      method: 'POST',
      body: JSON.stringify({ quizCode, name, email, phoneNumber, college, branch, year }),
    });
  },
  getById: async (id: string) => apiCall(`/participants/${id}`),
};

// ============= RESPONSE API =============
export const responseApi = {
  submit: async (participantId: string, questionId: string, selectedOptionId: string) => {
    return apiCall('/responses/submit', {
      method: 'POST',
      body: JSON.stringify({ participantId, questionId, selectedOptionId }),
    });
  },
  getByParticipant: async (participantId: string) => apiCall(`/responses/participant/${participantId}`),
};

// ============= RESULTS API =============
export const resultsApi = {
  get: async (quizId: string, participantId: string) => apiCall(`/results/${quizId}/${participantId}`),
};

// ============= LEADERBOARD API =============
export const leaderboardApi = {
  get: async (quizId: string) => apiCall(`/leaderboard/${quizId}`),
};

// ============= FEEDBACK API =============
export const feedbackApi = {
  submit: async (rating: number, comment: string) => {
    return apiCall('/feedback', {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
  },
};

// ============= IMAGE UPLOAD API =============
export const imageApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const url = `${API_BASE_URL}/upload/image`;
    const response = await fetch(url, { method: 'POST', body: formData });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }
    return response.json();
  },
};
