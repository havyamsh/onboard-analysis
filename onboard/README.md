# Onboarding Drop-off Analyzer

A comprehensive tool for analyzing user onboarding funnels and identifying drop-off points with AI-powered insights.

## Features

- **Multi-step Onboarding Simulation**: Simulate user journeys through a 5-step onboarding process
- **Real-time Analytics**: Track completion rates, drop-off patterns, and user behavior
- **AI-Powered Insights**: Get intelligent recommendations for UX improvements
- **Interactive Dashboard**: Beautiful charts and visualizations
- **Data Persistence**: SQLite database with CSV backup
- **Responsive Design**: Works on all devices with stunning animations

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Python Flask
- **Database**: SQLite with CSV backup
- **AI Integration**: Ready for Ollama or OpenAI API integration

## Installation

1. Clone or download the project files
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the Flask application:
   ```bash
   python app.py
   ```

4. Open your browser and navigate to `http://localhost:5000`

## Usage

### Onboarding Simulation
1. Click "Start Simulation" or navigate to the Simulator tab
2. Complete steps or simulate drop-offs to generate data
3. Each session is automatically saved to the database

### Analytics Dashboard
1. Navigate to the Analytics tab to view comprehensive data analysis
2. See completion rates, drop-off patterns, and key metrics
3. Generate AI insights for optimization recommendations

### AI Insights
- Click "Generate AI Insights" to analyze your data
- Get specific, actionable recommendations
- Insights are based on drop-off patterns and user behavior

## API Endpoints

- `POST /api/submit_step` - Log user step progress
- `GET /api/get_data` - Retrieve all onboarding data
- `POST /api/analyze` - Generate AI insights
- `POST /api/reset` - Reset all data

## AI Integration

The application is ready for integration with:

### Ollama (Local LLM)
Uncomment the Ollama integration in `app.py` and ensure Ollama is running locally:
```bash
ollama serve
```

### OpenAI API
Set your OpenAI API key and uncomment the OpenAI integration:
```bash
export OPENAI_API_KEY="your-api-key"
```

## Data Storage

- **Primary**: SQLite database (`onboarding.db`)
- **Backup**: CSV file (`onboarding_data.csv`)
- **Frontend**: LocalStorage for immediate access

## Customization

### Adding New Steps
Modify the `STEPS` array in `static/js/app.js`:
```javascript
const STEPS = [
    { id: 1, name: 'Your Step', icon: 'fas fa-icon', description: 'Description' },
    // Add more steps...
];
```

### Styling
All styles are in `static/css/styles.css` with a modular structure for easy customization.

### AI Prompts
Customize AI analysis prompts in the `generate_ai_insights()` function in `app.py`.

## Performance Features

- **Smooth Animations**: CSS3 transitions and keyframe animations
- **Responsive Design**: Mobile-first approach with breakpoints
- **Optimized Loading**: Efficient data handling and caching
- **Progressive Enhancement**: Works without JavaScript for basic functionality

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - Feel free to use and modify for your projects.