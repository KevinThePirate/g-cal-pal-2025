import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import Auth from "./components/Auth";
import PrivateRoute from "./components/PrivateRoute";
import Dashboard from "./components/Dashboard";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import GoalsDashboard from "./components/GoalsDashboard";
import { Tabs, Tab, Box, AppBar } from '@mui/material';

const theme = createTheme();

// Layout component with tabs
function TabsLayout({ children }) {
  const location = useLocation();
  const [value, setValue] = useState(() => {
    // Set initial tab value based on current path
    if (location.pathname === '/goals') return 1;
    return 0; // Default to Dashboard tab
  });

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="default">
        <Tabs 
          value={value} 
          onChange={handleChange} 
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Overview" component={Link} to="/" />
          <Tab label="Goals" component={Link} to="/goals" />
        </Tabs>
      </AppBar>
      <Box sx={{ p: 3 }}>
        {children}
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/" element={
            <PrivateRoute>
              <TabsLayout>
                <Dashboard />
              </TabsLayout>
            </PrivateRoute>
          } />
          <Route path="/goals" element={
            <PrivateRoute>
              <TabsLayout>
                <GoalsDashboard />
              </TabsLayout>
            </PrivateRoute>
          } />
          {/* Redirect any other routes to the dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;