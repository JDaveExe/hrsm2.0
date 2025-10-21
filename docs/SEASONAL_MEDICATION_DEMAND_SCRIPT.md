# 📝 Seasonal Medication Demand Trends - Script Summary

**Concise explanation for presentations, documentation, or user guides**

---

## 🎬 SHORT SCRIPT (2-3 Sentences) - Choose One:

### **Version 1 (Simple/Conversational):**
"The Seasonal Medication Demand system tracks medication usage in real-time and predicts what we'll need next week by combining recent patterns with seasonal weather changes. When typhoon season hits from June to November, it automatically increases our forecasts by 50% because diseases like dengue and diarrheal infections spike during heavy rains. The system gives us early warnings about potential shortages so we can restock before running out."

### **Version 2 (Technical):**
"This forecasting feature applies exponential smoothing with a 0.3 alpha factor to medication usage data and automatically multiplies predictions by 1.5× during the Philippine typhoon season from June to November. The algorithm balances 30% recent usage trends with 70% historical patterns to generate alerts 1-2 weeks before potential stockouts occur."

### **Version 3 (Demo/Presentation):**
"The Seasonal Medication Demand forecasting continuously monitors prescription data and adjusts predictions based on the Philippines' two main seasons—typhoon season and dry season. Using exponential smoothing, it automatically increases forecasts by 50% during wet months when waterborne and vector-borne diseases surge, ensuring the health center maintains adequate stock levels throughout the year."

### **Version 4 (Ultra-Short - 1 Sentence):**
"This feature predicts medication needs by analyzing daily usage and applying seasonal adjustments—during typhoon season, forecasts increase by 50% to prepare for disease spikes like dengue and diarrheal outbreaks."

---

## 🎯 What is Seasonal Medication Demand Forecasting?

A system that predicts how much medication the health center will need each week by analyzing usage patterns and adjusting for Philippine weather seasons.

---

## 🔄 How It Works (4 Simple Steps)

### Step 1: Track Daily Usage
The system monitors real prescription data from patient appointments and check-ins.

### Step 2: Detect Weekly Patterns
Analyzes 7-day trends:
- Weekdays (Mon-Fri) have higher demand
- Weekends have about 60% of weekday demand
- Uses moving averages to smooth out daily fluctuations

### Step 3: Apply Seasonal Adjustments
Adjusts forecasts based on Philippine climate:
- **Typhoon Season (June-November)**: Multiply demand by 1.5× (50% increase)
- **Dry Season (December-May)**: Normal demand (1.0×)

### Step 4: Calculate Future Needs
Combines recent usage with historical patterns using exponential smoothing:

```
Forecast = (30% Recent Usage) + (70% Previous Forecast) × Seasonal Multiplier
```

---

## 📊 Real Example

**Scenario: Rainy season starts in June**

**Before (May - Dry Season):**
- Average medication usage: 400 units/week
- Forecast: 400 units
- Status: Normal stock levels

**After (June - Typhoon Season Begins):**
- Seasonal multiplier activates: 1.5×
- New forecast: 400 × 1.5 = **600 units/week**
- System alert: "Increase stock by 50%"

**Week 3 (Typhoon hits):**
- Disease cases spike (dengue +120%, diarrheal +80%)
- Actual usage jumps to 950 units
- System adapts quickly:
  - New calculation: (30% × 950) + (70% × 600) = 705 units
  - With seasonal: 705 × 1.5 = **1,058 units**
- **Critical alert: "Urgent restocking needed!"**

**December (Dry Season Returns):**
- Usage drops back to 350 units
- Seasonal multiplier: 1.0×
- Forecast: 350 units
- Alert: "Stock can return to normal levels"

---

## ✅ Key Benefits

**1. Proactive Planning**
- Predicts shortages 1-2 weeks in advance
- Prevents stockouts during critical periods

**2. Context-Aware**
- Understands Philippine weather patterns
- Accounts for typhoon season impacts

**3. Adaptive**
- Responds to actual usage in real-time
- Adjusts forecasts as patterns change

**4. Balanced Approach**
- 30% weight on recent data (responsive)
- 70% weight on historical patterns (stable)
- Prevents over-reaction to single-day spikes

---

## 🌡️ Why Seasons Matter

**Typhoon Season (June-November):**
- Heavy rainfall → Mosquito breeding → Dengue outbreaks
- Flooding → Contaminated water → Diarrheal diseases & Leptospirosis
- Result: **50-100% increase** in medication demand

**Dry Season (December-May):**
- Lower disease transmission rates
- Stable healthcare demand
- Normal medication usage

---

## 📈 The Formula Explained Simply

```
Next Week's Forecast = 
  (This Week's Usage × 0.3) +        [Recent trend]
  (Last Week's Forecast × 0.7) ×     [Historical pattern]
  Seasonal Multiplier                 [Climate adjustment]
```

**Example:**
- This week used: 500 units
- Last forecast: 400 units
- Current season: Typhoon (1.5× multiplier)

**Calculation:**
1. Base = (500 × 0.3) + (400 × 0.7) = 150 + 280 = 430 units
2. Seasonal = 430 × 1.5 = **645 units forecast**

---

## 🎨 Visual Representation

```
Medication Demand Over Time:

Normal (Dry Season)     ════════════════════     400 units/week
                               ↓
Season Changes                 ↓
                               ↓
Rainy Season Starts    ═══════════════════════   600 units/week (+50%)
                               ↓
                               ↓
Typhoon Hits          ════════════════════════   1,000+ units/week (+150%)
                               ↓
                               ↓
Season Stabilizes     ═══════════════════════    700 units/week (+75%)
                               ↓
                               ↓
Dry Season Returns    ════════════════════      350 units/week (Normal)
```

---

## 💡 Key Takeaway

**In one sentence:**
*The system tracks real medication usage, recognizes weekly patterns, and automatically adjusts forecasts based on Philippine typhoon seasons to prevent shortages and ensure the health center is always prepared.*

---

## 🗣️ Script-Ready Explanation (30 seconds)

"Our forecasting system monitors daily medication usage and creates predictions for next week's needs. It uses a smart formula that balances recent trends with historical patterns—30% weight on recent data and 70% on past forecasts. 

The key feature is **seasonal intelligence**: during typhoon season from June to November, the system automatically multiplies demand by 1.5 because we see more dengue, diarrheal diseases, and leptospirosis cases. When dry season returns in December, it adjusts back to normal levels.

This means we can predict shortages 1-2 weeks in advance and keep critical medications in stock when patients need them most."

---

## 🗣️ Script-Ready Explanation (1 minute)

"Let me explain how our seasonal medication demand forecasting works.

First, the system tracks every prescription and medication order from our clinic in real-time. It analyzes patterns—like how Mondays are busier than weekends, and how certain medications are used more during specific times of year.

The magic happens with our forecasting formula. We take 30% weight from recent usage and 70% from historical patterns. This balance means the system is responsive to changes but doesn't panic over a single busy day.

Here's where it gets powerful: **seasonal adjustments**. We're in the Philippines, so typhoon season from June to November brings flooding, mosquito breeding, and water contamination. The system knows this and automatically multiplies medication forecasts by 1.5 during these months.

Let me give you a real example: In May, we use about 400 units of medication per week. When June arrives, the system detects the season change and forecasts 600 units—a 50% increase. If a typhoon hits and we see disease cases spike, it quickly adapts, sometimes forecasting over 1,000 units.

The result? We get 1-2 week advance warnings for restocking, we prevent medication shortages during emergencies, and we ensure our community always has access to the medicines they need."

---

**Created:** October 8, 2025  
**Purpose:** Quick reference for presentations, training, and documentation
