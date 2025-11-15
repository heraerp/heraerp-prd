#!/bin/bash
# HERA Universal Tile System - Production Monitoring Setup
# Smart Code: HERA.MONITORING.SETUP.PRODUCTION.v1
#
# Automated setup for production monitoring infrastructure

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MONITORING_ENV="${MONITORING_ENV:-production}"
DEPLOYMENT_ID="${DEPLOYMENT_ID:-$(date +%Y%m%d-%H%M%S)}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${2:-$GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    log "ERROR: $1" "$RED"
    exit 1
}

warn() {
    log "WARNING: $1" "$YELLOW"
}

info() {
    log "INFO: $1" "$BLUE"
}

success() {
    log "SUCCESS: $1" "$GREEN"
}

# Setup Prometheus configuration
setup_prometheus() {
    info "Setting up Prometheus monitoring configuration..."
    
    cat > "$SCRIPT_DIR/prometheus.yml" << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "hera_alerts.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # HERA Universal Tile System metrics
  - job_name: 'hera-tiles'
    static_configs:
      - targets: ['localhost:3000']
    scrape_interval: 5s
    metrics_path: '/api/metrics'
    params:
      format: ['prometheus']

  # Node.js application metrics
  - job_name: 'hera-app'
    static_configs:
      - targets: ['localhost:3000']
    scrape_interval: 15s
    metrics_path: '/api/health/metrics'

  # Database metrics (if Postgres exporter is available)
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
    scrape_interval: 30s

  # System metrics
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
    scrape_interval: 15s
EOF

    success "Prometheus configuration created"
}

# Setup Grafana dashboard
setup_grafana() {
    info "Setting up Grafana dashboard configuration..."
    
    cat > "$SCRIPT_DIR/grafana-dashboard.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "HERA Universal Tile System - Production Dashboard",
    "tags": ["hera", "tiles", "production"],
    "style": "dark",
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Tile Render Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(hera_tile_render_duration_seconds[5m])",
            "legendFormat": "Average Render Time",
            "refId": "A"
          }
        ],
        "yAxes": [
          {
            "label": "Milliseconds",
            "max": 100,
            "min": 0
          }
        ],
        "alert": {
          "conditions": [
            {
              "query": {
                "queryType": "",
                "refId": "A"
              },
              "reducer": {
                "type": "avg",
                "params": []
              },
              "evaluator": {
                "params": [50],
                "type": "gt"
              }
            }
          ],
          "executionErrorState": "alerting",
          "for": "5m",
          "frequency": "10s",
          "handler": 1,
          "name": "High Tile Render Time",
          "noDataState": "no_data",
          "notifications": []
        },
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 0
        }
      },
      {
        "id": 2,
        "title": "Active Users",
        "type": "singlestat",
        "targets": [
          {
            "expr": "hera_active_users_total",
            "legendFormat": "Active Users",
            "refId": "A"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 0
        }
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(hera_errors_total[5m])",
            "legendFormat": "Error Rate",
            "refId": "A"
          }
        ],
        "alert": {
          "conditions": [
            {
              "query": {
                "queryType": "",
                "refId": "A"
              },
              "reducer": {
                "type": "avg",
                "params": []
              },
              "evaluator": {
                "params": [0.01],
                "type": "gt"
              }
            }
          ],
          "executionErrorState": "alerting",
          "for": "2m",
          "frequency": "10s",
          "handler": 1,
          "name": "High Error Rate",
          "noDataState": "no_data",
          "notifications": []
        },
        "gridPos": {
          "h": 8,
          "w": 24,
          "x": 0,
          "y": 8
        }
      },
      {
        "id": 4,
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "process_resident_memory_bytes / 1024 / 1024",
            "legendFormat": "Memory Usage (MB)",
            "refId": "A"
          }
        ],
        "yAxes": [
          {
            "label": "Megabytes",
            "max": 500,
            "min": 0
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 16
        }
      },
      {
        "id": 5,
        "title": "Cache Hit Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "hera_cache_hit_rate",
            "legendFormat": "Cache Hit Rate",
            "refId": "A"
          }
        ],
        "yAxes": [
          {
            "label": "Percentage",
            "max": 100,
            "min": 0
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 16
        }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "timepicker": {
      "refresh_intervals": ["5s", "10s", "30s", "1m", "5m", "15m", "30m", "1h"],
      "time_options": ["5m", "15m", "1h", "6h", "12h", "24h", "2d", "7d", "30d"]
    },
    "refresh": "5s"
  }
}
EOF

    success "Grafana dashboard configuration created"
}

# Setup AlertManager configuration
setup_alertmanager() {
    info "Setting up AlertManager configuration..."
    
    cat > "$SCRIPT_DIR/alertmanager.yml" << 'EOF'
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@heraerp.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'hera-alerts'
  routes:
  - match:
      severity: critical
    receiver: 'critical-alerts'
    group_wait: 5s
    repeat_interval: 15m

receivers:
- name: 'hera-alerts'
  email_configs:
  - to: 'team@heraerp.com'
    subject: 'HERA Alert: {{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.title }}
      Description: {{ .Annotations.description }}
      Instance: {{ .Labels.instance }}
      Severity: {{ .Labels.severity }}
      {{ end }}
  slack_configs:
  - api_url: "${SLACK_WEBHOOK_URL}"
    channel: '#hera-alerts'
    title: 'HERA Production Alert'
    text: |
      {{ range .Alerts }}
      *Alert:* {{ .Annotations.title }}
      *Description:* {{ .Annotations.description }}
      *Severity:* {{ .Labels.severity }}
      {{ end }}

- name: 'critical-alerts'
  email_configs:
  - to: 'oncall@heraerp.com'
    subject: 'CRITICAL: HERA Production Issue'
    body: |
      {{ range .Alerts }}
      CRITICAL ALERT: {{ .Annotations.title }}
      Description: {{ .Annotations.description }}
      Instance: {{ .Labels.instance }}
      Time: {{ .StartsAt }}
      {{ end }}
  slack_configs:
  - api_url: "${SLACK_WEBHOOK_URL}"
    channel: '#hera-critical'
    title: '🚨 CRITICAL: HERA Production Alert'
    text: |
      {{ range .Alerts }}
      *CRITICAL ALERT:* {{ .Annotations.title }}
      *Description:* {{ .Annotations.description }}
      *Instance:* {{ .Labels.instance }}
      {{ end }}
  pagerduty_configs:
  - routing_key: "${PAGERDUTY_INTEGRATION_KEY}"
    description: 'HERA Critical Alert: {{ range .Alerts }}{{ .Annotations.title }}{{ end }}'
EOF

    success "AlertManager configuration created"
}

# Setup alert rules
setup_alert_rules() {
    info "Setting up alert rules..."
    
    cat > "$SCRIPT_DIR/hera_alerts.yml" << 'EOF'
groups:
- name: hera_universal_tiles
  rules:
  - alert: HighTileRenderTime
    expr: hera_tile_render_duration_seconds > 0.05
    for: 5m
    labels:
      severity: warning
      component: tiles
    annotations:
      title: High Tile Render Time
      description: "Tile rendering time is above 50ms for more than 5 minutes. Current value: {{ $value }}ms"
      runbook_url: "https://docs.heraerp.com/runbooks/high-render-time"

  - alert: CriticalTileRenderTime
    expr: hera_tile_render_duration_seconds > 0.1
    for: 2m
    labels:
      severity: critical
      component: tiles
    annotations:
      title: Critical Tile Render Time
      description: "Tile rendering time is above 100ms for more than 2 minutes. Current value: {{ $value }}ms"
      runbook_url: "https://docs.heraerp.com/runbooks/critical-render-time"

  - alert: HighErrorRate
    expr: rate(hera_errors_total[5m]) > 0.01
    for: 2m
    labels:
      severity: warning
      component: application
    annotations:
      title: High Error Rate
      description: "Error rate is above 1% for more than 2 minutes. Current rate: {{ $value | humanizePercentage }}"
      runbook_url: "https://docs.heraerp.com/runbooks/high-error-rate"

  - alert: CriticalErrorRate
    expr: rate(hera_errors_total[5m]) > 0.05
    for: 1m
    labels:
      severity: critical
      component: application
    annotations:
      title: Critical Error Rate
      description: "Error rate is above 5% for more than 1 minute. Current rate: {{ $value | humanizePercentage }}"
      runbook_url: "https://docs.heraerp.com/runbooks/critical-error-rate"

  - alert: LowCacheHitRate
    expr: hera_cache_hit_rate < 0.7
    for: 5m
    labels:
      severity: warning
      component: caching
    annotations:
      title: Low Cache Hit Rate
      description: "Cache hit rate is below 70% for more than 5 minutes. Current rate: {{ $value | humanizePercentage }}"
      runbook_url: "https://docs.heraerp.com/runbooks/low-cache-hit-rate"

  - alert: HighMemoryUsage
    expr: process_resident_memory_bytes / 1024 / 1024 > 400
    for: 10m
    labels:
      severity: warning
      component: system
    annotations:
      title: High Memory Usage
      description: "Memory usage is above 400MB for more than 10 minutes. Current usage: {{ $value }}MB"
      runbook_url: "https://docs.heraerp.com/runbooks/high-memory-usage"

  - alert: CriticalMemoryUsage
    expr: process_resident_memory_bytes / 1024 / 1024 > 500
    for: 5m
    labels:
      severity: critical
      component: system
    annotations:
      title: Critical Memory Usage
      description: "Memory usage is above 500MB for more than 5 minutes. Current usage: {{ $value }}MB"
      runbook_url: "https://docs.heraerp.com/runbooks/critical-memory-usage"

  - alert: DatabaseConnectionIssues
    expr: hera_database_connection_errors_total > 0
    for: 1m
    labels:
      severity: critical
      component: database
    annotations:
      title: Database Connection Issues
      description: "Database connection errors detected. Error count: {{ $value }}"
      runbook_url: "https://docs.heraerp.com/runbooks/database-connection-issues"

  - alert: LowActiveUsers
    expr: hera_active_users_total < 5
    for: 30m
    labels:
      severity: info
      component: business
    annotations:
      title: Low Active Users
      description: "Active user count is below expected threshold. Current count: {{ $value }}"
      runbook_url: "https://docs.heraerp.com/runbooks/low-active-users"

  - alert: HighBounceRate
    expr: hera_bounce_rate > 0.4
    for: 15m
    labels:
      severity: warning
      component: user_experience
    annotations:
      title: High Bounce Rate
      description: "Bounce rate is above 40% for more than 15 minutes. Current rate: {{ $value | humanizePercentage }}"
      runbook_url: "https://docs.heraerp.com/runbooks/high-bounce-rate"
EOF

    success "Alert rules configuration created"
}

# Setup Docker Compose for monitoring stack
setup_docker_compose() {
    info "Setting up Docker Compose for monitoring stack..."
    
    cat > "$SCRIPT_DIR/docker-compose.monitoring.yml" << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: hera-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./hera_alerts.yml:/etc/prometheus/hera_alerts.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
      - '--alertmanager.url=http://alertmanager:9093'
    networks:
      - hera-monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: hera-grafana
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-admin}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana-dashboard.json:/etc/grafana/provisioning/dashboards/hera-dashboard.json
    networks:
      - hera-monitoring

  alertmanager:
    image: prom/alertmanager:latest
    container_name: hera-alertmanager
    restart: unless-stopped
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager-data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--web.external-url=http://localhost:9093'
    networks:
      - hera-monitoring

  node-exporter:
    image: prom/node-exporter:latest
    container_name: hera-node-exporter
    restart: unless-stopped
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - hera-monitoring

volumes:
  prometheus-data:
  grafana-data:
  alertmanager-data:

networks:
  hera-monitoring:
    driver: bridge
EOF

    success "Docker Compose configuration created"
}

# Create monitoring startup script
create_startup_script() {
    info "Creating monitoring startup script..."
    
    cat > "$SCRIPT_DIR/start-monitoring.sh" << 'EOF'
#!/bin/bash
# Start HERA production monitoring stack

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting HERA production monitoring stack..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start monitoring services
cd "$SCRIPT_DIR"
docker-compose -f docker-compose.monitoring.yml up -d

echo "✅ Monitoring stack started successfully!"
echo ""
echo "📊 Access points:"
echo "   Grafana:       http://localhost:3001 (admin/admin)"
echo "   Prometheus:    http://localhost:9090"
echo "   AlertManager:  http://localhost:9093"
echo ""
echo "📝 Logs:"
echo "   docker-compose -f docker-compose.monitoring.yml logs -f"
echo ""
echo "🛑 Stop:"
echo "   docker-compose -f docker-compose.monitoring.yml down"
EOF

    chmod +x "$SCRIPT_DIR/start-monitoring.sh"
    success "Monitoring startup script created"
}

# Create monitoring health check script
create_health_check() {
    info "Creating monitoring health check script..."
    
    cat > "$SCRIPT_DIR/check-monitoring-health.sh" << 'EOF'
#!/bin/bash
# Health check for HERA monitoring stack

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔍 Checking HERA monitoring stack health..."

# Check if services are running
services=("hera-prometheus" "hera-grafana" "hera-alertmanager" "hera-node-exporter")
all_healthy=true

for service in "${services[@]}"; do
    if docker ps --format "table {{.Names}}" | grep -q "$service"; then
        echo "✅ $service is running"
    else
        echo "❌ $service is not running"
        all_healthy=false
    fi
done

# Check service endpoints
endpoints=(
    "http://localhost:9090/-/healthy:Prometheus"
    "http://localhost:3001/api/health:Grafana"
    "http://localhost:9093/-/healthy:AlertManager"
    "http://localhost:9100/metrics:Node Exporter"
)

for endpoint in "${endpoints[@]}"; do
    url="${endpoint%:*}"
    name="${endpoint#*:}"
    
    if curl -s "$url" >/dev/null 2>&1; then
        echo "✅ $name endpoint is healthy"
    else
        echo "❌ $name endpoint is not responding"
        all_healthy=false
    fi
done

if [ "$all_healthy" = true ]; then
    echo ""
    echo "🎉 All monitoring services are healthy!"
    exit 0
else
    echo ""
    echo "⚠️ Some monitoring services have issues. Check the logs:"
    echo "   docker-compose -f '$SCRIPT_DIR/docker-compose.monitoring.yml' logs"
    exit 1
fi
EOF

    chmod +x "$SCRIPT_DIR/check-monitoring-health.sh"
    success "Monitoring health check script created"
}

# Main setup function
main() {
    info "Setting up HERA Universal Tile System production monitoring..."
    
    # Create monitoring directory if it doesn't exist
    mkdir -p "$SCRIPT_DIR"
    
    # Setup all monitoring components
    setup_prometheus
    setup_grafana
    setup_alertmanager
    setup_alert_rules
    setup_docker_compose
    create_startup_script
    create_health_check
    
    success "🎉 Production monitoring setup completed!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Configure environment variables:"
    echo "   export SLACK_WEBHOOK_URL='your-slack-webhook-url'"
    echo "   export PAGERDUTY_INTEGRATION_KEY='your-pagerduty-key'"
    echo "   export GRAFANA_ADMIN_PASSWORD='secure-password'"
    echo ""
    echo "2. Start monitoring stack:"
    echo "   cd $SCRIPT_DIR && ./start-monitoring.sh"
    echo ""
    echo "3. Check health:"
    echo "   cd $SCRIPT_DIR && ./check-monitoring-health.sh"
    echo ""
    echo "4. Access dashboards:"
    echo "   Grafana: http://localhost:3001"
    echo "   Prometheus: http://localhost:9090"
    echo ""
    echo "📁 Configuration files created in: $SCRIPT_DIR"
}

# Execute main function
main "$@"