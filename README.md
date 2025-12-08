<div align="center">
  <br />
  <h1>📦 WrapNative Core</h1>
  <p>
    <strong>Turn any web project into a native-like PWA with zero build config.</strong>
  </p>
  <p>
    <a href="https://github.com/WrapNative/core/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="WrapNative is released under the MIT license." />
    </a>
    <img src="https://img.shields.io/badge/version-1.0.0--alpha-orange.svg" alt="Current Version" />
    <img src="https://img.shields.io/badge/size-~20kb-green.svg" alt="Gzipped Size" />
  </p>
</div>

<br />

## 📜 The Manifesto

**WrapNative** is not a "generic app builder". It is an **extreme productivity tool** for developers who value their time.

We hate configuring Webpack, fighting Gradle, or waiting 10 minutes for a React Native build just to validate a simple idea. WrapNative exists to eliminate this friction.

> **Zero Config Philosophy:** If you know HTML and JavaScript, you already know WrapNative. We handle the "boring magic" (PWA, Safe Areas, Gestures, Routing) so you can focus on business logic.

---

## 📂 File Structure

When you use the Builder or clone the starter, you get a production-optimized structure:

```text
/project-name
├── css/
│   └── wrapnative.css       # Engine Core Styles (Do not edit)
├── js/
│   ├── app.js               # Your Business Logic (Edit here)
│   └── wrapnative.js        # Engine Core (Do not edit)
├── index.html               # Screens HTML structure
├── manifest.json            # PWA Metadata
└── sw.js                    # Service Worker (Cache/Offline)
```

🚀 Core Concepts
## 1. Declarative Routing (SPA)
WrapNative uses HTML attributes to manage navigation. No complex JS router configuration is needed.

Defining Screens:

```HTML 
<!-- Home Screen -->
<div id="home" data-wn-screen data-wn-title="Home">
    <h1>Welcome</h1>
</div>

<!-- Secondary Screen (Hidden by default) -->
<div id="explore" data-wn-screen class="wn-hidden" data-wn-title="Explore">
    <h1>Discover</h1>
</div>
```

Creating Links: Any element can trigger navigation using data-wn-link. It automatically supports the View Transitions API: 

```HTML
<a href="#explore" data-wn-link>Go to Explore</a>
```
## Sub-routes & History

If you navigate to a screen that is not in the main Tabbar, the system treats it as a "Sub-route".

- Adds the previous screen to the History Stack.
- Displays a Back Button in the Toolbar automatically.
- Enables the physical "Back" gesture on Android.

## Reactive State
For dynamic UIs, use the built-in lightweight Proxy store.

```Javascript
const store = wrapnative.state.reactive({
    count: 0,
    isLoading: false,
    user: 'Guest'
});
```

**HTML Binding:**
- data-bind="key": Syncs innerText.
- data-model="key": Two-way binding for inputs.
- data-if="key": Conditional rendering (shows if true).

```HTML 
<p>Hello, <span data-bind="user"></span>!</p>
<div data-if="isLoading">Loading...</div>
```


⚡ JavaScript API
The wrapnative (or WN) global object gives you control over the engine.

**Router:**
```JavaScript

// Navigate programmatically
wrapnative.router.navigate('home');
```
**IMPORTANT!** 🚀 The Future: WrapNative Router v2.0 definitive (Under Development)

The current version focuses on simplicity. We are already working hard on v2.0, which will be the framework's "Game Changer".

The following structural improvements are planned for the next official version:

Blob Resource Loading: Intelligent loading of CSS/JS via Blob for total scope isolation and memory cleanup.

Folder Structure: Automatic mapping of routes to physical directories (e.g., /pages/home/index.js).

Offline-First: Aggressive optimization for offline operation using the Blob architecture.

Dynamic Routes: Support for Regex and advanced parameters (e.g., #/product/:id).

This Alpha version is for testing ergonomics and native animations.

**UI Toolkit:**
```JavaScript
// Native-like Alert
wrapnative.ui.alert({
    title: 'Success',
    message: 'Operation completed.',
    buttons: [
        { text: 'OK', handler: () => console.log('Done') }
    ]
});

// Open/Close Modals
wrapnative.ui.openModal('myModal');
wrapnative.ui.closeModal('myModal');

// Toggle Dark Mode
wrapnative.ui.toggleTheme();
Hardware Bridge
Access device features easily via the bridge.
```

```JavaScript
// Camera
const file = await wrapnative.bridge.camera();

// Haptics
wrapnative.bridge.haptics('light'); // 'light', 'medium', 'heavy'

```

## 📱 UX & Gestures
- Pull to Refresh: Add data-wn-ptr to your container and listen for the wrapnative-refresh event.

- Swipe to Dismiss: Modals support the native iOS-like swipe-down gesture to close.

- Smart PWA: The engine detects the OS:

- Android: Captures beforeinstallprompt and shows a native banner.

- iOS: Displays a Full Screen Modal with a visual install guide (Share -> Add to Home).


## 🛠️ Async & Loading Pattern:

**WrapNative encourages standard try/catch/finally blocks for async operations, using state flags for skeletons.**

```JavaScript

window.loadData = async () => {
    store.isLoading = true;
    try {
        await fetchAPI();
        store.hasData = true;
        WN.bridge.haptics('light');
    } catch (e) {
        WN.ui.alert('Error');
    } finally {
        store.isLoading = false; // Hides skeleton
    }
};
```
## 🤝 Contributing fork the project.


**Disclaimer**
Since this is an Alpha version, bugs are expected and suggestions are welcome! Feel free to open Issues or Pull Requests.

#### To create your new feature proposal:
```bash 
$ git checkout -b feature/AmazingFeature.
```
Commit your changes:
```bash 
$ git commit -m 'ADD - some AmazingFeature'. // name example RouterNavigateFeature.
```
Push to repo:
```bash 
$ git push origin feature/AmazingFeature.
```
And open a Pull Request.

#### To create your new correction proposal:
```bash 
$ git checkout -b fix/FeatureNameFix. // name example fix/RouterNavigateFix
```
Commit your changes:
```bash 
$ git commit -m 'FIX - some to FeatureNameFix'.
```
Push to repo:
```bash 
$ git push origin fix/FeatureNameFix.
```
And open a Pull Request.

## 📄 MIT License

Copyright (c) 2025 WrapNative

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
