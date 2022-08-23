import Web3 from 'web3';

import PixelsContract from '../../build/contracts/Pixels.json';
import CollabToken from '../../build/contracts/CollabToken.json';

import dappConfig from '../../dapp-config.json'; // Generated by migrations

import { hexStringToColor } from '@util/helpers';

const config = {
  contracts: {
    pixels: {
      address: dappConfig.PixelsAddress,
      abi: PixelsContract.abi
    },
    token: {
      address: dappConfig.CollabTokenAddress,
      abi: CollabToken.abi
    }
  },
  networks: [{
    id: 5,
    enabled: false,
    default: false,
    chainId: Web3.utils.toHex('5'),
    chainName: 'Goerli Test Network',
    nativeCurrency: {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
    },
    wsUrls: [dappConfig.wsUrl],
    rpcUrls: [dappConfig.httpUrl],
    blockExplorerUrls: ['https://goerli.etherscan.io'],
  }, {
    id: 5777,
    enabled: true,
    default: true,
    chainId: Web3.utils.toHex('5777'),
    chainName: 'Development Test Network',
    nativeCurrency: {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
    },
    wsUrls: ['ws://127.0.0.1:7545'],
    rpcUrls: ['http://127.0.0.1:7545'],
    blockExplorerUrls: ['https://goerli.etherscan.io'],
  }, {
    id: 1,
    name: 'ETH Mainnet',
    symbol: 'Ξ',
    enabled: false
  }],
  defaultPrice: 1,
  subgraph: {
    url: 'https://api.thegraph.com/subgraphs/id/QmRcGm2sWmcXvuUvySGxWpjDb9D3DMgi5LwkxoyeBqawRj'
  },
  events: {
    url: 'https://pixelworld-2e64c.uc.r.appspot.com'
  },
  appConfig: {
    canvasElement: 'app',
    defaultMode: 'select',
    gridSize: 12,
    strokeSize: 0.3,
    strokeColor: '#c1c1c1',
    defaultTileColors: ['#168A33', '#16912A', '#197A21', '#169116', '#208714'],
    supportedColors: ['#93002c', '#c33502', '#c48100', '#c3a428', '#027d4e', '#029d5d', '#60b640', '#005a54', '#007a81', '#1a3f7e', '#2a6fb5', '#3fb4bd', '#382d95', '#5347c4', '#63177b', '#883992', '#c32b62', '#c47583', '#553722', '#77501c', '#000000', '#6a6c70', '#a2a3a6', '#c3c3c3'],
    fps: 30,
    pixelColor: hexStringToColor('#168A33'),
    fillColor: hexStringToColor('#000000')
  },
  slideshow: {
    emailActionText: 'Join',
    keyActionText: 'Enter',
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    subtitle: '<span>Contribute to a living</span> canvas.<br /><span>Become a</span> Creator.', // is HTML
    discordLink: 'https://discord.gg/DKZkG4CnrC',
    articles: [{ // This goes async from server
      icon: 'about.svg',
      title: 'About',
      shortTitle: 'about',
      body: 'Players collectively draw on a shared canvas by changing the color of individual pixels and thus continuously contribute to the emerging global image. The goal is to illustrate the process of self-organization within a community of random players with the help of <a href="https://en.wikipedia.org/wiki/Blockchain" target="_blank">blockchain</a> technology.'
    }, {
      icon: 'ownership.svg',
      title: 'Ownership',
      shortTitle: 'ownership',
      body: 'Each pixel on the canvas is represented by a non-fungible token (NFT) on the <a href="https://ethereum.org/" target="_blank">Ethereum</a> network. Ownership is stored and transferred based on the <a href="https://eips.ethereum.org/EIPS/eip-721" target="_blank">ERC-721</a> standard as most digital art and collectibles. It cannot be taken away or destroyed.'
    }, {
      icon: 'social-dynamic.svg',
      title: 'Social Dynamic',
      shortTitle: 'social',
      body: 'Once a player takes ownership of a pixel he or she can control its color, but also auction it to a different player if an agreement between them is reached. The experiment is decentralized and not controlled by any single actor.'
    }]
  },

  /***
   * 
   * Determents the initial state for game of life intro
   * Grid coordinates are relative to center left
   * 
   * y: {
   *  x: true
   * }
   * 
   */
  intialShapes: {
    'r-pentomino-up': {
      'xPadding': 70,
      '24': {
        26: true,
        27: true
      },
      '25': {
        25: true,
        26: true
      },
      '26': {
        26: true
      }
    },
    'glider': {
      '27': {
        13: true,
        14: true
      },
      '28': {
        12: true,
        16: true
      },
      '29': {
        11: true,
        17: true,
        25: true
      },
      '30': {
        1: true,
        2: true,
        11: true,
        15: true,
        17: true,
        18: true,
        23: true,
        25: true
      },
      '31': {
        1: true,
        2: true,
        11: true,
        17: true,
        21: true,
        22: true
      },
      '32': {
        12: true,
        16: true,
        21: true,
        22: true,
        35: true,
        36: true
      },
      '33': {
        13: true,
        14: true,
        21: true,
        22: true,
        35: true,
        36: true
      },
      '34': {
        23: true,
        25: true
      },
      '35': {
        25: true
      }
    },
    'simkin': {
      'xPadding': 80,
      '-17': {
        2: true,
        3: true,
        9: true,
        10: true
      },
      '-18': {
        2: true,
        3: true,
        9: true,
        10: true
      },
      '-20': {
        6: true,
        7: true
      },
      '-21': {
        6: true,
        7: true
      },
      '-26': {
        24: true,
        25: true,
        27: true,
        28: true
      },
      '-27': {
        23: true,
        29: true
      },
      '-28': {
        23: true,
        30: true,
        33: true,
        34: true
      },
      '-29': {
        23: true,
        24: true,
        25: true,
        29: true,
        33: true,
        34: true
      },
      '-30': {
        28: true
      },
      '-34': {
        22: true,
        23: true
      },
      '-35': {
        22: true
      },
      '-36': {
        23: true,
        24: true,
        25: true
      },
      '-37': {
        25: true
      }
    },
    'r-pentomino-down': {
      '-27': {
        26: true,
        27: true
      },
      '-28': {
        25: true,
        26: true
      },
      '-29': {
        26: true
      }
    },
    'figure8': {
      '10': {
        6: true,
        7: true,
        8: true
      },
      '11': {
        6: true,
        7: true,
        8: true
      },
      '12': {
        6: true,
        7: true,
        8: true
      },
      '13': {
        3: true,
        4: true,
        5: true
      },
      '14': {
        3: true,
        4: true,
        5: true
      },
      '15': {
        3: true,
        4: true,
        5: true
      }
    }
  },
  intialGameState: {
    'contribute': {
      'max-length': 46,

      // Canvas
      '-9': {
        0: true,
        1: true,
        2: true,
        4: true,
        7: true,
        9: true,
        12: true,
        15: true,
        16: true,
        19: true,
        22: true,
        24: true,
        25: true,
        26: true,
        27: true,
        29: true
      },
      '-8': {
        0: true,
        4: true,
        7: true,
        9: true,
        12: true,
        14: true,
        17: true,
        19: true,
        22: true,
        27: true
      },
      '-7': {
        0: true,
        4: true,
        5: true,
        6: true,
        7: true,
        9: true,
        11: true,
        12: true,
        14: true,
        17: true,
        19: true,
        20: true,
        21: true,
        22: true,
        24: true,
        25: true,
        26: true,
        27: true
      },
      '-6': {
        0: true,
        4: true,
        7: true,
        9: true,
        10: true,
        12: true,
        14: true,
        17: true,
        19: true,
        22: true,
        24: true
      },
      '-5': {
        0: true,
        1: true,
        2: true,
        4: true,
        5: true,
        6: true,
        7: true,
        9: true,
        12: true,
        14: true,
        17: true,
        19: true,
        20: true,
        21: true,
        22: true,
        24: true,
        25: true,
        26: true,
        27: true
      },

      // To a living
      '-2': {
        2: true,
        6: true,
        7: true,
        8: true,
        9: true,
        13: true,
        16: true,
        20: true,
        21: true,
        22: true,
        23: true,
        25: true,
        28: true,
        29: true,
        32: true,
        34: true,
        37: true,
        39: true,
        40: true,
        41: true,
        42: true
      },
      '-1': {
        2: true,
        6: true,
        9: true,
        13: true,
        16: true,
        20: true,
        25: true,
        27: true,
        30: true,
        32: true,
        34: true,
        37: true,
        39: true,
        42: true
      },
      '0': {
        2: true,
        6: true,
        9: true,
        13: true,
        14: true,
        15: true,
        16: true,
        20: true,
        25: true,
        27: true,
        30: true,
        32: true,
        34: true,
        36: true,
        37: true,
        39: true,
        41: true,
        42: true
      },
      '1': {
        2: true,
        6: true,
        9: true,
        13: true,
        16: true,
        20: true,
        25: true,
        27: true,
        30: true,
        32: true,
        34: true,
        35: true,
        37: true,
        39: true
      },
      '2': {
        0: true,
        1: true,
        2: true,
        3: true,
        4: true,
        6: true,
        7: true,
        8: true,
        9: true,
        13: true,
        14: true,
        15: true,
        16: true,
        20: true,
        25: true,
        27: true,
        30: true,
        32: true,
        34: true,
        37: true,
        39: true,
        40: true,
        41: true,
        42: true
      },

      // Contribute
      '5': {
        0: true,
        1: true,
        2: true,
        4: true,
        5: true,
        6: true,
        7: true,
        9: true,
        12: true,
        16: true,
        20: true,
        23: true,
        25: true,
        27: true,
        28: true,
        29: true,
        30: true,
        32: true,
        33: true,
        34: true,
        35: true,
        39: true,
        43: true,
        44: true,
        45: true,
        46: true,
      },
      '6': {
        0: true,
        4: true,
        7: true,
        9: true,
        12: true,
        16: true,
        20: true,
        21: true,
        22: true,
        25: true,
        27: true,
        30: true,
        32: true,
        35: true,
        39: true,
        43: true
      },
      '7': {
        0: true,
        4: true,
        7: true,
        9: true,
        11: true,
        12: true,
        16: true,
        20: true,
        21: true,
        22: true,
        23: true,
        25: true,
        27: true,
        28: true,
        29: true,
        30: true,
        32: true,
        35: true,
        39: true,
        43: true,
        44: true,
        45: true
      },
      '8': {
        0: true,
        4: true,
        7: true,
        9: true,
        10: true,
        12: true,
        16: true,
        20: true,
        23: true,
        25: true,
        27: true,
        30: true,
        32: true,
        35: true,
        39: true,
        43: true
      },
      '9': {
        0: true,
        1: true,
        2: true,
        4: true,
        5: true,
        6: true,
        7: true,
        9: true,
        12: true,
        14: true,
        15: true,
        16: true,
        17: true,
        18: true,
        20: true,
        21: true,
        22: true,
        23: true,
        25: true,
        27: true,
        28: true,
        29: true,
        30: true,
        32: true,
        35: true,
        37: true,
        38: true,
        39: true,
        40: true,
        41: true,
        43: true,
        44: true,
        45: true,
        46: true
      }
    }
  }
}

export default config;