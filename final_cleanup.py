def fix(p, old_bytes, new_bytes):
    import os
    if not os.path.exists(p): return
    with open(p, 'rb') as f: data = f.read()
    if old_bytes in data:
        data = data.replace(old_bytes, new_bytes)
        with open(p, 'wb') as f: f.write(data)
        print(f'Fixed {p}')
    else: print(f'Already clean: {p}')

fix(r'C:\Users\MH\OneDrive\Documents\VS Code\Amsam agency\cements.html', b'\xc3\xa2\xe2\x80\xa0\xe2\x80\x9c', '↓'.encode('utf-8'))
fix(r'C:\Users\MH\OneDrive\Documents\VS Code\Amsam agency\tile-adhesive.html', b'\xc3\xa2\xe2\x80\xa0\xe2\x80\x9c', '↓'.encode('utf-8'))
fix(r'C:\Users\MH\OneDrive\Documents\VS Code\Amsam agency\script.js', b'\xc3\xa2\xc5\xa1\xc2\xa0\xc3\xaf\xc2\xb8\xc2\x8f', '⚠️'.encode('utf-8'))
