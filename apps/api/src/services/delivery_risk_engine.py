"""
Delivery Risk & SLA Intelligence Engine for NE-ROUTE.
Evaluates delivery vulnerability, deadline violations, and corridor hazards.
"""

from datetime import datetime, timezone
from typing import Dict, Any, Tuple
from src.models import Delivery, Vehicle, Road

class DeliveryRiskEngine:
    @staticmethod
    def evaluate_delivery(
        delivery: Delivery,
        current_eta: datetime,
        corridor_status: str = "ACCESSIBLE",
        corridor_risk_score: float = 0.2
    ) -> Tuple[str, str, str]:
        """
        Returns: (risk_level, status, rationale)
        """
        now = datetime.now(timezone.utc)
        expected = delivery.expected_delivery.replace(tzinfo=timezone.utc) if delivery.expected_delivery.tzinfo is None else delivery.expected_delivery
        current_eta_utc = current_eta.replace(tzinfo=timezone.utc) if current_eta.tzinfo is None else current_eta

        is_overdue = current_eta_utc > expected
        delay_min = int((current_eta_utc - expected).total_seconds() / 60.0)

        risk_level = "LOW"
        new_status = delivery.status
        rationale = "Delivery proceeding within scheduled timeline."

        if corridor_status == "BLOCKED":
            risk_level = "SEVERE"
            new_status = "AT_RISK"
            rationale = f"Primary destination corridor is completely BLOCKED. Consignment stranded until clearance or rerouting."
        elif is_overdue and delay_min > 120 and delivery.priority in ("CRITICAL", "HIGH"):
            risk_level = "SEVERE" if delivery.priority == "CRITICAL" else "HIGH"
            new_status = "AT_RISK"
            rationale = f"Severe delay of +{delay_min} mins on {delivery.priority} consignment ({delivery.cargo_category}). SLA breach imminent."
        elif is_overdue:
            risk_level = "HIGH" if delivery.priority == "CRITICAL" else "MEDIUM"
            new_status = "DELAYED"
            rationale = f"Delayed by {delay_min} mins past planned schedule due to corridor slowdowns."
        elif corridor_status == "RESTRICTED" or corridor_risk_score > 0.6:
            risk_level = "HIGH" if delivery.priority == "CRITICAL" else "MEDIUM"
            if new_status == "IN_TRANSIT":
                rationale = "Corridor under weather/landslide restriction. Reduced convoy crawl enforced."

        return risk_level, new_status, rationale
