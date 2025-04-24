import { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Stack,
  Typography,
  Alert,
  Box
} from '@mui/material';
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import AddIcon from '@mui/icons-material/Add';
import { doc, setDoc } from "firebase/firestore";

export default function AddNewGoal({ calendars = [] }) {

  const hasCalendars = Array.isArray(calendars) && calendars.length > 0;
  const [selectedCalendar, setSelectedCalendar] = useState('');
  const [goalHours, setGoalHours] = useState('');
  const [timeframe, setTimeframe] = useState('weekly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
    setSelectedCalendar('');
    setGoalHours('');
    setTimeframe('weekly');
    setError('');
    setSuccess(false);
  }

  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    // Form Validation
    if (!selectedCalendar) {
      setError('Please select a calendar');
      console.error('Validation Error: No calendar selected');
      return;
    }

    if (!goalHours || isNaN(goalHours) || parseFloat(goalHours) <= 0) {
      setError('Please enter a valid number of hours');
      console.error('Validation Error: Invalid goal hours input');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) {
        setError('You must be logged in to create goals');
        console.error('Auth Error: No user is currently signed in');
        setLoading(false);
        return;
      }

      const userId = user.uid;
      const calendarInfo = calendars.find(cal => cal.id === selectedCalendar);
      
      if (!calendarInfo) {
        setError('Selected calendar not found in list');
        console.error(`Calendar Search Error: No calendar with an ID of ${selectedCalendar} found`);
        setLoading(false);
        return;
      }

      const goal = {
        userId,
        calendarId: selectedCalendar,
        calendarName: calendarInfo.name || 'Unknown Calendar',
        colorId: calendarInfo.colorId || null,
        targetHours: parseFloat(goalHours),
        timeframe,
        createdAt: new Date()
      };

      console.log("Submitting goal data:", goal);

      const goalsCollectionRef = collection(db, 'users', userId, 'goals');
      if (!goalsCollectionRef) {
        setError('Failed to create goals collection reference');
        console.error('Firestore Error: Collection ref returned null/undefined');
        setLoading(false);
        return;
      }

      await addDoc(goalsCollectionRef, goal);
      console.log('Firestore Success: Goal added', goal);
      setSuccess(true);

      setTimeout(() => {
        handleClose();
      }, 1500);

    }catch (err) {
      console.error('Firestore Error: Failed to add goal to Firestore', err);
      setError(`Failed to add goal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Box sx={{ mt: 2, mb: 2 }}>
        <Button 
          onClick={handleOpen} 
          variant="outlined" 
          startIcon={<AddIcon />}
          fullWidth
          size="small"
          disabled={!hasCalendars}
        >
          Add New Calendar Goal
        </Button>
      </Box>

      <Dialog open={open} fullWidth>
        <DialogTitle>Add New Calendar Goal</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2, mt: 1 }}>
              Goal saved successfully!
            </Alert>
          )}
          
          {!hasCalendars && (
            <Alert severity="warning" sx={{ mb: 2, mt: 1 }}>
              No calendars available. Please make sure you have access to your calendars.
            </Alert>
          )}
          
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="calendar-select-label">Calendar</InputLabel>
              <Select
                labelId="calendar-select-label"
                value={selectedCalendar}
                label="Calendar"
                disabled={!hasCalendars}
                onChange={(e) => setSelectedCalendar(e.target.value)}
              >
                {hasCalendars && calendars.map((calendar) => (
                  <MenuItem 
                    key={calendar.id} 
                    value={calendar.id}
                    sx={{ 
                      borderLeft: `6px solid ${calendar.colorId ? `var(--calendar-color-${calendar.colorId})` : "#4285F4"}`,
                      pl: 2
                    }}
                  >
                    {calendar.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Stack direction="row" spacing={2}>
              <TextField
                label="Target Hours"
                type="number"
                value={goalHours}
                onChange={(e) => setGoalHours(e.target.value)}
                InputProps={{
                  inputProps: { min: 0, step: 0.5 },
                  endAdornment: <InputAdornment position="end">hrs</InputAdornment>,
                }}
                fullWidth
              />
              
              <FormControl fullWidth>
                <InputLabel id="timeframe-select-label">Timeframe</InputLabel>
                <Select
                  labelId="timeframe-select-label"
                  value={timeframe}
                  label="Timeframe"
                  onChange={(e) => setTimeframe(e.target.value)}
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            
            {hasCalendars && selectedCalendar && goalHours && (
              <Typography variant="body2" color="text.secondary">
                You're setting a goal to spend {goalHours} hours {timeframe} on 
                {' '}{calendars.find(cal => cal.id === selectedCalendar)?.name}.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={loading} onClick={handleClose}>Cancel</Button>
          <Button  
            variant="contained" 
            color="primary"
            disabled={loading || !hasCalendars}
            onClick={handleSubmit}
          >
            {loading ? 'Saving...' : 'Save Goal'}
          </Button>
        </DialogActions>
      </Dialog>

      </div>
  );
}