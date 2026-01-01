"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ImplementationTabsProps {
  nodeJsCode: string;
  goCode: string;
  pythonCode: string;
  dartCode: string;
}

export function ImplementationTabs({
  nodeJsCode,
  goCode,
  pythonCode,
  dartCode,
}: ImplementationTabsProps) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden shadow-lg">
      <Tabs defaultValue="nodejs">
        <div className="border-b border-slate-700 bg-slate-800 px-4 py-3">
          <TabsList className="bg-slate-700/50 border border-slate-600">
            <TabsTrigger value="nodejs" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-400 hover:text-slate-200">Node.js</TabsTrigger>
            <TabsTrigger value="go" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-400 hover:text-slate-200">Go</TabsTrigger>
            <TabsTrigger value="python" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-400 hover:text-slate-200">Python</TabsTrigger>
            <TabsTrigger value="dart" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-400 hover:text-slate-200">Dart</TabsTrigger>
          </TabsList>
        </div>

        {/* 
          forceMount={true} ensures content is always in the DOM (hidden via CSS when inactive).
          This allows the "Copy Page" utility (which scrapes DOM textContent) to capture all examples.
        */}
        <TabsContent value="nodejs" className="m-0" forceMount={true}>
          <pre className="overflow-x-auto p-4 text-xs font-mono leading-relaxed text-slate-300 bg-transparent">
            {nodeJsCode}
          </pre>
        </TabsContent>

        <TabsContent value="go" className="m-0" forceMount={true}>
          <pre className="overflow-x-auto p-4 text-xs font-mono leading-relaxed text-slate-300 bg-transparent">
            {goCode}
          </pre>
        </TabsContent>

        <TabsContent value="python" className="m-0" forceMount={true}>
          <pre className="overflow-x-auto p-4 text-xs font-mono leading-relaxed text-slate-300 bg-transparent">
            {pythonCode}
          </pre>
        </TabsContent>

        <TabsContent value="dart" className="m-0" forceMount={true}>
          <pre className="overflow-x-auto p-4 text-xs font-mono leading-relaxed text-slate-300 bg-transparent">
            {dartCode}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}