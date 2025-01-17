import { writeFile, readFile, readdir, mkdir } from 'fs-extra';
import { getUnlockedFileMap } from '../utils/getUnlockedFileMap';
import { initCommand } from '../commands/initCommand';
import { runCommand } from '../commands/runCommand';
import { getSession } from '../utils/getSession';
import { getPath } from '../utils/getPath';
import { resolve } from 'path';
import { crypto } from '../utils/crypto';
import { tmpdir } from 'os';

beforeAll(async () => {
  // Hijack process.cwd() and send it to a temp dir
  const uuid = crypto.randomUUID();
  process.cwd = () => resolve(tmpdir(), uuid);
  await mkdir(process.cwd());
});

/**
 * @todo test file timestamps plaintext->encrypted
 * @todo test file timestamps encrypted->plaintext
 * @todo test deleting tracked file
 */
test('cli', async () => {
  const password = ['hunter42', 'hunter24', 'pass123', 'pass456'];

  // Initialize repo
  await initCommand({
    encryption: [
      'AES-256-GCM',
      'XChaCha20-Poly1305',
      'AES-256-GCM',
      'XChaCha20-Poly1305',
    ],
    password,
    vscode: true,
  });

  // Write plaintext files
  await writeFile(getPath('test.txt'), 'Hello World');
  await mkdir(getPath('dir'));
  await writeFile(getPath('dir/abc.md'), 'foo bar');

  // Save files
  await runCommand('save', undefined, { password });

  // Confirm that the plaintext files still exist
  let entries = await readdir(getPath(''));
  expect(entries).toContain('test.txt');
  expect(entries).toContain('dir');

  // Confirm that file map was created and has both entries
  const session = await getSession({ password });
  const maps = await getUnlockedFileMap(session.unlocked_keychain);
  expect(Object.keys(maps.locked).length).toBe(2);
  expect(Object.keys(maps.unlocked).length).toBe(2);
  expect(Object.values(maps.unlocked).some((v) => v == '/test.txt')).toBe(true);
  expect(Object.values(maps.unlocked).some((v) => v == '/dir/abc.md')).toBe(
    true,
  );

  // Lock files
  await runCommand('lock', undefined, { password });

  // Confirm that the plaintext files no longer exist
  entries = await readdir(getPath(''));
  expect(entries).not.toContain('test.txt');
  expect(entries).not.toContain('dir');

  // Unlock files
  await runCommand('unlock', undefined, { password });

  // Confirm plaintext files exist again with original content
  let content = await readFile(getPath('test.txt'), 'utf8');
  expect(content).toBe('Hello World');
  content = await readFile(getPath('dir/abc.md'), 'utf8');
  expect(content).toBe('foo bar');
});
