import {
  app,
  Menu,
  shell,
  BrowserWindow,
  MenuItemConstructorOptions,
} from 'electron';

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
  selector?: string;
  submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu(): Menu {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      this.setupDevelopmentEnvironment();
    }

    const template =
      process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment(): void {
    this.mainWindow.webContents.on('context-menu', (_, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.webContents.inspectElement(x, y);
          },
        },
      ]).popup({ window: this.mainWindow });
    });
  }

  buildDarwinTemplate(): MenuItemConstructorOptions[] {
    const subMenuOpacity: DarwinMenuItemConstructorOptions = {
      label: 'Opacity',
      submenu: [
        {
          label: 'About Opacity',
          //selector: 'orderFrontStandardAboutPanel:',
          click: () => {
            this.mainWindow.webContents.send('about-panel');
          },
        },
        { type: 'separator' },
        { label: 'Preferences', submenu: [{ label: 'Save Account Handle' }] },
        { type: 'separator' },
        {
          label: 'Quit Opacity',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    };
    const subMenuFile: DarwinMenuItemConstructorOptions = {
      label: 'File',
      submenu: [
        {
          label: 'New Folder',
          //accelerator: 'Command+N',
          click: () => {
            this.mainWindow.webContents.send('new-folder');
          },
        },
        {
          label: 'Upload File(s)',
          click: () => {
            this.mainWindow.webContents.send('upload-file');
          },
        },
        { type: 'separator' },
        {
          label: 'Upload Folder(s)',
          click: () => {
            this.mainWindow.webContents.send('upload-folder');
          },
        },
        {
          label: 'Share',
          submenu: [{ label: 'Private Share' }, { label: 'Public Share' }],
        },
        {
          label: 'Download',
          click: () => {
            this.mainWindow.webContents.send('download-file');
          },
        },
        {
          label: 'Rename',
          click: () => {
            this.mainWindow.webContents.send('rename-file');
          },
        },
        {
          label: 'Logout',
          click: () => {
            this.mainWindow.webContents.send('logout-app');
          },
        },
      ],
    };

    const subMenuEdit: DarwinMenuItemConstructorOptions = {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+Command+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'Command+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'Command+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'Command+V', selector: 'paste:' },
        {
          label: 'Delete',
        },
      ],
    };
    const subMenuViewDev: MenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: 'as List',
          click: () => {
            this.mainWindow.webContents.reload();
          },
        },
        {
          label: 'as Gallery',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
      ],
    };
    const subMenuHelp: MenuItemConstructorOptions = {
      label: 'Help',
      submenu: [
        {
          label: 'Opacity Helper',
          click() {
            shell.openExternal('https://help.opacity.io/help');
          },
        },
      ],
    };

    // const subMenuView =
    //   process.env.NODE_ENV === 'development' ||
    //   process.env.DEBUG_PROD === 'true'
    //     ? subMenuViewDev
    //     : subMenuViewProd;

    return [
      subMenuOpacity,
      subMenuFile,
      subMenuEdit,
      subMenuViewDev,
      subMenuHelp,
    ];
  }

  buildDefaultTemplate() {
    const templateDefault = [
      {
        label: 'Opacity',
        submenu: [
          {
            label: 'About Opacity',
            //selector: 'orderFrontStandardAboutPanel:',
            click: () => {
              this.mainWindow.webContents.send('about-panel');
            },
          },
          { type: 'separator' },
          { label: 'Preferences', submenu: [{ label: 'Save Account Handle' }] },
          { type: 'separator' },
          {
            label: 'Quit Opacity',
            accelerator: 'Command+Q',
            click: () => {
              app.quit();
            },
          },
        ],
      },
      {
        label: 'File',
        submenu: [
          {
            label: 'New Folder',
            //accelerator: 'Command+N',
            click: () => {
              this.mainWindow.webContents.send('new-folder');
            },
          },
          {
            label: 'Upload File(s)',
            click: () => {
              this.mainWindow.webContents.send('upload-file');
            },
          },
          { type: 'separator' },
          {
            label: 'Upload Folder(s)',
            click: () => {
              this.mainWindow.webContents.send('upload-folder');
            },
          },
          {
            label: 'Share',
            submenu: [{ label: 'Private Share' }, { label: 'Public Share' }],
          },
          {
            label: 'Download',
            click: () => {
              this.mainWindow.webContents.send('download-file');
            },
          },
          {
            label: 'Rename',
            click: () => {
              this.mainWindow.webContents.send('rename-file');
            },
          },
          {
            label: 'Logout',
            click: () => {
              this.mainWindow.webContents.send('logout-app');
            },
          },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:' },
          { label: 'Redo', accelerator: 'Shift+Command+Z', selector: 'redo:' },
          { type: 'separator' },
          { label: 'Cut', accelerator: 'Command+X', selector: 'cut:' },
          { label: 'Copy', accelerator: 'Command+C', selector: 'copy:' },
          { label: 'Paste', accelerator: 'Command+V', selector: 'paste:' },
          {
            label: 'Delete',
          },
        ],
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'as List',
            click: () => {
              this.mainWindow.webContents.reload();
            },
          },
          {
            label: 'as Gallery',
            accelerator: 'Ctrl+Command+F',
            click: () => {
              this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
            },
          },
        ],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Opacity Helper',
            click() {
              shell.openExternal('https://help.opacity.io/help');
            },
          },
        ],
      },
    ];

    return templateDefault;
    //return [];
  }
}
