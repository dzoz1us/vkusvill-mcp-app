"""Low-level MCP client for VkusVill.

Isolated on purpose: no business logic, no ORM, no schemas from app.models.
The service layer sits above this and translates ProductCandidate into
GroceryItem rows.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from app.database.config import get_settings

logger = logging.getLogger(__name__)


class MCPError(Exception):
    """Base class for MCP errors."""


class MCPTimeoutError(MCPError):
    """Request to MCP timed out."""


class MCPUnavailableError(MCPError):
    """MCP returned 5xx or connection failed."""


class MCPBadResponseError(MCPError):
    """MCP response is not valid JSON-RPC or missing expected fields."""


class VkusVillMCPClient:
    """Minimal JSON-RPC 2.0 client for the VkusVill MCP server.

    We only implement the methods we actually use:
        - tools/list
        - tools/call { name: vkusvill_products_search, arguments: {...} }
        - tools/call { name: vkusvill_product_details, arguments: {...} }
        - tools/call { name: vkusvill_cart_link_create, arguments: {...} }
    """

    def __init__(
        self,
        url: str | None = None,
        timeout_ms: int | None = None,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        settings = get_settings()
        self.url = url or settings.vkusvill_mcp_url
        self.timeout_ms = timeout_ms or settings.vkusvill_mcp_timeout_ms
        self._transport = transport
        self._request_id = 0

    async def _call(
        self,
        method: str,
        params: dict[str, Any] | None = None,
    ) -> Any:
        self._request_id += 1
        payload = {
            "jsonrpc": "2.0",
            "id": self._request_id,
            "method": method,
            "params": params or {},
        }
        timeout = httpx.Timeout(self.timeout_ms / 1000.0)

        try:
            logger.info("MCP -> %s id=%d params=%s", method, self._request_id, params)
            async with httpx.AsyncClient(timeout=timeout, transport=self._transport) as client:
                response = await client.post(
                    self.url,
                    json=payload,
                    headers={
                        "Content-Type": "application/json",
                        "Accept": "application/json, text/event-stream",
                    },
                )
        except httpx.TimeoutException as e:
            raise MCPTimeoutError(f"MCP request timed out: {method}") from e
        except httpx.HTTPError as e:
            raise MCPUnavailableError(f"MCP transport error: {e}") from e

        if response.status_code >= 500:
            raise MCPUnavailableError(f"MCP returned {response.status_code}: {response.text[:200]}")
        if response.status_code >= 400:
            raise MCPBadResponseError(f"MCP returned {response.status_code}: {response.text[:200]}")

        try:
            data = response.json()
        except json.JSONDecodeError as e:
            raise MCPBadResponseError(f"MCP response is not JSON: {response.text[:200]}") from e

        if "error" in data:
            logger.error("MCP <- error: %s", data["error"])
            raise MCPBadResponseError(f"MCP error: {data['error']}")
        logger.info("MCP <- %s id=%d ok", method, self._request_id)

        return data.get("result")

    async def list_tools(self) -> list[dict[str, Any]]:
        result = await self._call("tools/list")
        return result.get("tools", []) if isinstance(result, dict) else []

    async def call_tool(
        self,
        name: str,
        arguments: dict[str, Any],
    ) -> Any:
        """Invoke a named MCP tool and return its parsed payload.

        MCP may return result.content[0].text as a JSON string. We unwrap
        that here so callers always get a python object.
        """
        result = await self._call(
            "tools/call",
            {"name": name, "arguments": arguments},
        )
        if result is None:
            return None

        # Standard MCP result: { content: [{ type: "text", text: "..." }] }
        if isinstance(result, dict) and "content" in result:
            content = result["content"]
            if isinstance(content, list) and content:
                first = content[0]
                if isinstance(first, dict) and first.get("type") == "text":
                    text = first.get("text", "")
                    try:
                        return json.loads(text)
                    except (json.JSONDecodeError, TypeError):
                        return text

        return result

    async def products_search(
        self,
        q: str,
        page: int = 1,
        mode: str = "custom",
        fields: list[str] | None = None,
    ) -> Any:
        if fields is None:
            fields = ["id", "xml_id", "name", "price", "weight", "unit", "url"]
        return await self.call_tool(
            "vkusvill_products_search",
            {
                "q": q,
                "page": page,
                "mode": mode,
                "fields": fields,
                "vvonly": 1,
            },
        )

    async def product_details(self, product_id: str) -> Any:
        return await self.call_tool(
            "vkusvill_product_details",
            {"id": product_id},
        )

    async def cart_link_create(
        self,
        products: list[dict[str, Any]],
    ) -> Any:
        """Create a share_basket link. `items` is [{xml_id, q}, ...]."""
        return await self.call_tool(
            "vkusvill_cart_link_create",
            {"products": products},
        )
