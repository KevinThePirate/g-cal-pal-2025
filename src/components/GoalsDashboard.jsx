import * as React from 'react';
import AddNewGoal from './AddNewGoal';  // Import the new component

export default function GoalsDashboard ({calendars}) {
    return(
        <div>
            Goals Dashboard
            <AddNewGoal calendars={calendars}/>
        </div>
    )
}