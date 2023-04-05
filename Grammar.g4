grammar Grammar;

start: 'program' ID ':' global_vars functions main;

global_vars: var_decl* ;

var_decl: 'var' type ID (',' ID)* ';';

type: basic_type type_dim_1? type_dim_2?;

basic_type: 'number' | 'boolean';

type_dim_1: dim_decl ;

type_dim_2: dim_decl ;

dim_decl: '[' NUM_CTE ']';

functions: function_decls*;

function_decls: 'function' ID '(' param_list? ')' local_vars block;

param_list: basic_type ID (',' basic_type ID)*;

local_vars: var_decl*;

block: '{' statement* '}' ;

statement: expression ';' ;

expression: ;

main: 'main' block ;

// TOKENS

ID: [A-Za-z_][A-Za-z0-9_]+;

NUM_CTE: [0-9]+('.'[0-9]([eE][-+]?[0-9]+)?)?;