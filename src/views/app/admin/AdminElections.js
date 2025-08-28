import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, CardTitle, Button, Form, FormGroup, Label, Input, Alert, Table, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { Colxx } from 'components/common/CustomBootstrap';
import IntlMessages from 'helpers/IntlMessages';
import apiService from 'services/api';

const AdminElections = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingElection, setEditingElection] = useState(null);
  const [electionForm, setElectionForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'draft',
    type: 'general',
    constituencies: []
  });

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    try {
      setLoading(true);
      const data = await apiService.getElections();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setElections(data);
      } else if (data && Array.isArray(data.data)) {
        setElections(data.data);
      } else if (data && Array.isArray(data.elections)) {
        setElections(data.elections);
      } else {
        console.warn('API returned unexpected data format:', data);
        setElections([]);
      }
    } catch (error) {
      console.error('Failed to load elections:', error);
      setMessage({ type: 'danger', text: 'Failed to load elections. Using demo data.' });
      // Fallback to demo data
      setElections([
        {
          id: 1,
          title: 'General Election 2024',
          description: 'National General Election',
          startDate: '2024-01-15',
          endDate: '2024-01-16',
          status: 'active',
          type: 'general',
          totalVoters: 1500000,
          votesCast: 1200000
        },
        {
          id: 2,
          title: 'Local Council Election',
          description: 'Local Council Election 2024',
          startDate: '2024-03-01',
          endDate: '2024-03-02',
          status: 'upcoming',
          type: 'local',
          totalVoters: 500000,
          votesCast: 0
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateElection = () => {
    setEditingElection(null);
    setElectionForm({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'draft',
      type: 'general',
      constituencies: []
    });
    setModalOpen(true);
  };

  const handleEditElection = (election) => {
    setEditingElection(election);
    setElectionForm({
      title: election.title,
      description: election.description,
      startDate: election.startDate,
      endDate: election.endDate,
      status: election.status,
      type: election.type,
      constituencies: election.constituencies || []
    });
    setModalOpen(true);
  };

  const handleSaveElection = async () => {
    try {
      setLoading(true);
      if (editingElection) {
        await apiService.updateElection(editingElection.id, electionForm);
        setMessage({ type: 'success', text: 'Election updated successfully' });
      } else {
        await apiService.createElection(electionForm);
        setMessage({ type: 'success', text: 'Election created successfully' });
      }
      setModalOpen(false);
      loadElections();
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to save election' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteElection = async (id) => {
    if (window.confirm('Are you sure you want to delete this election?')) {
      try {
        await apiService.deleteElection(id);
        setMessage({ type: 'success', text: 'Election deleted successfully' });
        loadElections();
      } catch (error) {
        setMessage({ type: 'danger', text: 'Failed to delete election' });
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      draft: 'secondary',
      upcoming: 'info',
      active: 'success',
      completed: 'primary',
      cancelled: 'danger'
    };
    return <span className={`badge badge-${statusColors[status] || 'secondary'}`}>{status}</span>;
  };

  return (
    <div className="admin-elections">
      <Row>
        <Colxx xxs="12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3>
              <IntlMessages id="admin.elections.title" />
            </h3>
            <Button color="primary" onClick={handleCreateElection}>
              <IntlMessages id="admin.elections.create" />
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
                <IntlMessages id="admin.elections.list" />
              </CardTitle>
              
              <Table responsive>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th>Total Voters</th>
                    <th>Votes Cast</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {elections.map((election) => (
                    <tr key={election.id}>
                      <td>{election.title}</td>
                      <td>{election.type}</td>
                      <td>{election.startDate}</td>
                      <td>{election.endDate}</td>
                      <td>{getStatusBadge(election.status)}</td>
                      <td>{election.totalVoters?.toLocaleString()}</td>
                      <td>{election.votesCast?.toLocaleString()}</td>
                      <td>
                        <Button
                          size="sm"
                          color="info"
                          className="mr-2"
                          onClick={() => handleEditElection(election)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          onClick={() => handleDeleteElection(election.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {elections.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center">
                        No elections found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Colxx>
      </Row>

      {/* Election Modal */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} size="lg">
        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
          {editingElection ? 'Edit Election' : 'Create Election'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <Row>
              <Colxx xxs="12" md="6">
                <FormGroup>
                  <Label for="title">Title</Label>
                  <Input
                    type="text"
                    id="title"
                    value={electionForm.title}
                    onChange={(e) => setElectionForm({...electionForm, title: e.target.value})}
                  />
                </FormGroup>
              </Colxx>
              <Colxx xxs="12" md="6">
                <FormGroup>
                  <Label for="type">Type</Label>
                  <Input
                    type="select"
                    id="type"
                    value={electionForm.type}
                    onChange={(e) => setElectionForm({...electionForm, type: e.target.value})}
                  >
                    <option value="general">General</option>
                    <option value="local">Local</option>
                    <option value="referendum">Referendum</option>
                  </Input>
                </FormGroup>
              </Colxx>
            </Row>
            
            <FormGroup>
              <Label for="description">Description</Label>
              <Input
                type="textarea"
                id="description"
                value={electionForm.description}
                onChange={(e) => setElectionForm({...electionForm, description: e.target.value})}
              />
            </FormGroup>

            <Row>
              <Colxx xxs="12" md="6">
                <FormGroup>
                  <Label for="startDate">Start Date</Label>
                  <Input
                    type="date"
                    id="startDate"
                    value={electionForm.startDate}
                    onChange={(e) => setElectionForm({...electionForm, startDate: e.target.value})}
                  />
                </FormGroup>
              </Colxx>
              <Colxx xxs="12" md="6">
                <FormGroup>
                  <Label for="endDate">End Date</Label>
                  <Input
                    type="date"
                    id="endDate"
                    value={electionForm.endDate}
                    onChange={(e) => setElectionForm({...electionForm, endDate: e.target.value})}
                  />
                </FormGroup>
              </Colxx>
            </Row>

            <FormGroup>
              <Label for="status">Status</Label>
              <Input
                type="select"
                id="status"
                value={electionForm.status}
                onChange={(e) => setElectionForm({...electionForm, status: e.target.value})}
              >
                <option value="draft">Draft</option>
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Input>
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button color="primary" onClick={handleSaveElection} disabled={loading}>
            {loading ? 'Saving...' : 'Save Election'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default AdminElections;
