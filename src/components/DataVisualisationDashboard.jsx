import React from 'react';
import {
    Typography,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    Divider,
    Grid,
    Box,
    Paper
} from "@mui/material";
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';

const DataVisualisationDashboard = ({ filteredCalendarStats, filteredEvents, showPercent }) => {
    // Calculate total hours for percentage calculations
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
        <>
            <Typography variant="body1">
                Total hours across all calendars: {Math.round(filteredTotalHours * 10) / 10}
            </Typography>

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
                                        {filteredTotalHours > 0 ? Math.round((cal.totalHours / filteredTotalHours) * 100) : 0}% of total time
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
                    {filteredEvents.length === 0 ? (
                        <Typography variant="body2" p={2}>
                            No events found.
                        </Typography>
                    ) : (
                        <List>{renderEventItems()}</List>
                    )}
                </Paper>
            </Box>
        </>
    );
};

export default DataVisualisationDashboard;