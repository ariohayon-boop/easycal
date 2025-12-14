/**
 * Comprehensive tests for EasyCal utility functions.
 */

const {
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
} = require('./utils');

// ============ generateMockAppointments Tests ============

describe('generateMockAppointments', () => {
    test('should generate exactly 15 appointments', () => {
        const appointments = generateMockAppointments();
        expect(appointments).toHaveLength(15);
    });

    test('should generate appointments with required fields', () => {
        const appointments = generateMockAppointments();
        const requiredFields = ['id', 'clientName', 'clientPhone', 'service', 'date', 'time', 'duration', 'price', 'status'];

        appointments.forEach(apt => {
            requiredFields.forEach(field => {
                expect(apt).toHaveProperty(field);
            });
        });
    });

    test('should generate unique IDs for each appointment', () => {
        const appointments = generateMockAppointments();
        const ids = appointments.map(apt => apt.id);
        const uniqueIds = [...new Set(ids)];
        expect(uniqueIds).toHaveLength(15);
    });

    test('should use valid status values', () => {
        const validStatuses = ['confirmed', 'pending', 'completed', 'cancelled'];
        const appointments = generateMockAppointments();

        appointments.forEach(apt => {
            expect(validStatuses).toContain(apt.status);
        });
    });

    test('should generate appointments with valid prices', () => {
        const validPrices = [100, 130, 70, 180];
        const appointments = generateMockAppointments();

        appointments.forEach(apt => {
            expect(validPrices).toContain(apt.price);
        });
    });

    test('should generate appointments with valid durations', () => {
        const validDurations = [40, 45, 20, 60];
        const appointments = generateMockAppointments();

        appointments.forEach(apt => {
            expect(validDurations).toContain(apt.duration);
        });
    });

    test('should generate appointments with dates in ISO format', () => {
        const appointments = generateMockAppointments();
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

        appointments.forEach(apt => {
            expect(apt.date).toMatch(isoDateRegex);
        });
    });

    test('should generate appointments spread across multiple days', () => {
        const appointments = generateMockAppointments();
        const uniqueDates = [...new Set(appointments.map(apt => apt.date))];
        expect(uniqueDates.length).toBeGreaterThan(1);
    });

    test('should accept custom base date', () => {
        const customDate = new Date('2025-06-15');
        const appointments = generateMockAppointments(customDate);

        // Check that dates are around the custom date
        appointments.forEach(apt => {
            const aptDate = new Date(apt.date);
            const diffDays = Math.abs((aptDate - customDate) / (1000 * 60 * 60 * 24));
            expect(diffDays).toBeLessThanOrEqual(7); // Within a week
        });
    });
});

// ============ getStatsForPeriod Tests ============

describe('getStatsForPeriod', () => {
    const mockAppointments = [
        { id: 1, date: '2025-01-10', status: 'completed', price: 100, service: 'תספורת גבר' },
        { id: 2, date: '2025-01-11', status: 'completed', price: 130, service: 'תספורת + זקן' },
        { id: 3, date: '2025-01-12', status: 'confirmed', price: 70, service: 'סידור זקן' },
        { id: 4, date: '2025-01-13', status: 'cancelled', price: 180, service: 'צבע שיער' },
        { id: 5, date: '2025-01-14', status: 'completed', price: 100, service: 'תספורת גבר' },
    ];

    const referenceDate = new Date('2025-01-15');

    test('should calculate correct total income excluding cancelled appointments', () => {
        const stats = getStatsForPeriod(mockAppointments, 'week', referenceDate);
        // Total: 100 + 130 + 70 + 100 = 400 (cancelled 180 excluded)
        expect(stats.totalIncome).toBe(400);
    });

    test('should count correct number of appointments excluding cancelled', () => {
        const stats = getStatsForPeriod(mockAppointments, 'week', referenceDate);
        expect(stats.totalAppointments).toBe(4);
    });

    test('should count correct number of completed appointments', () => {
        const stats = getStatsForPeriod(mockAppointments, 'week', referenceDate);
        expect(stats.completedAppointments).toBe(3);
    });

    test('should calculate correct average income', () => {
        const stats = getStatsForPeriod(mockAppointments, 'week', referenceDate);
        expect(stats.avgIncome).toBe(100); // 400 / 4 = 100
    });

    test('should identify the most popular service', () => {
        const stats = getStatsForPeriod(mockAppointments, 'week', referenceDate);
        expect(stats.popularService).toBe('תספורת גבר'); // Appears twice
    });

    test('should return "-" for popular service when no appointments', () => {
        const stats = getStatsForPeriod([], 'week', referenceDate);
        expect(stats.popularService).toBe('-');
    });

    test('should return zero values for empty appointments', () => {
        const stats = getStatsForPeriod([], 'week', referenceDate);
        expect(stats.totalIncome).toBe(0);
        expect(stats.totalAppointments).toBe(0);
        expect(stats.completedAppointments).toBe(0);
        expect(stats.avgIncome).toBe(0);
    });

    test('should filter appointments correctly for "today" period', () => {
        const todayAppointments = [
            { id: 1, date: '2025-01-15', status: 'completed', price: 100, service: 'A' },
            { id: 2, date: '2025-01-14', status: 'completed', price: 200, service: 'B' }, // Yesterday
        ];
        const stats = getStatsForPeriod(todayAppointments, 'today', referenceDate);
        expect(stats.totalAppointments).toBe(1);
        expect(stats.totalIncome).toBe(100);
    });

    test('should filter appointments correctly for "month" period', () => {
        const monthAppointments = [
            { id: 1, date: '2025-01-10', status: 'completed', price: 100, service: 'A' },
            { id: 2, date: '2024-12-01', status: 'completed', price: 200, service: 'B' }, // More than 1 month ago
        ];
        const stats = getStatsForPeriod(monthAppointments, 'month', referenceDate);
        expect(stats.totalAppointments).toBe(1);
    });

    test('should throw error for invalid period', () => {
        expect(() => {
            getStatsForPeriod(mockAppointments, 'invalid_period', referenceDate);
        }).toThrow('Invalid period: invalid_period');
    });

    test('should calculate income change percentage', () => {
        const stats = getStatsForPeriod(mockAppointments, 'week', referenceDate);
        // Income change is calculated as: ((current - prev) / prev) * 100
        // Where prev = current * 0.85
        // So change = ((400 - 340) / 340) * 100 ≈ 18%
        expect(stats.incomeChange).toBe(18);
    });
});

// ============ getAppointmentsForDate Tests ============

describe('getAppointmentsForDate', () => {
    const appointments = [
        { id: 1, date: '2025-01-15', service: 'A' },
        { id: 2, date: '2025-01-15', service: 'B' },
        { id: 3, date: '2025-01-16', service: 'C' },
    ];

    test('should return appointments matching the given date', () => {
        const date = new Date('2025-01-15');
        const result = getAppointmentsForDate(appointments, date);
        expect(result).toHaveLength(2);
        expect(result.map(a => a.id)).toEqual([1, 2]);
    });

    test('should return empty array when no appointments match', () => {
        const date = new Date('2025-01-20');
        const result = getAppointmentsForDate(appointments, date);
        expect(result).toHaveLength(0);
    });

    test('should handle dates correctly regardless of time component', () => {
        const date = new Date('2025-01-15T23:59:59');
        const result = getAppointmentsForDate(appointments, date);
        expect(result).toHaveLength(2);
    });
});

// ============ formatDateHebrew Tests ============

describe('formatDateHebrew', () => {
    test('should format date in Hebrew locale', () => {
        const date = new Date('2025-01-15');
        const result = formatDateHebrew(date);

        // Check that it contains Hebrew text
        expect(result).toMatch(/[\u0590-\u05FF]/); // Hebrew character range
    });

    test('should include weekday in the result', () => {
        const result = formatDateHebrew(new Date('2025-01-15'));
        // January 15, 2025 is a Wednesday (יום רביעי)
        expect(result).toBeTruthy();
    });
});

// ============ formatDate Tests ============

describe('formatDate', () => {
    test('should return object with day, date, month, and full properties', () => {
        const date = new Date('2025-01-15');
        const result = formatDate(date);

        expect(result).toHaveProperty('day');
        expect(result).toHaveProperty('date');
        expect(result).toHaveProperty('month');
        expect(result).toHaveProperty('full');
    });

    test('should return correct Hebrew day abbreviation for Sunday', () => {
        const sunday = new Date('2025-01-12'); // This is a Sunday
        const result = formatDate(sunday);
        expect(result.day).toBe('א׳');
    });

    test('should return correct Hebrew day abbreviation for Saturday', () => {
        const saturday = new Date('2025-01-11'); // This is a Saturday
        const result = formatDate(saturday);
        expect(result.day).toBe('ש׳');
    });

    test('should return correct day of month', () => {
        const date = new Date('2025-01-15');
        const result = formatDate(date);
        expect(result.date).toBe(15);
    });

    test('should handle single digit days', () => {
        const date = new Date('2025-01-05');
        const result = formatDate(date);
        expect(result.date).toBe(5);
    });
});

// ============ formatDateDisplay Tests ============

describe('formatDateDisplay', () => {
    test('should return placeholder for null date', () => {
        expect(formatDateDisplay(null)).toBe('בחר תאריך');
    });

    test('should return placeholder for undefined date', () => {
        expect(formatDateDisplay(undefined)).toBe('בחר תאריך');
    });

    test('should format date with Hebrew day name', () => {
        const sunday = new Date('2025-01-12');
        const result = formatDateDisplay(sunday);
        expect(result).toContain('ראשון');
        expect(result).toContain('12');
    });

    test('should include month number in format', () => {
        const date = new Date('2025-03-15');
        const result = formatDateDisplay(date);
        expect(result).toContain('/3');
    });
});

// ============ isPast Tests ============

describe('isPast', () => {
    const currentMonth = new Date('2025-01-15');
    const today = new Date('2025-01-15');

    test('should return true for days before today', () => {
        expect(isPast(10, currentMonth, today)).toBe(true);
        expect(isPast(14, currentMonth, today)).toBe(true);
    });

    test('should return false for today', () => {
        expect(isPast(15, currentMonth, today)).toBe(false);
    });

    test('should return false for future days', () => {
        expect(isPast(16, currentMonth, today)).toBe(false);
        expect(isPast(31, currentMonth, today)).toBe(false);
    });

    test('should handle first day of month', () => {
        expect(isPast(1, currentMonth, today)).toBe(true);
    });

    test('should handle month boundaries correctly', () => {
        const december = new Date('2024-12-01');
        const todayDec = new Date('2024-12-15');
        expect(isPast(10, december, todayDec)).toBe(true);
        expect(isPast(20, december, todayDec)).toBe(false);
    });
});

// ============ canProceed Tests ============

describe('canProceed', () => {
    describe('step 1 - client details', () => {
        test('should return true when both name and phone are provided', () => {
            const formData = { clientName: 'John', clientPhone: '050-1234567' };
            expect(canProceed(1, formData)).toBe(true);
        });

        test('should return false when name is missing', () => {
            const formData = { clientName: '', clientPhone: '050-1234567' };
            expect(canProceed(1, formData)).toBe(false);
        });

        test('should return false when phone is missing', () => {
            const formData = { clientName: 'John', clientPhone: '' };
            expect(canProceed(1, formData)).toBe(false);
        });

        test('should return false when name is only whitespace', () => {
            const formData = { clientName: '   ', clientPhone: '050-1234567' };
            expect(canProceed(1, formData)).toBe(false);
        });

        test('should return false when both are missing', () => {
            const formData = { clientName: '', clientPhone: '' };
            expect(canProceed(1, formData)).toBe(false);
        });
    });

    describe('step 2 - service selection', () => {
        test('should return true when service is selected', () => {
            const formData = { selectedService: { id: 1, name: 'Haircut' } };
            expect(canProceed(2, formData)).toBe(true);
        });

        test('should return false when service is null', () => {
            const formData = { selectedService: null };
            expect(canProceed(2, formData)).toBe(false);
        });
    });

    describe('step 3 - date and time', () => {
        test('should return true when both date and time are selected', () => {
            const formData = { selectedDate: new Date(), selectedTime: '10:00' };
            expect(canProceed(3, formData)).toBe(true);
        });

        test('should return false when date is missing', () => {
            const formData = { selectedDate: null, selectedTime: '10:00' };
            expect(canProceed(3, formData)).toBe(false);
        });

        test('should return false when time is missing', () => {
            const formData = { selectedDate: new Date(), selectedTime: '' };
            expect(canProceed(3, formData)).toBe(false);
        });

        test('should return false when both are missing', () => {
            const formData = { selectedDate: null, selectedTime: '' };
            expect(canProceed(3, formData)).toBe(false);
        });
    });

    test('should return false for invalid step numbers', () => {
        const formData = { clientName: 'John', clientPhone: '050-1234567' };
        expect(canProceed(0, formData)).toBe(false);
        expect(canProceed(4, formData)).toBe(false);
        expect(canProceed(99, formData)).toBe(false);
    });
});

// ============ updateHour Tests ============

describe('updateHour', () => {
    const mockHours = [
        { day: 'ראשון', open: '09:00', close: '19:00', isOpen: true },
        { day: 'שני', open: '09:00', close: '19:00', isOpen: true },
        { day: 'שבת', open: '', close: '', isOpen: false },
    ];

    test('should update a single field correctly', () => {
        const result = updateHour(mockHours, 0, 'open', '10:00');
        expect(result[0].open).toBe('10:00');
        expect(result[0].close).toBe('19:00'); // Other fields unchanged
    });

    test('should not mutate the original array', () => {
        const original = [...mockHours];
        updateHour(mockHours, 0, 'open', '10:00');
        expect(mockHours).toEqual(original);
    });

    test('should update isOpen field', () => {
        const result = updateHour(mockHours, 2, 'isOpen', true);
        expect(result[2].isOpen).toBe(true);
    });

    test('should preserve other entries in the array', () => {
        const result = updateHour(mockHours, 1, 'close', '20:00');
        expect(result[0]).toEqual(mockHours[0]);
        expect(result[2]).toEqual(mockHours[2]);
    });
});

// ============ getStatusBadge Tests ============

describe('getStatusBadge', () => {
    test('should return correct style and label for confirmed status', () => {
        const result = getStatusBadge('confirmed');
        expect(result.style).toContain('green');
        expect(result.label).toBe('מאושר');
    });

    test('should return correct style and label for pending status', () => {
        const result = getStatusBadge('pending');
        expect(result.style).toContain('amber');
        expect(result.label).toBe('ממתין');
    });

    test('should return correct style and label for completed status', () => {
        const result = getStatusBadge('completed');
        expect(result.style).toContain('blue');
        expect(result.label).toBe('הושלם');
    });

    test('should return correct style and label for cancelled status', () => {
        const result = getStatusBadge('cancelled');
        expect(result.style).toContain('red');
        expect(result.label).toBe('בוטל');
    });

    test('should return default for unknown status', () => {
        const result = getStatusBadge('unknown');
        expect(result.label).toBe('unknown');
    });
});

// ============ getInitials Tests ============

describe('getInitials', () => {
    test('should return first two initials from a two-word name', () => {
        expect(getInitials('John Doe')).toBe('JD');
    });

    test('should return first two initials from a three-word name', () => {
        expect(getInitials('John Paul Doe')).toBe('JP');
    });

    test('should return single initial for single word name', () => {
        expect(getInitials('John')).toBe('J');
    });

    test('should return empty string for empty name', () => {
        expect(getInitials('')).toBe('');
    });

    test('should return empty string for null/undefined', () => {
        expect(getInitials(null)).toBe('');
        expect(getInitials(undefined)).toBe('');
    });

    test('should handle Hebrew names', () => {
        expect(getInitials('יעקב כהן')).toBe('יכ');
    });

    test('should handle names with multiple spaces', () => {
        expect(getInitials('John  Doe')).toBe('JD');
    });
});

// ============ navigateDate Tests ============

describe('navigateDate', () => {
    const baseDate = new Date('2025-01-15');

    describe('day view mode', () => {
        test('should move forward by one day', () => {
            const result = navigateDate(baseDate, 'day', 1);
            expect(result.getDate()).toBe(16);
        });

        test('should move backward by one day', () => {
            const result = navigateDate(baseDate, 'day', -1);
            expect(result.getDate()).toBe(14);
        });
    });

    describe('week view mode', () => {
        test('should move forward by one week', () => {
            const result = navigateDate(baseDate, 'week', 1);
            expect(result.getDate()).toBe(22);
        });

        test('should move backward by one week', () => {
            const result = navigateDate(baseDate, 'week', -1);
            expect(result.getDate()).toBe(8);
        });
    });

    describe('month view mode', () => {
        test('should move forward by one month', () => {
            const result = navigateDate(baseDate, 'month', 1);
            expect(result.getMonth()).toBe(1); // February
        });

        test('should move backward by one month', () => {
            const result = navigateDate(baseDate, 'month', -1);
            expect(result.getMonth()).toBe(11); // December
        });
    });

    test('should not mutate the original date', () => {
        const originalDate = new Date('2025-01-15');
        navigateDate(originalDate, 'day', 1);
        expect(originalDate.getDate()).toBe(15);
    });

    test('should handle month boundary correctly', () => {
        const endOfMonth = new Date('2025-01-31');
        const result = navigateDate(endOfMonth, 'day', 1);
        expect(result.getMonth()).toBe(1); // February
        expect(result.getDate()).toBe(1);
    });
});

// ============ isValidPhone Tests ============

describe('isValidPhone', () => {
    test('should return true for valid Israeli mobile number with dash', () => {
        expect(isValidPhone('050-1234567')).toBe(true);
        expect(isValidPhone('052-7654321')).toBe(true);
        expect(isValidPhone('054-1111111')).toBe(true);
    });

    test('should return true for valid Israeli mobile number without dash', () => {
        expect(isValidPhone('0501234567')).toBe(true);
        expect(isValidPhone('0527654321')).toBe(true);
    });

    test('should return false for invalid formats', () => {
        expect(isValidPhone('123-4567890')).toBe(false);
        expect(isValidPhone('050-123456')).toBe(false); // Too short
        expect(isValidPhone('050-12345678')).toBe(false); // Too long
        expect(isValidPhone('060-1234567')).toBe(false); // Invalid prefix
    });

    test('should return false for empty or null values', () => {
        expect(isValidPhone('')).toBe(false);
        expect(isValidPhone(null)).toBe(false);
        expect(isValidPhone(undefined)).toBe(false);
    });

    test('should handle phone numbers with spaces', () => {
        expect(isValidPhone('050 1234567')).toBe(true);
        expect(isValidPhone(' 050-1234567 ')).toBe(true);
    });
});

// ============ calculateEndTime Tests ============

describe('calculateEndTime', () => {
    test('should calculate end time correctly for simple cases', () => {
        expect(calculateEndTime('09:00', 30)).toBe('09:30');
        expect(calculateEndTime('10:00', 60)).toBe('11:00');
    });

    test('should handle duration crossing hour boundary', () => {
        expect(calculateEndTime('09:30', 45)).toBe('10:15');
        expect(calculateEndTime('09:45', 30)).toBe('10:15');
    });

    test('should handle multi-hour durations', () => {
        expect(calculateEndTime('10:00', 120)).toBe('12:00');
        expect(calculateEndTime('09:30', 90)).toBe('11:00');
    });

    test('should handle end time at midnight', () => {
        expect(calculateEndTime('23:30', 30)).toBe('00:00');
    });

    test('should handle end time past midnight', () => {
        expect(calculateEndTime('23:00', 120)).toBe('01:00');
    });

    test('should pad single digit hours and minutes', () => {
        expect(calculateEndTime('08:00', 60)).toBe('09:00');
        expect(calculateEndTime('09:00', 5)).toBe('09:05');
    });
});

// ============ generateTimeSlots Tests ============

describe('generateTimeSlots', () => {
    test('should generate slots with default 30-minute interval', () => {
        const slots = generateTimeSlots('09:00', '11:00');
        expect(slots).toEqual(['09:00', '09:30', '10:00', '10:30']);
    });

    test('should respect custom interval', () => {
        const slots = generateTimeSlots('09:00', '10:00', 15);
        expect(slots).toEqual(['09:00', '09:15', '09:30', '09:45']);
    });

    test('should return empty array when close time equals open time', () => {
        const slots = generateTimeSlots('09:00', '09:00');
        expect(slots).toEqual([]);
    });

    test('should not include closing time slot', () => {
        const slots = generateTimeSlots('09:00', '10:00', 30);
        expect(slots).not.toContain('10:00');
    });

    test('should handle non-standard start times', () => {
        const slots = generateTimeSlots('08:15', '09:15', 30);
        expect(slots).toEqual(['08:15', '08:45']);
    });

    test('should generate full day of slots', () => {
        const slots = generateTimeSlots('09:00', '19:00', 60);
        expect(slots).toHaveLength(10);
        expect(slots[0]).toBe('09:00');
        expect(slots[9]).toBe('18:00');
    });

    test('should handle afternoon hours correctly', () => {
        const slots = generateTimeSlots('14:00', '16:00', 30);
        expect(slots).toEqual(['14:00', '14:30', '15:00', '15:30']);
    });
});
