# fast-vdf
Your average javascript KeyValues processing library, as fast as parsable!

# Installation
```
npm i fast-vdf
```

# Usage
```ts
import { vdf, KeyV, KeyVSet } from 'fast-vdf';

const root = vdf.parse(`
SteamAppId      620
SearchPaths
{
    Game        |gameinfo_path|.
    Game        portal2_dlc2
}
`);

console.log(root.value('SteamAppId'));
// 620

console.log(root.dir('SearchPaths').pair('Game').value);
// "portal2_dlc2"

try { root.pair('DoesntExist'); }
catch(e) { console.warn(e.message) }
// Pair with key "doesntexist" does not exist in set!

// Strict behaviour is enabled by default with all KeyVSet methods.
// Since this pair does not exist, this call throws an error.

console.log(root.pair('DoesntExist', null));

// The default value can be set to null to
// disable this behaviour, instead returning null.


root.dir('SearchPaths').factory()
    .pair('Game', 'portal2_dlc1')
    .pair('Game', 'portal2')
    .pair('Game', 'platform')
    .exit();

// Factory objects can be used to quickly create keyvalue structures.
// The above code is equivalent to the below:

const sp = root.dir('SearchPaths');
sp.add(new KeyV('Game', 'portal2_dlc1'));
sp.add(new KeyV('Game', 'portal2'));
sp.add(new KeyV('Game', 'platform'));


// After you've created your structure, you can dump it as a formatted
// string with the dump function.

root.dump({
    quote: 'auto',
    escapes: false
});
```


# API

## Breaking Changes

### 3.0.0
- The parser has been modified to better match Valve's parser(s), which allow any chars to begin an unquoted string.
- The parser now correctly evaluates escaped escapes before quote endings.
- The `quote` option has been changed to use an enum (`DumpQuotationType`)
- When parsing strings with escape sequences, the parsed string will now include the evaluated escape sequences rather than just the raw string.
- Dumping has been updated to escapes strings consistently with the library's parsing.

### 2.0.0
- The `types` and `multiline` options now default to false.
- The `auto` quoting mode has been split into `auto` and `auto-typed`.
	- `auto` behaves normally, quoting only values which strictly need to be quoted.
	- `auto-typed` allows fast-vdf to quote string values that might be confused with non-string values. (ex. `"true"`, `"123"`)
- The KeyVRoot/KeyVSet `.value(...)` method has been reworked to be less strict.
- Methods for reading type-strict values have been added to KeyV. (`.int(...)`, `.float(...)`, `.string()`, `.bool()`, `.vector(...)`)

## Imports

```ts
import parse from 'fast-vdf';           // parse()
import { vdf } from 'fast-vdf';         // vdf.parse(), vdf.json(), KeyV, KeyVSet, ...
import { parse } from 'fast-vdf';       // parse(), json(), KeyV, KeyVSet, ...
```

## Functions
### vdf.**parse**(data: string, options?: SharedParseOptions): KeyVRoot
Parses data into a tree of `KeyV` objects.

> **Parameters**
>
> `data` The string to parse.
>
> `options` The parser configuration.

### vdf.**json**(data: string, env: Record<string, boolean>, options?: SharedParseOptions): Object
Parses data into a regular javascript object.

> **Parameters**
>
> `data` The string to parse.
>
> `env` An object containing condition values. (Ex. `{ "$XBOX": false }` will cause keys with the condition `[$XBOX]` to be ignored.)
>
> `options` The parser configuration.

### core.**parse**(text: string, options: ParseOptions): void
The internal API used by the parse.xyz functions.

> **Parameters**
>
> `text` The string to parse.
>
> `options` The parser configuration.

## Types

### SharedParseOptions
```ts
interface SharedParseOptions {
    escapes?:    boolean; // true
    multilines?: boolean; // false
    types?:      boolean; // false
}
```

### DumpFormatOptions
```ts
interface DumpFormatOptions {
    indent?:  string;       // '\t'
    quote?:   0 | 1 | 2;    // DumpQuotationType.Always
    escapes?: boolean;      // true
}
```

### ParseOptions
```ts
interface ParseOptions {
    on_key:     (key: string, value: string, query?: string) => void;
    on_enter:   (key: string) => void;
    on_exit:    () => void;
    escapes:    boolean;
    multilines: boolean;
    types:      boolean;
}
```
