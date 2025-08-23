
# How to Install and Build This Plugin (Beginner Guide)

## 1. Install Node.js

Node.js is required to build and run this plugin. Download and install it from the official website:

- Go to: https://nodejs.org/
- Click the **LTS** (Recommended) version for your operating system (Windows, Mac, or Linux).
- Download and run the installer. Follow all the default steps.
- After installation, open a new terminal (Command Prompt or PowerShell) and check the version:

```powershell
node --version
```

You should see something like `v18.x.x` or higher.

## 2. Install pnpm (Node.js package manager)

pnpm is a fast package manager. To install it, run this command in your terminal:

```powershell
npm install -g pnpm
```

Check that pnpm is installed:

```powershell
pnpm --version
```

## 3. Install Project Dependencies

Navigate to the folder where you downloaded/cloned this plugin (use `cd` to change directory):

```powershell
cd path\to\your\Vencord
```

Then install all dependencies:

```powershell
pnpm install
```

## 4. Build the Plugin

To build the plugin, run:

```powershell
pnpm build
```

If everything works, you will see a `Done` message and new files in the `dist` folder.

## 5. Inject the Plugin into Discord

To inject (install) the plugin into your Discord app, run:

```powershell
pnpm inject
```

Follow the instructions in the terminal. Usually, you just press Enter to select your Discord installation.

---

**Tips:**
- If you get errors, make sure Node.js and pnpm are installed and up to date.
- Always run these commands in the main plugin folder (where `package.json` is).
- You can repeat the build and inject steps any time you make changes to the code.

Happy modding!
