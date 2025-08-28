import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, CardTitle, Button, Form, FormGroup, Label, Input, Alert, Table, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { Colxx } from 'components/common/CustomBootstrap';
import IntlMessages from 'helpers/IntlMessages';
import apiService from 'services/api';

const AdminPollingStations = () => {
  const [pollingStations, setPollingStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [stationForm, setStationForm] = useState({
    name: '',
    address: '',
    constituency: '',
    capacity: 1000,
    status: 'active',
    contactPerson: '',
    contactPhone: '',
    contactEmail: ''
  });

  useEffect(() => {
    loadPollingStations();
  }, []);

  const loadPollingStations = async () => {
    try {
      setLoading(true);
      const data = await apiService.getPollingStations();
      setPollingStations(data);
    } catch (error) {
      console.error('Failed to load polling stations:', error);
      setMessage({ type: 'danger', text: 'Failed to load polling stations. Using demo data.' });
      // Fallback to demo data
      setPollingStations([
        {
          id: 1,
          name: 'Central High School',
          address: '123 Main Street, Downtown',
          constituency: 'Downtown District',
          capacity: 1500,
          status: 'active',
          contactPerson: 'John Smith',
          contactPhone: '+1-555-0123',
          contactEmail: 'john.smith@election.gov',
          totalVoters: 1200,
          votesCast: 850
        },
        {
          id: 2,
          name: 'Community Center',
          address: '456 Oak Avenue, Suburbia',
          constituency: 'Suburban District',
          capacity: 800,
          status: 'active',
          contactPerson: 'Jane Doe',
          contactPhone: '+1-555-0456',
          contactEmail: 'jane.doe@election.gov',
          totalVoters: 750,
          votesCast: 600
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStation = () => {
    setEditingStation(null);
    setStationForm({
      name: '',
      address: '',
      constituency: '',
      capacity: 1000,
      status: 'active',
      contactPerson: '',
      contactPhone: '',
      contactEmail: ''
    });
    setModalOpen(true);
  };

  const handleEditStation = (station) => {
    setEditingStation(station);
    setStationForm({
      name: station.name,
      address: station.address,
      constituency: station.constituency,
      capacity: station.capacity,
      status: station.status,
      contactPerson: station.contactPerson,
      contactPhone: station.contactPhone,
      contactEmail: station.contactEmail
    });
    setModalOpen(true);
  };

  const handleSaveStation = async () => {
    try {
      setLoading(true);
      if (editingStation) {
        await apiService.updatePollingStation(editingStation.id, stationForm);
        setMessage({ type: 'success', text: 'Polling station updated successfully' });
      } else {
        await apiService.createPollingStation(stationForm);
        setMessage({ type: 'success', text: 'Polling station created successfully' });
      }
      setModalOpen(false);
      loadPollingStations();
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to save polling station' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStation = async (id) => {
    if (window.confirm('Are you sure you want to delete this polling station?')) {
      try {
        await apiService.deletePollingStation(id);
        setMessage({ type: 'success', text: 'Polling station deleted successfully' });
        loadPollingStations();
      } catch (error) {
        setMessage({ type: 'danger', text: 'Failed to delete polling station' });
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: 'success',
      inactive: 'secondary',
      maintenance: 'warning',
      closed: 'danger'
    };
    return <span className={`badge badge-${statusColors[status] || 'secondary'}`}>{status}</span>;
  };

  return (
    <div className="admin-polling-stations">
      <Row>
        <Colxx xxs="12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3>
              <IntlMessages id="admin.polling-stations.title" />
            </h3>
            <Button color="primary" onClick={handleCreateStation}>
              <IntlMessages id="admin.polling-stations.create" />
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
                <IntlMessages id="admin.polling-stations.list" />
              </CardTitle>
              
              <Table responsive>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Constituency</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Contact Person</th>
                    <th>Total Voters</th>
                    <th>Votes Cast</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pollingStations.map((station) => (
                    <tr key={station.id}>
                      <td>{station.name}</td>
                      <td>{station.address}</td>
                      <td>{station.constituency}</td>
                      <td>{station.capacity?.toLocaleString()}</td>
                      <td>{getStatusBadge(station.status)}</td>
                      <td>{station.contactPerson}</td>
                      <td>{station.totalVoters?.toLocaleString()}</td>
                      <td>{station.votesCast?.toLocaleString()}</td>
                      <td>
                        <Button
                          size="sm"
                          color="info"
                          className="mr-2"
                          onClick={() => handleEditStation(station)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          onClick={() => handleDeleteStation(station.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {pollingStations.length === 0 && (
                    <tr>
                      <td colSpan="9" className="text-center">
                        No polling stations found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Colxx>
      </Row>

      {/* Polling Station Modal */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} size="lg">
        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
          {editingStation ? 'Edit Polling Station' : 'Create Polling Station'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <Row>
              <Colxx xxs="12" md="6">
                <FormGroup>
                  <Label for="name">Station Name</Label>
                  <Input
                    type="text"
                    id="name"
                    value={stationForm.name}
                    onChange={(e) => setStationForm({...stationForm, name: e.target.value})}
                  />
                </FormGroup>
              </Colxx>
              <Colxx xxs="12" md="6">
                <FormGroup>
                  <Label for="constituency">Constituency</Label>
                  <Input
                    type="text"
                    id="constituency"
                    value={stationForm.constituency}
                    onChange={(e) => setStationForm({...stationForm, constituency: e.target.value})}
                  />
                </FormGroup>
              </Colxx>
            </Row>
            
            <FormGroup>
              <Label for="address">Address</Label>
              <Input
                type="textarea"
                id="address"
                value={stationForm.address}
                onChange={(e) => setStationForm({...stationForm, address: e.target.value})}
              />
            </FormGroup>

            <Row>
              <Colxx xxs="12" md="6">
                <FormGroup>
                  <Label for="capacity">Capacity</Label>
                  <Input
                    type="number"
                    id="capacity"
                    value={stationForm.capacity}
                    onChange={(e) => setStationForm({...stationForm, capacity: parseInt(e.target.value)})}
                  />
                </FormGroup>
              </Colxx>
              <Colxx xxs="12" md="6">
                <FormGroup>
                  <Label for="status">Status</Label>
                  <Input
                    type="select"
                    id="status"
                    value={stationForm.status}
                    onChange={(e) => setStationForm({...stationForm, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="closed">Closed</option>
                  </Input>
                </FormGroup>
              </Colxx>
            </Row>

            <Row>
              <Colxx xxs="12" md="4">
                <FormGroup>
                  <Label for="contactPerson">Contact Person</Label>
                  <Input
                    type="text"
                    id="contactPerson"
                    value={stationForm.contactPerson}
                    onChange={(e) => setStationForm({...stationForm, contactPerson: e.target.value})}
                  />
                </FormGroup>
              </Colxx>
              <Colxx xxs="12" md="4">
                <FormGroup>
                  <Label for="contactPhone">Contact Phone</Label>
                  <Input
                    type="tel"
                    id="contactPhone"
                    value={stationForm.contactPhone}
                    onChange={(e) => setStationForm({...stationForm, contactPhone: e.target.value})}
                  />
                </FormGroup>
              </Colxx>
              <Colxx xxs="12" md="4">
                <FormGroup>
                  <Label for="contactEmail">Contact Email</Label>
                  <Input
                    type="email"
                    id="contactEmail"
                    value={stationForm.contactEmail}
                    onChange={(e) => setStationForm({...stationForm, contactEmail: e.target.value})}
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
          <Button color="primary" onClick={handleSaveStation} disabled={loading}>
            {loading ? 'Saving...' : 'Save Station'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default AdminPollingStations;
