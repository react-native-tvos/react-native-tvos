import { BuildStepContext, BuildStepEnv, BuildStepOutput } from '@expo/steps';
import { deleteKeychain, installCertIntoTemporaryKeychain } from './security';
import path from 'path';
import { tmpdir } from 'os';
import { promises as fs } from 'fs';

interface ImportCodesignCertsOutputs {
  keychainPassword: BuildStepOutput<true>;
}

/**
 * Installs Ruby for iOS build runners.
 */
async function importCodesignCerts(
  ctx: BuildStepContext,
  {
    outputs,
    env,
  }: {
    outputs: ImportCodesignCertsOutputs;
    env: BuildStepEnv;
  },
) {
  if (env.EAS_BUILD_RUNNER === 'eas-build' && env.EAS_BUILD_PLATFORM !== 'ios') {
    ctx.logger.info('Not an iOS build... Exiting.');
    return;
  }

  await importCodesignCertsForIos(ctx, { outputs, env });

}

async function importCodesignCertsForIos(
  ctx: BuildStepContext,
  {
    outputs,
  }: {
    outputs: ImportCodesignCertsOutputs;
    env: BuildStepEnv;
  },
) {

  const keychainPassword = Math.random().toString(36);

  outputs.keychainPassword.set(keychainPassword);

  const keychain = 'codesigning';
  const createKeychain = true;

  ctx.logger.info('Importing code signing certificates...');
  const p12Identity = process.env.RNCORE_CODE_SIGNING_IDENTITY;
  if (!p12Identity?.length) {
    ctx.logger.error('RNCORE_CODE_SIGNING_IDENTITY must be defined in the EAS environment variables');
    throw new Error('RNCORE_CODE_SIGNING_IDENTITY must be defined in the EAS environment variables');
  }
  const p12FileBase64 = process.env.RNCORE_CODE_SIGNING_P12_BASE64;
  if (!p12FileBase64?.length) {
    ctx.logger.error('RNCORE_CODE_SIGNING_P12_BASE64 must be defined in the EAS environment variables');
    throw new Error('RNCORE_CODE_SIGNING_P12_BASE64 must be defined in the EAS environment variables');
  }
  const p12Password = process.env.RNCORE_CODE_SIGNING_P12_PASSWORD;
  if (!p12Password?.length) {
    ctx.logger.error('RNCORE_CODE_SIGNING_P12_PASSWORD must be defined in the EAS environment variables');
    throw new Error('RNCORE_CODE_SIGNING_P12_PASSWORD must be defined in the EAS environment variables');
  }

  const buffer = Buffer.from(p12FileBase64, 'base64');
  const p12FilePath = path.join(tmpdir(), 'codesigning.p12');
  ctx.logger.info(`Writing ${buffer.length} bytes to ${p12FilePath}`);
  await fs.writeFile(p12FilePath, buffer);
      
  try {
    ctx.logger.info("Deleting any previous codesigning keychain...");
    await deleteKeychain(keychain);
  } catch (e) {
    // This is expected if this is the first time the keychain has been created
    ctx.logger.info("No previous codesigning keychain found. Continuing...");
  }

  try {
    ctx.logger.info("Creating codesigning keychain and installing certificate...");
    const securityResponse = await installCertIntoTemporaryKeychain(
      keychain,
      createKeychain,
      keychainPassword,
      p12FilePath,
      p12Password,
    );
    ctx.logger.info('securityResponse: ' + securityResponse);
    ctx.logger.info('Done.');
  } catch (e) {
    ctx.logger.error('Failed to import code signing certificates: ' + (e as Error).message);
    ctx.logger.error((e as Error).stack);
    throw e;
  }

}

export default importCodesignCerts;
