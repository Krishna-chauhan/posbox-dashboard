import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, CardTitle, Button, Alert, Badge, Table, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import { Colxx } from 'components/common/CustomBootstrap';
import IntlMessages from 'helpers/IntlMessages';
import apiService from 'services/api';
import { useParams } from 'react-router-dom';

const ElectionDetails = () => {
  const { id } = useParams();
  const [election, setElection] = useState(null);
  const [voters, setVoters] = useState([]);
  const [activeTab, setActiveTab] = useState('1');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (id) {
      loadElectionDetails();
    }
  }, [id]);

  const loadElectionDetails = async () => {
    try {
      setLoading(true);
      const [electionData, votersData] = await Promise.all([
        apiService.getElectionById(id),
        apiService.getElectionVoters(id)
      ]);
      
      setElection(electionData);
      setVoters(votersData);
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to load election details' });
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
      cancelled: 'danger'
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

  const getTypeBadge = (type) => {
    const typeColors = {
      general: 'primary',
      local: 'info',
      referendum: 'warning'
    };
    return <Badge color={typeColors[type] || 'secondary'}>{type}</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="loading">Loading election details...</div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="text-center p-5">
        <Alert color="danger">Election not found</Alert>
      </div>
    );
  }

  return (
    <div className="election-details">
      <Row>
        <Colxx xxs="12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>{election.title}</h1>
            <div>
              {getTypeBadge(election.type)} {getStatusBadge(election.status)}
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

      {/* Election Overview */}
      <Row className="mb-4">
        <Colxx xxs="12" lg="8">
          <Card>
            <CardBody>
              <CardTitle>Election Overview</CardTitle>
              <p>{election.description}</p>
              <Row>
                <Colxx xxs="6" md="3">
                  <div className="text-center">
                    <h4>{election.totalVoters?.toLocaleString() || 'N/A'}</h4>
                    <small>Total Voters</small>
                  </div>
                </Colxx>
                <Colxx xxs="6" md="3">
                  <div className="text-center">
                    <h4>{election.votesCast?.toLocaleString() || 'N/A'}</h4>
                    <small>Votes Cast</small>
                  </div>
                </Colxx>
                <Colxx xxs="6" md="3">
                  <div className="text-center">
                    <h4>
                      {election.totalVoters && election.votesCast 
                        ? `${((election.votesCast / election.totalVoters) * 100).toFixed(1)}%`
                        : 'N/A'
                      }
                    </h4>
                    <small>Turnout</small>
                  </div>
                </Colxx>
                <Colxx xxs="6" md="3">
                  <div className="text-center">
                    <h4>{election.constituencies?.length || 'N/A'}</h4>
                    <small>Constituencies</small>
                  </div>
                </Colxx>
              </Row>
            </CardBody>
          </Card>
        </Colxx>

        <Colxx xxs="12" lg="4">
          <Card>
            <CardBody>
              <CardTitle>Timeline</CardTitle>
              <p><strong>Start Date:</strong> {election.startDate}</p>
              <p><strong>End Date:</strong> {election.endDate}</p>
              <p><strong>Duration:</strong> {election.duration || 'N/A'}</p>
              <hr />
              <p><strong>Registration Deadline:</strong> {election.registrationDeadline || 'N/A'}</p>
              <p><strong>Early Voting:</strong> {election.earlyVotingStart || 'N/A'} - {election.earlyVotingEnd || 'N/A'}</p>
            </CardBody>
          </Card>
        </Colxx>
      </Row>

      {/* Tabs for different views */}
      <Row>
        <Colxx xxs="12">
          <Card>
            <CardBody>
              <Nav tabs>
                <NavItem>
                  <NavLink
                    className={activeTab === '1' ? 'active' : ''}
                    onClick={() => toggleTab('1')}
                  >
                    Voter Details
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={activeTab === '2' ? 'active' : ''}
                    onClick={() => toggleTab('2')}
                  >
                    Constituencies
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={activeTab === '3' ? 'active' : ''}
                    onClick={() => toggleTab('3')}
                  >
                    Polling Stations
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={activeTab === '4' ? 'active' : ''}
                    onClick={() => toggleTab('4')}
                  >
                    Statistics
                  </NavLink>
                </NavItem>
              </Nav>

              <TabContent activeTab={activeTab} className="mt-4">
                <TabPane tabId="1">
                  <CardTitle>Voter Details</CardTitle>
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Voter ID</th>
                        <th>Constituency</th>
                        <th>Polling Station</th>
                        <th>Status</th>
                        <th>Vote Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voters.map((voter) => (
                        <tr key={voter.id}>
                          <td>{voter.firstName} {voter.lastName}</td>
                          <td>{voter.voterId}</td>
                          <td>{voter.constituency}</td>
                          <td>{voter.pollingStation}</td>
                          <td>{getVoterStatusBadge(voter.voterStatus)}</td>
                          <td>{voter.voteTime || 'N/A'}</td>
                        </tr>
                      ))}
                      {voters.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center">
                            No voter data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </TabPane>

                <TabPane tabId="2">
                  <CardTitle>Constituencies</CardTitle>
                  {election.constituencies && election.constituencies.length > 0 ? (
                    <Table responsive>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Total Voters</th>
                          <th>Votes Cast</th>
                          <th>Turnout %</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {election.constituencies.map((constituency) => (
                          <tr key={constituency.id}>
                            <td>{constituency.name}</td>
                            <td>{constituency.totalVoters?.toLocaleString() || 'N/A'}</td>
                            <td>{constituency.votesCast?.toLocaleString() || 'N/A'}</td>
                            <td>
                              {constituency.totalVoters && constituency.votesCast 
                                ? `${((constituency.votesCast / constituency.totalVoters) * 100).toFixed(1)}%`
                                : 'N/A'
                              }
                            </td>
                            <td>{getStatusBadge(constituency.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <p>No constituency data available</p>
                  )}
                </TabPane>

                <TabPane tabId="3">
                  <CardTitle>Polling Stations</CardTitle>
                  {election.pollingStations && election.pollingStations.length > 0 ? (
                    <Table responsive>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Address</th>
                          <th>Capacity</th>
                          <th>Voters Assigned</th>
                          <th>Votes Cast</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {election.pollingStations.map((station) => (
                          <tr key={station.id}>
                            <td>{station.name}</td>
                            <td>{station.address}</td>
                            <td>{station.capacity?.toLocaleString() || 'N/A'}</td>
                            <td>{station.votersAssigned?.toLocaleString() || 'N/A'}</td>
                            <td>{station.votesCast?.toLocaleString() || 'N/A'}</td>
                            <td>{getStatusBadge(station.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <p>No polling station data available</p>
                  )}
                </TabPane>

                <TabPane tabId="4">
                  <CardTitle>Statistics</CardTitle>
                  <Row>
                    <Colxx xxs="12" md="6">
                      <h5>Voter Demographics</h5>
                      <p><strong>Age Groups:</strong></p>
                      <ul>
                        <li>18-25: {election.stats?.age18to25 || 'N/A'}%</li>
                        <li>26-35: {election.stats?.age26to35 || 'N/A'}%</li>
                        <li>36-50: {election.stats?.age36to50 || 'N/A'}%</li>
                        <li>51+: {election.stats?.age51plus || 'N/A'}%</li>
                      </ul>
                    </Colxx>
                    <Colxx xxs="12" md="6">
                      <h5>Voting Methods</h5>
                      <p><strong>In-Person:</strong> {election.stats?.inPerson || 'N/A'}%</p>
                      <p><strong>Early Voting:</strong> {election.stats?.earlyVoting || 'N/A'}%</p>
                      <p><strong>Mail-in:</strong> {election.stats?.mailIn || 'N/A'}%</p>
                      <p><strong>Electronic:</strong> {election.stats?.electronic || 'N/A'}%</p>
                    </Colxx>
                  </Row>
                </TabPane>
              </TabContent>
            </CardBody>
          </Card>
        </Colxx>
      </Row>
    </div>
  );
};

export default ElectionDetails;
