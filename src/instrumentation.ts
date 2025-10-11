// Mastra instrumentation file to disable telemetry warnings
// This sets the global variable to indicate telemetry is handled

// Disable telemetry warning
if (typeof globalThis !== 'undefined') {
  Object.defineProperty(globalThis, '___MASTRA_TELEMETRY___', {
    value: true,
    writable: false,
    configurable: false
  });
}

export {};
