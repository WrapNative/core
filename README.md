<div align="center">
  <br />
  <h1>📦 WrapNative Core</h1>
  <p>
    <strong>Turn any web project into a native-like PWA with zero build config.</strong>
  </p>
  <p>
    <a href="https://github.com/WrapNative/core/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="WrapNative is released under the MIT license." />
    </a>
    <img src="https://img.shields.io/badge/version-1.0.0--alpha-orange?style=for-the-badge&logo=Gzip&logoColor=white" alt="Current Version" />
    <img src="https://img.shields.io/badge/Gzip-~20KB-green?style=for-the-badge&logo=Gzip&logoColor=white" alt="Gzipped Size " />
    <img src="https://img.shields.io/badge/Vite-Build-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
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

**Router:**
```JavaScript

// Navigate programmatically
wrapnative.router.navigate('home');
```
## ⚡ Dynamic Routing and Lifecycle

WrapNative has simplified how screens and resources are loaded. The framework now automatically detects whether you need to fetch remote HTML or should simply hydrate an existing screen, based on the container's content.

### Expected Folder Structure
Keep your files organized in: `pages/{screen_name}/` (index.html, style.css, script.js).

### Loading Rules

#### 1. Dynamic HTML (lazy model)
If the `data-wn-screen` element is **empty** (no children), the framework automatically means it should fetch the `index.html` template from the corresponding folder.

> **Note:** HTML is fetched and injected only **once** and is cached in the DOM for instant future navigation.

2. HTML Estático (Inline)Se o elemento já possuir conteúdo, o framework ignora a busca do template e foca apenas nos recursos extras (CSS/JS).

```HTML
<div data-wn-screen="perfil" data-wn-dynamic-resource="js">
    <h1>Meu Perfil</h1>
    <input type="text" data-model="nome">
</div>
```

Resource Management (data-wn-dynamic-resource) This attribute explicitly defines which auxiliary files should be loaded. Unlike HTML, these resources have a lifecycle: they are injected when entering the route and removed when leaving, ensuring scope isolation and performance.

| Value       | Behavior                  |
|-------------|---------------------------|
|"css"        | Load/Remove style.css     |
|"js"         | Execute/Clear script.js   |
|"css \| js " | Load both                 |


Use pipe Full example:

```HTML
<div data-wn-screen="dashboard" data-wn-dynamic-resource="css|js"></div>
```

```HTML
<div data-wn-screen="details" data-wn-dynamic-resource="css"></div>
```

```html
<div data-wn-screen="home" data-wn-dynamic-resource="js"></div>
```


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

## 📱 UX & Gestures
- Pull to Refresh: Add data-wn-ptr to your container and listen for the wrapnative-refresh event.

- Swipe to Dismiss: Modals support the native iOS-like swipe-down gesture to close.

- Smart PWA: The engine detects the OS:

- Android: Captures beforeinstallprompt and shows a native banner.

- iOS: Displays a Full Screen Modal with a visual install guide (Share -> Add to Home).



⚡ JavaScript API
The wrapnative (or WN) global object gives you control over the engine.

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
