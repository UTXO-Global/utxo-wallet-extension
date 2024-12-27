import ReactDOM from "react-dom/client";
import "./index.global.scss";
import App from "./App";
import { StrictMode } from "react";
import "../shared/locales/i18n";
import { TransactionManagerProvider } from "./utils/tx-ctx";
import "react-tooltip/dist/react-tooltip.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const isDevelopment = process.env.NODE_ENV === "development";

root.render(
  isDevelopment ? (
    <TransactionManagerProvider>
      <App />
    </TransactionManagerProvider>
  ) : (
    <StrictMode>
      <TransactionManagerProvider>
        <App />
      </TransactionManagerProvider>
    </StrictMode>
  )
);
