import { promises as fs } from 'fs';
import path from 'path';
import { deleteKeychain, installCertIntoTemporaryKeychain, pemCertificateFromKeychain, throwErrorIfCertificateExpired } from "./common/appleSecurityUtils";
import { tmpdir } from 'os';

async function executeScriptAsync() {

  const keychainPassword = Math.random().toString(36);

  const keychain = 'codesigning';
  const createKeychain = true;

  console.log('Importing code signing certificates...');
  const p12Identity = process.env.RNCORE_CODE_SIGNING_IDENTITY;
  if (!p12Identity?.length) {
    console.error('RNCORE_CODE_SIGNING_IDENTITY must be defined in the EAS environment variables');
    throw new Error('RNCORE_CODE_SIGNING_IDENTITY must be defined in the EAS environment variables');
  }
  const p12FileBase64 = process.env.RNCORE_CODE_SIGNING_P12_BASE64;
  if (!p12FileBase64?.length) {
    console.error('RNCORE_CODE_SIGNING_P12_BASE64 must be defined in the EAS environment variables');
    throw new Error('RNCORE_CODE_SIGNING_P12_BASE64 must be defined in the EAS environment variables');
  }
  const p12Password = process.env.RNCORE_CODE_SIGNING_P12_PASSWORD;
  if (!p12Password?.length) {
    console.error('RNCORE_CODE_SIGNING_P12_PASSWORD must be defined in the EAS environment variables');
    throw new Error('RNCORE_CODE_SIGNING_P12_PASSWORD must be defined in the EAS environment variables');
  }

  const buffer = Buffer.from(p12FileBase64, 'base64');
  const p12FilePath = path.join(tmpdir(), 'codesigning.p12');
  console.info(`Writing ${buffer.length} bytes to ${p12FilePath}`);
  await fs.writeFile(p12FilePath, buffer);
      
  try {
    console.info("Deleting any previous codesigning keychain...");
    await deleteKeychain(keychain);
  } catch (e) {
    // This is expected if this is the first time the keychain has been created
    console.info("No previous codesigning keychain found. Continuing...");
  }

  try {
    console.info("Creating codesigning keychain and installing certificate...");
    const securityResponse = await installCertIntoTemporaryKeychain(
      keychain,
      createKeychain,
      keychainPassword,
      p12FilePath,
      p12Password,
    );
    console.info('securityResponse: ' + securityResponse);
    const pemCertificate = await pemCertificateFromKeychain(keychain);
    console.info('Verifying that certificate is not expired...');
    throwErrorIfCertificateExpired(pemCertificate);
    console.info('Done.');
  } catch (e) {
    console.error('Failed to import code signing certificates: ' + (e as Error).message);
    console.error((e as Error).stack);
    throw e;
  }

}

executeScriptAsync();
