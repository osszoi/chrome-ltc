# Chrome Link Traffic Control

## Description
Chrome Link Traffic Control is a tool that allows you to control which Chrome profile is used to open URLs based on regex mappings.

## Setup

### Windows
1. Install the dependencies:
    ```sh
    npm install
    ```

2. Run the setup script:
    ```sh
    node setup.js
    ```

3. Set the `.bat` file as your default browser:
    - Open `Settings`.
    - Go to `Apps` > `Default apps`.
    - Scroll down and click on `Choose default apps by protocol`.
    - Find `HTTP` and `HTTPS` protocols and set the default app to the `.bat` file created by the setup script.

### Mac
TBD

### Linux
TBD

## Checklist
- [x] Setup tested and working on Windows
- [ ] Setup tested and working on Mac
- [ ] Setup tested and working on Linux
