import React from 'react';
import { useActivity } from '../hooks/useActivity';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  XCircle,
  RefreshCcw 
} from 'lucide-react';

interface ActivityLedgerProps {
  address: string | null;
}

const ActivityLedger: React.FC<ActivityLedgerProps> = ({ address }) => {
  const { activities, isLoading, refresh } = useActivity(address);

  if (!address) return null;

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-neutral-900">Recent Activity</h3>
        </div>
        <button 
          onClick={refresh}
          disabled={isLoading}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh activity"
        >
          <RefreshCcw className={`w-4 h-4 text-neutral-500 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Time</th>
              <th className="px-6 py-3 font-medium text-right">Explorer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {activities.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-neutral-400">
                  No recent activities found
                </td>
              </tr>
            ) : (
              activities.map((activity) => (
                <tr key={activity.id} className="hover:bg-neutral-50 transition-colors text-sm">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        activity.type.includes('Payment') ? 'bg-emerald-100' : 'bg-primary-100'
                      }`}>
                        {activity.type.includes('Payment') ? (
                          <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-primary-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-neutral-900 font-medium">{activity.type}</div>
                        {activity.amount && (
                          <div className="text-xs text-neutral-500">{activity.amount} XLM</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {activity.successful ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-emerald-600 font-medium">Success</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-error" />
                          <span className="text-error font-medium">Failed</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-neutral-500">
                    {new Date(activity.timestamp).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${activity.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLedger;
