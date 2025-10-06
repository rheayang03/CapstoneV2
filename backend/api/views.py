"""Aggregated exports after refactor.

This module re-exports functions from domain-specific modules so any legacy
imports like `from api.views import some_view` continue to work.
"""

from .views_auth import *  # noqa: F401,F403
from .views_verify import *  # noqa: F401,F403
from .views_menu import *  # noqa: F401,F403
from .views_users import *  # noqa: F401,F403
from .views_common import *  # noqa: F401,F403

