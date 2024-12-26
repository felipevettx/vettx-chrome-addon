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

1. Clone this repository:

   ```bash
   git clone https://github.com/felipevettx/vettx-chrome-addon
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

   - Open `chrome://extensions` in Chrome.
   - Enable Developer Mode at the top right.
   - Click on "Load unpacked" and select the `dist` folder (where the build of the extension is generated).

5. Open the extension through its internal Chrome URL:

   ```bash
   chrome-extension://<the-extension-id>/index.html
   ```

   This should load the extension in a browser window, as if it were a regular web page, for testing.

6. Build the extension for production:

   ```bash
   npm run build
   ```

# How to Publish the Extension on the Chrome Web Store

To make the extension available to users via the Chrome Web Store, follow these steps:

## 1. Prepare the Extension for Publication

Before uploading the extension, make sure the project is ready for production:

- **Test the extension thoroughly** to ensure it works properly.
- **Ensure all features are functioning as expected**, and that there are no bugs or issues.
- **Check the privacy policy and permissions**: If the extension collects any user data, it must include a clear privacy policy that explains how the data is used and stored.
- **Minimize and optimize the extension**: Ensure that the build output is optimized and all unnecessary files are removed. You can use the following command to build the extension for production:

  ```bash
  npm run build
  ```

## 2. Create a Developer Account in the Chrome Web Store

If you don't already have one, you'll need to create a developer account with Google. Here's how:

1. Visit the [Google Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).
2. Sign in with a Google account or create one if necessary.
3. Pay a one-time developer registration fee of $5 USD.

## 3. Package the Extension

The extension should be packaged into a `.zip` file before uploading it to the Chrome Web Store. Follow these steps to create the `.zip` file:

1. Navigate to the `dist` folder (where the production files are located after running `npm run build`).
2. Create a `.zip` archive of the entire contents of the `dist` folder, including the manifest file (`manifest.json`).

## 4. Upload the Extension to the Chrome Web Store

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).
2. Click the "Add a New Item" button.
3. Upload the `.zip` file containing the packaged extension.
4. Fill in the necessary details for the extension:

   - Extension Name: The name that will appear on the Web Store.
   - Description: A brief summary of what the extension does.
   - Screenshots: Add screenshots that show how the extension works.
   - Icons: Upload the icon for the extension (at least 128x128px).
   - Privacy Policy: If necessary, link to the privacy policy.

## 5. Submit for Review

Once all the required information is filled in and the extension package is uploaded, click "Publish" to submit the extension for review. Google will review the extension to ensure it meets their policies and guidelines.

> **Review Process:** This process can take anywhere from a few hours to several days. Google will notify you if there are any issues or if the extension is approved.

## 6. Monitor the Extension's Status

After the extension has been published, you can monitor its status, view download statistics, and manage updates through the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).

## 7. Update the Extension

If it's necessary to update the extension in the future:

1. Make the necessary changes to the extension's code.
2. Build the updated version (`npm run build`).
3. Package the updated version into a `.zip` file.
4. Go to the Chrome Web Store Developer Dashboard, select the extension, and upload the new `.zip` file.
5. Google will review the update and, if approved, it will be published automatically.
