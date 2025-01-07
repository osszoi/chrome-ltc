const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const sudo = require('sudo-prompt'); // Added for Windows elevation

const platform = os.platform();

if (platform === 'win32') {
	const batFile = path.join(__dirname, 'custom-browser.bat');
	fs.writeFileSync(
		batFile,
		`@echo off\nnode "${path.resolve(__dirname, 'index.js')}" %1`
	);
	console.log('Set the .bat file as your default browser in Settings.');

	// Create a .reg file
	const regFile = path.join(__dirname, 'add.reg');
	const regContent = `Windows Registry Editor Version 5.00

; Register the browser in App Paths
[HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome-link-traffic-control.bat]
@="${batFile.replace(/\\/g, '\\\\')}"
"Path"="${__dirname.replace(/\\/g, '\\\\')}"

; Add to Registered Applications
[HKEY_LOCAL_MACHINE\\SOFTWARE\\RegisteredApplications]
"Chrome Link Traffic Control"="Software\\Clients\\StartMenuInternet\\ChromeLinkTrafficControl\\Capabilities"

; Define the browser in Clients
[HKEY_LOCAL_MACHINE\\SOFTWARE\\Clients\\StartMenuInternet\\ChromeLinkTrafficControl]
@="Chrome Link Traffic Control"

[HKEY_LOCAL_MACHINE\\SOFTWARE\\Clients\\StartMenuInternet\\ChromeLinkTrafficControl\\Capabilities]
"ApplicationDescription"="Custom browser for controlling Chrome link traffic"
"ApplicationName"="Chrome Link Traffic Control"

[HKEY_LOCAL_MACHINE\\SOFTWARE\\Clients\\StartMenuInternet\\ChromeLinkTrafficControl\\Capabilities\\Startmenu]
"InternetShortcutName"="Chrome Link Traffic Control"

[HKEY_LOCAL_MACHINE\\SOFTWARE\\Clients\\StartMenuInternet\\ChromeLinkTrafficControl\\Capabilities\\UrlAssociations]
"http"="ChromeLinkTrafficControlURL"
"https"="ChromeLinkTrafficControlURL"

; Define the URL protocol handler
[HKEY_LOCAL_MACHINE\\SOFTWARE\\Classes\\ChromeLinkTrafficControlURL]
@="Chrome Link Traffic Control URL"
"URL Protocol"=""

[HKEY_LOCAL_MACHINE\\SOFTWARE\\Classes\\ChromeLinkTrafficControlURL\\shell]
@="open"

[HKEY_LOCAL_MACHINE\\SOFTWARE\\Classes\\ChromeLinkTrafficControlURL\\shell\\open\\command]
@="\\"${batFile.replace(/\\/g, '\\\\')}" \"%1\""`;

	fs.writeFileSync(regFile, regContent);

	console.log('Registry file add.reg created. Running as administrator...');

	// Use sudo-prompt to run reg import as administrator
	const options = {
		name: 'Chrome Link Traffic Control'
	};

	sudo.exec(`reg import "${regFile}"`, options, (error, stdout, stderr) => {
		if (error) {
			console.error('Error importing registry file:', error.message);
			return;
		}
		if (stderr) {
			console.error('stderr:', stderr);
			return;
		}
		console.log('Registry file imported successfully.');
	});
} else if (platform === 'darwin') {
	console.log(
		'Use Browserosaurus or a similar tool to configure the script as your default browser.'
	);
} else if (platform === 'linux') {
	const desktopFile = path.join(
		os.homedir(),
		'.local/share/applications/custom-browser.desktop'
	);
	const execPath = `node ${path.resolve(__dirname, 'index.js')}`;
	const desktopEntry = `[Desktop Entry]
Name=Custom Browser
Exec=${execPath} %u
Type=Application
Terminal=false
MimeType=x-scheme-handler/http;x-scheme-handler/https;`;
	fs.writeFileSync(desktopFile, desktopEntry);
	exec(
		`xdg-mime default custom-browser.desktop x-scheme-handler/http x-scheme-handler/https`
	);
	console.log('Custom browser set as default.');
} else {
	console.error('Unsupported platform.');
}
