import React, { useState, useEffect } from 'react';
import { Row, Col, Card, CardBody, CardTitle, Button, Form, FormGroup, Label, Input, Alert, Table } from 'reactstrap';
import { Colxx } from 'components/common/CustomBootstrap';
import IntlMessages from 'helpers/IntlMessages';
import apiService from 'services/api';

const AdminAuthentication = () => {
  const [authSettings, setAuthSettings] = useState({
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    twoFactorAuth: false,
    ipWhitelist: []
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeSessions, setActiveSessions] = useState([]);

  useEffect(() => {
    loadAuthSettings();
    loadActiveSessions();
  }, []);

  const loadAuthSettings = async () => {
    try {
      setLoading(true);
      const settings = await apiService.getAuthSettings();
      setAuthSettings(settings);
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to load authentication settings' });
    } finally {
      setLoading(false);
    }
  };

  const loadActiveSessions = async () => {
    try {
      const sessions = await apiService.getActiveSessions();
      setActiveSessions(sessions);
    } catch (error) {
      console.error('Failed to load active sessions:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      await apiService.updateAuthSettings(authSettings);
      setMessage({ type: 'success', text: 'Authentication settings updated successfully' });
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to update authentication settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId) => {
    try {
      await apiService.terminateSession(sessionId);
      setMessage({ type: 'success', text: 'Session terminated successfully' });
      loadActiveSessions();
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to terminate session' });
    }
  };

  return (
    <div className="admin-authentication">
      <Row>
        <Colxx xxs="12">
          <h3 className="mb-4">
            <IntlMessages id="admin.authentication.title" />
          </h3>
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
        <Colxx xxs="12" lg="6">
          <Card className="mb-4">
            <CardBody>
              <CardTitle>
                <IntlMessages id="admin.authentication.settings" />
              </CardTitle>
              
              <Form>
                <FormGroup>
                  <Label for="sessionTimeout">
                    <IntlMessages id="admin.authentication.session-timeout" /> (minutes)
                  </Label>
                  <Input
                    type="number"
                    id="sessionTimeout"
                    value={authSettings.sessionTimeout}
                    onChange={(e) => setAuthSettings({
                      ...authSettings,
                      sessionTimeout: parseInt(e.target.value)
                    })}
                  />
                </FormGroup>

                <FormGroup>
                  <Label for="maxLoginAttempts">
                    <IntlMessages id="admin.authentication.max-login-attempts" />
                  </Label>
                  <Input
                    type="number"
                    id="maxLoginAttempts"
                    value={authSettings.maxLoginAttempts}
                    onChange={(e) => setAuthSettings({
                      ...authSettings,
                      maxLoginAttempts: parseInt(e.target.value)
                    })}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>
                    <IntlMessages id="admin.authentication.password-policy" />
                  </Label>
                  <div>
                    <FormGroup check>
                      <Label check>
                        <Input
                          type="checkbox"
                          checked={authSettings.passwordPolicy.requireUppercase}
                          onChange={(e) => setAuthSettings({
                            ...authSettings,
                            passwordPolicy: {
                              ...authSettings.passwordPolicy,
                              requireUppercase: e.target.checked
                            }
                          })}
                        />
                        <IntlMessages id="admin.authentication.require-uppercase" />
                      </Label>
                    </FormGroup>
                    <FormGroup check>
                      <Label check>
                        <Input
                          type="checkbox"
                          checked={authSettings.passwordPolicy.requireLowercase}
                          onChange={(e) => setAuthSettings({
                            ...authSettings,
                            passwordPolicy: {
                              ...authSettings.passwordPolicy,
                              requireLowercase: e.target.checked
                            }
                          })}
                        />
                        <IntlMessages id="admin.authentication.require-lowercase" />
                      </Label>
                    </FormGroup>
                    <FormGroup check>
                      <Label check>
                        <Input
                          type="checkbox"
                          checked={authSettings.passwordPolicy.requireNumbers}
                          onChange={(e) => setAuthSettings({
                            ...authSettings,
                            passwordPolicy: {
                              ...authSettings.passwordPolicy,
                              requireNumbers: e.target.checked
                            }
                          })}
                        />
                        <IntlMessages id="admin.authentication.require-numbers" />
                      </Label>
                    </FormGroup>
                    <FormGroup check>
                      <Label check>
                        <Input
                          type="checkbox"
                          checked={authSettings.passwordPolicy.requireSpecialChars}
                          onChange={(e) => setAuthSettings({
                            ...authSettings,
                            passwordPolicy: {
                              ...authSettings.passwordPolicy,
                              requireSpecialChars: e.target.checked
                            }
                          })}
                        />
                        <IntlMessages id="admin.authentication.require-special-chars" />
                      </Label>
                    </FormGroup>
                  </div>
                </FormGroup>

                <FormGroup>
                  <Label check>
                    <Input
                      type="checkbox"
                      checked={authSettings.twoFactorAuth}
                      onChange={(e) => setAuthSettings({
                        ...authSettings,
                        twoFactorAuth: e.target.checked
                      })}
                    />
                    <IntlMessages id="admin.authentication.two-factor-auth" />
                  </Label>
                </FormGroup>

                <Button
                  color="primary"
                  onClick={handleSaveSettings}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Colxx>

        <Colxx xxs="12" lg="6">
          <Card>
            <CardBody>
              <CardTitle>
                <IntlMessages id="admin.authentication.active-sessions" />
              </CardTitle>
              
              <Table responsive>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>IP Address</th>
                    <th>Last Activity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSessions.map((session) => (
                    <tr key={session.id}>
                      <td>{session.user}</td>
                      <td>{session.ipAddress}</td>
                      <td>{session.lastActivity}</td>
                      <td>
                        <Button
                          size="sm"
                          color="danger"
                          onClick={() => handleTerminateSession(session.id)}
                        >
                          Terminate
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {activeSessions.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center">
                        No active sessions
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Colxx>
      </Row>
    </div>
  );
};

export default AdminAuthentication;
