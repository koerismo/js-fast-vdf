# fast-vdf
Your average javascript KeyValues processing library, as fast as parsable!

# Installation
```
npm i fast-vdf
```

# Usage
```ts
import { parse as parseVdf, KeyV, DumpQuotationType } from 'fast-vdf';

const root = parseVdf(`
SteamAppId      620
SearchPaths
{
    Game        |gameinfo_path|.
    Game        portal2
}
`);

// 620
console.log(root.value('SteamAppId'));

// "portal2"
console.log(root.dir('SearchPaths').pair('Game').value);

// Strict behaviour is enabled by default with all KeyVSet methods.
// Since this pair does not exist, this call throws an error.

try { root.pair('DoesntExist'); }
catch(e) { console.warn(e.message) }
// Pair with key "doesntexist" does not exist in set!

// The default value can be set to null to
// disable this behaviour, instead returning null.

console.log(root.pair('DoesntExist', null));

// The `dir`, `pair`, and `any` methods can be used to search the element for a matching child.
// The `dirs`, `pairs`, and `all` methods work similarly, but return a filtered array of every match.

const searchpaths = root.dir('SearchPaths')
    .add(new KeyV('Game', 'portal2_dlc3'))
    .add(new KeyV('Game', 'platform'));

// Factory objects can also be used to quickly create keyvalue structures instead of `add`:

searchpaths.factory()
    .pair('Game', 'portal2_dlc1')
    .pair('Game', 'portal2_dlc2')
    .pair('Game', 'platform')
    .exit();

// After you've modified your structure, you can dump it as a formatted
// string with the dump function.

root.dump({
    quote: DumpQuotationType.Auto,
    escapes: false
});
```

## Importing

```ts
import parse from 'fast-vdf';           // parse()
import * as vdf from 'fast-vdf';        // vdf.parse(), vdf.KeyV, vdf.KeyVSet, ...
import { parse } from 'fast-vdf';       // parse(), json(), KeyV, KeyVSet, ...
```

# API

#### See the [changelog](./CHANGELOG.md) for a full list of API changes.

## Main Module

### **parse**(data: string, options?: SharedParseOptions): KeyVRoot
Parses data into a tree of `KeyV` objects.

> **Parameters**
>
> `data` The string to parse.
>
> `options` The parser configuration.

### **json**(data: string, options?: SharedParseOptions): Object
Parses data into a regular javascript object.

> **Parameters**
>
> `data` The string to parse.
>
> `options` The parser configuration.

### SharedParseOptions
```ts
interface SharedParseOptions {
    on_macro?:   (key: string, value: ValueType, context: T) => void; // undefined
    on_query?:   (query: string) => boolean;                          // undefined
    escapes?:    boolean; // true
    multilines?: boolean; // false
    types?:      boolean; // false
}
```

### DumpFormatOptions
```ts
interface DumpFormatOptions {
    escapes?: boolean;      // true
    indent?:  string;       // '\t'
    quote?:   0 | 1 | 2;    // DumpQuotationType.Always (0)
}
```

## Core Module

### **parse**(text: string, options: CoreParseOptions): void
The internal API used by the parse.xyz functions.

> **Parameters**
>
> `text` The string to parse.
>
> `options` The parser configuration.

```ts
interface CoreParseOptions {
    on_key:     (key: string, value: ValueType, query?: string) => void;
    on_enter:   (key: string) => void;
    on_exit:    () => void;
    escapes:    boolean;
    multilines: boolean;
    types:      boolean;
}
```
