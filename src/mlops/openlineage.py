import json
import os
import socket
from datetime import datetime, timezone
from typing import Iterable, Optional
from urllib import request, error
from uuid import uuid4


OPENLINEAGE_URL = os.getenv("OPENLINEAGE_URL", "http://localhost:5001/api/v1/lineage")
OPENLINEAGE_NAMESPACE = os.getenv("OPENLINEAGE_NAMESPACE", "breathe-safe-ai")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def emit_event(
    *,
    job_name: str,
    event_type: str,
    run_id: str,
    inputs: Optional[Iterable[str]] = None,
    outputs: Optional[Iterable[str]] = None,
    facets: Optional[dict] = None,
) -> None:
    """Best-effort OpenLineage event emitter. Never raises in pipeline jobs."""
    payload = {
        "eventType": event_type,
        "eventTime": _now_iso(),
        "run": {"runId": run_id},
        "job": {"namespace": OPENLINEAGE_NAMESPACE, "name": job_name},
        "producer": "https://github.com/breathe-safe-ai/platform",
        "inputs": [{"namespace": OPENLINEAGE_NAMESPACE, "name": name} for name in (inputs or [])],
        "outputs": [{"namespace": OPENLINEAGE_NAMESPACE, "name": name} for name in (outputs or [])],
        "facets": {
            "processing_engine": {
                "_producer": "https://github.com/breathe-safe-ai/platform",
                "_schemaURL": "https://openlineage.io/spec/facets/1-0-0/ProcessingEngineRunFacet.json",
                "name": "python",
                "version": "3.x",
                "openlineageAdapterVersion": "custom-1.0.0",
            },
            "environment-properties": {
                "_producer": "https://github.com/breathe-safe-ai/platform",
                "_schemaURL": "https://openlineage.io/spec/facets/1-0-0/RunFacet.json",
                "host": socket.gethostname(),
            },
        },
    }

    if facets:
        payload["facets"].update(facets)

    body = json.dumps(payload).encode("utf-8")
    req = request.Request(
        OPENLINEAGE_URL,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=5):
            pass
    except (error.URLError, TimeoutError, OSError):
        # Lineage should never break core pipeline execution in this project phase.
        pass


def new_run_id() -> str:
    return str(uuid4())
