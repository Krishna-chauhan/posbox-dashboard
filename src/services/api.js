// API service for FastAPI backend integration

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:7070';
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

  async getElectionById(election_id) {
    return this.request(`/api/elections/${election_id}/details`);
  }

  async createElection(electionData) {
    return this.request('/api/admin/elections/', {
      method: 'POST',
      body: JSON.stringify(electionData),
    });
  }

  async updateElection(election_id, electionData) {
    return this.request(`/api/admin/elections/${election_id}`, {
      method: 'PUT',
      body: JSON.stringify(electionData),
    });
  }

  async deleteElection(election_id) {
    return this.request(`/api/admin/elections/${election_id}`, {
      method: 'DELETE',
    });
  }

  // Polling Stations Management
  async getPollingStations(skip = 0, limit = 100) {
    try {
      console.log('API Service - getPollingStations called with:', { skip, limit });
      const response = await this.request(`/api/admin/polling-stations/?skip=${skip}&limit=${limit}`);
      console.log('API Service - getPollingStations response:', response);
      
      // Handle the nested data structure from the API
      if (response && response.data && response.data.polling_stations) {
        console.log('API Service - returning polling_stations from data:', response.data.polling_stations);
        return response.data.polling_stations;
      }
      
      // Handle direct array response
      if (Array.isArray(response)) {
        console.log('API Service - returning direct array response:', response);
        return response;
      }
      
      // Handle response with data array
      if (response && response.data && Array.isArray(response.data)) {
        console.log('API Service - returning data array:', response.data);
        return response.data;
      }
      
      console.log('API Service - returning full response:', response);
      return response;
    } catch (error) {
      console.error('API Service - getPollingStations error:', error);
      throw error;
    }
  }

  async getPollingStationsByElection(electionId, skip = 0, limit = 100) {
    try {
      console.log('API Service - getPollingStationsByElection called with:', { electionId, skip, limit });
      const response = await this.request(`/api/admin/polling-stations/?election_id=${electionId}&skip=${skip}&limit=${limit}`);
      console.log('API Service - getPollingStationsByElection response:', response);
      
      // Handle the nested data structure from the API
      if (response && response.data && response.data.polling_stations) {
        console.log('API Service - returning polling_stations from data:', response.data.polling_stations);
        return response.data.polling_stations;
      }
      
      // Handle direct array response
      if (Array.isArray(response)) {
        console.log('API Service - returning direct array response:', response);
        return response;
      }
      
      // Handle response with data array
      if (response && response.data && Array.isArray(response.data)) {
        console.log('API Service - returning data array:', response.data);
        return response.data;
      }
      
      console.log('API Service - returning full response:', response);
      return response;
    } catch (error) {
      console.error('API Service - getPollingStationsByElection error:', error);
      throw error;
    }
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
    try {
      console.log('API Service - getPollingStationById called with:', id);
      const response = await this.request(`/api/admin/polling-stations/${id}`);
      console.log('API Service - getPollingStationById response:', response);
      
      // Handle the nested data structure from the API
      if (response && response.data) {
        console.log('API Service - returning data from response:', response.data);
        return response.data;
      }
      
      console.log('API Service - returning full response:', response);
      return response;
    } catch (error) {
      console.error('API Service - getPollingStationById error:', error);
      throw error;
    }
  }

  async createPollingStation(stationData) {
    try {
      console.log('API Service - createPollingStation called with:', stationData);
      console.log('API Service - stationData keys:', Object.keys(stationData));
      console.log('API Service - stationData JSON:', JSON.stringify(stationData, null, 2));
      console.log('API Service - Does stationData have id?', 'id' in stationData);
      console.log('API Service - Does stationData have election_id?', 'election_id' in stationData);
      
      const response = await this.request('/api/admin/polling-stations/', {
        method: 'POST',
        body: JSON.stringify(stationData),
      });
      console.log('API Service - createPollingStation response:', response);
      return response;
    } catch (error) {
      console.error('API Service - createPollingStation error:', error);
      throw error;
    }
  }

  async updatePollingStation(id, stationData) {
    try {
      console.log('API Service - updatePollingStation called with:', { id, stationData });
      const response = await this.request(`/api/admin/polling-stations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(stationData),
      });
      console.log('API Service - updatePollingStation response:', response);
      return response;
    } catch (error) {
      console.error('API Service - updatePollingStation error:', error);
      throw error;
    }
  }

  async deletePollingStation(id) {
    try {
      console.log('API Service - deletePollingStation called with:', id);
      const response = await this.request(`/api/admin/polling-stations/${id}`, {
        method: 'DELETE',
      });
      console.log('API Service - deletePollingStation response:', response);
      return response;
    } catch (error) {
      console.error('API Service - deletePollingStation error:', error);
      throw error;
    }
  }

  // Users Management
  async getUsers(skip = 0, limit = 100) {
    const response = await this.request(`/api/admin/users/?skip=${skip}&limit=${limit}`);
    console.log('Raw users API response:', response);
    
    // Handle the standard API response structure
    if (response && response.status_code === 200 && response.data) {
      console.log('Extracting users from response.data');
      return response.data;
    } else if (response && response.data && response.data.users) {
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
    const response = await this.request('/api/admin/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    // Handle the standard API response structure
    if (response && response.status_code === 200 || response.status_code === 201) {
      return response;
    } else {
      console.log('Create user response:', response);
      return response;
    }
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
      
      // Handle the standard API response structure
      if (data && (data.status_code === 200 || data.status_code === 201)) {
        return data;
      } else {
        return data;
      }
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

  async updateUserFormData(id, formData) {
    const token = this.getAuthToken();
    
    const config = {
      method: 'PUT',
      headers: {
        'accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    };

    try {
      console.log('Updating user with FormData for ID:', id);
      
      const response = await fetch(`${this.baseURL}/api/admin/users/${id}`, config);
      
      console.log('Update user response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Update User Error:', errorData);
        throw new Error(errorData.detail || errorData.message || `Update user failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Update user response data:', data);
      
      // Handle the standard API response structure
      if (data && (data.status_code === 200 || data.status_code === 201)) {
        return data;
      } else {
        return data;
      }
    } catch (error) {
      console.error('Update user failed:', error);
      throw error;
    }
  }

  async deleteUser(id) {
    return this.request(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async generateUserId() {
    const response = await this.request('/api/admin/users/generate-user-id');
    
    // Handle the standard API response structure
    if (response && response.status_code === 200 && response.data) {
      return response;
    } else {
      console.log('Generate user ID response:', response);
      return response;
    }
  }

  async activateUser(userId) {
    const response = await this.request(`/api/admin/users/${userId}/activate`, {
      method: 'PATCH',
    });
    
    // Handle the standard API response structure
    if (response && response.status_code === 200) {
      return response;
    } else {
      console.log('Activate user response:', response);
      return response;
    }
  }

  async deactivateUser(userId) {
    const response = await this.request(`/api/admin/users/${userId}/deactivate`, {
      method: 'PATCH',
    });
    
    // Handle the standard API response structure
    if (response && response.status_code === 200) {
      return response;
    } else {
      console.log('Deactivate user response:', response);
      return response;
    }
  }

  async getUsersByParent(parentId, skip = 0, limit = 100) {
    const response = await this.request(`/api/admin/users/by-parent/${parentId}?skip=${skip}&limit=${limit}`);
    console.log('Raw users by parent API response:', response);
    
    // Handle the standard API response structure
    if (response && response.status_code === 200 && response.data) {
      console.log('Extracting users from response.data');
      return response.data;
    } else if (response && response.data && response.data.users) {
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

  // Statistics Management
  async createStatistics(statsData) {
    try {
      console.log('API Service - createStatistics called with:', statsData);
      const response = await this.request('/api/admin/voter-stats/', {
        method: 'POST',
        body: JSON.stringify(statsData),
      });
      console.log('API Service - createStatistics response:', response);
      return response;
    } catch (error) {
      console.error('API Service - createStatistics error:', error);
      throw error;
    }
  }

  async updateStatistics(id, statsData) {
    try {
      console.log('API Service - updateStatistics called with:', { id, statsData });
      const response = await this.request(`/api/admin/voter-stats/${id}`, {
        method: 'PUT',
        body: JSON.stringify(statsData),
      });
      console.log('API Service - updateStatistics response:', response);
      return response;
    } catch (error) {
      console.error('API Service - updateStatistics error:', error);
      throw error;
    }
  }

  async getStatisticsByPollingStation(pollingStationId) {
    try {
      console.log('API Service - getStatisticsByPollingStation called with:', pollingStationId);
      const response = await this.request(`/api/admin/voter-stats/polling-station/${pollingStationId}`);
      console.log('API Service - getStatisticsByPollingStation response:', response);
      
      // Handle the nested data structure from the API
      if (response && response.data) {
        return response.data;
      }
      return response;
    } catch (error) {
      console.error('API Service - getStatisticsByPollingStation error:', error);
      throw error;
    }
  }

  async getStatistics(skip = 0, limit = 100) {
    try {
      console.log('API Service - getStatistics called with:', { skip, limit });
      const response = await this.request(`/api/admin/voter-stats/?skip=${skip}&limit=${limit}`);
      console.log('API Service - getStatistics response:', response);
      
      // Handle the nested data structure from the API
      if (response && response.data && response.data.statistics) {
        return response.data.statistics;
      }
      
      if (Array.isArray(response)) {
        return response;
      }
      
      if (response && response.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      return response;
    } catch (error) {
      console.error('API Service - getStatistics error:', error);
      throw error;
    }
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

  // Update user profile using the auth profile endpoint
  async updateUserProfileAuth(profileData) {
    return this.request('/api/auth/profile', {
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

  // User-Election Assignment API
  async assignUserToElection(userId, electionId, role) {
    return this.request('/api/admin/user-elections/assign-single', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        election_id: electionId,
        role: role
      }),
    });
  }

  async getUserElectionAssignment(userId) {
    return this.request(`/api/admin/user-elections/user/${userId}`);
  }
}

export default new ApiService();
