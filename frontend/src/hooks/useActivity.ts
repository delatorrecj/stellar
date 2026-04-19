import { useState, useEffect } from 'react';
import { getHorizonServer } from '../lib/rpc';

export interface Activity {
  id: string;
  type: string;
  timestamp: string;
  successful: boolean;
  amount?: string;
  memo?: string;
  transactionHash: string;
}

export function useActivity(address: string | null) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchActivity = async () => {
    if (!address) return;
    setIsLoading(true);

    try {
      const server = await getHorizonServer();
      // Fetch operations for the user account to see what they've done
      const response = await server.operations()
        .forAccount(address)
        .order('desc')
        .limit(20)
        .call();

      const records = response.records.map(op => {
        // We try to identify contract calls or transfers related to Stella
        let type = op.type;
        if (op.type === 'invoke_host_function') {
          type = 'Contract Call';
        }

        return {
          id: op.id,
          type,
          timestamp: op.created_at,
          successful: op.transaction_successful,
          transactionHash: op.transaction_hash,
          // For payments, we can show amount
          amount: (op as any).amount,
        };
      });

      setActivities(records);
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
    // Refresh every 30s
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, [address]);

  return { activities, isLoading, refresh: fetchActivity };
}
