def extract_live_features(weather_data, pollution_data):

    pollution = pollution_data["list"][0]
    weather_condition = "unknown"
    if weather_data.get("weather"):
        weather_condition = weather_data["weather"][0].get("description", "unknown")

    features = {
        "temperature": weather_data["main"]["temp"],
        "humidity": weather_data["main"]["humidity"],
        "pressure": weather_data["main"]["pressure"],

        "wind_speed": weather_data["wind"]["speed"],
        "wind_direction": weather_data["wind"]["deg"],

        "aqi": pollution["main"]["aqi"],

        "pm2_5": pollution["components"]["pm2_5"],
        "pm10": pollution["components"]["pm10"],

        "co": pollution["components"]["co"],
        "no2": pollution["components"]["no2"],
        "o3": pollution["components"]["o3"],
        "so2": pollution["components"]["so2"],
        "weather_condition": weather_condition
    }

    return features
