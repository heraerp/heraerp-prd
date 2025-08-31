# Debugging "who is available for a haircut today" Error

## Issue Analysis

When you asked "who is available for a haircut today", the system returned an error. Here's what I've done to fix it:

### 1. **Added Better Error Handling**
- Wrapped the availability check in try-catch
- Added console logging to track the issue
- Improved error messages

### 2. **Fixed Database Query Issues**
- Removed problematic metadata query that could fail if null
- Added proper handling for cancelled appointments
- Fixed indentation issues in the code

### 3. **Added Service Name Extraction**
- The system now properly extracts "haircut" from your query
- It can handle variations like "for a haircut" or "for haircuts"

## Possible Remaining Issues

1. **Organization ID Issue**
   - The system might not have a valid organization ID
   - Check browser console for: `Finding available slots: { organizationId: ... }`

2. **No Stylists in Database**
   - If there are no stylists created, the system can't show availability
   - Run the demo data generator: `node mcp-server/generate-salon-demo-data.js`

3. **Date/Time Issue**
   - The system uses local time zone
   - Slots are from 9 AM to 7 PM

## Quick Test

Try these queries to isolate the issue:

1. **Simple availability check**: "available slots today"
2. **Without service**: "who is available today"
3. **Specific time**: "available slots at 2pm"

## Debug Steps

1. Open browser console (F12)
2. Try the query again
3. Look for these logs:
   - `Finding available slots: { date, serviceName, organizationId }`
   - `Error fetching appointments:`
   - `Error finding available slots:`

## Temporary Workaround

If it's still not working, try:
- Refresh the page
- Check if you're logged in with an organization
- Try a simpler query first

The error handling is now improved, so you should see a more helpful error message if something goes wrong.