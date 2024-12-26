# Facebook Marketplace Car Listings Downloader

A Chrome extension that allows users to download car listings directly from Facebook Marketplace.

## Features

- Automatically fetches car listings from Facebook Marketplace.
- Easy-to-use interface with React and Tailwind.
- Lightweight and fast.

## Technologies Used

- React
- Vite
- Tailwind CSS

### For Users

1. Download the extension from the [Chrome Web Store](link).
2. Install and start using the extension.

### For Developers

1.  Clone this repository:

```bash
https://github.com/felipevettx/vettx-chrome-addon
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Load the extension in developer mode in Chrome:

- Open chrome://extensions in Chrome.
- Enable Developer Mode at the top right.
- Click on "Load unpacked" and select the dist folder (where the build of the extension is generated).

5. Open your extension through its internal Chrome URL:

```bash
chrome-extension://<your-extension-id>/index.html
```

This should load your extension in a browser window, as if it were a regular web page, for testing.

5. Build the extension for production

```bash
npm run build
```
