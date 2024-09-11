from flask import Flask, render_template, request, jsonify
import random
import pycountry
from PIL import Image
import requests
from io import BytesIO

app = Flask(__name__, static_url_path='/static')

# Get all countries
countries = [{"name": country.name, "code": country.alpha_2.lower()} for country in pycountry.countries]

def get_average_color(flag_url):
    response = requests.get(flag_url)
    img = Image.open(BytesIO(response.content))
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
    return f"#{int(r_total/count):02x}{int(g_total/count):02x}{int(b_total/count):02x}"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_flag')
def get_flag():
    correct_country = random.choice(countries)
    options = [correct_country['name']]
    
    while len(options) < 6:
        option = random.choice(countries)['name']
        if option not in options:
            options.append(option)
    
    random.shuffle(options)
    
    flag_url = f"https://flagcdn.com/w320/{correct_country['code']}.png"
    avg_color = get_average_color(flag_url)
    
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