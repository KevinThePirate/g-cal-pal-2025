import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  FormControlLabel, 
  Checkbox, 
  Switch, 
  Button, 
  Divider, 
  Paper 
} from '@mui/material';

import {signOut} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import AddNewGoal from './AddNewGoal';  // Import the new component
import AddGoal from './AddGoal';

console.log({auth})

const CalendarSidebar = ({ calendars, onFilterChange, setShowPercent, showPercent, setDataVersion }) => {
  const [selectedCalendars, setSelectedCalendars] = useState({});
  const navigate = useNavigate();
  
  // Initialize selected calendars when the component mounts or calendars change
  useEffect(() => {
    if (calendars.length > 0) {
      const initialSelected = {};
      calendars.forEach(cal => {
        initialSelected[cal.id] = true;
      });
      setSelectedCalendars(initialSelected);
    }
  }, [calendars]);

  const handleCalendarToggle = (calendarId) => {
    setSelectedCalendars(prev => ({
      ...prev,
      [calendarId]: !prev[calendarId]
    }));
  };

  const handleDisplayModeToggle = () => {
    setShowPercent(!showPercent);
  }

  const applyFilters = () => {
    onFilterChange(selectedCalendars);
  };

  const selectAll = () => {
    const allSelected = {};
    calendars.forEach(cal => {
      allSelected[cal.id] = true;
    });
    setSelectedCalendars(allSelected);
  };

  const clearAll = () => {
    const allCleared = {};
    calendars.forEach(cal => {
      allCleared[cal.id] = false;
    });
    setSelectedCalendars(allCleared);
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      console.log("User logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <Paper elevation={3} sx={{ 
      width: 280, 
      p: 2, 
      borderRadius: 2,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Button onClick={logOut} variant="outlined">Log Out</Button>
      
      {/* Add the new goal component here */}
      <AddNewGoal calendars={calendars} setDataVersion={setDataVersion}/>
      
      <Typography variant="h6" sx={{ mb: 2 }}>Calendar Filters</Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Display Options</Typography>
        <FormControlLabel
          control={
            <Switch 
              checked={showPercent} 
              onChange={handleDisplayModeToggle}
              color="primary"
            />
          }
          label={showPercent ? "Show Percentages" : "Show Hours"}
        />
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Calendars</Typography>
      <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
        {calendars.map(calendar => (
          <FormControlLabel
            key={calendar.id}
            control={
              <Checkbox
                checked={selectedCalendars[calendar.id] || false}
                onChange={() => handleCalendarToggle(calendar.id)}
                sx={{ 
                  color: calendar.colorId ? `var(--calendar-color-${calendar.colorId})` : '#4285F4',
                  '&.Mui-checked': {
                    color: calendar.colorId ? `var(--calendar-color-${calendar.colorId})` : '#4285F4',
                  }
                }}
              />
            }
            label={calendar.name}
          />
        ))}
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button variant="contained" color="primary" onClick={applyFilters}>
          Apply Filters
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={selectAll} sx={{ flex: 1 }}>
            Select All
          </Button>
          <Button variant="outlined" onClick={clearAll} sx={{ flex: 1 }}>
            Clear All
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default CalendarSidebar;