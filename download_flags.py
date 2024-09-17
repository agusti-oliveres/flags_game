import os
import requests
import pycountry

# Directory to store flags
flags_dir = 'static/flags'
if not os.path.exists(flags_dir):
    os.makedirs(flags_dir)

# Base URL for flag CDN
flag_base_url = "https://flagcdn.com/w320"

# Get all countries
countries = [{"name": country.name, "code": country.alpha_2.lower()} for country in pycountry.countries]

# Function to download a flag
def download_flag(country):
    code = country['code']
    flag_url = f"{flag_base_url}/{code}.png"
    response = requests.get(flag_url)
    
    if response.status_code == 200:
        file_path = os.path.join(flags_dir, f"{code}.png")
        with open(file_path, 'wb') as f:
            f.write(response.content)
        print(f"Downloaded flag for {country['name']} ({code})")
    else:
        print(f"Failed to download flag for {country['name']} ({code})")

# Download flags for all countries
for country in countries:
    download_flag(country)

print("All flags downloaded!")
