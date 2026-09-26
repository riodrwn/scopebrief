from pathlib import Path
import zipfile
root=Path(__file__).resolve().parent
for browser in ('chrome','firefox'):
    with zipfile.ZipFile(root/f'scopebrief-{browser}.zip','w',zipfile.ZIP_DEFLATED) as z:
        for p in (root/'dist'/browser).iterdir(): z.write(p,p.name)
        z.write(root/'README.md','README.md')
with zipfile.ZipFile(root/'scopebrief-source.zip','w',zipfile.ZIP_DEFLATED) as z:
    for folder in ('src','tests'):
        for p in (root/folder).rglob('*'):
            if p.is_file(): z.write(p,p.relative_to(root))
    for name in ('package.json','package-lock.json','build.mjs','package.py','README.md','ROADMAP.md','.gitignore'): z.write(root/name,name)
for p in root.glob('*.zip'):
    with zipfile.ZipFile(p) as z:
        assert z.testzip() is None
    print(p.name,p.stat().st_size)
