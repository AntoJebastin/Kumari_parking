"""Consistent API JSON response envelope."""

from typing import Any


def ok(data: Any = None, message: str = "Success") -> dict:
    return {
        "success": True,
        "message": message,
        "data": data if data is not None else {},
    }


def fail(message: str = "Error", data: Any = None) -> dict:
    return {
        "success": False,
        "message": message,
        "data": data if data is not None else {},
    }
