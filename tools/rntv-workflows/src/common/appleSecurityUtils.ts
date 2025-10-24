// Adapted from https://github.com/Apple-Actions/import-codesign-certs

import spawnAsync from '@expo/spawn-async'

import { spawnSync } from 'child_process';

type ExecOptions = spawnAsync.SpawnOptions;

async function exec(
  command: string,
  args: string[],
  options?: ExecOptions
): Promise<any> {
  return await spawnAsync(command, args, options);
}

export async function installCertIntoTemporaryKeychain(
  keychain: string,
  setupKeychain: boolean,
  keychainPassword: string,
  p12FilePath: string,
  p12Password: string
// ): Promise<void> {
): Promise<string> {
  let output = ''
  const options: any = {}
  options.listeners = {
    stdout: (data: Buffer) => {
      output += data.toString()
    }
  }

  if (keychain.endsWith('.keychain')) {
    throw new Error('keychain name should not end in .keychain')
  }
  if (p12FilePath === '') {
    throw new Error('p12FilePath must not be empty')
  }
  if (p12Password === '') {
    throw new Error('p12Password must not be empty')
  }
  if (keychainPassword === '') {
    throw new Error('keychainPassword must not be empty')
  }

  const tempKeychain = `${keychain}.keychain`
  if (setupKeychain) {
    await createKeychain(tempKeychain, keychainPassword, options)
  }
  await unlockKeychain(tempKeychain, keychainPassword, options)
  await importPkcs12(tempKeychain, p12FilePath, p12Password, options)
  await setPartitionList(tempKeychain, keychainPassword)
  await updateKeychainList(tempKeychain, options)

  // setOutput('security-response', output)
  return output;
}

/**
 * Update the keychains list.
 * @param keychain The name of the keychain to include in list.
 * @param options Execution options (optional)
 */
async function updateKeychainList(
  keychain: string,
  options?: ExecOptions
): Promise<void> {
  const args: string[] = [
    'list-keychains',
    '-d',
    'user',
    '-s',
    keychain,
    'login.keychain'
  ]

  await exec('security', args, options)
}

/**
 * Delete the specified keychain
 * @param keychain The name of the keychain to delete.
 * @param options Execution options (optional)
 */
export async function deleteKeychain(
  keychain: string,
  options?: ExecOptions
): Promise<void> {
  if (keychain.endsWith('.keychain')) {
    throw new Error('keychain name should not end in .keychain')
  }

  await exec('security', ['delete-keychain', `${keychain}.keychain`], options)
}

/**
 * Import a PKCS12 file into the keychain
 * @param keychain The name of the keychain to import the P12 file into.
 * @param p12FilePath The path to the .p12 file
 * @param p12Password The password used to decrypt the .p12 file.
 * @param options Execution options (optional)
 */
async function importPkcs12(
  keychain: string,
  p12FilePath: string,
  p12Password: string,
  options?: ExecOptions
): Promise<void> {
  const importArgs: string[] = [
    'import',
    p12FilePath,
    '-k',
    keychain,
    '-f',
    'pkcs12',
    '-T',
    '/usr/bin/codesign',
    '-T',
    '/usr/bin/security',
    '-T',
    '/usr/bin/pkgbuild',
    '-T',
    '/usr/bin/productbuild',
    '-P',
    p12Password
  ]

  await exec('security', importArgs, options)
}

/**
 * Sets the partition list for the specified keychain.
 * @param keychain The keychain to update.
 * @param password The keychain password.
 * @param options Execution options (optional)
 */
async function setPartitionList(
  keychain: string,
  password: string,
  options?: ExecOptions
): Promise<void> {
  const args: string[] = [
    'set-key-partition-list',
    '-S',
    'apple-tool:,apple:',
    '-k',
    password,
    keychain
  ]
  await exec('security', args, options)
}

/**
 * Unlock the specified Keychain
 * @param keychain The keychain to unlock
 * @param password THe password to unlock with
 * @param options Execution options (optional)
 */
async function unlockKeychain(
  keychain: string,
  password: string,
  options?: ExecOptions
): Promise<void> {
  const args: string[] = ['unlock-keychain', '-p', password, keychain]
  await exec('security', args, options)
}

/**
 * Creat a keychain with the specified name
 * @param keychain The keychain to create; The name should end with .keychain.
 * @param password THe password to unlock with.
 * @param options Execution options (optional)
 */
async function createKeychain(
  keychain: string,
  password: string,
  options: ExecOptions
): Promise<void> {
  const createArgs: string[] = ['create-keychain', '-p', password, keychain]
  await exec('security', createArgs, options)

  // Set automatic keychain lock timeout to 6 hours.
  const setSettingsArgs: string[] = [
    'set-keychain-settings',
    '-lut',
    '21600',
    keychain
  ]
  await exec('security', setSettingsArgs, options)
}

// security verify-cert security find-certificate -c "certificate name here" -p | openssl x509 -text | grep "Not After" -k codesign

export async function pemCertificateFromKeychain(keychain: string): Promise<string> {
  const pemArgs: string[] = [
    'find-certificate',
    '-p',
  ];
  const result = await exec('security', pemArgs, { stdio: 'pipe' });
  return result.output[0];
}

export function throwErrorIfCertificateExpired(certificate: string): void {
  const opensslArgs: string[] = [
    'x509',
    '-text',
  ];
  const result = spawnSync('openssl', opensslArgs, { input: certificate, stdio: 'pipe' });
  const output = String(result.output[1]);
  const expirationDateString = output.match(/Not After : (.*)/)?.[1] ?? '';
  const expirationDate = new Date(expirationDateString);
  const today = new Date();
  const expired = expirationDate < today;
  if (expired) {
    throw new Error(`Certificate expired on ${expirationDate.toISOString()}`);
  }
}
