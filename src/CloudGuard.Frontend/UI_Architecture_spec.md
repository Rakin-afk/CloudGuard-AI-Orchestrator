# CloudGuard.Frontend - User Interface & State Architecture

##  Design Breakdown Concept: The DevOps Terminal Vibe
The user interface is designed using **React.js, TypeScript, and Tailwind CSS**. Instead of a standard boring dashboard, it replicates a modern Cloud DevOps Terminal UI to provide real-time scanning feedback to engineering teams.

---

##  Core Feature 1: SignalR WebSocket Client Stream
To prevent constant API polling and reduce server overhead, the UI establishes a persistent duplex connection with the backend.
* **Mechanism:** `@microsoft/signalr` Client SDK.
* **Implementation Flow:** 
  1. On dashboard mount, the React state engine initializes a connection to the `https://api.cloudguard.local/hubs/compliance` gateway.
  2. The client listens to the `ReceiveScanningLogs` event channel.
  3. As n8n processes the compliance workflow, log streams are appended instantly into a virtualized list in React.

---

##  Core Feature 2: Resilient Error Boundaries & Fallbacks
AI processing can introduce latency and network timeouts. To ensure a bulletproof user experience:
* **Mechanism:** React **Error Boundaries**.
* **Flow:** If the active SignalR connection drops or the backend API triggers a 500 error during high-load scanning, an isolated Error Boundary catches the crash locally.
   It gracefully displays a fallback notification component and attempts an exponential backoff automatic reconnection, keeping the rest of the application fully interactive.

---

##  Core Feature 3: Complex Payload Optimization
When Devops engineers drop heavy IaC scripts (e.g., a 10,000-line Kubernetes YAML structure), re-rendering the entire page for every new line of log would instantly freeze the browser.
* **Mechanism:** **Component Memoization & Virtualized Lists**.
* **Flow:** `React.memo` and localized context states are utilized to ensure only the streaming log container re-renders, protecting the browser CPU from redundant paint cycles during high-throughput operations.
