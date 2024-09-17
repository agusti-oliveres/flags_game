from flask import Flask, render_template, request, jsonify, send_from_directory
import random
import pycountry
from PIL import Image
import requests
from io import BytesIO
import os

app = Flask(__name__)

# Get all countries
countries = [{"name": country.name, "code": country.alpha_2.lower()} for country in pycountry.countries]

def get_average_color(flag_code):
    # Path to the local flag file
    flag_path = os.path.join('static', 'flags', f"{flag_code}.png")
    
    if os.path.exists(flag_path):
        img = Image.open(flag_path)
        img = img.convert('RGB')
        width, height = img.size
        pixels = img.load()
        
        r_total = g_total = b_total = 0
        count = 0
        for x in range(width):
            for y in range(height):
                r, g, b = pixels[x, y]
                r_total += r
                g_total += g
                b_total += b
                count += 1
        
        # Calculate the average color in hex format
        return f"#{int(r_total/count):02x}{int(g_total/count):02x}{int(b_total/count):02x}"
    
    else:
        # If the flag doesn't exist, return a fallback color (white or error color)
        print(f"Flag image not found for code: {flag_code}")
        return "#FFFFFF"  # Fallback color if flag not found

# Serve index.html from the root directory
@app.route('/')
def index():
    return send_from_directory(os.getcwd(), 'index.html')  # Use current working directory

@app.route('/get_flag')
def get_flag():
    correct_country = random.choice(countries)
    options = [correct_country['name']]
    
    while len(options) < 6:
        option = random.choice(countries)['name']
        if option not in options:
            options.append(option)
    
    random.shuffle(options)
    
    flag_url = f"/static/flags/{correct_country['code']}.png"
    avg_color = get_average_color(correct_country['code'])
    
    return jsonify({
        "code": correct_country["code"],
        "options": options,
        "correct_answer": correct_country["name"],
        "avg_color": avg_color
    })

@app.route('/check_guess', methods=['POST'])
def check_guess():
    data = request.json
    guess = data['guess']
    correct_answer = data['correct_answer']
    is_correct = guess == correct_answer
    return jsonify({"correct": is_correct})

if __name__ == '__main__':
    app.run(debug=True)
