import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { 
  Row, 
  Col, 
  Card, 
  CardBody, 
  CardTitle, 
  Button, 
  Alert, 
  Badge, 
  Table, 
  Input, 
  InputGroup, 
  InputGroupAddon, 
  InputGroupText,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Spinner
} from 'reactstrap';
import { Colxx } from 'components/common/CustomBootstrap';
import IntlMessages from 'helpers/IntlMessages';
import apiService from 'services/api';

const UserDashboard = () => {
  const history = useHistory();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [userForm, setUserForm] = useState({
    user_id: '',
    first_name: '',
    last_name: '',
    email: null,
    password: null,
    confirmPassword: null,
    mobile: null,
    party_logo: null,
    profile_pic: null,
    party_name: '',
    footer_content: '',
    is_active: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [modalError, setModalError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedProfilePic, setSelectedProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
    setCurrentPage(1); // Reset to first page when search changes
  }, [users, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiService.getUsers();
      
      // Handle the new API response structure
      if (data && Array.isArray(data)) {
        setUsers(data);
      } else if (data && data.status_code === 200 && Array.isArray(data.data)) {
        setUsers(data.data);
      } else if (data && Array.isArray(data.data)) {
        setUsers(data.data);
      } else if (data && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        console.warn('API returned unexpected data format:', data);
        setUsers([]);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      setMessage({ type: 'danger', text: 'Failed to load users. Using demo data.' });
      
      // Fallback to demo data
      setUsers([
        {
          id: 1,
          user_id: 'USR001',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          mobile: '+1-555-0123',
          party_name: 'Bharatiya Janata Party',
          party_logo: 'https://picsum.photos/50/50?random=1',
          profile_pic: 'https://picsum.photos/50/50?random=11',
          footer_content: 'भारतीय जनता पार्टी - राष्ट्र के लिए समर्पित',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          user_id: 'USR002',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@example.com',
          mobile: '+1-555-0456',
          party_name: 'Indian National Congress',
          party_logo: 'https://picsum.photos/50/50?random=2',
          profile_pic: 'https://picsum.photos/50/50?random=12',
          footer_content: 'भारतीय राष्ट्रीय कांग्रेस - जनता की आवाज',
          is_active: true,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        },
        {
          id: 3,
          user_id: 'USR003',
          first_name: 'Mike',
          last_name: 'Johnson',
          email: 'mike.johnson@example.com',
          mobile: '+1-555-0789',
          party_name: 'Aam Aadmi Party',
          party_logo: 'https://picsum.photos/50/50?random=3',
          profile_pic: 'https://picsum.photos/50/50?random=13',
          footer_content: 'आम आदमी पार्टी - साफ राजनीति',
          is_active: false,
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.party_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const handleAddUser = async () => {
    setEditingUser(null);
    
    // Generate user ID first
    let generatedId = '';
    try {
      const response = await apiService.generateUserId();
      
      // Handle the new API response structure
      if (response && response.status_code === 200 && response.data) {
        generatedId = response.data.user_id || response.data.id;
      } else if (response && response.data && response.data.user_id) {
        generatedId = response.data.user_id;
      } else if (response && response.user_id) {
        generatedId = response.user_id;
      } else if (response && response.id) {
        generatedId = response.id;
      } else {
        generatedId = response;
      }
    } catch (error) {
      console.error('Failed to generate user ID from API:', error);
      // Fallback to client-side generation
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      generatedId = `USR${timestamp}${random}`;
    }
    
    const newForm = {
      user_id: generatedId,
      first_name: '',
      last_name: '',
      email: '',  // Start with empty string, will be converted to null if not filled
      password: null,
      confirmPassword: null,
      mobile: null,
      party_logo: null,
      profile_pic: null,
      party_name: '',
      footer_content: '',
      is_active: true
    };
    setUserForm(newForm);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordError('');
    setModalError('');
    setSelectedFile(null);
    setFilePreview(null);
    setSelectedProfilePic(null);
    setProfilePicPreview(null);
    setModalOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      user_id: user.user_id || user.id || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || null,
      password: null,
      confirmPassword: null,
      mobile: user.mobile || null,
      party_logo: user.party_logo || null,
      profile_pic: user.profile_pic || null,
      party_name: user.party_name || '',
      footer_content: user.footer_content || '',
      is_active: user.is_active !== undefined ? user.is_active : true
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordError('');
    setModalError('');
    setSelectedFile(null);
    setFilePreview(null);
    setSelectedProfilePic(null);
    setProfilePicPreview(null);
    setModalOpen(true);
  };

  const handleSaveUser = async () => {
    // Validate passwords for new users
    if (!editingUser && !validatePasswords()) {
      return;
    }

    try {
      setLoading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add user data to FormData
      formData.append('user_id', userForm.user_id?.trim() || '');
      formData.append('first_name', userForm.first_name?.trim() || '');
      formData.append('last_name', userForm.last_name?.trim() || '');
      
      // Handle email - send empty string if empty
      if (userForm.email && userForm.email.trim() !== '') {
        formData.append('email', userForm.email.trim());
      } else {
        formData.append('email', '');
      }
      
      // Handle mobile - send empty string if empty
      if (userForm.mobile && userForm.mobile.trim() !== '') {
        formData.append('mobile', userForm.mobile.trim());
      } else {
        formData.append('mobile', '');
      }
      
      formData.append('party_name', userForm.party_name?.trim() || '');
      formData.append('footer_content', userForm.footer_content?.trim() || '');
      formData.append('is_active', userForm.is_active);
      
      // Handle password - only add if provided
      if (userForm.password && userForm.password.trim() !== '') {
        formData.append('password', userForm.password.trim());
      }

      // Handle file upload for party logo
      if (userForm.party_logo && userForm.party_logo instanceof File) {
        formData.append('party_logo', userForm.party_logo);
      }

      // Handle file upload for profile pic
      if (userForm.profile_pic && userForm.profile_pic instanceof File) {
        formData.append('profile_pic', userForm.profile_pic);
      }

      if (editingUser) {
        // For editing, we'll still use JSON for now (no file upload in edit)
        const userData = {
          user_id: userForm.user_id?.trim() || '',
          first_name: userForm.first_name?.trim() || '',
          last_name: userForm.last_name?.trim() || '',
          email: userForm.email?.trim() || '',
          mobile: userForm.mobile?.trim() || '',
          party_name: userForm.party_name?.trim() || '',
          profile_pic: userForm.profile_pic || '',
          footer_content: userForm.footer_content?.trim() || '',
          is_active: userForm.is_active
        };

        // Convert null/undefined to empty strings
        Object.keys(userData).forEach(key => {
          if (userData[key] === null || userData[key] === undefined) {
            userData[key] = '';
          }
        });

        // Handle password for edit
        if (userForm.password && userForm.password.trim() !== '') {
          userData.password = userForm.password.trim();
        } else {
          userData.password = null;
        }

        await apiService.updateUser(editingUser.id, userData);
        setMessage({ type: 'success', text: 'User updated successfully' });
        setModalOpen(false);
        loadUsers();
      } else {
        // For new users, use FormData
        const response = await apiService.createUserFormData(formData);
        
        // Handle the new API response structure
        if (response && response.status_code === 200 || response.status_code === 201) {
          const successMessage = response.message || 'User created successfully';
          setMessage({ type: 'success', text: successMessage });
          setModalOpen(false);
          loadUsers();
        } else {
          throw new Error(response.message || 'Failed to create user');
        }
      }
    } catch (error) {
      console.error('User save error:', error);
      let errorMessage = 'Failed to save user';
      
      // Try to extract error message from different response formats
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setModalError(errorMessage);
      // Keep modal open on error so user can fix the details
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const action = user.is_active ? 'deactivate' : 'activate';
    const userName = `${user.first_name} ${user.last_name}`;
    
    if (window.confirm(`Are you sure you want to ${action} user "${userName}"?`)) {
      try {
        setLoading(true);
        
        try {
          // Try specific activate/deactivate endpoints first
          let response;
          if (user.is_active) {
            // Deactivate user
            response = await apiService.deactivateUser(user.id);
            const message = response.message || `User "${userName}" has been deactivated successfully`;
            setMessage({ type: 'success', text: message });
          } else {
            // Activate user
            response = await apiService.activateUser(user.id);
            const message = response.message || `User "${userName}" has been activated successfully`;
            setMessage({ type: 'success', text: message });
          }
        } catch (specificError) {
          console.log('Specific activate/deactivate endpoints not available, falling back to update method');
          
          // Fallback to update method
          const newStatus = !user.is_active;
          await apiService.updateUser(user.id, { ...user, is_active: newStatus });
          setMessage({ type: 'success', text: `User "${userName}" status updated to ${newStatus ? 'active' : 'inactive'}` });
        }
        
        loadUsers();
      } catch (error) {
        console.error(`${action} user error:`, error);
        let errorMessage = `Failed to ${action} user`;
        
        // Try to extract error message from different response formats
        if (error.response && error.response.data) {
          const errorData = error.response.data;
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setMessage({ type: 'danger', text: errorMessage });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      try {
        setLoading(true);
        await apiService.deleteUser(userId);
        setMessage({ type: 'success', text: 'User deleted successfully' });
        loadUsers();
      } catch (error) {
        console.error('Delete user error:', error);
        let errorMessage = 'Failed to delete user';
        
        // Try to extract error message from different response formats
        if (error.response && error.response.data) {
          const errorData = error.response.data;
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setMessage({ type: 'danger', text: errorMessage });
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: 'success',
      inactive: 'danger',
      pending: 'warning'
    };
    return <Badge color={statusColors[status] || 'secondary'}>{status}</Badge>;
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      admin: 'danger',
      voter: 'info',
      observer: 'warning'
    };
    return <Badge color={roleColors[role] || 'secondary'}>{role}</Badge>;
  };

  const generateRandomPassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setUserForm({ ...userForm, password: password, confirmPassword: password });
    setPasswordError('');
  };

  const validatePasswords = () => {
    // If both passwords are null or empty, that's valid (optional password)
    if (!userForm.password && !userForm.confirmPassword) {
      setPasswordError('');
      return true;
    }
    
    // If one password is provided but not the other, that's invalid
    if (!userForm.password || !userForm.confirmPassword) {
      setPasswordError('Both password fields must be filled');
      return false;
    }
    
    // Check if passwords match
    if (userForm.password !== userForm.confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    
    // Check password length
    if (userForm.password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    
    setPasswordError('');
    return true;
  };

  const generateUserId = async () => {
    try {
      // Try to get user ID from API first
      const response = await apiService.generateUserId();
      const generatedUserId = response.data?.user_id || response.user_id || response.id || response;
      
      if (generatedUserId) {
        setUserForm({ ...userForm, user_id: generatedUserId });
        return;
      }
    } catch (error) {
      console.error('Failed to generate user ID from API:', error);
    }
    
    // Fallback to client-side generation
    try {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const generatedUserId = `USR${timestamp}${random}`;
      setUserForm({ ...userForm, user_id: generatedUserId });
    } catch (error) {
      console.error('Failed to generate user ID:', error);
      setModalError('Failed to generate User ID. Please try again.');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setModalError('Please select a valid image file (JPEG, PNG, or GIF)');
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setModalError('File size must be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
      setUserForm({ ...userForm, party_logo: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      setModalError(''); // Clear any previous errors
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUserForm({ ...userForm, party_logo: null });
  };

  const handleProfilePicSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setModalError('Please select a valid image file (JPEG, PNG, or GIF)');
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setModalError('File size must be less than 5MB');
        return;
      }
      
      setSelectedProfilePic(file);
      setUserForm({ ...userForm, profile_pic: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      setModalError(''); // Clear any previous errors
    }
  };

  const removeProfilePic = () => {
    setSelectedProfilePic(null);
    setProfilePicPreview(null);
    setUserForm({ ...userForm, profile_pic: null });
  };

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  const getVoterStatusBadge = (status) => {
    const statusColors = {
      registered: 'info',
      voted: 'success',
      not_voted: 'warning',
      ineligible: 'danger'
    };
    return <Badge color={statusColors[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="user-dashboard">
      <Row>
        <Colxx xxs="12">
          <h1 className="mb-4">
            <IntlMessages id="user.dashboard.title" />
          </h1>
        </Colxx>
      </Row>

      {message.text && (
        <Row>
          <Colxx xxs="12">
            <Alert color={message.type} toggle={() => setMessage({ type: '', text: '' })}>
              {message.text}
            </Alert>
          </Colxx>
        </Row>
      )}

      {/* Users Management */}
      <Row>
        <Colxx xxs="12">
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <CardTitle className="mb-0">
                  <IntlMessages id="user.dashboard.users" />
                </CardTitle>
                <Button color="primary" onClick={handleAddUser}>
                  <i className="simple-icon-plus mr-2"></i>
                  Add User
                </Button>
              </div>

              {/* Search Bar */}
              <Row className="mb-4">
                <Colxx xxs="12" md="6">
                  <InputGroup>
                    <InputGroupAddon addonType="prepend">
                      <InputGroupText>
                        <i className="simple-icon-magnifier"></i>
                      </InputGroupText>
                    </InputGroupAddon>
                                         <Input
                       placeholder="Search users by name, email, or mobile..."
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                     />
                  </InputGroup>
                </Colxx>
                <Colxx xxs="12" md="6" className="d-flex justify-content-end">
                  <div className="d-flex align-items-center">
                    <span className="mr-2">Total Users:</span>
                    <Badge color="info">{filteredUsers.length}</Badge>
                  </div>
                </Colxx>
              </Row>

              {/* Users Table */}
              {loading ? (
                <div className="text-center py-4">
                  <Spinner color="primary" />
                  <p className="mt-2">Loading users...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped hover>
                                                             <thead>
                      <tr>
                        <th>User ID</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Status</th>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th>Party Logo</th>
                        <th>Profile Pic</th>
                        <th>Party Name</th>
                        <th>Created At</th>
                        <th>Updated At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                                         <tbody>
                       {currentUsers.length > 0 ? (
                         currentUsers.map((user) => (
                           <tr key={user.id}>
                             <td>
                               <strong>{user.user_id || user.id}</strong>
                             </td>
                             <td>
                               <strong>{user.first_name}</strong>
                             </td>
                             <td>
                               <strong>{user.last_name}</strong>
                             </td>
                             <td>{getStatusBadge(user.is_active ? 'active' : 'inactive')}</td>
                             <td>{user.email}</td>
                             <td>{user.mobile}</td>
                                                          <td>
                               {user.party_logo && user.party_logo.trim() !== '' ? (
                                 <div style={{ position: 'relative' }}>
                                   <img 
                                     src={user.party_logo} 
                                     alt="Party Logo" 
                                     style={{ 
                                       width: '40px', 
                                       height: '40px', 
                                       borderRadius: '50%', 
                                       objectFit: 'cover',
                                       border: '2px solid #e9ecef'
                                     }}
                                     onError={(e) => {
                                       console.log('Image failed to load:', user.party_logo);
                                       e.target.style.display = 'none';
                                       if (e.target.nextSibling) {
                                         e.target.nextSibling.style.display = 'flex';
                                       }
                                     }}
                                   />
                                   <div 
                                     style={{ 
                                       width: '40px', 
                                       height: '40px', 
                                       borderRadius: '50%', 
                                       backgroundColor: '#f8f9fa', 
                                       display: 'none',
                                       alignItems: 'center', 
                                       justifyContent: 'center',
                                       fontSize: '10px',
                                       color: '#6c757d',
                                       border: '2px solid #e9ecef',
                                       position: 'absolute',
                                       top: 0,
                                       left: 0
                                     }}
                                   >
                                     No Logo
                                   </div>
                                 </div>
                               ) : (
                                 <div 
                                   style={{ 
                                     width: '40px', 
                                       height: '40px', 
                                       borderRadius: '50%', 
                                       backgroundColor: '#f8f9fa', 
                                       display: 'flex', 
                                       alignItems: 'center', 
                                       justifyContent: 'center',
                                       fontSize: '10px',
                                       color: '#6c757d',
                                       border: '2px solid #e9ecef'
                                     }}
                                   >
                                     No Logo
                                   </div>
                                 )}
                               </td>
                             <td>
                               {user.profile_pic && user.profile_pic.trim() !== '' ? (
                                 <div style={{ position: 'relative' }}>
                                   <img 
                                     src={user.profile_pic} 
                                     alt="Profile Picture" 
                                     style={{ 
                                       width: '40px', 
                                       height: '40px', 
                                       borderRadius: '50%', 
                                       objectFit: 'cover',
                                       border: '2px solid #e9ecef'
                                     }}
                                     onError={(e) => {
                                       console.log('Profile pic failed to load:', user.profile_pic);
                                       e.target.style.display = 'none';
                                       if (e.target.nextSibling) {
                                         e.target.nextSibling.style.display = 'flex';
                                       }
                                     }}
                                   />
                                   <div 
                                     style={{ 
                                       width: '40px', 
                                       height: '40px', 
                                       borderRadius: '50%', 
                                       backgroundColor: '#f8f9fa', 
                                       display: 'none',
                                       alignItems: 'center', 
                                       justifyContent: 'center',
                                       fontSize: '10px',
                                       color: '#6c757d',
                                       border: '2px solid #e9ecef',
                                       position: 'absolute',
                                       top: 0,
                                       left: 0
                                     }}
                                   >
                                     No Pic
                                   </div>
                                 </div>
                               ) : (
                                 <div 
                                   style={{ 
                                     width: '40px', 
                                       height: '40px', 
                                       borderRadius: '50%', 
                                       backgroundColor: '#f8f9fa', 
                                       display: 'flex', 
                                       alignItems: 'center', 
                                       justifyContent: 'center',
                                       fontSize: '10px',
                                       color: '#6c757d',
                                       border: '2px solid #e9ecef'
                                   }}
                                   >
                                     No Pic
                                   </div>
                                 )}
                               </td>
                             <td>
                               <span className="text-primary font-weight-bold">
                                 {user.party_name || 'No Party'}
                               </span>
                             </td>
                             <td>
                               <small>{new Date(user.created_at).toLocaleDateString()}</small>
                             </td>
                             <td>
                               <small>{new Date(user.updated_at).toLocaleDateString()}</small>
                             </td>
                             <td>
                               <div className="btn-group" role="group">
                                                                    <Button
                                     color="primary"
                                     size="sm"
                                     onClick={() => history.push(`/app/users/${user.user_id || user.id}/children`)}
                                     className="mr-1"
                                     title="View Other Users"
                                   >
                                     <i className="simple-icon-people mr-1"></i>
                                     View Others
                                   </Button>
                                 <Button
                                   color={user.is_active ? 'warning' : 'success'}
                                   size="sm"
                                   onClick={() => handleToggleStatus(user)}
                                   className="mr-1"
                                 >
                                   {user.is_active ? 'Deactivate' : 'Activate'}
                                 </Button>
                                 <Button
                                   color="info"
                                   size="sm"
                                   onClick={() => handleEditUser(user)}
                                   className="mr-1"
                                 >
                                   Edit
                                 </Button>
                                 <Button
                                   color="danger"
                                   size="sm"
                                   onClick={() => handleDeleteUser(user.id, `${user.first_name} ${user.last_name}`)}
                                 >
                                   Delete
                                 </Button>
                               </div>
                             </td>
                           </tr>
                         ))
                                             ) : (
                         <tr>
                           <td colSpan="12" className="text-center py-4">
                             {searchTerm ? 'No users found matching your search.' : 'No users available.'}
                           </td>
                         </tr>
                       )}
                     </tbody>
                   </Table>
                 </div>
               )}
               
               {/* Pagination */}
               {filteredUsers.length > 0 && (
                 <div className="d-flex justify-content-between align-items-center mt-4">
                   <div className="d-flex align-items-center">
                     <span className="mr-3">
                       Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
                     </span>
                   </div>
                   
                   <div className="d-flex align-items-center">
                     <Button
                       color="secondary"
                       size="sm"
                       onClick={handlePreviousPage}
                       disabled={currentPage === 1}
                       className="mr-2"
                     >
                       <i className="simple-icon-arrow-left"></i>
                       Previous
                     </Button>
                     
                     <div className="btn-group" role="group">
                       {getPageNumbers().map((pageNumber, index) => (
                         <Button
                           key={index}
                           color={pageNumber === currentPage ? 'primary' : 'outline-primary'}
                           size="sm"
                           onClick={() => typeof pageNumber === 'number' ? handlePageChange(pageNumber) : null}
                           disabled={pageNumber === '...'}
                           className="mr-1"
                         >
                           {pageNumber}
                         </Button>
                       ))}
                     </div>
                     
                     <Button
                       color="secondary"
                       size="sm"
                       onClick={handleNextPage}
                       disabled={currentPage === totalPages}
                       className="ml-2"
                     >
                       Next
                       <i className="simple-icon-arrow-right"></i>
                     </Button>
                   </div>
                 </div>
               )}
             </CardBody>
           </Card>
         </Colxx>
       </Row>

      {/* Add/Edit User Modal */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size="lg">
        <ModalHeader toggle={() => setModalOpen(false)}>
          {editingUser ? 'Edit User' : 'Add New User'}
        </ModalHeader>
        <ModalBody>
          {modalError && (
            <Alert color="danger" className="mb-3">
              {modalError}
            </Alert>
          )}
          <Form>
                        <Row>
              <Colxx xxs="12">
                <FormGroup>
                  <Label>User ID</Label>
                  <InputGroup>
                    <Input
                      value={userForm.user_id}
                      disabled
                      placeholder="Auto-generated"
                    />
                    {!editingUser && (
                      <InputGroupAddon addonType="append">
                        <Button
                          type="button"
                          color="secondary"
                          onClick={generateUserId}
                          title="Generate new User ID"
                        >
                          <i className="simple-icon-refresh"></i>
                        </Button>
                      </InputGroupAddon>
                    )}
                  </InputGroup>
                  <small className="text-muted">
                    {editingUser ? 'User ID cannot be changed' : 'Click refresh to generate new ID'}
                  </small>
                </FormGroup>
              </Colxx>
            </Row>
            <Row>
              <Colxx xxs="12" md="6">
                <FormGroup>
                  <Label>First Name</Label>
                  <Input
                    value={userForm.first_name}
                    onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                  />
                </FormGroup>
              </Colxx>
               <Colxx xxs="12" md="6">
                 <FormGroup>
                   <Label>Last Name</Label>
                   <Input
                     value={userForm.last_name}
                     onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                   />
                 </FormGroup>
               </Colxx>
             </Row>
             <Row>
               <Colxx xxs="12" md="6">
                 <FormGroup>
                   <Label>Email</Label>
                   <Input
                     type="email"
                     value={userForm.email || ''}
                     onChange={(e) => setUserForm({ ...userForm, email: e.target.value === '' ? null : e.target.value })}
                     placeholder="Enter email address"
                     autoComplete="off"
                     defaultValue=""
                   />
                 </FormGroup>
               </Colxx>
               <Colxx xxs="12" md="6">
                 <FormGroup>
                   <Label>Mobile</Label>
                   <Input
                     value={userForm.mobile || ''}
                     onChange={(e) => setUserForm({ ...userForm, mobile: e.target.value === '' ? null : e.target.value })}
                   />
                 </FormGroup>
               </Colxx>
             </Row>
             <Row>
               <Colxx xxs="12" md="6">
                 <FormGroup>
                   <Label>Party Name *</Label>
                   <Input
                     value={userForm.party_name || ''}
                     onChange={(e) => setUserForm({ ...userForm, party_name: e.target.value })}
                     placeholder="Enter party name"
                     required
                   />
                 </FormGroup>
               </Colxx>
               <Colxx xxs="12" md="6">
                 <FormGroup>
                   <Label>Footer Content</Label>
                   <Input
                     type="textarea"
                     value={userForm.footer_content || ''}
                     onChange={(e) => setUserForm({ ...userForm, footer_content: e.target.value })}
                     placeholder="Enter footer content"
                     rows="3"
                   />
                 </FormGroup>
               </Colxx>
             </Row>
             
             {/* Password Fields - Only show for new users or when editing */}
             {!editingUser && (
               <>
                 <Row>
                   <Colxx xxs="12" md="6">
                     <FormGroup>
                       <Label>Password *</Label>
                       <InputGroup>
                         <Input
                           type={showPassword ? 'text' : 'password'}
                           value={userForm.password || ''}
                           onChange={(e) => setUserForm({ ...userForm, password: e.target.value === '' ? null : e.target.value })}
                           required
                         />
                         <InputGroupAddon addonType="append">
                           <Button
                             type="button"
                             color="secondary"
                             onClick={() => setShowPassword(!showPassword)}
                           >
                             <i className={`simple-icon-${showPassword ? 'eye' : 'eye-off'}`}></i>
                           </Button>
                         </InputGroupAddon>
                       </InputGroup>
                     </FormGroup>
                   </Colxx>
                   <Colxx xxs="12" md="6">
                     <FormGroup>
                       <Label>Confirm Password *</Label>
                       <InputGroup>
                         <Input
                           type={showConfirmPassword ? 'text' : 'password'}
                           value={userForm.confirmPassword || ''}
                           onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value === '' ? null : e.target.value })}
                           required
                         />
                         <InputGroupAddon addonType="append">
                           <Button
                             type="button"
                             color="secondary"
                             onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                           >
                             <i className={`simple-icon-${showConfirmPassword ? 'eye' : 'eye-off'}`}></i>
                           </Button>
                         </InputGroupAddon>
                       </InputGroup>
                     </FormGroup>
                   </Colxx>
                 </Row>
                 
                 <Row>
                   <Colxx xxs="12">
                     <FormGroup>
                       <Button
                         type="button"
                         color="info"
                         size="sm"
                         onClick={generateRandomPassword}
                         className="mr-2"
                       >
                         <i className="simple-icon-refresh mr-1"></i>
                         Generate Random Password
                       </Button>
                       <small className="text-muted">
                         Password must be at least 8 characters long
                       </small>
                     </FormGroup>
                   </Colxx>
                 </Row>
                 
                 {passwordError && (
                   <Row>
                     <Colxx xxs="12">
                       <Alert color="danger" className="py-2">
                         {passwordError}
                       </Alert>
                     </Colxx>
                   </Row>
                 )}
               </>
             )}
             
             {/* Party Logo Upload */}
             <Row>
               <Colxx xxs="12">
                 <FormGroup>
                   <Label>Party Logo</Label>
                   <div className="d-flex align-items-center">
                     <Input
                       type="file"
                       accept="image/*"
                       onChange={handleFileSelect}
                       className="mr-2"
                     />
                     {selectedFile && (
                       <Button
                         type="button"
                         color="danger"
                         size="sm"
                         onClick={removeFile}
                       >
                         <i className="simple-icon-trash mr-1"></i>
                         Remove
                       </Button>
                     )}
                   </div>
                   {filePreview && (
                     <div className="mt-2">
                       <img 
                         src={filePreview} 
                         alt="Party Logo Preview" 
                         style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
                         className="border rounded"
                       />
                     </div>
                   )}
                   <small className="text-muted">
                     Supported formats: JPEG, PNG, GIF (max 5MB)
                   </small>
                 </FormGroup>
               </Colxx>
             </Row>
             
             {/* Profile Pic Upload */}
             <Row>
               <Colxx xxs="12">
                 <FormGroup>
                   <Label>Profile Picture</Label>
                   <div className="d-flex align-items-center">
                     <Input
                       type="file"
                       accept="image/*"
                       onChange={handleProfilePicSelect}
                       className="mr-2"
                     />
                     {selectedProfilePic && (
                       <Button
                         type="button"
                         color="danger"
                         size="sm"
                         onClick={removeProfilePic}
                       >
                         <i className="simple-icon-trash mr-1"></i>
                         Remove
                       </Button>
                     )}
                   </div>
                   {profilePicPreview && (
                     <div className="mt-2">
                       <img 
                         src={profilePicPreview} 
                         alt="Profile Picture Preview" 
                         style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
                         className="border rounded"
                       />
                     </div>
                   )}
                   <small className="text-muted">
                     Supported formats: JPEG, PNG, GIF (max 5MB)
                   </small>
                 </FormGroup>
               </Colxx>
             </Row>
             
             {/* Password Update for Existing Users */}
             {editingUser && (
               <Row>
                 <Colxx xxs="12">
                   <FormGroup>
                     <Label>Update Password (Optional)</Label>
                     <InputGroup>
                       <Input
                         type={showPassword ? 'text' : 'password'}
                         value={userForm.password || ''}
                         onChange={(e) => setUserForm({ ...userForm, password: e.target.value === '' ? null : e.target.value })}
                         placeholder="Leave blank to keep current password"
                       />
                       <InputGroupAddon addonType="append">
                         <Button
                           type="button"
                           color="secondary"
                           onClick={() => setShowPassword(!showPassword)}
                         >
                           <i className={`simple-icon-${showPassword ? 'eye' : 'eye-off'}`}></i>
                         </Button>
                       </InputGroupAddon>
                     </InputGroup>
                     {userForm.password && (
                       <InputGroup className="mt-2">
                         <Input
                           type={showConfirmPassword ? 'text' : 'password'}
                           value={userForm.confirmPassword || ''}
                           onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value === '' ? null : e.target.value })}
                           placeholder="Confirm new password"
                         />
                         <InputGroupAddon addonType="append">
                           <Button
                             type="button"
                             color="secondary"
                             onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                           >
                             <i className={`simple-icon-${showConfirmPassword ? 'eye' : 'eye-off'}`}></i>
                           </Button>
                         </InputGroupAddon>
                       </InputGroup>
                     )}
                     {userForm.password && (
                       <Button
                         type="button"
                         color="info"
                         size="sm"
                         onClick={generateRandomPassword}
                         className="mt-2 mr-2"
                       >
                         <i className="simple-icon-refresh mr-1"></i>
                         Generate Random Password
                       </Button>
                     )}
                   </FormGroup>
                 </Colxx>
               </Row>
             )}
             
             <Row>
               <Colxx xxs="12" md="6">
                 <FormGroup>
                   <Label>Status</Label>
                   <Input
                     type="select"
                     value={userForm.is_active ? 'active' : 'inactive'}
                     onChange={(e) => setUserForm({ ...userForm, is_active: e.target.value === 'active' })}
                   >
                     <option value="active">Active</option>
                     <option value="inactive">Inactive</option>
                   </Input>
                 </FormGroup>
               </Colxx>
             </Row>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button color="primary" onClick={handleSaveUser} disabled={loading}>
            {loading ? <Spinner size="sm" /> : (editingUser ? 'Update' : 'Create')}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default UserDashboard;
