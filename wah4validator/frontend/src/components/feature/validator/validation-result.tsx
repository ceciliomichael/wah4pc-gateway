import React from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { OperationOutcome, OperationOutcomeIssue } from "./types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ValidationResultProps {
  outcome: OperationOutcome;
}

const severityConfig = {
  fatal: { icon: AlertCircle, color: "text-red-600", badge: "destructive" },
  error: { icon: AlertCircle, color: "text-red-600", badge: "destructive" },
  warning: { icon: AlertTriangle, color: "text-yellow-600", badge: "warning" },
  information: { icon: Info, color: "text-blue-600", badge: "info" },
} as const;

export function ValidationResult({ outcome }: ValidationResultProps) {
  const issues = outcome.issue || [];
  const errorCount = issues.filter((i) => i.severity === "error" || i.severity === "fatal").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="bg-red-50 border-red-100">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-red-100 rounded-full text-red-600 shrink-0">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-red-900">Errors</p>
              <p className="text-xl sm:text-2xl font-bold text-red-700">{errorCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-100">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-full text-yellow-600 shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-yellow-900">Warnings</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-700">{warningCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-2xl">Detailed Findings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
          {issues.length === 0 ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span>No issues found!</span>
            </div>
          ) : (
            issues.map((issue, idx) => (
              <IssueItem key={idx} issue={issue} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function IssueItem({ issue }: { issue: OperationOutcomeIssue }) {
  const config = severityConfig[issue.severity] || severityConfig.information;
  const Icon = config.icon;

  return (
    <div className="flex gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border border-slate-100 bg-slate-50/50">
      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 ${config.color} shrink-0`} />
      <div className="space-y-1 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Badge variant={config.badge as any} className="text-xs">
            {issue.severity.toUpperCase()}
          </Badge>
          <span className="text-xs font-mono text-slate-500 truncate">{issue.code}</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 break-words">{issue.details?.text || issue.diagnostics}</p>
        {issue.location && (
          <div className="mt-2 text-xs text-slate-500 font-mono bg-slate-100 py-1 px-2 rounded inline-block max-w-full overflow-x-auto">
            <span className="whitespace-nowrap">Location: {issue.location.join(", ")}</span>
          </div>
        )}
      </div>
    </div>
  );
}