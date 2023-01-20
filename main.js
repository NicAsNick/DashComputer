const { app, BrowserWindow, ipcMain, Notification } = require("electron");
const path = require("path");
const systeminformation = require("systeminformation");
const fs = require("fs");
const connection = require("tedious").Connection;
const Request = require("tedious").Request;
const { exec } = require("child_process");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1080,
    height: 720,
    webPreferences: {
      plugins: true,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "./preload.js"),
    },
    autoHideMenuBar: false,
  });
  win.loadFile("./public/index.html").then((r) => console.log(r));
};

require("electron-reload")(__dirname, {
  electron: path.join(__dirname, "node_modules", ".bin", "electron"),
});

ipcMain.handle("req_batterie", () => {
  return new Promise((resolve, reject) => {
    resolve(
      systeminformation.battery().then((data) => {
        return data;
      })
    );
    reject("error");
  });
});

ipcMain.handle("req_cpu", () => {
  return new Promise((resolve, reject) => {
    resolve(
      systeminformation.cpu().then((data) => {
        return data;
      })
    );
    reject("error");
  });
});

ipcMain.handle("req_graphics", () => {
  return new Promise((resolve, reject) => {
    resolve(
      systeminformation.graphics().then((data) => {
        return data;
      })
    );
    reject("error");
  });
});

ipcMain.handle("req_memory", () => {
  return new Promise((resolve, reject) => {
    resolve(
      systeminformation.diskLayout().then((data) => {
        return data;
      })
    );
    reject("error");
  });
});

ipcMain.handle("req_fsSize", () => {
    return new Promise((resolve, reject) => {
        exec("df -h /", (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                reject(error);
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
            const lines = stdout.split('\n');
            const headers = lines[0].split(/\s+/);
            const data = lines.slice(1, -1).map(line => {
                const values = line.split(/\s+/);
                return headers.reduce((obj, header, index) => {
                    obj[header] = values[index];
                    return obj;
                }, {});
            });
            resolve(data);
        });
    });
});

ipcMain.handle("req_monitor", () => {
  return new Promise((resolve, reject) => {
    /* resolve(
      systeminformation.processes().then((data) => {
        return data;
      })
    ); */
    resolve(
      systeminformation.currentLoad().then((data) => {
        return data;
      })
    );
    reject("error");
  });
});

ipcMain.handle("req_temp", () => {
  return new Promise((resolve, reject) => {
    resolve(
      systeminformation.cpuTemperature().then((data) => {
        return data;
      })
    );
    reject("error");
  });
});

ipcMain.handle("req_inetChecksite", () => {
  return new Promise((resolve, reject) => {
    resolve(
      systeminformation.inetChecksite("google.com").then((data) => {
        return data;
      })
    );
    reject("error");
  });
});

ipcMain.handle("req_Files", () => {
  return fs.readdirSync("/Applications");
});

/* ipcMain.on("3000", (event, arg) => {
    console.log("evnet, arg : ",event, arg);
    const notification = {
        title: arg,
        body: "Notification from the Main process"
    }
    new Notification(notification).show();
    params = arg;

}); */

ipcMain.handle("req_versions", () => {
  return new Promise((resolve, reject) => {
    resolve(
      systeminformation.versions().then((data) => {
        return data;
      })
    );
    reject("error");
  });
});

let logiciels = new Array();
// Rechercher tous les fichiers .app dans le répertoire Applications
exec(
  'find /Applications -maxdepth 1 -name  "*.app"',
  (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    // Pour chaque fichier .app trouvé, lire les informations de version
    const apps = stdout.split("\n");
    apps.forEach((app) => {
      if (app && error == null) {
        exec(
          `defaults read "${app}/Contents/Info" CFBundleShortVersionString`,
          (error, stdout, stderr) => {
            if (error) {
              console.error(`exec error: ${error}`);
              logiciels.push({ app, version: "N/A" });
              return;
            }

            logiciels.push({ app, version: stdout });
          }
        );

        /*  exec(`du -sh "${app}"`, (error, stdout, stderr) => {
          if (error || stdout == undefined || stdout == NaN) {
            console.error(`exec error: ${error}`);
            logiciels.push({ app, size: "N/A" });
            return;
          }

          logiciels.push({ app, size: stdout });
        }); */
      }
    });
    ipcMain.handle("req_app", () => {
      return new Promise((resolve, reject) => {
        resolve(logiciels);
        reject("error");
      });
    });
  }
);

ipcMain.handle("req_network", () => {
  return new Promise((resolve, reject) => {
    resolve(
      systeminformation.networkConnections().then((data) => {
        return data;
      })
    );
    reject("error");
  });
});

ipcMain.handle("req_gateway", () => {
  return new Promise((resolve, reject) => {
    resolve(
      systeminformation.networkGatewayDefault().then((data) => {
        return data;
      })
    );
    reject("error");
  });
});

ipcMain.handle("req_wifi", () => {
  return new Promise((resolve, reject) => {
    resolve(
      systeminformation.wifiNetworks().then((data) => {
        return data;
      })
    );
    reject("error");
  });
});

app.whenReady().then(() => {
  createWindow();
});
