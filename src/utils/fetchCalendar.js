// In utils/fetchCalendar.js
import dayjs from "dayjs";

// First, get a list of all calendars
export const fetchCalendarList = async (token, pageToken = null) => {
  try {
    let url =
      "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250";

    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching calendar list:", error);
    throw error;
  }
};

// Get all calendars with pagination
export const fetchAllCalendars = async (token) => {
  let allCalendars = [];
  let nextPageToken = null;

  do {
    const data = await fetchCalendarList(token, nextPageToken);
    allCalendars = [...allCalendars, ...(data.items || [])];
    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  return allCalendars;
};

// Get today and yesterday's date range in RFC3339 format for the Google Calendar API
export const getTimeRangeRFC3339 = (startDate, endDate) => {
  console.log(startDate, endDate);
  const startTime = dayjs(startDate).startOf("day").toISOString(); // Convert startDate to RFC 3339
  const endTime = dayjs(endDate).endOf("day").toISOString(); // Convert endDate to RFC 3339

  return { startTime, endTime };
};

// Check if an event should be excluded (multi-day events that are not overnight)
export const shouldExcludeEvent = (event) => {
  // If it doesn't have date/time information, skip it
  if (!event.start || !event.end) {
    console.log("No proper dates so Skipping:", event);
    return true;
  }

  // Check if this is an all-day or multi-day event
  if (event.start.date && event.end.date) {
    const startDate = new Date(event.start.date);
    const endDate = new Date(event.end.date);

    // Google Calendar API: end date is exclusive, so subtract one day
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setDate(adjustedEndDate.getDate() - 1);

    // Calculate the number of days this event spans
    const durationDays =
      Math.round((adjustedEndDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // If it spans more than one day, exclude it
    if (durationDays > 1) {
      console.log("More than one day so Skipping:", event);
      return true;
    }
    const eventStart = new Date(event.start.dateTime || event.start.date);
    const eventEnd = new Date(event.end.dateTime || event.end.date);
    // Calculate event duration in hours
    const durationMs = eventEnd - eventStart;
    const durationHours = durationMs / (1000 * 60 * 60);

    // Exclude events longer than 16 hours
    if (durationHours > 16) return true;
  }

  return false;
};

// Check if an event is an overnight event (starts one day, ends the next)
export const isOvernightEvent = (event) => {
  if (!event.start?.dateTime || !event.end?.dateTime) return false;

  const startTime = new Date(event.start.dateTime);
  const endTime = new Date(event.end.dateTime);

  // Check if start and end dates are different
  return startTime.getDate() !== endTime.getDate();
};

// Calculate event duration in hours, with specific handling for overnight events
export const calculateEventDurationHours = (event, startTime, endTime) => {
  const rangeStart = new Date(startTime);
  const rangeEnd = new Date(endTime);

  // For regular timed events
  if (event.start?.dateTime && event.end?.dateTime) {
    let eventStart = new Date(event.start.dateTime);
    let eventEnd = new Date(event.end.dateTime);

    // Handle overnight events specially
    if (isOvernightEvent(event)) {
      const startDay = new Date(eventStart);
      startDay.setHours(0, 0, 0, 0);

      const endDay = new Date(eventEnd);
      endDay.setHours(0, 0, 0, 0);

      // If the event span is exactly one day
      if ((endDay - startDay) / (1000 * 60 * 60 * 24) === 1) {
        // For the first day, count from start time to midnight
        const midnightEnd = new Date(eventStart);
        midnightEnd.setHours(23, 59, 59, 999);

        // For the second day, count from midnight to end time
        const midnightStart = new Date(eventEnd);
        midnightStart.setHours(0, 0, 0, 0);

        const firstDayDuration = (midnightEnd - eventStart) / (1000 * 60 * 60);
        const secondDayDuration = (eventEnd - midnightStart) / (1000 * 60 * 60);

        // Determine which day we're calculating for
        const day = new Date(rangeStart);
        day.setHours(12, 0, 0, 0); // Use noon to avoid DST issues

        const eventStartDay = new Date(eventStart);
        eventStartDay.setHours(12, 0, 0, 0);

        if (
          day.getDate() === eventStartDay.getDate() &&
          day.getMonth() === eventStartDay.getMonth() &&
          day.getFullYear() === eventStartDay.getFullYear()
        ) {
          return firstDayDuration;
        } else {
          return secondDayDuration;
        }
      } else {
        // If it spans more than one night, treat as a multi-day event
        return 0;
      }
    }

    // Clip event to our time range for regular events
    if (eventStart < rangeStart) eventStart = rangeStart;
    if (eventEnd > rangeEnd) eventEnd = rangeEnd;

    const durationMs = eventEnd - eventStart;
    const durationHours = durationMs / (1000 * 60 * 60);
    return durationHours;
  }

  // For single-day all-day events, count as 24 hours
  if (event.start?.date && event.end?.date) {
    const startDate = new Date(event.start.date);
    // End date in Google Calendar API is exclusive, so subtract one day
    const endDate = new Date(
      new Date(event.end.date).setDate(new Date(event.end.date).getDate() - 1)
    );

    // If it's a single-day event
    if (startDate.toDateString() === endDate.toDateString()) {
      return 24; // Count as 24 hours
    }

    return 0; // Multi-day all-day events are excluded
  }

  return 0;
};

// Fetch events from a specific calendar
export const fetchCalendarEvents = async (
  token,
  calendarId,
  pageToken = null,
  startTime,
  endTime
) => {
  try {
    //const { startTime, endTime } = getTimeRangeRFC3339();

    let url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events?maxResults=250&timeMin=${encodeURIComponent(
      startTime
    )}&timeMax=${encodeURIComponent(endTime)}`;

    // Handle recurring events by expanding them into instances
    url += "&singleEvents=true";

    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching events for calendar ${calendarId}:`, error);
    throw error;
  }
};

// Fetch all events from a specific calendar with pagination
export const fetchAllEventsForCalendar = async (
  token,
  calendarId,
  startTime,
  endTime
) => {
  let allEvents = [];
  let nextPageToken = null;

  do {
    const data = await fetchCalendarEvents(
      token,
      calendarId,
      nextPageToken,
      startTime,
      endTime
    );
    // Filter out multi-day events but keep overnight events
    const filteredEvents = (data.items || []).filter(
      (event) => !shouldExcludeEvent(event)
    );
    allEvents = [...allEvents, ...filteredEvents];
    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  return allEvents;
};

// Fetch all events from all calendars with hours analytics
export const fetchAllCalendarEvents = async (token, startDate, endDate) => {
  // Get all calendars the user has access to
  const calendars = await fetchAllCalendars(token);

  // Generate proper time range with the provided dates
  const { startTime, endTime } = getTimeRangeRFC3339(startDate, endDate);

  // For each calendar, fetch events
  const eventsPromises = calendars.map((calendar) =>
    fetchAllEventsForCalendar(token, calendar.id, startTime, endTime).then(
      (events) => {
        // Map events and add calendar info
        return events.map((event) => {
          // Calculate duration based on whether it's an overnight event or regular event
          const duration = calculateEventDurationHours(
            event,
            startTime,
            endTime
          );

          return {
            ...event,
            calendarId: calendar.id,
            calendarName: calendar.summary,
            colorId: calendar.colorId || calendar.backgroundColor,
            durationHours: duration,
            isOvernight: isOvernightEvent(event),
          };
        });
      }
    )
  );

  // Wait for all promises to resolve
  const eventsArrays = await Promise.all(eventsPromises);

  // Flatten the arrays of events into a single array
  const allEvents = eventsArrays.flat();

  // Calculate total hours per calendar
  const calendarStats = calculateCalendarStats(allEvents);

  return {
    events: allEvents,
    calendarStats,
  };
};

// Calculate statistics for each calendar
export const calculateCalendarStats = (events) => {
  const calendarHours = {};
  const calendarEventCounts = {};
  const calendarInfo = {};

  // Loop through all events and accumulate hours by calendar
  events.forEach((event) => {
    const calendarId = event.calendarId;

    if (!calendarHours[calendarId]) {
      calendarHours[calendarId] = 0;
      calendarEventCounts[calendarId] = 0;
      calendarInfo[calendarId] = {
        name: event.calendarName,
        colorId: event.colorId,
      };
    }

    calendarHours[calendarId] += event.durationHours;
    calendarEventCounts[calendarId]++;
  });

  // Create array of calendar stats for frontend
  const stats = Object.keys(calendarHours).map((calendarId) => ({
    id: calendarId,
    name: calendarInfo[calendarId].name,
    colorId: calendarInfo[calendarId].colorId,
    totalHours: calendarHours[calendarId],
    roundedHours: Math.round(calendarHours[calendarId] * 10) / 10, // Round to 1 decimal place
    eventCount: calendarEventCounts[calendarId],
  }));

  // Sort by most hours first
  return stats.sort((a, b) => b.totalHours - a.totalHours);
};
