from __future__ import annotations

from LSP.plugin import ClientResponse
from LSP.plugin import LspPlugin
from LSP.plugin import Notification
from LSP.plugin import OnPreStartContext
from lsp_utils import NodeManager
from lsp_utils import UvVenvManager
from pathlib import Path
from sublime_lib import ResourcePath
from typing import final
from typing_extensions import override
import sublime


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
        uv_venv = UvVenvManager(cls.plugin_storage_path, ResourcePath('Packages', package_name, 'esphome'), 'python')
        python_path = context.configuration.init_options.get('pythonPath')
        if not python_path or '${managed_python_path}' in python_path:
            uv_venv.install_async()
        context.variables.update({
            'managed_python_path': str(uv_venv.venv_bin_path / 'python')
        })

    @override
    def on_pre_send_response_async(self, response: ClientResponse) -> None:
        if response['method'] == 'workspace/configuration':
            # WORKAROUND: The server only starts handling opened documents once it has received its configuration, so
            # documents opened before that, like the one that started the server, are never validated. Reopen them
            # after the response has been sent.
            sublime.set_timeout_async(self._reopen_documents_async)

    def _reopen_documents_async(self) -> None:
        session = self.weaksession()
        if not session:
            return
        for session_buffer in session.session_buffers_async():
            uri = session_buffer.get_uri()
            language_id = session_buffer.get_language_id()
            view = session_buffer.get_view_in_group()
            # Skip documents with changes that haven't been sent yet. Sending them will get them validated anyway.
            if not uri or not language_id or session_buffer.last_synced_version != view.change_count():
                continue
            session.send_notification(Notification.didClose({'textDocument': {'uri': uri}}))
            session.send_notification(Notification.didOpen({
                'textDocument': {
                    'uri': uri,
                    'languageId': language_id,
                    'version': view.change_count(),
                    'text': view.substr(sublime.Region(0, view.size())),
                }
            }))


def plugin_loaded():
    LspEsphomePlugin.register()


def plugin_unloaded():
    LspEsphomePlugin.unregister()
