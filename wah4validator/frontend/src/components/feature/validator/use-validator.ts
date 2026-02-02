import { useState } from "react";
import { OperationOutcome, ValidationStatus } from "./types";

export function useValidator() {
  const [status, setStatus] = useState<ValidationStatus>("idle");
  const [result, setResult] = useState<OperationOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validate = async (resourceContent: string) => {
    setStatus("loading");
    setResult(null);
    setError(null);

    try {
      // Basic JSON validation before sending
      let parsedBody;
      try {
        parsedBody = JSON.parse(resourceContent);
      } catch (e) {
        setStatus("error");
        setError("Invalid JSON format");
        return;
      }

      const response = await fetch("/api/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedBody),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  return {
    validate,
    status,
    result,
    error,
  };
}