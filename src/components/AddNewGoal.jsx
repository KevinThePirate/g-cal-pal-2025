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
  Box,
  Tooltip,
  IconButton
} from '@mui/material';
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import AddIcon from '@mui/icons-material/Add';
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function AddNewGoal({ 
  calendars = [], 
  selectedCalendarProp, 
  goalHoursProp, 
  timeframeProp,
  goalId,
  calendarNameProp,
  setDataVersion 
}) {
  const hasCalendars = Array.isArray(calendars) && calendars.length > 0;
  
  // Initialize state with prop values if provided, otherwise use defaults
  const [selectedCalendar, setSelectedCalendar] = useState(selectedCalendarProp || '');
  const [goalHours, setGoalHours] = useState(goalHoursProp || '');
  //console.log({timeframeProp})
  const [timeframe, setTimeframe] = useState(timeframeProp || 'weekly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [open, setOpen] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
const [goalToDelete, setGoalToDelete] = useState(null);

  const handleOpen = () => {
    setOpen(true);
    if(selectedCalendarProp){
      setSelectedCalendar(selectedCalendarProp)
      setGoalHours(goalHoursProp);
      setTimeframe(timeframeProp);
    } else{
      setSelectedCalendar('');
      setGoalHours('');
      setTimeframe('weekly');
    }
    setError('');
    setSuccess(false);
  }

  const handleClose = () => setOpen(false);

  const confirmDelete = (goal) => {
    setGoalToDelete(goal);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!goalId) return;
  
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not logged in');
  
      const userId = user.uid;
      const goalDocRef = doc(db, 'users', userId, 'goals', goalId);
      await deleteDoc(goalDocRef);
  
      console.log('Goal deleted:', goalId);
    } catch (err) {
      console.error('Failed to delete goal:', err);
    } finally {
      setShowDeleteModal(false);
      //setGoalToDelete(null);
      setDataVersion(prev => prev + 1)
    }
  };
  

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
  
      const goalData = {
        userId,
        calendarId: selectedCalendar,
        calendarName: calendarInfo.name || 'Unknown Calendar',
        colorId: calendarInfo.colorId || null,
        targetHours: parseFloat(goalHours),
        timeframe,
        updatedAt: new Date()
      };
  
      const goalsCollectionRef = collection(db, 'users', userId, 'goals');
      if (!goalsCollectionRef) {
        setError('Failed to create goals collection reference');
        console.error('Firestore Error: Collection ref returned null/undefined');
        setLoading(false);
        return;
      }
  
      if (goalId) {
        // Editing existing goal
        const goalDocRef = doc(db, 'users', userId, 'goals', goalId);
        await updateDoc(goalDocRef, goalData);
        console.log('Firestore Success: Goal updated', goalData);
      } else {
        // Adding new goal
        await addDoc(goalsCollectionRef, {
          ...goalData,
          createdAt: new Date()
        });
        console.log('Firestore Success: Goal added', goalData);
      }
  
      setSuccess(true);
      setDataVersion(prev => prev + 1)
      setTimeout(() => {
        handleClose();
      }, 1500);
  
    } catch (err) {
      console.error('Firestore Error: Failed to save goal', err);
      setError(`Failed to save goal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  

  return (
    <div>
      {!selectedCalendarProp && (
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
      )}
      {selectedCalendarProp && (
        <Box>
        <Tooltip title="Edit">
            <IconButton size="small">
                <EditIcon fontSize="small" onClick={handleOpen}/>
            </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
            <IconButton size="small">
                <DeleteIcon fontSize="small" onClick={() => confirmDelete()} />
            </IconButton>
        </Tooltip>
    </Box>
      )}

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
          {!selectedCalendarProp ? (
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
          ) : (
            <TextField
              label="Calendar"
              value={calendars.find(cal => cal.id === selectedCalendarProp)?.name || 'Unknown Calendar'}
              fullWidth
              disabled
            />
          )}

            
            <Stack direction="row" spacing={2}>
              <TextField
                label="Target Hours"
                type="number"
                defaultValue={goalHoursProp}
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
                  value={timeframeProp || timeframe}
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

      <Dialog open={showDeleteModal} fullWidth>
  <DialogTitle>Confirm Delete</DialogTitle>

  <DialogContent>
    <Alert severity="warning" sx={{ mb: 2, mt: 1 }}>
      Are you sure you want to delete this goal? This action cannot be undone.
    </Alert>

    <Typography variant="body2" color="text.secondary">
      This will permanently delete the goal for the <strong>{calendarNameProp}</strong> calendar ({goalHoursProp}hrs {timeframeProp}).
    </Typography>
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setShowDeleteModal(false)}>Cancel</Button>
    <Button
      variant="contained"
      color="error"
      onClick={handleDelete}
    >
      Delete
    </Button>
  </DialogActions>
</Dialog>


      </div>
  );
}