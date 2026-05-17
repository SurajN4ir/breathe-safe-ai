import sys

import great_expectations as gx
import pandas as pd

from src.mlops.openlineage import emit_event, new_run_id


def run_validation() -> bool:
    run_id = new_run_id()
    input_dataset = "data/raw/india_aqi.csv"

    emit_event(
        job_name="data_validation",
        event_type="START",
        run_id=run_id,
        inputs=[input_dataset],
        outputs=["gx/expectations/aqi_suite.json"],
    )

    try:
        print("\nLoading AQI dataset...\n")
        df = pd.read_csv(input_dataset)
        print("Dataset Loaded Successfully!")

        context = gx.get_context()
        datasource = context.get_datasource("aqi_datasource")
        data_asset = datasource.get_asset("aqi_asset")

        batch_request = data_asset.build_batch_request(dataframe=df)
        context.add_or_update_expectation_suite(expectation_suite_name="aqi_suite")

        validator = context.get_validator(
            batch_request=batch_request,
            expectation_suite_name="aqi_suite",
        )

        validator.expect_column_values_to_be_between("aqi_value", min_value=0, max_value=1000)
        validator.expect_column_values_to_not_be_null("aqi_value")
        validator.expect_column_values_to_be_in_set(
            "air_quality_status",
            ["Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"],
        )

        results = validator.validate()
        validator.save_expectation_suite()

        print("\nGreat Expectations Validation Completed!")
        print(f"Validation success: {results.success}")

        emit_event(
            job_name="data_validation",
            event_type="COMPLETE" if results.success else "FAIL",
            run_id=run_id,
            inputs=[input_dataset],
            outputs=["gx/expectations/aqi_suite.json"],
            facets={
                "validation": {
                    "_producer": "https://github.com/breathe-safe-ai/platform",
                    "_schemaURL": "https://openlineage.io/spec/facets/1-0-0/RunFacet.json",
                    "success": bool(results.success),
                }
            },
        )

        return bool(results.success)
    except Exception:
        emit_event(
            job_name="data_validation",
            event_type="FAIL",
            run_id=run_id,
            inputs=[input_dataset],
            outputs=["gx/expectations/aqi_suite.json"],
        )
        raise


if __name__ == "__main__":
    ok = run_validation()
    sys.exit(0 if ok else 1)
