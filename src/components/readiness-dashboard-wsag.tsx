// WSAG Compliance Improvements for Readiness Dashboard

export const WSAGImprovements = {
  // Skip to main content link
  skipToMainContent: (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
    >
      Skip to main content
    </a>
  ),

  // Keyboard navigation instructions
  keyboardInstructions: (
    <div className="sr-only" role="region" aria-label="Keyboard navigation instructions">
      <h2>Keyboard Navigation</h2>
      <ul>
        <li>Press Tab to navigate through interactive elements</li>
        <li>Press Enter or Space to activate buttons</li>
        <li>Press Escape to close dialogs</li>
        <li>Use arrow keys to navigate between tabs</li>
      </ul>
    </div>
  ),

  // Screen reader announcements
  announceUpdate: (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  },

  // Focus management
  focusManagement: {
    trapFocus: (container: HTMLElement) => {
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0] as HTMLElement;
      const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

      container.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          } else if (!e.shiftKey && document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      });
    }
  },

  // Color contrast improvements
  contrastClasses: {
    highContrast: 'contrast-150 saturate-150',
    normalContrast: 'contrast-100 saturate-100',
    reducedMotion: 'motion-safe:transition-none motion-safe:animate-none'
  },

  // ARIA labels and descriptions
  ariaLabels: {
    dashboard: 'ERP Readiness Assessment Dashboard',
    sessionList: 'List of assessment sessions',
    sessionDetails: 'Selected assessment session details',
    answersList: 'List of assessment answers',
    pagination: 'Pagination controls',
    search: 'Search assessment answers',
    filter: 'Filter assessment sessions',
    categoryScores: 'Assessment scores by category',
    overallScore: 'Overall readiness score'
  }
};

// WSAG compliant color palette with proper contrast ratios
export const WSAGColors = {
  // Text colors with WCAG AAA compliance (contrast ratio > 7:1)
  text: {
    primary: '#000000', // Black on white: 21:1
    primaryDark: '#FFFFFF', // White on dark: 21:1
    secondary: '#374151', // Gray-700 on white: 11.94:1
    secondaryDark: '#D1D5DB', // Gray-300 on dark: 8.59:1
    disabled: '#9CA3AF', // Gray-400 on white: 3.03:1 (AA for large text)
    disabledDark: '#6B7280', // Gray-500 on dark: 4.96:1
  },

  // Status colors with proper contrast
  status: {
    success: {
      bg: '#D1FAE5', // Green-100
      text: '#065F46', // Green-800 (contrast 8.18:1)
      darkBg: '#064E3B', // Green-900
      darkText: '#34D399' // Green-400 (contrast 7.04:1)
    },
    warning: {
      bg: '#FEF3C7', // Amber-100
      text: '#78350F', // Amber-900 (contrast 10.07:1)
      darkBg: '#451A03', // Amber-950
      darkText: '#FCD34D' // Amber-300 (contrast 9.67:1)
    },
    error: {
      bg: '#FEE2E2', // Red-100
      text: '#7F1D1D', // Red-900 (contrast 9.28:1)
      darkBg: '#450A0A', // Red-950
      darkText: '#FCA5A5' // Red-300 (contrast 8.71:1)
    }
  },

  // Focus indicators
  focus: {
    outline: '3px solid #3B82F6', // Blue-500
    outlineOffset: '2px',
    darkOutline: '3px solid #60A5FA' // Blue-400
  }
};

// WSAG compliant component patterns
export const WSAGPatterns = {
  // Loading states with screen reader support
  loadingState: (message: string = 'Loading...') => ({
    'aria-busy': 'true',
    'aria-label': message,
    role: 'status',
    'aria-live': 'polite'
  }),

  // Error states with proper announcements
  errorState: (error: string) => ({
    role: 'alert',
    'aria-live': 'assertive',
    'aria-atomic': 'true',
    'aria-label': `Error: ${error}`
  }),

  // Form field requirements
  formField: (label: string, required: boolean = false) => ({
    'aria-label': label,
    'aria-required': required,
    'aria-invalid': false,
    'aria-describedby': `${label.toLowerCase().replace(/\s/g, '-')}-error`
  }),

  // Interactive element states
  interactiveElement: (pressed: boolean = false, expanded: boolean = false) => ({
    'aria-pressed': pressed,
    'aria-expanded': expanded,
    tabIndex: 0,
    role: 'button'
  })
};