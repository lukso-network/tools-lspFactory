import { ContractFactory, providers, Signer } from 'ethers';
import { concat, EMPTY, forkJoin, from, Observable } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';

import {
  DeploymentEventContract,
  DeploymentEventProxyContract,
  LSP1UniversalReceiverDelegateUP__factory,
} from '../..';
import { NULL_ADDRESS } from '../helpers/config.helper';
import {
  deployContract,
  deployProxyContract,
  getDeployedByteCode,
  waitForReceipt,
} from '../helpers/deployment.helper';
import { BaseContractAddresses, ContractNames } from '../interfaces';

export type UniversalReveiverDeploymentEvent =
  | DeploymentEventContract
  | DeploymentEventProxyContract;

export function universalReceiverDelegateDeployment$(
  signer: Signer,
  provider: providers.Web3Provider | providers.JsonRpcProvider,
  baseContractAddresses$: Observable<BaseContractAddresses>,
  providedUniversalReceiverAddress?: string,
  defaultUniversalReceiverAddress?: string,
  byteCode?: string
) {
  const defaultURDBytecode$ = from(
    getDeployedByteCode(defaultUniversalReceiverAddress ?? NULL_ADDRESS, provider)
  );

  return forkJoin([defaultURDBytecode$, baseContractAddresses$]).pipe(
    switchMap(([defaultURDBytecode, baseContractAddresses]) => {
      if (baseContractAddresses.LSP1UniversalReceiverDelegate || byteCode) {
        return universalReceiverDelegateDeploymentWithBaseContractAddress$(
          signer,
          baseContractAddresses.LSP1UniversalReceiverDelegate,
          byteCode
        );
      }

      if (providedUniversalReceiverAddress || defaultURDBytecode !== '0x') {
        return EMPTY;
      }

      return universalReceiverDelegateDeploymentWithBaseContractAddress$(signer);
    }),
    shareReplay()
  );
}

export function universalReceiverDelegateDeploymentWithBaseContractAddress$(
  signer: Signer,
  baseContractAddress?: string,
  byteCode?: string
): Observable<UniversalReveiverDeploymentEvent> {
  const universalReceiverDelegateDeployment$ = from(
    deployUniversalReceiverDelegate(signer, baseContractAddress, byteCode)
  ).pipe(shareReplay());

  const universalReceiverDelegateStoreReceipt$ = waitForReceipt<UniversalReveiverDeploymentEvent>(
    universalReceiverDelegateDeployment$
  );

  return concat(universalReceiverDelegateDeployment$, universalReceiverDelegateStoreReceipt$);
}

/**
 * Deploys a UniversalReceiverDelegate contract
 *
 * Returns a DeploymentEvent Promise
 *
 * @param {Signer} signer
 * @param {string} baseContractAddress
 * @return {*}  Promise<DeploymentEventStandardContract | DeploymentEventProxyContract>
 * @memberof UniversalProfile
 */
export async function deployUniversalReceiverDelegate(
  signer: Signer,
  baseContractAddress: string,
  bytecode?: string
) {
  const deploymentFunction = async () => {
    if (baseContractAddress) {
      return new LSP1UniversalReceiverDelegateUP__factory(signer).attach(baseContractAddress);
    }

    if (bytecode) {
      return new ContractFactory(
        LSP1UniversalReceiverDelegateUP__factory.abi,
        bytecode,
        signer
      ).deploy();
    }

    return await new LSP1UniversalReceiverDelegateUP__factory(signer).deploy({
      gasLimit: 3_000_000,
    });
  };

  return baseContractAddress
    ? deployProxyContract(
        LSP1UniversalReceiverDelegateUP__factory.abi,
        deploymentFunction,
        ContractNames.UNIVERSAL_RECEIVER,
        signer
      )
    : deployContract(deploymentFunction, ContractNames.UNIVERSAL_RECEIVER);
}
