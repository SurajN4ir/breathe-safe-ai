import pandas as pd

from src.mlops.openlineage import emit_event, new_run_id


def run_ingestion():
    run_id = new_run_id()
    input_dataset = "data/raw/india_aqi.csv"

    emit_event(
        job_name="data_ingestion",
        event_type="START",
        run_id=run_id,
        outputs=[input_dataset],
    )

    try:
        df = pd.read_csv(input_dataset)

        print("\nDataset Loaded Successfully!")
        print("\nFirst 5 Rows:")
        print(df.head())

        print("\nDataset Shape:")
        print(df.shape)

        print("\nColumns:")
        print(df.columns)

        print("\nMissing Values:")
        print(df.isnull().sum())

        emit_event(
            job_name="data_ingestion",
            event_type="COMPLETE",
            run_id=run_id,
            outputs=[input_dataset],
        )
    except Exception:
        emit_event(
            job_name="data_ingestion",
            event_type="FAIL",
            run_id=run_id,
            outputs=[input_dataset],
        )
        raise


if __name__ == "__main__":
    run_ingestion()
