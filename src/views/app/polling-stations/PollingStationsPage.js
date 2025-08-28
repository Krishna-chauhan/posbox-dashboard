import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, CardTitle, Button, Alert, Badge, Input, FormGroup, Label, Modal, ModalHeader, ModalBody, ModalFooter, Table } from 'reactstrap';
import { Colxx } from 'components/common/CustomBootstrap';
import IntlMessages from 'helpers/IntlMessages';
import apiService from 'services/api';

const PollingStationsPage = () => {
  const [pollingStations, setPollingStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConstituency, setSelectedConstituency] = useState('');
  const [constituencies, setConstituencies] = useState([]);

  useEffect(() => {
    loadPollingStations();
  }, []);

  useEffect(() => {
    filterStations();
  }, [pollingStations, searchTerm, selectedConstituency]);

  const loadPollingStations = async () => {
    try {
      setLoading(true);
      const data = await apiService.getPollingStations();
      setPollingStations(data);
      
      // Extract unique constituencies
      const uniqueConstituencies = [...new Set(data.map(station => station.constituency))];
      setConstituencies(uniqueConstituencies);
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to load polling stations' });
    } finally {
      setLoading(false);
    }
  };

  const filterStations = () => {
    let filtered = pollingStations;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(station => 
        station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.constituency.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by constituency
    if (selectedConstituency) {
      filtered = filtered.filter(station => 
        station.constituency === selectedConstituency
      );
    }

    setFilteredStations(filtered);
  };

  const handleViewStation = (station) => {
    setSelectedStation(station);
    setModalOpen(true);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: 'success',
      inactive: 'secondary',
      maintenance: 'warning',
      closed: 'danger'
    };
    return <Badge color={statusColors[status] || 'secondary'}>{status}</Badge>;
  };

  const getDirections = (address) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  return (
    <div className="polling-stations-page">
      <Row>
        <Colxx xxs="12">
          <h1 className="mb-4">
            <IntlMessages id="polling-stations.title" />
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

      {/* Search and Filter */}
      <Row className="mb-4">
        <Colxx xxs="12" md="6">
          <FormGroup>
            <Label for="search">Search Polling Stations</Label>
            <Input
              type="text"
              id="search"
              placeholder="Search by name, address, or constituency..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </FormGroup>
        </Colxx>
        <Colxx xxs="12" md="6">
          <FormGroup>
            <Label for="constituency">Filter by Constituency</Label>
            <Input
              type="select"
              id="constituency"
              value={selectedConstituency}
              onChange={(e) => setSelectedConstituency(e.target.value)}
            >
              <option value="">All Constituencies</option>
              {constituencies.map((constituency) => (
                <option key={constituency} value={constituency}>
                  {constituency}
                </option>
              ))}
            </Input>
          </FormGroup>
        </Colxx>
      </Row>

      <Row>
        <Colxx xxs="12">
          <Card>
            <CardBody>
              <CardTitle>
                <IntlMessages id="polling-stations.list" />
                <span className="ml-2 text-muted">
                  ({filteredStations.length} stations found)
                </span>
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStations.map((station) => (
                    <tr key={station.id}>
                      <td>{station.name}</td>
                      <td>{station.address}</td>
                      <td>{station.constituency}</td>
                      <td>{station.capacity?.toLocaleString() || 'N/A'}</td>
                      <td>{getStatusBadge(station.status)}</td>
                      <td>{station.contactPerson}</td>
                      <td>
                        <Button
                          size="sm"
                          color="info"
                          className="mr-2"
                          onClick={() => handleViewStation(station)}
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          color="success"
                          href={getDirections(station.address)}
                          target="_blank"
                        >
                          Directions
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredStations.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center">
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

      {/* Polling Station Details Modal */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} size="lg">
        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
          {selectedStation?.name}
        </ModalHeader>
        <ModalBody>
          {selectedStation && (
            <div>
              <Row>
                <Colxx xxs="12" md="6">
                  <h5>Station Information</h5>
                  <p><strong>Name:</strong> {selectedStation.name}</p>
                  <p><strong>Address:</strong> {selectedStation.address}</p>
                  <p><strong>Constituency:</strong> {selectedStation.constituency}</p>
                  <p><strong>Status:</strong> {getStatusBadge(selectedStation.status)}</p>
                  <p><strong>Capacity:</strong> {selectedStation.capacity?.toLocaleString() || 'N/A'} voters</p>
                </Colxx>
                <Colxx xxs="12" md="6">
                  <h5>Contact Information</h5>
                  <p><strong>Contact Person:</strong> {selectedStation.contactPerson}</p>
                  <p><strong>Phone:</strong> {selectedStation.contactPhone}</p>
                  <p><strong>Email:</strong> {selectedStation.contactEmail}</p>
                </Colxx>
              </Row>
              
              <Row className="mt-3">
                <Colxx xxs="12">
                  <h5>Voting Statistics</h5>
                  <Row>
                    <Colxx xxs="6" md="3">
                      <div className="text-center">
                        <h4>{selectedStation.totalVoters?.toLocaleString() || 'N/A'}</h4>
                        <small>Total Voters</small>
                      </div>
                    </Colxx>
                    <Colxx xxs="6" md="3">
                      <div className="text-center">
                        <h4>{selectedStation.votesCast?.toLocaleString() || 'N/A'}</h4>
                        <small>Votes Cast</small>
                      </div>
                    </Colxx>
                    <Colxx xxs="6" md="3">
                      <div className="text-center">
                        <h4>
                          {selectedStation.totalVoters && selectedStation.votesCast 
                            ? `${((selectedStation.votesCast / selectedStation.totalVoters) * 100).toFixed(1)}%`
                            : 'N/A'
                          }
                        </h4>
                        <small>Turnout</small>
                      </div>
                    </Colxx>
                    <Colxx xxs="6" md="3">
                      <div className="text-center">
                        <h4>{selectedStation.capacity ? `${((selectedStation.totalVoters || 0) / selectedStation.capacity * 100).toFixed(1)}%` : 'N/A'}</h4>
                        <small>Capacity Used</small>
                      </div>
                    </Colxx>
                  </Row>
                </Colxx>
              </Row>

              <Row className="mt-3">
                <Colxx xxs="12">
                  <h5>Operating Hours</h5>
                  <p><strong>Election Day Hours:</strong> 7:00 AM - 6:00 PM</p>
                  <p><strong>Early Voting:</strong> Available at select locations</p>
                  <p><strong>Accessibility:</strong> Wheelchair accessible, audio ballots available</p>
                </Colxx>
              </Row>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setModalOpen(false)}>
            Close
          </Button>
          <Button 
            color="primary" 
            href={selectedStation ? getDirections(selectedStation.address) : '#'}
            target="_blank"
          >
            Get Directions
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default PollingStationsPage;
