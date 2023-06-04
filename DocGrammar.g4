grammar DocGrammar;

program: 'program' ID ':' var_decl* func_decl* 'main' ':' block;

var_decl: 'var' var_type ID (',' ID)* ';';

var_type: basic_type ('[' NUM_CTE ']')? ('[' NUM_CTE ']')?;

basic_type: 'number' | 'boolean';

func_decl: 'function' (basic_type | 'void') ID params ':' var_decl* block;

params: '(' (basic_type ID (',' basic_type ID)*)? ')';

block: '{' statement* '}';

statement: assignment_stmt | print_stmt | read_stmt | load_stmt | save_stmt | if_else_stmt | while_stmt | for_stmt | break_stmt | fun_call_stmt | return_stmt | resize_stmt | crop_stmt | rotate_stmt | flip_v_stmt | flip_h_stmt;

return_stmt: 'return' expression? ';';

break_stmt: 'break' ';';

print_stmt: 'print' '(' printable (',' printable)* ')' ';';
printable: expression | STR_CTE;

read_stmt: 'read' '(' var_access ')' ';';

load_stmt: 'load' '(' STR_CTE ')' ';' ;

save_stmt: 'save' '(' STR_CTE ')' ';';

resize_stmt: 'resize' '(' expression ',' expression ')' ';' ;

crop_stmt: 'crop' '(' expression ',' expression ',' expression ',' expression ')' ';' ;

rotate_stmt: 'rotate' '(' expression ')' ';';

flip_v_stmt: 'flipVertically' '(' ')' ;

flip_h_stmt: 'flipHorizontally' '(' ')' ;

var_access: non_dim_access | arr_access | mat_access;

non_dim_access: ID;

arr_access: ID '[' expression ']';

mat_access: ID '[' expression ']' '[' expression ']';

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

literal: NUM_CTE | 'false' | 'true' | 'PI';

fun_call: round_fun_call | trunc_fun_call | floor_fun_call | ceil_fun_call | is_integer_fun_call | pow_fun_call | sin_fun_call | cos_fun_call | tan_fun_call | asin_fun_call | acos_fun_call | atan_fun_call | height_fun_call | width_fun_call | custom_fun_call;

round_fun_call: 'round' '(' expression ')';

trunc_fun_call: 'trunc' '(' expression ')';

ceil_fun_call: 'ceil' '(' expression ')';

floor_fun_call: 'floor' '(' expression ')';

is_integer_fun_call: 'isInteger' '(' expression ')';

pow_fun_call: 'pow' '(' expression ',' expression ')';

sin_fun_call: 'sin' '(' expression ')';

cos_fun_call: 'cos' '(' expression ')';

tan_fun_call: 'tan' '(' expression ')';

asin_fun_call: 'asin' '(' expression ')';

acos_fun_call: 'acos' '(' expression ')';

atan_fun_call: 'atan' '(' expression ')';

height_fun_call: 'getHeight' '('')' ';';

width_fun_call: 'getWidth' '('')' ';';

custom_fun_call: ID '(' (expression (',' expression)*)? ')' ;

/* TOKENS */

ID: [A-Za-z_][A-Za-z0-9_]*;

NUM_CTE: [0-9]+('.'[0-9]+([eE][-+]?[0-9]+)?)?;

STR_CTE: '"'(~["\n\\]|'\\'~[\n])*'"';

COMMENT: '#'~[\n]*'\n' -> skip;

WS: [ \t\r\n]+ -> skip;

UNKNOWN: .;