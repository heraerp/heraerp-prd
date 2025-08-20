import { RunResult } from '../runners/dsl-runner';
export interface ReportOptions {
    format: 'console' | 'json' | 'html' | 'markdown';
    outputPath?: string;
    includeDetails?: boolean;
    includeScreenshots?: boolean;
}
/**
 * Generate test reports in various formats
 */
export declare class HERAReporter {
    /**
     * Generate report based on test results
     */
    static generateReport(results: RunResult | RunResult[], options: ReportOptions): Promise<void>;
    /**
     * Generate console report
     */
    private static generateConsoleReport;
    /**
     * Generate JSON report
     */
    private static generateJSONReport;
    /**
     * Generate HTML report
     */
    private static generateHTMLReport;
    /**
     * Generate Markdown report
     */
    private static generateMarkdownReport;
}
