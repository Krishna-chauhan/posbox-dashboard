import React, { useState } from 'react';
import { 
  Card, 
  CardBody, 
  Form, 
  FormGroup, 
  Input, 
  Label, 
  Row, 
  Col, 
  Button,
  Alert,
  Table,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from 'reactstrap';
import { Wizard, Steps, Step } from 'react-albus';
import { injectIntl } from 'react-intl';
import IntlMessages from 'helpers/IntlMessages';
import BottomNavigation from 'components/wizard/BottomNavigation';
import TopNavigation from 'components/wizard/TopNavigation';
import apiService from 'services/api';

const ElectionWizard = ({ intl, onComplete, onCancel, existingElection = null }) => {
  const { messages } = intl;

  // Step 1: Election Details
  const [electionForm, setElectionForm] = useState({
    name: existingElection?.name || '',
    type: existingElection?.type || 'Assembly Constituency',
    reservation_type: existingElection?.reservation_type || 'general',
    election_date: existingElection?.election_date || new Date().toISOString().split('T')[0], // Today's date
    qualifying_date: existingElection?.qualifying_date || new Date().toISOString().split('T')[0], // Today's date
    number_of_electors: existingElection?.number_of_electors || 1,
    date_of_publication: existingElection?.date_of_publication || new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
    type_of_revision: existingElection?.type_of_revision || ''
  });

  // Step 2: Polling Stations
  const [pollingStations, setPollingStations] = useState([]);
  const [stationForm, setStationForm] = useState({
    name: '',
    address: '',
    booth_count: 1,
    total_voters: 0,
    location: '',
    polling_station_number: '',
    election_id: '' // Hidden field to store election ID
  });
  const [stationModalOpen, setStationModalOpen] = useState(false);

  // Step 3: Statistics
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [message, setMessage] = useState(null);
  const [electionResponse, setElectionResponse] = useState(null);
  const [electionCreated, setElectionCreated] = useState(false);
  const [currentStep, setCurrentStep] = useState('step1');
  const [selectedStationForStats, setSelectedStationForStats] = useState(null);
  const [statsModalOpen, setStatsModalOpen] = useState(false);

  const topNavClick = (stepItem, push) => {
    push(stepItem.id);
  };

  // Create or update election after Step 1
  const createElection = async () => {
    try {
      setLoading(true);
      setError('');
      setProgress(existingElection ? 'Updating election...' : 'Creating election...');

      // Validate election form
      if (!validateElectionForm()) {
        setLoading(false);
        return false;
      }

      console.log(existingElection ? 'Updating election with data:' : 'Creating election with data:', electionForm);
      const response = existingElection 
        ? await apiService.updateElection(existingElection.election_id || existingElection.id, electionForm)
        : await apiService.createElection(electionForm);
      console.log('Election API response:', response);
      console.log('Election response structure:', {
        status_code: response?.status_code,
        data: response?.data,
        id: response?.id,
        'data.id': response?.data?.id,
        'data.election_id': response?.data?.election_id,
        'data.election': response?.data?.election,
        'data.election.id': response?.data?.election?.id
      });
      console.log('Full response keys:', Object.keys(response || {}));
      if (response?.data) {
        console.log('Response data keys:', Object.keys(response.data));
        if (response.data.election) {
          console.log('Response data.election keys:', Object.keys(response.data.election));
        }
      }
      
      if (!response || (response.status_code !== 200 && response.status_code !== 201)) {
        console.error('Election creation failed:', response);
        setError(response?.message || 'Failed to create election');
        setLoading(false);
        return false;
      }

      setElectionResponse(response);
      setElectionCreated(true);
      
      // Extract and store election ID in the station form - prioritize UUID
      let electionId = existingElection?.election_id || 
                      existingElection?.id || 
                      response.data?.election_id || 
                      response.data?.election?.election_id ||
                      response.data?.election?.id ||
                      response.data?.id || 
                      response.id || 
                      response.election_id;
      
      console.log('Storing election ID in form:', electionId);
      console.log('Election ID type:', typeof electionId);
      console.log('Election ID length:', electionId ? electionId.length : 'undefined');
      
      // Store election ID in station form for use in polling station creation
      setStationForm(prev => {
        const updatedForm = {
          ...prev,
          election_id: electionId
        };
        console.log('Updated station form with election_id:', updatedForm);
        console.log('Election ID stored in form:', updatedForm.election_id);
        return updatedForm;
      });
      
      setProgress(existingElection ? 'Election updated successfully!' : 'Election created successfully!');
      setLoading(false);
      
      // Automatically move to next step after successful election creation
      setTimeout(() => {
        setCurrentStep('step2');
        setProgress('');
      }, 1500); // Wait 1.5 seconds to show success message
      
      return true;
    } catch (error) {
      console.error('Error creating election:', error);
      setError(error.message || 'Failed to create election');
      setLoading(false);
      return false;
    }
  };

  const onClickNext = async (goToNext, steps, step) => {
    step.isDone = true;
    
    // If moving from Step 1 to Step 2, create the election first
    if (step.id === 'step1' && !electionCreated) {
      const success = await createElection();
      if (!success) {
        return; // Don't proceed if election creation failed
      }
    }
    
    if (steps.length - 1 <= steps.indexOf(step)) {
      return;
    }
    goToNext();
  };

  const onClickPrev = (goToPrev, steps, step) => {
    if (steps.indexOf(step) <= 0) {
      return;
    }
    goToPrev();
  };

  // Step 1: Election Details Handlers
  const handleElectionFormChange = (field, value) => {
    setElectionForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateElectionForm = () => {
    const required = ['name', 'election_date', 'qualifying_date'];
    for (const field of required) {
      if (!electionForm[field]) {
        setError(`Please fill in ${field.replace('_', ' ')}`);
        return false;
      }
    }
    setError('');
    return true;
  };

  // Step 2: Polling Station Handlers
  const handleAddStation = async () => {
    if (!stationForm.polling_station_number || !stationForm.name || !stationForm.address) {
      setError('Please fill in polling station number, station name and address');
      return;
    }

    if (!electionCreated || !electionResponse) {
      setError('Election must be created first. Please go back to Step 1.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');

      // Get election ID from the form (stored when election was created)
      const electionId = stationForm.election_id;
      
      console.log('Election ID from form:', electionId);
      console.log('Station form:', stationForm);
      
      // Validate that we have an election ID
      if (!electionId) {
        throw new Error('Election ID not found in form. Please create election first.');
      }
      
      const stationData = {
        polling_station_number: stationForm.polling_station_number,
        number: stationForm.polling_station_number, // Add number key with polling station number value
        name: stationForm.name,
        address: stationForm.address,
        booth_count: stationForm.booth_count,
        total_voters: parseInt(stationForm.total_voters) || 0,
        location: stationForm.location,
        election_id: electionId // Use the UUID election_id
      };

      console.log('Creating polling station with data:', stationData);
      console.log('Station form data:', stationForm);
      console.log('Station form keys:', Object.keys(stationForm));
      console.log('Election ID being sent to API:', electionId);
      console.log('Election ID type:', typeof electionId);
      console.log('Final station data being sent to API:', JSON.stringify(stationData, null, 2));
      console.log('Station data keys:', Object.keys(stationData));
      console.log('Does stationData have id field?', 'id' in stationData);
      console.log('Does stationData have election_id field?', 'election_id' in stationData);
      const stationResponse = await apiService.createPollingStation(stationData);
      console.log('Polling station API response:', stationResponse);
      
      if (!stationResponse || (stationResponse.status_code !== 200 && stationResponse.status_code !== 201)) {
        throw new Error(stationResponse?.message || 'Failed to create polling station');
      }

      // Get the station ID from API response - try multiple possible locations
      console.log('Full API response for station ID extraction:', stationResponse);
      console.log('Response keys:', Object.keys(stationResponse || {}));
      
      if (stationResponse.data) {
        console.log('Response data keys:', Object.keys(stationResponse.data));
      }
      
      // Extract both id and polling_station_id from API response - comprehensive check
      console.log('=== FULL API RESPONSE DEBUG ===');
      console.log('Full API response for station ID extraction:', stationResponse);
      console.log('Response type:', typeof stationResponse);
      console.log('Response keys:', Object.keys(stationResponse || {}));
      console.log('Response stringified:', JSON.stringify(stationResponse, null, 2));
      
      if (stationResponse.data) {
        console.log('Response data type:', typeof stationResponse.data);
        console.log('Response data keys:', Object.keys(stationResponse.data));
        console.log('Response data stringified:', JSON.stringify(stationResponse.data, null, 2));
        
        if (stationResponse.data.polling_station) {
          console.log('Response data.polling_station type:', typeof stationResponse.data.polling_station);
          console.log('Response data.polling_station keys:', Object.keys(stationResponse.data.polling_station));
          console.log('Response data.polling_station stringified:', JSON.stringify(stationResponse.data.polling_station, null, 2));
        }
      }
      
      // Check if response is an array
      if (Array.isArray(stationResponse)) {
        console.log('Response is an array with length:', stationResponse.length);
        if (stationResponse.length > 0) {
          console.log('First array item:', stationResponse[0]);
          console.log('First array item keys:', Object.keys(stationResponse[0] || {}));
        }
      }
      
      // Check if response.data is an array
      if (stationResponse.data && Array.isArray(stationResponse.data)) {
        console.log('Response data is an array with length:', stationResponse.data.length);
        if (stationResponse.data.length > 0) {
          console.log('First data array item:', stationResponse.data[0]);
          console.log('First data array item keys:', Object.keys(stationResponse.data[0] || {}));
        }
      }
      
      // Try multiple possible locations for station ID - based on actual API response
      const stationId = stationResponse.data?.polling_station?.id ||  // Primary location from API
                       stationResponse.data?.id || 
                       stationResponse.data?.station_id ||
                       stationResponse.data?.polling_station?.station_id ||
                       stationResponse.id || 
                       stationResponse.station_id ||
                       stationResponse.polling_station?.id ||
                       stationResponse.polling_station?.station_id;
      
      // Try multiple possible locations for polling station ID - based on actual API response
      const pollingStationId = stationResponse.data?.polling_station?.polling_station_id ||  // Primary location from API
                              stationResponse.data?.polling_station_id ||
                              stationResponse.data?.polling_station?.id ||
                              stationResponse.polling_station_id ||
                              stationResponse.polling_station?.polling_station_id ||
                              stationResponse.polling_station?.id ||
                              stationId; // Fallback to stationId if polling_station_id not found
      
      console.log('Station ID from API response:', stationId);
      console.log('Polling Station ID from API response:', pollingStationId);
      console.log('Station response structure:', {
        'response.data': stationResponse.data,
        'response.data.id': stationResponse.data?.id,
        'response.data.polling_station_id': stationResponse.data?.polling_station_id,
        'response.data.station_id': stationResponse.data?.station_id,
        'response.data.polling_station': stationResponse.data?.polling_station,
        'response.data.polling_station.id': stationResponse.data?.polling_station?.id,
        'response.data.polling_station.polling_station_id': stationResponse.data?.polling_station?.polling_station_id,
        'response.id': stationResponse.id,
        'response.polling_station_id': stationResponse.polling_station_id,
        'response.station_id': stationResponse.station_id,
        'response.polling_station': stationResponse.polling_station
      });
      
      // If no station ID found, use a fallback approach
      let finalStationId = stationId;
      let finalPollingStationId = pollingStationId;
      
      if (!stationId) {
        console.warn('Station ID not found in any expected location, using fallback');
        console.error('Available response structure:', JSON.stringify(stationResponse, null, 2));
        console.error('Response type:', typeof stationResponse);
        console.error('Response data type:', typeof stationResponse.data);
        if (stationResponse.data) {
          console.error('Response data type:', typeof stationResponse.data);
          console.error('Response data keys:', Object.keys(stationResponse.data));
        }
        
        // Use timestamp as fallback ID
        finalStationId = Date.now();
        finalPollingStationId = Date.now();
        console.warn('Using fallback IDs:', { finalStationId, finalPollingStationId });
      }
      
      const newStation = {
        id: finalStationId, // Use final station ID (from API or fallback)
        polling_station_id: finalPollingStationId, // Use final polling station ID (from API or fallback)
        key: stationForm.polling_station_number, // Use polling station number as key
        ...stationForm,
        total_voters: parseInt(stationForm.total_voters) || 0,
        api_created: true // Flag to indicate this was created via API
      };
      
      setPollingStations(prev => [...prev, newStation]);
      setStationForm(prev => ({
        name: '',
        address: '',
        booth_count: 1,
        total_voters: 0,
        location: '',
        polling_station_number: '',
        election_id: prev.election_id // Preserve the election_id
      }));
      setStationModalOpen(false);
      setError('');
      
    } catch (error) {
      console.error('Error creating polling station:', error);
      setError(error.message || 'Failed to create polling station');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStation = async (pollingStationId) => {
    try {
      console.log('handleRemoveStation called with pollingStationId:', pollingStationId);
      console.log('Available polling stations:', pollingStations);
      
      // Find the station by polling_station_id or id
      const station = pollingStations.find(s => s.polling_station_id === pollingStationId || s.id === pollingStationId);
      console.log('Found station:', station);
      
      if (!station) {
        throw new Error('Station not found');
      }
      
      if (station && station.api_created) {
        // Use polling_station_id for deletion
        const deleteId = station.polling_station_id;
        console.log('Deleting polling station with polling_station_id:', deleteId);
        console.log('Station data:', station);
        
        if (!deleteId) {
          throw new Error('Polling station ID not found for deletion');
        }
        
        const deleteResponse = await apiService.deletePollingStation(deleteId);
        console.log('Delete polling station response:', deleteResponse);
        
        if (!deleteResponse || (deleteResponse.status_code !== 200 && deleteResponse.status_code !== 204)) {
          throw new Error(deleteResponse?.message || 'Failed to delete polling station');
        }
      }
      
      // Remove from local state using the original station reference
      setPollingStations(prev => prev.filter(s => s.polling_station_id !== pollingStationId && s.id !== pollingStationId));
      // Also remove statistics for this station
      setStatistics(prev => {
        const newStats = { ...prev };
        delete newStats[pollingStationId];
        return newStats;
      });
      
    } catch (error) {
      console.error('Error deleting polling station:', error);
      setError(error.message || 'Failed to delete polling station');
    }
  };

  const handleAddStatisticsForStation = (station) => {
    // Store the selected station for statistics
    setSelectedStationForStats(station);
    // Open the stats modal
    setStatsModalOpen(true);
  };

  const handleSubmitStatisticsForStation = async () => {
    if (!selectedStationForStats) {
      setError('No station selected for statistics');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (!electionCreated || !electionResponse) {
        setError('Election must be created first. Please go back to Step 1.');
        setLoading(false);
        return;
      }

      // Get election ID from the stored response - prioritize UUID
      let electionId = existingElection?.election_id || 
                      existingElection?.id || 
                      electionResponse.data?.election_id || 
                      electionResponse.data?.election?.election_id ||
                      electionResponse.data?.election?.id ||
                      electionResponse.data?.id || 
                      electionResponse.id || 
                      electionResponse.election_id;

      if (!electionId) {
        throw new Error('Election ID not found in stored response. Cannot add statistics.');
      }

      // Get statistics for this station
      const stats = getStationStats(selectedStationForStats.id);
      if (!stats || (stats.male === 0 && stats.female === 0 && stats.third_gender === 0 && stats.total === 0)) {
        setError('Please add some voter statistics data for this station first');
        setLoading(false);
        return;
      }

      const statsData = {
        election_id: electionId,
        polling_station_id: selectedStationForStats.polling_station_id,
        starting_serial_no: stats.starting_serial_no || 1,
        ending_serial_no: stats.ending_serial_no || 1,
        male: stats.male || 0,
        female: stats.female || 0,
        third_gender: stats.third_gender || 0,
        total: stats.total || 0
      };

      console.log('Adding statistics for station:', statsData);
      console.log('Station details:', {
        'station.id': selectedStationForStats.id,
        'station.polling_station_id': selectedStationForStats.polling_station_id,
        'station.name': selectedStationForStats.name,
        'station.polling_station_number': selectedStationForStats.polling_station_number
      });

      const statsResponse = await apiService.createStatistics(statsData);
      console.log('Statistics API response:', statsResponse);

      if (statsResponse && (statsResponse.status_code === 200 || statsResponse.status_code === 201)) {
        setMessage({ type: 'success', text: `Voter status added successfully for ${selectedStationForStats.name}` });
        console.log('Voter status created successfully for station:', selectedStationForStats.polling_station_id);
        
        // Clear the selected station and close modal
        setSelectedStationForStats(null);
        setStatsModalOpen(false);
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      } else {
        throw new Error(statsResponse?.message || 'Failed to create voter status');
      }

    } catch (error) {
      console.error('Error adding statistics for station:', error);
      setError(error.message || 'Failed to add voter status for this station');
    } finally {
      setLoading(false);
    }
  };

  const handleStationFormChange = (field, value) => {
    setStationForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Step 3: Statistics Handlers
  const handleStatisticChange = (stationId, field, value) => {
    setStatistics(prev => ({
      ...prev,
      [stationId]: {
        ...prev[stationId],
        [field]: parseInt(value) || 0
      }
    }));
  };

  const getStationStats = (stationId) => {
    return statistics[stationId] || {
      starting_serial_no: 1,
      ending_serial_no: 1,
      male: 0,
      female: 0,
      third_gender: 0,
      total: 0
    };
  };

  // Final submission
  const handleComplete = async () => {
    try {
      setLoading(true);
      setError('');
      setProgress('');

      // Check if election was created
      if (!electionCreated || !electionResponse) {
        setError('Election must be created first. Please go back to Step 1.');
        setLoading(false);
        return;
      }

      if (pollingStations.length === 0) {
        setError('Please add at least one polling station');
        setLoading(false);
        return;
      }

      // Get election ID from the stored response - prioritize UUID
      let electionId = existingElection?.election_id || 
                      existingElection?.id || 
                      electionResponse.data?.election_id || 
                      electionResponse.data?.election?.election_id ||
                      electionResponse.data?.election?.id ||
                      electionResponse.data?.id || 
                      electionResponse.id || 
                      electionResponse.election_id;
      
      console.log('Using election ID from stored response:', electionId);
      console.log('Stored election response:', electionResponse);
      
      // Validate that we have an election ID
      if (!electionId) {
        throw new Error('Election ID not found in stored response. Cannot complete process.');
      }

      // Step 2: Add statistics for existing polling stations
      setProgress('Adding statistics for polling stations...');
      for (let i = 0; i < pollingStations.length; i++) {
        const station = pollingStations[i];
        setProgress(`Adding statistics for station ${i + 1} of ${pollingStations.length}...`);
        
        // Add statistics for this polling station
        const stats = getStationStats(station.id);
        if (stats && Object.values(stats).some(value => value > 0)) {
          try {
            const statsData = {
              ...stats,
              polling_station_id: station.polling_station_id, // Use the polling_station_id from API response
              election_id: electionId
            };
            console.log('Adding statistics for station:', statsData);
            console.log('Station details:', {
              'station.id': station.id,
              'station.polling_station_id': station.polling_station_id,
              'station.name': station.name,
              'station.polling_station_number': station.polling_station_number
            });
            console.log('API Service createStatistics method:', typeof apiService.createStatistics);
            
            // Add statistics for this polling station
            const statsResponse = await apiService.createStatistics(statsData);
            console.log('Statistics API response:', statsResponse);
            
            if (statsResponse && (statsResponse.status_code === 200 || statsResponse.status_code === 201)) {
              console.log('Statistics created successfully for station:', station.polling_station_id);
            } else {
              console.error('Failed to create statistics for station:', station.polling_station_id, statsResponse);
            }
          } catch (statsError) {
            console.error('Failed to add statistics for station:', station.polling_station_id, statsError);
            // Continue with other stations even if stats fail
          }
        }
      }

      // Return success response
      setProgress('Election process completed successfully!');
      onComplete(electionResponse);
      
    } catch (error) {
      console.error('Error in election completion process:', error);
      setError(error.message || 'Failed to complete election process');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardBody className="wizard wizard-default">
        {error && <Alert color="danger">{error}</Alert>}
        {message && <Alert color={message.type}>{message.text}</Alert>}
        {progress && <Alert color="info">{progress}</Alert>}
        
        <Wizard>
          <TopNavigation
            className="justify-content-center"
            disableNav={false}
            topNavClick={topNavClick}
          />
          <Steps>
            {/* Step 1: Election Details */}
            <Step
              id="step1"
              name="Election Details"
              desc="Basic election information"
            >
              <div className="wizard-basic-step">
                <h4 className="mb-4">Election Information</h4>
                <Form>
                  <Row>
                    <Col md="6">
                      <FormGroup>
                        <Label for="name">Election Name *</Label>
                        <Input
                          type="text"
                          id="name"
                          value={electionForm.name}
                          onChange={(e) => handleElectionFormChange('name', e.target.value)}
                          placeholder="Enter election name"
                        />
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup>
                        <Label for="type">Election Type</Label>
                        <Input
                          type="select"
                          id="type"
                          value={electionForm.type}
                          onChange={(e) => handleElectionFormChange('type', e.target.value)}
                        >
                          <option value="Assembly Constituency">Assembly Constituency</option>
                          <option value="Parliamentary Constituency">Parliamentary Constituency</option>
                          <option value="Municipal Corporation">Municipal Corporation</option>
                          <option value="Panchayat">Panchayat</option>
                        </Input>
                      </FormGroup>
                    </Col>
                  </Row>

                  <Row>
                    <Col md="6">
                      <FormGroup>
                        <Label for="reservation_type">Reservation Type</Label>
                        <Input
                          type="select"
                          id="reservation_type"
                          value={electionForm.reservation_type}
                          onChange={(e) => handleElectionFormChange('reservation_type', e.target.value)}
                        >
                          <option value="general">General</option>
                          <option value="SC">SC (Scheduled Caste)</option>
                          <option value="ST">ST (Scheduled Tribe)</option>
                          <option value="OBC">OBC (Other Backward Class)</option>
                          <option value="EWS">EWS (Economically Weaker Section)</option>
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup>
                        <Label for="election_date">Election Date *</Label>
                        <Input
                          type="date"
                          id="election_date"
                          value={electionForm.election_date}
                          onChange={(e) => handleElectionFormChange('election_date', e.target.value)}
                        />
                      </FormGroup>
                    </Col>
                  </Row>

                  <Row>
                    <Col md="6">
                      <FormGroup>
                        <Label for="qualifying_date">Qualifying Date *</Label>
                        <Input
                          type="date"
                          id="qualifying_date"
                          value={electionForm.qualifying_date}
                          onChange={(e) => handleElectionFormChange('qualifying_date', e.target.value)}
                        />
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup>
                        <Label for="number_of_electors">Number of Electors</Label>
                        <Input
                          type="number"
                          id="number_of_electors"
                          value={electionForm.number_of_electors}
                          onChange={(e) => handleElectionFormChange('number_of_electors', parseInt(e.target.value) || 1)}
                          min="1"
                        />
                      </FormGroup>
                    </Col>
                  </Row>

                  <Row>
                    <Col md="6">
                      <FormGroup>
                        <Label for="date_of_publication">Date of Publication</Label>
                        <Input
                          type="date"
                          id="date_of_publication"
                          value={electionForm.date_of_publication}
                          onChange={(e) => handleElectionFormChange('date_of_publication', e.target.value)}
                        />
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup>
                        <Label for="type_of_revision">Type of Revision</Label>
                        <Input
                          type="text"
                          id="type_of_revision"
                          value={electionForm.type_of_revision}
                          onChange={(e) => handleElectionFormChange('type_of_revision', e.target.value)}
                          placeholder="e.g., Summary Revision"
                        />
                      </FormGroup>
                    </Col>
                  </Row>

                  {/* Election Creation/Update Status */}
                  {electionCreated && (
                    <Alert color="success" className="mt-3">
                      <i className="simple-icon-check"></i> {existingElection ? 'Election updated successfully!' : 'Election created successfully!'}
                    </Alert>
                  )}

                  {/* Create/Update Election Button */}
                  {!electionCreated && (
                    <div className="mt-4">
                      <Button 
                        color="primary" 
                        onClick={createElection}
                        disabled={loading}
                        className="mr-2"
                      >
                        {loading ? (existingElection ? 'Updating...' : 'Creating...') : (existingElection ? 'Update Election' : 'Create Election')}
                      </Button>
                      <small className="text-muted d-block mt-2">
                        Click this button to {existingElection ? 'update' : 'create'} the election before proceeding to polling stations.
                      </small>
                    </div>
                  )}
                </Form>
              </div>
            </Step>

            {/* Step 2: Polling Stations */}
            <Step
              id="step2"
              name="Polling Stations"
              desc="Add polling station details"
            >
              <div className="wizard-basic-step">
                {electionCreated && electionResponse && (
                  <Alert color="info" className="mb-3">
                    <i className="simple-icon-info"></i> Adding polling stations for election: <strong>{electionForm.name}</strong>
                  </Alert>
                )}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4>Polling Stations</h4>
                  <Button 
                    color="primary" 
                    onClick={() => setStationModalOpen(true)}
                    disabled={!electionCreated}
                    title={!electionCreated ? "Create election first" : "Add a new polling station"}
                  >
                    <i className="simple-icon-plus"></i> Add Polling Station
                  </Button>
                </div>

                {pollingStations.length === 0 ? (
                  <Alert color="info">
                    No polling stations added yet. Click "Add Polling Station" to get started.
                  </Alert>
                ) : (
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Station Number</th>
                        <th>Station Name</th>
                        <th>Address</th>
                        <th>Booths</th>
                        <th>Total Voters</th>
                        <th>Location</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pollingStations.map((station) => {
                        console.log('Rendering station:', station);
                        console.log('Station ID:', station.id);
                        console.log('Station polling_station_id:', station.polling_station_id);
                        return (
                          <tr key={station.key || station.polling_station_number || station.id}>
                            <td>{station.polling_station_number}</td>
                            <td>{station.name}</td>
                            <td>{station.address}</td>
                            <td>{station.booth_count}</td>
                            <td>{station.total_voters}</td>
                            <td>{station.location}</td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button
                                  color="success"
                                  size="sm"
                                  onClick={() => handleAddStatisticsForStation(station)}
                                  title="Add voter status for this polling station"
                                >
                                  <i className="simple-icon-plus"></i> Stats
                                </Button>
                                <Button
                                  color="danger"
                                  size="sm"
                                  onClick={() => {
                                    console.log('Delete button clicked for station:', station);
                                    console.log('Station polling_station_id being passed:', station.polling_station_id);
                                    handleRemoveStation(station.polling_station_id || station.id);
                                  }}
                                  title="Delete this polling station"
                                >
                                  <i className="simple-icon-trash"></i> Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}

                {/* Add Station Modal */}
                <Modal isOpen={stationModalOpen} toggle={() => setStationModalOpen(!stationModalOpen)}>
                  <ModalHeader toggle={() => setStationModalOpen(!stationModalOpen)}>
                    Add Polling Station
                  </ModalHeader>
                  <ModalBody>
                    <Form>
                      {/* Hidden field to show election_id */}
                      {stationForm.election_id && (
                        <FormGroup>
                          <Label>Election ID:</Label>
                          <Input
                            type="text"
                            value={stationForm.election_id}
                            readOnly
                            className="bg-light"
                            style={{fontWeight: 'bold', color: '#28a745'}}
                          />
                        </FormGroup>
                      )}
                      <Row>
                        <Col md="6">
                          <FormGroup>
                            <Label for="polling_station_number">Polling Station Number *</Label>
                            <Input
                              type="text"
                              id="polling_station_number"
                              value={stationForm.polling_station_number}
                              onChange={(e) => handleStationFormChange('polling_station_number', e.target.value)}
                              placeholder="e.g., PS001, PS002"
                            />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label for="station_name">Station Name *</Label>
                            <Input
                              type="text"
                              id="station_name"
                              value={stationForm.name}
                              onChange={(e) => handleStationFormChange('name', e.target.value)}
                              placeholder="Enter station name"
                            />
                          </FormGroup>
                        </Col>
                      </Row>
                      <FormGroup>
                        <Label for="station_address">Address *</Label>
                        <Input
                          type="textarea"
                          id="station_address"
                          value={stationForm.address}
                          onChange={(e) => handleStationFormChange('address', e.target.value)}
                          placeholder="Enter station address"
                          rows="3"
                        />
                      </FormGroup>
                      <Row>
                        <Col md="6">
                          <FormGroup>
                            <Label for="booth_count">Number of Booths</Label>
                            <Input
                              type="number"
                              id="booth_count"
                              value={stationForm.booth_count}
                              onChange={(e) => handleStationFormChange('booth_count', parseInt(e.target.value) || 1)}
                              min="1"
                            />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label for="total_voters">Total Voters</Label>
                            <Input
                              type="number"
                              id="total_voters"
                              value={stationForm.total_voters}
                              onChange={(e) => handleStationFormChange('total_voters', parseInt(e.target.value) || 0)}
                              min="0"
                            />
                          </FormGroup>
                        </Col>
                      </Row>
                      <FormGroup>
                        <Label for="location">Location</Label>
                        <Input
                          type="text"
                          id="location"
                          value={stationForm.location}
                          onChange={(e) => handleStationFormChange('location', e.target.value)}
                          placeholder="Enter location details"
                        />
                      </FormGroup>
                    </Form>
                  </ModalBody>
                  <ModalFooter>
                    <Button color="secondary" onClick={() => setStationModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      color="primary" 
                      onClick={handleAddStation}
                      disabled={loading}
                    >
                      {loading ? 'Adding...' : 'Add Station'}
                    </Button>
                  </ModalFooter>
                </Modal>

                {/* Add Voter Status Modal */}
                <Modal isOpen={statsModalOpen} toggle={() => setStatsModalOpen(!statsModalOpen)} size="lg">
                  <ModalHeader toggle={() => setStatsModalOpen(!statsModalOpen)}>
                    Add Voter Status - {selectedStationForStats?.polling_station_number} - {selectedStationForStats?.name}
                  </ModalHeader>
                  <ModalBody>
                    {selectedStationForStats && (
                      <Form>
                        <Row>
                          <Col md="6">
                            <FormGroup>
                              <Label for={`modal_starting_serial_${selectedStationForStats.id}`}>Starting Serial No</Label>
                              <Input
                                type="number"
                                id={`modal_starting_serial_${selectedStationForStats.id}`}
                                value={getStationStats(selectedStationForStats.id).starting_serial_no || 1}
                                onChange={(e) => handleStatisticChange(selectedStationForStats.id, 'starting_serial_no', e.target.value)}
                                min="1"
                              />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label for={`modal_ending_serial_${selectedStationForStats.id}`}>Ending Serial No</Label>
                              <Input
                                type="number"
                                id={`modal_ending_serial_${selectedStationForStats.id}`}
                                value={getStationStats(selectedStationForStats.id).ending_serial_no || 1}
                                onChange={(e) => handleStatisticChange(selectedStationForStats.id, 'ending_serial_no', e.target.value)}
                                min="1"
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                        <Row>
                          <Col md="4">
                            <FormGroup>
                              <Label for={`modal_male_${selectedStationForStats.id}`}>Male</Label>
                              <Input
                                type="number"
                                id={`modal_male_${selectedStationForStats.id}`}
                                value={getStationStats(selectedStationForStats.id).male || 0}
                                onChange={(e) => handleStatisticChange(selectedStationForStats.id, 'male', e.target.value)}
                                min="0"
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label for={`modal_female_${selectedStationForStats.id}`}>Female</Label>
                              <Input
                                type="number"
                                id={`modal_female_${selectedStationForStats.id}`}
                                value={getStationStats(selectedStationForStats.id).female || 0}
                                onChange={(e) => handleStatisticChange(selectedStationForStats.id, 'female', e.target.value)}
                                min="0"
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label for={`modal_third_gender_${selectedStationForStats.id}`}>Third Gender</Label>
                              <Input
                                type="number"
                                id={`modal_third_gender_${selectedStationForStats.id}`}
                                value={getStationStats(selectedStationForStats.id).third_gender || 0}
                                onChange={(e) => handleStatisticChange(selectedStationForStats.id, 'third_gender', e.target.value)}
                                min="0"
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                        <Row>
                          <Col md="6">
                            <FormGroup>
                              <Label for={`modal_total_${selectedStationForStats.id}`}>Total</Label>
                              <Input
                                type="number"
                                id={`modal_total_${selectedStationForStats.id}`}
                                value={getStationStats(selectedStationForStats.id).total || 0}
                                onChange={(e) => handleStatisticChange(selectedStationForStats.id, 'total', e.target.value)}
                                min="0"
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                      </Form>
                    )}
                  </ModalBody>
                  <ModalFooter>
                    <Button color="secondary" onClick={() => setStatsModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      color="success" 
                      onClick={handleSubmitStatisticsForStation}
                      disabled={loading}
                    >
                      {loading ? 'Submitting...' : 'Submit Voter Status'}
                    </Button>
                  </ModalFooter>
                </Modal>
              </div>
            </Step>

            {/* Step 3: Completion */}
            <Step id="step3" hideTopNav>
              <div className="wizard-basic-step text-center">
                <h2 className="mb-2">Ready to Create Election</h2>
                <p className="mb-4">
                  Review your election details and click "Create Election" to complete the process.
                </p>
                
                <div className="text-left">
                  <h5>Election Summary:</h5>
                  <p><strong>Name:</strong> {electionForm.name}</p>
                  <p><strong>Type:</strong> {electionForm.type}</p>
                  <p><strong>Date:</strong> {electionForm.election_date}</p>
                  <p><strong>Polling Stations:</strong> {pollingStations.length}</p>
                </div>
              </div>
            </Step>
          </Steps>
          
          <BottomNavigation
            onClickNext={onClickNext}
            onClickPrev={onClickPrev}
            className="justify-content-center"
            prevLabel="Previous"
            nextLabel="Next"
          />
          
          {/* Custom buttons for final step */}
          <div className="wizard-buttons justify-content-center mt-3">
            <Button color="secondary" onClick={onCancel} className="mr-2">
              Cancel
            </Button>
            <Button 
              color="success" 
              onClick={handleComplete}
              disabled={loading || pollingStations.length === 0 || !electionCreated}
            >
              {loading ? 'Completing...' : 'Complete'}
            </Button>
          </div>
        </Wizard>
      </CardBody>
    </Card>
  );
};

export default injectIntl(ElectionWizard);
