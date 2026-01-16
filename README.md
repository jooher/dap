# Dap.js: for massively interactive web-applications.

[![Join the chat at https://gitter.im/dapjs/community](https://badges.gitter.im/dapjs/community.svg)](https://gitter.im/dapjs/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Dap (initially stood for "data access page") is a lightweight javascript framework for interactive data-driven web applications.

## Clear, concise and observable
Dap is designed to focus on data and logic, instead of syntactic decoration. Dap code tends to be times smaller than equivalent solutions in other reactive environments. Dap code is clean and observable, without sparse lines of curly brackets and boilerplate code.

## Natively reactive
Native reactivity is the base concept of dap. No need to manually track changes in your application's status, or even bother binding events to dependent elements — all dependencies are resolved naturally under the hood. Dap renders and updates all (and only!) the dependent elements interactively, based on their dap-rules.

## Fast and lightweight
Dap will not introduce any noticeable latency to your Web UI. The dap runtime script weighs less than 20kiB, dap-rules are parsed lazily, DOM manipulations are precise and deterministic, and only involve affected elements.

## Simple to start, easy to advance
A whole lot of magic can be done in bare dap, with the few "stantard" dap operations. But when it's time to go beyond — you can easily expand dap with your own custom operations, or utilize 3-rd party extensions.
