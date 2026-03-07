const { app, BrowserWindow, shell, Tray, Menu, nativeImage, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// ─── CONFIGURATION ────────────────────────────────────────────

const APP_URL = process.env.DIAMONDDRAFT_URL || 'https://diamonddraft-production.up.railway.app';
const DEV_URL = 'http://localhost:5173';
const isDev = process.env.NODE_ENV === 'development';

let mainWindow = null;
let splashWindow = null;
let tray = null;

// ─── AUTO UPDATER ─────────────────────────────────────────────

function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('[Updater] Checking for updates...');
    if (splashWindow) {
      splashWindow.webContents.executeJavaScript(
        'document.getElementById("status").textContent = "Checking for updates..."'
      ).catch(() => {});
    }
  });

  autoUpdater.on('update-available', (info) => {
    console.log(`[Updater] Update available: v${info.version}`);
    if (splashWindow) {
      splashWindow.webContents.executeJavaScript(
        `document.getElementById("status").textContent = "Downloading update v${info.version}..."`
      ).catch(() => {});
    }
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[Updater] App is up to date');
    if (splashWindow) {
      splashWindow.webContents.executeJavaScript(
        'document.getElementById("status").textContent = "Loading DiamondDraft..."'
      ).catch(() => {});
    }
    launchMainWindow();
  });

  autoUpdater.on('download-progress', (progress) => {
    const pct = Math.round(progress.percent);
    console.log(`[Updater] Download progress: ${pct}%`);
    if (splashWindow) {
      splashWindow.webContents.executeJavaScript(`
        document.getElementById("status").textContent = "Downloading update... ${pct}%";
        document.getElementById("progress-bar").style.width = "${pct}%";
      `).catch(() => {});
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log(`[Updater] Update downloaded: v${info.version}`);
    if (splashWindow) {
      splashWindow.webContents.executeJavaScript(
        'document.getElementById("status").textContent = "Update ready! Restarting..."'
      ).catch(() => {});
    }

    // Show notification and restart
    dialog.showMessageBox({
      type: 'info',
      title: 'DiamondDraft Update',
      message: `Version ${info.version} has been downloaded.`,
      detail: 'The app will restart to apply the update.',
      buttons: ['Restart Now'],
    }).then(() => {
      autoUpdater.quitAndInstall(false, true);
    });
  });

  autoUpdater.on('error', (err) => {
    console.error('[Updater] Error:', err.message);
    // Continue to main window even if update check fails
    launchMainWindow();
  });
}

// ─── SPLASH SCREEN ────────────────────────────────────────────

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 360,
    frame: false,
    transparent: true,
    resizable: false,
    center: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.on('closed', () => { splashWindow = null; });
}

// ─── MAIN WINDOW ──────────────────────────────────────────────

function launchMainWindow() {
  if (mainWindow) return;

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'DiamondDraft',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false,
    backgroundColor: '#0A1628',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the app
  const url = isDev ? DEV_URL : APP_URL;
  mainWindow.loadURL(url);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
    }
    mainWindow.show();
    mainWindow.focus();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Handle navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const appHost = isDev ? 'localhost' : new URL(APP_URL).host;
    if (!url.includes(appHost)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

// ─── SYSTEM TRAY ──────────────────────────────────────────────

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  
  // Create a simple tray icon (16x16 or 22x22)
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    trayIcon = trayIcon.resize({ width: 16, height: 16 });
  } catch {
    // Fallback: create empty icon if file doesn't exist
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('DiamondDraft');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open DiamondDraft',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          launchMainWindow();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Check for Updates',
      click: () => {
        autoUpdater.checkForUpdates();
      },
    },
    { type: 'separator' },
    {
      label: `Version ${app.getVersion()}`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Quit DiamondDraft',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    } else {
      launchMainWindow();
    }
  });
}

// ─── APP LIFECYCLE ────────────────────────────────────────────

app.whenReady().then(() => {
  // Show splash screen
  createSplashWindow();

  // Set up system tray
  createTray();

  // Check for updates (will launch main window when done)
  if (!isDev) {
    setupAutoUpdater();
    autoUpdater.checkForUpdates().catch(() => {
      // If update check fails, just launch the app
      launchMainWindow();
    });
  } else {
    // In dev mode, skip update check
    setTimeout(() => launchMainWindow(), 1000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      launchMainWindow();
    }
  });
});

// Keep app running in tray when window is closed (like Discord)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && !tray) {
    app.quit();
  }
  // Don't quit — keep running in system tray
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}