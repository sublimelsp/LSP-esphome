from __future__ import annotations
from lsp_utils import NpmClientHandler
from lsp_utils import UvVenvManager
from pathlib import Path
from typing import final
from typing_extensions import override


PACKAGE_NAME = str(__package__)


@final
class LspEsphomePlugin(NpmClientHandler):
    package_name = PACKAGE_NAME
    server_directory = 'language-server'
    server_binary_path =  str(Path(server_directory, 'out', 'server.js'))
    uv_venv_manager: UvVenvManager | None = None

    @classmethod
    @override
    def required_node_version(cls) -> str:
        return '>=22'

    @classmethod
    @override
    def needs_update_or_installation(cls) -> bool:
        needs1 = super().needs_update_or_installation()
        if not cls.uv_venv_manager:
            cls.uv_venv_manager = UvVenvManager(PACKAGE_NAME, 'esphome/pyproject.toml', Path(cls.storage_path()))
        needs2 = cls.uv_venv_manager.needs_install_or_update()
        return needs1 or needs2

    @classmethod
    @override
    def install_or_update(cls) -> None:
        super().install_or_update()
        if not cls.uv_venv_manager:
            raise Exception('Expected UvVenvManager to be initialized')
        cls.uv_venv_manager.install()

    @classmethod
    @override
    def get_additional_variables(cls) -> dict[str, str]:
        variables = super().get_additional_variables()
        if cls.uv_venv_manager:
            variables.update({
                'managed_python_path': str(cls.uv_venv_manager.venv_python_path)
            })
        return variables


def plugin_loaded():
    LspEsphomePlugin.setup()


def plugin_unloaded():
    LspEsphomePlugin.cleanup()
