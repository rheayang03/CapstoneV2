from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Iterable, List, Optional, Sequence, Tuple, Dict

from django.db import transaction
from django.db.models import Sum, Q, F
from django.utils import timezone as dj_tz

from .models import (
    InventoryItem,
    StockMovement,
    Batch,
    Location,
    ReorderSetting,
    AppUser,
)
from .utils_dbtime import db_now


DEC0 = Decimal("0")
Q2 = Decimal("0.01")


def get_db_now() -> datetime:
    return db_now()


def _as_decimal(val) -> Decimal:
    try:
        if isinstance(val, Decimal):
            return val
        return Decimal(str(val))
    except Exception:
        return DEC0


def _q2(val) -> Decimal:
    try:
        return _as_decimal(val).quantize(Q2, rounding=ROUND_HALF_UP)
    except Exception:
        return DEC0


def _maybe_notify_low_stock(item_ids: Sequence[str]):
    """If any items are below configured low_stock_threshold, notify managers/admins.

    Best-effort: failures are ignored. Uses Notification records; push is handled by utils_notify.
    """
    try:
        ids = list(item_ids or [])
        if not ids:
            return
        # Load thresholds
        settings = {str(r.item_id): r.low_stock_threshold for r in ReorderSetting.objects.filter(item_id__in=ids)}
        if not settings:
            return
        totals = get_current_stock(list(settings.keys()))
        low = [iid for iid, thr in settings.items() if _as_decimal(totals.get(iid, DEC0)) <= _as_decimal(thr)]
        if not low:
            return
        from .models import InventoryItem, AppUser, Notification
        items = {str(x.id): x for x in InventoryItem.objects.filter(id__in=low)}
        managers = list(AppUser.objects.filter(role__in=["manager", "admin"]))
        for iid in low:
            it = items.get(iid)
            if not it:
                continue
            title = f"Low stock: {it.name}"
            msg = f"Item '{it.name}' is at or below threshold. Current: {float(totals.get(iid, DEC0) or 0)}"
            for u in managers:
                try:
                    n = Notification.objects.create(user=u, title=title, message=msg, type="warning")
                except Exception:
                    continue
    except Exception:
        # best-effort
        return


def get_current_stock(
    item_ids: Optional[Sequence[str]] = None,
    location_id: Optional[str] = None,
    as_of: Optional[datetime] = None,
) -> Dict[str, Decimal]:
    """Return current stock per item as a dict {item_id: qty}.

    - Sums StockMovement.qty filtered by item/location/effective_at<=as_of.
    - If location_id is None, sums across all locations.
    """
    qs = StockMovement.objects.all()
    if item_ids:
        qs = qs.filter(item_id__in=list(item_ids))
    if location_id:
        qs = qs.filter(location_id=location_id)
    if as_of:
        qs = qs.filter(effective_at__lte=as_of)
    agg = qs.values("item_id").annotate(total=Sum("qty"))
    out: Dict[str, Decimal] = {}
    for row in agg:
        out[str(row["item_id"])] = _as_decimal(row["total"]) or DEC0
    return out


def get_batch_stock_by_location(
    item_id: str,
    location_id: Optional[str] = None,
    as_of: Optional[datetime] = None,
) -> Dict[str, Decimal]:
    """Return stock per batch for an item, optionally filtered by location.

    Returns {batch_id: qty} considering movements until as_of.
    """
    qs = StockMovement.objects.filter(item_id=item_id)
    if location_id:
        qs = qs.filter(location_id=location_id)
    if as_of:
        qs = qs.filter(effective_at__lte=as_of)
    agg = qs.values("batch_id").annotate(total=Sum("qty"))
    res: Dict[str, Decimal] = {}
    for row in agg:
        bid = row["batch_id"]
        if bid is None:
            # Unbatched stock not tracked per batch
            continue
        res[str(bid)] = _as_decimal(row["total"]) or DEC0
    return res


def get_expiring_batches(
    days: int,
    item_ids: Optional[Sequence[str]] = None,
    location_id: Optional[str] = None,
) -> List[Batch]:
    now = get_db_now().date()
    limit = now + timedelta(days=int(days or 0))
    qs = Batch.objects.filter(expiry_date__isnull=False, expiry_date__lte=limit)
    if item_ids:
        qs = qs.filter(item_id__in=list(item_ids))
    # If location provided, keep batches that still have stock at location
    if location_id:
        batch_ids_with_stock = (
            StockMovement.objects.filter(location_id=location_id)
            .values("batch_id")
            .annotate(total=Sum("qty"))
            .filter(total__gt=0)
            .values_list("batch_id", flat=True)
        )
        qs = qs.filter(id__in=batch_ids_with_stock)
    return list(qs.order_by("expiry_date", "created_at")[:500])


def get_stock_ledger(
    item_id: str,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    location_id: Optional[str] = None,
    include_batches: bool = True,
) -> List[StockMovement]:
    qs = StockMovement.objects.filter(item_id=item_id)
    if date_from:
        qs = qs.filter(effective_at__gte=date_from)
    if date_to:
        qs = qs.filter(effective_at__lte=date_to)
    if location_id:
        qs = qs.filter(location_id=location_id)
    # For performance limit; callers should paginate
    qs = qs.order_by("effective_at", "recorded_at", "id")
    return list(qs[:1000])


def get_low_stock(item_ids: Optional[Sequence[str]] = None) -> List[Tuple[InventoryItem, Decimal]]:
    settings_qs = ReorderSetting.objects.select_related("item", "location").all()
    if item_ids:
        settings_qs = settings_qs.filter(item_id__in=list(item_ids))
    # Aggregate current stock per (item, location)
    pairs = list(settings_qs.values_list("item_id", "location_id", "reorder_point"))
    by_item_loc: Dict[Tuple[str, str], Decimal] = {}
    for item_id, location_id, _ in pairs:
        stock_map = get_current_stock([item_id], location_id)
        by_item_loc[(str(item_id), str(location_id))] = stock_map.get(str(item_id), DEC0)
    low = []
    for rs in settings_qs:
        qty = by_item_loc.get((str(rs.item_id), str(rs.location_id)), DEC0)
        if qty <= _as_decimal(rs.reorder_point):
            low.append((rs.item, qty))
    return low


def get_last_stock_update(item_id: str, location_id: Optional[str] = None) -> Optional[Tuple[datetime, datetime]]:
    qs = StockMovement.objects.filter(item_id=item_id)
    if location_id:
        qs = qs.filter(location_id=location_id)
    mv = qs.order_by("-recorded_at").first()
    if not mv:
        return None
    return mv.effective_at, mv.recorded_at


@transaction.atomic
def record_receipt(
    *,
    item: InventoryItem,
    qty: Decimal,
    location: Location,
    actor: Optional[AppUser] = None,
    batch: Optional[Batch] = None,
    batch_payload: Optional[dict] = None,
    reference_type: str = "goods_receipt",
    reference_id: str = "",
    effective_at: Optional[datetime] = None,
    idempotency_key: Optional[str] = None,
) -> StockMovement:
    if qty is None:
        raise ValueError("qty is required")
    qty = _as_decimal(qty)
    if qty <= DEC0:
        raise ValueError("qty must be positive for receipt")
    # Create batch if provided as payload
    if not batch and batch_payload:
        batch = Batch.objects.create(
            item=item,
            lot_code=(batch_payload.get("lot_code") or ""),
            expiry_date=batch_payload.get("expiry_date"),
            received_at=batch_payload.get("received_at") or get_db_now(),
            supplier=(batch_payload.get("supplier") or ""),
            unit_cost=batch_payload.get("unit_cost"),
        )
    now = get_db_now()
    mv = StockMovement.objects.create(
        item=item,
        location=location,
        batch=batch,
        movement_type=StockMovement.TYPE_RECEIPT,
        qty=qty,
        effective_at=effective_at or now,
        recorded_at=now,
        actor=actor,
        reference_type=reference_type,
        reference_id=reference_id,
        reason="",
        idempotency_key=idempotency_key,
    )
    # Update cached item quantity and last_restocked
    try:
        total_map = get_current_stock([str(item.id)], location_id=None, as_of=None)
        total = _q2(total_map.get(str(item.id), DEC0))
        InventoryItem.objects.filter(id=item.id).update(quantity=total, last_restocked=now)
    except Exception:
        pass
    return mv


def _fefo_batches_with_available(item_id: str, location_id: str) -> List[Tuple[Batch, Decimal]]:
    # Compute available per batch at location
    per_batch = get_batch_stock_by_location(item_id=item_id, location_id=location_id)
    if not per_batch:
        return []
    batches = Batch.objects.filter(id__in=list(per_batch.keys())).all()
    # Sort FEFO: expiry asc, then received_at asc, then id asc
    annotated = []
    for b in batches:
        annotated.append((b, per_batch.get(str(b.id), DEC0)))
    annotated.sort(key=lambda t: (
        t[0].expiry_date or datetime.max.date(),
        t[0].received_at or datetime.max.replace(tzinfo=dj_tz.utc),
        str(t[0].id),
    ))
    return annotated


@transaction.atomic
def consume_for_order(
    *,
    order_id: str,
    components: Sequence[Tuple[InventoryItem, Decimal]],
    location: Location,
    actor: Optional[AppUser] = None,
    effective_at: Optional[datetime] = None,
    fefo: bool = True,
    idempotency_key: Optional[str] = None,
) -> List[StockMovement]:
    now = get_db_now()
    effective = effective_at or now
    movements: List[StockMovement] = []
    affected_ids = set()
    for item, req_qty in components:
        # Prevent over-consumption: ensure sufficient stock at location
        avail_total = get_current_stock([str(item.id)], location_id=str(location.id)).get(str(item.id), DEC0)
        remaining = _as_decimal(req_qty)
        if remaining <= DEC0:
            continue
        if remaining > avail_total:
            raise ValueError(f"Insufficient stock for item {item.name}: need {remaining}, have {avail_total}")
        if fefo:
            for batch, avail in _fefo_batches_with_available(str(item.id), str(location.id)):
                if remaining <= DEC0:
                    break
                take = min(remaining, avail)
                if take <= DEC0:
                    continue
                mv = StockMovement.objects.create(
                    item=item,
                    location=location,
                    batch=batch,
                    movement_type=StockMovement.TYPE_SALE,
                    qty=-take,
                    effective_at=effective,
                    recorded_at=now,
                    actor=actor,
                    reference_type="order",
                    reference_id=str(order_id),
                    reason="Consumption for order",
                )
                movements.append(mv)
                remaining -= take
        # If still remaining (due to no batches), do not over-consume
        if remaining > DEC0:
            # At this point, since avail_total was enough, this path should be rare (unbatched stock)
            mv = StockMovement.objects.create(
                item=item,
                location=location,
                batch=None,
                movement_type=StockMovement.TYPE_SALE,
                qty=-remaining,
                effective_at=effective,
                recorded_at=now,
                actor=actor,
                reference_type="order",
                reference_id=str(order_id),
                reason="Consumption for order (unbatched)",
            )
            movements.append(mv)
        affected_ids.add(str(item.id))
    # Update cached quantities for affected items
    try:
        if affected_ids:
            smap = get_current_stock(list(affected_ids), location_id=None, as_of=None)
            for iid in affected_ids:
                total = _q2(smap.get(iid, DEC0))
                InventoryItem.objects.filter(id=iid).update(quantity=total)
            # Notify managers if any cross the low stock threshold
            _maybe_notify_low_stock(list(affected_ids))
    except Exception:
        pass
    return movements


@transaction.atomic
def adjust_stock(
    *,
    item: InventoryItem,
    delta_qty: Decimal,
    location: Location,
    reason: str = "",
    actor: Optional[AppUser] = None,
    effective_at: Optional[datetime] = None,
    idempotency_key: Optional[str] = None,
) -> StockMovement:
    delta = _as_decimal(delta_qty)
    if delta == DEC0:
        raise ValueError("delta_qty cannot be zero")
    # Prevent negative stock if adjustment would make it negative
    current = get_current_stock([str(item.id)], str(location.id)).get(str(item.id), DEC0)
    if current + delta < DEC0:
        raise ValueError("Adjustment would result in negative stock")
    now = get_db_now()
    mv = StockMovement.objects.create(
        item=item,
        location=location,
        batch=None,
        movement_type=StockMovement.TYPE_ADJUSTMENT,
        qty=delta,
        effective_at=effective_at or now,
        recorded_at=now,
        actor=actor,
        reference_type="adjustment",
        reference_id="",
        reason=reason or "Manual adjustment",
        idempotency_key=idempotency_key,
    )
    # Update cached item quantity (do not touch last_restocked for adjustments)
    try:
        total_map = get_current_stock([str(item.id)], location_id=None, as_of=None)
        total = _q2(total_map.get(str(item.id), DEC0))
        InventoryItem.objects.filter(id=item.id).update(quantity=total)
        _maybe_notify_low_stock([str(item.id)])
    except Exception:
        pass
    return mv


@transaction.atomic
def transfer_stock(
    *,
    item: InventoryItem,
    qty: Decimal,
    from_location: Location,
    to_location: Location,
    actor: Optional[AppUser] = None,
    effective_at: Optional[datetime] = None,
    fefo: bool = True,
    idempotency_key: Optional[str] = None,
) -> List[StockMovement]:
    amount = _as_decimal(qty)
    if amount <= DEC0:
        raise ValueError("qty must be positive to transfer")
    # Prevent over-transfer
    avail_total = get_current_stock([str(item.id)], location_id=str(from_location.id)).get(str(item.id), DEC0)
    if amount > avail_total:
        raise ValueError(f"Insufficient stock to transfer: need {amount}, have {avail_total}")
    now = get_db_now()
    effective = effective_at or now
    movements: List[StockMovement] = []
    remaining = amount
    # Transfer by batches using FEFO from source
    for batch, avail in _fefo_batches_with_available(str(item.id), str(from_location.id)):
        if remaining <= DEC0:
            break
        take = min(remaining, avail)
        if take <= DEC0:
            continue
        # Out from source
        mv_out = StockMovement.objects.create(
            item=item,
            location=from_location,
            batch=batch,
            movement_type=StockMovement.TYPE_TRANSFER_OUT,
            qty=-take,
            effective_at=effective,
            recorded_at=now,
            actor=actor,
            reference_type="transfer",
            reference_id=f"{from_location.id}->{to_location.id}",
            reason="Transfer out",
        )
        # In to destination
        mv_in = StockMovement.objects.create(
            item=item,
            location=to_location,
            batch=batch,
            movement_type=StockMovement.TYPE_TRANSFER_IN,
            qty=take,
            effective_at=effective,
            recorded_at=now,
            actor=actor,
            reference_type="transfer",
            reference_id=f"{from_location.id}->{to_location.id}",
            reason="Transfer in",
        )
        movements.extend([mv_out, mv_in])
        remaining -= take
    # If still remaining, transfer unbatched
    if remaining > DEC0:
        mv_out = StockMovement.objects.create(
            item=item,
            location=from_location,
            batch=None,
            movement_type=StockMovement.TYPE_TRANSFER_OUT,
            qty=-remaining,
            effective_at=effective,
            recorded_at=now,
            actor=actor,
            reference_type="transfer",
            reference_id=f"{from_location.id}->{to_location.id}",
            reason="Transfer out (unbatched)",
        )
        mv_in = StockMovement.objects.create(
            item=item,
            location=to_location,
            batch=None,
            movement_type=StockMovement.TYPE_TRANSFER_IN,
            qty=remaining,
            effective_at=effective,
            recorded_at=now,
            actor=actor,
            reference_type="transfer",
            reference_id=f"{from_location.id}->{to_location.id}",
            reason="Transfer in (unbatched)",
        )
        movements.extend([mv_out, mv_in])
    # Update cached item quantity (net stays the same globally, but ensure sync)
    try:
        total_map = get_current_stock([str(item.id)], location_id=None, as_of=None)
        total = _q2(total_map.get(str(item.id), DEC0))
        InventoryItem.objects.filter(id=item.id).update(quantity=total)
        _maybe_notify_low_stock([str(item.id)])
    except Exception:
        pass
    return movements


def trigger_low_stock_notifications(item_ids: Optional[Sequence[str]] = None) -> List[str]:
    """Trigger low stock alerts for specific items or all tracked items."""

    try:
        ids: List[str] = []
        if item_ids:
            for iid in item_ids:
                if iid:
                    ids.append(str(iid))
        if not ids:
            ids = list(
                {
                    str(iid)
                    for iid in ReorderSetting.objects.values_list("item_id", flat=True).distinct()
                    if iid
                }
            )
        if not ids:
            return []
        low = get_low_stock(ids)
        low_ids: List[str] = []
        for item, _qty in low:
            try:
                iid = str(item.id)
            except Exception:
                continue
            if iid not in low_ids:
                low_ids.append(iid)
        if not low_ids:
            return []
        _maybe_notify_low_stock(low_ids)
        return low_ids
    except Exception:
        return []


def get_recent_activity(
    *,
    item_id: Optional[str] = None,
    location_id: Optional[str] = None,
    types: Optional[Sequence[str]] = None,
    since: Optional[datetime] = None,
    limit: int = 50,
    page: int = 1,
) -> List[StockMovement]:
    """Return recent stock movements ordered by recorded_at DESC then id DESC.

    - Filters by item, location, movement types, and since recorded_at.
    - Simple pagination with page/limit.
    """
    qs = StockMovement.objects.select_related("item", "location", "batch", "actor").all()
    if item_id:
        qs = qs.filter(item_id=item_id)
    if location_id:
        qs = qs.filter(location_id=location_id)
    if types:
        up = [t.upper() for t in types]
        qs = qs.filter(movement_type__in=up)
    if since:
        qs = qs.filter(recorded_at__gte=since)
    qs = qs.order_by("-recorded_at", "-id")
    page = max(1, int(page or 1))
    limit = max(1, min(200, int(limit or 50)))
    start = (page - 1) * limit
    end = start + limit
    return list(qs[start:end])


_all_ = [
    "get_db_now",
    "get_current_stock",
    "get_batch_stock_by_location",
    "get_expiring_batches",
    "get_stock_ledger",
    "get_low_stock",
    "get_last_stock_update",
    "record_receipt",
    "consume_for_order",
    "adjust_stock",
    "transfer_stock",
    "trigger_low_stock_notifications",
    "get_recent_activity",
]
