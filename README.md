# antlr4-final-project
Final project for Compiler Design
## Week 1
//TODO//
## How To Use
Make sure you have the latest version of [NodeJS](https://nodejs.org/), [NPM](https://www.npmjs.com/) (included with NodeJS), and [ANTLRv4](https://www.antlr.org/) installed. You can install ANTLRv4 via [PyPI](https://pypi.org/):
```bash
pip install antlr4-tools
```
After cloning the repositry, install the NPM dependancies and build the grammar files using these commands:
```bash
npm install
npm run build
```
### Compiler
To use the compiler, use Node to run the file `compiler.js` like so:
```bash
node compiler.js [input_file_name]
```
You can pass the name of an input file as one of the arguments, otherwise it will default to `input.txt`.
### Virtual Machine
//TODO//