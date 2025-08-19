# 🎨 Grafana Dashboard Creation Guide for HERA ERP

## 🚀 **Creating Your First HERA Dashboard**

### **Step 1: Access Grafana**
1. Open http://localhost:3005
2. Login: `admin` / `heraadmin123`
3. You'll see the Grafana home page

### **Step 2: Create New Dashboard**
1. Click **"+"** in the left sidebar
2. Select **"Create Dashboard"**
3. Click **"Add visualization"**
4. Select **"Prometheus"** as data source

---

## 📊 **Panel 1: API Request Rate**

### **Configuration:**
- **Panel Title**: "HERA API Request Rate"
- **Query**: `rate(hera_api_requests_total[5m])`
- **Panel Type**: Time series
- **Y-Axis Unit**: "requests/sec"

### **Steps:**
1. In the query field, enter: `rate(hera_api_requests_total[5m])`
2. Click **"Run queries"** to test
3. In the right panel, set:
   - **Panel options** → **Title**: "HERA API Request Rate"
   - **Standard options** → **Unit**: "reqps" (requests per second)
4. Click **"Apply"** to save the panel

---

## 📈 **Panel 2: Total API Requests**

### **Configuration:**
- **Panel Title**: "Total API Requests"
- **Query**: `sum(hera_api_requests_total)`
- **Panel Type**: Stat
- **Display**: Big number with trend

### **Steps:**
1. Click **"Add panel"** → **"Add visualization"**
2. Query: `sum(hera_api_requests_total)`
3. Change visualization type to **"Stat"**
4. In panel options:
   - **Title**: "Total API Requests"
   - **Value options** → **Show**: "Value and name"
   - **Graph mode**: "Area"
5. Click **"Apply"**

---

## ⚡ **Panel 3: Response Time**

### **Configuration:**
- **Panel Title**: "API Response Time"
- **Query**: `avg(hera_api_duration_milliseconds)`
- **Panel Type**: Time series
- **Y-Axis Unit**: milliseconds

### **Steps:**
1. Add new panel
2. Query: `avg(hera_api_duration_milliseconds)`
3. Panel options:
   - **Title**: "API Response Time"
   - **Unit**: "ms" (milliseconds)
   - **Min**: 0
4. Click **"Apply"**

---

## 🛡️ **Panel 4: System Health**

### **Configuration:**
- **Panel Title**: "System Uptime"
- **Query**: `hera_system_uptime_seconds / 3600`
- **Panel Type**: Stat
- **Unit**: Hours

### **Steps:**
1. Add new panel
2. Query: `hera_system_uptime_seconds / 3600`
3. Visualization: **"Stat"**
4. Panel options:
   - **Title**: "System Uptime (Hours)"
   - **Unit**: "h" (hours)
   - **Decimals**: 1
5. Click **"Apply"**

---

## 💾 **Panel 5: Memory Usage**

### **Configuration:**
- **Panel Title**: "Memory Usage"
- **Query**: `hera_system_memory_usage_bytes{type="used"} / 1024 / 1024`
- **Panel Type**: Time series
- **Unit**: MB

### **Steps:**
1. Add new panel
2. Query: `hera_system_memory_usage_bytes{type="used"} / 1024 / 1024`
3. Panel options:
   - **Title**: "Memory Usage (MB)"
   - **Unit**: "decbytes" (bytes)
   - **Min**: 0
4. Click **"Apply"**

---

## 🌐 **Panel 6: Requests by Endpoint**

### **Configuration:**
- **Panel Title**: "Requests by Endpoint"
- **Query**: `sum(hera_api_requests_total) by (endpoint)`
- **Panel Type**: Pie chart

### **Steps:**
1. Add new panel
2. Query: `sum(hera_api_requests_total) by (endpoint)`
3. Visualization: **"Pie chart"**
4. Panel options:
   - **Title**: "Requests by Endpoint"
   - **Legend** → **Values**: "Value"
   - **Legend** → **Placement**: "Right"
5. Click **"Apply"**

---

## 🎯 **Advanced Panel: Business Conversion Rate**

### **Configuration:**
- **Panel Title**: "Trial to Production Conversion Rate"
- **Query**: `(sum(hera_progressive_conversions_total{success="true"}) / sum(hera_progressive_actions_total{action="trial_started"})) * 100`
- **Panel Type**: Stat
- **Unit**: Percent

### **Steps:**
1. Add new panel
2. Query: `(sum(hera_progressive_conversions_total{success="true"}) / sum(hera_progressive_actions_total{action="trial_started"})) * 100`
3. Visualization: **"Stat"**
4. Panel options:
   - **Title**: "Trial to Production Conversion Rate"
   - **Unit**: "percent"
   - **Thresholds**: 
     - Green: > 70%
     - Yellow: 50-70%
     - Red: < 50%
5. Click **"Apply"**

---

## 🎨 **Dashboard Organization**

### **Arrange Panels:**
1. **Top Row** (Overview):
   - Total API Requests (Stat)
   - API Request Rate (Time series)
   - System Uptime (Stat)

2. **Middle Row** (Performance):
   - API Response Time (Time series)
   - Memory Usage (Time series)

3. **Bottom Row** (Business Intelligence):
   - Requests by Endpoint (Pie chart)
   - Trial Conversion Rate (Stat)

### **Dashboard Settings:**
1. Click **"Dashboard settings"** (gear icon)
2. **General**:
   - **Title**: "HERA ERP - Live Customer Analytics"
   - **Tags**: Add "hera", "customer", "analytics"
3. **Time options**:
   - **Timezone**: "Browser"
   - **Auto refresh**: "30s"
   - **Time range**: "Last 1 hour"
4. Click **"Save dashboard"**

---

## 🔧 **Dashboard Variables (Advanced)**

### **Create Environment Variable:**
1. **Dashboard settings** → **Variables**
2. **Add variable**:
   - **Name**: "environment"
   - **Type**: "Query"
   - **Query**: `label_values(hera_api_requests_total, environment)`
   - **Multi-value**: Enabled

### **Use in Panels:**
Update queries to use variable:
```promql
rate(hera_api_requests_total{environment="$environment"}[5m])
```

---

## 🚨 **Adding Alerts**

### **High Error Rate Alert:**
1. Edit any panel
2. Click **"Alert"** tab
3. **Create Alert**:
   - **Condition**: `IS ABOVE 5` (5% error rate)
   - **Evaluation**: Every `10s` for `30s`
4. **Notifications**:
   - Add notification channels (email, Slack, etc.)
5. **Save**

---

## 🎯 **Testing Your Dashboard**

### **Generate Data to See Panels Update:**
```bash
# Generate API requests
for i in {1..20}; do
  curl -s https://heraerp.com/ > /dev/null
  echo "Generated request $i"
  sleep 1
done
```

### **Verify Panels Show Data:**
1. Check each panel shows data (not "No data")
2. Set auto-refresh to "5s" to see real-time updates
3. Adjust time range if needed ("Last 15 minutes")

---

## 📊 **Dashboard Templates for Different Use Cases**

### **Executive Dashboard** (High-level metrics):
- Revenue trends
- Customer growth
- System availability
- Geographic distribution

### **Technical Dashboard** (Operations focus):
- API performance
- Error rates
- System resources
- Database performance

### **Business Intelligence Dashboard**:
- Conversion funnels
- Feature usage
- Customer segmentation
- Market analysis

---

## 💡 **Pro Tips**

### **Panel Optimization:**
- Use **appropriate time ranges** for different metrics
- Set **meaningful thresholds** for stat panels
- Use **consistent color schemes** across panels
- Add **descriptions** to panels for team clarity

### **Performance:**
- Limit **number of panels** per dashboard (< 20)
- Use **efficient queries** (avoid complex calculations)
- Set **appropriate refresh intervals**
- Use **template variables** for filtering

### **Organization:**
- Create **folders** for different dashboard types
- Use **consistent naming** conventions
- Add **tags** for easy searching
- Set **default time ranges** appropriately

---

## 🚀 **Ready-to-Use Queries**

### **Customer Analytics:**
```promql
# Page views by country
sum(hera_page_views_total) by (country)

# Device usage distribution
sum(hera_page_views_total) by (device_type)

# Progressive app engagement
rate(hera_progressive_actions_total[5m])
```

### **Business Intelligence:**
```promql
# Revenue by business type
sum(hera_business_value{metric="revenue"}) by (business_type)

# Customer acquisition rate
rate(hera_business_conversions_total{step="started"}[1h])

# Feature adoption
sum(hera_progressive_actions_total) by (action)
```

### **System Performance:**
```promql
# Error rate percentage
(sum(rate(hera_api_requests_total{status_code!="200"}[5m])) / sum(rate(hera_api_requests_total[5m]))) * 100

# 95th percentile response time
histogram_quantile(0.95, rate(hera_api_duration_milliseconds_bucket[5m]))

# Request rate by endpoint
sum(rate(hera_api_requests_total[5m])) by (endpoint)
```

---

## 🎉 **Success Checklist**

### **✅ Your Dashboard is Ready When:**
- [ ] All panels display data (not "No data")
- [ ] Auto-refresh is working (panels update automatically)
- [ ] Time range selector works correctly
- [ ] Alerts are configured for critical metrics
- [ ] Dashboard is saved with meaningful name
- [ ] Team members can access and understand it

---

**🎯 Start with the simple panels above, then add more advanced visualizations as you collect more data. Your HERA ERP monitoring will give you insights that rival enterprise platforms!**

*Happy dashboard building! 📊🚀*