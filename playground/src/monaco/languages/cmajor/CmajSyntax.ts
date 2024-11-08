export const CmajSyntax = {
	"keywords": [
		"if", "else", "while", "for", "loop",
		"break", "continue", "return",
		"const", "let", "var",
		"void",
		"int", "int32", "int64",
		"float", "float32", "float64",
		"complex", "complex32", "complex64",
		"bool", "true", "false",
		"string",
		"struct", "using", "external",
		"graph", "processor", "namespace",
		"node", "connection"
	],

	"endpointKeywords": [
		"input", "output"
	],

	"wrapClampKeywords": [
		"wrap", "clamp"
	],

	"brackets": [
		{ "open": "{", "close": "}", "token": "delimiter.curly" },
		{ "open": "[", "close": "]", "token": "delimiter.square" },
		{ "open": "(", "close": ")", "token": "delimiter.parenthesis" },
		{ "open": "<", "close": ">", "token": "delimiter.angle" }
	],

	"operators": [
		"!", "=", "??", "?", "||", "&&", "|", "^", "&", "==", "!=", "<=", ">=", "<<",
		"+", "-", "*", "/", "%", "!", "~", "++", "--", "+=",
		"-=", "*=", "/=", "%=", "&=", "|=", "^=", "<<=", ">>=", ">>", "=>", "::",
		"<-"
	],

	"symbols": "[\\!\\.:=><~&|+?\\-*\/%@#]+",

	"tokenizer": {
		"root": [
			["@?[a-zA-Z_]\\w*", {
				"cases": {
					"@wrapClampKeywords": { "token": "@rematch", "next": "@possibleWrapClampKeyword" },
					"@endpointKeywords": { "token": "keyword.$0", "next": "@endpointDefinition" },
					"@keywords": { "token": "keyword.$0", "next": "@qualified" },
					"@default": { "token": "identifier", "next": "@qualified" }
				}
			}],

			["->", "keyword.$0"],
			["<-", "keyword.$0"],
			{ "include": "@whitespace" },
			["[{}()\\[\\]]", "@brackets"],
			["@symbols", {
				"cases": {
					"@operators": "delimiter",
					"@default": ""
				}
			}],

			["\"", { "token": "string.quote", "next": "@string" }],

			["[0-9_]*.[0-9_]+([eE][-+]?\\d+)?[fFdD]?", "number.float"],
			["0[xX][0-9a-fA-F_]+", "number.hex"],
			["0[bB][01_]+", "number.hex"],
			["[0-9_]+[fF]", "number.float"],
			["[0-9_]+[lL]?", "number"],

			["[;,]", "delimiter"]
		],

		"endpointDefinition": [
			["event", "keyword.$0", ""],
			["stream", "keyword.$0", ""],
			["value", "keyword.$0", ""],
			[";", "", "@pop"],
			["{", "", "@endpointDefinition"],
			["\"", { "token": "string.quote", "next": "@string" }],
			["[a-zA-Z_][\\w]*", {
				"cases": {
					"@keywords": { "token": "keyword.$0" },
					"@default": "identifier"
				}
			}],
			["[{}()\\[\\]]", "@brackets"],
			[",", "delimiter"],
			["@symbols", {
				"cases": {
					"@operators": "delimiter",
					"@default": ""
				}
			}],
			["[0-9_]+[lL]?", "number"]
		],

		"possibleWrapClampKeyword": [
			["wrap[ ]*<", "@rematch", "@wrapClampKeyword"],
			["wrap", "", "@pop"],
			["clamp[ ]*<", "@rematch", "@wrapClampKeyword"],
			["clamp", "", "@pop"],
			["", "", "@pop"]
		],

		"wrapClampKeyword": [
			["wrap", "keyword.$0", "@pop"],
			["clamp", "keyword.$0", "@pop"]
		],

		"qualified": [
			["[a-zA-Z_][\\w]*", {
				"cases": {
					"@keywords": { "token": "keyword.$0" },
					"@default": "identifier"
				}
			}],
			["\\.", "delimiter"],
			["", "", "@pop"]
		],

		"comment": [
			["[^\/*]+", "comment"],
			["\\*/", "comment", "@pop"],
			["[\/*]", "comment"]
		],

		"string": [
			["[^\\\"]+", "string"],
			["\"", { "token": "string.quote", "next": "@pop" }]
		],

		"whitespace": [
			["[ \\t\\v\\f\\r\\n]+", ""],
			["\/\\*", "comment", "@comment"],
			["\/\/.*$", "comment"]
		]

	}
};
