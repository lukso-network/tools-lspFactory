<p align="center">
 <h1 align="center"><strong>@lukso/lsp-factory.js<br>Deprecated: The development of this library is currently put on hold, please use the <a href="https://github.com/lukso-network/lsp-smart-contracts">LSP-smart-contracts</a> directly</strong></h1>
 <p align="center">Helper library to allow simple deployments of <a href="https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-0-ERC725Account.md">UniversalProfiles</a> and <a href="https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-4-DigitalCertificate.md">LSP7</a> and <a href="https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-8-IdentifiableDigitalAsset.md">LSP8 </a>Digital Assets.</p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lukso/lsp-factory.js">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@lukso/lsp-factory.js.svg?style=flat" />
  </a>
  <a href="https://github.com/lukso-network/tools-lsp-factory/actions">
    <img alt="Tests Passing" src="https://github.com/lukso-network/tools-lsp-factory/actions/workflows/lint-build-test.yml/badge.svg" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/lukso-network/tools-lsp-factory/pulls">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" />
  </a>
  <a href="https://github.com/lukso-network/tools-lsp-factory/issues">
    <img alt="Issues" src="https://img.shields.io/github/issues/lukso-network/tools-lsp-factory?color=0088ff" />
  </a>
  <a href="https://github.com/lukso-network/tools-lsp-factory/pulls">
    <img alt="GitHub pull requests" src="https://img.shields.io/github/issues-pr/lukso-network/tools-lsp-factory?color=0088ff" />
  </a>
</p>

<p align="center">For more information see <a href="https://docs.lukso.tech/tools/lsp-factoryjs/getting-started">Documentation</a>.</p>

## Install

```bash
npm install @lukso/lsp-factory.js
```

## Setup

```javascript
import { LSPFactory } from '@lukso/lsp-factory.js';

const provider = 'https://rpc.testnet.lukso.network'; // RPC url used to connect to the network

const lspFactory = new LSPFactory(provider, {
  deployKey: '0x...'; // Private key of the account which will deploy UPs
  chainId: 2828, // Chain Id of the network you want to connect to
});
```

## Usage

### Deploying an ERC725Account (Universal Profile)

```javascript
// Deploy LSP3 Account
const myContracts = await lspFactory.UniversalProfile.deploy({
  controllerAddresses: ['0x...'], // Address which will controll the UP
  lsp3Profile: {
    name: 'My Universal Profile',
    description: 'My cool Universal Profile',
    profileImage: [
      {
        width: 500,
        height: 500,
        verification: {
          method: 'keccak256(bytes)',
          data: '0xfdafad027ecfe57eb4ad047b938805d1dec209d6e9f960fc320d7b9b11cbed14',
        },
        url: 'ipfs://QmPLqMFHxiUgYAom3Zg4SiwoxDaFcZpHXpCmiDzxrtjSGp',
      },
    ],
    backgroundImage: [
      {
        width: 500,
        height: 500,
        verification: {
          method: 'keccak256(bytes)',
          data: '0xfdafad027ecfe57eb4ad047b938805d1dec209d6e9f960fc320d7b9b11cbed14',
        },
        url: 'ipfs://QmPLqMFHxiUgYAom3Zg4SiwoxDaFcZpHXpCmiDzxrtjSGp',
      },
    ],
    tags: ['Fashion', 'Design'],
    links: [{ title: 'My Website', url: 'www.my-website.com' }],
  },
});

const myUPAddress = myContracts.LSP0ERC725Account.address;
```

### Using Deployment events

The `onDeployEvents` option can be used to for real-time frontend updates.

```javascript
const profileDeploymentEvents = [];

const myContracts = await lspFactory.UniversalProfile.deploy(
  {
    controllerAddresses: ['0x...'], // Address which will controll the UP
  },
  {
    onDeployEvents: {
      next: (deploymentEvent: DeploymentEvent) => {
        profileDeploymentEvents.push(deploymentEvent);
      },
      error: (error) => {
        console.error(error);
      },
      complete: () => {
        console.log(profileDeploymentEvents);
      },
    },
  }
);
```

## Contributing

Please check [CONTRIBUTING](./CONTRIBUTING.md).

### License

lsp-factory.js is [Apache 2.0 licensed](./LICENSE).
