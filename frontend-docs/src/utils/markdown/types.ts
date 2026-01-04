/**
 * Context passed during HTML to Markdown conversion.
 * Tracks list depth and counters for proper nesting.
 */
export interface ConversionContext {
  listDepth: number;
  orderedListCounters: number[];
}

/**
 * Creates a fresh conversion context with default values.
 */
export function createConversionContext(): ConversionContext {
  return {
    listDepth: 0,
    orderedListCounters: [],
  };
}