const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const sudo = require('sudo-prompt'); // Added for Windows elevation
const readline = require('readline');

const platform = os.platform();

// Function to prompt user for config.json
async function checkConfig() {
	const configPath = path.join(__dirname, 'config.json');
	const exampleConfigPath = path.join(__dirname, 'config.json.example');

	if (!fs.existsSync(configPath) && fs.existsSync(exampleConfigPath)) {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		return new Promise((resolve) => {
			rl.question(
				'config.json not found. Do you want to copy config.json.example? (yes/no): ',
				(answer) => {
					rl.close();
					if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
						fs.copyFileSync(exampleConfigPath, configPath);
						console.log('config.json created from config.json.example');
					} else {
						console.log('Skipping config.json creation.');
					}
					resolve();
				}
			);
		});
	}
}

// Main setup function
async function setup() {
	await checkConfig();

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
	// Generate the wrapper script
	const wrapperScript = path.join(__dirname, 'custom-browser-wrapper.sh');
	const nodePath = process.execPath; // Get current node executable path
	const scriptPath = path.resolve(__dirname, 'index.js');
	const wrapperContent = `#!/bin/bash\n${nodePath} ${scriptPath} "$@"\n`;

	fs.writeFileSync(wrapperScript, wrapperContent);
	fs.chmodSync(wrapperScript, '755'); // Make executable

	const desktopFile = path.join(
		os.homedir(),
		'.local/share/applications/custom-browser.desktop'
	);
	const desktopEntry = `[Desktop Entry]
Name=Custom Browser
Exec=${wrapperScript} %u
Terminal=false
Type=Application
Categories=Network;WebBrowser;
MimeType=text/html;application/xhtml+xml;x-scheme-handler/http;x-scheme-handler/https;
`;
	fs.writeFileSync(desktopFile, desktopEntry);
	exec(
		`xdg-mime default custom-browser.desktop x-scheme-handler/http x-scheme-handler/https`
	);
	console.log('Custom browser set as default.');
	console.log('\nVerification steps:');
	console.log('1. Check that custom-browser-wrapper.sh was created in the project directory');
	console.log('2. Verify the desktop file at ~/.local/share/applications/custom-browser.desktop');
	console.log('3. Test with: xdg-open "https://example.com"');
} else {
	console.error('Unsupported platform.');
}
}

// Run the setup
setup();
