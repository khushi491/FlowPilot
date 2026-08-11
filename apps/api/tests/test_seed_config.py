from app.core.config import Settings


def test_seed_on_start_defaults_false():
    settings = Settings(app_env="development", jwt_secret="change-me-to-a-long-random-secret")
    assert settings.seed_on_start is False
