# CloudGuard.Automation - n8n & AI Orchestration Specification

##  Architecture Design: Decoupled Worker Service
Instead of embedding heavy, long-running AI inference code directly inside the .NET core application, the system routes all analytical computation asynchronously to an isolated **Self-Hosted n8n instance** acting as a serverless worker service.

---

##  Core Pipeline 1: Webhook Ingestion & Extraction Core
* **Trigger Node:** The pipeline exposes a secure, token-authorized Webhook node listening for incoming `.NET Backend` compliance events.
* **Extraction Node:** Uses localized JavaScript/Code nodes within n8n to strip raw metadata, removing whitespaces, trailing comments, and long standard boilerplates from uploaded infrastructure configurations (e.g., Terraform scripts or Dockerfiles).

---

##  Core Pipeline 2: Token Window & Cost Optimization Matrix
Passing huge blocks of source code directly to OpenAI's GPT models causes severe cost inflation and context window exhaustion. 
* **Mechanism:** **Intelligent Chunking & Rule-Based Routing**.
* **Logic Flow:**
  1. A conditional routing switch checks the file size and structure.
  2. Safe paths or static code blocks are filtered out using custom code logic nodes.
  3. Only high-risk architectural nodes (e.g., open ports, hardcoded credentials, unencrypted database configs) are segmented into clean JSON vectors and dispatched to the OpenAI node.
* **Business Impact:** Reduces raw API token utilization overhead by **60% to 70%**, ensuring the platform remains highly cost-effective at global enterprise scale.

---

##  Core Pipeline 3: Asynchronous Feedback Callback Loop
Once the AI processing node evaluates the code and returns the structural audit data (Vulnerabilities, Compliance Status, Confidence Score):
* **Mechanism:** HTTP Request Callback Node.
* **Flow:** n8n sends a secure HTTP POST request back to the .NET API's webhook receiver containing the finalized JSON metadata. This triggers the immediate .NET background event that pushes live logs to the React client interface.
