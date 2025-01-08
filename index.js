#!/usr/bin/env node

const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

const profileMappingPath = path.join(__dirname, 'config.json');
let profileMapping = [];

if (fs.existsSync(profileMappingPath)) {
	profileMapping = JSON.parse(fs.readFileSync(profileMappingPath, 'utf-8')).map(
		({ regex, profile }) => ({
			regex: new RegExp(regex),
			profile
		})
	);
} else {
	console.error('Profile mapping file not found. Using default profile.');
	profileMapping = [{ regex: /.+/, profile: 'Default' }];
}

// Get the Chrome command based on OS
function getChromeCommand(url) {
	const profile = profileMapping.find(({ regex }) => regex.test(url))?.profile;
	if (!profile) {
		console.error('No profile matched the URL. Opening with default profile.');
		return getChromeExecutable() + ` "${url}"`;
	}

	const profileOption = getProfileOption(profile);
	return `${getChromeExecutable()} ${profileOption} "${url}"`;
}

// Determine the correct Chrome executable
function getChromeExecutable() {
	const platform = os.platform();
	if (platform === 'win32') {
		return `"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"`;
	} else if (platform === 'darwin') {
		return `/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome`;
	} else if (platform === 'linux') {
		return `google-chrome`; // Or `chromium` depending on your setup
	}
	throw new Error('Unsupported OS');
}

// Determine the correct profile option
function getProfileOption(profile) {
	const platform = os.platform();
	if (platform === 'win32' || platform === 'linux') {
		return `--profile-directory="${profile}"`;
	} else if (platform === 'darwin') {
		return `--profile-directory="${profile}"`;
	}
	throw new Error('Unsupported OS');
}

// Main execution
const url = process.argv[2];
if (!url) {
	console.error('No URL provided.');
	process.exit(1);
}

const command = getChromeCommand(url);
exec(command, (error) => {
	if (error) {
		console.error('Error opening URL:', error.message);
	}
});
