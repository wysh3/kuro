
export interface RushPrediction {
    time: string; // "HH:MM" 24h format
    likelihood: 'low' | 'medium' | 'high';
    confidence: number; // 0-100
    reason?: string;
}

/**
 * Predicts rush hours based on historical data patterns (hardcoded for MVP)
 * @param date The date to predict for
 * @returns Array of rush predictions
 */
export function predictRushHours(date: Date = new Date()): RushPrediction[] {
    const day = date.getDay();
    const predictions: RushPrediction[] = [];

    // Weekends (0 = Sun, 6 = Sat) have different patterns
    if (day === 0 || day === 6) {
        predictions.push(
            { time: '13:00', likelihood: 'medium', confidence: 60, reason: 'Weekend Brunch' },
            { time: '19:00', likelihood: 'high', confidence: 85, reason: 'Dinner Rush' }
        );
    } else {
        // Weekday patterns (College hours)
        predictions.push(
            { time: '09:00', likelihood: 'medium', confidence: 70, reason: 'Morning Breakfast' },
            { time: '12:30', likelihood: 'high', confidence: 95, reason: 'Lunch Break' },
            { time: '17:00', likelihood: 'medium', confidence: 80, reason: 'Evening Snacks' }
        );
    }

    return predictions;
}

/**
 * Checks if a rush hour is approaching within the specified window
 * @param minutesBefore Window in minutes to warn before rush starts (default 60)
 */
export function getUpcomingRushWarning(minutesBefore: number = 60): RushPrediction | null {
    const now = new Date();
    const predictions = predictRushHours(now);

    // Sort logic requires parsing "HH:MM"
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const pred of predictions) {
        const [h, m] = pred.time.split(':').map(Number);
        const predMinutes = h * 60 + m;

        // If prediction is in the future but within window
        const diff = predMinutes - currentMinutes;

        // Warning window: e.g. 60 mins before up to 15 mins after rush start
        if (diff > -15 && diff <= minutesBefore) {
            return pred;
        }
    }

    return null;
}
