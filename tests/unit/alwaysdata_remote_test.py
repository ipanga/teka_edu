"""Functional release safety checks, isolated from SSH, sites and databases."""
import hashlib, importlib.util, io, json, os, pathlib, shutil, tarfile, tempfile, unittest
from unittest import mock
spec=importlib.util.spec_from_file_location('release',pathlib.Path(__file__).parents[2]/'scripts/alwaysdata/remote.py')
release=importlib.util.module_from_spec(spec);spec.loader.exec_module(release)

class Python36TemporaryDirectory(tempfile.TemporaryDirectory):
    """CPython v3.6.15 cleanup: detach, then rmtree without ignoring a missing path.

    https://github.com/python/cpython/blob/v3.6.15/Lib/tempfile.py#L749-L751
    This deliberately restores the old behavior on newer test interpreters.
    """
    def cleanup(self):
        if self._finalizer.detach():
            shutil.rmtree(self.name)

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

    def test_python36_context_reproduces_post_rename_failure(self):
        destination=self.base/'renamed'
        with self.assertRaises(FileNotFoundError):
            with Python36TemporaryDirectory(dir=str(self.base)) as temporary:
                candidate=pathlib.Path(temporary)
                (candidate/'payload').write_text('valid')
                os.rename(candidate,destination)
        self.assertEqual((destination/'payload').read_text(),'valid')
        self.assertFalse(candidate.exists())

    def test_install_with_python36_cleanup_semantics(self):
        sha='a'*40;archive,checksum=self.archive(sha)
        rename=os.rename
        def validated_rename(candidate,destination):
            self.assertTrue(candidate.is_dir())
            self.assertFalse(destination.exists())
            self.assertEqual(release.validate_release(candidate,sha)['sha'],sha)
            self.assertEqual((candidate/'artifact.sha256').read_text().strip(),checksum)
            rename(candidate,destination)
            self.assertFalse(candidate.exists())
        with mock.patch.object(release.tempfile,'TemporaryDirectory',wraps=Python36TemporaryDirectory) as context, \
             mock.patch.object(release.os,'rename',side_effect=validated_rename) as moved, \
             mock.patch.object(shutil,'rmtree',wraps=shutil.rmtree) as cleanup:
            destination=release.install(self.root,archive,sha,checksum)
            context.assert_not_called()
            moved.assert_called_once()
            cleanup.assert_not_called()
        self.assertEqual(destination,self.root/'releases'/sha)
        self.assertEqual(release.validate_release(destination,sha)['sha'],sha)
        self.assertEqual(list((self.root/'releases').iterdir()),[destination])
        self.assertFalse((self.root/'current').is_symlink())
        self.assertFalse((self.root/'previous').is_symlink())

    def test_identical_release_does_not_replace_or_cleanup(self):
        sha='a'*40;archive,checksum=self.archive(sha)
        destination=release.install(self.root,archive,sha,checksum)
        before={p.relative_to(destination).as_posix():(p.stat().st_ino,p.read_bytes()) for p in destination.rglob('*') if p.is_file()}
        inode=destination.stat().st_ino
        with mock.patch.object(release.tempfile,'mkdtemp') as created, \
             mock.patch.object(release.os,'rename') as moved, \
             mock.patch.object(shutil,'rmtree') as cleanup:
            self.assertEqual(release.install(self.root,archive,sha,checksum),destination)
            created.assert_not_called();moved.assert_not_called();cleanup.assert_not_called()
        self.assertEqual(destination.stat().st_ino,inode)
        self.assertEqual({p.relative_to(destination).as_posix():(p.stat().st_ino,p.read_bytes()) for p in destination.rglob('*') if p.is_file()},before)

    def test_failed_validation_cleans_owned_temp_once(self):
        sha='a'*40;archive,checksum=self.archive(sha,'extra.txt')
        with mock.patch.object(shutil,'rmtree',wraps=shutil.rmtree) as cleanup:
            with self.assertRaisesRegex(ValueError,'inventory/checksum'):
                release.install(self.root,archive,sha,checksum)
            cleanup.assert_called_once()
            candidate=pathlib.Path(cleanup.call_args[0][0])
            self.assertEqual(candidate.parent,self.root/'releases')
            self.assertTrue(candidate.name.startswith('.incoming-'))
        self.assertFalse(candidate.exists())
        self.assertEqual(list((self.root/'releases').iterdir()),[])
        self.assertFalse((self.root/'current').is_symlink())

    def test_failed_rename_cleans_owned_temp_once(self):
        sha='a'*40;archive,checksum=self.archive(sha)
        with mock.patch.object(release.os,'rename',side_effect=PermissionError('rename denied')), \
             mock.patch.object(shutil,'rmtree',wraps=shutil.rmtree) as cleanup:
            with self.assertRaisesRegex(PermissionError,'rename denied'):
                release.install(self.root,archive,sha,checksum)
            cleanup.assert_called_once()
        self.assertEqual(list((self.root/'releases').iterdir()),[])
        self.assertFalse((self.root/'current').is_symlink())

    def test_unexpected_cleanup_errors_are_sanitized(self):
        for error in [PermissionError('private filesystem detail'),FileNotFoundError('unexpected disappearance')]:
            with self.subTest(error=type(error).__name__):
                sha='a'*40;archive,checksum=self.archive(sha,'extra.txt')
                with mock.patch.object(shutil,'rmtree',side_effect=error) as cleanup:
                    with self.assertRaisesRegex(ValueError,'^INSTALL_TEMP_DIRECTORY_CLEANUP$') as raised:
                        release.install(self.root,archive,sha,checksum)
                    cleanup.assert_called_once()
                self.assertTrue(raised.exception.__suppress_context__)
                self.assertIsNone(raised.exception.__cause__)
                self.assertFalse((self.root/'releases'/sha).exists())
                self.assertFalse((self.root/'current').is_symlink())
                for candidate in (self.root/'releases').iterdir():
                    shutil.rmtree(candidate)

    def test_mismatched_payload_is_not_replaced(self):
        sha='a'*40;archive,checksum=self.archive(sha)
        destination=release.install(self.root,archive,sha,checksum)
        (destination/'server.js').write_text('unexpected payload')
        inode=destination.stat().st_ino
        with mock.patch.object(release.tempfile,'mkdtemp') as created, \
             mock.patch.object(release.os,'rename') as moved, \
             mock.patch.object(shutil,'rmtree') as cleanup:
            with self.assertRaisesRegex(ValueError,'inventory/checksum'):
                release.install(self.root,archive,sha,checksum)
            created.assert_not_called();moved.assert_not_called();cleanup.assert_not_called()
        self.assertEqual(destination.stat().st_ino,inode)
        self.assertEqual((destination/'server.js').read_text(),'unexpected payload')
        self.assertEqual((destination/'artifact.sha256').read_text().strip(),checksum)

if __name__=='__main__':unittest.main()
