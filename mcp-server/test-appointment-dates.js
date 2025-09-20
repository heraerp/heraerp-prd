#!/usr/bin/env node

const { startOfDay, endOfDay, addDays } = require('date-fns');

// Test the date range logic used in useAppointmentsPlaybook hook
const now = new Date();
const date_from = startOfDay(new Date()).toISOString();
const date_to = endOfDay(addDays(new Date(), 14)).toISOString();

console.log('🗓️ Date Range Test\n');
console.log(`Current time: ${now.toISOString()}`);
console.log(`Date from (start of today): ${date_from}`);
console.log(`Date to (end of +14 days): ${date_to}`);

// Test appointment date
const testAppointmentDate = '2025-10-02T10:00:00.000Z';
const testDate = new Date(testAppointmentDate);

console.log(`\nTest appointment date: ${testAppointmentDate}`);
console.log(`Is after date_from? ${testDate >= new Date(date_from)}`);
console.log(`Is before date_to? ${testDate <= new Date(date_to)}`);
console.log(`Would pass filter? ${testDate >= new Date(date_from) && testDate <= new Date(date_to)}`);

// Show actual date values
console.log('\nActual dates:');
console.log(`Today: ${now.toDateString()}`);
console.log(`Test appointment: ${testDate.toDateString()}`);
console.log(`Days difference: ${Math.round((testDate - now) / (1000 * 60 * 60 * 24))} days`);