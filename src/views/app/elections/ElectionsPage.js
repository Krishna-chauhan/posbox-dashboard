import React, { useState, useEffect } from 'react';
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
  Spinner,
  Progress
} from 'reactstrap';
import { Colxx } from 'components/common/CustomBootstrap';
import IntlMessages from 'helpers/IntlMessages';
import apiService from 'services/api';
import ElectionWizard from 'components/elections/ElectionWizard';
import ElectionFullDetails from 'components/elections/ElectionFullDetails';

const ElectionsPage = () => {
  const [elections, setElections] = useState([]);
  const [filteredElections, setFilteredElections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingElection, setEditingElection] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [fullDetailsOpen, setFullDetailsOpen] = useState(false);
  const [selectedElectionId, setSelectedElectionId] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [electionsPerPage] = useState(10);


  useEffect(() => {
    loadElections();
  }, []);

  useEffect(() => {
    filterElections();
    setCurrentPage(1); // Reset to first page when search changes
  }, [elections, searchTerm]);

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
          election_id: 'demo-1',
          name: 'General Election 2024',
          type: 'Assembly Constituency',
          reservation_type: 'general',
          election_date: '2024-12-15',
          qualifying_date: '2024-10-15',
          number_of_electors: 50000,
          date_of_publication: '2024-09-15',
          type_of_revision: 'Final',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterElections = () => {
    if (!searchTerm.trim()) {
      setFilteredElections(elections);
    } else {
      const filtered = elections.filter(election => 
        election.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        election.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        election.reservation_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        election.election_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredElections(filtered);
    }
  };

  const handleAddElection = () => {
    setWizardOpen(true);
  };

  const handleEditElection = (election) => {
    setEditingElection(election);
    setWizardOpen(true);
  };

  const handleWizardComplete = (response) => {
    setWizardOpen(false);
    setEditingElection(null);
    setMessage({ type: 'success', text: response?.message || (editingElection ? 'Election updated successfully' : 'Election created successfully') });
    loadElections();
  };

  const handleWizardCancel = () => {
    setWizardOpen(false);
    setEditingElection(null);
  };

  const handleViewFullDetails = (electionId) => {
    setSelectedElectionId(electionId);
    setFullDetailsOpen(true);
  };

  const handleCloseFullDetails = () => {
    setFullDetailsOpen(false);
    setSelectedElectionId(null);
  };


  const handleDeleteElection = async (election_id) => {
    if (window.confirm('Are you sure you want to delete this election?')) {
      try {
        await apiService.deleteElection(election_id);
        setMessage({ type: 'success', text: 'Election deleted successfully' });
        loadElections();
      } catch (error) {
        setMessage({ type: 'danger', text: 'Failed to delete election' });
      }
    }
  };

  // Pagination logic
  const indexOfLastElection = currentPage * electionsPerPage;
  const indexOfFirstElection = indexOfLastElection - electionsPerPage;
  const currentElections = filteredElections.slice(indexOfFirstElection, indexOfLastElection);
  const totalPages = Math.ceil(filteredElections.length / electionsPerPage);

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

  const getStatusBadge = (status) => {
    const statusColors = {
      active: 'success',
      upcoming: 'info',
      completed: 'primary',
      cancelled: 'danger'
    };
    return <Badge color={statusColors[status] || 'secondary'}>{status}</Badge>;
  };

  const getTypeBadge = (type) => {
    const typeColors = {
      'Assembly Constituency': 'info',
      'Parliamentary Constituency': 'warning',
      'Local Body': 'success'
    };
    return <Badge color={typeColors[type] || 'secondary'}>{type}</Badge>;
  };

  const getReservationBadge = (reservation) => {
    const reservationColors = {
      general: 'success',
      sc: 'warning',
      st: 'danger',
      obc: 'info'
    };
    return <Badge color={reservationColors[reservation] || 'secondary'}>{reservation.toUpperCase()}</Badge>;
  };


  return (
    <div className="elections-page">
      <Row>
        <Colxx xxs="12">
          <h1 className="mb-4">
            <IntlMessages id="elections.title" />
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

      {/* Elections Management */}
      <Row>
        <Colxx xxs="12">
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <CardTitle className="mb-0">
                  <IntlMessages id="elections.list" />
                </CardTitle>
                <Button color="primary" onClick={handleAddElection}>
                  <i className="simple-icon-plus mr-2"></i>
                  Add Election
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
                      placeholder="Search elections by name, type, or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Colxx>
                <Colxx xxs="12" md="6" className="d-flex justify-content-end">
                  <div className="d-flex align-items-center">
                    <span className="mr-2">Total Elections:</span>
                    <Badge color="info">{filteredElections.length}</Badge>
                  </div>
                </Colxx>
              </Row>

              {/* Elections Table */}
              {loading ? (
                <div className="text-center py-4">
                  <Spinner color="primary" />
                  <p className="mt-2">Loading elections...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Election ID</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Reservation</th>
                        <th>Election Date</th>
                        <th>Electors</th>
                        <th>Created At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentElections.length > 0 ? (
                        currentElections.map((election) => (
                          <tr key={election.id}>
                            <td>
                              <small className="text-muted">{election.election_id || election.id}</small>
                            </td>
                            <td>
                              <strong>{election.name}</strong>
                            </td>
                            <td>{getTypeBadge(election.type)}</td>
                            <td>{getReservationBadge(election.reservation_type)}</td>
                            <td>
                              <small>{new Date(election.election_date).toLocaleDateString()}</small>
                            </td>
                            <td>
                              <Badge color="info">{election.number_of_electors.toLocaleString()}</Badge>
                            </td>
                            <td>
                              <small>{new Date(election.created_at).toLocaleDateString()}</small>
                            </td>
                                                         <td>
                               <div className="btn-group" role="group">
                                 <Button
                                   color="primary"
                                   size="sm"
                                   onClick={() => handleViewFullDetails(election.election_id || election.id)}
                                   className="mr-1"
                                   title="View full election details with polling stations and statistics"
                                 >
                                   <i className="simple-icon-eye"></i>
                                 </Button>
                                 <Button
                                   color="success"
                                   size="sm"
                                   onClick={() => window.location.href = `/app/elections/${election.election_id || election.id}/voters`}
                                   className="mr-1"
                                 >
                                   Voters
                                 </Button>
                                 <Button
                                   color="info"
                                   size="sm"
                                   onClick={() => handleEditElection(election)}
                                   className="mr-1"
                                 >
                                   Edit
                                 </Button>
                                 <Button
                                   color="danger"
                                   size="sm"
                                   onClick={() => handleDeleteElection(election.election_id)}
                                 >
                                   Delete
                                 </Button>
                               </div>
                             </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center py-4">
                            {searchTerm ? 'No elections found matching your search.' : 'No elections available.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
              
              {/* Pagination */}
              {filteredElections.length > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div className="d-flex align-items-center">
                    <span className="mr-3">
                      Showing {indexOfFirstElection + 1} to {Math.min(indexOfLastElection, filteredElections.length)} of {filteredElections.length} elections
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

      {/* Add/Edit Election Wizard Modal */}
      <Modal isOpen={wizardOpen} toggle={handleWizardCancel} size="xl">
        <ModalHeader toggle={handleWizardCancel}>
          {editingElection ? 'Edit Election' : 'Create New Election'}
        </ModalHeader>
        <ModalBody>
          <ElectionWizard 
            onComplete={handleWizardComplete}
            onCancel={handleWizardCancel}
            existingElection={editingElection}
          />
        </ModalBody>
      </Modal>


      {/* Full Election Details Modal */}
      <ElectionFullDetails 
        isOpen={fullDetailsOpen}
        toggle={handleCloseFullDetails}
        electionId={selectedElectionId}
      />
    </div>
  );
};

export default ElectionsPage;
