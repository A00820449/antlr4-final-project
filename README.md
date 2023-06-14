# Final project for Compiler Design
* Miguel Angel Tornero Carrillo A00820449  
* Github: <https://github.com/A00820449/antlr4-final-project>

## Image Manipulation Language (IML)
IML seeks to allow users to easily edit images using a simple, C-like syntax. The image operations that are currently supported are cropping, resizing, flipping vertically, flipping horizontally, and rotating.

## How To Use
Make sure you have the latest version of [NodeJS](https://nodejs.org/), [NPM](https://www.npmjs.com/) (included with NodeJS), and [ANTLRv4](https://www.antlr.org/) installed. You can install ANTLRv4 via [PyPI](https://pypi.org/):
```bash
pip install antlr4-tools # other installation methods exist
```
After cloning the repository, install the NPM dependencies and build the grammar files using these commands:
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
## Program syntax
An IML program follows the following syntax
```
program programName:

[global variables]

[functions]

main:
{
    [statements]
}
```
As one can see, it's a very simple syntax.  
The section indicated by `[global variables]` is where you declare the variables that will be used globally. You have to declare a variable here before you can use it in the main body. The section marked by `[functions]` indicates where you can declare your functions.
### Variables
A variable declaration follows the following syntax:
```
var <type> <id> [, <id>];
```
A variable can have a `number` type or a `boolean` type. It can also be an array, or a double array. Here's an example of a declaration of a number variable, followed by the declaration of an array of 5 booleans, followed by a double array of numbers of size 5x9:
```
var number a;
var boolean[5] b;
var number[5][9] c;
```
### Functions
A function declaration follows the following syntax:
```
function <type> functionName([parameters]):
[local variables]
{
    [statements]
}
```
A function can be of type `number`, `boolean`, or `void`. Parameters are declared in a comma separated list, in which you declare the type followed by the name of the Parameters. A local variable follows the same syntax as shown in the previous section. Here's an example of a function with the name `foo` that has a boolean parameter with name `a`, a number parameter of name `b`, has a local boolean variable with name `f`, and returns a boolean value:
```
function boolean foo(boolean a, number b):
var boolean f;
{
    return false;
}
```
## Statements
As previously said, IML has a very C-like syntax, so a lot of the statements will result familiar to experienced programmers. These statments include stuff like if-else statements, while-loops, for-loops, function calls, assignments, print statments, among others.
Here's an example of what an if statement would look like:
```
{
    if (foo < barr) {
        print("Hello!\n");
    }
    else {
        print("Howdy!\n");
    }
}
```   
Note: *THE PRINT STATEMENT DOES NOT PRINT A NEWLINE CHARACTER BY DEFAULT AND MUST BE EXPLICITLY TYPED USING THE `\n` ESCAPE SEQUENCE.*
This language comes with a lot of built-in functions to aid the programmer. Some of them include:
* `round(number)` Which rounds a decimal value to the nearest integer
* `trunc(number)` Which truncates a decimal value.
* `floor(number)` Which rounds a decimal value to the lowest integer
* `ceil(number)` Which rounds a decimal value to the highest integer
* `isInteger(number)` Which returns true if the number given is an integer.
* `rand()` Which returns a random number between 0 and 1.    
<!-- end of the list -->
For image manipulation, we provide the following functions:
* `load(fileName)` which loads a file into memory
* `resize(w, h)` Which resizes the image to a width `w` and a height `h`
* `crop(x, y, w, h)` Which crops the image starting from the coordinates `x` and `y` to a width `w` and a height `h`
* `rotate(deg)` Which rotates the image a `deg` amount of degrees
* `flipHorizontally()` Which flips the image horizontally
* `flipVertically()` Which flips the image vertically
* `getWidth()` Which returns the current width of the loaded image
* `getHeight()` Which returns the current height of the loaded image
* `save(fileName)` Which saves the modified image to disk. 
## Example program
Putting all these things together, here's an example of a simple program:
```
program square:
var number h, w, m, i;
var boolean b;

function number min(number a, number b):
var number output;
{
    if (a < b) {
        output = a;
    }
    else {
        output = b;
    }
    return output;
}

function boolean not(boolean b):
{
    if (b) {
        return false;
    }
    return true;
}

main:
{
    # this is a comment
    print("loading image...\n");
    load("test.png");
    w = getWidth();
    h = getHeight();

    m = min(w, h);

    # squaring image
    if (w != h) {
        print("cropping image...\n");
        crop(0,0,m,m);
    }
    else {
        print("image is already square\n");
    }

    save("output.png");

    # printing all even numbers from 1 to 100
    i = 1;
    b = false;
    while (i <= 100) {
        if (b) {
            print("even: ", i, "\n");
        }
        b = not(b);
        i = i + 1;
    }
}
```   
## Futher reading
For more information, as well as technical specifications for this language, a pdf document containing the technical documentation for this language has been included in the repository, under the name `DocumentaciónFinal-A00820449.pdf` (currently only available in Spanish).  
## Demo Video
<a href="http://www.youtube.com/watch?feature=player_embedded&v=uOECKFEKpi4" target="_blank"><img src="http://img.youtube.com/vi/uOECKFEKpi4/0.jpg" alt="Thumbnail for Demo Video on YouTube" width="240" height="180" border="5" /></a>  
Link: <https://www.youtube.com/watch?v=uOECKFEKpi4>