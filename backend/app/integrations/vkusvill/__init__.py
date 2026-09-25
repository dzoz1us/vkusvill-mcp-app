"""VkusVill MCP integration.

Everything that talks to the outside world lives here. Business code
imports from `app.services.vkusvill_service`, never from this package
directly — that keeps swapping MCP for something else trivial.
"""

from app.integrations.vkusvill.mcp_client import (
    MCPBadResponseError,
    MCPError,
    MCPTimeoutError,
    MCPUnavailableError,
    VkusVillMCPClient,
)
from app.integrations.vkusvill.schemas import MatchResult, ProductCandidate

__all__ = [
    "MCPBadResponseError",
    "MCPError",
    "MCPTimeoutError",
    "MCPUnavailableError",
    "MatchResult",
    "ProductCandidate",
    "VkusVillMCPClient",
]