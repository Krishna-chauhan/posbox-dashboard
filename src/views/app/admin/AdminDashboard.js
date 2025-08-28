import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, CardTitle, Alert, Spinner, Button, Badge } from 'reactstrap';
import { Colxx } from 'components/common/CustomBootstrap';
import IntlMessages from 'helpers/IntlMessages';
import { ThemeColors } from 'helpers/ThemeColors';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const colors = ThemeColors();

  // Analytics data (dummy data)
  const analyticsData = {
    totalElections: 15,
    totalUsers: 2847,
    totalPollingStations: 156,
    activeElections: 3,
    totalVoters: 1250000,
    voterTurnout: 78.5
  };

  // Chart data (dummy data) - using correct format
  const voterTurnoutData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: '',
        data: [65, 72, 68, 75, 82, 78],
        borderColor: colors.themeColor1,
        pointBackgroundColor: colors.foregroundColor,
        pointBorderColor: colors.themeColor1,
        pointHoverBackgroundColor: colors.themeColor1,
        pointHoverBorderColor: colors.foregroundColor,
        pointRadius: 4,
        pointBorderWidth: 2,
        pointHoverRadius: 5,
        fill: true,
        borderWidth: 2,
        backgroundColor: colors.themeColor1_10,
      }
    ]
  };

  const electionTypeData = {
    labels: ['Assembly', 'Parliamentary', 'Local Body'],
    datasets: [
      {
        data: [8, 4, 3],
        borderWidth: 2,
        borderColor: [colors.themeColor1, colors.themeColor2, colors.themeColor3],
        backgroundColor: [
          colors.themeColor1_10,
          colors.themeColor2_10,
          colors.themeColor3_10,
        ],
      }
    ]
  };

  const userRegistrationData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: '',
        data: [120, 190, 300, 250, 200, 180],
        borderColor: colors.themeColor1,
        backgroundColor: colors.themeColor1_10,
        borderWidth: 2,
      }
    ]
  };

  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };

  // Error boundary for child components
  const handleError = (error) => {
    console.error('Admin Dashboard Error:', error);
    setError(error.message || 'An error occurred in the admin dashboard');
  };

  if (error) {
    return (
      <div className="admin-dashboard">
        <Row>
          <Colxx xxs="12">
            <Alert color="danger">
              <h4>Error Loading Admin Dashboard</h4>
              <p>{error}</p>
              <Button color="primary" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </Alert>
          </Colxx>
        </Row>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <Row>
        <Colxx xxs="12">
          <h1 className="mb-4">
            <IntlMessages id="admin.dashboard.title" />
          </h1>
        </Colxx>
      </Row>

      {/* Analytics Overview Cards */}
      <Row className="mb-4">
        <Colxx xxs="12" lg="2" md="4" sm="6">
          <Card className="analytics-card">
            <CardBody className="text-center">
              <div className="analytics-icon bg-primary">
                <i className="simple-icon-calendar text-white"></i>
              </div>
              <h3 className="analytics-number">{analyticsData.totalElections}</h3>
              <p className="analytics-label">Total Elections</p>
              <Badge color="success" className="analytics-badge">
                <i className="simple-icon-arrow-up mr-1"></i>
                +12% this month
              </Badge>
            </CardBody>
          </Card>
        </Colxx>

        <Colxx xxs="12" lg="2" md="4" sm="6">
          <Card className="analytics-card">
            <CardBody className="text-center">
              <div className="analytics-icon bg-success">
                <i className="simple-icon-people text-white"></i>
              </div>
              <h3 className="analytics-number">{analyticsData.totalUsers.toLocaleString()}</h3>
              <p className="analytics-label">Total Users</p>
              <Badge color="success" className="analytics-badge">
                <i className="simple-icon-arrow-up mr-1"></i>
                +8% this month
              </Badge>
            </CardBody>
          </Card>
        </Colxx>

        <Colxx xxs="12" lg="2" md="4" sm="6">
          <Card className="analytics-card">
            <CardBody className="text-center">
              <div className="analytics-icon bg-warning">
                <i className="simple-icon-location-pin text-white"></i>
              </div>
              <h3 className="analytics-number">{analyticsData.totalPollingStations}</h3>
              <p className="analytics-label">Polling Stations</p>
              <Badge color="info" className="analytics-badge">
                <i className="simple-icon-arrow-up mr-1"></i>
                +5% this month
              </Badge>
            </CardBody>
          </Card>
        </Colxx>

        <Colxx xxs="12" lg="2" md="4" sm="6">
          <Card className="analytics-card">
            <CardBody className="text-center">
              <div className="analytics-icon bg-info">
                <i className="simple-icon-check text-white"></i>
              </div>
              <h3 className="analytics-number">{analyticsData.activeElections}</h3>
              <p className="analytics-label">Active Elections</p>
              <Badge color="warning" className="analytics-badge">
                Currently Running
              </Badge>
            </CardBody>
          </Card>
        </Colxx>

        <Colxx xxs="12" lg="2" md="4" sm="6">
          <Card className="analytics-card">
            <CardBody className="text-center">
              <div className="analytics-icon bg-danger">
                <i className="simple-icon-user text-white"></i>
              </div>
              <h3 className="analytics-number">{(analyticsData.totalVoters / 1000000).toFixed(1)}M</h3>
              <p className="analytics-label">Total Voters</p>
              <Badge color="success" className="analytics-badge">
                <i className="simple-icon-arrow-up mr-1"></i>
                +15% this month
              </Badge>
            </CardBody>
          </Card>
        </Colxx>

        <Colxx xxs="12" lg="2" md="4" sm="6">
          <Card className="analytics-card">
            <CardBody className="text-center">
              <div className="analytics-icon bg-secondary">
                <i className="simple-icon-chart text-white"></i>
              </div>
              <h3 className="analytics-number">{analyticsData.voterTurnout}%</h3>
              <p className="analytics-label">Voter Turnout</p>
              <Badge color="success" className="analytics-badge">
                <i className="simple-icon-arrow-up mr-1"></i>
                +3% this month
              </Badge>
            </CardBody>
          </Card>
        </Colxx>
      </Row>

            {/* Charts Row - Temporarily disabled due to chart component issues */}
      <Row className="mb-4">
        <Colxx xxs="12" lg="4" md="6">
          <Card>
            <CardBody>
              <CardTitle>Voter Turnout Trend</CardTitle>
              <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="text-center">
                  <i className="simple-icon-chart" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                  <p className="text-muted mt-2">Chart coming soon</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </Colxx>

        <Colxx xxs="12" lg="4" md="6">
          <Card>
            <CardBody>
              <CardTitle>Election Types Distribution</CardTitle>
              <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="text-center">
                  <i className="simple-icon-pie-chart" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                  <p className="text-muted mt-2">Chart coming soon</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </Colxx>

        <Colxx xxs="12" lg="4" md="12">
          <Card>
            <CardBody>
              <CardTitle>User Registration Trend</CardTitle>
              <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="text-center">
                  <i className="simple-icon-bar-chart" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                  <p className="text-muted mt-2">Chart coming soon</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </Colxx>
      </Row>

      {/* Quick Stats Row */}
      <Row className="mb-4">
        <Colxx xxs="12" lg="3" md="6">
          <Card className="bg-primary text-white">
            <CardBody className="text-center">
              <h4>Recent Activity</h4>
              <p className="mb-0">3 new elections created this week</p>
            </CardBody>
          </Card>
        </Colxx>

        <Colxx xxs="12" lg="3" md="6">
          <Card className="bg-success text-white">
            <CardBody className="text-center">
              <h4>System Health</h4>
              <p className="mb-0">All systems operational</p>
            </CardBody>
          </Card>
        </Colxx>

        <Colxx xxs="12" lg="3" md="6">
          <Card className="bg-warning text-white">
            <CardBody className="text-center">
              <h4>Pending Tasks</h4>
              <p className="mb-0">5 polling stations need verification</p>
            </CardBody>
          </Card>
        </Colxx>

        <Colxx xxs="12" lg="3" md="6">
          <Card className="bg-info text-white">
            <CardBody className="text-center">
              <h4>Performance</h4>
              <p className="mb-0">99.9% uptime this month</p>
            </CardBody>
          </Card>
        </Colxx>
      </Row>

      <style jsx>{`
        .analytics-card {
          transition: transform 0.2s ease-in-out;
        }
        
        .analytics-card:hover {
          transform: translateY(-5px);
        }
        
        .analytics-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 15px;
          font-size: 24px;
        }
        
        .analytics-number {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 5px;
          color: #333;
        }
        
        .analytics-label {
          color: #666;
          margin-bottom: 10px;
          font-size: 0.9rem;
        }
        
        .analytics-badge {
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert color="danger">
          <h4>Something went wrong</h4>
          <p>Please try refreshing the page or contact support if the problem persists.</p>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default AdminDashboard;
