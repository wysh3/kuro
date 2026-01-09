export interface TimeSlot {
    time: Date;
    displayTime: string; // "12:45 PM"
    isOffPeak: boolean;
    discountPercent: number;
    isAvailable: boolean;
    isRecommended: boolean;
    rushWarning?: string;
}

export function generateTimeSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const now = new Date();

    // Kitchen operating hours: 7 AM to 9 PM
    const KITCHEN_OPEN_HOUR = 7;
    const KITCHEN_CLOSE_HOUR = 21; // 9 PM in 24-hour format

    // Calculate start time: Round current time to next 15-minute interval
    // Example: 12:10 -> 12:15, 12:20 -> 12:30, 12:45 -> 13:00
    const currentMinutes = now.getMinutes();
    const remainder = currentMinutes % 15 === 0 ? 15 : 15 - (currentMinutes % 15);
    const startTimestamp = now.getTime() + (remainder * 60 * 1000);
    const start = new Date(startTimestamp);

    // Calculate end time: 6 hours from now
    const sixHoursLater = new Date(now.getTime() + (6 * 60 * 60 * 1000));

    // Determine the actual end time (whichever comes first: 6 hours or kitchen closing)
    const todayClosing = new Date(now);
    todayClosing.setHours(KITCHEN_CLOSE_HOUR, 0, 0, 0);

    const endTime = sixHoursLater.getTime() < todayClosing.getTime()
        ? sixHoursLater
        : todayClosing;

    // Generate slots every 15 minutes from start to end
    let currentSlot = new Date(start);

    while (currentSlot.getTime() < endTime.getTime()) {
        const hour = currentSlot.getHours();
        const minute = currentSlot.getMinutes();

        // Only add slots within kitchen operating hours
        if (hour >= KITCHEN_OPEN_HOUR && hour < KITCHEN_CLOSE_HOUR) {
            // Define Logic for Off-Peak and Rush Hours

            // Off-Peak: 11:00 AM - 12:00 PM AND 2:00 PM - 4:00 PM
            // This incentivizes early lunch or late lunch
            const isOffPeak =
                (hour === 11) ||
                (hour >= 14 && hour < 16);

            // Rush Hour: 12:00 PM - 2:00 PM (Lunch rush) AND 5:00 PM - 7:00 PM (Dinner rush)
            const isRush =
                (hour >= 12 && hour < 14) ||
                (hour >= 17 && hour < 19);

            // Recommendation Logic: Recommend the first off-peak slot available
            const isRecommended = isOffPeak;

            slots.push({
                time: new Date(currentSlot),
                displayTime: currentSlot.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                }),
                isOffPeak,
                discountPercent: isOffPeak ? 10 : 0, // 10% discount for off-peak
                isAvailable: true,
                isRecommended,
                rushWarning: isRush ? 'High demand expected' : undefined
            });
        }

        // Move to next 15-minute slot
        currentSlot = new Date(currentSlot.getTime() + (15 * 60 * 1000));
    }

    // Safety check: Filter out any slots in the past
    return slots.filter(s => s.time.getTime() > now.getTime());
}

export function formatTimeSlotForDisplay(date: Date): string {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}
