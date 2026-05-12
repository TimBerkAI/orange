from config.settings.base import *  # noqa: F401, F403

DEBUG = False

DATABASES = {
    "default": {
        "ENGINE": env("TEST_DB_ENGINE", default="django.db.backends.postgresql"),  # noqa: F405
        "NAME": env("POSTGRES_DB", default="dental_test"),  # noqa: F405
        "USER": env("POSTGRES_USER", default="dental"),  # noqa: F405
        "PASSWORD": env("POSTGRES_PASSWORD", default="dental"),  # noqa: F405
        "HOST": env("POSTGRES_HOST", default="localhost"),  # noqa: F405
        "PORT": env.int("POSTGRES_PORT", default=5432),  # noqa: F405
    }
}

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]
