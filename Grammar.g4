grammar Grammar;

start: program end;
end: EOF;

program: 'program' ID ':' global_vars functions main;

global_vars: var_decl* ;

var_decl: 'var' type ID (',' ID)* ';';

type: basic_type type_dim_1? type_dim_2?;

basic_type: 'number' | 'boolean';

type_dim_1: '[' NUM_CTE ']';

type_dim_2: '[' NUM_CTE ']';

functions: function_decls*;

function_decls: 'function' fun_type ID '(' param_list? ')' ':' local_vars block;

fun_type: basic_type | 'void';

param_list: basic_type ID (',' basic_type ID)*;

local_vars: var_decl*;

block: '{' statement* '}' ;

statement: assignment | fun_call_stmt | if_else_stmt | return_stmt | while_stmt;

assignment: var_access '=' expression ';';

fun_call_stmt: fun_call ';';

return_stmt: 'return' expression ';';

while_stmt: 'while' '(' expression ')' block ';';

if_else_stmt: 'if' '(' expression ')' block else_block? ';';
else_block: 'else' block;

expression: conjunction expression_aux;
expression_aux: (conjuction_op conjunction)*;
conjuction_op: '&';

conjunction: relation conjunction_aux;
conjunction_aux: (relation_op relation)*;
relation_op: '|';

relation: addition relation_aux;
relation_aux: (addition_op addition)*;
addition_op: '==' | '!=' | '>' | '>=' | '<' | '<=' ;

addition: term addition_aux;
addition_aux: (term_op term)*;
term_op: '+' | '-';

term: factor factor_aux;
factor_aux: (factor_op factor)*;
factor_op: '*' | '/' | '%';

factor: paren_exp | atom;

paren_exp: '(' expression ')';
atom: var_access | fun_call | literal;

literal: NUM_CTE | 'true' | 'false';

fun_call: built_in | custom_fun_call;

built_in: print_fun | load_fun ;

print_fun: 'print' '(' (print_arg (',' print_arg)*)? ')';
print_arg: expression | STR_CTE;

load_fun: 'load' '(' STR_CTE ')';

custom_fun_call: ID '(' arg_list? ')';

arg_list: expression (',' expression)*;

var_access: ID dim_access_1? dim_access_2?;

dim_access_1: '[' expression ']';

dim_access_2: '[' expression ']';

main: 'main' block ;

// TOKENS

ID: [A-Za-z_][A-Za-z0-9_]*;

NUM_CTE: [0-9]+('.'[0-9]+([eE][-+]?[0-9]+)?)?;

STR_CTE: '"'(~["\\]|'\\'.)*?'"';

COMMENT: '#'~[\n]*'\n' -> skip;

WS: [ \t\r\n]+ -> skip;