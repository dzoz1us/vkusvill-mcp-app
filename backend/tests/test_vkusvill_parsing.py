"""Tests for MCP response parsing (no network)."""

from app.services.vkusvill_service import _candidate_from_dict, _extract_products


def test_parse_live_shape():
    """Exact shape we saw from live MCP search."""
    raw = {
        "ok": True,
        "data": {
            "meta": {"q": "молоко 3.2", "total": 181},
            "items": [
                {
                    "id": 17525,
                    "xml_id": 17525,
                    "name": "Молоко 3,2% в бутылке, 900 мл",
                    "price": {"current": 104, "currency": "RUB"},
                    "weight": {"value": 0.9, "unit": "кг"},
                    "unit": "шт",
                    "url": "https://vkusvill.ru/goods/moloko-3-17525/",
                },
                {
                    "id": 173,
                    "xml_id": 173,
                    "name": "Молоко 3,2%, 1 л",
                    "price": {"current": 93, "currency": "RUB"},
                    "weight": {"value": 1, "unit": "кг"},
                    "unit": "шт",
                    "url": "https://vkusvill.ru/goods/moloko-3-173/",
                },
            ],
        },
    }

    candidates = _extract_products(raw)
    assert len(candidates) == 2

    c0 = candidates[0]
    assert c0.product_id == 17525
    assert c0.xml_id == "17525"
    assert c0.price == 104
    assert c0.package_quantity == 900  # 0.9 kg -> 900 g
    assert c0.package_unit == "g"
    assert c0.url.startswith("https://vkusvill.ru/")


def test_parse_flat_list_is_supported():
    """Mock/test shape: plain list of products."""
    raw = [
        {
            "xml_id": 42,
            "name": "Сыр",
            "price": 250.0,
            "weight": {"value": 200, "unit": "г"},
            "unit": "шт",
        }
    ]
    candidates = _extract_products(raw)
    assert len(candidates) == 1
    assert candidates[0].package_quantity == 200
    assert candidates[0].package_unit == "g"


def test_parse_skips_missing_xml_or_name():
    raw = {"data": {"items": [{"name": "X"}, {"xml_id": 1}]}}
    assert _extract_products(raw) == []


def test_candidate_null_price():
    raw = {
        "xml_id": 1,
        "name": "Молоко",
        "price": {"current": None, "currency": "RUB"},
        "weight": {"value": 1, "unit": "кг"},
    }
    c = _candidate_from_dict(raw)
    assert c is not None
    assert c.price is None
    assert c.package_quantity == 1000
