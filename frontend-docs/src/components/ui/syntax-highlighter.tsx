"use client";

interface SyntaxHighlighterProps {
  code: string;
  language?: "javascript" | "go" | "python" | "dart" | "json" | "http";
  className?: string;
  theme?: "light" | "dark";
}

interface Token {
  type: "keyword" | "string" | "number" | "comment" | "function" | "property" | "plain" | "method" | "header" | "url";
  value: string;
}

export function SyntaxHighlighter({ code, language = "javascript", className = "", theme = "light" }: SyntaxHighlighterProps) {
  const tokens = tokenize(code, language);
  
  const baseTextColor = theme === "dark" ? "text-slate-300" : "text-slate-800";
  
  return (
    <pre className={`overflow-x-auto text-xs font-mono leading-relaxed ${baseTextColor} ${className}`}>
      {tokens.map((token, i) => (
        <span key={i} className={getTokenClass(token.type, theme)}>
          {token.value}
        </span>
      ))}
    </pre>
  );
}

function getTokenClass(type: Token["type"], theme: "light" | "dark"): string {
  if (theme === "dark") {
    switch (type) {
      case "keyword":
        return "text-purple-400 font-medium";
      case "string":
        return "text-emerald-400";
      case "number":
        return "text-amber-400";
      case "comment":
        return "text-slate-500 italic";
      case "function":
        return "text-blue-400";
      case "property":
        return "text-cyan-400";
      case "method":
        return "text-pink-400 font-semibold";
      case "header":
        return "text-sky-400";
      case "url":
        return "text-yellow-300";
      default:
        return "";
    }
  }
  
  // Light theme
  switch (type) {
    case "keyword":
      return "text-purple-600 font-medium";
    case "string":
      return "text-green-600";
    case "number":
      return "text-amber-600";
    case "comment":
      return "text-slate-400 italic";
    case "function":
      return "text-blue-600";
    case "property":
      return "text-cyan-600";
    case "method":
      return "text-pink-600 font-semibold";
    case "header":
      return "text-sky-600";
    case "url":
      return "text-amber-700";
    default:
      return "";
  }
}

function tokenizeHttp(code: string): Token[] {
  const tokens: Token[] = [];
  const lines = code.split("\n");
  const httpMethods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);
  
  let inBody = false;
  
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    
    // Empty line marks start of body
    if (line.trim() === "") {
      inBody = true;
      tokens.push({ type: "plain", value: line });
      if (lineIdx < lines.length - 1) tokens.push({ type: "plain", value: "\n" });
      continue;
    }
    
    if (inBody) {
      // Tokenize JSON body
      const jsonTokens = tokenizeJson(line);
      tokens.push(...jsonTokens);
      if (lineIdx < lines.length - 1) tokens.push({ type: "plain", value: "\n" });
      continue;
    }
    
    // First line: METHOD URL HTTP/VERSION
    if (lineIdx === 0) {
      const parts = line.split(" ");
      if (parts.length >= 1 && httpMethods.has(parts[0])) {
        tokens.push({ type: "method", value: parts[0] });
        if (parts.length >= 2) {
          tokens.push({ type: "plain", value: " " });
          tokens.push({ type: "url", value: parts[1] });
        }
        if (parts.length >= 3) {
          tokens.push({ type: "plain", value: " " });
          tokens.push({ type: "keyword", value: parts.slice(2).join(" ") });
        }
      } else {
        tokens.push({ type: "plain", value: line });
      }
      if (lineIdx < lines.length - 1) tokens.push({ type: "plain", value: "\n" });
      continue;
    }
    
    // Header lines: Name: Value
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      tokens.push({ type: "header", value: line.slice(0, colonIdx) });
      tokens.push({ type: "plain", value: ":" });
      const value = line.slice(colonIdx + 1);
      tokens.push({ type: "string", value: value });
    } else {
      tokens.push({ type: "plain", value: line });
    }
    
    if (lineIdx < lines.length - 1) tokens.push({ type: "plain", value: "\n" });
  }
  
  return tokens;
}

function tokenizeJson(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  
  while (i < line.length) {
    // Whitespace
    if (/\s/.test(line[i])) {
      let j = i;
      while (j < line.length && /\s/.test(line[j])) j++;
      tokens.push({ type: "plain", value: line.slice(i, j) });
      i = j;
      continue;
    }
    
    // Strings
    if (line[i] === '"') {
      let j = i + 1;
      while (j < line.length && line[j] !== '"') {
        if (line[j] === "\\") j++;
        j++;
      }
      const strEnd = j < line.length ? j + 1 : j;
      const str = line.slice(i, strEnd);
      
      // Check if it's a property (followed by :)
      let k = strEnd;
      while (k < line.length && /\s/.test(line[k])) k++;
      if (line[k] === ":") {
        tokens.push({ type: "property", value: str });
      } else {
        tokens.push({ type: "string", value: str });
      }
      i = strEnd;
      continue;
    }
    
    // Numbers
    if (/[\d-]/.test(line[i])) {
      let j = i;
      if (line[j] === "-") j++;
      while (j < line.length && /[\d.eE+-]/.test(line[j])) j++;
      tokens.push({ type: "number", value: line.slice(i, j) });
      i = j;
      continue;
    }
    
    // Keywords (true, false, null)
    if (/[tfn]/.test(line[i])) {
      const remaining = line.slice(i);
      if (remaining.startsWith("true")) {
        tokens.push({ type: "keyword", value: "true" });
        i += 4;
        continue;
      }
      if (remaining.startsWith("false")) {
        tokens.push({ type: "keyword", value: "false" });
        i += 5;
        continue;
      }
      if (remaining.startsWith("null")) {
        tokens.push({ type: "keyword", value: "null" });
        i += 4;
        continue;
      }
    }
    
    // Other characters
    tokens.push({ type: "plain", value: line[i] });
    i++;
  }
  
  return tokens;
}

function tokenize(code: string, language: string): Token[] {
  // Use specialized HTTP tokenizer
  if (language === "http") {
    return tokenizeHttp(code);
  }
  
  const tokens: Token[] = [];
  const keywords = getKeywords(language);
  const keywordSet = new Set(keywords);
  
  let i = 0;
  while (i < code.length) {
    // Check for comments
    if (code.slice(i, i + 2) === "//") {
      const end = code.indexOf("\n", i);
      const commentEnd = end === -1 ? code.length : end;
      tokens.push({ type: "comment", value: code.slice(i, commentEnd) });
      i = commentEnd;
      continue;
    }
    
    // Python/shell comments
    if ((language === "python" || language === "go") && code[i] === "#") {
      const end = code.indexOf("\n", i);
      const commentEnd = end === -1 ? code.length : end;
      tokens.push({ type: "comment", value: code.slice(i, commentEnd) });
      i = commentEnd;
      continue;
    }
    
    // Multi-line comments
    if (code.slice(i, i + 2) === "/*") {
      const end = code.indexOf("*/", i + 2);
      const commentEnd = end === -1 ? code.length : end + 2;
      tokens.push({ type: "comment", value: code.slice(i, commentEnd) });
      i = commentEnd;
      continue;
    }
    
    // Triple-quoted strings (Python)
    if (language === "python" && (code.slice(i, i + 3) === '"""' || code.slice(i, i + 3) === "'''")) {
      const quote = code.slice(i, i + 3);
      const end = code.indexOf(quote, i + 3);
      const strEnd = end === -1 ? code.length : end + 3;
      tokens.push({ type: "string", value: code.slice(i, strEnd) });
      i = strEnd;
      continue;
    }
    
    // Strings
    if (code[i] === '"' || code[i] === "'" || code[i] === "`") {
      const quote = code[i];
      let j = i + 1;
      while (j < code.length && code[j] !== quote) {
        if (code[j] === "\\") j++; // Skip escaped chars
        j++;
      }
      const strEnd = j < code.length ? j + 1 : j;
      tokens.push({ type: "string", value: code.slice(i, strEnd) });
      i = strEnd;
      continue;
    }
    
    // Numbers
    if (/\d/.test(code[i])) {
      let j = i;
      while (j < code.length && /[\d.xXa-fA-F]/.test(code[j])) j++;
      tokens.push({ type: "number", value: code.slice(i, j) });
      i = j;
      continue;
    }
    
    // Identifiers and keywords
    if (/[a-zA-Z_]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[a-zA-Z0-9_]/.test(code[j])) j++;
      const word = code.slice(i, j);
      
      // Check if it's a function call (followed by parenthesis)
      let k = j;
      while (k < code.length && /\s/.test(code[k])) k++;
      
      if (keywordSet.has(word)) {
        tokens.push({ type: "keyword", value: word });
      } else if (code[k] === "(") {
        tokens.push({ type: "function", value: word });
      } else {
        tokens.push({ type: "plain", value: word });
      }
      i = j;
      continue;
    }
    
    // Property access (after dot)
    if (code[i] === "." && i + 1 < code.length && /[a-zA-Z_]/.test(code[i + 1])) {
      tokens.push({ type: "plain", value: "." });
      i++;
      let j = i;
      while (j < code.length && /[a-zA-Z0-9_]/.test(code[j])) j++;
      tokens.push({ type: "property", value: code.slice(i, j) });
      i = j;
      continue;
    }
    
    // Plain characters (operators, punctuation, whitespace)
    tokens.push({ type: "plain", value: code[i] });
    i++;
  }
  
  return tokens;
}

function getKeywords(language: string): string[] {
  switch (language) {
    case "go":
      return [
        "package", "import", "func", "return", "if", "else", "for", "range", "var",
        "const", "type", "struct", "interface", "map", "chan", "go", "defer", "select",
        "case", "default", "break", "continue", "fallthrough", "goto", "switch",
        "true", "false", "nil", "iota", "make", "new", "append", "len", "cap",
        "error", "string", "int", "int64", "float64", "bool", "byte", "rune"
      ];
    case "python":
      return [
        "def", "return", "if", "else", "elif", "for", "while", "try", "except",
        "finally", "with", "as", "import", "from", "class", "self", "True", "False",
        "None", "and", "or", "not", "in", "is", "lambda", "yield", "raise", "pass",
        "break", "continue", "global", "nonlocal", "assert", "async", "await"
      ];
    case "dart":
      return [
        "void", "final", "var", "const", "class", "extends", "implements", "with",
        "async", "await", "return", "if", "else", "for", "while", "try", "catch",
        "throw", "new", "this", "super", "static", "get", "set", "true", "false",
        "null", "dynamic", "Future", "Stream", "List", "Map", "String", "int",
        "double", "bool", "late", "required", "override", "abstract", "factory"
      ];
    case "json":
      return ["true", "false", "null"];
    default: // javascript
      return [
        "const", "let", "var", "function", "async", "await", "return", "if", "else",
        "for", "while", "try", "catch", "throw", "new", "class", "import", "export",
        "from", "default", "true", "false", "null", "undefined", "this", "typeof",
        "instanceof", "void", "delete", "in", "of", "switch", "case", "break",
        "continue", "finally", "extends", "static", "get", "set", "yield", "interface",
        "type", "enum", "implements", "private", "public", "protected", "readonly"
      ];
  }
}