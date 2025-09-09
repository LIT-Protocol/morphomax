import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { env } from '@/config/env';

const { VITE_BACKEND_URL } = env;

interface MetricsData {
  agendaJobs: {
    total: number;
    byStatus: {
      completed: number;
      failed: number;
      scheduled: number;
      running: number;
    };
    jobs: Array<{
      name: string;
      nextRunAt: string | null;
      lastRunAt: string | null;
      lastFinishedAt: string | null;
      failCount: number;
      failedAt: string | null;
      disabled: boolean;
      repeatInterval: string | null;
      data: {
        pkpInfo?: {
          ethAddress?: string;
        };
      } | null;
    }>;
  };
  morphoSwaps: {
    total: number;
    recent: Array<{
      id: string;
      scheduleId: string;
      success: boolean;
      pkpAddress: string;
      topVault: {
        name: string;
        address: string;
        apy: number;
        netApy: number;
      } | null;
      deposits: number;
      redeems: number;
      createdAt: string;
      updatedAt: string;
    }>;
  };
}

export function Metrics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'agenda' | 'morpho'>('agenda');

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        const response = await fetch(`${VITE_BACKEND_URL}/metrics`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Metrics data received:', data);
        console.log('Agenda jobs count:', data.agendaJobs?.total);
        console.log('Morpho swaps count:', data.morphoSwaps?.total);
        setMetrics(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
        setError('Failed to load metrics data');
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 relative z-10">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Metrics Dashboard</h1>
          <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            Back to Home
          </Link>
        </div>

        {loading && <div className="text-gray-900 dark:text-white">Loading metrics...</div>}
        {error && <div className="text-red-600 dark:text-red-500">{error}</div>}

        {metrics && (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('agenda')}
                  className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
                    activeTab === 'agenda'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Agenda Jobs ({metrics.agendaJobs.total})
                </button>
                <button
                  onClick={() => setActiveTab('morpho')}
                  className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
                    activeTab === 'morpho'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Morpho Swaps ({metrics.morphoSwaps.total})
                </button>
              </nav>
            </div>

            {/* Agenda Jobs Tab */}
            {activeTab === 'agenda' && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Agenda Jobs
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                    <div className="text-gray-600 dark:text-gray-400 text-sm">Total</div>
                    <div className="text-gray-900 dark:text-white text-xl font-bold">
                      {metrics.agendaJobs.total}
                    </div>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                    <div className="text-gray-600 dark:text-gray-400 text-sm">Completed</div>
                    <div className="text-green-600 dark:text-green-400 text-xl font-bold">
                      {metrics.agendaJobs.byStatus.completed}
                    </div>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                    <div className="text-gray-600 dark:text-gray-400 text-sm">Failed</div>
                    <div className="text-red-600 dark:text-red-400 text-xl font-bold">
                      {metrics.agendaJobs.byStatus.failed}
                    </div>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                    <div className="text-gray-600 dark:text-gray-400 text-sm">Scheduled</div>
                    <div className="text-blue-600 dark:text-blue-400 text-xl font-bold">
                      {metrics.agendaJobs.byStatus.scheduled}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-gray-900 dark:text-white">
                    <thead className="border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">PKP Address</th>
                        <th className="text-left p-2">Next Run</th>
                        <th className="text-left p-2">Last Run</th>
                        <th className="text-left p-2">Fail Count</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.agendaJobs.jobs.map((job, idx) => (
                        <tr key={idx} className="border-b border-gray-200 dark:border-gray-800">
                          <td className="p-2">{job.name}</td>
                          <td className="p-2">
                            {job.data?.pkpInfo?.ethAddress ? (
                              <a
                                href={`https://basescan.org/address/${job.data.pkpInfo.ethAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-mono"
                              >
                                {job.data.pkpInfo.ethAddress.slice(0, 10)}...
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="p-2">
                            {job.nextRunAt ? new Date(job.nextRunAt).toLocaleString() : '-'}
                          </td>
                          <td className="p-2">
                            {job.lastRunAt ? new Date(job.lastRunAt).toLocaleString() : '-'}
                          </td>
                          <td className="p-2">{job.failCount}</td>
                          <td className="p-2">
                            {job.disabled && <span className="text-gray-500">Disabled</span>}
                            {!job.disabled && job.failCount > 0 && (
                              <span className="text-red-600 dark:text-red-400">Failed</span>
                            )}
                            {!job.disabled && job.failCount === 0 && job.lastFinishedAt && (
                              <span className="text-green-600 dark:text-green-400">Success</span>
                            )}
                            {!job.disabled && !job.lastFinishedAt && (
                              <span className="text-yellow-600 dark:text-yellow-400">Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Morpho Swaps Tab */}
            {activeTab === 'morpho' && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Morpho Swaps (Total: {metrics.morphoSwaps.total})
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-gray-900 dark:text-white">
                    <thead className="border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="text-left p-2">ID</th>
                        <th className="text-left p-2">Success</th>
                        <th className="text-left p-2">PKP Address</th>
                        <th className="text-left p-2">Top Vault</th>
                        <th className="text-left p-2">APY</th>
                        <th className="text-left p-2">Deposits</th>
                        <th className="text-left p-2">Redeems</th>
                        <th className="text-left p-2">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.morphoSwaps.recent.map((swap) => (
                        <tr key={swap.id} className="border-b border-gray-200 dark:border-gray-800">
                          <td className="p-2 text-xs font-mono">{swap.id.slice(-8)}</td>
                          <td className="p-2">
                            {swap.success ? (
                              <span className="text-green-600 dark:text-green-400">✓</span>
                            ) : (
                              <span className="text-red-600 dark:text-red-400">✗</span>
                            )}
                          </td>
                          <td className="p-2 text-xs font-mono">
                            {swap.pkpAddress?.slice(0, 10)}...
                          </td>
                          <td className="p-2 text-sm">{swap.topVault?.name || '-'}</td>
                          <td className="p-2">
                            {swap.topVault?.apy ? `${(swap.topVault.apy * 100).toFixed(2)}%` : '-'}
                          </td>
                          <td className="p-2">{swap.deposits}</td>
                          <td className="p-2">{swap.redeems}</td>
                          <td className="p-2 text-xs">
                            {new Date(swap.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
