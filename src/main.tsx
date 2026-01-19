import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";

// Force env vars to be loaded before app initialization
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
    <App />
  </ThemeProvider>
);
