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

const VoterManagement = () => {
  const { id: electionId } = useParams();
  const history = useHistory();
  const [voters, setVoters] = useState([]);
  const [filteredVoters, setFilteredVoters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [votersPerPage] = useState(10);

  useEffect(() => {
    loadVoters();
  }, [electionId]);

  useEffect(() => {
    filterVoters();
    setCurrentPage(1); // Reset to first page when search changes
  }, [voters, searchTerm]);

  const loadVoters = async () => {
    try {
      setLoading(true);
      console.log('Loading voters for election:', electionId);
      
      // Make API call to get voters
      const data = await apiService.getElectionVoters(electionId);
      console.log('API response data:', data);
      
      // Handle the API response structure: { status_code, error, message, data: { voters: [...] } }
      if (data && data.data && Array.isArray(data.data.voters)) {
        console.log('Found voters in API response, count:', data.data.voters.length);
        setVoters(data.data.voters);
      } else if (Array.isArray(data)) {
        console.log('Data is already an array, count:', data.length);
        setVoters(data);
      } else {
        console.warn('Unexpected API response format:', data);
        setVoters([]);
      }
    } catch (error) {
      console.error('Failed to load voters:', error);
      setMessage({ type: 'danger', text: 'Failed to load voters. Using demo data.' });
      
      // Fallback to demo data
      setVoters([
        {
          id: 1,
          voter_list_id: 'demo-1',
          serial_number: 1,
          election_id: electionId,
          polling_station_id: 1,
          booth_no: 'B001',
          voter_id: 'NDV1956838',
          voter_full_name_hindi: 'युव राज',
          voter_name_english: 'Yuv Raj',
          related_person_hindi: 'अशोक कुमार',
          related_person_english: 'Ashok Kumar',
          relation: 'Father',
          house_no: '0',
          age: 28,
          gender: 'Male',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterVoters = () => {
    console.log('Filtering voters, total voters:', voters.length);
    console.log('Search term:', searchTerm);
    
    if (!searchTerm.trim()) {
      console.log('No search term, setting all voters as filtered');
      setFilteredVoters(voters);
    } else {
      const filtered = voters.filter(voter => 
        voter.voter_name_english?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voter.voter_full_name_hindi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voter.voter_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voter.booth_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voter.related_person_english?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('Filtered voters count:', filtered.length);
      setFilteredVoters(filtered);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      setSelectedFile(file);
      setMessage({ type: '', text: '' });
    } else {
      setMessage({ type: 'danger', text: 'Please select a valid Excel file (.xlsx)' });
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'danger', text: 'Please select a file to upload' });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await apiService.uploadVoterExcel(selectedFile, electionId);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Show actual message from API response
      let messageText = 'Voter list uploaded successfully!';
      let messageType = 'success';
      
      if (response && response.message) {
        messageText = response.message;
      } else if (response && response.error && response.error.message) {
        messageText = response.error.message;
        messageType = 'danger';
      } else if (response && response.detail) {
        messageText = response.detail;
        messageType = 'danger';
      }
      
      setMessage({ type: messageType, text: messageText });
      setUploadModalOpen(false);
      setSelectedFile(null);
      
      // Reload voters after successful upload
      setTimeout(() => {
        loadVoters();
      }, 1000);
      
    } catch (error) {
      console.error('Upload error:', error);
      let errorMessage = 'Upload failed';
      
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
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Pagination logic
  const indexOfLastVoter = currentPage * votersPerPage;
  const indexOfFirstVoter = indexOfLastVoter - votersPerPage;
  const currentVoters = filteredVoters.slice(indexOfFirstVoter, indexOfLastVoter);
  const totalPages = Math.ceil(filteredVoters.length / votersPerPage);

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

  const getGenderBadge = (gender) => {
    const genderColors = {
      'Male': 'info',
      'Female': 'warning',
      'Other': 'secondary'
    };
    return <Badge color={genderColors[gender] || 'secondary'}>{gender}</Badge>;
  };

  return (
    <div className="voter-management">
      <Row>
        <Colxx xxs="12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="mb-2">Voter Management</h1>
              <p className="text-muted">Election ID: {electionId}</p>
            </div>
            <div>
              <Button color="secondary" onClick={() => history.goBack()} className="mr-2">
                <i className="simple-icon-arrow-left mr-2"></i>
                Back to Elections
              </Button>
              <Button color="primary" onClick={() => setUploadModalOpen(true)}>
                <i className="simple-icon-cloud-upload mr-2"></i>
                Upload Voter List
              </Button>
            </div>
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

      {/* Voters Management */}
      <Row>
        <Colxx xxs="12">
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <CardTitle className="mb-0">
                  Voter List
                </CardTitle>
                <div className="d-flex align-items-center">
                  <span className="mr-2">Total Voters:</span>
                  <Badge color="info">{filteredVoters.length}</Badge>
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
                      placeholder="Search voters by name, voter ID, booth number, or related person..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Colxx>
              </Row>

              {/* Voters Table */}
              {loading ? (
                <div className="text-center py-4">
                  <Spinner color="primary" />
                  <p className="mt-2">Loading voters...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Serial No.</th>
                        <th>Voter ID</th>
                        <th>Name (English)</th>
                        <th>Name (Hindi)</th>
                        <th>Related Person</th>
                        <th>Relation</th>
                        <th>Booth No.</th>
                        <th>Age</th>
                        <th>Gender</th>
                        <th>House No.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentVoters.length > 0 ? (
                        currentVoters.map((voter) => (
                          <tr key={voter.id}>
                            <td>{voter.serial_number}</td>
                            <td>
                              <strong>{voter.voter_id}</strong>
                            </td>
                            <td>{voter.voter_name_english}</td>
                            <td>{voter.voter_full_name_hindi}</td>
                            <td>
                              <div>
                                <div>{voter.related_person_english}</div>
                                <small className="text-muted">{voter.related_person_hindi}</small>
                              </div>
                            </td>
                            <td>{voter.relation}</td>
                            <td>
                              <Badge color="primary">{voter.booth_no}</Badge>
                            </td>
                            <td>{voter.age}</td>
                            <td>{getGenderBadge(voter.gender)}</td>
                            <td>{voter.house_no}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="10" className="text-center py-4">
                            {searchTerm ? 'No voters found matching your search.' : 'No voters available for this election.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
              
              {/* Pagination */}
              {filteredVoters.length > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div className="d-flex align-items-center">
                    <span className="mr-3">
                      Showing {indexOfFirstVoter + 1} to {Math.min(indexOfLastVoter, filteredVoters.length)} of {filteredVoters.length} voters
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

      {/* Upload Modal */}
      <Modal isOpen={uploadModalOpen} toggle={() => setUploadModalOpen(false)} size="lg">
        <ModalHeader toggle={() => setUploadModalOpen(false)}>
          Upload Voter List
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label>Select Excel File (.xlsx)</Label>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <small className="text-muted">
                Please ensure your Excel file contains the required columns: Serial Number, Voter ID, Name (English), Name (Hindi), Related Person, Relation, Booth Number, Age, Gender, House Number
              </small>
            </FormGroup>
            
            {uploading && (
              <div className="mt-3">
                <Label>Upload Progress</Label>
                <Progress value={uploadProgress} color="primary" className="mb-2" />
                <small className="text-muted">Uploading voter list...</small>
              </div>
            )}
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setUploadModalOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button color="primary" onClick={handleUpload} disabled={!selectedFile || uploading}>
            {uploading ? <Spinner size="sm" /> : 'Upload'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default VoterManagement;
