import { useEffect, useState } from "react";
import { fetchAllCalendarEvents } from "../utils/fetchCalendar";
import {
  Container,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Tabs,
  Tab,
  Box
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import CalendarSidebar from "./CalendarSidebar";
import Grid from '@mui/material/Grid';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import DataVisualisationDashboard from "./DataVisualisationDashboard";
import GoalsDashboard from "./GoalsDashboard";
import NewGoalDashboard from "./NewGoalDashboard";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const Dashboard = ({ onDateChange }) => {
  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Data states
  const [events, setEvents] = useState([]);
  const [calendarStats, setCalendarStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState(dayjs().subtract(7, "day"));
  const [endDate, setEndDate] = useState(dayjs());

  const [filteredCalendars, setFilteredCalendars] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filteredCalendarStats, setFilteredCalendarStats] = useState([]);
  const [showPercent, setShowPercent] = useState(false);

  const [user, setUser] = useState(null);

  const [goals, setGoals] = useState([]);

  const [dataVersion, setDataVersion] = useState(0);


  const fetchCalendarGoals = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      console.log("No access token found - user needs to log in");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log({ user });
      const goalsCollection = collection(db, `users/${auth.currentUser.uid}/goals`);
      const goalsSnapshot = await getDocs(goalsCollection);

      // Convert the snapshot to an array of documents with IDs
      const goalsList = goalsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setGoals(goalsList || []);
      console.log("Fetched goals:", goalsList);
    } catch (error) {
      console.error("Error in fetchCalendarGoals:", error);
      setError("Failed to load calendar goals");
    } finally {
      setLoading(false);
    }
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

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
    console.log({ selectedCalendars });
    setFilteredCalendars(selectedCalendars);
    getFilteredData(selectedCalendars);
  }

  const getFilteredData = (selectedCalendars) => {
    if (!selectedCalendars || Object.keys(selectedCalendars).length === 0) {
      // Return early if no selections
      setFilteredCalendars(selectedCalendars);
      setFilteredCalendarStats(calendarStats);
      setFilteredEvents(events);
      return;
    }

    const filterCal = calendarStats.filter(cal => {
      return selectedCalendars[cal.id] === true;
    });
    setFilteredCalendarStats(filterCal);

    const filterEvents = events.filter(event => {
      return selectedCalendars[event.calendarId] === true;
    });
    setFilteredEvents(filterEvents);
  }


  //Init useEffect
  useEffect(() => {
    fetchEvents();
    getFilteredData(filteredCalendars);
    console.log(auth.currentUser);
    setUser(auth.currentUser);
    fetchCalendarGoals();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [dataVersion]);

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

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <DataVisualisationDashboard
            filteredCalendarStats={filteredCalendarStats}
            filteredEvents={filteredEvents}
            showPercent={showPercent}
          />
        );
      case 1:
        return (
            <NewGoalDashboard
              calendarStats={filteredCalendarStats}
              events={filteredEvents}
              startDate={startDate}
              endDate={endDate}
              goals={goals}
              setDataVersion={setDataVersion}
            />
        );
      default:
        return <Typography>Tab content not found</Typography>;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Grid container spacing={3}>
        {/* Sidebar - Takes 3/12 columns on medium+ screens */}
        <Grid item xs={12} md={3}>
          <CalendarSidebar
            calendars={calendarStats}
            onFilterChange={handleFilterChange}
            setShowPercent={setShowPercent}
            showPercent={showPercent}
          />
        </Grid>

        {/* Main Content - Takes 9/12 columns on medium+ screens */}
        <Grid item xs={12} md={9}>
          <Typography variant="h4" gutterBottom>Your Calendar Analytics</Typography>

          <Box mb={4}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Stack direction="row" spacing={2} sx={{ mb: 4, mt: 2 }}>
                <DatePicker label="Start Date" value={startDate} onChange={handleStartDateChange} />
                <DatePicker label="End Date" value={endDate} onChange={handleEndDateChange} />
              </Stack>
            </LocalizationProvider>
          </Box>

          {/* Tab Navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab label="Overview" />
              <Tab label="Goals" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          {renderTabContent()}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;