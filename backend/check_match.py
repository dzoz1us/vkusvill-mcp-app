"""Quick diagnostic: run MCP match for a specific ingredient name."""

import asyncio
import sys

from sqlalchemy import select

from app.database.base import SessionLocal
from app.models import Ingredient
from app.services.vkusvill_service import (
    _extract_products,
    match_ingredient,
    search_products,
)
from app.integrations.vkusvill.mapper import pick_best_candidate
from app.integrations.vkusvill.mcp_client import VkusVillMCPClient


async def main(name: str) -> None:
    db = SessionLocal()
    try:
        ing = (
            db.execute(select(Ingredient).filter_by(normalized_name=name.lower()))
            .scalar_one_or_none()
        )
        if ing is None:
            print(f"Ingredient {name!r} not found in DB")
            return

        print(f"Ingredient: id={ing.id} name={ing.name!r}")

        client = VkusVillMCPClient()
        candidates = await search_products(
            db, name, client=client, use_cache=False
        )
        print(f"MCP returned {len(candidates)} candidates")
        for c in candidates[:5]:
            print(
                f"  xml_id={c.xml_id} name={c.name!r} "
                f"price={c.price} pkg={c.package_quantity}{c.package_unit or ''}"
            )

        best, status, score = pick_best_candidate(ing.name, candidates)
        print()
        print(f"BEST  status={status} score={score:.2f}")
        print(f"      candidate={best.name if best else None}")

        # also test via the public match_ingredient
        result = await match_ingredient(db, ing, client=client)
        print()
        print(f"match_ingredient -> status={result.status} score={result.score:.2f}")
        print(f"                    candidate={result.candidate.name if result.candidate else None}")
    finally:
        db.close()


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "творог"
    asyncio.run(main(target))