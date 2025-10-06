"""Payment provider integration shim.

Implements a minimal gateway interface and a mock sandbox provider.
Real card data should never hit the backend; expect tokenized payloads.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Dict, Any
import os
import uuid


@dataclass
class ChargeResult:
    ok: bool
    reference: str
    raw: Dict[str, Any]
    error: Optional[str] = None


class PaymentGateway:
    def charge(self, *, order_id: str, amount: float, token: str, method: str = "card") -> ChargeResult:
        raise NotImplementedError


class MockGateway(PaymentGateway):
    def __init__(self, *, sandbox: bool = True):
        self.sandbox = sandbox

    def charge(self, *, order_id: str, amount: float, token: str, method: str = "card") -> ChargeResult:
        # Accept any non-empty token and return a synthetic reference
        if not token:
            return ChargeResult(ok=False, reference="", raw={}, error="missing token")
        ref = f"mock_{uuid.uuid4().hex[:12]}"
        return ChargeResult(ok=True, reference=ref, raw={"provider": "mock", "sandbox": self.sandbox, "amount": amount, "method": method})


def get_gateway() -> PaymentGateway:
    provider = (os.getenv("PAYMENT_GATEWAY", "mock").strip().lower() or "mock")
    sandbox = (os.getenv("PAYMENT_GATEWAY_MODE", "sandbox").strip().lower() != "live")
    if provider == "mock":
        return MockGateway(sandbox=sandbox)
    # Fallback to mock if unknown (non-overengineered default)
    return MockGateway(sandbox=True)


__all__ = ["PaymentGateway", "MockGateway", "get_gateway", "ChargeResult"]

