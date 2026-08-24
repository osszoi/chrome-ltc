#!/usr/bin/env node

const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

const profileMappingPath = path.join(__dirname, 'config.json');
let profileMapping = [];

if (fs.existsSync(profileMappingPath)) {
	const config = JSON.parse(fs.readFileSync(profileMappingPath, 'utf-8'));
	profileMapping = Object.entries(config).map(([profile, regexes]) => ({
		profile,
		regexes: regexes.map((regex) => new RegExp(regex))
	}));
} else {
	console.error('Profile mapping file not found. Using default profile.');
	profileMapping = [{ profile: 'Default', regexes: [/.+/] }];
}

// Get the Chrome command based on OS
function getChromeCommand(url) {
	const profile = profileMapping.find(({ regexes }) =>
		regexes.some((regex) => regex.test(url))
	)?.profile;
	if (!profile) {
		console.error('No profile matched the URL. Opening with default profile.');
		return getChromeExecutable() + ` "${url}"`;
	}

	const profileOption = getProfileOption(profile);
	return `${getChromeExecutable()} ${profileOption} "${url}"`;
}


function getChromeExecutable() {
	const platform = os.platform();
	if (platform === 'win32') {
		return `"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"`;
	} else if (platform === 'darwin') {
		return `/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome`;
	} else if (platform === 'linux') {
		return findLinuxChrome();
	}
	throw new Error('Unsupported OS');
}

const LINUX_CHROME_CANDIDATES = ['google-chrome', 'google-chrome-stable'];

function findLinuxChrome() {
	const pathDirs = (process.env.PATH || '').split(path.delimiter);
	const found = LINUX_CHROME_CANDIDATES.find((bin) =>
		pathDirs.some((dir) => fs.existsSync(path.join(dir, bin)))
	);
	if (!found) {
		throw new Error(`No Chrome binary found in PATH (tried: ${LINUX_CHROME_CANDIDATES.join(', ')})`);
	}
	return found;
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
