# Final project for Compiler Design
* Miguel Angel Tornero Carrillo A00820449  
* Github: <https://github.com/A00820449/antlr4-final-project>

## Avance 4: Generación de Código de Estatutos Condicionales y Cíclicos
Ya está implementada la generación de cuadruplos para estatutos while, for, y if-else. También está ya implementada la generación de cuadruplos para la llamada de funciones. La máquina virtual ya se empezó y puede ya se puede usar. Las instrucciones para usarla estan en el archivo README. Se espera empezar con arreglos y matrices la siguiente semana.

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
