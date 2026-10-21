from __future__ import annotations

from LSP.plugin import LspPlugin
from LSP.plugin import OnPreStartContext
from lsp_utils import NodeManager
from lsp_utils import UvVenvManager
from pathlib import Path
from sublime_lib import ResourcePath
from typing import final
from typing_extensions import override


@final
class LspEsphomePlugin(LspPlugin):

    @classmethod
    @override
    def on_pre_start_async(cls, context: OnPreStartContext) -> None:
        package_name = cls.plugin_storage_path.name
        NodeManager.on_pre_start_async(
            context,
            cls.plugin_storage_path,
            ResourcePath('Packages', package_name, 'language-server'),
            Path('out', 'server.js'),
            node_version_requirement='>=22',
        )
        uv_venv = UvVenvManager(cls.plugin_storage_path, ResourcePath('Packages', package_name, 'server'), 'python')
        python_path = context.configuration.init_options.get('pythonPath')
        if not python_path or '${managed_python_path}' in python_path:
            uv_venv.install_async()
        context.variables.update({
            'managed_python_path': str(uv_venv.venv_bin_path / 'python')
        })


def plugin_loaded():
    LspEsphomePlugin.register()


def plugin_unloaded():
    LspEsphomePlugin.unregister()
