/**
 * Utility functions for the EasyCal barber shop booking system.
 * Extracted from barber.html and index.html for testability.
 */

/**
 * Generates mock appointments for demo/testing purposes.
 * Creates 15 appointments with various statuses spread across multiple days.
 *
 * @param {Date} [baseDate=new Date()] - The base date to generate appointments around
 * @returns {Array} Array of appointment objects
 */
function generateMockAppointments(baseDate = new Date()) {
    const appointments = [];
    const names = ["דוד לוי", "משה כהן", "אבי ישראלי", "יוסי אברהם", "רון דוד", "גיל שמעון", "עמית לוי", "נועם רוזן"];
    const services = ["תספורת גבר", "תספורת + זקן", "סידור זקן", "צבע שיער"];
    const times = ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "15:00", "16:00"];
    const statuses = ["confirmed", "confirmed", "confirmed", "completed", "pending"];

    const today = new Date(baseDate);

    for (let i = 0; i < 15; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + Math.floor(i / 3) - 2);

        appointments.push({
            id: i + 1,
            clientName: names[i % names.length],
            clientPhone: `052-${1000000 + i * 111111}`,
            service: services[i % services.length],
            date: date.toISOString().split('T')[0],
            time: times[i % times.length],
            duration: [40, 45, 20, 60][i % 4],
            price: [100, 130, 70, 180][i % 4],
            status: i < 3 ? statuses[i % statuses.length] : (date < today ? "completed" : "confirmed")
        });
    }

    return appointments;
}

/**
 * Calculates business statistics for a given time period.
 *
 * @param {Array} appointments - Array of appointment objects
 * @param {string} period - Time period: 'today', 'week', 'month', or 'year'
 * @param {Date} [referenceDate=new Date()] - Reference date for calculations
 * @returns {Object} Statistics object with income, appointments, and other metrics
 */
function getStatsForPeriod(appointments, period, referenceDate = new Date()) {
    const now = new Date(referenceDate);
    let startDate = new Date(referenceDate);

    switch (period) {
        case 'today':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        default:
            throw new Error(`Invalid period: ${period}`);
    }

    const periodAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= startDate && apt.status !== 'cancelled';
    });

    const totalIncome = periodAppointments.reduce((sum, apt) => sum + apt.price, 0);
    const totalAppointments = periodAppointments.length;
    const completedAppointments = periodAppointments.filter(apt => apt.status === 'completed').length;
    const avgIncome = totalAppointments > 0 ? Math.round(totalIncome / totalAppointments) : 0;

    const serviceCount = {};
    periodAppointments.forEach(apt => {
        serviceCount[apt.service] = (serviceCount[apt.service] || 0) + 1;
    });
    const popularService = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0];

    // Calculate income change compared to previous period (mock implementation)
    const prevTotalIncome = totalIncome * 0.85;
    const incomeChange = prevTotalIncome > 0 ? Math.round(((totalIncome - prevTotalIncome) / prevTotalIncome) * 100) : 0;

    return {
        totalIncome,
        totalAppointments,
        completedAppointments,
        avgIncome,
        popularService: popularService ? popularService[0] : '-',
        incomeChange
    };
}

/**
 * Filters appointments by a specific date.
 *
 * @param {Array} appointments - Array of appointment objects
 * @param {Date} date - The date to filter by
 * @returns {Array} Appointments for the specified date
 */
function getAppointmentsForDate(appointments, date) {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === dateStr);
}

/**
 * Formats a date in Hebrew locale.
 *
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string in Hebrew
 */
function formatDateHebrew(date) {
    return date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
}

/**
 * Formats a date for display in the booking wizard.
 *
 * @param {Date} date - The date to format
 * @returns {Object} Object with day, date, month, and full formatted date
 */
function formatDate(date) {
    const days = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
    return {
        day: days[date.getDay()],
        date: date.getDate(),
        month: date.toLocaleDateString('he-IL', { month: 'short' }),
        full: date.toLocaleDateString('he-IL')
    };
}

/**
 * Formats a date for display in the add appointment modal.
 *
 * @param {Date|null} date - The date to format, or null
 * @returns {string} Formatted date string or placeholder
 */
function formatDateDisplay(date) {
    if (!date) return 'בחר תאריך';
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return `יום ${days[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}`;
}

/**
 * Checks if a date is in the past (before today).
 *
 * @param {number} day - Day of the month
 * @param {Date} currentMonth - Date object representing the current month
 * @param {Date} [today=new Date()] - Today's date for comparison
 * @returns {boolean} True if the date is in the past
 */
function isPast(day, currentMonth, today = new Date()) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const todayNormalized = new Date(today);
    todayNormalized.setHours(0, 0, 0, 0);
    return date < todayNormalized;
}

/**
 * Validates if user can proceed to the next step in the multi-step form.
 *
 * @param {number} step - Current step number (1, 2, or 3)
 * @param {Object} formData - Form data object
 * @param {string} formData.clientName - Client name
 * @param {string} formData.clientPhone - Client phone
 * @param {Object|null} formData.selectedService - Selected service object
 * @param {Date|null} formData.selectedDate - Selected date
 * @param {string} formData.selectedTime - Selected time
 * @returns {boolean} True if user can proceed to next step
 */
function canProceed(step, formData) {
    const { clientName, clientPhone, selectedService, selectedDate, selectedTime } = formData;

    if (step === 1) return !!(clientName && clientName.trim() && clientPhone && clientPhone.trim());
    if (step === 2) return selectedService !== null;
    if (step === 3) return !!(selectedDate && selectedTime);
    return false;
}

/**
 * Updates a specific field in a working hours entry.
 *
 * @param {Array} hours - Array of working hours objects
 * @param {number} idx - Index of the hour entry to update
 * @param {string} field - Field name to update
 * @param {*} value - New value for the field
 * @returns {Array} Updated hours array
 */
function updateHour(hours, idx, field, value) {
    const updated = [...hours];
    updated[idx] = { ...updated[idx], [field]: value };
    return updated;
}

/**
 * Gets the status badge style and label for an appointment status.
 *
 * @param {string} status - Appointment status
 * @returns {Object} Object with style class and Hebrew label
 */
function getStatusBadge(status) {
    const styles = {
        confirmed: "bg-green-100 text-green-700 border-green-200",
        pending: "bg-amber-100 text-amber-700 border-amber-200",
        completed: "bg-blue-100 text-blue-700 border-blue-200",
        cancelled: "bg-red-100 text-red-700 border-red-200",
    };
    const labels = {
        confirmed: "מאושר",
        pending: "ממתין",
        completed: "הושלם",
        cancelled: "בוטל",
    };

    return {
        style: styles[status] || styles.pending,
        label: labels[status] || status
    };
}

/**
 * Generates initials from a name for avatar placeholder.
 *
 * @param {string} name - Full name
 * @returns {string} Up to 2 character initials
 */
function getInitials(name) {
    if (!name) return '';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2);
}

/**
 * Navigates to a new date based on view mode and direction.
 *
 * @param {Date} currentDate - Current selected date
 * @param {string} viewMode - View mode: 'day', 'week', or 'month'
 * @param {number} direction - Direction: 1 for forward, -1 for backward
 * @returns {Date} New date after navigation
 */
function navigateDate(currentDate, viewMode, direction) {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
        newDate.setDate(newDate.getDate() + direction);
    } else if (viewMode === 'week') {
        newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
        newDate.setMonth(newDate.getMonth() + direction);
    }
    return newDate;
}

/**
 * Validates phone number format (Israeli format).
 *
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if phone format is valid
 */
function isValidPhone(phone) {
    if (!phone) return false;
    // Israeli mobile format: 05X-XXXXXXX or 05XXXXXXXX
    const phoneRegex = /^0[5][0-9][-]?[0-9]{7}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Calculates the end time given a start time and duration.
 *
 * @param {string} startTime - Start time in HH:MM format
 * @param {number} duration - Duration in minutes
 * @returns {string} End time in HH:MM format
 */
function calculateEndTime(startTime, duration) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

/**
 * Generates available time slots for a day.
 *
 * @param {string} openTime - Opening time in HH:MM format
 * @param {string} closeTime - Closing time in HH:MM format
 * @param {number} [interval=30] - Interval between slots in minutes
 * @returns {Array} Array of time slot strings
 */
function generateTimeSlots(openTime, closeTime, interval = 30) {
    const slots = [];
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);

    let currentMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    while (currentMinutes < closeMinutes) {
        const hours = Math.floor(currentMinutes / 60);
        const mins = currentMinutes % 60;
        slots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
        currentMinutes += interval;
    }

    return slots;
}

module.exports = {
    generateMockAppointments,
    getStatsForPeriod,
    getAppointmentsForDate,
    formatDateHebrew,
    formatDate,
    formatDateDisplay,
    isPast,
    canProceed,
    updateHour,
    getStatusBadge,
    getInitials,
    navigateDate,
    isValidPhone,
    calculateEndTime,
    generateTimeSlots
};
