import React, { Suspense } from 'react';
import { Route, withRouter, Switch, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';

import AppLayout from 'layout/AppLayout';
// import { ProtectedRoute, UserRole } from 'helpers/authHelper';

const AdminDashboard = React.lazy(() =>
  import(/* webpackChunkName: "admin-dashboard" */ './admin/AdminDashboard')
);
const UserDashboard = React.lazy(() =>
  import(/* webpackChunkName: "user-dashboard" */ './user/UserDashboard')
);
const ElectionsPage = React.lazy(() =>
  import(/* webpackChunkName: "elections" */ './elections/ElectionsPage')
);
const ElectionDetails = React.lazy(() =>
  import(/* webpackChunkName: "election-details" */ './elections/ElectionDetails')
);
const VoterManagement = React.lazy(() =>
  import(/* webpackChunkName: "voter-management" */ './elections/VoterManagement')
);
const PollingStationsPage = React.lazy(() =>
  import(/* webpackChunkName: "polling-stations" */ './polling-stations/PollingStationsPage')
);
const Dashboards = React.lazy(() =>
  import(/* webpackChunkName: "dashboards" */ './dashboards')
);
const Pages = React.lazy(() =>
  import(/* webpackChunkName: "pages" */ './pages')
);
const Applications = React.lazy(() =>
  import(/* webpackChunkName: "applications" */ './applications')
);
const Ui = React.lazy(() => import(/* webpackChunkName: "ui" */ './ui'));
const Menu = React.lazy(() => import(/* webpackChunkName: "menu" */ './menu'));
const BlankPage = React.lazy(() =>
  import(/* webpackChunkName: "blank-page" */ './blank-page')
);

const App = ({ match }) => {
  return (
    <AppLayout>
      <div className="dashboard-wrapper">
        <Suspense fallback={<div className="loading" />}>
          <Switch>
            <Redirect
              exact
              from={`${match.url}/`}
              to={`${match.url}/dashboards`}
            />
            <Route
              path={`${match.url}/admin-dashboard`}
              render={(props) => <AdminDashboard {...props} />}
            />
            <Route
              path={`${match.url}/user-dashboard`}
              render={(props) => <UserDashboard {...props} />}
            />
            <Route
              path={`${match.url}/elections`}
              exact
              render={(props) => <ElectionsPage {...props} />}
            />
            <Route
              path={`${match.url}/elections/:id/voters`}
              render={(props) => <VoterManagement {...props} />}
            />
            <Route
              path={`${match.url}/elections/:id`}
              render={(props) => <ElectionDetails {...props} />}
            />
            <Route
              path={`${match.url}/polling-stations`}
              render={(props) => <PollingStationsPage {...props} />}
            />
            <Route
              path={`${match.url}/dashboards`}
              render={(props) => <Dashboards {...props} />}
            />
            <Route
              path={`${match.url}/applications`}
              render={(props) => <Applications {...props} />}
            />
            {/* <ProtectedRoute
                    path={`${match.url}/applications`}
                    component={Applications}
                    roles={[UserRole.Admin]}
            /> */}
            <Route
              path={`${match.url}/pages`}
              render={(props) => <Pages {...props} />}
            />
            <Route
              path={`${match.url}/ui`}
              render={(props) => <Ui {...props} />}
            />
            <Route
              path={`${match.url}/menu`}
              render={(props) => <Menu {...props} />}
            />
            <Route
              path={`${match.url}/blank-page`}
              render={(props) => <BlankPage {...props} />}
            />
            <Redirect to="/error" />
          </Switch>
        </Suspense>
      </div>
    </AppLayout>
  );
};

const mapStateToProps = ({ menu }) => {
  const { containerClassnames } = menu;
  return { containerClassnames };
};
export default withRouter(connect(mapStateToProps, {})(App));
