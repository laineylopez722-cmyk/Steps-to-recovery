# NA "Just for Today" & Recovery Resources Reference

## Just for Today (JFT) Daily Meditation

The **"Just for Today"** daily meditation book is published by **Narcotics Anonymous World Services, Inc.** It provides 366 daily meditations — one for each day of the year — drawn from NA's recovery principles.

### Official Links

| Resource | URL |
|----------|-----|
| **JFT Daily Reading (Web)** | https://www.jftna.org/jft/ |
| **NA World Services** | https://www.na.org/ |
| **NA Meeting Search** | https://www.na.org/meetingsearch/ |
| **NA Literature Order** | https://na.org/products/ |

### Book Details

- **Title**: Just for Today — Daily Meditations for Recovering Addicts
- **Publisher**: Narcotics Anonymous World Services, Inc.
- **ISBN**: 978-1-55776-109-8
- **Format**: One meditation per day (366 total)
- **Structure**: Each entry includes a quote, a thought, a meditation, and a "just for today" commitment

### Integration in Steps to Recovery

The app integrates JFT as follows:

1. **Daily Reading Screen**: Each day shows an original recovery reflection written for the app
2. **JFT Link**: Every daily reading includes a link to the official JFT page at `jftna.org/jft/`
3. **External URL**: The `external_url` field on each `ReadingData` entry points to the JFT
4. **Attribution**: JFT is properly attributed to NA World Services

### Copyright Notice

The content of "Just for Today" is copyrighted by NA World Services, Inc. The app does **NOT** reproduce any copyrighted text from the book. Instead, it:

- Provides original recovery-themed daily reflections
- Links to the official JFT website for the NA meditation
- Encourages users to purchase the book or read online at jftna.org

### Related NA Resources

| Resource | Description | URL |
|----------|-------------|-----|
| NA Basic Text | Core NA literature | https://na.org/products/ |
| It Works: How and Why | Step work guide | https://na.org/products/ |
| Living Clean | Journey continues | https://na.org/products/ |
| NA Helpline (US) | Phone support | 1-818-773-9999 |
| NA Helpline (UK) | Phone support | 0300 999 1212 |

### Implementation Constants

```typescript
// src/data/dailyReadings.ts
export const NA_JFT_URL = 'https://www.jftna.org/jft/';
export const NA_WEBSITE_URL = 'https://www.na.org/';
export const NA_MEETING_SEARCH_URL = 'https://www.na.org/meetingsearch/';
```

### How It Works in the App

1. User opens the Daily Readings feature
2. App shows the reading for the current day of the year
3. If a custom original reading exists → shows full original content
4. All readings include a "Read Today's JFT" button → opens `jftna.org/jft/` in browser
5. User can reflect on the prompt and save their reflection (encrypted locally)
