import joblib
import mlflow
import mlflow.sklearn
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

from src.mlops.openlineage import emit_event, new_run_id


def run_training():
    run_id = new_run_id()
    input_dataset = "data/processed/processed_aqi.csv"
    output_model = "models/aqi_model.pkl"

    emit_event(
        job_name="model_training",
        event_type="START",
        run_id=run_id,
        inputs=[input_dataset],
        outputs=[output_model],
    )

    try:
        print("\nLoading processed dataset...\n")
        df = pd.read_csv(input_dataset)
        print("Dataset Loaded Successfully!")

        X = df.drop(columns=["aqi_value"])
        y = df["aqi_value"]

        print("\nSplitting dataset...\n")
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.2,
            random_state=42,
        )

        mlflow.set_experiment("BreatheSafeAQI")

        with mlflow.start_run():
            print("\nTraining Random Forest Model...\n")

            n_estimators = 100
            model = RandomForestRegressor(n_estimators=n_estimators, random_state=42)
            model.fit(X_train, y_train)

            print("\nGenerating predictions...\n")
            predictions = model.predict(X_test)

            mae = mean_absolute_error(y_test, predictions)
            r2 = r2_score(y_test, predictions)

            print("\nMODEL PERFORMANCE")
            print(f"Mean Absolute Error: {mae:.2f}")
            print(f"R2 Score: {r2:.4f}")

            mlflow.log_param("n_estimators", n_estimators)
            mlflow.log_metric("mae", mae)
            mlflow.log_metric("r2_score", r2)

            mlflow.sklearn.log_model(sk_model=model, name="aqi_model")
            joblib.dump(model, output_model)

            print(f"\nModel saved successfully at: {output_model}")

            emit_event(
                job_name="model_training",
                event_type="COMPLETE",
                run_id=run_id,
                inputs=[input_dataset],
                outputs=[output_model],
                facets={
                    "model_metrics": {
                        "_producer": "https://github.com/breathe-safe-ai/platform",
                        "_schemaURL": "https://openlineage.io/spec/facets/1-0-0/RunFacet.json",
                        "mae": float(mae),
                        "r2_score": float(r2),
                    }
                },
            )

        print("\nMLflow experiment tracking completed!")
    except Exception:
        emit_event(
            job_name="model_training",
            event_type="FAIL",
            run_id=run_id,
            inputs=[input_dataset],
            outputs=[output_model],
        )
        raise


if __name__ == "__main__":
    run_training()
