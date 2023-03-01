import Web3 from 'web3';

import CollabCanvas from '../abis/CollabCanvas.json';
import CollabToken from '../abis/CollabToken.json';

import dappConfig from '@root/config.json';

import { hexStringToColor } from '@util/helpers';

const config = {
  contracts: {
    canvas: {
      address: dappConfig.CollabCanvasAddress,
      abi: CollabCanvas
    },
    token: {
      address: dappConfig.CollabTokenAddress,
      abi: CollabToken
    }
  },
  sentry: 'https://f9d304aeac7c49128f6e3a45d75b655c@o4504758107570176.ingest.sentry.io/4504758109011968',
  networks: [{
    id: 137,
    enabled: true,
    default: true,
    chainId: Web3.utils.toHex('137'),
    chainName: 'Polygon Mainnet',
    nativeCurrency: {
      symbol: 'MATIC',
      name: 'Polygon',
      decimals: 18,
    },
    wsUrls: [dappConfig.wsUrl],
    rpcUrls: ['https://polygon-rpc.com/'],
    blockExplorerUrl: 'https://polygonscan.com/',
  }, {
    id: 80001,
    enabled: false,
    default: false,
    chainId: Web3.utils.toHex('80001'),
    chainName: 'Polygon Testnet',
    nativeCurrency: {
      symbol: 'tMATIC',
      name: 'Mumbai',
      decimals: 18,
    },
    wsUrls: [dappConfig.wsUrl],
    rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
    blockExplorerUrl: 'https://mumbai.polygonscan.com/',
  }, {
    id: 5,
    enabled: false,
    default: false,
    chainId: Web3.utils.toHex('5'),
    chainName: 'Goerli Testnet',
    nativeCurrency: {
      symbol: 'GöETH',
      name: 'Ethereum',
      decimals: 18,
    },
    wsUrls: [dappConfig.wsUrl],
    rpcUrls: [dappConfig.httpUrl],
    blockExplorerUrl: 'https://goerli.etherscan.io',
  }, {
    id: 5777,
    enabled: false,
    default: false,
    chainId: Web3.utils.toHex('5777'),
    chainName: 'Development Testnet',
    nativeCurrency: {
      symbol: 'DevETH',
      name: 'Ethereum',
      decimals: 18,
    },
    wsUrls: ['ws://127.0.0.1:7545'],
    rpcUrls: ['http://127.0.0.1:7545'],
    blockExplorerUrl: 'https://goerli.etherscan.io',
  }, {
    id: 1,
    name: 'ETH Mainnet',
    symbol: 'Ξ',
    enabled: false
  }],
  firebaseConfig: {
    apiKey: "AIzaSyDGLHnM6CRDaMYoj6lePMqGcaGHAtnD83U",
    authDomain: "collabsart.firebaseapp.com",
    projectId: "collabsart",
    storageBucket: "collabsart.appspot.com",
    messagingSenderId: "25720990970",
    appId: "1:25720990970:web:9a09435d465ff402442d43",
    measurementId: "G-M2298SCQ2L"
  },
  defaultMinUnit: Web3.utils.toWei('1'),
  subgraph: {
    url: 'https://api.thegraph.com/subgraphs/id/QmQhaaEyK6YVj9UN57yPGSt9Gcreazz8My3Jz92rqPmE5K' //'https://api.studio.thegraph.com/query/9304/collabs-mumbai/v0.0.1' //'https://api.studio.thegraph.com/query/9304/collabs-testnet/v1.0.1'
  },
  api: {
    getImage: 'https://getimage-pgm7g5cugq-uc.a.run.app', // 'assets/images/place.png', //
    permit: 'https://permit-pgm7g5cugq-uc.a.run.app'
  },
  appConfig: {
    canvasElement: 'app',
    defaultMode: 'select',
    gridSize: 12,
    strokeSize: 0.3,
    strokeColor: '#c1c1c1',
    gameOfLifeTileColors: ['#692fcc', '#733ad3', '#7236d7'], //['#168A33', '#16912A', '#197A21', '#169116', '#208714'],
    supportedColors: ['#93002c', '#c33502', '#c48100', '#c3a428', '#027d4e', '#029d5d', '#60b640', '#005a54', '#007a81', '#1a3f7e', '#2a6fb5', '#3fb4bd', '#382d95', '#5347c4', '#63177b', '#883992', '#c32b62', '#c47583', '#553722', '#77501c', '#000000', '#6a6c70', '#a2a3a6', '#c3c3c3'],
    fps: 30,
    pixelColor: hexStringToColor('#168A33'),
    fillColor: hexStringToColor('#000000'),
    processingMsg: '<i class="gg-loadbar-alt"></i>&nbsp;&nbsp; Processing Tx ..',
    defaultNotificationTime: 5000,
    btnColors: ['green', 'orange', 'blue', 'white'],
    btnIcons: ['ethereum-logo', 'link', 'info-text'],
    docsLink: 'https://www.notion.so/Collabs-0c8e5af1deee4b6982b1c70fd354c9fc',
    docs: {
      link: 'https://www.notion.so/Collabs-0c8e5af1deee4b6982b1c70fd354c9fc',
      getColabLink: "https://www.notion.so/collabsart/Collabs-0c8e5af1deee4b6982b1c70fd354c9fc#502e4f2338344a3b8bdd6f903470dd3b",
      auctionLifecycleLink: "https://www.notion.so/collabsart/Auction-Lifecycle-efd602f095e14de690af4f77600e1e04",
      coloringPixelsLink: "https://www.notion.so/collabsart/Coloring-pixels-0fc42efade074114b823c67ff5874fd2"
    },
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
      body: 'A social game where players collaborate on a shared canvas by changing the color of individual pixels. The goal is to illustrate the process of self-organization within a community of random players with the help of blockchain technology.' // A social experiment where players collectively draw on a shared canvas by changing the color of individual pixels and thus continuously contribute to the emerging global image. 
    }, {
      icon: 'ownership.svg',
      title: 'Ownership',
      shortTitle: 'ownership',
      body: 'Pixel colors are stored in a smart contract on the Ethereum network. Players can overwrite an existing\'s pixels color using their $COLAB tokens. The required amount is determent by previous bids placed on the same position.'
    }, {
      icon: 'social-dynamic.svg',
      title: 'Social Dynamic',
      shortTitle: 'social',
      body: 'Every month a snapshot of the canvas is auctioned as a non-fungible token (NFT). The proceeds (ETH) are exchanged for $COLAB and distributed between the participants based on how much pixels they have colored.'
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