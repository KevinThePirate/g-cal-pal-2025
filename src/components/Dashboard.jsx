import { useEffect, useState } from "react";
import { fetchAllCalendarEvents } from "../utils/fetchCalendar";
import {
  Container,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Stack
} from "@mui/material";
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import CalendarSidebar from "./CalendarSidebar";
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  ...theme.applyStyles('dark', {
    backgroundColor: '#1A2027',
  }),
}));

const Dashboard = ({ onDateChange }) => {
  const [events, setEvents] = useState([]);
  const [calendarStats, setCalendarStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState(dayjs().subtract(7, "day"));
  const [endDate, setEndDate] = useState(dayjs());

  const [filteredCalendars, setFilteredCalendars] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filteredCalendarStats, setFilteredCalendarStats] = useState([]);
  const [TestfilteredTotalHours, setFilteredTotalHours] = useState(filteredCalendarStats.reduce((sum, cal) => sum + cal.totalHours, 0));
  
  const [showPercent, setShowPercent] = useState(false);

  const [user, setUser] = useState(null);

  //console.log("Component Loaded");

  const handleStartDateChange = (newDate) => {
    setStartDate(newDate);
    fetchEvents(newDate, endDate);
    if (onDateChange) onDateChange(newDate, endDate);
  };

  const handleEndDateChange = (newDate) => {
    setEndDate(newDate);
    fetchEvents(startDate, newDate);
    if (onDateChange) onDateChange(startDate, newDate);
  };

  const fetchEvents = async (start = startDate, end = endDate) => {
    const token = localStorage.getItem("accessToken");
    
    if (!token) {
      console.log("No access token found - user needs to log in");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const data = await fetchAllCalendarEvents(token, start.toDate(), end.toDate());
      setEvents(data.events || []);
      setCalendarStats(data.calendarStats || []);
      setFilteredTotalHours(calendarStats.reduce((sum, cal) => sum + cal.totalHours, 0))
    } catch (error) {
      console.error("Error in fetchEvents:", error);
      setError("Failed to load calendar events");
      setEvents([]);
      setCalendarStats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (selectedCalendars) => {
      console.log({selectedCalendars})
      setFilteredCalendars(selectedCalendars)
      setFilteredCalendarStats(calendarStats);
      setFilteredEvents(events);
      setFilteredTotalHours(filteredCalendarStats.reduce((sum, cal) => sum + cal.totalHours, 0));
      console.log({filteredCalendars})
      //console.log("Filtering!");
    getFilteredData(selectedCalendars);
  }

  const getFilteredData = (selectedCalendars) => {
    if (!selectedCalendars || Object.keys(selectedCalendars).length === 0) {
      // Return early if no selections
      setFilteredCalendars(selectedCalendars)
      setFilteredCalendarStats(calendarStats);
      setFilteredEvents(events);
      setFilteredTotalHours(filteredCalendarStats.reduce((sum, cal) => sum + cal.totalHours, 0));
      //console.log("Nothing Selected")
      return;
    }
  
    const filterCal = calendarStats.filter(cal => {
      return selectedCalendars[cal.id] === true;  // Add the return statement
    });
    setFilteredCalendarStats(filterCal);
  
    const filterEvents = events.filter(event => {
      return selectedCalendars[event.calendarId] === true;  // Add the return statement
    });
    setFilteredEvents(filterEvents);
  
    //console.log({filterCal});
   // console.log({filterEvents});
  }

  useEffect(() => {
    fetchEvents();
    getFilteredData(filteredCalendars);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  useEffect(() => {
    setFilteredCalendarStats(calendarStats);
    setFilteredEvents(events);
  }, [calendarStats, events]);

  

  if (loading) {
    return (
      <Container sx={{ textAlign: "center", mt: 4 }}>
        <CircularProgress />
        <Typography variant="h6" mt={2}>Loading events...</Typography>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const totalHours = calendarStats.reduce((sum, cal) => sum + cal.totalHours, 0);
  const filteredTotalHours = filteredCalendarStats.reduce((sum, cal) => sum + cal.totalHours, 0);

  // Render list items for events
  const renderEventItems = () => {
    const eventItems = [];
    
    filteredEvents.forEach((event, index) => {
      const hours = Math.floor(event.durationHours);
      const minutes = Math.round((event.durationHours - hours) * 60);
      let duration = "";
      
      if (hours > 0) {
        duration += `${hours} hour${hours !== 1 ? 's' : ''}`;
      }
      if (minutes > 0) {
        duration += `${hours > 0 ? ' ' : ''}${minutes} minute${minutes !== 1 ? 's' : ''}`;
      }

      const formatDateTime = (dateTimeStr) => {
        if (!dateTimeStr) return "N/A";
        const date = new Date(dateTimeStr);
        return date.toLocaleString();
      };

      // Add ListItem
      eventItems.push(
        <ListItem key={`item-${event.id}`} alignItems="flex-start">
          <ListItemText
            primary={event.summary}
            secondary={
              <div>
                <Typography component="span" variant="body2" color="text.primary">
                  Calendar: {event.calendarName || "Primary Calendar"}
                </Typography>
                <br />
                Start: {formatDateTime(event.start?.dateTime || event.start?.date)}
                <br />
                End: {formatDateTime(event.end?.dateTime || event.end?.date)}
                <br />
                Duration: {duration || "N/A"}
                <br />
                Location: {event.location || "No location specified"}
              </div>
            }
          />
        </ListItem>
      );
      
      // Add Divider if not the last item
      if (index < filteredEvents.length - 1) {
        eventItems.push(<Divider key={`divider-${event.id}`} />);
      }
    });
    
    return eventItems;
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Grid container spacing={3}>
        {/* Sidebar - Takes 3/12 columns on medium+ screens */}
        <Grid item xs={12} md={3}>
          <CalendarSidebar calendars={calendarStats} onFilterChange={handleFilterChange} setShowPercent={setShowPercent} showPercent={showPercent}/>
        </Grid>
  
        {/* Main Content - Takes 9/12 columns on medium+ screens */}
        <Grid item xs={12} md={9}>
          <Typography variant="h4" gutterBottom>Your Calendar Analytics</Typography>
  
          <Box mb={4}>
            <Typography variant="h5" gutterBottom>Time Spent by Calendar</Typography>
            <Typography variant="body1">
              Total hours across all calendars: {Math.round(filteredTotalHours * 10) / 10}
            </Typography>
    
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Stack direction="row" spacing={2} sx={{ mb: 4, mt: 2 }}>
                <DatePicker label="Start Date" value={startDate} onChange={handleStartDateChange} />
                <DatePicker label="End Date" value={endDate} onChange={handleEndDateChange} />
              </Stack>
            </LocalizationProvider>
          </Box>
  
          {/* Charts */}
          <Box mb={4}>
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Hours by Calendar</Typography>
              <BarChart
                xAxis={[{ scaleType: "band", data: filteredCalendarStats.map((cal) => cal.name) }]}
                series={[{
                  data: filteredCalendarStats.map((cal) => 
                    showPercent 
                      ? Math.round((cal.totalHours / filteredTotalHours) * 100)
                      : cal.totalHours
                  ),
                  label: showPercent ? "% of Hours Spent" : "Hours Spent"
                }]}
                height={300}
              />
            </Paper>
            
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Time Distribution</Typography>
              <PieChart
                series={[
                  {
                    data: filteredCalendarStats.map((cal) => ({
                      id: cal.name,
                      value: Math.round((cal.totalHours / filteredTotalHours) * 100),
                      label: `${cal.name}`,
                    })),
                  },
                ]}
                height={300}
              />
            </Paper>
          </Box>
  
          {/* Calendar Summary Cards */}
          <Box mb={4}>
            <Typography variant="h5" gutterBottom>Calendar Summary</Typography>
            <Grid container spacing={2}>
              {filteredCalendarStats.map((cal) => (
                <Grid item xs={12} sm={6} md={4} key={cal.id}>
                  <Card
                    sx={{
                      borderLeft: `6px solid ${cal.colorId ? `var(--calendar-color-${cal.colorId})` : "#4285F4"}`,
                      height: '100%'
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6">{cal.name}</Typography>
                      <Typography variant="body2">{cal.id}</Typography>
                      <Typography variant="body2">{cal.roundedHours} hours</Typography>
                      <Typography variant="body2">
                        {totalHours > 0 ? Math.round((cal.totalHours / filteredTotalHours) * 100) : 0}% of total time
                      </Typography>
                      <Typography variant="body2">{cal.eventCount} events</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
  
          {/* Event List */}
          <Box>
            <Typography variant="h5" gutterBottom>
              Your Calendar Events
            </Typography>
            <Typography variant="body1">Total events: {filteredEvents.length}</Typography>
  
            <Paper elevation={2} sx={{ mt: 2 }}>
              {events.length === 0 ? (
                <Typography variant="body2" p={2}>
                  No events found.
                </Typography>
              ) : (
                <List>{renderEventItems()}</List>
              )}
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;