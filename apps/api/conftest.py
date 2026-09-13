import sys
import os

# Add apps/api and project root directory to sys.path
api_dir = os.path.abspath(os.path.dirname(__file__))
project_root = os.path.abspath(os.path.join(api_dir, "..", ".."))

sys.path.insert(0, api_dir)
sys.path.insert(0, project_root)
