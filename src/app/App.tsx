import { useState } from 'react';
import { useAppStore } from '../core/store';
import { AccountsUI } from '../modules/accounts';
import { PaymentsUI } from '../modules/payments';
import { ExchangeUI } from '../modules/exchange';
import { IssuanceUI } from '../modules/issuance';

type Module = 'accounts' | 'payments' | 'exchange' | 'issuance';

export function App() {
  const isReady = useAppStore((s) => s.isReady);
  const [currentModule, setCurrentModule] = useState<Module>('accounts');

  if (!isReady) {
    return (
      <div className="app-init">
        <h1>Tempo Modular App</h1>
        <button onClick={() => useAppStore.getState().setReady()}>Initialize Application</button>
      </div>
    );
  }

  const renderModule = () => {
    switch (currentModule) {
      case 'accounts':
        return <AccountsUI />;
      case 'payments':
        return <PaymentsUI />;
      case 'exchange':
        return <ExchangeUI />;
      case 'issuance':
        return <IssuanceUI />;
      default:
        return <AccountsUI />;
    }
  };

  return (
    <div className="app-container">
      <nav className="module-nav">
        <button
          onClick={() => setCurrentModule('accounts')}
          className={currentModule === 'accounts' ? 'active' : ''}
        >
          Accounts
        </button>
        <button
          onClick={() => setCurrentModule('payments')}
          className={currentModule === 'payments' ? 'active' : ''}
        >
          Payments
        </button>
        <button
          onClick={() => setCurrentModule('exchange')}
          className={currentModule === 'exchange' ? 'active' : ''}
        >
          Exchange
        </button>
        <button
          onClick={() => setCurrentModule('issuance')}
          className={currentModule === 'issuance' ? 'active' : ''}
        >
          Issuance
        </button>
      </nav>

      <main className="module-container">{renderModule()}</main>
    </div>
  );
}
