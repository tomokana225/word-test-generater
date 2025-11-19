const { contextBridge } = require('electron');

// contextIsolationが有効なため、安全な方法でAPIを公開します。
// レンダラープロセスは window.electron.isElectron のようにアクセスできます。
contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
});