/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build:main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import keytar from 'keytar';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
global.fetch = require('node-fetch');

import { Account } from '../ts-client-library/packages/account-management';
import {
  WebAccountMiddleware,
  WebNetworkMiddleware,
} from '../ts-client-library/packages/middleware-web';
import { hexToBytes } from '../ts-client-library/packages/util/src/hex';
import { STORAGE_NODE as storageNode } from './config';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */
ipcMain.on('login:restore', async (e) => {
  let password = await keytar.getPassword('Opacity', 'Handle');
  if (password) {
    // mainWindow.webContents.send('login:success');
    // await setAccount(password);
    // refreshFolder('/');
  }
});

ipcMain.on('handle:set', async (e, handleObject) => {
  try {
    if (handleObject.handle.length !== 128) {
      throw Error("Then handle doesn't have the right length of 128 signs.");
    }

    console.log('HANDLE SET');

    const cryptoMiddleware = new WebAccountMiddleware({
      asymmetricKey: hexToBytes(handleObject.handle),
    });
    const netMiddleware = new WebNetworkMiddleware();
    const account = new Account({
      crypto: cryptoMiddleware,
      net: netMiddleware,
      storageNode,
    });
    account
      .info()
      .then((acc) => {
        if (acc.account.apiVersion !== 2) {
          console.log('This handle is old. Please Upgrade it.');
          return;
        }
        if (acc.paymentStatus === 'paid') {
          localStorage.setItem('key', handleObject.handle);
          mainWindow?.webContents.send('login:success');
          console.log('Success');
        }
      })
      .catch((err: Error) => {
        const account = new Account({
          crypto: cryptoMiddleware,
          net: netMiddleware,
          storageNode: storageNode,
        });
        account
          .needsMigration()
          .then((res) => {
            if (res) {
              console.log('This handle is old. Please Upgrade it.');
              return;
            }
          })
          .catch((error: Error) => {
            console.log('Error:', error.message);
          });
      });

    // await setAccount(handleObject.handle);
    // Call this function before saving the handle to see if the entered handle is correct
    // eg. mixed up letters etc.
    // await refreshFolder('/');

    if (handleObject.saveHandle) {
      // save handle to keyring
      keytar.setPassword('Opacity', 'Handle', handleObject.handle);
    }

    // mainWindow?.webContents.send('login:success');
  } catch (err) {
    mainWindow?.webContents.send('login:failed', { error: err.message });
  }
});

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(createWindow).catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});
