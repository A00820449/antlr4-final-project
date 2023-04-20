grammar Grammar;

start: program end;
end: EOF;

program: 'program' program_name ':' global_vars functions main;
program_name: ID;

global_vars: var_decl* ;

var_decl: 'var' var_type var_id (',' var_id)* ';';
var_id: ID;

var_type: var_basic_type var_type_dim_1? var_type_dim_2?;
var_basic_type: basic_type;

basic_type: 'number' | 'boolean';

var_type_dim_1: '[' var_type_dim_1_num ']';
var_type_dim_1_num: const_num;

var_type_dim_2: '[' var_type_dim_2_num ']';
var_type_dim_2_num: const_num;

const_num: '-'? NUM_CTE;

functions: function_decl*;

function_decl: 'function' fun_type fun_id '(' param_list? ')' params_done local_vars block;
fun_id: ID;
params_done: ':';

fun_type: basic_type | 'void';

param_list: param_type param_id (',' param_type param_id)*;
param_id: ID;
param_type: basic_type;

local_vars: var_decl*;

block: '{' statement* '}' ;

statement: assignment | fun_call_stmt | if_else_stmt | return_stmt | while_stmt;

assignment: var_access '=' expression ';';

fun_call_stmt: fun_call ';';

return_stmt: return_void | return_exp;

return_void: 'return' ';';
return_exp: 'return' expression ';';

while_stmt: 'while' '(' expression ')' block ';';

if_else_stmt: 'if' '(' expression ')' block else_block? ';';
else_block: 'else' block;

expression: conjunction (conjuction_op conjunction)*;
conjuction_op: '&';

conjunction: relation (relation_op relation)*;
relation_op: '|';

relation: addition (addition_op addition)*;
addition_op: '==' | '!=' | '>' | '>=' | '<' | '<=' ;

addition: term (term_op term)*;
term_op: '+' | '-';

term: factor (factor_op factor)*;
factor_op: '*' | '/' | '%';

factor: negation_op? negation;
negation_op: '!' | '-';

negation: paren_exp | atom;

paren_exp: '(' expression ')';
atom: var_access | fun_call | literal;

literal: literal_num | literal_bool;
literal_num: NUM_CTE;
literal_bool: 'true' | 'false';

fun_call: built_in | custom_fun_call;

built_in: print_fun | load_fun ;

print_fun: 'print' '(' (print_arg (',' print_arg)*)? ')';
print_arg: print_exp | print_str;
print_exp: expression;
print_str: STR_CTE;

load_fun: 'load' '(' STR_CTE ')';

custom_fun_call: ID '(' arg_list? ')';

arg_list: expression (',' expression)*;

var_access: non_dim_access | arr_access | mat_access;

non_dim_access: id_access ; 
arr_access: id_access dim_access_1;
mat_access: id_access dim_access_1 dim_access_2;

id_access: ID;

dim_access_1: '[' expression ']';

dim_access_2: '[' expression ']';

main: 'main' ':' block ;

// TOKENS

ID: [A-Za-z_][A-Za-z0-9_]*;

NUM_CTE: [0-9]+('.'[0-9]+([eE][-+]?[0-9]+)?)?;

STR_CTE: '"'(~["\n\\]|'\\'~[\n])*'"';

COMMENT: '#'~[\n]*'\n' -> skip;

WS: [ \t\r\n]+ -> skip;

UNKNOWN: .;