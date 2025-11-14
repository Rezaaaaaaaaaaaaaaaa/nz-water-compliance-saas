/**
 * Incident Timeline Component
 *
 * Visual timeline of incidents and events with severity indicators
 */

'use client';

interface Incident {
  id: string;
  date: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: string;
  resolved: boolean;
}

interface IncidentTimelineProps {
  incidents: Incident[];
}

const severityColors = {
  LOW: { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700', dot: 'bg-blue-500' },
  MEDIUM: { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  HIGH: { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-700', dot: 'bg-orange-500' },
  CRITICAL: { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-700', dot: 'bg-red-500' },
};

export function IncidentTimeline({ incidents }: IncidentTimelineProps) {
  // Sort by date descending
  const sortedIncidents = [...incidents].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="w-full">
      {/* Stats Summary */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <StatCard
          title="Total Incidents"
          value={incidents.length}
          color="blue"
        />
        <StatCard
          title="Critical"
          value={incidents.filter(i => i.severity === 'CRITICAL').length}
          color="red"
        />
        <StatCard
          title="Unresolved"
          value={incidents.filter(i => !i.resolved).length}
          color="orange"
        />
        <StatCard
          title="Resolved"
          value={incidents.filter(i => i.resolved).length}
          color="green"
        />
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {/* Events */}
        <div className="space-y-6">
          {sortedIncidents.map((incident, index) => {
            const colors = severityColors[incident.severity];

            return (
              <div key={incident.id} className="relative flex items-start gap-6">
                {/* Timeline dot */}
                <div className={`relative z-10 flex-shrink-0 w-16 h-16 rounded-full ${colors.bg} border-4 ${colors.border} flex items-center justify-center`}>
                  {incident.resolved ? (
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className={`w-8 h-8 ${colors.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>

                {/* Event content */}
                <div className={`flex-1 p-6 bg-white border-2 ${colors.border} rounded-lg shadow-md ${index === 0 ? 'ring-2 ring-blue-200' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{incident.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(incident.date).toLocaleString('en-NZ', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${colors.bg} ${colors.text}`}>
                        {incident.severity}
                      </span>
                      {incident.resolved && (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                          RESOLVED
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3">{incident.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {incident.type}
                    </span>
                    <span>•</span>
                    <span>ID: {incident.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {incidents.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 font-medium">No incidents recorded</p>
          <p className="text-gray-500 text-sm mt-2">All systems operating normally</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
  }[color];

  return (
    <div className={`p-4 rounded-lg ${colorClasses}`}>
      <p className="text-sm opacity-80">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
