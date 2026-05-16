import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import mlflow
import mlflow.sklearn

print("\nLoading processed dataset...\n")

# Load dataset
df = pd.read_csv("data/processed/processed_aqi.csv")

print("Dataset Loaded Successfully!")

# -----------------------------
# FEATURES + TARGET
# -----------------------------
X = df.drop(columns=["aqi_value"])
y = df["aqi_value"]

# -----------------------------
# TRAIN TEST SPLIT
# -----------------------------
print("\nSplitting dataset...\n")

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# -----------------------------
# SET MLFLOW EXPERIMENT
# -----------------------------
mlflow.set_experiment("BreatheSafeAQI")

# -----------------------------
# START MLFLOW RUN
# -----------------------------
with mlflow.start_run():

    print("\nTraining Random Forest Model...\n")

    # Model Parameters
    n_estimators = 100

    model = RandomForestRegressor(
        n_estimators=n_estimators,
        random_state=42
    )

    # -----------------------------
    # TRAIN MODEL
    # -----------------------------
    model.fit(X_train, y_train)

    # -----------------------------
    # PREDICTIONS
    # -----------------------------
    print("\nGenerating predictions...\n")

    predictions = model.predict(X_test)

    # -----------------------------
    # EVALUATION
    # -----------------------------
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)

    print("\nMODEL PERFORMANCE")
    print(f"Mean Absolute Error: {mae:.2f}")
    print(f"R2 Score: {r2:.4f}")

    # -----------------------------
    # LOG PARAMETERS
    # -----------------------------
    mlflow.log_param(
        "n_estimators",
        n_estimators
    )

    # -----------------------------
    # LOG METRICS
    # -----------------------------
    mlflow.log_metric("mae", mae)
    mlflow.log_metric("r2_score", r2)

    # -----------------------------
    # LOG MODEL
    # -----------------------------
    mlflow.sklearn.log_model(
        sk_model=model,
        name="aqi_model"
    )

    # -----------------------------
    # SAVE LOCAL MODEL
    # -----------------------------
    model_path = "models/aqi_model.pkl"

    joblib.dump(model, model_path)

    print(f"\nModel saved successfully at: {model_path}")

print("\nMLflow experiment tracking completed!")