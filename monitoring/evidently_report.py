"""Generate an Evidently drift report for AQI model monitoring."""

import pandas as pd
from evidently.report import Report
from evidently.metric_preset import DataDriftPreset


def build_report(reference_path: str, current_path: str, output_path: str = "monitoring/evidently_report.html") -> None:
    reference = pd.read_csv(reference_path)
    current = pd.read_csv(current_path)

    report = Report(metrics=[DataDriftPreset()])
    report.run(reference_data=reference, current_data=current)
    report.save_html(output_path)


if __name__ == "__main__":
    build_report(
        "data/processed/processed_aqi.csv",
        "data/processed/processed_aqi.csv",
    )
