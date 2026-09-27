"""Build compressed public offline files without embedding any account data.

The public template comes only from source files. Python's standard library is
sufficient. Modern browsers decode the embedded gzip payload locally.
"""
from pathlib import Path
import base64
import gzip
import json
import re

root = Path(__file__).resolve().parent
page = (root / 'index.html').read_text()
page = page.replace('<link rel="stylesheet" href="assets/style.css">', '<style>\n' + (root / 'assets/style.css').read_text() + '\n</style>')
page = page.replace('</head>', '<script>window.STUDY_OFFLINE=true;</script>\n</head>')
names = ['auth.js', 'rooms.js', 'content.js', 'generators.js', 'vendor/katex.min.js', 'study-tools.js', 'app.js']
scripts = '\n;\n'.join((root / 'assets' / name).read_text() for name in names)
page = re.sub(r'  <script defer src="assets/[^\"]+"></script>\n', '', page)
page = page.replace('</body>', '<!--SHARED_PAPERS-->\n<script>\n' + scripts.replace('</script', '<\\/script') + '\n</script>\n</body>')
payload = base64.b64encode(gzip.compress(page.encode(), compresslevel=9, mtime=0)).decode()
loader = '''window.getPublicAppTemplate = async function () {
  if (window.PUBLIC_APP_TEMPLATE) return window.PUBLIC_APP_TEMPLATE;
  if (!window.DecompressionStream) throw new Error('Open this offline copy in an up-to-date Chrome, Edge, Firefox or Safari browser.');
  const bytes = Uint8Array.from(atob(PAYLOAD), c => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  window.PUBLIC_APP_TEMPLATE = await new Response(stream).text();
  return window.PUBLIC_APP_TEMPLATE;
};
'''.replace('PAYLOAD', json.dumps(payload))
(root / 'assets/share-template.js').write_text(loader)
offline = '''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>EGCSE · The Study Room</title><style>body{font:16px/1.6 Arial,sans-serif;background:#f6f7f2;color:#123e38;padding:30px}#loading{max-width:600px;margin:15vh auto}</style></head><body><div id="loading" role="status">Opening your offline study room…</div><noscript>Enable JavaScript to use the offline lessons.</noscript><script>
''' + loader + '''
getPublicAppTemplate().then(html => { document.open(); document.write(html); document.close(); }).catch(error => { document.getElementById('loading').textContent = error.message; });
</script></body></html>
'''
(root / 'EGCSE-Offline.html').write_text(offline)
print('Built compressed offline app and public sharing template:', len(offline.encode()), 'bytes')
