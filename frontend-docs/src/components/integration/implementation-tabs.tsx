"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SyntaxHighlighter } from "@/components/ui/syntax-highlighter";

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
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-lg">
      <Tabs defaultValue="nodejs">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <TabsList className="bg-slate-100 border border-slate-200">
            <TabsTrigger value="nodejs" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 hover:text-slate-900">Node.js</TabsTrigger>
            <TabsTrigger value="go" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 hover:text-slate-900">Go</TabsTrigger>
            <TabsTrigger value="python" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 hover:text-slate-900">Python</TabsTrigger>
            <TabsTrigger value="dart" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 hover:text-slate-900">Dart</TabsTrigger>
          </TabsList>
        </div>

        {/* 
          forceMount={true} ensures content is always in the DOM (hidden via CSS when inactive).
          This allows the "Copy Page" utility (which scrapes DOM textContent) to capture all examples.
        */}
        <TabsContent value="nodejs" className="m-0" forceMount={true}>
          <div className="p-4">
            <SyntaxHighlighter code={nodeJsCode} language="javascript" />
          </div>
        </TabsContent>

        <TabsContent value="go" className="m-0" forceMount={true}>
          <div className="p-4">
            <SyntaxHighlighter code={goCode} language="go" />
          </div>
        </TabsContent>

        <TabsContent value="python" className="m-0" forceMount={true}>
          <div className="p-4">
            <SyntaxHighlighter code={pythonCode} language="python" />
          </div>
        </TabsContent>

        <TabsContent value="dart" className="m-0" forceMount={true}>
          <div className="p-4">
            <SyntaxHighlighter code={dartCode} language="dart" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}