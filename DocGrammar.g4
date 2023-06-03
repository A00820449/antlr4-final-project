grammar DocGrammar;

program: 'program' ID ':' vars functions 'main' ':' block;

vars: ('var' var_type ID (',' ID)* ';')*;

var_type: basic_type ('[' NUM_CTE ']')? ('[' NUM_CTE ']')?;

basic_type: 'number' | 'boolean';

functions: ('function' (basic_type | 'void') ID params)* ':' vars block;

params: '(' (basic_type ID (',' basic_type ID)*)? ')';

block: '{' statement* '}';

statement: assignment_stmt | print_stmt | read_stmt | if_else_stmt | while_stmt | for_stmt | fun_call_stmt;

print_stmt: 'print' '(' (expression | STR_CTE) (',' (expression | STR_CTE) )* ')' ';';

read_stmt: 'read' '(' var_access ')' ';';

var_access: ID ('[' expression ']')? ('[' expression ']')?;

if_else_stmt: 'if' '(' expression ')' block ('else' block)?;

while_stmt: 'while' '(' expression ')' block;

for_stmt: 'for' '(' assignment? ';' expression ';' assignment? ')' block;

fun_call_stmt: fun_call ';';

assignment_stmt: assignment ';';

assignment: var_access '=' expression;

expression: conjunction ('&' conjunction)*;

conjunction: relation ('|' relation)*;

relation: addition (('==' | '!=' | '>' | '>=' | '<' | '<=') addition)*;

addition: term (('+' | '-') term)*;

term: factor (('*' | '/' | '%') factor)*;

factor: ('!' | '-')? negation;

negation: paren_exp | atom;

paren_exp: '(' expression ')';
atom: var_access | fun_call | literal;

literal: NUM_CTE | 'false' | 'true';

fun_call: ID '(' (expression (',' expression)*)? ')' ;

/* TOKENS */

ID: [A-Za-z_][A-Za-z0-9_]*;

NUM_CTE: [0-9]+('.'[0-9]+([eE][-+]?[0-9]+)?)?;

STR_CTE: '"'(~["\n\\]|'\\'~[\n])*'"';

COMMENT: '#'~[\n]*'\n' -> skip;

WS: [ \t\r\n]+ -> skip;

UNKNOWN: .;