import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
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
  Spinner
} from 'reactstrap';
import { Colxx } from 'components/common/CustomBootstrap';
import IntlMessages from 'helpers/IntlMessages';
import apiService from 'services/api';

const ChildUsersPage = () => {
  const { parentId } = useParams();
  const history = useHistory();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [parentUser, setParentUser] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  useEffect(() => {
    loadParentUser();
    loadChildUsers();
  }, [parentId]);

  useEffect(() => {
    filterUsers();
    setCurrentPage(1); // Reset to first page when search changes
  }, [users, searchTerm]);

  const loadParentUser = async () => {
    try {
      const user = await apiService.getUserById(parentId);
      setParentUser(user);
    } catch (error) {
      console.error('Failed to load parent user:', error);
      setParentUser({ user_id: parentId, first_name: 'Unknown', last_name: 'User' });
    }
  };

  const loadChildUsers = async () => {
    try {
      setLoading(true);
      const data = await apiService.getUsersByParent(parentId);
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setUsers(data);
      } else if (data && Array.isArray(data.data)) {
        setUsers(data.data);
      } else if (data && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        console.warn('API returned unexpected data format:', data);
        setUsers([]);
      }
    } catch (error) {
      console.error('Failed to load child users:', error);
      setMessage({ type: 'danger', text: 'Failed to load child users. Using demo data.' });
      
      // Fallback to demo data
      setUsers([
        {
          id: 1,
          user_id: 'CHILD001',
          first_name: 'Child',
          last_name: 'User 1',
          email: 'child1@example.com',
          mobile: '+1-555-0001',
          party_name: 'Bharatiya Janata Party',
          party_logo: 'https://picsum.photos/50/50?random=21',
          profile_pic: 'https://picsum.photos/50/50?random=31',
          footer_content: 'Child user content',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          user_id: 'CHILD002',
          first_name: 'Child',
          last_name: 'User 2',
          email: 'child2@example.com',
          mobile: '+1-555-0002',
          party_name: 'Indian National Congress',
          party_logo: 'https://picsum.photos/50/50?random=22',
          profile_pic: 'https://picsum.photos/50/50?random=32',
          footer_content: 'Another child user',
          is_active: true,
          created_at: '2024-01-02T00:00:00Z',
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

  const getStatusBadge = (status) => {
    const statusColors = {
      active: 'success',
      inactive: 'danger',
      pending: 'warning'
    };
    return <Badge color={statusColors[status] || 'secondary'}>{status}</Badge>;
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

  return (
    <div className="child-users-page">
      <Row>
        <Colxx xxs="12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="mb-2">
                <IntlMessages id="user.other-users.title" />
              </h1>
              {parentUser && (
                <p className="text-muted mb-0">
                  Showing other users for: <strong>{parentUser.first_name} {parentUser.last_name}</strong> (ID: {parentUser.user_id})
                </p>
              )}
            </div>
            <Button color="secondary" onClick={() => history.goBack()}>
              <i className="simple-icon-arrow-left mr-2"></i>
              Back to Users
            </Button>
          </div>
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

      {/* Child Users Management */}
      <Row>
        <Colxx xxs="12">
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <CardTitle className="mb-0">
                  <IntlMessages id="user.other-users.list" />
                </CardTitle>
                <div className="d-flex align-items-center">
                  <span className="mr-2">Total Other Users:</span>
                  <Badge color="info">{filteredUsers.length}</Badge>
                </div>
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
                      placeholder="Search other users by name, email, or mobile..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Colxx>
              </Row>

              {/* Users Table */}
              {loading ? (
                <div className="text-center py-4">
                  <Spinner color="primary" />
                  <p className="mt-2">Loading other users...</p>
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
                          </tr>
                        ))
                      ) : (
                                                 <tr>
                           <td colSpan="11" className="text-center py-4">
                             {searchTerm ? 'No other users found matching your search.' : 'No other users available.'}
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
                       Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} other users
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
    </div>
  );
};

export default ChildUsersPage;
