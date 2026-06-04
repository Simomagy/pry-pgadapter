import ReactDOM from "react-dom/client";
import "./index.css";
import { AppProvider } from "./context/AppContext";
import { ResourceProvider } from "./context/ResourceContext";
import App from "./App";

document.addEventListener("keydown", (e) => {
  if (
    e.key === "Backspace" &&
    !(e.target instanceof HTMLInputElement) &&
    !(e.target instanceof HTMLTextAreaElement)
  ) {
    e.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <AppProvider>
    <ResourceProvider>
      <App />
    </ResourceProvider>
  </AppProvider>,
);
