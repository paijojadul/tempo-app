import { AccountsUI } from '../modules/accounts';
import { PaymentsUI } from '../modules/payments';
import { ExchangeUI } from '../modules/exchange';
import { IssuanceUI } from '../modules/issuance';

export function App() {
  return (
    <div className="app-container">
      <h1>Tempo Modular App</h1>

      <section>
        <AccountsUI />
      </section>

      <section>
        <PaymentsUI />
      </section>

      <section>
        <ExchangeUI />
      </section>

      <section>
        <IssuanceUI />
      </section>
    </div>
  );
}
