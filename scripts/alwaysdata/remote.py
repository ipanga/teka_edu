"""Restricted release installer and atomic pointers; never restarts or resets a database."""
import argparse, hashlib, json, os, pathlib, re, shutil, tarfile, tempfile
ROOT = pathlib.Path('/home/congofoot/www/tekaedu-staging')
def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
def validate_release(root, sha):
    metadata = json.loads((root/'release.json').read_text())
    if metadata != {'sha':sha,'environment':'staging','url':'https://staging-tekaedu.tootiye.com','node_major':22}:
        raise ValueError('Release metadata identity mismatch')
    manifest = json.loads((root/'manifest.json').read_text())
    if manifest['sha'] != sha: raise ValueError('Manifest SHA mismatch')
    entries = list(root.rglob('*'))
    if any(p.is_symlink() for p in entries): raise ValueError('Payload symlink forbidden')
    actual = {p.relative_to(root).as_posix(): digest(p) for p in entries if p.is_file() and p not in (root/'manifest.json',root/'artifact.sha256')}
    expected = {f['path']:f['sha256'] for f in manifest['files']}
    if len(expected) != len(manifest['files']) or actual != expected: raise ValueError('Payload inventory/checksum mismatch')
    if not (root/'server.js').is_file() or not (root/'runtime.mjs').is_file(): raise ValueError('Missing runtime')
    return manifest

def install(root, archive, sha, checksum):
    if not re.fullmatch('[a-f0-9]{40}',sha): raise ValueError('Full release SHA required')
    if root.is_symlink() or (root/'releases').is_symlink(): raise ValueError('Redirected staging root forbidden')
    if digest(archive) != checksum: raise ValueError('Artifact checksum mismatch')
    releases = root/'releases'; releases.mkdir(parents=True,exist_ok=True)
    destination = releases/sha
    if destination.is_symlink(): raise ValueError('Redirected release forbidden')
    if destination.exists():
        if (destination/'artifact.sha256').read_text().strip() != checksum: raise ValueError('Immutable release conflict')
        # Marker is outside payload inventory; remove from comparison scope by design below.
        validate_release(destination,sha)
        return destination
    candidate=pathlib.Path(tempfile.mkdtemp(prefix='.incoming-',dir=str(releases)))
    transferred=False
    try:
        with tarfile.open(archive,'r:gz') as package:
            members=package.getmembers()
            for member in members:
                name=pathlib.PurePosixPath(member.name)
                if name.is_absolute() or '..' in name.parts or not (member.isfile() or member.isdir()):
                    raise ValueError('Unsafe archive entry')
                if any(part=='.git' or part.startswith('.env') for part in name.parts): raise ValueError('Forbidden archive entry')
            package.extractall(candidate,members=members)
        validate_release(candidate,sha)
        (candidate/'artifact.sha256').write_text(checksum+'\n')
        os.rename(candidate,destination)
        transferred=True
    finally:
        # A successful rename transfers ownership to the immutable release.
        if not transferred:
            try:
                shutil.rmtree(candidate)
            except OSError:
                raise ValueError('INSTALL_TEMP_DIRECTORY_CLEANUP') from None
    return destination

def switch(root, sha):
    if root.is_symlink() or (root/'releases').is_symlink(): raise ValueError('Redirected staging root forbidden')
    root=root.resolve()
    if not re.fullmatch('[a-f0-9]{40}',sha): raise ValueError('Full release SHA required')
    release=root/'releases'/sha
    if release.is_symlink(): raise ValueError('Redirected release forbidden')
    validate_release(release,sha)
    old=None
    current=root/'current'
    if current.exists() or current.is_symlink():
        old=current.resolve()
        if old.parent != (root/'releases').resolve(): raise ValueError('Unexpected current pointer')
        if old != release.resolve(): atomic_link(root/'previous',old.relative_to(root).as_posix())
    atomic_link(current,'releases/'+sha)
    return {'sha':sha,'previous':old.name if old else None}

def atomic_link(destination,target):
    if destination.exists() and not destination.is_symlink(): raise ValueError('Pointer is not a symlink')
    temporary=destination.with_name(destination.name+'.next')
    if temporary.exists() or temporary.is_symlink(): temporary.unlink()
    temporary.symlink_to(target)
    os.replace(temporary,destination)

if __name__=='__main__':
    if ROOT.resolve()!=ROOT: raise ValueError('Staging root resolves outside the allowlisted path')
    p=argparse.ArgumentParser();p.add_argument('action',choices=['install','switch']);p.add_argument('--sha',required=True);p.add_argument('--archive');p.add_argument('--checksum')
    a=p.parse_args()
    if not re.fullmatch('[a-f0-9]{40}',a.sha): raise ValueError('Full release SHA required')
    if a.action=='install':
        if not a.archive or not re.fullmatch('[a-f0-9]{64}',a.checksum or ''): raise ValueError('Archive checksum required')
        print(install(ROOT,pathlib.Path(a.archive),a.sha,a.checksum))
    else: print(json.dumps(switch(ROOT,a.sha)))
