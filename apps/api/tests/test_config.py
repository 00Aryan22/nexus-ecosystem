import os
import tempfile
from pathlib import Path

from app.core.config import _env_file_paths, _find_repo_root


class TestRepoRootDiscovery:
    def test_git_marker(self):
        """Finds repo root via .git directory."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / ".git").mkdir()
            nested = root / "a" / "b" / "c"
            nested.mkdir(parents=True)
            assert _find_repo_root(nested) == root

    def test_package_json_marker(self):
        """Falls back to package.json when .git is absent."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "package.json").touch()
            nested = root / "x" / "y"
            nested.mkdir(parents=True)
            assert _find_repo_root(nested) == root

    def test_pyproject_toml_marker(self):
        """Falls back to pyproject.toml when .git and package.json are absent."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "pyproject.toml").touch()
            nested = root / "deep" / "path"
            nested.mkdir(parents=True)
            assert _find_repo_root(nested) == root

    def test_git_takes_priority_over_package_json(self):
        """.git is checked first and preferred over package.json."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / ".git").mkdir()
            (root / "package.json").touch()
            nested = root / "sub" / "dir"
            nested.mkdir(parents=True)
            result = _find_repo_root(nested)
            assert result == root
            assert (result / ".git").exists()

    def test_package_json_takes_priority_over_pyproject_toml(self):
        """package.json is checked before pyproject.toml."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "package.json").touch()
            (root / "pyproject.toml").touch()
            nested = root / "sub" / "dir"
            nested.mkdir(parents=True)
            result = _find_repo_root(nested)
            assert result == root
            assert (result / "package.json").exists()

    def test_no_marker_returns_none(self):
        """Returns None when no marker is found in the hierarchy."""
        with tempfile.TemporaryDirectory() as tmp:
            deep = Path(tmp) / "a" / "b" / "c"
            deep.mkdir(parents=True)
            assert _find_repo_root(deep) is None

    def test_start_path_is_checked_first(self):
        """The start path itself is checked before its parents."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / ".git").mkdir()
            assert _find_repo_root(root) == root

    def test_docker_like_finds_pyproject_toml(self):
        """Docker /app/app/core layout finds pyproject.toml at /app."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            app_root = root / "app"
            app_root.mkdir()
            (app_root / "pyproject.toml").touch()
            core_dir = app_root / "app" / "core"
            core_dir.mkdir(parents=True)
            result = _find_repo_root(core_dir)
            assert result == app_root
            # .env files are NOT in the Docker container
            assert _env_file_paths(result) == []


class TestEnvFilePathResolution:
    def test_existing_env_files_are_returned(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / ".env.local").touch()
            result = _env_file_paths(root)
            assert len(result) == 1
            assert result[0] == root / ".env.local"

    def test_both_env_and_env_local(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / ".env").touch()
            (root / ".env.local").touch()
            result = _env_file_paths(root)
            assert len(result) == 2

    def test_no_env_files_returns_empty(self):
        with tempfile.TemporaryDirectory() as tmp:
            assert _env_file_paths(Path(tmp)) == []

    def test_none_root_returns_empty(self):
        assert _env_file_paths(None) == []


class TestSettingsImport:
    """Regression: config import must not raise IndexError in any environment."""

    def test_import_with_env_vars(self):
        """Import succeeds when JWT_SECRET_KEY is set via env var (Render path)."""
        os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-pytest-only-not-production")
        from app.core.config import settings

        assert settings.app_env is not None

    def test_no_index_error_on_import(self):
        """Import does NOT raise IndentationError/IndexError (regression for parents[4])."""
        import importlib

        import app.core.config as cfg

        importlib.reload(cfg)
