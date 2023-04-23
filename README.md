# Final project for Compiler Design
* Miguel Angel Tornero Carrillo A00820449  
* Github: <https://github.com/A00820449/antlr4-final-project>
## Avance 2: Semántica Básica de Variables y Cubo Semántico
Ya se empezó la generación de cuadruplos. Al momento se encuentran implementadas las expresiones, el directo de funciones, semántica basica (usando un cubo semántico), estatutos if-else, y estatusos while. Los errores léxico-sintácticos y semánticos son desplegados en consola. Espero poder empezar a trabajar en la máquina virtual en la siguente semana.
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