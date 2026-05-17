from datetime import timedelta

from feast import Entity, FeatureView, Field, FileSource
from feast.types import Float32, Int64


city = Entity(name="city", join_keys=["city_id"])

aqi_source = FileSource(
    name="aqi_features_source",
    path="data/processed/processed_aqi.csv",
    timestamp_field="event_timestamp",
)

aqi_feature_view = FeatureView(
    name="aqi_environmental_features",
    entities=[city],
    ttl=timedelta(days=7),
    schema=[
        Field(name="pm2_5", dtype=Float32),
        Field(name="pm10", dtype=Float32),
        Field(name="humidity", dtype=Float32),
        Field(name="wind_speed", dtype=Float32),
        Field(name="aqi_value", dtype=Int64),
    ],
    source=aqi_source,
)
