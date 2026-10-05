"""Functional release safety checks, isolated from SSH, sites and databases."""
import hashlib, importlib.util, io, json, pathlib, tarfile, tempfile, unittest
spec=importlib.util.spec_from_file_location('release',pathlib.Path(__file__).parents[2]/'scripts/alwaysdata/remote.py')
release=importlib.util.module_from_spec(spec);spec.loader.exec_module(release)

class Releases(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.base=pathlib.Path(self.tmp.name);self.root=self.base/'site'
    def tearDown(self): self.tmp.cleanup()
    def archive(self,sha,extra=None):
        files={'release.json':json.dumps({'sha':sha,'environment':'staging','url':'https://staging-tekaedu.tootiye.com','node_major':22}).encode(),'server.js':b'// fixture','runtime.mjs':b'// fixture'}
        files['manifest.json']=json.dumps({'sha':sha,'files':[{'path':p,'sha256':hashlib.sha256(data).hexdigest()} for p,data in files.items()]}).encode()
        target=self.base/(sha+'.tgz')
        with tarfile.open(target,'w:gz') as package:
            for name,data in files.items():
                info=tarfile.TarInfo(name);info.size=len(data);package.addfile(info,io.BytesIO(data))
            if extra:
                info=tarfile.TarInfo(extra);info.size=1;package.addfile(info,io.BytesIO(b'x'))
        return target,release.digest(target)
    def test_two_release_rollback_and_immutable_content(self):
        a,b='a'*40,'b'*40
        for sha in [a,b]:
            archive,checksum=self.archive(sha);release.install(self.root,archive,sha,checksum)
            release.install(self.root,archive,sha,checksum)
        for sha in [a,b,a,b]:
            release.switch(self.root,sha);self.assertEqual((self.root/'current').resolve().name,sha)
        self.assertEqual((self.root/'previous').resolve().name,a)
        (self.root/'releases'/b/'server.js').write_text('tampered')
        with self.assertRaisesRegex(ValueError,'checksum'): release.switch(self.root,b)
        self.assertEqual((self.root/'current').resolve().name,b)
    def test_archive_traversal_and_extra_unmanifested_file(self):
        for name in ['../outside','/absolute','.env.local','extra.txt']:
            archive,checksum=self.archive('a'*40,name)
            with self.assertRaises(ValueError):release.install(self.root,archive,'a'*40,checksum)
            self.assertFalse((self.root/'releases'/('a'*40)).exists())
            self.assertFalse((self.base/'outside').exists())
    def test_checksum_and_immutable_conflict(self):
        sha='a'*40;archive,checksum=self.archive(sha)
        with self.assertRaisesRegex(ValueError,'checksum'):release.install(self.root,archive,sha,'0'*64)
        release.install(self.root,archive,sha,checksum)
        (self.root/'releases'/sha/'artifact.sha256').write_text('different')
        with self.assertRaisesRegex(ValueError,'Immutable'):release.install(self.root,archive,sha,checksum)
    def test_archive_symlink_and_wrong_pointer(self):
        sha='a'*40;archive,checksum=self.archive(sha)
        with tarfile.open(archive,'w:gz') as package:
            info=tarfile.TarInfo('link');info.type=tarfile.SYMTYPE;info.linkname='/etc/passwd';package.addfile(info)
        with self.assertRaises(ValueError):release.install(self.root,archive,sha,release.digest(archive))
        archive,checksum=self.archive(sha);release.install(self.root,archive,sha,checksum)
        (self.root/'current').symlink_to(self.base)
        with self.assertRaises(ValueError):release.switch(self.root,sha)

if __name__=='__main__':unittest.main()
