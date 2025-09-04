/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("app/(marketing)/features/page",{

/***/ "(app-pages-browser)/./app/(marketing)/features/ScrollEffects.tsx":
/*!****************************************************!*\
  !*** ./app/(marketing)/features/ScrollEffects.tsx ***!
  \****************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var gsap__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! gsap */ \"(app-pages-browser)/./node_modules/gsap/index.js\");\n/* harmony import */ var gsap_ScrollTrigger__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! gsap/ScrollTrigger */ \"(app-pages-browser)/./node_modules/gsap/ScrollTrigger.js\");\n/* harmony import */ var _hooks_useScrollSystem__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/hooks/useScrollSystem */ \"(app-pages-browser)/./hooks/useScrollSystem.ts\");\n/* harmony import */ var _hooks_useScrollSystem__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_hooks_useScrollSystem__WEBPACK_IMPORTED_MODULE_1__);\n/* __next_internal_client_entry_do_not_use__ default auto */ var _s = $RefreshSig$();\n\n\n\n\nconst ScrollEffects = ()=>{\n    _s();\n    const { isGsapReady } = _hooks_useScrollSystem__WEBPACK_IMPORTED_MODULE_1___default()();\n    (0,react__WEBPACK_IMPORTED_MODULE_0__.useLayoutEffect)({\n        \"ScrollEffects.useLayoutEffect\": ()=>{\n            if (!isGsapReady) return;\n            gsap__WEBPACK_IMPORTED_MODULE_2__.gsap.registerPlugin(gsap_ScrollTrigger__WEBPACK_IMPORTED_MODULE_3__.ScrollTrigger);\n            const revealElements = gsap__WEBPACK_IMPORTED_MODULE_2__.gsap.utils.toArray(\"[data-animate='reveal']\");\n            revealElements.forEach({\n                \"ScrollEffects.useLayoutEffect\": (elem)=>{\n                    gsap__WEBPACK_IMPORTED_MODULE_2__.gsap.fromTo(elem, {\n                        y: 50,\n                        opacity: 0\n                    }, {\n                        y: 0,\n                        opacity: 1,\n                        duration: 1,\n                        ease: \"power3.out\",\n                        scrollTrigger: {\n                            trigger: elem,\n                            start: \"top 90%\",\n                            end: \"bottom 20%\",\n                            toggleActions: \"play none none none\"\n                        }\n                    });\n                }\n            }[\"ScrollEffects.useLayoutEffect\"]);\n            return ({\n                \"ScrollEffects.useLayoutEffect\": ()=>{\n                    // Kill ScrollTriggers to prevent memory leaks\n                    gsap_ScrollTrigger__WEBPACK_IMPORTED_MODULE_3__.ScrollTrigger.getAll().forEach({\n                        \"ScrollEffects.useLayoutEffect\": (trigger)=>trigger.kill()\n                    }[\"ScrollEffects.useLayoutEffect\"]);\n                }\n            })[\"ScrollEffects.useLayoutEffect\"];\n        }\n    }[\"ScrollEffects.useLayoutEffect\"], [\n        isGsapReady\n    ]);\n    return null;\n};\n_s(ScrollEffects, \"ve0O15STGdqUtcHDJ/R16J2MQ04=\", false, function() {\n    return [\n        (_hooks_useScrollSystem__WEBPACK_IMPORTED_MODULE_1___default())\n    ];\n});\n_c = ScrollEffects;\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ScrollEffects);\nvar _c;\n$RefreshReg$(_c, \"ScrollEffects\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL2FwcC8obWFya2V0aW5nKS9mZWF0dXJlcy9TY3JvbGxFZmZlY3RzLnRzeCIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUV3QztBQUNaO0FBQ3VCO0FBQ0c7QUFFdEQsTUFBTUksZ0JBQWdCOztJQUNwQixNQUFNLEVBQUVDLFdBQVcsRUFBRSxHQUFHRiw2REFBZUE7SUFFdkNILHNEQUFlQTt5Q0FBQztZQUNkLElBQUksQ0FBQ0ssYUFBYTtZQUVsQkosc0NBQUlBLENBQUNLLGNBQWMsQ0FBQ0osNkRBQWFBO1lBRWpDLE1BQU1LLGlCQUFpQk4sc0NBQUlBLENBQUNPLEtBQUssQ0FBQ0MsT0FBTyxDQUFjO1lBRXZERixlQUFlRyxPQUFPO2lEQUFDLENBQUNDO29CQUN0QlYsc0NBQUlBLENBQUNXLE1BQU0sQ0FDVEQsTUFDQTt3QkFDRUUsR0FBRzt3QkFDSEMsU0FBUztvQkFDWCxHQUNBO3dCQUNFRCxHQUFHO3dCQUNIQyxTQUFTO3dCQUNUQyxVQUFVO3dCQUNWQyxNQUFNO3dCQUNOQyxlQUFlOzRCQUNiQyxTQUFTUDs0QkFDVFEsT0FBTzs0QkFDUEMsS0FBSzs0QkFDTEMsZUFBZTt3QkFDakI7b0JBQ0Y7Z0JBRUo7O1lBRUE7aURBQU87b0JBQ0wsOENBQThDO29CQUM5Q25CLDZEQUFhQSxDQUFDb0IsTUFBTSxHQUFHWixPQUFPO3lEQUFDLENBQUNRLFVBQVlBLFFBQVFLLElBQUk7O2dCQUMxRDs7UUFDRjt3Q0FBRztRQUFDbEI7S0FBWTtJQUVoQixPQUFPO0FBQ1Q7R0F2Q01EOztRQUNvQkQsK0RBQWVBOzs7S0FEbkNDO0FBeUNOLGlFQUFlQSxhQUFhQSxFQUFDIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXERFTExcXFVzd2lmdFxcZGFzaGJvYXJkXFxhcHBcXChtYXJrZXRpbmcpXFxmZWF0dXJlc1xcU2Nyb2xsRWZmZWN0cy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2UgY2xpZW50XCI7XHJcblxyXG5pbXBvcnQgeyB1c2VMYXlvdXRFZmZlY3QgfSBmcm9tIFwicmVhY3RcIjtcclxuaW1wb3J0IHsgZ3NhcCB9IGZyb20gXCJnc2FwXCI7XHJcbmltcG9ydCB7IFNjcm9sbFRyaWdnZXIgfSBmcm9tIFwiZ3NhcC9TY3JvbGxUcmlnZ2VyXCI7XHJcbmltcG9ydCB1c2VTY3JvbGxTeXN0ZW0gZnJvbSBcIkAvaG9va3MvdXNlU2Nyb2xsU3lzdGVtXCI7XHJcblxyXG5jb25zdCBTY3JvbGxFZmZlY3RzID0gKCkgPT4ge1xyXG4gIGNvbnN0IHsgaXNHc2FwUmVhZHkgfSA9IHVzZVNjcm9sbFN5c3RlbSgpO1xyXG5cclxuICB1c2VMYXlvdXRFZmZlY3QoKCkgPT4ge1xyXG4gICAgaWYgKCFpc0dzYXBSZWFkeSkgcmV0dXJuO1xyXG5cclxuICAgIGdzYXAucmVnaXN0ZXJQbHVnaW4oU2Nyb2xsVHJpZ2dlcik7XHJcblxyXG4gICAgY29uc3QgcmV2ZWFsRWxlbWVudHMgPSBnc2FwLnV0aWxzLnRvQXJyYXk8SFRNTEVsZW1lbnQ+KFwiW2RhdGEtYW5pbWF0ZT0ncmV2ZWFsJ11cIik7XHJcblxyXG4gICAgcmV2ZWFsRWxlbWVudHMuZm9yRWFjaCgoZWxlbSkgPT4ge1xyXG4gICAgICBnc2FwLmZyb21UbyhcclxuICAgICAgICBlbGVtLFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHk6IDUwLFxyXG4gICAgICAgICAgb3BhY2l0eTogMCxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHk6IDAsXHJcbiAgICAgICAgICBvcGFjaXR5OiAxLFxyXG4gICAgICAgICAgZHVyYXRpb246IDEsXHJcbiAgICAgICAgICBlYXNlOiBcInBvd2VyMy5vdXRcIixcclxuICAgICAgICAgIHNjcm9sbFRyaWdnZXI6IHtcclxuICAgICAgICAgICAgdHJpZ2dlcjogZWxlbSxcclxuICAgICAgICAgICAgc3RhcnQ6IFwidG9wIDkwJVwiLFxyXG4gICAgICAgICAgICBlbmQ6IFwiYm90dG9tIDIwJVwiLFxyXG4gICAgICAgICAgICB0b2dnbGVBY3Rpb25zOiBcInBsYXkgbm9uZSBub25lIG5vbmVcIixcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfVxyXG4gICAgICApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuICgpID0+IHtcclxuICAgICAgLy8gS2lsbCBTY3JvbGxUcmlnZ2VycyB0byBwcmV2ZW50IG1lbW9yeSBsZWFrc1xyXG4gICAgICBTY3JvbGxUcmlnZ2VyLmdldEFsbCgpLmZvckVhY2goKHRyaWdnZXIpID0+IHRyaWdnZXIua2lsbCgpKTtcclxuICAgIH07XHJcbiAgfSwgW2lzR3NhcFJlYWR5XSk7XHJcblxyXG4gIHJldHVybiBudWxsO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgU2Nyb2xsRWZmZWN0czsiXSwibmFtZXMiOlsidXNlTGF5b3V0RWZmZWN0IiwiZ3NhcCIsIlNjcm9sbFRyaWdnZXIiLCJ1c2VTY3JvbGxTeXN0ZW0iLCJTY3JvbGxFZmZlY3RzIiwiaXNHc2FwUmVhZHkiLCJyZWdpc3RlclBsdWdpbiIsInJldmVhbEVsZW1lbnRzIiwidXRpbHMiLCJ0b0FycmF5IiwiZm9yRWFjaCIsImVsZW0iLCJmcm9tVG8iLCJ5Iiwib3BhY2l0eSIsImR1cmF0aW9uIiwiZWFzZSIsInNjcm9sbFRyaWdnZXIiLCJ0cmlnZ2VyIiwic3RhcnQiLCJlbmQiLCJ0b2dnbGVBY3Rpb25zIiwiZ2V0QWxsIiwia2lsbCJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(app-pages-browser)/./app/(marketing)/features/ScrollEffects.tsx\n"));

/***/ }),

/***/ "(app-pages-browser)/./hooks/useScrollSystem.ts":
/*!**********************************!*\
  !*** ./hooks/useScrollSystem.ts ***!
  \**********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



;
    // Wrapped in an IIFE to avoid polluting the global scope
    ;
    (function () {
        var _a, _b;
        // Legacy CSS implementations will `eval` browser code in a Node.js context
        // to extract CSS. For backwards compatibility, we need to check we're in a
        // browser context before continuing.
        if (typeof self !== 'undefined' &&
            // AMP / No-JS mode does not inject these helpers:
            '$RefreshHelpers$' in self) {
            // @ts-ignore __webpack_module__ is global
            var currentExports = module.exports;
            // @ts-ignore __webpack_module__ is global
            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;
            // This cannot happen in MainTemplate because the exports mismatch between
            // templating and execution.
            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);
            // A module can be accepted automatically based on its exports, e.g. when
            // it is a Refresh Boundary.
            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {
                // Save the previous exports signature on update so we can compare the boundary
                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)
                module.hot.dispose(function (data) {
                    data.prevSignature =
                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);
                });
                // Unconditionally accept an update to this module, we'll check if it's
                // still a Refresh Boundary later.
                // @ts-ignore importMeta is replaced in the loader
                module.hot.accept();
                // This field is set when the previous version of this module was a
                // Refresh Boundary, letting us know we need to check for invalidation or
                // enqueue an update.
                if (prevSignature !== null) {
                    // A boundary can become ineligible if its exports are incompatible
                    // with the previous exports.
                    //
                    // For example, if you add/remove/change exports, we'll want to
                    // re-execute the importing modules, and force those components to
                    // re-render. Similarly, if you convert a class component to a
                    // function, we want to invalidate the boundary.
                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {
                        module.hot.invalidate();
                    }
                    else {
                        self.$RefreshHelpers$.scheduleUpdate();
                    }
                }
            }
            else {
                // Since we just executed the code for the module, it's possible that the
                // new exports made it ineligible for being a boundary.
                // We only care about the case when we were _previously_ a boundary,
                // because we already accepted this update (accidental side effect).
                var isNoLongerABoundary = prevSignature !== null;
                if (isNoLongerABoundary) {
                    module.hot.invalidate();
                }
            }
        }
    })();


/***/ })

});