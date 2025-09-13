import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Card,
  CardBody,
  CardTitle,
  Row,
  Col,
  Table,
  Badge,
  Alert,
  Spinner,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Progress
} from 'reactstrap';
import { Colxx } from 'components/common/CustomBootstrap';
import IntlMessages from 'helpers/IntlMessages';
import apiService from 'services/api';

const ElectionFullDetails = ({ isOpen, toggle, electionId }) => {
  const [election, setElection] = useState(null);
  const [pollingStations, setPollingStations] = useState([]);
  const [voters, setVoters] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('1');

  useEffect(() => {
    if (isOpen && electionId) {
      loadElectionFullDetails();
    }
  }, [isOpen, electionId]);

  const loadElectionFullDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load election details
      const electionData = await apiService.getElectionById(electionId);
      console.log('Election details API response:', electionData);
      
      // Handle the API response structure - try different possible structures
      let processedElectionData = electionData;
      
      if (electionData) {
        // Check for standard API response format with nested election data
        if (electionData.status_code === 200 && electionData.data && electionData.data.election) {
          processedElectionData = electionData.data.election;
        }
        // Check for standard API response format with direct data
        else if (electionData.status_code === 200 && electionData.data) {
          processedElectionData = electionData.data;
        }
        // Check for nested data structure
        else if (electionData.data && electionData.data.election) {
          processedElectionData = electionData.data.election;
        }
        // Check for direct data
        else if (electionData.data) {
          processedElectionData = electionData.data;
        }
        // Use direct response if it has election properties
        else if (electionData.id || electionData.name) {
          processedElectionData = electionData;
        }
      }
      
      console.log('Processed election data:', processedElectionData);
      setElection(processedElectionData);
      
      // Load polling stations - check multiple possible locations
      let pollingStationsData = [];
      
      // First check the original API response data structure
      if (electionData && electionData.data && electionData.data.polling_stations) {
        pollingStationsData = electionData.data.polling_stations;
      } else if (electionData && electionData.data && electionData.data.pollingStations) {
        pollingStationsData = electionData.data.pollingStations;
      }
      // Then check the processed election data
      else if (processedElectionData.polling_stations) {
        pollingStationsData = processedElectionData.polling_stations;
      } else if (processedElectionData.pollingStations) {
        pollingStationsData = processedElectionData.pollingStations;
      } else if (processedElectionData.stations) {
        pollingStationsData = processedElectionData.stations;
      }
      
      console.log('Polling stations data:', pollingStationsData);
      setPollingStations(Array.isArray(pollingStationsData) ? pollingStationsData : []);
      
      // Load summary data if available
      if (electionData && electionData.data && electionData.data.summary) {
        console.log('Summary data:', electionData.data.summary);
        setSummary(electionData.data.summary);
      } else {
        setSummary(null);
      }
      
      // Load voters for this election
      try {
        const votersData = await apiService.getElectionVoters(electionId);
        console.log('Voters API response:', votersData);
        
        // Handle the API response structure for voters
        let processedVotersData = votersData;
        if (votersData && votersData.status_code === 200 && votersData.data && votersData.data.voters) {
          processedVotersData = votersData.data.voters;
        } else if (votersData && votersData.data && votersData.data.voters) {
          processedVotersData = votersData.data.voters;
        } else if (Array.isArray(votersData)) {
          processedVotersData = votersData;
        }
        
        setVoters(processedVotersData);
      } catch (voterError) {
        console.log('No voters data available:', voterError);
        setVoters([]);
      }
      
    } catch (error) {
      setError('Failed to load election details');
      console.error('Error loading election details:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      draft: 'secondary',
      upcoming: 'info',
      active: 'success',
      completed: 'primary',
      cancelled: 'danger',
      open: 'success',
      closed: 'secondary',
      maintenance: 'warning'
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

  const calculateTurnoutPercentage = (votesCast, totalVoters) => {
    if (!totalVoters || totalVoters === 0) return 0;
    return ((votesCast / totalVoters) * 100).toFixed(1);
  };

  const getOverallStatistics = () => {
    // Use summary data if available, otherwise calculate from polling stations
    if (summary) {
      return {
        totalVoters: summary.total_voters || 0,
        totalVotesCast: 0, // Not available in summary
        totalMaleVoters: summary.gender_distribution?.male || 0,
        totalFemaleVoters: summary.gender_distribution?.female || 0,
        totalValidVotes: 0, // Not available in summary
        totalInvalidVotes: 0, // Not available in summary
        turnoutPercentage: 0, // Cannot calculate without votes cast
        totalPollingStations: summary.total_polling_stations || 0,
        totalBooths: summary.total_booths || 0
      };
    }
    
    if (!pollingStations.length) return null;
    
    const totalVoters = pollingStations.reduce((sum, station) => sum + (station.total_voters || station.voters_count || station.assigned_voters || 0), 0);
    const totalVotesCast = pollingStations.reduce((sum, station) => {
      const stats = station.statistics || station.stats || {};
      return sum + (stats.total_votes_cast || stats.votes_cast || stats.total_votes || 0);
    }, 0);
    const totalMaleVoters = pollingStations.reduce((sum, station) => {
      const stats = station.statistics || station.stats || {};
      return sum + (stats.male_voters || stats.male_count || 0);
    }, 0);
    const totalFemaleVoters = pollingStations.reduce((sum, station) => {
      const stats = station.statistics || station.stats || {};
      return sum + (stats.female_voters || stats.female_count || 0);
    }, 0);
    const totalValidVotes = pollingStations.reduce((sum, station) => {
      const stats = station.statistics || station.stats || {};
      return sum + (stats.valid_votes || stats.valid_count || 0);
    }, 0);
    const totalInvalidVotes = pollingStations.reduce((sum, station) => {
      const stats = station.statistics || station.stats || {};
      return sum + (stats.invalid_votes || stats.invalid_count || 0);
    }, 0);

    return {
      totalVoters,
      totalVotesCast,
      totalMaleVoters,
      totalFemaleVoters,
      totalValidVotes,
      totalInvalidVotes,
      turnoutPercentage: calculateTurnoutPercentage(totalVotesCast, totalVoters),
      totalPollingStations: pollingStations.length,
      totalBooths: pollingStations.reduce((sum, station) => sum + (station.booth_count || station.booths || 0), 0)
    };
  };

  const overallStats = getOverallStatistics();

  if (loading) {
    return (
      <Modal isOpen={isOpen} toggle={toggle} size="xl">
        <ModalHeader toggle={toggle}>Election Details</ModalHeader>
        <ModalBody className="text-center">
          <Spinner color="primary" />
          <p className="mt-2">Loading election details...</p>
        </ModalBody>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="xl">
      <ModalHeader toggle={toggle}>
        {election ? `Election Details: ${election.name}` : 'Election Details'}
      </ModalHeader>
      <ModalBody>
        {error && <Alert color="danger">{error}</Alert>}
        
        {election && (
          <>
            {/* Election Overview */}
            <Card className="mb-4">
              <CardBody>
                <Row>
                  <Col md="6">
                    <h5>Election Information</h5>
                    <p><strong>Name:</strong> {election.name || election.title || election.election_name || 'N/A'}</p>
                    <p><strong>Type:</strong> {election.type || election.election_type || 'N/A'}</p>
                    <p><strong>Reservation Type:</strong> {election.reservation_type || election.reservation || 'N/A'}</p>
                    <p><strong>Election Date:</strong> {election.election_date || election.date || election.start_date || 'N/A'}</p>
                  </Col>
                  <Col md="6">
                    <h5>Additional Details</h5>
                    <p><strong>Qualifying Date:</strong> {election.qualifying_date || election.qualification_date || 'N/A'}</p>
                    <p><strong>Number of Electors:</strong> {(election.number_of_electors || election.total_electors || election.electors_count || 0).toLocaleString()}</p>
                    <p><strong>Date of Publication:</strong> {election.date_of_publication || election.publication_date || 'N/A'}</p>
                    <p><strong>Type of Revision:</strong> {election.type_of_revision || election.revision_type || 'N/A'}</p>
                  </Col>
                </Row>
              </CardBody>
            </Card>

            {/* Overall Statistics */}
            {overallStats && (
              <Card className="mb-4">
                <CardBody>
                  <h5>Overall Statistics</h5>
                  <Row>
                    <Col md="3">
                      <div className="text-center">
                        <h4 className="text-primary">{overallStats.totalVoters.toLocaleString()}</h4>
                        <p className="mb-0">Total Voters</p>
                      </div>
                    </Col>
                    <Col md="3">
                      <div className="text-center">
                        <h4 className="text-success">{overallStats.totalVotesCast.toLocaleString()}</h4>
                        <p className="mb-0">Votes Cast</p>
                      </div>
                    </Col>
                    <Col md="3">
                      <div className="text-center">
                        <h4 className="text-info">{overallStats.turnoutPercentage}%</h4>
                        <p className="mb-0">Turnout</p>
                      </div>
                    </Col>
                    <Col md="3">
                      <div className="text-center">
                        <h4 className="text-warning">{overallStats?.totalPollingStations || pollingStations.length}</h4>
                        <p className="mb-0">Polling Stations</p>
                      </div>
                    </Col>
                  </Row>
                  <Row className="mt-3">
                    <Col md="6">
                      <p><strong>Male Voters:</strong> {overallStats.totalMaleVoters.toLocaleString()}</p>
                      <p><strong>Female Voters:</strong> {overallStats.totalFemaleVoters.toLocaleString()}</p>
                    </Col>
                    <Col md="6">
                      <p><strong>Valid Votes:</strong> {overallStats.totalValidVotes.toLocaleString()}</p>
                      <p><strong>Invalid Votes:</strong> {overallStats.totalInvalidVotes.toLocaleString()}</p>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            )}

            {/* Tabs for detailed views */}
            <Nav tabs>
              <NavItem>
                <NavLink
                  className={activeTab === '1' ? 'active' : ''}
                  onClick={() => toggleTab('1')}
                >
                  Polling Stations
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={activeTab === '2' ? 'active' : ''}
                  onClick={() => toggleTab('2')}
                >
                  Voters
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={activeTab === '3' ? 'active' : ''}
                  onClick={() => toggleTab('3')}
                >
                  Statistics
                </NavLink>
              </NavItem>
              {summary && (
                <NavItem>
                  <NavLink
                    className={activeTab === '4' ? 'active' : ''}
                    onClick={() => toggleTab('4')}
                  >
                    Summary
                  </NavLink>
                </NavItem>
              )}
            </Nav>

            <TabContent activeTab={activeTab} className="mt-4">
              {/* Polling Stations Tab */}
              <TabPane tabId="1">
                <CardTitle>Polling Stations Details</CardTitle>
                {pollingStations.length > 0 ? (
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Station Name</th>
                        <th>Address</th>
                        <th>Location</th>
                        <th>Booths</th>
                        <th>Total Voters</th>
                        <th>Votes Cast</th>
                        <th>Turnout %</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pollingStations.map((station) => {
                        const stats = station.statistics || station.stats || {};
                        const votesCast = stats.total_votes_cast || stats.votes_cast || stats.total_votes || 0;
                        const totalVoters = station.total_voters || station.voters_count || station.assigned_voters || 0;
                        const turnout = calculateTurnoutPercentage(votesCast, totalVoters);
                        
                        return (
                          <tr key={station.id || station.station_id}>
                            <td>{station.name || station.station_name || station.title || 'N/A'}</td>
                            <td>{station.address || station.station_address || 'N/A'}</td>
                            <td>{station.location || station.station_location || 'N/A'}</td>
                            <td>{station.booth_count || station.booths || station.total_booths || 'N/A'}</td>
                            <td>{totalVoters.toLocaleString()}</td>
                            <td>{votesCast.toLocaleString()}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <span className="mr-2">{turnout}%</span>
                                <Progress 
                                  value={parseFloat(turnout)} 
                                  color={parseFloat(turnout) > 70 ? 'success' : parseFloat(turnout) > 50 ? 'warning' : 'danger'}
                                  style={{ width: '60px', height: '8px' }}
                                />
                              </div>
                            </td>
                            <td>{getStatusBadge(station.status || 'active')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                ) : (
                  <Alert color="info">
                    No polling stations data available for this election.
                  </Alert>
                )}
              </TabPane>

              {/* Voters Tab */}
              <TabPane tabId="2">
                <CardTitle>Voter Details</CardTitle>
                {voters.length > 0 ? (
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Voter ID</th>
                        <th>Name (English)</th>
                        <th>Name (Hindi)</th>
                        <th>Related Person</th>
                        <th>Relation</th>
                        <th>Age</th>
                        <th>Gender</th>
                        <th>House No</th>
                        <th>Booth No</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voters.map((voter) => (
                        <tr key={voter.id}>
                          <td>{voter.voter_id}</td>
                          <td>{voter.voter_name_english}</td>
                          <td>{voter.voter_full_name_hindi}</td>
                          <td>{voter.related_person_english}</td>
                          <td>{voter.relation}</td>
                          <td>{voter.age}</td>
                          <td>{voter.gender}</td>
                          <td>{voter.house_no}</td>
                          <td>{voter.booth_no}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <Alert color="info">
                    No voter data available for this election.
                  </Alert>
                )}
              </TabPane>

              {/* Statistics Tab */}
              <TabPane tabId="3">
                <CardTitle>Detailed Statistics</CardTitle>
                {pollingStations.length > 0 ? (
                  <div>
                    {pollingStations.map((station) => {
                      const stats = station.statistics || station.stats || {};
                      return (
                        <Card key={station.id || station.station_id} className="mb-3">
                          <CardBody>
                            <h6>{station.name || station.station_name || station.title || 'Unnamed Station'}</h6>
                            <Row>
                              <Col md="4">
                                <h6>Voter Demographics</h6>
                                <p><strong>Male Voters:</strong> {stats.male_voters || stats.male_count || 0}</p>
                                <p><strong>Female Voters:</strong> {stats.female_voters || stats.female_count || 0}</p>
                                <p><strong>Other Voters:</strong> {stats.other_voters || stats.other_count || 0}</p>
                              </Col>
                              <Col md="4">
                                <h6>Voting Statistics</h6>
                                <p><strong>Total Votes Cast:</strong> {stats.total_votes_cast || stats.votes_cast || stats.total_votes || 0}</p>
                                <p><strong>Valid Votes:</strong> {stats.valid_votes || stats.valid_count || 0}</p>
                                <p><strong>Invalid Votes:</strong> {stats.invalid_votes || stats.invalid_count || 0}</p>
                              </Col>
                              <Col md="4">
                                <h6>Turnout Analysis</h6>
                                <p><strong>Total Voters:</strong> {station.total_voters || station.voters_count || station.assigned_voters || 0}</p>
                                <p><strong>Turnout:</strong> {calculateTurnoutPercentage(stats.total_votes_cast || stats.votes_cast || 0, station.total_voters || station.voters_count)}%</p>
                                <p><strong>Booths:</strong> {station.booth_count || station.booths || station.total_booths || 0}</p>
                              </Col>
                            </Row>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Alert color="info">
                    No statistics data available for this election.
                  </Alert>
                )}
              </TabPane>

              {/* Summary Tab */}
              {summary && (
                <TabPane tabId="4">
                  <CardTitle>Election Summary</CardTitle>
                  <Row>
                    <Col md="6">
                      <Card className="mb-3">
                        <CardBody>
                          <h6>Polling Station Overview</h6>
                          <p><strong>Total Polling Stations:</strong> {summary.total_polling_stations}</p>
                          <p><strong>Total Booths:</strong> {summary.total_booths}</p>
                          <p><strong>Total Voters:</strong> {summary.total_voters}</p>
                          <p><strong>Total Voter Stats Records:</strong> {summary.total_voter_stats_records}</p>
                        </CardBody>
                      </Card>
                    </Col>
                    <Col md="6">
                      <Card className="mb-3">
                        <CardBody>
                          <h6>Polling Station Status</h6>
                          <p><strong>Active:</strong> {summary.polling_station_status?.active || 0}</p>
                          <p><strong>Inactive:</strong> {summary.polling_station_status?.inactive || 0}</p>
                          <p><strong>No Voters:</strong> {summary.polling_station_status?.no_voters || 0}</p>
                        </CardBody>
                      </Card>
                    </Col>
                  </Row>
                  <Row>
                    <Col md="6">
                      <Card className="mb-3">
                        <CardBody>
                          <h6>Gender Distribution</h6>
                          <p><strong>Male:</strong> {summary.gender_distribution?.male || 0}</p>
                          <p><strong>Female:</strong> {summary.gender_distribution?.female || 0}</p>
                          <p><strong>Third Gender:</strong> {summary.gender_distribution?.third_gender || 0}</p>
                        </CardBody>
                      </Card>
                    </Col>
                    <Col md="6">
                      <Card className="mb-3">
                        <CardBody>
                          <h6>Age Demographics</h6>
                          <p><strong>18-25:</strong> {summary.age_demographics?.['18-25'] || 0}</p>
                          <p><strong>26-35:</strong> {summary.age_demographics?.['26-35'] || 0}</p>
                          <p><strong>36-50:</strong> {summary.age_demographics?.['36-50'] || 0}</p>
                          <p><strong>51-65:</strong> {summary.age_demographics?.['51-65'] || 0}</p>
                          <p><strong>65+:</strong> {summary.age_demographics?.['65+'] || 0}</p>
                        </CardBody>
                      </Card>
                    </Col>
                  </Row>
                </TabPane>
              )}
            </TabContent>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <button className="btn btn-secondary" onClick={toggle}>
          Close
        </button>
      </ModalFooter>
    </Modal>
  );
};

export default ElectionFullDetails;
