import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, CardTitle, Button, Form, FormGroup, Label, Input, Alert, Table, Modal, ModalHeader, ModalBody, ModalFooter, Badge } from 'reactstrap';
import { Colxx } from 'components/common/CustomBootstrap';
import IntlMessages from 'helpers/IntlMessages';
import apiService from 'services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'voter',
    status: 'active',
    voterId: '',
    constituency: '',
    pollingStation: '',
    voterStatus: 'registered'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiService.getUsers();
      
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
      console.error('Failed to load users:', error);
      setMessage({ type: 'danger', text: 'Failed to load users. Using demo data.' });
      // Fallback to demo data
      setUsers([
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1-555-0123',
          role: 'voter',
          status: 'active',
          voterId: 'V001234567',
          constituency: 'Downtown District',
          pollingStation: 'Central High School',
          voterStatus: 'registered',
          lastLogin: '2024-01-15 10:30:00',
          createdAt: '2024-01-01'
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '+1-555-0456',
          role: 'admin',
          status: 'active',
          voterId: 'V007654321',
          constituency: 'Suburban District',
          pollingStation: 'Community Center',
          voterStatus: 'voted',
          lastLogin: '2024-01-15 09:15:00',
          createdAt: '2024-01-02'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'voter',
      status: 'active',
      voterId: '',
      constituency: '',
      pollingStation: '',
      voterStatus: 'registered'
    });
    setModalOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      voterId: user.voterId,
      constituency: user.constituency,
      pollingStation: user.pollingStation,
      voterStatus: user.voterStatus
    });
    setModalOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      setLoading(true);
      if (editingUser) {
        await apiService.updateUser(editingUser.id, userForm);
        setMessage({ type: 'success', text: 'User updated successfully' });
      } else {
        await apiService.createUser(userForm);
        setMessage({ type: 'success', text: 'User created successfully' });
      }
      setModalOpen(false);
      loadUsers();
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to save user' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await apiService.deleteUser(id);
        setMessage({ type: 'success', text: 'User deleted successfully' });
        loadUsers();
      } catch (error) {
        setMessage({ type: 'danger', text: 'Failed to delete user' });
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: 'success',
      inactive: 'secondary',
      suspended: 'warning',
      banned: 'danger'
    };
    return <Badge color={statusColors[status] || 'secondary'}>{status}</Badge>;
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

  const getRoleBadge = (role) => {
    const roleColors = {
      admin: 'danger',
      moderator: 'warning',
      voter: 'info',
      observer: 'secondary'
    };
    return <Badge color={roleColors[role] || 'secondary'}>{role}</Badge>;
  };

  return (
    <div className="admin-users">
      <Row>
        <Colxx xxs="12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3>
              <IntlMessages id="admin.users.title" />
            </h3>
            <Button color="primary" onClick={handleCreateUser}>
              <IntlMessages id="admin.users.create" />
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

      <Row>
        <Colxx xxs="12">
          <Card>
            <CardBody>
              <CardTitle>
                <IntlMessages id="admin.users.list" />
              </CardTitle>
              
              <Table responsive>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Voter ID</th>
                    <th>Constituency</th>
                    <th>Polling Station</th>
                    <th>Voter Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{`${user.firstName} ${user.lastName}`}</td>
                      <td>{user.email}</td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>{getStatusBadge(user.status)}</td>
                      <td>{user.voterId}</td>
                      <td>{user.constituency}</td>
                      <td>{user.pollingStation}</td>
                      <td>{getVoterStatusBadge(user.voterStatus)}</td>
                      <td>{user.lastLogin}</td>
                      <td>
                        <Button
                          size="sm"
                          color="info"
                          className="mr-2"
                          onClick={() => handleEditUser(user)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="10" className="text-center">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Colxx>
      </Row>

      {/* User Modal */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} size="lg">
        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
          {editingUser ? 'Edit User' : 'Create User'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <Row>
              <Colxx xxs="12" md="6">
                <FormGroup>
                  <Label for="firstName">First Name</Label>
                  <Input
                    type="text"
                    id="firstName"
                    value={userForm.firstName}
                    onChange={(e) => setUserForm({...userForm, firstName: e.target.value})}
                  />
                </FormGroup>
              </Colxx>
              <Colxx xxs="12" md="6">
                <FormGroup>
                  <Label for="lastName">Last Name</Label>
                  <Input
                    type="text"
                    id="lastName"
                    value={userForm.lastName}
                    onChange={(e) => setUserForm({...userForm, lastName: e.target.value})}
                  />
                </FormGroup>
              </Colxx>
            </Row>
            
            <Row>
              <Colxx xxs="12" md="6">
                <FormGroup>
                  <Label for="email">Email</Label>
                  <Input
                    type="email"
                    id="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  />
                </FormGroup>
              </Colxx>
              <Colxx xxs="12" md="6">
                <FormGroup>
                  <Label for="phone">Phone</Label>
                  <Input
                    type="tel"
                    id="phone"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                  />
                </FormGroup>
              </Colxx>
            </Row>

            <Row>
              <Colxx xxs="12" md="6">
                <FormGroup>
                  <Label for="role">Role</Label>
                  <Input
                    type="select"
                    id="role"
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                  >
                    <option value="voter">Voter</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="observer">Observer</option>
                  </Input>
                </FormGroup>
              </Colxx>
              <Colxx xxs="12" md="6">
                <FormGroup>
                  <Label for="status">Status</Label>
                  <Input
                    type="select"
                    id="status"
                    value={userForm.status}
                    onChange={(e) => setUserForm({...userForm, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                  </Input>
                </FormGroup>
              </Colxx>
            </Row>

            <Row>
              <Colxx xxs="12" md="6">
                <FormGroup>
                  <Label for="voterId">Voter ID</Label>
                  <Input
                    type="text"
                    id="voterId"
                    value={userForm.voterId}
                    onChange={(e) => setUserForm({...userForm, voterId: e.target.value})}
                  />
                </FormGroup>
              </Colxx>
              <Colxx xxs="12" md="6">
                <FormGroup>
                  <Label for="voterStatus">Voter Status</Label>
                  <Input
                    type="select"
                    id="voterStatus"
                    value={userForm.voterStatus}
                    onChange={(e) => setUserForm({...userForm, voterStatus: e.target.value})}
                  >
                    <option value="registered">Registered</option>
                    <option value="voted">Voted</option>
                    <option value="not_voted">Not Voted</option>
                    <option value="ineligible">Ineligible</option>
                  </Input>
                </FormGroup>
              </Colxx>
            </Row>

            <Row>
              <Colxx xxs="12" md="6">
                <FormGroup>
                  <Label for="constituency">Constituency</Label>
                  <Input
                    type="text"
                    id="constituency"
                    value={userForm.constituency}
                    onChange={(e) => setUserForm({...userForm, constituency: e.target.value})}
                  />
                </FormGroup>
              </Colxx>
              <Colxx xxs="12" md="6">
                <FormGroup>
                  <Label for="pollingStation">Polling Station</Label>
                  <Input
                    type="text"
                    id="pollingStation"
                    value={userForm.pollingStation}
                    onChange={(e) => setUserForm({...userForm, pollingStation: e.target.value})}
                  />
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
            {loading ? 'Saving...' : 'Save User'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default AdminUsers;
