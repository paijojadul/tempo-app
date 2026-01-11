import { useEffect } from 'react';
import { Card } from '../../shared/ui/components/Card';
import { Button } from '../../shared/ui/Button';
import { useTransactionsStore } from './store';
// Service dipanggil dari PARENT component, bukan dari sini!

interface TransactionsUIProps {
  // Data dan functions disediakan oleh parent
  items?: any[];
  onLoadData?: () => Promise<void>;
  onCreateItem?: (data: any) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export function TransactionsUI({ 
  items = [],
  onLoadData,
  onCreateItem,
  loading = false,
  error = null 
}: TransactionsUIProps) {
  const store = useTransactionsStore();

  // Update store ketika props berubah
  useEffect(() => {
    store.setItems?.(items);
  }, [items, store]);

  useEffect(() => {
    store.setLoading?.(loading);
  }, [loading, store]);

  useEffect(() => {
    store.setError?.(error);
  }, [error, store]);

  const handleRefresh = () => {
    if (onLoadData) {
      onLoadData();
    }
  };

  const handleCreate = () => {
    if (onCreateItem) {
      onCreateItem({ name: 'New Item' });
    }
  };

  if (store.loading) {
    return (
      <Card title="Transactions Module" variant="primary">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Loading transactions data...</p>
        </div>
      </Card>
    );
  }

  if (store.error) {
    return (
      <Card title="Error" variant="primary">
        <p>Error: {store.error}</p>
        <Button onClick={() => store.clearError?.()}>Dismiss</Button>
        <Button onClick={handleRefresh} variant="primary" style={{ marginLeft: '10px' }}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <Card title="Transactions Module" variant="primary">
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <Button onClick={handleRefresh} disabled={store.loading}>
            🔄 Refresh Data
          </Button>
          <Button onClick={handleCreate} variant="primary" disabled={store.loading}>
            ➕ Create New
          </Button>
          <Button onClick={() => store.reset?.()} variant="primary">
            🗑️ Reset
          </Button>
        </div>

        <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
          <p>
            <strong>Total Items:</strong> {store.items.length}
          </p>
          {store.selectedItem && (
            <p>
              <strong>Selected:</strong> {store.selectedItem.name}
            </p>
          )}
        </div>
      </div>

      {store.items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          <p>No items found. Create one!</p>
        </div>
      ) : (
        <div>
          <h4 style={{ marginBottom: '10px' }}>Items List:</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {store.items.map((item) => (
              <li 
                key={item.id} 
                style={{
                  padding: '10px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  background: store.selectedItem?.id === item.id ? '#e7f3ff' : 'transparent'
                }}
                onClick={() => store.setSelectedItem?.(item)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong>{item.name}</strong>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      ID: {item.id} • Created: {item.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      store.removeItemById?.(item.id);
                    }}
                    variant="primary"
                    style={{ padding: '2px 8px', fontSize: '12px' }}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
