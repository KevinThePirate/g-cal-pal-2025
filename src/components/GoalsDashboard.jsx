import * as React from 'react';
import { useState, useEffect } from 'react';
import AddNewGoal from './AddNewGoal';
import {
    Typography,
    Box,
    Paper,
    Grid,
    Card,
    CardContent,
    CardHeader,
    LinearProgress,
    Divider,
    Chip,
    Button,
    IconButton,
    Tooltip
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import dayjs from 'dayjs';

export default function GoalsDashboard({ calendarStats, goals, events, startDate, endDate }) {
    const [goalProgress, setGoalProgress] = useState([]);

    // Calculate progress for each goal compared to actual calendar usage
    useEffect(() => {
        if (!goals || !calendarStats) return;

        const progress = goals.map(goal => {
            // Find matching calendar stats
            const calendarStat = calendarStats.find(stat => stat.id === goal.calendarId);

            // Calculate hours based on the timeframe
            let targetHoursForPeriod = goal.targetHours;
            let actualHours = calendarStat ? calendarStat.totalHours : 0;
            let periodLabel = '';

            // Adjust target hours based on timeframe
            switch (goal.timeframe) {
                case 'weekly':
                    // Calculate the number of weeks in the date range
                    const weeks = dayjs(endDate).diff(dayjs(startDate), 'week', true);
                    targetHoursForPeriod = goal.targetHours * weeks;
                    periodLabel = `${Math.round(weeks * 10) / 10} weeks`;
                    break;
                case 'monthly':
                    // Calculate the number of months in the date range
                    const months = dayjs(endDate).diff(dayjs(startDate), 'month', true);
                    targetHoursForPeriod = goal.targetHours * months;
                    periodLabel = `${Math.round(months * 10) / 10} months`;
                    break;
                default: // daily
                    // Calculate the number of days in the date range
                    const days = dayjs(endDate).diff(dayjs(startDate), 'day', true);
                    targetHoursForPeriod = goal.targetHours * days;
                    periodLabel = `${Math.round(days * 10) / 10} days`;
            }

            // Calculate percentage
            const percentage = targetHoursForPeriod > 0
                ? Math.min(Math.round((actualHours / targetHoursForPeriod) * 100), 100)
                : 0;

            // Determine status
            let status = 'in-progress';
            if (percentage >= 200) {
                status = 'over-achieved';
            }
            else if (percentage >= 100) {
                status = 'completed';
            } else if (percentage < 50 && dayjs().isAfter(dayjs(endDate))) {
                status = 'behind';
            }

            return {
                ...goal,
                actualHours,
                targetHoursForPeriod,
                percentage,
                status,
                periodLabel,
                difference: actualHours - targetHoursForPeriod
            };
        });

        setGoalProgress(progress);
    }, [goals, calendarStats, startDate, endDate]);

    // Handle goal deletion (placeholder)
    const handleDeleteGoal = (goalId) => {
        console.log(`Delete goal with ID: ${goalId}`);
        // Implement actual deletion logic here
    };

    // Handle goal edit (placeholder)
    const handleEditGoal = (goal) => {
        console.log(`Edit goal:`, goal);
        // Implement edit logic here
    };

    // Get status chip based on goal progress
    const getStatusChip = (status) => {
        switch (status) {
            case 'completed':
                return <Chip
                    icon={<CheckCircleIcon />}
                    label="Completed"
                    color="success"
                    size="small"
                />;
            case 'behind':
                return <Chip
                    icon={<ErrorIcon />}
                    label="Behind"
                    color="error"
                    size="small"
                />;
            default:
                return <Chip
                    icon={<AccessTimeIcon />}
                    label="In Progress"
                    color="primary"
                    size="small"
                />;
        }
    };

    return (
        <Box>
            <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" gutterBottom>Calendar Goals</Typography>
                <AddNewGoal calendars={calendarStats} />
            </Box>

            {/* Summary Charts */}
            {goalProgress.length > 0 && (
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={2} sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>Goal Progress</Typography>
                            <BarChart
                                xAxis={[{
                                    scaleType: 'band',
                                    data: goalProgress.map(goal => goal.calendarName)
                                }]}
                                series={[
                                    {
                                        data: goalProgress.map(goal => goal.percentage),
                                        label: 'Completion %',
                                        valueFormatter: (value) => `${value}%`
                                    }
                                ]}
                                height={300}
                            />
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={2} sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>Hours Comparison</Typography>
                            <BarChart
                                xAxis={[{
                                    scaleType: 'band',
                                    data: goalProgress.map(goal => goal.calendarName)
                                }]}
                                series={[
                                    {
                                        data: goalProgress.map(goal => goal.targetHoursForPeriod),
                                        label: 'Target Hours'
                                    },
                                    {
                                        data: goalProgress.map(goal => goal.actualHours),
                                        label: 'Actual Hours'
                                    }
                                ]}
                                height={300}
                            />
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* No goals message */}
            {goalProgress.length === 0 && (
                <Paper elevation={1} sx={{ p: 3, textAlign: 'center', mb: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                        No goals set yet
                    </Typography>
                    <Typography color="text.secondary" mb={2}>
                        Create your first calendar goal to track your time management
                    </Typography>
                </Paper>
            )}

            {/* Goals List */}
            <Grid container spacing={3}>
                {goalProgress.map((goal, index) => (
                    <Grid item xs={12} md={6} lg={4} key={goal.id || index}>
                        <Card
                            sx={{
                                height: '100%',
                                borderLeft: `6px solid ${goal.status === 'completed' ? 'green' :
                                    goal.status === 'behind' ? 'red' : 'blue'
                                    }`
                            }}
                        >
                            <CardHeader
                                title={goal.calendarName}
                                action={
                                    <Box>
                                        <Tooltip title="Edit">
                                            <IconButton size="small" onClick={() => handleEditGoal(goal)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton size="small" onClick={() => handleDeleteGoal(goal.id)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                }
                                subheader={getStatusChip(goal.status)}
                            />
                            <Divider />
                            <CardContent>
                                <Box mb={2}>
                                    <Typography variant="body2" color="text.secondary">
                                        Goal: {goal.targetHours} hours {goal.timeframe}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        For this period ({goal.periodLabel}): {Math.round(goal.targetHoursForPeriod * 10) / 10} hours
                                    </Typography>
                                </Box>

                                <Box mb={2}>
                                    <Typography variant="body2" gutterBottom display="flex" justifyContent="space-between">
                                        <span>Progress:</span>
                                        <span>{goal.percentage}%</span>
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={goal.percentage}
                                        sx={{ height: 8, borderRadius: 5 }}
                                        color={
                                            goal.status === 'completed' ? 'success' :
                                                goal.status === 'behind' ? 'error' : 'primary'
                                        }
                                    />
                                </Box>

                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Actual: {Math.round(goal.actualHours * 10) / 10} hours
                                    </Typography>

                                    {goal.difference > 0 ? (
                                        <Typography variant="body2" color="success.main">
                                            +{Math.round(goal.difference * 10) / 10} hours over goal
                                        </Typography>
                                    ) : goal.difference < 0 ? (
                                        <Typography variant="body2" color="error.main">
                                            {Math.round(Math.abs(goal.difference) * 10) / 10} hours under goal
                                        </Typography>
                                    ) : (
                                        <Typography variant="body2">
                                            Exactly on target
                                        </Typography>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Distribution Chart - Only show if there are goals */}
            {goalProgress.length > 0 && (
                <Paper elevation={2} sx={{ p: 2, mt: 4 }}>
                    <Typography variant="h6" gutterBottom>Time Distribution vs Goals</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" align="center" gutterBottom>Target Distribution</Typography>
                            <PieChart
                                series={[
                                    {
                                        data: goalProgress.map(goal => ({
                                            id: goal.calendarName,
                                            value: goal.targetHoursForPeriod,
                                            label: `${goal.calendarName}`,
                                        })),
                                    },
                                ]}
                                height={300}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" align="center" gutterBottom>Actual Distribution</Typography>
                            <PieChart
                                series={[
                                    {
                                        data: goalProgress.map(goal => ({
                                            id: goal.calendarName,
                                            value: goal.actualHours,
                                            label: `${goal.calendarName}`,
                                        })),
                                    },
                                ]}
                                height={300}
                            />
                        </Grid>
                    </Grid>
                </Paper>
            )}
        </Box>
    );
}