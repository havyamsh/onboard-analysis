from flask import Flask, request, jsonify, render_template_string
import json
import csv
import os
from datetime import datetime
import sqlite3
import requests

app = Flask(__name__)

# Database setup
def init_db():
    conn = sqlite3.connect('onboarding.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            steps TEXT NOT NULL,
            completed_at TEXT NOT NULL,
            drop_off_step INTEGER
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

@app.route('/')
def index():
    return render_template_string(open('index.html').read())

@app.route('/static/<path:filename>')
def static_files(filename):
    if filename.startswith('css/'):
        with open(f'static/css/{filename[4:]}', 'r') as f:
            content = f.read()
        return content, 200, {'Content-Type': 'text/css'}
    elif filename.startswith('js/'):
        with open(f'static/js/{filename[3:]}', 'r') as f:
            content = f.read()
        return content, 200, {'Content-Type': 'application/javascript'}

@app.route('/api/submit_step', methods=['POST'])
def submit_step():
    """Log user step progress"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['id', 'userId', 'steps', 'completedAt']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Save to database
        conn = sqlite3.connect('onboarding.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO sessions (id, user_id, steps, completed_at, drop_off_step)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            data['id'],
            data['userId'],
            json.dumps(data['steps']),
            data['completedAt'],
            data.get('dropOffStep')
        ))
        
        conn.commit()
        conn.close()
        
        # Also save to CSV for backup
        save_to_csv(data)
        
        return jsonify({'success': True, 'message': 'Step data saved successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get_data', methods=['GET'])
def get_data():
    """Retrieve all onboarding data"""
    try:
        conn = sqlite3.connect('onboarding.db')
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM sessions ORDER BY completed_at DESC')
        rows = cursor.fetchall()
        conn.close()
        
        data = []
        for row in rows:
            data.append({
                'id': row[0],
                'userId': row[1],
                'steps': json.loads(row[2]),
                'completedAt': row[3],
                'dropOffStep': row[4]
            })
        
        return jsonify(data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """Generate AI-powered insights"""
    try:
        # Get data from database
        conn = sqlite3.connect('onboarding.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM sessions')
        rows = cursor.fetchall()
        conn.close()
        
        if not rows:
            return jsonify({'insights': ['No data available for analysis']})
        
        # Prepare data for analysis
        sessions_data = []
        for row in rows:
            sessions_data.append({
                'id': row[0],
                'userId': row[1],
                'steps': json.loads(row[2]),
                'completedAt': row[3],
                'dropOffStep': row[4]
            })
        
        # Perform analysis
        analysis_results = analyze_onboarding_data(sessions_data)
        
        # Generate insights (you can integrate with Ollama or OpenAI here)
        insights = generate_ai_insights(analysis_results)
        
        return jsonify({'insights': insights, 'analysis': analysis_results})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reset', methods=['POST'])
def reset_data():
    """Reset all data"""
    try:
        # Clear database
        conn = sqlite3.connect('onboarding.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM sessions')
        conn.commit()
        conn.close()
        
        # Clear CSV file
        if os.path.exists('onboarding_data.csv'):
            os.remove('onboarding_data.csv')
        
        return jsonify({'success': True, 'message': 'All data reset successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def save_to_csv(data):
    """Save session data to CSV file"""
    file_exists = os.path.exists('onboarding_data.csv')
    
    with open('onboarding_data.csv', 'a', newline='') as csvfile:
        fieldnames = ['id', 'userId', 'completedAt', 'dropOffStep', 'steps_completed', 'total_steps']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        if not file_exists:
            writer.writeheader()
        
        steps_completed = len([step for step in data['steps'] if step['completed']])
        
        writer.writerow({
            'id': data['id'],
            'userId': data['userId'],
            'completedAt': data['completedAt'],
            'dropOffStep': data.get('dropOffStep', ''),
            'steps_completed': steps_completed,
            'total_steps': len(data['steps'])
        })

def analyze_onboarding_data(data):
    """Analyze onboarding data and return insights"""
    total_sessions = len(data)
    
    if total_sessions == 0:
        return {
            'totalSessions': 0,
            'completionRate': 0,
            'dropOffRates': {},
            'mostCommonDropOff': 1
        }
    
    # Calculate completion rate
    completed_sessions = len([session for session in data 
                            if len([step for step in session['steps'] if step['completed']]) == 5])
    completion_rate = (completed_sessions / total_sessions) * 100
    
    # Calculate drop-off rates
    drop_off_rates = {}
    for step in range(1, 6):
        drop_offs = len([session for session in data if session['dropOffStep'] == step])
        drop_off_rates[step] = (drop_offs / total_sessions) * 100
    
    # Find most common drop-off
    most_common_drop_off = max(drop_off_rates.items(), key=lambda x: x[1])[0] if drop_off_rates else 1
    
    return {
        'totalSessions': total_sessions,
        'completionRate': completion_rate,
        'dropOffRates': drop_off_rates,
        'mostCommonDropOff': most_common_drop_off
    }

def generate_ai_insights(analysis):
    """Generate AI-powered insights based on analysis"""
    insights = []
    
    # Analyze completion rate
    completion_rate = analysis['completionRate']
    if completion_rate < 30:
        insights.append(f"⚠️ Critical: Only {completion_rate:.1f}% of users complete onboarding. Consider simplifying the process or reducing the number of required steps.")
    elif completion_rate < 60:
        insights.append(f"📊 Your completion rate of {completion_rate:.1f}% has room for improvement. Focus on the steps with highest drop-off rates.")
    else:
        insights.append(f"✅ Great! Your completion rate of {completion_rate:.1f}% is above average. Continue optimizing for even better results.")
    
    # Analyze drop-off patterns
    drop_off_rates = analysis['dropOffRates']
    if drop_off_rates:
        highest_drop_off = max(drop_off_rates.items(), key=lambda x: x[1])
        step_names = ['Sign Up', 'Email Verification', 'Profile Setup', 'Upload ID', 'Payment']
        
        if highest_drop_off[1] > 20:
            insights.append(f"🔍 Step {highest_drop_off[0]} ({step_names[highest_drop_off[0] - 1]}) has the highest drop-off rate at {highest_drop_off[1]:.1f}%. Consider adding progress indicators, clearer instructions, or reducing form complexity.")
    
    # Specific step recommendations
    if drop_off_rates.get(4, 0) > 15:  # Upload ID step
        insights.append("📁 High drop-off at ID Upload suggests friction. Recommendations: Add file format examples, implement drag-and-drop, provide clear privacy assurance, or make this step optional initially.")
    
    if drop_off_rates.get(5, 0) > 25:  # Payment step
        insights.append("💳 Payment step shows significant abandonment. Consider: offering a free trial period, displaying security badges, providing multiple payment options, or implementing guest checkout.")
    
    if drop_off_rates.get(2, 0) > 20:  # Email verification
        insights.append("📧 Email verification drop-off is high. Improvements: implement magic links, reduce verification time, provide clear next steps, or allow users to continue while verification is pending.")
    
    # General recommendations
    insights.append("💡 Recommended optimizations: Add a progress bar showing completion percentage, implement auto-save for partially completed forms, and provide clear value propositions at each step.")
    
    if analysis['totalSessions'] > 10:
        insights.append("🎯 User behavior analysis suggests implementing smart defaults and conditional logic to reduce form fields based on user type selection in the profile setup step.")
    
    return insights[:5]  # Limit to 5 insights

def call_ollama_api(prompt, data):
    """Call Ollama API for AI insights (optional integration)"""
    try:
        # Example Ollama API call
        # Replace with your Ollama endpoint
        url = "http://localhost:11434/api/generate"
        
        payload = {
            "model": "llama2",  # or your preferred model
            "prompt": f"""
            Analyze this onboarding data and provide insights:
            
            Data: {json.dumps(data, indent=2)}
            
            Please provide 3-5 specific, actionable insights about:
            1. Drop-off patterns
            2. User behavior clusters
            3. UX improvement recommendations
            4. Conversion optimization strategies
            
            Format each insight as a bullet point with an emoji.
            """,
            "stream": False
        }
        
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            return result.get('response', '').split('\n')
        else:
            return ["AI service temporarily unavailable. Using built-in analysis."]
            
    except Exception as e:
        print(f"Ollama API error: {e}")
        return ["AI service temporarily unavailable. Using built-in analysis."]

def call_openai_api(prompt, data):
    """Call OpenAI API for AI insights (optional integration)"""
    try:
        # Example OpenAI API call
        # You'll need to install openai: pip install openai
        # and set your API key
        
        import openai
        
        openai.api_key = os.getenv('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')
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert UX analyst specializing in onboarding optimization."
                },
                {
                    "role": "user",
                    "content": f"""
                    Analyze this onboarding funnel data and provide actionable insights:
                    
                    {json.dumps(data, indent=2)}
                    
                    Provide 3-5 specific insights about drop-off patterns, user behavior, and optimization recommendations.
                    Format each insight with an emoji and keep them concise but actionable.
                    """
                }
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        return content.split('\n') if content else ["AI analysis completed."]
        
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return ["AI service temporarily unavailable. Using built-in analysis."]

if __name__ == '__main__':
    # Create static directories if they don't exist
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    
    app.run(debug=True, host='0.0.0.0', port=5000)