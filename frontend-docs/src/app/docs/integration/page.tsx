"use client";

import {
  Server,
  ArrowDownToLine,
  ArrowUpFromLine,
  Settings,
  Shield,
  Lightbulb,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { DiagramContainer } from "@/components/ui/diagram-container";
import { DocsHeader } from "@/components/ui/docs-header";
import { StepSection } from "@/components/ui/step-section";
import { JsonViewer } from "@/components/ui/json-viewer";
import { AlertBlock } from "@/components/ui/alert-block";
import { FeatureCard } from "@/components/ui/feature-card";
import { RequestHeaders } from "@/components/ui/request-headers";
import { config } from "@/lib/config";
import { PrerequisiteItem, ChecklistItem } from "@/components/ui/checklist";
import { MethodBadge } from "@/components/ui/method-badge";
import { WebhookCard } from "@/components/integration/webhook-card";
import { ImplementationTabs } from "@/components/integration/implementation-tabs";
import { LastUpdated } from "@/components/ui/last-updated";
import {
  integrationFlowDiagram,
  webhookHandlerDiagram,
  nodeJsExample,
  goExample,
  pythonExample,
  dartExample,
  checklistItems,
  prerequisites,
  securityFeatures,
  bestPractices,
  commonPitfalls,
  fhirRequestHeaders,
} from "./data";

export default function IntegrationPage() {
  return (
    <article className="relative">
      <DocsHeader
        badge="Integration Guide"
        badgeColor="green"
        title="Provider Integration"
        description="Complete guide to connect your healthcare system with the WAH4PC Gateway. Learn what endpoints you need to implement, how to handle patient identifiers, and best practices for seamless integration."
      />

      {/* Prerequisites */}
      <section id="prerequisites" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Prerequisites</h2>
        <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6">
          <ul className="space-y-4">
            {prerequisites.map((item) => (
              <PrerequisiteItem
                key={item.title}
                title={item.title}
                description={item.description}
              />
            ))}
          </ul>
        </div>
      </section>

      {/* Integration Flow Overview */}
      <section id="flow" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Integration Flow Overview</h2>
        <p className="mb-6 text-slate-600">
          The diagram below shows the complete integration flow, including registration,
          requesting data, and providing data to other providers.
        </p>
        <DiagramContainer 
          chart={integrationFlowDiagram} 
          title="End-to-End Integration Flow"
          filename="integration_flow.mmd"
        />
      </section>

      {/* Step 1: Registration */}
      <StepSection
        id="registration"
        stepNumber={1}
        title="Register Your Organization"
        description="Before exchanging data, you must register your organization with the system administrator. This process establishes your identity in the network."
      >
        <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Registration Process</h3>
          </div>

          <AlertBlock type="info" className="mb-6">
            <strong>Note:</strong> Provider registration is currently an administrative process. Please contact the system administrator to register your organization.
          </AlertBlock>
          
          <div className="space-y-4 text-slate-600">
             <p>You will need to provide the following information:</p>
             <ul className="list-disc pl-5 space-y-2">
                <li>Organization Name</li>
                <li>Provider Type (e.g., hospital, clinic)</li>
                <li>Base URL (publicly accessible webhook endpoint)</li>
             </ul>
             <p>Once registered, you will receive:</p>
             <ul className="list-disc pl-5 space-y-2">
                <li><strong>Provider ID:</strong> Your unique identifier (UUID)</li>
                <li><strong>API Key:</strong> Secret key for authenticating your requests</li>
             </ul>
          </div>
        </div>
      </StepSection>

      {/* Step 2: Implement Webhooks */}
      <StepSection
        id="webhooks"
        stepNumber={2}
        title="Implement Webhook Endpoints"
        description="The gateway communicates with your system via webhooks. You must implement two endpoints on your backend that the gateway will call."
      >
        <DiagramContainer 
          chart={webhookHandlerDiagram} 
          title="Webhook Interaction Pattern"
          filename="webhooks.mmd"
          className="mb-8"
        />

        {/* Webhook 1: Process Query */}
        <WebhookCard
          icon={<ArrowDownToLine className="h-6 w-6 text-blue-700" />}
          iconBg="bg-blue-100"
          borderColor="border-blue-200"
          bgColor="bg-blue-50/30"
          title="Webhook 1: Process Query"
          subtitle="Called when another provider requests data from you"
          method="POST"
          endpoint="{your_base_url}/fhir/process-query"
          requestCode={`{
  "transactionId": "txn_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "requesterId": "requesting-provider-uuid",
  "identifiers": [
    {
      "system": "http://philhealth.gov.ph",
      "value": "12-345678901-2"
    },
    {
      "system": "http://your-hospital.com/mrn",
      "value": "MRN-12345"
    }
  ],
  "resourceType": "Patient",
  "gatewayReturnUrl": "${config.gatewayUrl}/api/v1/fhir/receive/Patient",
  "reason": "Referral consultation",
  "notes": "Patient requires urgent cardiac evaluation"
}`}
          requestTitle="Incoming Request from Gateway"
          steps={[
            { num: "1.", color: "text-blue-600", text: <>Acknowledge the request immediately with <code className="bg-slate-100 px-1 rounded border border-slate-200">200 OK</code></> },
            { num: "2.", color: "text-blue-600", text: <>Match patient using the <code className="bg-slate-100 px-1 rounded border border-slate-200">identifiers</code> array (PhilHealth ID, MRN, etc.)</> },
            { num: "3.", color: "text-blue-600", text: "Format the data as a FHIR resource" },
            { num: "4.", color: "text-blue-600", text: <>POST the data to the <code className="bg-slate-100 px-1 rounded border border-slate-200">gatewayReturnUrl</code></> },
          ]}
          responseHttpMeta={{
            method: "POST",
            url: "{gatewayReturnUrl}",
            headers: {
              "Content-Type": "application/json",
              "X-Provider-ID": "your-provider-uuid",
              "X-API-Key": "your-api-key",
            },
          }}
          responseCode={`{
  "transactionId": "txn_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "SUCCESS",
  "data": {
    "resourceType": "Patient",
    "id": "patient-123",
    "identifier": [
      {
        "system": "http://philhealth.gov.ph",
        "value": "12-345678901-2"
      }
    ],
    "name": [{ "family": "Dela Cruz", "given": ["Juan"] }],
    "birthDate": "1990-05-15",
    "gender": "male"
  }
}`}
          responseTitle="Your Response to Gateway (send to gatewayReturnUrl)"
        />

        {/* Webhook 2: Receive Results */}
        <WebhookCard
          icon={<ArrowUpFromLine className="h-6 w-6 text-purple-700" />}
          iconBg="bg-purple-100"
          borderColor="border-purple-200"
          bgColor="bg-purple-50/30"
          title="Webhook 2: Receive Results"
          subtitle="Called when you requested data and it's now available"
          method="POST"
          endpoint="{your_base_url}/fhir/receive-results"
          requestCode={`{
  "transactionId": "txn_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "SUCCESS",
  "data": {
    "resourceType": "Patient",
    "id": "patient-123",
    "identifier": [
      {
        "system": "http://philhealth.gov.ph",
        "value": "12-345678901-2"
      }
    ],
    "name": [{ "family": "Dela Cruz", "given": ["Juan"] }],
    "birthDate": "1990-05-15",
    "gender": "male"
  }
}`}
          requestTitle="Incoming Data from Gateway"
          steps={[
            { num: "1.", color: "text-purple-600", text: <>Validate the <code className="bg-slate-100 px-1 rounded border border-slate-200">transactionId</code> matches a pending request</> },
            { num: "2.", color: "text-purple-600", text: "Store or process the received FHIR data" },
            { num: "3.", color: "text-purple-600", text: <>Respond with <code className="bg-slate-100 px-1 rounded border border-slate-200">200 OK</code> to confirm receipt</> },
          ]}
          responseCode={`{
  "message": "Data received successfully"
}`}
          responseTitle="Your Response"
          className="mt-8"
        />

        {/* Webhook 3: Receive Push */}
        <WebhookCard
          icon={<ArrowDownToLine className="h-6 w-6 text-amber-700" />}
          iconBg="bg-amber-100"
          borderColor="border-amber-200"
          bgColor="bg-amber-50/30"
          title="Webhook 3: Receive Push"
          subtitle="Called when another provider pushes unsolicited data to you"
          method="POST"
          endpoint="{your_base_url}/fhir/receive-push"
          requestCode={`{
  "transactionId": "txn_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "senderId": "sender-provider-uuid",
  "resourceType": "Appointment",
  "data": {
    "resourceType": "Appointment",
    "status": "proposed",
    "description": "Consultation",
    "participant": [
      {
        "actor": {
          "type": "Patient",
          "identifier": {
            "system": "http://philhealth.gov.ph",
            "value": "12-345678901-2"
          }
        },
        "status": "accepted"
      }
    ]
  },
  "reason": "New Appointment Request",
  "notes": "Please confirm availability"
}`}
          requestTitle="Incoming Push from Gateway"
          steps={[
            { num: "1.", color: "text-amber-600", text: <>Validate the <code className="bg-slate-100 px-1 rounded border border-slate-200">X-Gateway-Auth</code> header</> },
            { num: "2.", color: "text-amber-600", text: "Store the received unsolicited data" },
            { num: "3.", color: "text-amber-600", text: <>Respond with <code className="bg-slate-100 px-1 rounded border border-slate-200">200 OK</code> to confirm receipt</> },
          ]}
          responseCode={`{
  "message": "Data received successfully"
}`}
          responseTitle="Your Response"
          className="mt-8"
        />
      </StepSection>

      {/* Understanding Identifiers */}
      <section id="identifiers" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Understanding Patient Identifiers</h2>
        <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6">
          <p className="text-slate-600 mb-6 leading-relaxed">
            The gateway uses FHIR-compliant identifiers to match patients across different healthcare systems. 
            Each identifier has a <code className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-sm font-mono">system</code> (the namespace/authority) 
            and a <code className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-sm font-mono">value</code> (the actual ID).
          </p>
          
          <h3 className="font-bold text-slate-900 mb-4 uppercase text-sm tracking-wide">Common Identifier Systems</h3>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">System URI</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Description</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Example Value</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-mono text-xs text-blue-600">http://philhealth.gov.ph</td>
                  <td className="py-3 px-4">PhilHealth Member ID</td>
                  <td className="py-3 px-4 font-mono text-xs bg-slate-50/50">12-345678901-2</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-xs text-blue-600">http://psa.gov.ph/birth-certificate</td>
                  <td className="py-3 px-4">PSA Birth Certificate Number</td>
                  <td className="py-3 px-4 font-mono text-xs bg-slate-50/50">1234-5678-9012-3456</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-xs text-blue-600">http://your-hospital.com/mrn</td>
                  <td className="py-3 px-4">Your Hospital's MRN</td>
                  <td className="py-3 px-4 font-mono text-xs bg-slate-50/50">MRN-12345</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-xs text-blue-600">http://hl7.org/fhir/sid/passport</td>
                  <td className="py-3 px-4">Passport Number</td>
                  <td className="py-3 px-4 font-mono text-xs bg-slate-50/50">P123456789</td>
                </tr>
              </tbody>
            </table>
          </div>

          <AlertBlock type="info" className="mt-6">
            <strong>Matching Logic:</strong> When you receive a query, try to match patients using ANY of the provided identifiers. 
            A patient may have multiple IDs - match on whichever one exists in your system.
          </AlertBlock>
        </div>
      </section>

      {/* Step 3: Making Requests */}
      <StepSection
        id="requests"
        stepNumber={3}
        title="Request Data from Other Providers"
        description="Once registered, you can request FHIR resources from any other registered provider."
      >
        <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Server className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Initiate a Query</h3>
          </div>

          <div className="mb-4 flex flex-wrap items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <MethodBadge method="POST" className="shrink-0" />
            <code className="text-sm font-mono text-slate-700 font-medium break-all min-w-0">{config.gatewayUrl}/api/v1/fhir/request/Patient</code>
          </div>

          <RequestHeaders headers={fhirRequestHeaders} />

          <JsonViewer
            title="Request Body"
            data={`{
  "requesterId": "your-provider-uuid",
  "targetId": "target-provider-uuid",
  "identifiers": [
    {
      "system": "http://philhealth.gov.ph",
      "value": "12-345678901-2"
    }
  ],
  "reason": "Referral consultation",
  "notes": "Need latest lab results"
}`}
          />

          <JsonViewer
            title="Response (202 Accepted)"
            data={`{
  "success": true,
  "data": {
    "id": "txn_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "requesterId": "your-provider-uuid",
    "targetId": "target-provider-uuid",
    "identifiers": [
      {
        "system": "http://philhealth.gov.ph",
        "value": "12-345678901-2"
      }
    ],
    "resourceType": "Patient",
    "status": "PENDING",
    "metadata": {
      "reason": "Referral consultation",
      "notes": "Need latest lab results"
    },
    "createdAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}`}
            className="mt-6"
          />

          <AlertBlock type="info" className="mt-6">
            <strong>What happens next:</strong> The gateway forwards your request to
            the target provider. When they respond, the gateway will call your{" "}
            <code className="bg-blue-50 border border-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono text-sm">/fhir/receive-results</code>{" "}
            endpoint with the data.
          </AlertBlock>
        </div>
      </StepSection>

      {/* Step 4: Push Data */}
      <StepSection
        id="push"
        stepNumber={4}
        title="Push Data to Other Providers"
        description="Send resources directly to another provider without a prior request. Useful for sending referrals, appointments, or unsolicited results."
      >
        <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-100 rounded-lg">
              <ArrowUpFromLine className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Initiate a Push</h3>
          </div>

          <div className="mb-4 flex flex-wrap items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <MethodBadge method="POST" className="shrink-0" />
            <code className="text-sm font-mono text-slate-700 font-medium break-all min-w-0">{config.gatewayUrl}/api/v1/fhir/push/Appointment</code>
          </div>

          <RequestHeaders headers={fhirRequestHeaders} />

          <JsonViewer
            title="Request Body"
            data={`{
  "senderId": "your-provider-uuid",
  "targetId": "target-provider-uuid",
  "resourceType": "Appointment",
  "data": {
    "resourceType": "Appointment",
    "status": "proposed",
    "description": "Consultation",
    "participant": [
      {
        "actor": {
          "type": "Patient",
          "identifier": {
            "system": "http://philhealth.gov.ph",
            "value": "12-345678901-2"
          }
        },
        "status": "accepted"
      }
    ]
  },
  "reason": "New Appointment Request",
  "notes": "Please confirm availability"
}`}
          />

          <JsonViewer
            title="Response (200 OK)"
            data={`{
  "id": "txn_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "requesterId": "your-provider-uuid",
  "targetId": "target-provider-uuid",
  "resourceType": "Appointment",
  "status": "COMPLETED",
  "metadata": {
    "reason": "New Appointment Request",
    "notes": "Please confirm availability"
  },
  "createdAt": "2024-01-15T11:00:00Z",
  "updatedAt": "2024-01-15T11:00:00Z"
}`}
            className="mt-6"
          />

          <AlertBlock type="success" className="mt-6">
            <strong>Immediate Delivery:</strong> Unlike queries, push requests are delivered immediately. 
            If the target provider accepts the data (returns 200 OK), the transaction is marked as COMPLETED instantly.
          </AlertBlock>
        </div>
      </StepSection>

      {/* Best Practices */}
      <section id="best-practices" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Best Practices</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {bestPractices.map((practice) => (
            <FeatureCard
              key={practice.title}
              icon={
                practice.icon === "Clock" ? <Clock className="h-5 w-5" /> :
                practice.icon === "CheckCircle2" ? <CheckCircle2 className="h-5 w-5" /> :
                <Lightbulb className="h-5 w-5" />
              }
              title={practice.title}
              description={practice.description}
              iconBgColor="bg-green-50 text-green-600"
            />
          ))}
        </div>
      </section>

      {/* Common Pitfalls */}
      <section id="pitfalls" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Common Pitfalls to Avoid</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {commonPitfalls.map((pitfall) => (
            <FeatureCard
              key={pitfall.title}
              icon={<AlertTriangle className="h-5 w-5" />}
              title={pitfall.title}
              description={pitfall.description}
              iconBgColor="bg-amber-50 text-amber-600"
            />
          ))}
        </div>
      </section>

      {/* Security Considerations */}
      <section id="security" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Security Considerations</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {securityFeatures.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={<Shield className="h-5 w-5" />}
              title={feature.title}
              description={feature.description}
              iconBgColor="bg-red-50 text-red-600"
            />
          ))}
        </div>
      </section>

      {/* Example Implementation with Tabs */}
      <section id="examples" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Complete Webhook Implementation</h2>
        <p className="mb-6 text-slate-600">
          Production-ready examples with validation, error handling, logging, and proper async patterns.
        </p>
        <ImplementationTabs
          nodeJsCode={nodeJsExample}
          goCode={goExample}
          pythonCode={pythonExample}
          dartCode={dartExample}
        />
      </section>

      {/* Checklist */}
      <section id="checklist" className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Integration Checklist</h2>
        <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-8">
          <ul className="space-y-4">
            {checklistItems.map((item) => (
              <ChecklistItem key={item} text={item} />
            ))}
          </ul>
        </div>
      </section>

      <LastUpdated className="mt-12 pt-8 border-t border-slate-200" />
    </article>
  );
}