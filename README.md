# Final project for Compiler Design
* Miguel Angel Tornero Carrillo A00820449
## Avance 1: LéxicoSintaxis
Al momento ya está completa la generación del analizador léxico y sintáctico. También ya se empezó a trabajar en el analisis semántico. Está completa la detección de identificadores duplicados, y casi se completa la generación de la tabla de símbolos. Al momento se generan dos tablas: una para los símbolos globales, y de variables locales. Por último, se generó el cubo semántico (en el archivo `semantic_cube.js`), aunque todavía no están implementadas las expresiones. Se espera poder empezar a trabajar en ellas la siguente semana.
## How To Use
Make sure you have the latest version of [NodeJS](https://nodejs.org/), [NPM](https://www.npmjs.com/) (included with NodeJS), and [ANTLRv4](https://www.antlr.org/) installed. You can install ANTLRv4 via [PyPI](https://pypi.org/):
```bash
pip install antlr4-tools
```
After cloning the repositry, install the NPM dependencies and build the grammar files using these commands:
```bash
npm install # installs NPM dependencies
npm run build # builds grammar files using ANTLR
```
### Compiler
To use the compiler, use Node to run the file `compiler.js` like so:
```bash
node compiler.js [input_file_name]
```
You can pass the name of an input file as one of the arguments, otherwise it will default to `input.txt`.
### Virtual Machine
//TODO//