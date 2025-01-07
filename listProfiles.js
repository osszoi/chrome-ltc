const fs = require('fs');
const os = require('os');
const path = require('path');
const Table = require('cli-table3');

const getChromeProfilesPath = () => {
	const platform = os.platform();
	if (platform === 'win32') {
		return path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data');
	} else if (platform === 'darwin') {
		return path.join(
			os.homedir(),
			'Library',
			'Application Support',
			'Google',
			'Chrome'
		);
	} else if (platform === 'linux') {
		return path.join(os.homedir(), '.config', 'google-chrome');
	} else {
		throw new Error('Unsupported OS');
	}
};

const getChromeProfiles = (profilesPath) => {
	return fs
		.readdirSync(profilesPath)
		.filter((file) => file.startsWith('Profile') || file === 'Default');
};

const getProfileEmail = (profilePath) => {
	const preferencesPath = path.join(profilePath, 'Preferences');
	if (fs.existsSync(preferencesPath)) {
		const preferences = JSON.parse(fs.readFileSync(preferencesPath, 'utf-8'));
		return preferences.account_info?.[0]?.email || 'No email found';
	}
	return 'No email found';
};

const listProfiles = () => {
	try {
		const profilesPath = getChromeProfilesPath();
		const profiles = getChromeProfiles(profilesPath);
		const table = new Table({
			head: ['Profile', 'Email'],
			colWidths: [20, 40]
		});

		profiles.forEach((profile) => {
			const profilePath = path.join(profilesPath, profile);
			const email = getProfileEmail(profilePath);
			table.push([profile, email]);
		});

		console.log(table.toString());
	} catch (error) {
		console.error('Error listing profiles:', error.message);
	}
};

listProfiles();
