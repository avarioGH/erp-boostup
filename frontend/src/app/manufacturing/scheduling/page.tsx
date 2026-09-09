'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Clock, CalendarDays, Activity } from 'lucide-react';

export default function SchedulingDashboard() {
  const [capacity, setCapacity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<any>(null);

  const fetchCapacity = async () => {
    setLoading(true);
    try {
      const res = await api.get('/manufacturing/capacity');
      setCapacity(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCapacity();
  }, []);

  const runScheduler = async () => {
    setScheduling(true);
    try {
      const res = await api.post('/manufacturing/schedule');
      setScheduleResult(res.data);
      await fetchCapacity(); // Refresh capacity view after scheduling updates durations
    } catch (e) {
      console.error(e);
      alert('Failed to run scheduler');
    }
    setScheduling(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Manufacturing Scheduling & Capacity</h1>
          <p className="text-gray-500">Plan operations, load work centers, and manage routing</p>
        </div>
        <button 
          onClick={runScheduler}
          disabled={scheduling}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <CalendarDays size={18} />
          {scheduling ? 'Scheduling...' : 'Run Auto-Scheduler'}
        </button>
      </div>

      {loading && <p>Loading capacity data...</p>}
      
      {!loading && capacity && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Overall Utilization</CardTitle>
                <Activity className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{capacity.overall_utilization?.toFixed(1)}%</div>
                <p className="text-xs text-gray-500">Across all active work centers</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Overloaded Centers</CardTitle>
                <AlertTriangleIcon className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{capacity.overloaded_centers?.length || 0}</div>
                <p className="text-xs text-gray-500">Exceeding weekly capacity</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Idle Centers</CardTitle>
                <Clock className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{capacity.idle_centers?.length || 0}</div>
                <p className="text-xs text-gray-500">No scheduled workload</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Work Center Capacity Load</CardTitle>
              <CardDescription>Current utilization and planned hours per work center.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {capacity.work_centers?.map((wc: any) => (
                  <div key={wc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="w-1/3">
                      <p className="font-semibold">{wc.name}</p>
                      <p className="text-sm text-gray-500">{wc.code}</p>
                    </div>
                    
                    <div className="w-1/3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{wc.required_hours.toFixed(1)} hrs planned</span>
                        <span>{wc.available_hours_per_day.toFixed(1)} hrs/day avail</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={\h-2 rounded-full \\} 
                          style={{ width: \\%\ }}
                        ></div>
                      </div>
                    </div>

                    <div className="w-1/4 text-right">
                      <span className={\px-2 py-1 rounded text-xs font-semibold \\}>
                        {wc.status} ({wc.utilization_percentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {scheduleResult && (
        <Card className="mt-8 border-blue-200">
          <CardHeader className="bg-blue-50 border-b border-blue-100">
            <CardTitle className="text-blue-800">Auto-Scheduling Results</CardTitle>
            <CardDescription className="text-blue-600">Successfully planned {scheduleResult.scheduled_workload?.length || 0} operations.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2">MO</th>
                    <th className="px-4 py-2">Operation</th>
                    <th className="px-4 py-2">Start Date</th>
                    <th className="px-4 py-2">End Date</th>
                    <th className="px-4 py-2">Duration (mins)</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleResult.scheduled_workload?.map((task: any, i: number) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-2 font-medium">{task.manufacturing_order}</td>
                      <td className="px-4 py-2">{task.operation}</td>
                      <td className="px-4 py-2">{new Date(task.planned_start).toLocaleString()}</td>
                      <td className="px-4 py-2">{new Date(task.planned_end).toLocaleString()}</td>
                      <td className="px-4 py-2">{task.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AlertTriangleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0-3.48 0l-8 14A2 2 0 0 16 21h16a2 2 0 1 21.73-18z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}
