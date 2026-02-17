# System Flow Overview

Understand the complete lifecycle of participating in the WAH4PC Gateway—from initial registration to ongoing monitoring. This is the 

## Introduction

The WAH4PC Gateway enables healthcare providers to exchange FHIR data securely.
Before diving into individual API calls, it's important to understand the{" "}
**overall system flow**—the lifecycle every provider goes through
to participate in the network.

> **System Flow vs. Transaction Flow**
**System Flow** (this page) describes the *macro-level* lifecycle:
how you join the network, discover other providers, and maintain ongoing participation.

**Transaction Flow** (see{" "}

Transaction Flow

) describes the *micro-level* detail: what happens when you send a single
data request through the gateway.

## The Provider Lifecycle

Every provider goes through five phases. After initial onboarding, you continuously
cycle through discovery, authentication, exchange, and monitoring.

### Lifecycle Overview
```mermaid
flowchart TB
subgraph ONBOARD["Phase 1: Onboarding"]
direction LR
R1[New Provider] --> R2[Register with Gateway]
R2 --> R3[Receive Provider ID]
R3 --> R4[Generate API Key]
end

subgraph DISCOVER["Phase 2: Discovery"]
direction LR
D1[Query Provider Registry] --> D2[Find Target Provider]
D2 --> D3[Get Target's baseUrl]
end

subgraph SECURE["Phase 3: Security"]
direction LR
S1[Include API Key] --> S2[Gateway Validates]
S2 --> S3[Rate Limit Check]
S3 --> S4[Request Authorized]
end

subgraph EXCHANGE["Phase 4: Data Exchange"]
direction LR
E1[Initiate Transaction] --> E2[Gateway Orchestrates]
E2 --> E3[Target Processes]
E3 --> E4[Data Delivered]
end

subgraph MONITOR["Phase 5: Monitoring"]
direction LR
M1[Track Transaction Status] --> M2[View Audit Logs]
M2 --> M3[Monitor Health]
end

ONBOARD --> DISCOVER
DISCOVER --> SECURE
SECURE --> EXCHANGE
EXCHANGE --> MONITOR
MONITOR -.->|Continuous Operation| DISCOVER

style ONBOARD fill:#dbeafe,stroke:#3b82f6
style DISCOVER fill:#dcfce7,stroke:#22c55e
style SECURE fill:#fef3c7,stroke:#f59e0b
style EXCHANGE fill:#e0e7ff,stroke:#6366f1
style MONITOR fill:#fce7f3,stroke:#ec4899
```

## Phase-by-Phase Breakdown

{lifecyclePhases.map((phase) => {
const colors = phaseColors[phase.color];
return (

{phaseIcons[phase.icon]}

Phase {phase.phase}

### {phase.title}

{phase.subtitle}

{phase.description}

#### What Happens

Key Insight

{phase.keyInsight}

);
})}

## System Flow vs. Transaction Flow

Understanding the difference between these two concepts is crucial for proper integration:

Aspect
System Flow
Transaction Flow

{row.aspect}
{row.systemFlow}
{row.transactionFlow}

## Key Concepts

### {concept.term}

{concept.definition}

`
{concept.example}
`

## Quick Start Path

Follow these steps to go from zero to your first data exchange:

{item.step}

{item.action}
`
{item.endpoint}
`

{item.result}

{idx < quickStartSteps.length - 1 && (

)}

## Ready to dive deeper?

###
Provider Integration →

Step-by-step guide to implement the webhook endpoints your system needs.

###
Transaction Flow →

Deep dive into how individual requests move through the gateway.