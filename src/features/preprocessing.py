import pandas as pd
from sklearn.preprocessing import LabelEncoder

print("\nLoading raw AQI dataset...\n")

# Load dataset
df = pd.read_csv("data/raw/india_aqi.csv")

print("Dataset Loaded Successfully!")

# -----------------------------
# DROP UNUSED COLUMNS
# -----------------------------
print("\nDropping unnecessary columns...\n")

df.drop(columns=["note", "unit"], inplace=True)

# -----------------------------
# HANDLE MISSING VALUES
# -----------------------------
print("\nHandling missing values...\n")

df.dropna(inplace=True)

# -----------------------------
# CONVERT DATE COLUMN
# -----------------------------
print("\nConverting date column...\n")

df["date"] = pd.to_datetime(
    df["date"],
    format="mixed",
    dayfirst=True
)

# Extract useful time features
df["year"] = df["date"].dt.year
df["month"] = df["date"].dt.month
df["day"] = df["date"].dt.day

# -----------------------------
# ENCODE CATEGORICAL FEATURES
# -----------------------------
print("\nEncoding categorical columns...\n")

encoder = LabelEncoder()

categorical_columns = [
    "state",
    "area",
    "prominent_pollutants",
    "air_quality_status"
]

for col in categorical_columns:
    df[col] = encoder.fit_transform(df[col])

# -----------------------------
# DROP ORIGINAL DATE COLUMN
# -----------------------------
df.drop(columns=["date"], inplace=True)

# -----------------------------
# SAVE PROCESSED DATA
# -----------------------------
processed_path = "data/processed/processed_aqi.csv"

df.to_csv(processed_path, index=False)

print("\nProcessed dataset saved successfully!")
print(f"\nSaved to: {processed_path}")

print("\nProcessed Dataset Preview:")
print(df.head())