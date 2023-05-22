# Final project for Compiler Design
* Miguel Angel Tornero Carrillo A00820449  
* Github: <https://github.com/A00820449/antlr4-final-project>

## Avance 6: Mapa de Memoria de Ejecución para la Máquina Virtual y Ejecución de Expresiones
La semana pasada no se pudo trabajar en el proyecto, pero afortunadamente se cuenta con un buen avance por lo que el proyecto todavía esta a tiempo.   

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
node compiler.js [input_file_name] [output_file_name]
```
The first argument will be used as the name of the input file, otherwise it will default to `input.txt`.  
The second argument will be used as the name of the output object file, otherwise it will default to `index.obj`.  
### Virtual Machine
To use the virtual machine, use Node to run the file `vm.js` like so:  
```bash
node vm.js [input_file_name]
```
The first argument will be used as the name of the input object file, otherwise it will default to `index.obj`.  
