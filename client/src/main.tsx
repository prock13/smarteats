import { createRoot } from "react-dom/client";
import "./index.css"; // Global styles first
import App from "./App";

// Ensure the root element exists
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

createRoot(rootElement).render(<App />);