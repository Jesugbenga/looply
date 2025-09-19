// Event Operations
export const eventUtils = {
  // Get available events
  getAvailableEvents(): string[] {
    return [
      'Rhema Chapel Sunday Service at 9 am',
      'Rhema Glow Sunday Service at 12 pm',
      'Midweek Service',
    ];
  },

  // Get event details (for future expansion)
  getEventDetails(eventName: string): { name: string; time: string; location: string } | null {
    const events: Record<string, { name: string; time: string; location: string }> = {
      'Rhema Chapel Sunday Service at 9 am': {
        name: 'Rhema Chapel Sunday Service',
        time: '9:00 AM',
        location: 'Rhema Chapel',
      },
      'Rhema Glow Sunday Service at 12 pm': {
        name: 'Rhema Glow Sunday Service',
        time: '12:00 PM',
        location: 'Rhema Chapel',
      },
      'Midweek Service': {
        name: 'Midweek Service',
        time: '7:00 PM',
        location: 'Rhema Chapel',
      },
    };

    return events[eventName] || null;
  },
};
