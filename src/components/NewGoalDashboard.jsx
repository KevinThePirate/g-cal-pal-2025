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

export default function NewGoalDashboard({ calendarStats, goals, events, startDate, endDate }) {
    const [goalProgress, setGoalProgress] = useState([]);

    useEffect(() => {
        if (!goals || !calendarStats) return;

        const progress = goals.map(goal => {
            let calendarStat = calendarStats.find((stat) => stat.goalId === goal.id);
            let targetHoursForPeriod = goal.targetHours || 0;
            let actualHours = calendarStat ? calendarStat.completedHours : 0;
            let periodLabel = "";

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
            console.log({
                ...goal,
                actualHours,
                targetHoursForPeriod,
                percentage,
                status,
                periodLabel,
                difference: actualHours - targetHoursForPeriod
            })
            return {
                ...goal,
                actualHours,
                targetHoursForPeriod,
                percentage,
                status,
                periodLabel,
                difference: actualHours - targetHoursForPeriod
            };
        }
        );
        setGoalProgress(progress);
    }, [goals, calendarStats, startDate, endDate]);
}