# CloudGuard.Database - Relational Schema & Multi-Tenancy Design

##  Database Choice: PostgreSQL
**PostgreSQL** is selected due to its enterprise-grade support for complex relational integrity, row-level performance tuning, and robust connection pooling under high-throughput DevSecOps audit logging.

---

##  Entity-Relationship (ER) Architecture
To maintain absolute data isolation across multiple organizations (Tenants), every table in the cluster contains a strict foreign key reference to a global master Tenant register.

### 1. `Tenants` Table (The Gatekeeper)
Stores the enterprise accounts subscribed to the CloudGuard platform.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `TenantId` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for each company/client. |
| `CompanyName` | VARCHAR(255) | NOT NULL | Name of the corporate organization. |
| `SubscriptionTier` | VARCHAR(50) | NOT NULL | E.g., 'Enterprise', 'Premium', 'Growth'. |
| `CreatedAt` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Metadata tracking. |

### 2. `AuditTemplates` Table (The Source Payload)
Stores the metadata of the cloud templates (Terraform, YAML, Dockerfiles) uploaded for checking.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `TemplateId` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for the configuration file. |
| `TenantId` | UUID | FOREIGN KEY REFERENCES Tenants(TenantId) | **The Multi-Tenancy Isolation Key.** |
| `FileName` | VARCHAR(255) | NOT NULL | Name of the uploaded configuration template. |
| `StorageUrl` | TEXT | NOT NULL | Secure path to cloud object storage (e.g., AWS S3 bucket). |
| `UploadedBy` | VARCHAR(150) | NOT NULL | User account tracking within the tenant group. |

### 3. `ComplianceReports` Table (The AI Feedback Output)
Stores the structural analytics and vulnerability vectors returned by the n8n + OpenAI worker service.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `ReportId` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for the audit run. |
| `TenantId` | UUID | FOREIGN KEY REFERENCES Tenants(TenantId) | **The Multi-Tenancy Isolation Key.** |
| `TemplateId` | UUID | FOREIGN KEY REFERENCES AuditTemplates(TemplateId) | Direct linkage to the source code file. |
| `SecurityScore` | INT | CHECK (SecurityScore BETWEEN 0 AND 100) | Numerical health indicator. |
| `VulnerabilityPayload` | JSONB | NOT NULL | **Highly optimized Postgres JSONB field storing nested AI logs.** |
| `ScannedAt` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Runtime timestamp. |

---

##  Performance Optimization: JSONB Indexes & Query Filters
1. **JSONB Data Indexing:** Since the AI output contains variable nested properties (e.g., specific lines of bad code, CVE ratings), storing it as `JSONB` allows schema-less flexibility. We implement a **GIN (Generalized Inverted Index)** over the `VulnerabilityPayload` column for lightning-fast sub-property queries.
2. **Global Query Enforcement:** The .NET Entity Framework layer relies on these precise foreign key mappings (`TenantId`) to seamlessly bind the global isolation filters during runtime.
