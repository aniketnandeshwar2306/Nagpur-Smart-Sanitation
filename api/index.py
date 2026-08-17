import sys
import os
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, "..", "backend"))
load_dotenv(os.path.join(backend_dir, ".env"))
load_dotenv(os.path.join(current_dir, "..", ".env"))
load_dotenv()

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app  # noqa: E402
