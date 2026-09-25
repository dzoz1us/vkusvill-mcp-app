"""Tests for MCP client using httpx mock transport."""

import httpx
import pytest

from app.integrations.vkusvill.mcp_client import (
    MCPBadResponseError,
    MCPTimeoutError,
    MCPUnavailableError,
    VkusVillMCPClient,
)


@pytest.mark.asyncio
async def test_search_success():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "jsonrpc": "2.0",
                "id": 1,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": '{"products": [{"xml_id": "1", "name": "Молоко"}]}',
                        }
                    ]
                },
            },
        )

    transport = httpx.MockTransport(handler)
    client = VkusVillMCPClient(transport=transport)
    result = await client.products_search("молоко")
    assert result["products"][0]["xml_id"] == "1"


@pytest.mark.asyncio
async def test_timeout_raises_mcp_timeout():
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.TimeoutException("timeout")

    transport = httpx.MockTransport(handler)
    client = VkusVillMCPClient(transport=transport)
    with pytest.raises(MCPTimeoutError):
        await client.products_search("молоко")


@pytest.mark.asyncio
async def test_5xx_raises_unavailable():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503, text="service unavailable")

    transport = httpx.MockTransport(handler)
    client = VkusVillMCPClient(transport=transport)
    with pytest.raises(MCPUnavailableError):
        await client.products_search("молоко")


@pytest.mark.asyncio
async def test_bad_json_raises_bad_response():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, text="not json")

    transport = httpx.MockTransport(handler)
    client = VkusVillMCPClient(transport=transport)
    with pytest.raises(MCPBadResponseError):
        await client.products_search("молоко")