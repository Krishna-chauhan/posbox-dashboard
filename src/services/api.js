// API service for FastAPI backend integration

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
const PROJECT_NAME = process.env.REACT_APP_PROJECT_NAME || 'POSBOX';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.projectName = PROJECT_NAME;
  }

  // Get auth token from localStorage
  getAuthToken() {
    // First try to get from token key
    let token = localStorage.getItem('token');
    
    // If not found, try to get from user data
    if (!token) {
      try {
        const userData = localStorage.getItem(`${this.projectName.toLowerCase()}_current_user`);
        if (userData) {
          const user = JSON.parse(userData);
          token = user.token;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    console.log('Retrieved token:', token);
    return token;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem(`${this.projectName.toLowerCase()}_current_user`);
    window.location.href = '/user/login';
  }

  checkTokenExpiration() {
    const token = this.getAuthToken();
    if (!token) {
      this.logout();
      return false;
    }

    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp && payload.exp < currentTime) {
        console.log('Token expired, logging out...');
        this.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      this.logout();
      return false;
    }
  }

  // Set auth token in localStorage
  setAuthToken(token) {
    localStorage.setItem('token', token);
    console.log('Token stored:', token);
  }

  // Remove auth token
  removeAuthToken() {
    localStorage.removeItem('token');
    console.log('Token removed');
  }

  // Make authenticated requests
  async request(endpoint, options = {}) {
    // Check token expiration before making request
    if (!this.checkTokenExpiration()) {
      throw new Error('Token expired');
    }

    const token = this.getAuthToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`Making API request to: ${this.baseURL}${endpoint}`);
      console.log('Request config:', config);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Unauthorized access - token may be expired');
          this.logout();
          throw new Error('Unauthorized access');
        }
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: email,
        password: password
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Login failed');
    }

    const data = await response.json();
    this.setAuthToken(data.access_token);
    return data;
  }

  // Admin authentication methods
  async adminLogin(email, password) {
    const response = await fetch(`${this.baseURL}/api/admin/auth/login`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || 'Admin login failed');
    }

    const data = await response.json();
    this.setAuthToken(data.access_token || data.token);
    return data;
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.removeAuthToken();
    }
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Dashboard data methods
  async getDashboardData() {
    return this.request('/dashboard/stats');
  }

  // Legacy user methods - keeping for backward compatibility
  async getUsers() {
    return this.request('/users');
  }

  async getUserById(id) {
    return this.request(`/users/${id}`);
  }

  async updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin Dashboard API methods
  
  // Authentication Settings
  async getAuthSettings() {
    return this.request('/api/admin/auth/settings');
  }

  async updateAuthSettings(settings) {
    return this.request('/api/admin/auth/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getActiveSessions() {
    return this.request('/api/admin/auth/sessions');
  }

  async terminateSession(sessionId) {
    return this.request(`/api/admin/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // Elections Management
  async getElections(skip = 0, limit = 100) {
    const response = await this.request(`/api/admin/elections/?skip=${skip}&limit=${limit}`);
    // Handle the nested data structure from the API
    if (response && response.data && response.data.elections) {
      return response.data.elections;
    }
    return response;
  }

  async getElectionById(id) {
    return this.request(`/api/admin/elections/${id}`);
  }

  async createElection(electionData) {
    return this.request('/api/admin/elections/', {
      method: 'POST',
      body: JSON.stringify(electionData),
    });
  }

  async updateElection(id, electionData) {
    return this.request(`/api/admin/elections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(electionData),
    });
  }

  async deleteElection(id) {
    return this.request(`/api/admin/elections/${id}`, {
      method: 'DELETE',
    });
  }

  // Polling Stations Management
  async getPollingStations(skip = 0, limit = 100) {
    const response = await this.request(`/api/admin/polling-stations/?skip=${skip}&limit=${limit}`);
    // Handle the nested data structure from the API
    if (response && response.data && response.data.polling_stations) {
      return response.data.polling_stations;
    }
    return response;
  }

  // Voter Management
  async getElectionVoters(electionId, skip = 0, limit = 100) {
    const response = await this.request(`/api/admin/elections/${electionId}/voters?skip=${skip}&limit=${limit}`);
    console.log('Raw API response:', response);
    
    // Handle the nested data structure from the API
    if (response && response.data && response.data.voters) {
      console.log('Extracting voters from response.data.voters');
      return response.data.voters;
    } else if (response && response.voters) {
      console.log('Extracting voters from response.voters');
      return response.voters;
    } else if (Array.isArray(response)) {
      console.log('Response is already an array');
      return response;
    } else {
      console.log('Unexpected response structure:', response);
      return [];
    }
  }

  async uploadVoterExcel(file, electionId) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('election_id', electionId);

    const token = this.getAuthToken();
    
    const config = {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    };

    try {
      console.log(`Uploading voter Excel for election: ${electionId}`);
      
      const response = await fetch(`${this.baseURL}/api/admin/excel-upload/voters`, config);
      
      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Upload Error:', errorData);
        throw new Error(errorData.detail || errorData.message || `Upload failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Upload response data:', data);
      return data;
    } catch (error) {
      console.error('Voter upload failed:', error);
      throw error;
    }
  }

  async getPollingStationById(id) {
    return this.request(`/api/admin/polling-stations/${id}`);
  }

  async createPollingStation(stationData) {
    return this.request('/api/admin/polling-stations', {
      method: 'POST',
      body: JSON.stringify(stationData),
    });
  }

  async updatePollingStation(id, stationData) {
    return this.request(`/api/admin/polling-stations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(stationData),
    });
  }

  async deletePollingStation(id) {
    return this.request(`/api/admin/polling-stations/${id}`, {
      method: 'DELETE',
    });
  }

  // Users Management
  async getUsers(skip = 0, limit = 100) {
    const response = await this.request(`/api/admin/users/?skip=${skip}&limit=${limit}`);
    console.log('Raw users API response:', response);
    
    // Handle the nested data structure from the API
    if (response && response.data && response.data.users) {
      console.log('Extracting users from response.data.users');
      return response.data.users;
    } else if (response && response.users) {
      console.log('Extracting users from response.users');
      return response.users;
    } else if (Array.isArray(response)) {
      console.log('Response is already an array');
      return response;
    } else {
      console.log('Unexpected response structure:', response);
      return [];
    }
  }

  async getUserById(id) {
    return this.request(`/api/admin/users/${id}`);
  }

  async createUser(userData) {
    return this.request('/api/admin/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async createUserFormData(formData) {
    const token = this.getAuthToken();
    
    const config = {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    };

    try {
      console.log('Creating user with FormData');
      
      const response = await fetch(`${this.baseURL}/api/admin/users/`, config);
      
      console.log('Create user response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Create User Error:', errorData);
        throw new Error(errorData.detail || errorData.message || `Create user failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Create user response data:', data);
      return data;
    } catch (error) {
      console.error('Create user failed:', error);
      throw error;
    }
  }

  async updateUser(id, userData) {
    return this.request(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id) {
    return this.request(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async generateUserId() {
    return this.request('/api/admin/users/generate-user-id');
  }

  async activateUser(userId) {
    return this.request(`/api/admin/users/${userId}/activate`, {
      method: 'PATCH',
    });
  }

  async deactivateUser(userId) {
    return this.request(`/api/admin/users/${userId}/deactivate`, {
      method: 'PATCH',
    });
  }

  async getUsersByParent(parentId, skip = 0, limit = 100) {
    const response = await this.request(`/api/admin/users/by-parent/${parentId}?skip=${skip}&limit=${limit}`);
    console.log('Raw users by parent API response:', response);
    
    // Handle the nested data structure from the API
    if (response && response.data && response.data.users) {
      console.log('Extracting users from response.data.users');
      return response.data.users;
    } else if (response && response.users) {
      console.log('Extracting users from response.users');
      return response.users;
    } else if (Array.isArray(response)) {
      console.log('Response is already an array');
      return response;
    } else {
      console.log('Unexpected response structure:', response);
      return [];
    }
  }

  // Voter Status API methods
  async getVoterStatus() {
    return this.request('/api/admin/voter-status');
  }

  async getVoterStatusById(id) {
    return this.request(`/api/admin/voter-status/${id}`);
  }

  async updateVoterStatus(id, voterData) {
    return this.request(`/api/admin/voter-status/${id}`, {
      method: 'PUT',
      body: JSON.stringify(voterData),
    });
  }

  async createVoterStatus(voterData) {
    return this.request('/api/admin/voter-status', {
      method: 'POST',
      body: JSON.stringify(voterData),
    });
  }

  async deleteVoterStatus(id) {
    return this.request(`/api/admin/voter-status/${id}`, {
      method: 'DELETE',
    });
  }

  async getVoterStatusStats() {
    return this.request('/api/admin/voter-status/stats');
  }

  async searchVoterStatus(query) {
    return this.request(`/api/admin/voter-status/search?q=${encodeURIComponent(query)}`);
  }

  async exportVoterStatus(format = 'csv') {
    return this.request(`/api/admin/voter-status/export?format=${format}`);
  }

  // User Dashboard API methods
  async getActiveElections() {
    return this.request('/api/admin/elections/active');
  }

  async getElectionVoters(electionId) {
    return this.request(`/api/admin/elections/${electionId}/voters`);
  }

  async getElectionStats(electionId) {
    return this.request(`/api/admin/elections/${electionId}/stats`);
  }

  async getUserProfile() {
    return this.request('/api/user/profile');
  }

  async updateUserProfile(profileData) {
    return this.request('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getUserVoterStatus() {
    return this.request('/api/user/voter-status');
  }

  async findNearbyPollingStations(location) {
    return this.request(`/api/polling-stations/nearby?lat=${location.lat}&lng=${location.lng}`);
  }

  async searchPollingStations(query) {
    return this.request(`/api/polling-stations/search?q=${encodeURIComponent(query)}`);
  }
}

export default new ApiService();
