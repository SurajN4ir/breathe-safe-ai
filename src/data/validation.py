import pandas as pd
import great_expectations as gx

print("\nLoading AQI dataset...\n")

# Load dataset
df = pd.read_csv("data/raw/india_aqi.csv")

print("Dataset Loaded Successfully!")

# Create context
context = gx.get_context()

# Load existing datasource
datasource = context.get_datasource("aqi_datasource")

# Load existing asset
data_asset = datasource.get_asset("aqi_asset")

# Build batch request
batch_request = data_asset.build_batch_request(
    dataframe=df
)

# Create expectation suite
context.add_or_update_expectation_suite(
    expectation_suite_name="aqi_suite"
)

# Create validator
validator = context.get_validator(
    batch_request=batch_request,
    expectation_suite_name="aqi_suite"
)

# -----------------------------
# EXPECTATION 1
# AQI RANGE CHECK
# -----------------------------
validator.expect_column_values_to_be_between(
    "aqi_value",
    min_value=0,
    max_value=1000
)

# -----------------------------
# EXPECTATION 2
# NO NULL AQI VALUES
# -----------------------------
validator.expect_column_values_to_not_be_null(
    "aqi_value"
)

# -----------------------------
# EXPECTATION 3
# VALID CATEGORY CHECK
# -----------------------------
validator.expect_column_values_to_be_in_set(
    "air_quality_status",
    [
        "Good",
        "Satisfactory",
        "Moderate",
        "Poor",
        "Very Poor",
        "Severe"
    ]
)

# Save expectation suite
validator.save_expectation_suite()

print("\nGreat Expectations Validation Completed!")
print("\nExpectation Suite Saved Successfully!")