import pandas as pd
# Load dataset
df = pd.read_csv("data/raw/india_aqi.csv")

# Displays the  basic information
print("\nDataset Loaded Successfully!")
print("\nFirst 5 Rows:")
print(df.head())

print("\nDataset Shape:")
print(df.shape)

print("\nColumns:")
print(df.columns)

print("\nMissing Values:")
print(df.isnull().sum())