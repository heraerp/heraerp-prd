'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { Maximize2, Minimize2, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

// Initialize mermaid
if (typeof window !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    themeVariables: {
      // Primary colors - using lighter backgrounds with dark text
      primaryColor: '#e6f7f3',
      primaryTextColor: '#065f46',
      primaryBorderColor: '#10b981',

      // Secondary colors
      secondaryColor: '#e0f2fe',
      secondaryTextColor: '#0c4a6e',
      secondaryBorderColor: '#0ea5e9',

      // Tertiary colors
      tertiaryColor: '#fef3c7',
      tertiaryTextColor: '#78350f',
      tertiaryBorderColor: '#fbbf24',

      // Background colors
      background: '#ffffff',
      mainBkg: '#f0fdf4',
      secondBkg: '#f0f9ff',
      tertiaryBkg: '#fefce8',

      // Text colors
      textColor: '#1f2937',
      taskTextColor: '#1f2937',
      taskTextDarkColor: '#1f2937',

      // Lines and borders
      lineColor: '#6b7280',
      border1: '#10b981',
      border2: '#0ea5e9',

      // Node styling
      nodeBkg: '#ffffff',
      nodeTextColor: '#1f2937',
      defaultLinkColor: '#6b7280',

      // Cluster/Subgraph styling
      clusterBkg: '#f9fafb',
      clusterBorder: '#d1d5db',

      // Special elements
      edgeLabelBackground: '#ffffff',
      titleColor: '#111827',

      // Sequence diagram specific
      actorBorder: '#10b981',
      actorBkg: '#f0fdf4',
      actorTextColor: '#065f46',
      actorLineColor: '#6b7280',
      signalColor: '#374151',
      signalTextColor: '#1f2937',
      labelBoxBorderColor: '#10b981',
      labelBoxBkgColor: '#f0fdf4',
      labelTextColor: '#065f46',
      loopTextColor: '#1f2937',
      noteBkgColor: '#fef3c7',
      noteTextColor: '#78350f',
      noteBorderColor: '#fbbf24',
      activationBorderColor: '#10b981',
      activationBkgColor: '#f0fdf4',
      sequenceNumberColor: '#065f46',

      // Git graph
      git0: '#ef4444',
      git1: '#f97316',
      git2: '#fbbf24',
      git3: '#10b981',
      git4: '#0ea5e9',
      git5: '#3b82f6',
      git6: '#8b5cf6',
      git7: '#ec4899',
      gitInv0: '#ffffff',
      gitInv1: '#ffffff',
      gitInv2: '#ffffff',
      gitInv3: '#ffffff',
      gitInv4: '#ffffff',
      gitInv5: '#ffffff',
      gitInv6: '#ffffff',
      gitInv7: '#ffffff',

      // Font
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px'
    },
    flowchart: {
      htmlLabels: true,
      curve: 'basis',
      nodeSpacing: 50,
      rankSpacing: 50,
      padding: 15
    },
    sequence: {
      mirrorActors: true,
      messageMargin: 30,
      boxMargin: 10,
      boxTextMargin: 5,
      noteMargin: 10,
      messageAlign: 'center',
      mirrorActors: true
    }
  })
}

interface ClientMermaidRendererProps {
  htmlContent: string
  mermaidCharts: string[]
}

export default function ClientMermaidRenderer({
  htmlContent,
  mermaidCharts
}: ClientMermaidRendererProps) {
  const [renderedHtml, setRenderedHtml] = useState(htmlContent)
  const [expandedDiagram, setExpandedDiagram] = useState<number | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const processedRef = useRef(false)

  // Function to fix text colors on yellow backgrounds
  const fixYellowBackgroundTextColors = () => {
    const yellowColors = [
      '#fef3c7',
      '#F5E6C8',
      '#fefce8',
      'rgb(254, 243, 199)',
      'rgb(245, 230, 200)',
      'rgb(254, 252, 232)'
    ]
    const darkGray = '#374151'

    // Find all SVG text elements
    document.querySelectorAll('.mermaid text').forEach(textElement => {
      const parentNode = textElement.closest('g.node')
      if (parentNode) {
        const rect = parentNode.querySelector('rect')
        if (rect) {
          const fill = rect.getAttribute('fill') || ''
          // Check if the rect has a yellow background
          if (yellowColors.some(color => fill.toLowerCase().includes(color.toLowerCase()))) {
            textElement.setAttribute('fill', darkGray)
            textElement.setAttribute('style', `fill: ${darkGray} !important`)
          }
        }
      }
    })

    // Also check for database table names specifically
    const dbTableNames = [
      'core_organizations',
      'core_entities',
      'core_dynamic_data',
      'core_relationships',
      'universal_transactions',
      'universal_transaction_lines'
    ]

    document.querySelectorAll('.mermaid text').forEach(textElement => {
      const textContent = textElement.textContent || ''
      if (dbTableNames.some(name => textContent.includes(name))) {
        // Check if this text is on a yellow background
        const parentNode = textElement.closest('g.node')
        if (parentNode) {
          const rect = parentNode.querySelector('rect')
          if (rect) {
            const fill = rect.getAttribute('fill') || ''
            if (yellowColors.some(color => fill.toLowerCase().includes(color.toLowerCase()))) {
              textElement.setAttribute('fill', darkGray)
              textElement.setAttribute('style', `fill: ${darkGray} !important`)
            }
          }
        }
      }
    })
  }

  // Add global styles
  useEffect(() => {
    const styleId = 'mermaid-custom-styles'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .mermaid-container svg {
          max-width: 100% !important;
          height: auto !important;
        }
        
        .mermaid-svg-wrapper {
          display: flex;
          justify-content: center;
          width: 100%;
          overflow-x: auto;
        }
        
        /* Ensure all labels use dark gray text */
        .mermaid .nodeLabel {
          color: #374151 !important;
        }
        
        .mermaid .cluster-label {
          color: #374151 !important;
        }
        
        /* Specific rules for yellow backgrounds */
        .mermaid [fill="#fef3c7"] text,
        .mermaid [fill="rgb(254, 243, 199)"] text,
        .mermaid [fill="#fefce8"] text,
        .mermaid [fill="rgb(254, 252, 232)"] text,
        .mermaid rect[fill="#fef3c7"] + text,
        .mermaid rect[fill="rgb(254, 243, 199)"] + text,
        .mermaid rect[fill="#fefce8"] + text,
        .mermaid rect[fill="rgb(254, 252, 232)"] + text {
          fill: #374151 !important;
          color: #374151 !important;
        }
        
        /* Target text inside yellow nodes specifically */
        .mermaid g.node rect[fill="#fef3c7"] ~ text,
        .mermaid g.node rect[fill="rgb(254, 243, 199)"] ~ text,
        .mermaid g.node rect[fill="#fefce8"] ~ text,
        .mermaid g.node rect[fill="rgb(254, 252, 232)"] ~ text,
        .mermaid g.node rect[fill="#F5E6C8"] ~ text,
        .mermaid g.node rect[fill="rgb(245, 230, 200)"] ~ text {
          fill: #374151 !important;
          color: #374151 !important;
        }
        
        /* Database layer text specifically */
        .mermaid text:has-text("core_organizations"),
        .mermaid text:has-text("core_entities"),
        .mermaid text:has-text("core_dynamic_data"),
        .mermaid text:has-text("core_relationships"),
        .mermaid text:has-text("universal_transactions"),
        .mermaid text:has-text("universal_transaction_lines") {
          fill: #374151 !important;
        }
        
        /* More aggressive targeting for yellow backgrounds */
        .mermaid g.nodes g.node:has(rect[fill="#fef3c7"]) text,
        .mermaid g.nodes g.node:has(rect[fill="#F5E6C8"]) text,
        .mermaid g.nodes g.node:has(rect[fill="#fefce8"]) text {
          fill: #374151 !important;
          stroke: none !important;
        }
        
        /* Fix for yellow nodes specifically */
        .mermaid .node rect[fill="#fef3c7"],
        .mermaid .node rect[fill="rgb(254, 243, 199)"] {
          stroke: #f59e0b !important;
        }
        
        .mermaid .node[fill="#fef3c7"] .nodeLabel,
        .mermaid .node[fill="rgb(254, 243, 199)"] .nodeLabel {
          fill: #374151 !important;
          color: #374151 !important;
        }
        
        /* Expanded diagram styles */
        #expanded-mermaid-0, #expanded-mermaid-1, #expanded-mermaid-2, 
        #expanded-mermaid-3, #expanded-mermaid-4, #expanded-mermaid-5,
        #expanded-mermaid-6, #expanded-mermaid-7, #expanded-mermaid-8,
        #expanded-mermaid-9, #expanded-mermaid-10 {
          width: 100%;
          height: 100%;
          min-height: 70vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* Ensure expanded SVGs can scale */
        .mermaid svg {
          max-width: none !important;
        }
      `
      document.head.appendChild(style)
    }

    return () => {
      const existingStyle = document.getElementById(styleId)
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [])

  // Re-initialize mermaid when dark mode changes
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')

    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'neutral',
      themeVariables: isDark
        ? {
            // Dark mode theme
            primaryColor: '#065f46',
            primaryTextColor: '#d1fae5',
            primaryBorderColor: '#10b981',
            secondaryColor: '#0c4a6e',
            secondaryTextColor: '#bae6fd',
            secondaryBorderColor: '#0ea5e9',
            tertiaryColor: '#78350f',
            tertiaryTextColor: '#fef3c7',
            tertiaryBorderColor: '#fbbf24',
            background: '#1f2937',
            mainBkg: '#065f46',
            secondBkg: '#0c4a6e',
            tertiaryBkg: '#78350f',
            textColor: '#e5e7eb',
            taskTextColor: '#e5e7eb',
            lineColor: '#9ca3af',
            border1: '#10b981',
            border2: '#0ea5e9',
            nodeBkg: '#374151',
            nodeTextColor: '#e5e7eb',
            defaultLinkColor: '#9ca3af',
            clusterBkg: '#1f2937',
            clusterBorder: '#4b5563',
            edgeLabelBackground: '#374151',
            titleColor: '#f3f4f6',
            actorBorder: '#10b981',
            actorBkg: '#065f46',
            actorTextColor: '#d1fae5',
            actorLineColor: '#9ca3af',
            signalColor: '#d1d5db',
            signalTextColor: '#e5e7eb',
            labelBoxBorderColor: '#10b981',
            labelBoxBkgColor: '#065f46',
            labelTextColor: '#d1fae5',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: '14px'
          }
        : {
            // Light mode theme (existing config)
            primaryColor: '#e6f7f3',
            primaryTextColor: '#065f46',
            primaryBorderColor: '#10b981',
            secondaryColor: '#e0f2fe',
            secondaryTextColor: '#0c4a6e',
            secondaryBorderColor: '#0ea5e9',
            tertiaryColor: '#fef3c7',
            tertiaryTextColor: '#374151', // Dark gray for yellow background
            tertiaryBorderColor: '#f59e0b',
            background: '#ffffff',
            mainBkg: '#f0fdf4',
            secondBkg: '#f0f9ff',
            tertiaryBkg: '#fefce8',
            textColor: '#1f2937',
            taskTextColor: '#1f2937',
            taskTextDarkColor: '#1f2937',
            lineColor: '#6b7280',
            border1: '#10b981',
            border2: '#0ea5e9',
            nodeBkg: '#ffffff',
            nodeTextColor: '#1f2937',
            defaultLinkColor: '#6b7280',
            clusterBkg: '#f9fafb',
            clusterBorder: '#d1d5db',
            edgeLabelBackground: '#ffffff',
            titleColor: '#111827',
            actorBorder: '#10b981',
            actorBkg: '#f0fdf4',
            actorTextColor: '#065f46',
            actorLineColor: '#6b7280',
            signalColor: '#374151',
            signalTextColor: '#1f2937',
            labelBoxBorderColor: '#10b981',
            labelBoxBkgColor: '#f0fdf4',
            labelTextColor: '#065f46',
            loopTextColor: '#1f2937',
            noteBkgColor: '#fef3c7',
            noteTextColor: '#374151', // Dark gray for better contrast on yellow
            noteBorderColor: '#f59e0b',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: '14px'
          },
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
        nodeSpacing: 50,
        rankSpacing: 50,
        padding: 15
      }
    })
  }, [])

  useEffect(() => {
    if (processedRef.current) return
    processedRef.current = true

    const renderMermaidCharts = async () => {
      let newHtml = htmlContent

      for (let i = 0; i < mermaidCharts.length; i++) {
        const chart = mermaidCharts[i]
        const elementId = `mermaid-render-${i}`

        try {
          // Create a unique ID for this render
          const graphId = `mermaid-graph-${Date.now()}-${i}`

          // Render the chart
          const { svg } = await mermaid.render(graphId, chart)

          // Create a container with the rendered SVG and expand button
          const mermaidHtml = `
            <div class="my-8 mermaid-container" id="mermaid-container-${i}">
              <div class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-4">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Mermaid Diagram ${i + 1}</h4>
                  <button 
                    onclick="window.expandMermaidDiagram(${i})"
                    class="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-200 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                    </svg>
                    <span>Expand</span>
                  </button>
                </div>
              </div>
              <div class="flex justify-center overflow-x-auto bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mermaid-diagram-container">
                <div class="mermaid-svg-wrapper" style="max-width: 100%; overflow-x: auto;">
                  ${svg}
                </div>
              </div>
            </div>
          `

          // Replace the placeholder
          newHtml = newHtml.replace(`<div id="mermaid-${i}"></div>`, mermaidHtml)
        } catch (error) {
          console.error('Mermaid rendering error:', error)
          // Fallback to showing the code
          const fallbackHtml = `
            <div class="my-8">
              <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 class="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">Mermaid Diagram ${i + 1} - Rendering Error</h4>
                <pre class="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded overflow-x-auto"><code>${chart.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
              </div>
            </div>
          `
          newHtml = newHtml.replace(`<div id="mermaid-${i}"></div>`, fallbackHtml)
        }
      }

      setRenderedHtml(newHtml)

      // Fix text colors after all diagrams are rendered
      setTimeout(() => {
        fixYellowBackgroundTextColors()
      }, 300)
    }

    if (mermaidCharts.length > 0) {
      renderMermaidCharts()
    }
  }, [htmlContent, mermaidCharts])

  // Add expand functionality
  useEffect(() => {
    // Define the expand function globally
    if (typeof window !== 'undefined') {
      ;(window as any).expandMermaidDiagram = (index: number) => {
        setExpandedDiagram(index)
      }
    }
  }, [])

  // Render expanded diagram
  useEffect(() => {
    if (expandedDiagram !== null && mermaidCharts[expandedDiagram]) {
      const renderExpandedDiagram = async () => {
        const expandedElement = document.getElementById(`expanded-mermaid-${expandedDiagram}`)
        if (expandedElement) {
          try {
            // Re-initialize mermaid with larger settings for expanded view
            const isDark = document.documentElement.classList.contains('dark')
            mermaid.initialize({
              startOnLoad: false,
              theme: isDark ? 'dark' : 'neutral',
              themeVariables: isDark
                ? {
                    // Dark mode theme
                    primaryColor: '#065f46',
                    primaryTextColor: '#d1fae5',
                    primaryBorderColor: '#10b981',
                    secondaryColor: '#0c4a6e',
                    secondaryTextColor: '#bae6fd',
                    secondaryBorderColor: '#0ea5e9',
                    background: '#1f2937',
                    mainBkg: '#065f46',
                    secondBkg: '#0c4a6e',
                    textColor: '#e5e7eb',
                    nodeTextColor: '#e5e7eb',
                    fontSize: '16px' // Larger font for expanded view
                  }
                : {
                    // Light mode theme
                    primaryColor: '#e6f7f3',
                    primaryTextColor: '#065f46',
                    primaryBorderColor: '#10b981',
                    secondaryColor: '#e0f2fe',
                    secondaryTextColor: '#0c4a6e',
                    secondaryBorderColor: '#0ea5e9',
                    background: '#ffffff',
                    mainBkg: '#f0fdf4',
                    secondBkg: '#f0f9ff',
                    textColor: '#1f2937',
                    nodeTextColor: '#1f2937',
                    noteTextColor: '#374151', // Dark gray for yellow backgrounds
                    noteBorderColor: '#f59e0b',
                    fontSize: '16px' // Larger font for expanded view
                  },
              flowchart: {
                htmlLabels: true,
                curve: 'basis',
                nodeSpacing: 80, // More spacing for expanded view
                rankSpacing: 80,
                padding: 20
              }
            })

            const graphId = `expanded-graph-${Date.now()}`
            const { svg } = await mermaid.render(graphId, mermaidCharts[expandedDiagram])

            // Store the SVG in a data attribute for zoom functionality
            expandedElement.setAttribute('data-svg', svg)

            // Create a wrapper div that allows the SVG to scale properly
            expandedElement.innerHTML = `
              <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: auto;">
                <div id="expanded-diagram-content" style="transform: scale(${zoomLevel}); transform-origin: center; transition: transform 0.3s ease;">
                  ${svg}
                </div>
              </div>
            `

            // Fix text colors in expanded diagram too
            setTimeout(() => {
              fixYellowBackgroundTextColors()
            }, 200)

            // Re-initialize mermaid back to normal settings after rendering
            setTimeout(() => {
              mermaid.initialize({
                startOnLoad: false,
                theme: isDark ? 'dark' : 'neutral',
                themeVariables: isDark
                  ? {
                      primaryColor: '#065f46',
                      primaryTextColor: '#d1fae5',
                      primaryBorderColor: '#10b981',
                      fontSize: '14px'
                    }
                  : {
                      primaryColor: '#e6f7f3',
                      primaryTextColor: '#065f46',
                      primaryBorderColor: '#10b981',
                      fontSize: '14px'
                    },
                flowchart: {
                  htmlLabels: true,
                  curve: 'basis',
                  nodeSpacing: 50,
                  rankSpacing: 50,
                  padding: 15
                }
              })
            }, 500)
          } catch (error) {
            console.error('Error rendering expanded diagram:', error)
          }
        }
      }

      // Small delay to ensure DOM is ready
      setTimeout(renderExpandedDiagram, 100)
    }
  }, [expandedDiagram, mermaidCharts, zoomLevel])

  // Update zoom level when changed
  useEffect(() => {
    if (expandedDiagram !== null) {
      const contentElement = document.getElementById('expanded-diagram-content')
      if (contentElement) {
        contentElement.style.transform = `scale(${zoomLevel})`
      }
    }
  }, [zoomLevel, expandedDiagram])

  return (
    <>
      <article
        className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-gray-800 dark:prose-headings:text-gray-100 prose-p:text-gray-500 dark:prose-p:text-gray-300 prose-strong:text-gray-700 dark:prose-strong:text-gray-200 prose-code:bg-gray-100 dark:prose-code:bg-gray-900 prose-code:text-emerald-600 dark:prose-code:text-emerald-400 prose-pre:bg-gray-50 dark:prose-pre:bg-gray-900 prose-blockquote:border-emerald-600 prose-a:text-emerald-600 hover:prose-a:text-emerald-700 [&_.mermaid-container_svg]:max-w-full [&_.mermaid-container_svg]:h-auto"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />

      {/* Expanded diagram modal */}
      {expandedDiagram !== null && mermaidCharts[expandedDiagram] && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setExpandedDiagram(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Mermaid Diagram {expandedDiagram + 1} - Expanded View
              </h3>
              <div className="flex items-center gap-2">
                {/* Zoom controls */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                    className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors min-w-[3rem]"
                    title="Reset Zoom"
                  >
                    {Math.round(zoomLevel * 100)}%
                  </button>
                  <button
                    onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))}
                    className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title="Reset"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    setExpandedDiagram(null)
                    setZoomLevel(1)
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
              <div id={`expanded-mermaid-${expandedDiagram}`} className="mermaid">
                {mermaidCharts[expandedDiagram]}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
