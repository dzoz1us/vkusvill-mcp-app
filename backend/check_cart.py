"""Direct MCP cart test: use the exact xml_id+q that our backend would send."""

import asyncio
import json

from sqlalchemy import select

from app.database.base import SessionLocal
from app.models import GroceryItem
from app.integrations.vkusvill.mcp_client import VkusVillMCPClient


async def main(plan_id: int = 1) -> None:
    db = SessionLocal()
    try:
        items = (
            db.execute(
                select(GroceryItem)
                .filter(GroceryItem.meal_plan_id == plan_id)
                .filter(GroceryItem.match_status == "matched")
                .filter(GroceryItem.product_xml_id.isnot(None))
                .filter(GroceryItem.package_count.isnot(None))
            )
            .scalars()
            .all()
        )
        print(f"Matched items in DB: {len(items)}")
        for it in items[:5]:
            print(
                f"  xml_id={it.product_xml_id!r} (type={type(it.product_xml_id).__name__}) "
                f"q={it.package_count} name={it.product_name!r}"
            )

        payload = []
        for it in items[:20]:
            payload.append({
                "xml_id": int(it.product_xml_id),
                "q": float(it.package_count or 1),
            })

        print(f"\nPayload to MCP ({len(payload)} items):")
        print(json.dumps(payload[:5], ensure_ascii=False, indent=2))

        client = VkusVillMCPClient()
        raw = await client.cart_link_create(payload)
        print(f"\nMCP response:\n{json.dumps(raw, ensure_ascii=False, indent=2)}")

        # try to extract and print the URL
        from app.api.vkusvill import _extract_cart_url
        url = _extract_cart_url(raw)
        print(f"\nExtracted URL: {url}")
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main(1))