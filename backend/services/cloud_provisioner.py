"""AWS/Azure cloud provisioning for new projects."""

import logging
import uuid

from database.platform_repository import get_project_config, save_provisioning_job
from integrations.credentials_resolver import get_service_credentials
from models.agent_run import utc_now

logger = logging.getLogger(__name__)


def provision_new_project(cloud: str = "aws") -> dict:
    """Provision network + data lake resources for a new project."""
    config = get_project_config()
    job_id = str(uuid.uuid4())[:8]
    now = utc_now()

    if cloud == "aws":
        resources = _provision_aws(config)
    else:
        resources = _provision_azure_plan(config)

    job = {
        "id": job_id,
        "status": "completed" if resources.get("success") else "failed",
        "cloud": cloud,
        "resources": resources,
        "createdAt": now,
        "completedAt": utc_now(),
    }
    save_provisioning_job(job)
    return job


def _provision_aws(config: dict) -> dict:
    creds = get_service_credentials("aws")
    client_name = (config.get("clientName") or "client").lower().replace(" ", "-")
    region = creds.get("region", "eu-west-2")
    prefix = f"{client_name}-datalake"

    plan = {
        "success": True,
        "mode": "simulated",
        "region": region,
        "vpcs": [
            {"name": "dev", "cidr": "10.0.0.0/16", "subnets": ["10.0.1.0/24", "10.0.2.0/24"]},
            {"name": "uat", "cidr": "10.1.0.0/16", "subnets": ["10.1.1.0/24", "10.1.2.0/24"]},
            {"name": "prod", "cidr": "10.2.0.0/16", "subnets": ["10.2.1.0/24", "10.2.2.0/24"]},
        ],
        "buckets": [
            f"{prefix}-bronze-{region}",
            f"{prefix}-silver-{region}",
            f"{prefix}-gold-{region}",
            f"{prefix}-metadata-{region}",
        ],
        "folders": ["raw/", "staging/", "curated/", "metadata/schemas/", "metadata/lineage/"],
        "glueCatalog": f"{prefix}_catalog",
    }

    if not creds.get("accessKeyId") or not creds.get("secretAccessKey"):
        plan["note"] = "AWS credentials not configured — returning architecture plan only."
        return plan

    try:
        import boto3

        session = boto3.Session(
            aws_access_key_id=creds["accessKeyId"],
            aws_secret_access_key=creds["secretAccessKey"],
            region_name=region,
        )
        s3 = session.client("s3")
        created = []
        for bucket in plan["buckets"]:
            try:
                if region == "us-east-1":
                    s3.create_bucket(Bucket=bucket)
                else:
                    s3.create_bucket(
                        Bucket=bucket,
                        CreateBucketConfiguration={"LocationConstraint": region},
                    )
                for folder in plan["folders"]:
                    s3.put_object(Bucket=bucket, Key=folder)
                created.append(bucket)
            except Exception as exc:
                logger.warning("Bucket %s may already exist or failed: %s", bucket, exc)
        plan["mode"] = "live"
        plan["createdBuckets"] = created
        plan["note"] = "VPC provisioning requires Terraform/CloudFormation — buckets created where possible."
    except ImportError:
        plan["note"] = "boto3 not installed — returning architecture plan only."
    except Exception as exc:
        plan["success"] = False
        plan["error"] = str(exc)

    return plan


def _provision_azure_plan(config: dict) -> dict:
    client_name = (config.get("clientName") or "client").lower().replace(" ", "-")
    return {
        "success": True,
        "mode": "planned",
        "resourceGroup": f"rg-{client_name}-data",
        "vnet": f"vnet-{client_name}",
        "storageAccounts": [f"st{client_name}bronze", f"st{client_name}silver", f"st{client_name}gold"],
        "note": "Azure provisioning planned — connect Azure credentials in a future release.",
    }
