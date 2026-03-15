"""
Plugin system for custom analyzers.
Plugins live in backend/plugins/*.py and implement AnalyzerPlugin.
"""
import os, importlib.util, traceback
from typing import List, Dict, Any
from dataclasses import dataclass, field

PLUGINS_DIR = os.path.join(os.path.dirname(__file__), "..", "plugins")


@dataclass
class PluginResult:
    plugin_name: str
    issues: List[Dict[str, Any]] = field(default_factory=list)
    metrics: Dict[str, Any] = field(default_factory=dict)
    error: str = ""


class AnalyzerPlugin:
    """Base class for all plugins. Override analyze()."""
    name = "unnamed_plugin"
    description = "No description"
    version = "1.0.0"

    def analyze(self, code: str, filename: str = "code", language: str = "python") -> Dict[str, Any]:
        """
        Return a dict with:
          - issues: [{line, severity, message, rule}]
          - metrics: {key: value}
        """
        raise NotImplementedError


def load_plugins() -> List[AnalyzerPlugin]:
    """Discover and load all plugins from the plugins/ directory."""
    plugins = []
    if not os.path.isdir(PLUGINS_DIR):
        return plugins

    for fname in os.listdir(PLUGINS_DIR):
        if not fname.endswith(".py") or fname.startswith("_"):
            continue
        fpath = os.path.join(PLUGINS_DIR, fname)
        try:
            spec = importlib.util.spec_from_file_location(fname[:-3], fpath)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            for attr_name in dir(module):
                attr = getattr(module, attr_name)
                if (isinstance(attr, type) and issubclass(attr, AnalyzerPlugin)
                        and attr is not AnalyzerPlugin):
                    plugins.append(attr())
        except Exception:
            pass

    return plugins


def run_plugins(code: str, filename: str = "code", language: str = "python") -> List[PluginResult]:
    """Run all discovered plugins on the given code."""
    plugins = load_plugins()
    results = []
    for plugin in plugins:
        try:
            output = plugin.analyze(code, filename, language)
            results.append(PluginResult(
                plugin_name=plugin.name,
                issues=output.get("issues", []),
                metrics=output.get("metrics", {}),
            ))
        except Exception as e:
            results.append(PluginResult(
                plugin_name=plugin.name,
                error=str(e),
            ))
    return results


def list_plugins() -> List[Dict[str, str]]:
    """Return metadata for all available plugins."""
    return [
        {"name": p.name, "description": p.description, "version": p.version}
        for p in load_plugins()
    ]
