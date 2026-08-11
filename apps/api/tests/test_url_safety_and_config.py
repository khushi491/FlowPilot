import pytest
from pydantic import ValidationError
from unittest.mock import patch

from app.core.config import PLACEHOLDER_JWT_SECRET, Settings
from app.engine.url_safety import UnsafeUrlError, assert_safe_url


def test_assert_safe_url_blocks_localhost():
    with pytest.raises(UnsafeUrlError):
        assert_safe_url("http://127.0.0.1/secret")


def test_assert_safe_url_blocks_metadata_ip():
    with pytest.raises(UnsafeUrlError):
        assert_safe_url("http://169.254.169.254/latest/meta-data")


def test_assert_safe_url_blocks_private_ip():
    with pytest.raises(UnsafeUrlError):
        assert_safe_url("http://192.168.1.10/admin")


def test_assert_safe_url_blocks_non_http_scheme():
    with pytest.raises(UnsafeUrlError, match="http or https"):
        assert_safe_url("file:///etc/passwd")


def test_assert_safe_url_blocks_dns_to_private():
    fake = [(2, 1, 6, "", ("10.0.0.5", 80))]
    with patch("app.engine.url_safety.socket.getaddrinfo", return_value=fake):
        with pytest.raises(UnsafeUrlError, match="blocked"):
            assert_safe_url("http://evil.example/ssrf")


def test_assert_safe_url_allows_public_literal():
    assert assert_safe_url("https://8.8.8.8/resolve") == "https://8.8.8.8/resolve"


def test_settings_allows_placeholder_in_development():
    settings = Settings(app_env="development", jwt_secret=PLACEHOLDER_JWT_SECRET)
    assert settings.is_dev_env


def test_settings_rejects_placeholder_in_production():
    with pytest.raises(ValidationError, match="JWT_SECRET"):
        Settings(app_env="production", jwt_secret=PLACEHOLDER_JWT_SECRET)


def test_settings_accepts_strong_secret_in_production():
    settings = Settings(app_env="production", jwt_secret="a-sufficiently-long-random-secret")
    assert not settings.is_dev_env
