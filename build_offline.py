"""Build the one-file app and a clean template for sharing selected PDFs.

The template is built from source files, never live browser DOM or storage.
No lesson notes, answers or AI drafts can be included by this build.
"""
from pathlib import Path
import json
import re

root = Path(__file__).resolve().parent
page = (root/'index.html').read_text()
page = page.replace('<link rel="stylesheet" href="assets/style.css">', '<style>\n'+(root/'assets/style.css').read_text()+'\n</style>')
names = ['content.js', 'generators.js', 'vendor/katex.min.js', 'study-tools.js', 'app.js']
scripts = '\n;\n'.join((root/'assets'/name).read_text() for name in names)
page = re.sub(r'  <script defer src="assets/[^\"]+"></script>\n', '', page)
page = page.replace('</body>', '<!--SHARED_PAPERS-->\n<script>\n'+scripts.replace('</script', '<\\/script')+'\n</script>\n</body>')
template_js = 'window.PUBLIC_APP_TEMPLATE = '+json.dumps(page,ensure_ascii=False).replace('<','\\u003c')+';\n'
(root/'assets/share-template.js').write_text(template_js)
offline = page.replace('<!--SHARED_PAPERS-->', '<script>'+template_js+'</script>', 1)
(root/'EGCSE-Offline.html').write_text(offline)
print('Built EGCSE-Offline.html and assets/share-template.js')
