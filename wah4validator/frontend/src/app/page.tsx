"use client";

import React, { useState } from "react";
import { Play, FileJson, Loader2, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ValidationResult } from "@/components/feature/validator/validation-result";
import { useValidator } from "@/components/feature/validator/use-validator";

export default function ValidatorPage() {
  const [input, setInput] = useState("");
  const { validate, status, result, error } = useValidator();

  const handleValidate = () => {
    validate(input);
  };

  return (
    <div className="min-h-dvh w-full bg-slate-50 flex flex-col lg:h-dvh lg:overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shrink-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <FileJson className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl text-slate-900">FHIR Validator</h1>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm text-slate-500">
            <span>Target: R4</span>
            <span className="w-px h-4 bg-slate-200" />
            <span>v1.0.0</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-4 lg:py-6 min-h-0">
        <div className="grid lg:grid-cols-2 gap-6 h-auto lg:h-full">
          {/* Left Column: Editor */}
          <div className="flex flex-col gap-4 h-[60vh] lg:h-full min-h-0">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Resource JSON</h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInput("")}
                  className="text-slate-500"
                >
                  <Eraser className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
            
            <Card className="flex-1 overflow-hidden border-slate-300 shadow-sm flex flex-col min-h-[300px]">
              <textarea
                className="flex-1 w-full h-full p-3 sm:p-4 font-mono text-sm bg-slate-950 text-slate-50 resize-none focus:outline-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                spellCheck={false}
                placeholder="Paste your FHIR resource here..."
              />
            </Card>

            <Button 
              size="lg" 
              onClick={handleValidate} 
              disabled={status === "loading" || !input.trim()}
              className="w-full sm:w-auto shadow-md"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Validate Resource
                </>
              )}
            </Button>
          </div>

          {/* Right Column: Results */}
          <div className="flex flex-col gap-4 h-auto lg:h-full lg:overflow-hidden mt-4 lg:mt-0">
            <h2 className="font-semibold text-slate-900">Validation Results</h2>
            
            <div className="flex-1 overflow-visible lg:overflow-y-auto lg:pr-2">
              {error && (
                <Card className="bg-red-50 border-red-200 p-4">
                  <p className="text-red-700 font-medium">Validation Failed</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </Card>
              )}

              {result ? (
                <ValidationResult outcome={result} />
              ) : (
                !error && (
                  <div className="min-h-[200px] lg:h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50 py-8 lg:py-0">
                    <FileJson className="w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4 opacity-50" />
                    <p className="text-sm sm:text-base text-center px-4">Run validation to see results here</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}