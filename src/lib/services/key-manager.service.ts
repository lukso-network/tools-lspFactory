import { ContractFactory, Signer } from 'ethers';
import { concat, EMPTY, forkJoin, from, Observable } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';

import { LSP6KeyManager__factory, LSP6KeyManagerInit__factory } from '../..';
import {
  deployContract,
  deployProxyContract,
  getContractAddressFromReceipt,
  getContractAddressFromReceipt$,
  initialize,
  waitForReceipt,
} from '../helpers/deployment.helper';
import {
  BaseContractAddresses,
  ContractNames,
  DeploymentEventContract,
  DeploymentEventProxyContract,
} from '../interfaces';

import { LSP3AccountDeploymentEvent } from './universal-profile.service';

export type KeyManagerDeploymentEvent = DeploymentEventContract;

export function keyManagerDeployment$(
  signer: Signer,
  accountDeployment$: Observable<LSP3AccountDeploymentEvent>,
  baseContractAddress$: Observable<BaseContractAddresses>,
  isSignerUniversalProfile$: Observable<boolean>,
  byteCode?: string
): Observable<KeyManagerDeploymentEvent> {
  return forkJoin([accountDeployment$, baseContractAddress$, isSignerUniversalProfile$]).pipe(
    switchMap(
      ([{ receipt: lsp3AccountReceipt }, baseContractAddress, isSignerUniversalProfile]) => {
        const erc725AccountAddress = getContractAddressFromReceipt(
          lsp3AccountReceipt,
          isSignerUniversalProfile
        );

        return keyManagerDeploymentForAccount$(
          signer,
          erc725AccountAddress,
          baseContractAddress.LSP6KeyManager,
          isSignerUniversalProfile$,
          byteCode
        );
      }
    ),
    shareReplay()
  );
}

function keyManagerDeploymentForAccount$(
  signer: Signer,
  erc725AccountAddress: string,
  baseContractAddress: string,
  isSignerUniversalProfile$: Observable<boolean>,
  byteCode?: string
): Observable<KeyManagerDeploymentEvent> {
  const keyManagerDeployment$ = from(
    deployKeyManager(signer, erc725AccountAddress, baseContractAddress, byteCode)
  ).pipe(shareReplay());

  const keyManagerDeploymentReceipt$ = waitForReceipt<KeyManagerDeploymentEvent>(
    keyManagerDeployment$
  ).pipe(shareReplay());

  const keyManagerInitialize$ = baseContractAddress
    ? initializeProxy(
        signer,
        keyManagerDeploymentReceipt$ as Observable<DeploymentEventProxyContract>,
        erc725AccountAddress,
        isSignerUniversalProfile$
      )
    : EMPTY;

  const keyManagerInitializeReceipt$ =
    waitForReceipt<KeyManagerDeploymentEvent>(keyManagerInitialize$);

  return concat(
    keyManagerDeployment$,
    keyManagerDeploymentReceipt$,
    keyManagerInitialize$,
    keyManagerInitializeReceipt$
  );
}
/**
 * Deploys KeyManager contract for a UniversalProfile
 *
 * @param {Signer} signer
 * @param {string} lsp3AccountAddress
 * @param {string} baseContractAddress
 *
 * @return {*} Promise<DeploymentEventStandardContract>
 */
export async function deployKeyManager(
  signer: Signer,
  lsp3AccountAddress: string,
  baseContractAddress: string,
  byteCode?: string
) {
  const deploymentFunction = async () => {
    if (baseContractAddress) {
      return new LSP6KeyManagerInit__factory(signer).attach(baseContractAddress);
    }

    if (byteCode) {
      return new ContractFactory(LSP6KeyManager__factory.abi, byteCode, signer).deploy(
        lsp3AccountAddress
      );
    }

    return await new LSP6KeyManager__factory(signer).deploy(lsp3AccountAddress, {
      gasLimit: 3_000_000,
    });
  };

  return baseContractAddress
    ? deployProxyContract(
        LSP6KeyManagerInit__factory.abi,
        deploymentFunction,
        ContractNames.KEY_MANAGER,
        signer
      )
    : deployContract(deploymentFunction, ContractNames.KEY_MANAGER);
}

function initializeProxy(
  signer: Signer,
  keyManagerDeploymentReceipt$: Observable<DeploymentEventProxyContract>,
  accountAddress: string,
  isSignerUniversalProfile$: Observable<boolean>
) {
  const keyManagerAddress$ = getContractAddressFromReceipt$(
    keyManagerDeploymentReceipt$,
    isSignerUniversalProfile$
  );

  return initialize(
    keyManagerDeploymentReceipt$,
    new LSP6KeyManagerInit__factory(signer),
    async () => {
      return [accountAddress];
    },
    'initialize(address)',
    keyManagerAddress$
  );
}
