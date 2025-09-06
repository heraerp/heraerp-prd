/**
 * Artifact links component
 * Shows links to coverage, SBOM, traces, etc.
 */

import React from 'react';
import { FileText, Shield, Activity } from 'lucide-react';

interface ArtifactLinksProps {
  artifacts?: {
    coverage?: string;
    sbom?: string;
    trace?: string;
    report?: string;
    junit?: string;
    screenshots?: string;
  };
}

export function ArtifactLinks({ artifacts }: ArtifactLinksProps) {
  if (!artifacts || Object.keys(artifacts).length === 0) {
    return null;
  }

  return (
    <div className="flex gap-3 text-sm">
      {artifacts.coverage && (
        <a 
          href={artifacts.coverage}
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View coverage report"
        >
          <FileText className="w-3 h-3" />
          Coverage
        </a>
      )}
      {artifacts.sbom && (
        <a 
          href={artifacts.sbom}
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View SBOM"
        >
          <Shield className="w-3 h-3" />
          SBOM
        </a>
      )}
      {artifacts.trace && (
        <a 
          href={artifacts.trace}
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View trace"
        >
          <Activity className="w-3 h-3" />
          Trace
        </a>
      )}
    </div>
  );
}