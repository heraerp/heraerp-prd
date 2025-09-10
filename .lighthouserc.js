module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      startServerCommand: 'npm run build && npm start',
      url: [process.env.LHCI_URL || 'http://localhost:3000/'],
      settings: { preset: 'desktop' }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 1.0 }]
      }
    },
    upload: { target: 'temporary-public-storage' }
  }
}

