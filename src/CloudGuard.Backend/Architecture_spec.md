# CloudGuard.Backend - Technical Architecture Specification

##  Architecture Design
This backend is designed using some of **Clean Architecture** principles to ensure enterprise-grade scalability, decoupling, and zero-trust security for a multi-tenant DevSecOps infrastructure compliance auditor.

---

##  Core Feature 1: Multi-Tenancy & Data Isolation
If there are two Tenant like Tenant A and Tenant B, then to guarantee that Tenant A's private source code or cloud configurations never leak to Tenant B, the backend implements database-level isolation.
* **Mechanism:** Entity Framework Core (EF Core) **Global Query Filters**.
* **Implementation Logic:** Every database context automatically appends a tenant check filter on initialization:
  `modelBuilder.Entity<CloudTemplate>().HasQueryFilter(t => t.TenantId == _currentTenantService.TenantId);`
* **Result:** Even if a developer accidentally misses a `WHERE` clause in raw SQL or Linq queries, the database securely restricts data leakages across organizations.

---

##  Core Feature 2: Non-Blocking Async Queue
Analyzing large infrastructure-as-code (IaC) files or long Dockerfiles takes substantial compute time. To protect server health:
* **Mechanism:** .NET Core **Background Tasks (IHostedService / Channel)**.
* **Flow:** When a file is uploaded via REST API, the main thread instantly responds with `202 Accepted` and pushes the payload into an in-memory queue. The server thread is immediately freed up to handle new incoming traffic while a background worker processes the payload.

---

##  Core Feature 3: Real-Time Telemetry Pipeline
As the compliance scanning progresses, the system streams terminal-style logs back to the user interface.
* **Mechanism:** **SignalR (WebSockets)**.
* **Flow:** The background worker or external automation nodes post scan checkpoints (e.g., `Dockerfile Scan Completed`, `Critical Vulnerability Found`) back to the .NET gateway, that instantly broadcasts the telemetry logs down to the React frontend client via an open WebSocket connection.

---

##  Automation Bridge (n8n Integration)
The backend does not execute heavy AI logic locally. Instead, it serves as a secure gateway that delegates the heavy lifting to an external microservice layer.
* **Webhook Trigger:** .NET dispatches processed JSON vectors to `n8n` secure webhooks for advanced workflow routing and AI context reduction.
